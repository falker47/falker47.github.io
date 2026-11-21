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
const minTargets = page => page.locator(':is(.site-header,.register-tabs,.filter-chips,.register-row,.mod-row) :is(a[href],button):visible').evaluateAll(nodes =>
  Math.min(...nodes.map(el => el.getBoundingClientRect().height)));

async function verifyCatalogueLanguage(page, lang) {
  const data = page.locator('#data');
  const images = data.locator('picture img');
  assert.ok(await images.count() > 0);
  assert.ok(await images.evaluateAll((nodes, lang) => nodes.every(img => img.alt === img.getAttribute('data-alt-' + lang)), lang));
  assert.ok(await data.locator('[data-text-it]').evaluateAll((nodes, lang) =>
    nodes.length > 0 && nodes.every(node => node.textContent === node.getAttribute('data-text-' + lang)), lang));
}

async function guide(page) {
  const tabs = page.getByRole('tab');
  await tabs.first().focus();
  await page.keyboard.press('ArrowRight');
  assert.ok(await active(tabs.last()));
  assert.equal(await tabs.last().getAttribute('aria-selected'), 'true');
  assert.ok(await minTargets(page) >= 44);
  await page.keyboard.press('End');
  assert.ok(await active(tabs.last()));
  await page.keyboard.press('ArrowRight');
  assert.ok(await active(tabs.first()));
  await page.keyboard.press('ArrowLeft');
  assert.ok(await active(tabs.last()));
  await page.keyboard.press('Home');
  assert.ok(await active(tabs.first()));
  await page.keyboard.press('Tab');
  assert.equal(await page.locator(':focus').getAttribute('role'), 'tabpanel');
  const chip = page.locator('[data-filter="game"]');
  await chip.focus();
  await page.keyboard.press('Space');
  assert.equal(await chip.getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('.register-row:visible').count(), 1);
  const preview = page.locator('#preview-state');
  for (const state of ['hover','focus','selected','disabled','default']) {
    await preview.selectOption(state);
    const cta = page.locator('.primary-cta');
    if (state === 'hover') assert.equal(await cta.evaluate(e => getComputedStyle(e).backgroundColor), 'rgb(241, 244, 245)');
    if (state === 'focus') assert.equal(await cta.evaluate(e => getComputedStyle(e).outlineWidth), '2px');
    if (state === 'disabled') { assert.ok(await chip.isDisabled()); assert.equal(await cta.getAttribute('href'), null); }
    if (state === 'selected') assert.equal(await chip.getAttribute('aria-pressed'), 'true');
    if (state === 'default') assert.equal(await cta.getAttribute('href'), '/#progetti');
  }
  const trigger = page.locator('.certificate').first();
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  assert.ok(await dialog.locator('img').evaluate(img => img.decode().then(() => img.naturalWidth > 0)));
  assert.ok(await active(dialog.getByRole('button')));
  await page.keyboard.press('Tab');
  assert.ok(await active(dialog.getByRole('button')));
  await page.keyboard.press('Shift+Tab');
  assert.ok(await active(dialog.getByRole('button')));
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  assert.ok(await active(trigger));
  await page.keyboard.press('Enter');
  await dialog.getByRole('button').press('Enter');
  await dialog.waitFor({ state: 'hidden' });
  assert.ok(await active(trigger));
  const summary = page.locator('.disclosure > summary');
  await summary.press('Enter');
  assert.ok(await page.locator('.disclosure').evaluate(e => e.open));
  assert.ok(await page.locator('.site-nav a').evaluateAll(links => links.every(a => a.getAttribute('href').startsWith('/#'))));
}

const fragments = ['software', 'modding', 'ricerca', 'tutoring'];
const panelIds = ['software', 'modding', 'research', 'teaching'];

