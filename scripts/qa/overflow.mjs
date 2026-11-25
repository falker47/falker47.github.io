// No horizontal overflow on every route and home state at 360, 390, 768, 1024 and 1440 px,
// in both languages, with reduced motion; the phone menu is checked open as well.
// Usage: node scripts/qa/overflow.mjs --task V4
import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { routes } from '../../src/routes.mjs';
import { homeStates, options, visitReviewState, withBrowser } from './browser.mjs';
import { isolateNetwork } from './network.mjs';

const { out, langs } = await options();
const widths = [360, 390, 768, 1024, 1440];
const pages = [...routes.map(route => route.path), ...homeStates];
const rows = [];
await withBrowser(async (browser, origin) => {
  for (const width of widths) for (const lang of langs) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', locale: lang, serviceWorkers: 'block' });
    try {
      await isolateNetwork(context, origin);
      const page = await context.newPage();
      for (const path of pages) {
        await page.goto('about:blank');
        await visitReviewState(page, origin, path, lang);
        if (path === '/#certificazioni') await page.keyboard.press('Escape');
        const measure = () => page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        const row = { path, lang, width, overflow: await measure() };
        if (width < 700 && await page.locator('.menu-button').isVisible()) {
          await page.locator('.menu-button').click();
          row.menuOverflow = await measure();
          await page.keyboard.press('Escape');
        }
        rows.push(row);
      }
    } finally { await context.close(); }
  }
});
await writeFile(join(out, 'overflow.json'), JSON.stringify(rows, null, 2) + '\n');
const failures = rows.filter(row => row.overflow > 0 || row.menuOverflow > 0);
console.log(rows.length + ' layouts at ' + widths.join(', ') + ' px, ' + failures.length + ' with horizontal overflow.');
assert.deepEqual(failures, []);
