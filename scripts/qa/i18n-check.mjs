import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import redirectMap from '../../data/redirects.json' with { type: 'json' };
import { routes } from '../../src/routes.mjs';
import { styleguide } from '../../src/styleguide/page.mjs';
import { layout } from '../../src/partials/layout.mjs';
import { translatedText } from '../../src/lib/html.mjs';
import { fileStat, siteRoot } from './serve.mjs';
import { options, viewports, visit, withBrowser } from './browser.mjs';
import { isolateNetwork } from './network.mjs';
import { readTranslations, foreignPhrases, findForeignText } from './i18n-data.mjs';

let copy, phrases;
const report = { pages: [], bindings: null };
const { out } = await options({ task: { type: 'string', default: 'R1' } });

async function scan(page, route, lang, row) {
  const main = page.locator('main');
  assert.ok(await main.isVisible(), route.path + ': main is hidden');
  const seen = new Set();
  async function readState(name) {
    const text = await main.innerText();
    assert.ok(text.trim(), route.path + ': empty main');
    const hits = findForeignText(text, phrases[lang]);
    for (const hit of hits) {
      if (!seen.has(hit.path)) row.leaks.push({ state: name, ...hit });
      seen.add(hit.path);
    }
    row.states.push(name);
  }
  await readState('initial');
  const details = main.locator('details:not([open])');
  if (await details.count()) {
    await details.evaluateAll(nodes => nodes.forEach(node => { node.open = true; }));
    await readState('disclosures open');
  }
  for (const tab of await main.getByRole('tab').all()) {
    await tab.click();
    await readState('tab ' + (await tab.innerText()).trim());
  }
  const title = copy[lang][route.titleKey ?? 'title.' + route.path];
  assert.equal(await page.title(), title);
  assert.equal(await page.locator('meta[property="og:title"]').getAttribute('content'), title);
  for (const selector of ['meta[name="description"]', 'meta[property="og:description"]']) {
    assert.equal(await page.locator(selector).getAttribute('content'), copy[lang][route.descriptionKey]);
  }
  assert.equal(await page.locator('html').getAttribute('data-lang'), lang);
}

