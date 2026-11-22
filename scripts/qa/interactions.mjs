import assert from 'node:assert/strict';
import { runOffline, runReflow } from './shared-a11y.mjs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { options, viewports, visit, withBrowser } from './browser.mjs';
import { isolateNetwork } from './network.mjs';
import snapshot from '../../data/nexus-downloads.json' with { type: 'json' };

const { pages, langs, out } = await options();
const checks = [];
const active = locator => locator.evaluate(el => el === document.activeElement);
const controls = ':is(.masthead,.work-tabs,.site-header,.site-footer,.tavola,.sheets-index,.detail-crumbs) :is(a[href],button):visible';
const minTargets = page => page.locator(controls).evaluateAll(nodes => Math.min(...nodes.map(el => el.getBoundingClientRect().height)));
const panelIds = ['software', 'modding', 'research', 'teaching'];

async function openWork(page) {
  const work = page.locator('details.work');
  if (!await work.evaluate(el => el.open)) await work.locator(':scope > summary').click();
  await page.waitForFunction(() => document.querySelector('details.work').open && !document.querySelector('details.work').getAnimations().length);
}

async function checkTabs(page) {
  await openWork(page);
  const tabs = page.getByRole('tab');
  assert.equal(await tabs.count(), 4);
  assert.equal(await page.getByRole('tabpanel').count(), 1, 'One panel at a time');
  await tabs.first().focus();
  for (const [key, i] of [['End', 3], ['ArrowRight', 0], ['ArrowLeft', 3], ['Home', 0]]) {
    await page.keyboard.press(key);
    assert.ok(await active(tabs.nth(i)));
    assert.equal(await tabs.nth(i).getAttribute('aria-selected'), 'true');
    assert.ok(await page.locator('#panel-' + panelIds[i]).isVisible());
  }
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').getAttribute('role'), 'tabpanel');
  for (const tab of await tabs.all()) {
    await tab.click();
    assert.ok(await minTargets(page) >= 44);
  }
  // The master's result tiles and closing call open the projects page.
  await tabs.first().click();
  assert.deepEqual(await page.locator('#panel-software a.result').evaluateAll(links => links.map(a => a.getAttribute('href'))),
    ['/projects/#app', '/projects/#giochi', '/projects/#strumenti']);
  assert.equal(await page.locator('.portfolio-cta').getAttribute('href'), '/projects/');
}

async function checkCertificates(page) {
  const certificates = page.locator('#certificazioni .certificate:visible');
  assert.equal(await certificates.count(), 4);
  const more = page.locator('.more-certificates > summary');
  await more.press('Enter');
  assert.equal(await certificates.count(), await page.locator('#certificazioni .certificate').count());
  const trigger = certificates.last();
  await trigger.press('Enter');
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  assert.ok(await dialog.locator('img').evaluate(img => img.decode().then(() => img.naturalWidth > 0)));
  assert.equal(await dialog.locator('h3').innerText(), await trigger.locator(':scope > span').innerText());
  assert.equal(await dialog.locator('img').getAttribute('alt'), await trigger.locator('img').getAttribute('alt'));
  for (const key of ['Tab', 'Shift+Tab']) {
    await page.keyboard.press(key);
    assert.ok(await active(dialog.getByRole('button')));
  }
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  assert.ok(await active(trigger));
  await trigger.press('Enter');
  await dialog.getByRole('button').press('Enter');
  await dialog.waitFor({ state: 'hidden' });
  // The dialog's close event returns focus asynchronously; let it settle first.
  await page.waitForFunction(() => document.activeElement?.matches('.certificate'));
  await page.evaluate(() => new Promise(done => requestAnimationFrame(() => requestAnimationFrame(done))));
  assert.ok(await active(trigger));
  await more.press('Enter');
  assert.equal(await page.locator('.more-certificates').evaluate(el => el.open), false);
  assert.equal(await certificates.count(), 4);
}

async function checkFragments(page, origin, lang) {
  for (const id of ['chi-sono', 'certificazioni']) {
    await page.goto('about:blank');
    await visit(page, origin, '/#' + id, lang);
    assert.ok(await page.locator('#chi-sono').evaluate(el => el.open), '#' + id + ' opens Chi sono');
    const y = await page.locator('#' + id).evaluate(el => el.getBoundingClientRect().top);
    assert.ok(y >= 0 && y < page.viewportSize().height, '#' + id + ' outside the viewport: ' + y);
  }
  await checkCertificates(page);
}

async function checkLiveNexus(page, origin, lang) {
  const stats = { ...snapshot, uniqueModDownloads: snapshot.uniqueModDownloads + 123, modCount: snapshot.modCount + 2 };
  await page.route('https://raw.githubusercontent.com/falker47/falker47.github.io/main/data/nexus-downloads.json',
    route => route.fulfill({ json: stats, headers: { 'Access-Control-Allow-Origin': '*' } }));
  await page.goto('about:blank');
  await visit(page, origin, '/', lang);
  await openWork(page);
  await page.locator('#tab-modding').click();
  for (const language of [lang, lang === 'it' ? 'en' : 'it']) {
    await page.locator(`button[data-lang="${language}"]`).click();
    await page.waitForFunction(({ count, downloads }) =>
      [...document.querySelectorAll('[data-nexus-stat="modCount"]')].every(node => node.textContent === count)
      && document.querySelector('[data-i18n="moddingNumber"]').textContent === downloads,
    { count: String(stats.modCount), downloads: new Intl.NumberFormat(language).format(stats.uniqueModDownloads) });
  }
}

