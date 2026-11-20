import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { options, viewports, visit, withBrowser } from './browser.mjs';
import { isolateNetwork } from './network.mjs';

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
  await page.keyboard.press('Home');
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

async function home(page) {
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
  await page.locator('.hero-lead .cta').click();
  assert.equal(new URL(page.url()).hash, '#progetti');
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForFunction(() => document.querySelector('.site-nav [aria-current]')?.hash === '#contatti');
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
      if (route === '/') await home(page);
      else if (route === '/styleguide/') await guide(page);
      verifyNetwork();
      assert.deepEqual(errors, []);
      checks.push({ route, lang, width: viewport.width, targets: '>=44px', result: 'pass' });
      console.log(route, lang, viewport.width, 'passed');
    } finally { await context.close(); }
  }
});
await writeFile(join(out, 'interactions.json'), JSON.stringify(checks, null, 2) + '\n');
