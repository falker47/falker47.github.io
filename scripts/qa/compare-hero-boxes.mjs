// Compare the boxes of the home hero with another built checkout (V3 used V2).
// The title, the CTA, the identity card and the diagram must keep their position and size.
// Usage: node scripts/qa/compare-hero-boxes.mjs --baseline <built checkout> --task <ID>
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { options, qaRequire, chromePath } from './browser.mjs';
import { startServer } from './serve.mjs';

const { out, values } = await options({ baseline: { type: 'string' } });
if (!values.baseline) throw Error('Provide --baseline PATH (a checkout with a built _site)');

// Boxes that must not move, and boxes whose text changed on purpose (weight, size, case).
const fixed = ['.hero-lead h1', '.hero-lead .cta', '.identity', '.identity-core', '.person', '.portrait', '.person-handle',
  '.identity-intro', '.contacts', '.engine-art', '#chi-sono > summary', 'details.work > summary'];
const restyled = ['.person-name', '.person-role'];
const sizes = [[1440, 900], [390, 844], [1280, 720], [768, 1024], [1920, 1080], [360, 740], [1000, 620]];

async function measure(root) {
  const server = await startServer(root ? { root } : undefined);
  const browser = await qaRequire('playwright').chromium.launch({ executablePath: await chromePath(), headless: true });
  const rows = {};
  try {
    for (const [width, height] of sizes) for (const lang of ['it', 'en']) {
      const page = await browser.newPage({ viewport: { width, height }, locale: lang, reducedMotion: 'reduce', deviceScaleFactor: 1, serviceWorkers: 'block' });
      await page.route(/^https?:\/\//, route => new URL(route.request().url()).origin === server.origin ? route.continue() : route.abort());
      await page.goto(server.origin + '/?lang=' + lang, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      rows[width + '×' + height + ' ' + lang] = await page.evaluate(list => Object.fromEntries(list.map(selector => {
        const node = [...document.querySelectorAll(selector)].find(el => el.getClientRects().length);
        if (!node) return [selector, null];
        const box = node.getBoundingClientRect();
        return [selector, [box.x, box.y, box.width, box.height].map(value => Math.round(value * 100) / 100)];
      })), [...fixed, ...restyled]);
      await page.close();
    }
  } finally { await browser.close(); await server.close(); }
  return rows;
}

const before = await measure(join(resolve(values.baseline), '_site'));
const after = await measure();
const report = { baseline: resolve(values.baseline), viewports: Object.keys(before).length, fixed, restyled, moved: [], restyledBoxes: [] };
for (const key of Object.keys(before)) {
  for (const selector of fixed) {
    if (JSON.stringify(before[key][selector]) !== JSON.stringify(after[key][selector])) report.moved.push({ view: key, selector, before: before[key][selector], after: after[key][selector] });
  }
  for (const selector of restyled) {
    const [a, b] = [before[key][selector], after[key][selector]];
    // Restyled text keeps its origin and its line box; only its width may change.
    if (a[0] !== b[0] || a[1] !== b[1] || a[3] !== b[3]) report.moved.push({ view: key, selector, before: a, after: b });
    else if (a[2] !== b[2]) report.restyledBoxes.push({ view: key, selector, widthBefore: a[2], widthAfter: b[2] });
  }
}
await writeFile(join(out, 'hero-boxes.json'), JSON.stringify(report, null, 2) + '\n');
console.log(report.viewports + ' views × ' + (fixed.length + restyled.length) + ' boxes: ' + report.moved.length + ' moved, ' + report.restyledBoxes.length + ' restyled text widths.');
assert.deepEqual(report.moved, [], 'Hero boxes moved');
