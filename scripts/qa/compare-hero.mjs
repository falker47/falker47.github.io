import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { options, qaRequire, viewports, visit, withBrowser } from './browser.mjs';
import { isolateNetwork } from './network.mjs';
import { startServer } from './serve.mjs';

const { values, langs, out } = await options({
  baseline: { type: 'string' }, 'baseline-task': { type: 'string', default: 'F1' },
  format: { type: 'string', default: 'png' }, 'baseline-format': { type: 'string', default: 'png' },
  exact: { type: 'boolean', default: false }, 'exact-hero': { type: 'boolean', default: false }, 'exact-geometry': { type: 'boolean', default: false },
});
if (!values.baseline) throw Error('Provide --baseline PATH to the built reference checkout');
if (!/^[a-z0-9][a-z0-9_-]*$/i.test(values['baseline-task'])) throw Error('Invalid baseline task');
if (![values.format, values['baseline-format']].every(format => ['png', 'webp'].includes(format))) throw Error('Use --format png or webp');
const reference = join(values.baseline, '_review', values['baseline-task']);
const sharp = qaRequire('sharp');
const areas = { ...(values['exact-hero'] || values['exact-geometry'] ? { hero: '.hero' } : {}), headline: '.hero-lead h1', cta: '.hero-lead .cta', diagram: '.engine-figure', identity: '.identity', portrait: '.portrait' };

async function measure(page) {
  return page.evaluate(areas => {
    const boxes = {};
    for (const [key, selector] of Object.entries(areas)) {
      const { x,y,width,height } = document.querySelector(selector).getBoundingClientRect();
      boxes[key] = { x,y,width,height };
    }
    // Count actual line boxes, coalescing the small baseline differences of italic glyphs.
    const walker = document.createTreeWalker(document.querySelector('.hero-lead h1'), NodeFilter.SHOW_TEXT);
    const centers = [];
    while (walker.nextNode()) {
      const range = document.createRange();
      range.selectNodeContents(walker.currentNode);
      for (const rect of range.getClientRects()) {
        const center = rect.y + rect.height / 2;
        if (rect.width && !centers.some(y => Math.abs(center - y) < 8)) centers.push(center);
      }
    }
    return { boxes, lines: centers.length };
  }, areas);
}

async function difference(a, b, rect) {
  const region = { left: Math.floor(rect.x), top: Math.floor(rect.y), width: Math.floor(rect.width), height: Math.floor(rect.height) };
  const [first, second] = await Promise.all([a,b].map(input => sharp(input).extract(region).removeAlpha().raw().toBuffer()));
  const deltas = new Uint8Array(first.length / 3);
  for (let i = 0; i < first.length; i += 3) {
    deltas[i / 3] = Math.max(Math.abs(first[i] - second[i]), Math.abs(first[i+1] - second[i+1]), Math.abs(first[i+2] - second[i+2]));
  }
  return deltas;
}

async function compareCapture(before, after) {
  const decode = path => sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const [a, b] = await Promise.all([decode(before), decode(after)]);
  assert.equal(a.info.width, b.info.width, before + ' width');
  assert.equal(a.info.height, b.info.height, before + ' height');
  let differentPixels = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    if (a.data.readUInt32LE(i) !== b.data.readUInt32LE(i)) differentPixels++;
  }
  return { width: a.info.width, height: a.info.height, differentPixels };
}

function stats(deltas) {
  let pixelsOver2 = 0, maxChannelDelta = 0;
  for (const delta of deltas) {
    if (delta > 2) pixelsOver2++;
    maxChannelDelta = Math.max(maxChannelDelta, delta);
  }
  return { pixelsOver2, maxChannelDelta };
}