async function checkNoScript(browser, origin, viewport) {
  const context = await browser.newContext({ viewport, javaScriptEnabled: false, locale: 'it' });
  try {
    const verify = await isolateNetwork(context, origin);
    const page = await context.newPage();
    await page.goto(origin);
    await page.locator('details.work > summary').click();
    assert.equal(await page.locator('.work-panel:visible').count(), panelIds.length, 'All panels readable without scripts');
    assert.equal(await page.locator('.work-tabs:visible').count(), 0);
    await page.locator('#chi-sono > summary').click();
    assert.equal(await page.locator('.certificate:visible').count(), 4);
    await page.locator('.more-certificates > summary').click();
    assert.equal(await page.locator('.certificate:visible').count(), await page.locator('.certificate').count());
    verify();
  } finally { await context.close(); }
}

async function home(page, origin, lang) {
  const header = await page.locator('.masthead').evaluate(el => ({ position: getComputedStyle(el).position, height: el.getBoundingClientRect().height }));
  assert.deepEqual(header, { position: 'static', height: 64 }, 'The masthead is the master one, not sticky');
  assert.equal(await page.locator('.site-header, .register-row, .filter-chips, .register-tabs').count(), 0);
  for (const details of await page.locator('details.about, details.work').all()) assert.equal(await details.evaluate(el => el.open), false);
  await page.locator('.hero-lead .cta').evaluate(a => a.getAttribute('href')).then(href => assert.equal(href, '/projects/'));
  await checkTabs(page);
  await page.locator('#chi-sono > summary').click();
  await page.waitForFunction(() => document.getElementById('chi-sono').open);
  assert.equal(await page.locator('.about-actions a[href="/research/"]').count(), 1);
  await checkCertificates(page);
  await checkFragments(page, origin, lang);
  await checkLiveNexus(page, origin, lang);
}

async function projects(page) {
  const sections = await page.locator('.sheets-index a').evaluateAll(links => links.map(a => a.hash));
  assert.deepEqual(sections, ['#app', '#giochi', '#strumenti', '#mod', '#ricerca']);
  for (const hash of sections) {
    await page.locator(`.sheets-index a[href="${hash}"]`).click();
    // The section heading reaches the top, unless the page ends first.
    await page.waitForFunction(id => {
      const top = document.getElementById(id).getBoundingClientRect().top;
      const end = scrollY >= document.documentElement.scrollHeight - innerHeight - 1;
      return top >= 0 && (top < 40 || (end && top < innerHeight));
    }, hash.slice(1));
  }
  await page.evaluate(() => scrollTo(0, 0));
  const links = await page.locator('.tavola').evaluateAll(sheets => sheets.map(sheet =>
    [...sheet.querySelectorAll('.tavola-link')].filter(a => a.getClientRects().length).length));
  const phone = page.viewportSize().width < 600;
  assert.ok(links.every(count => phone ? count === 1 : count >= 1), 'Visible links per sheet: ' + links);
}

async function guide(page) {
  const preview = page.locator('#preview-state');
  for (const state of ['hover', 'focus', 'selected', 'disabled', 'default']) {
    await preview.selectOption(state);
    const cta = page.locator('.primary-cta');
    if (state === 'hover') assert.equal(await cta.evaluate(e => getComputedStyle(e).backgroundColor), 'rgb(241, 244, 245)');
    if (state === 'focus') assert.equal(await cta.evaluate(e => getComputedStyle(e).outlineWidth), '2px');
    if (state === 'selected') assert.equal(await page.locator('.site-nav a').first().getAttribute('data-preview'), 'selected');
    if (state === 'disabled') assert.equal(await cta.getAttribute('href'), null);
    if (state === 'default') assert.equal(await cta.getAttribute('href'), '/projects/');
  }
  const trigger = page.locator('.certificate').first();
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  assert.ok(await active(dialog.getByRole('button')));
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  assert.ok(await active(trigger));
}

await withBrowser(async (browser, origin) => {
  for (const route of pages) for (const lang of langs) for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, locale: lang, reducedMotion: 'reduce', serviceWorkers: 'block' });
    try {
      const verifyNetwork = await isolateNetwork(context, origin);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await visit(page, origin, route, lang);
      if (route !== '/') {
        const header = await page.locator('.site-header').evaluate(el => getComputedStyle(el).position);
        assert.notEqual(header, 'sticky', 'The shared header scrolls with the page');
        const nav = await page.locator('.site-nav a').evaluateAll(links => links.map(a => a.getAttribute('href')));
        assert.deepEqual(nav, ['/', '/projects/', '/research/', '/#chi-sono']);
      }
      assert.ok(await minTargets(page) >= 44);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.ok(await page.locator('.primary-cta:visible').count() <= 1);
      const other = lang === 'en' ? 'it' : 'en';
      await page.locator('button[data-lang="' + other + '"]').click();
      assert.equal(await page.locator('html').getAttribute('lang'), other);
      assert.equal(await page.evaluate(() => localStorage.getItem('nexus-language')), other);
      await page.locator('button[data-lang="' + lang + '"]').click();
      if (route === '/') {
        await home(page, origin, lang);
        if (lang === 'it') await checkNoScript(browser, origin, viewport);
      } else if (route === '/projects/') await projects(page);
      else if (route === '/styleguide/') await guide(page);
      verifyNetwork();
      assert.deepEqual(errors, []);
      checks.push({ route, lang, width: viewport.width, targets: '>=44px', result: 'pass' });
      console.log(route, lang, viewport.width, 'passed');
    } finally { await context.close(); }
  }
});
checks.push(...await runReflow(pages, langs));
if (pages.includes('/')) checks.push(...await runOffline(langs));
await writeFile(join(out, 'interactions.json'), JSON.stringify(checks, null, 2) + '\n');
