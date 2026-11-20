import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { options, qaRequire, viewports, visit, withBrowser } from './browser.mjs';
import { isolateNetwork } from './network.mjs';
import { startServer } from './serve.mjs';

const { values, langs, out } = await options({ baseline: { type: 'string' } });
if (!values.baseline) throw Error('Provide --baseline PATH to the built F1 checkout');
const sharp = qaRequire('sharp');
const areas = { headline: '.hero-lead h1', cta: '.hero-lead .cta', diagram: '.engine-figure', identity: '.identity', portrait: '.portrait' };

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
      const [f1,f2] = renders;
      const stem = `home-${lang}-${viewport.width}`;
      const name = stem + '-full.png';
      const areasCompared = {};
      assert.equal(f1.lines, f2.lines, name + ': headline wraps');
      for (const key of Object.keys(areas)) {
        const box = f1.boxes[key], next = f2.boxes[key];
        const maxBoxDelta = Math.max(...Object.keys(box).map(k => Math.abs(box[k] - next[k])));
        assert.ok(maxBoxDelta <= .25, name + ' ' + key + ': moved by ' + maxBoxDelta + 'px');
        const visibleBox = { ...box, height: Math.min(box.height, viewport.height - box.y) };
        const [visible, full, isolated] = await Promise.all([
          difference(join(values.baseline, '_review/F1', stem + '.png'), join(out, stem + '.png'), visibleBox),
          difference(join(values.baseline, '_review/F1', name), join(out, name), box),
          difference(f1.inkless, f2.inkless, box),
        ]);
        // Report a non-text regression only at coordinates that also differ in
        // the delivered PNGs. The separate diagnostic paint can rasterize a
        // curved border slightly differently even when the real captures agree.
        const nonText = isolated.map((delta, i) => full[i] > 2 || visible[i] > 2 ? delta : 0);
        areasCompared[key] = { box, maxBoxDelta, viewportCapture: stats(visible), fullCapture: stats(full),
          withoutTextAndGrid: stats(isolated), confirmedNonText: stats(nonText) };
      }
      results.push({ lang, width: viewport.width, headlineLines: f1.lines, areas: areasCompared });
      console.log(lang, viewport.width, Object.fromEntries(Object.entries(areasCompared).map(([k,v]) => [k, v.confirmedNonText.pixelsOver2])));
    }
  });
} finally { await baseline.close(); }
await writeFile(join(out, 'hero-comparison.json'), JSON.stringify(results, null, 2) + '\n');
if (results.some(r => Object.values(r.areas).some(a => a.confirmedNonText.pixelsOver2))) {
  throw Error('Non-text hero differences remain; inspect hero-comparison.json');
}