async function checkRegister(page) {
  const rows = page.locator('#panel-software .register-row');
  const firstRow = await rows.first().boundingBox();
  const geometry = {
    firstRowOffset: Math.round(firstRow.y),
    scrollToSeeFullRow: Math.max(0, Math.ceil(firstRow.y + firstRow.height - page.viewportSize().height)),
    softwarePanelHeight: Math.ceil((await page.locator('#panel-software').boundingBox()).height),
  };
  if (page.viewportSize().width === 390) {
    assert.ok(geometry.scrollToSeeFullRow <= page.viewportSize().height, JSON.stringify(geometry));
    assert.ok(geometry.softwarePanelHeight <= 1500, JSON.stringify(geometry));
    await page.evaluate(y => scrollTo(0, y), geometry.scrollToSeeFullRow);
    const row = await rows.first().boundingBox();
    assert.ok(row.y >= 64 && row.y + row.height <= page.viewportSize().height);
  } else {
    const kinds = await rows.locator('.row-kind').evaluateAll(nodes =>
      nodes.every(node => node.scrollWidth <= node.clientWidth && node.clientHeight <= parseFloat(getComputedStyle(node).lineHeight) + 1));
    assert.ok(kinds, 'Desktop kind labels must fit on one line');
  }
  const projectsTop = await page.locator('#progetti').evaluate(el => el.getBoundingClientRect().top + scrollY);
  await page.evaluate(y => scrollTo(0, y), Math.floor(projectsTop - 65));
  await page.waitForFunction(() => !document.querySelector('.site-nav [aria-current]'));
  await page.locator('.hero-lead .cta').click();
  await page.waitForFunction(() => document.querySelector('.site-nav [aria-current]')?.hash === '#progetti');

  const tabs = page.getByRole('tab');
  await tabs.first().focus();
  const count = await page.evaluate(() => history.length);
  for (const [key, i] of [['End', 3], ['ArrowRight', 0], ['ArrowLeft', 3], ['Home', 0]]) {
    await page.keyboard.press(key);
    assert.ok(await active(tabs.nth(i)));
    assert.equal(await tabs.nth(i).getAttribute('aria-selected'), 'true');
    assert.equal(new URL(page.url()).hash, '#' + fragments[i]);
  }
  assert.equal(await page.evaluate(() => history.length), count, 'Selecting tabs replaces the current history entry');
  for (const chip of await page.locator('.work [data-filter]').all()) {
    await chip.focus();
    await page.keyboard.press('Space');
    assert.ok(await active(chip));
    assert.equal(await chip.getAttribute('aria-pressed'), 'true');
    assert.equal(new URL(page.url()).hash, '#software');
    const kind = await chip.getAttribute('data-filter');
    const filtered = await rows.evaluateAll(nodes => nodes.filter(el => !el.hidden).map(el => el.dataset.kind));
    assert.equal(filtered.length, Number(await chip.locator('.count').innerText()));
    assert.ok(filtered.every(value => kind === 'all' || kind === value));
  }
  await page.locator('.work [data-filter="all"]').click();
  return geometry;
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
  assert.ok(await active(trigger));
  await more.press('Enter');
  assert.equal(await certificates.count(), 4);
}

