import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { formatStats } from '../nexus-downloads.mjs';
import { snapshotUrl } from '../budgets.mjs';
import { visit, withBrowser } from './browser.mjs';
import { isolateNetwork } from './network.mjs';

export async function runReflow(pages, langs) {
  const results = [];
  await withBrowser(async (browser, origin) => {
    for (const route of pages) for (const lang of langs) for (const [width, height, scale] of [[320, 844, 1], [720, 450, 2]]) {
      // At 200% a 1440×900 window has a 720×450 CSS viewport and a doubled pixel ratio.
      const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: scale, reducedMotion: 'reduce' });
      try {
        const verify = await isolateNetwork(page.context(), origin);
        await visit(page, origin, route, lang);
        await page.keyboard.press('Tab');
        assert.ok(await page.locator('.skip').evaluate(el => el === document.activeElement && getComputedStyle(el).outlineStyle !== 'none'));
        await page.keyboard.press('Enter');
        assert.equal(await page.locator(':focus').getAttribute('id'), 'main');
        for (const tab of await page.getByRole('tab').all()) {
          await tab.click();
          assert.equal(await tab.getAttribute('aria-selected'), 'true');
          const problems = await page.evaluate(() => {
            const small = [...document.querySelectorAll('a[href],button,summary,select')].filter(el => {
              const { width, height } = el.getBoundingClientRect();
              return height > 0 && (width < 44 || height < 44);
            }).map(el => el.textContent.trim().slice(0, 30));
            return { small, overflow: document.documentElement.scrollWidth > innerWidth,
              running: document.getAnimations().filter(a => a.playState === 'running').length };
          });
          assert.deepEqual(problems, { small: [], overflow: false, running: 0 }, route + ' ' + lang + ' ' + width + ' ' + JSON.stringify(problems));
        }
        verify();
        results.push({ route, lang, width, height, deviceScaleFactor: scale, skip: 'focused main', targets: '44×44', reducedMotion: 'no running animations', result: 'pass' });
      } finally { await page.close(); }
    }
  });
  return results;
}

export async function runOffline(langs) {
  const snapshot = JSON.parse(await readFile(new URL('../../data/nexus-downloads.json', import.meta.url)));
  const results = [];
  await withBrowser(async (browser, origin) => {
    for (const offline of [true, false]) for (const lang of langs) {
      const context = await browser.newContext({ offline, locale: lang, serviceWorkers: 'block' });
      const errors = [], consoleErrors = [];
      let snapshotAttempts = 0;
      try {
        // Supply the local document/assets like cached responses even when Chromium is offline.
        await context.route('**/*', async route => {
          const url = route.request().url();
          if (url === snapshotUrl) { snapshotAttempts++; return route.abort('internetdisconnected'); }
          assert.equal(new URL(url).origin, origin);
          return route.fulfill({ response: await context.request.get(url) });
        });
        const page = await context.newPage();
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
        await visit(page, origin, '/', lang);
        for (const language of [lang, lang === 'en' ? 'it' : 'en']) {
          await page.locator('[data-lang="' + language + '"]').click();
          assert.equal(await page.locator('[data-i18n="moddingNumber"]').first().textContent(), formatStats(snapshot.uniqueModDownloads, language).counter);
        }
        assert.deepEqual(errors, []);
        if (offline) assert.deepEqual(consoleErrors, []);
        assert.equal(snapshotAttempts, offline ? 0 : 1);
        results.push({ route: '/', lang, offline, snapshotAttempts, uncaughtErrors: errors, fallback: 'localized committed snapshot', result: 'pass' });
      } finally { await context.close(); }
    }
  });
  return results;
}
