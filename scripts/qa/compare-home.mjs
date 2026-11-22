// Side-by-side evidence of the home against a built reference (the F1 master port).
// node scripts/qa/compare-home.mjs --baseline ../F1 --task V2
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { options, qaRequire, viewports, withBrowser } from './browser.mjs';
import { startServer } from './serve.mjs';

const { values, langs, out } = await options({ baseline: { type: 'string' } });
if (!values.baseline) throw Error('Provide --baseline PATH to a checkout with a built _site');
const sharp = qaRequire('sharp');
const regions = { masthead: 'header', hero: '.hero', headline: '.hero-lead h1', identity: '.identity', about: 'details.about', work: 'details.work', footer: 'footer' };

async function capture(browser, origin, lang, viewport, open) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce', locale: lang, serviceWorkers: 'block' });
  try {
    // The live Nexus snapshot is replaced by the committed one so both sides show the same figures.
    await page.route('https://raw.githubusercontent.com/**', route => route.abort());
    await page.goto(origin + '/?lang=' + lang, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    if (open) await page.evaluate(() => document.querySelectorAll('details.about, details.work').forEach(d => { d.open = true; }));
    await page.evaluate(async () => {
      for (const image of document.images) image.loading = 'eager';
      await Promise.all([...document.images].filter(i => i.getClientRects().length).map(i => i.decode().catch(() => {})));
      await new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done)));
    });
    const boxes = await page.evaluate(regions => Object.fromEntries(Object.entries(regions).map(([key, selector]) => {
      const box = document.querySelector(selector)?.getBoundingClientRect();
      return [key, box && { y: Math.round(box.y * 100) / 100, height: Math.round(box.height * 100) / 100 }];
    })), regions);
    return { png: await page.screenshot({ fullPage: true }), boxes };
  } finally { await page.close(); }
}

async function sideBySide(left, right, file) {
  const [a, b] = await Promise.all([sharp(left).metadata(), sharp(right).metadata()]);
  const gap = 24, height = Math.max(a.height, b.height);
  await sharp({ create: { width: a.width + b.width + gap, height, channels: 3, background: '#ff00ff' } })
    .composite([{ input: left, left: 0, top: 0 }, { input: right, left: a.width + gap, top: 0 }])
    .webp({ quality: 82, effort: 5 }).toFile(file);
}

async function changedRows(left, right) {
  const [a, b] = await Promise.all([left, right].map(input => sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true })));
  const width = Math.min(a.info.width, b.info.width), height = Math.min(a.info.height, b.info.height);
  const rows = [];
  for (let y = 0; y < height; y++) {
    let changed = 0;
    for (let x = 0; x < width; x++) {
      const i = (y * a.info.width + x) * 3, j = (y * b.info.width + x) * 3;
      if (Math.max(Math.abs(a.data[i] - b.data[j]), Math.abs(a.data[i + 1] - b.data[j + 1]), Math.abs(a.data[i + 2] - b.data[j + 2])) > 16) changed++;
    }
    if (changed) rows.push([y, changed]);
  }
  // Collapse consecutive changed rows into bands for the report.
  const bands = [];
  for (const [y, changed] of rows) {
    const last = bands.at(-1);
    if (last && y === last.to + 1) { last.to = y; last.pixels += changed; } else bands.push({ from: y, to: y, pixels: changed });
  }
  return { size: [[a.info.width, a.info.height], [b.info.width, b.info.height]], bands };
}

const reference = await startServer({ root: join(values.baseline, '_site') });
const report = [];
try {
  await withBrowser(async (browser, origin) => {
    for (const lang of langs) for (const viewport of viewports) for (const open of [false, true]) {
      const [before, after] = [await capture(browser, reference.origin, lang, viewport, open), await capture(browser, origin, lang, viewport, open)];
      const name = `home-vs-F1-${lang}-${viewport.width}-${open ? 'open' : 'closed'}.webp`;
      await sideBySide(before.png, after.png, join(out, name));
      const shifts = Object.fromEntries(Object.keys(regions).map(key => [key, before.boxes[key] && after.boxes[key]
        ? { y: +(after.boxes[key].y - before.boxes[key].y).toFixed(2), height: +(after.boxes[key].height - before.boxes[key].height).toFixed(2) } : null]));
      report.push({ lang, width: viewport.width, state: open ? 'disclosures open' : 'as loaded', file: name,
        reference: before.boxes, current: after.boxes, shifts, pixels: await changedRows(before.png, after.png) });
      console.log(name, JSON.stringify(shifts));
    }
  });
} finally { await reference.close(); }
await writeFile(join(out, 'home-vs-F1.json'), JSON.stringify(report, null, 2) + '\n');