async function checkHash(page, origin, lang) {
  for (const [i, hash] of fragments.entries()) {
    await page.goto('about:blank');
    await visit(page, origin, '/#' + hash, lang);
    await page.waitForFunction(id => document.getElementById('tab-' + id).getAttribute('aria-selected') === 'true', panelIds[i]);
    assert.equal(await page.getByRole('tabpanel').count(), 1);
    assert.equal(await page.locator('.site-nav [aria-current]').getAttribute('href'), '#progetti');
    const tabs = await page.getByRole('tablist').boundingBox();
    assert.ok(tabs.y >= 64 && tabs.y + tabs.height <= page.viewportSize().height, `Deep link #${hash} hides the tabs: ${tabs.y}`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  }
  await page.evaluate(() => { location.hash = 'modding'; });
  await page.waitForFunction(() => document.getElementById('tab-modding').getAttribute('aria-selected') === 'true');
  await page.goto('about:blank');
  await visit(page, origin, '/#certificazioni', lang);
  assert.ok(await page.locator('#chi-sono').evaluate(el => el.open));
  await checkCertificates(page);
}

async function checkLiveNexus(page, origin, lang) {
  const stats = { ...snapshot, uniqueModDownloads: snapshot.uniqueModDownloads + 123, modCount: snapshot.modCount + 2 };
  await page.route('https://raw.githubusercontent.com/falker47/falker47.github.io/main/data/nexus-downloads.json',
    route => route.fulfill({ json: stats, headers: { 'Access-Control-Allow-Origin': '*' } }));
  await page.goto('about:blank');
  await visit(page, origin, '/#modding', lang);
  for (const language of [lang, lang === 'it' ? 'en' : 'it']) {
    await page.locator(`[data-lang="${language}"]`).click();
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
    assert.equal(await page.locator('.work-panel:visible').count(), fragments.length);
    assert.equal(await page.locator('.filter-chips:visible, .register-tabs:visible').count(), 0);
    await page.locator('#chi-sono > summary').click();
    assert.equal(await page.locator('.certificate:visible').count(), 4);
    await page.locator('.more-certificates > summary').click();
    assert.equal(await page.locator('.certificate:visible').count(), await page.locator('.certificate').count());
    verify();
  } finally { await context.close(); }
}

async function home(page, origin, lang) {
  assert.equal(await page.locator('.site-nav [aria-current]').count(), 0);
  const geometry = await checkRegister(page);
  for (const tab of await page.getByRole('tab').all()) {
    await tab.click();
    assert.ok(await minTargets(page) >= 44);
  }
  for (const id of ['progetti','chi-sono','contatti']) {
    const link = page.locator(`.site-nav a[href="#${id}"]`);
    await link.click();
    await page.waitForFunction(id => document.querySelector(`.site-nav [aria-current="location"]`)?.hash === '#' + id, id);
    const y = await page.locator('#' + id).evaluate(e => e.getBoundingClientRect().top);
    assert.ok(y >= 64 && y < page.viewportSize().height, id + ' hidden by the header or outside viewport: ' + y);
  }
  assert.ok(await page.locator('#chi-sono').evaluate(e => e.open));
  await checkCertificates(page);
  await page.locator('.hero-lead .cta').click();
  assert.equal(new URL(page.url()).hash, '#progetti');
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForFunction(() => document.querySelector('.site-nav [aria-current]')?.hash === '#contatti');
  await checkHash(page, origin, lang);
  await checkLiveNexus(page, origin, lang);
  return geometry;
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
      assert.equal(await page.locator('.site-header').evaluate(e => e.getBoundingClientRect().height), 64);
      assert.ok(await minTargets(page) >= 44);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.equal(await page.locator('.primary-cta:visible').count(), 1);
      const other = lang === 'en' ? 'it' : 'en';
      await page.locator('[data-lang="' + other + '"]').click();
      assert.equal(await page.locator('html').getAttribute('lang'), other);
      assert.equal(await page.evaluate(() => localStorage.getItem('nexus-language')), other);
      if (route === '/styleguide/') await verifyCatalogueLanguage(page, other);
      await page.locator('[data-lang="' + lang + '"]').click();
      if (route === '/styleguide/') await verifyCatalogueLanguage(page, lang);
      let geometry;
      if (route === '/') {
        geometry = await home(page, origin, lang);
        if (lang === 'it') await checkNoScript(browser, origin, viewport);
      }
      else if (route === '/styleguide/') await guide(page);
      verifyNetwork();
      assert.deepEqual(errors, []);
      checks.push({ route, lang, width: viewport.width, ...geometry, targets: '>=44px', result: 'pass' });
      console.log(route, lang, viewport.width, 'passed');
    } finally { await context.close(); }
  }
});
checks.push(...await runReflow(pages, langs));
if (pages.includes('/')) checks.push(...await runOffline(langs));
await writeFile(join(out, 'interactions.json'), JSON.stringify(checks, null, 2) + '\n');