const baseline = await startServer({ root: join(values.baseline, '_site') });
const results = [];
try {
  await withBrowser(async (browser, origin) => {
    for (const lang of langs) for (const viewport of viewports) {
      const renders = [];
      for (const site of [baseline.origin, origin]) {
        const page = await browser.newPage({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce', locale: lang, serviceWorkers: 'block' });
        try {
          const verify = await isolateNetwork(page.context(), site);
          await visit(page, site, '/', lang);
          const measured = await measure(page);
          // Isolate the actual photograph, vector strokes, CTA and card surfaces.
          // The shared 32px grid and the new glyphs are independent design changes.
          await page.addStyleTag({ content: 'body {background-image:none!important; min-height:4096px!important} .hero, .hero * {-webkit-text-fill-color:transparent!important} .engine text {visibility:hidden!important}' });
          await page.evaluate(async () => {
            await Promise.all(Array.from(document.querySelectorAll('.hero img'), img => img.decode()));
            await new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)));
          });
          renders.push({ ...measured, inkless: await page.screenshot({ fullPage: true }) });
          verify();
        } finally { await page.close(); }
      }
      const [before, after] = renders;
      const stem = `home-${lang}-${viewport.width}`;
      const baselineShot = stem + '.' + values['baseline-format'];
      const name = stem + '-full.' + values['baseline-format'];
      const viewportPath = join(out, stem + '.' + values.format);
      const fullPath = join(out, stem + '-full.' + values.format);
      const areasCompared = {};
      const captures = values.exact ? {
        viewport: await compareCapture(join(reference, baselineShot), viewportPath),
        full: await compareCapture(join(reference, name), fullPath),
      } : undefined;
      assert.equal(before.lines, after.lines, name + ': headline wraps');
      for (const key of Object.keys(areas)) {
        const box = before.boxes[key], next = after.boxes[key];
        const maxBoxDelta = Math.max(...Object.keys(box).map(k => Math.abs(box[k] - next[k])));
        if (values['exact-geometry']) assert.equal(maxBoxDelta, 0, name + ' ' + key + ': geometry changed');
        assert.ok(maxBoxDelta <= .25, name + ' ' + key + ': moved by ' + maxBoxDelta + 'px');
        const visibleBox = { ...box, height: Math.min(box.height, viewport.height - box.y) };
        const [visible, full, isolated] = await Promise.all([
          difference(join(reference, baselineShot), viewportPath, visibleBox),
          difference(join(reference, name), fullPath, box),
          difference(before.inkless, after.inkless, box),
        ]);
        // Report a non-text regression only at coordinates that also differ in
        // the delivered PNGs. The separate diagnostic paint can rasterize a
        // curved border slightly differently even when the real captures agree.
        if (values['exact-hero']) {
          assert.equal(maxBoxDelta, 0, name + ' ' + key + ': geometry changed');
          assert.ok(!full.some(delta => delta !== 0) && !visible.some(delta => delta !== 0), name + ' ' + key + ': pixels changed');
        }
        const nonText = isolated.map((delta, i) => full[i] > 2 || visible[i] > 2 ? delta : 0);
        areasCompared[key] = { box, maxBoxDelta, viewportCapture: stats(visible), fullCapture: stats(full),
          withoutTextAndGrid: stats(isolated), confirmedNonText: stats(nonText) };
      }
      results.push({ lang, width: viewport.width, headlineLines: before.lines, captures, areas: areasCompared });
      console.log(lang, viewport.width, Object.fromEntries(Object.entries(areasCompared).map(([k,v]) => [k, v.confirmedNonText.pixelsOver2])));
    }
  });
} finally { await baseline.close(); }
await writeFile(join(out, 'hero-comparison.json'), JSON.stringify(results, null, 2) + '\n');
if (results.some(r => Object.values(r.areas).some(a => a.confirmedNonText.pixelsOver2))) {
  throw Error('Non-text hero differences remain; inspect hero-comparison.json');
}

if (values['exact-geometry']) console.log('All four hero comparisons: 0 px shifts in all six regions.');
if (values['exact-hero']) console.log('All four hero comparisons: 0 px shifts, 0 changed pixels in viewport and full-page hero crops.');
if (values.exact) {
  for (const row of results) {
    for (const shot of Object.values(row.captures)) assert.equal(shot.differentPixels, 0, 'Home screenshot pixels changed');
    for (const area of Object.values(row.areas)) assert.equal(area.maxBoxDelta, 0, 'Hero geometry changed');
  }
  console.log('All viewport and full-page captures match exactly; every hero box moved 0 px.');
}