// Exercise new bindings through the public renderer without adding a fixture route to the site.
async function checkBindings(browser, origin) {
  const context = await browser.newContext({ locale: 'it-IT', timezoneId: 'America/Los_Angeles', serviceWorkers: 'block' });
  try {
    const verifyNetwork = await isolateNetwork(context, origin);
    const path = '/qa-i18n-fixture/';
    const route = { ...styleguide, path, titleKey: 'title./styleguide/', styles: [], qaScript: undefined,
      render: () => '<main><h1 data-i18n="guideTitle"></h1><img data-i18n-alt="diagramTitle" alt="">' +
        [0, 1, 2, 12345, 1000000].map(n => '<span data-i18n-plural="project" data-count="' + n + '"></span>').join('') +
        '<span data-i18n-number="12345.6"></span><time datetime="2023-01"></time><time datetime="2024-02-29"></time>' +
        '<a id="internal" href="/">Home</a></main>' };
    const body = await layout({ route, copy, t: key => translatedText(copy.it[key]), desktopSizing: '', styles: '', favicon: '/assets/images/favicon-32.webp' },
      async paths => (await Promise.all(paths.map(path => readFile(join(siteRoot, path), 'utf8')))).join('\n;\n'));
    await context.route(origin + path + '*', request => request.fulfill({ contentType: 'text/html', body }));
    const page = await context.newPage();
    await page.addInitScript(() => {
      document.addEventListener('portfolio:languagechange', () => {
        document.documentElement.dataset.eventAlt = document.querySelector('[data-i18n-alt]')?.alt ?? '';
      });
    });
    await page.goto(origin + path + '?lang=en&keep=1#sample');
    const controls = new Set();
    for (const lang of ['en', 'it', 'en']) {
      const button = page.locator('.language-switch button[data-lang="' + lang + '"]');
      await button.click();
      await page.waitForFunction(expected => document.documentElement.dataset.eventAlt === expected, copy[lang].diagramTitle);
      assert.equal(await button.getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('.language-switch').getAttribute('aria-label'), copy[lang].language);
      assert.equal(await page.locator('[data-i18n-number]').innerText(), new Intl.NumberFormat(lang).format(12345.6));
      const number = new Intl.NumberFormat(lang);
      const expected = [0, 1, 2, 12345, 1000000].map(count =>
        copy[lang][count === 1 ? 'projectOne' : 'projectOther'].replace('{count}', number.format(count)));
      assert.deepEqual(await page.locator('[data-i18n-plural]').allTextContents(), expected);
      assert.deepEqual(await page.locator('time').allTextContents(), lang === 'it'
        ? ['gennaio 2023', '29 febbraio 2024'] : ['January 2023', 'February 29, 2024']);
      if (!controls.has(lang)) {
        const other = lang === 'it' ? 'en' : 'it';
        const probe = await page.locator('main').evaluateHandle((main, foreign) => {
          const p = document.createElement('p');
          p.textContent = foreign;
          main.append(p);
          return p;
        }, copy[other].aboutWork);
        const row = { states: [], leaks: [] };
        await scan(page, route, lang, row);
        assert.ok(row.leaks.some(hit => hit.path === 'i18n.aboutWork'), 'Visible leak missed in ' + lang);
        await probe.evaluate(p => { p.hidden = true; });
        const hidden = { states: [], leaks: [] };
        await scan(page, route, lang, hidden);
        assert.deepEqual(hidden.leaks, []);
        await probe.evaluate(p => p.remove());
        await probe.dispose();
        controls.add(lang);
      }
      const url = new URL(page.url());
      assert.equal(url.searchParams.get('lang'), lang);
      assert.equal(url.searchParams.get('keep'), '1');
      assert.equal(url.hash, '#sample');
      assert.equal(await page.evaluate(() => localStorage.getItem('nexus-language')), lang);
    }
    await page.locator('#internal').click();
    await page.waitForFunction(() => document.documentElement.dataset.lang === 'en' &&
      document.querySelector('.language-switch button[data-lang="en"]')?.getAttribute('aria-pressed') === 'true');
    assert.equal(new URL(page.url()).pathname, '/');
    verifyNetwork();
  } finally { await context.close(); }
}

try {
  const { it, en, pairs } = await readTranslations();
  copy = { it, en };
  phrases = { it: foreignPhrases(pairs, 'it'), en: foreignPhrases(pairs, 'en') };
  const stubs = new Set(redirectMap.redirects.map(entry => entry.from));
  const pages = [...routes, ...[...stubs].map(path => ({ path, titleKey: 'moved', descriptionKey: 'moved' }))];
  if ((await fileStat(join(siteRoot, 'styleguide/index.html')))?.isFile()) pages.push(styleguide);
  await withBrowser(async (browser, origin) => {
    for (const route of pages) for (const lang of ['it', 'en']) for (const viewport of viewports) {
      const row = { route: route.path, lang, width: viewport.width, states: [], leaks: [], errors: [] };
      report.pages.push(row);
      const page = await browser.newPage({ viewport, locale: lang, reducedMotion: 'reduce', serviceWorkers: 'block' });
      page.on('pageerror', error => row.errors.push(error.message));
      try {
        const verifyNetwork = await isolateNetwork(page.context(), origin);
        await visit(page, origin, route.path, lang, stubs.has(route.path));
        await scan(page, route, lang, row);
        verifyNetwork();
      } catch (error) { row.errors.push(error.message); }
      finally { await page.close(); }
      console.log(route.path, lang, viewport.width, row.leaks.length + ' leaks', ...row.errors);
    }
    await checkBindings(browser, origin);
    report.bindings = 'passed';
    report.leakControls = { it: 'visible English detected, hidden English ignored', en: 'visible Italian detected, hidden Italian ignored' };
  }, { holdRedirects: stubs, auditScripts: true });
} catch (error) { report.error = error.message; }
finally {
  await writeFile(join(out, 'i18n.json'), JSON.stringify(report, null, 2) + '\n');
}
if (report.error) console.error(report.error);
if (report.error || report.pages.some(row => row.leaks.length || row.errors.length)) process.exitCode = 1;
