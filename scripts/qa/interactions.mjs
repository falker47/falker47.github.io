import assert from 'node:assert/strict';
import { runOffline, runReflow } from './shared-a11y.mjs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { options, viewports, visit, withBrowser } from './browser.mjs';
import { isolateNetwork } from './network.mjs';
import snapshot from '../../data/nexus-downloads.json' with { type: 'json' };
import certificates from '../../data/certifications.json' with { type: 'json' };

const { pages, langs, out } = await options();
const checks = [];
const active = locator => locator.evaluate(el => el === document.activeElement);
const controls = ':is(.site-header,.work-tabs,.picker-bar,.card-links,.rail,.deck,.site-footer,.detail-top,.detail-crumbs) :is(a[href],button):visible';
const minTargets = page => page.locator(controls).evaluateAll(nodes => Math.min(...nodes.map(el => el.getBoundingClientRect().height)));
const panelIds = ['software', 'modding', 'research', 'teaching'];
const headerLinks = ['#progetti', '#ricerca', '#chi-sono'];
const offset = 76;
const settled = (page, selector) => page.waitForFunction(query => {
  const details = document.querySelector(query);
  return details.open && !details.getAnimations().length;
}, selector);

async function openWork(page) {
  const work = page.locator('details.work');
  if (!await work.evaluate(el => el.open)) await work.locator(':scope > summary').click();
  await settled(page, 'details.work');
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
    assert.ok(await minTargets(page) >= 44, 'Targets in ' + await tab.innerText());
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No horizontal overflow');
  }
  await tabs.first().click();
}

// The counts are the toggles: one group of cards shows at a time.
async function checkPickers(page) {
  await openWork(page);
  for (const [panel, groups] of [['software', ['app', 'game', 'tool']], ['modding', ['mod', 'translation']]]) {
    await page.locator('#tab-' + panel).click();
    const picker = page.locator('#panel-' + panel + ' .picker');
    const toggles = picker.locator('.picker-toggle');
    assert.deepEqual(await toggles.evaluateAll(nodes => nodes.map(node => node.dataset.group)), groups);
    assert.deepEqual(await toggles.evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-pressed'))), groups.map((_, i) => String(i === 0)));
    for (const group of [...groups].reverse()) {
      await picker.locator('.picker-toggle[data-group="' + group + '"]').click();
      assert.deepEqual(await picker.locator('.picker-group:visible').evaluateAll(nodes => nodes.map(node => node.dataset.group)), [group]);
      assert.equal(await picker.locator('.picker-toggle[aria-pressed="true"]').getAttribute('data-group'), group);
      const expected = Number(await picker.locator('.picker-toggle[data-group="' + group + '"] strong').innerText());
      assert.equal(await picker.locator('.picker-group:visible .card').count(), expected, group + ' cards match the count');
    }
    // The arrows move the row on wider screens; a phone scrolls it by touch.
    const rail = picker.locator('.picker-group:visible .rail');
    const track = rail.locator('.rail-track');
    assert.equal(await track.evaluate(node => getComputedStyle(node).scrollSnapType), 'x mandatory');
    const steps = rail.locator('.rail-step');
    if (page.viewportSize().width < 600) assert.equal(await steps.locator('visible=true').count(), 0, 'Arrows are hidden on phones');
    else if (await track.evaluate(node => node.scrollWidth > node.clientWidth + 4)) {
      assert.ok(await steps.first().isDisabled(), 'The row starts at its first card');
      await steps.last().click();
      await page.waitForFunction(node => node.scrollLeft > 0, await track.elementHandle());
      await page.waitForFunction(node => !node.disabled, await steps.first().elementHandle());
      await steps.first().click();
      await page.waitForFunction(node => node.scrollLeft <= 2, await track.elementHandle());
    }
    // Cards sit side by side: about 3.15 per view on desktop (4.15 for mods), 86% of the row on a phone.
    const ratio = await track.evaluate(node => node.querySelector('.card').getBoundingClientRect().width / node.clientWidth);
    if (page.viewportSize().width < 600) assert.ok(ratio <= .87 && ratio > .7, panel + ' phone card ' + ratio);
    else if (panel === 'software') assert.ok(Math.abs(1 / ratio - 3.15) < .2, 'software cards per view ' + 1 / ratio);
    // The count line beside the toggles follows the category.
    if (panel === 'software') assert.deepEqual(await picker.locator('.picker-count:visible').evaluateAll(nodes => nodes.map(node => node.dataset.group)), [groups[0]]);
  }
  await page.locator('#tab-software').click();
}

async function checkCertificates(page) {
  const cards = page.locator('#certificazioni .deck-card');
  assert.equal(await cards.count(), certificates.length);
  const caption = page.locator('.deck-caption');
  assert.ok(await caption.locator('.deck-default').isVisible());
  const trigger = cards.last();
  await trigger.focus();
  assert.equal(await caption.locator('.deck-current .deck-title').innerText(), await trigger.getAttribute('data-title'));
  assert.equal(await caption.locator('.deck-current .deck-meta').innerText(), await trigger.getAttribute('data-meta'));
  await trigger.press('Enter');
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
  const image = dialog.locator('.viewer-stage img');
  assert.ok(await image.evaluate(img => img.decode().then(() => img.naturalWidth > 0)));
  const heading = card => `${card.title} — ${card.issuer}, ${card.year}`;
  assert.equal(await dialog.locator('h3').innerText(), heading(certificates.at(-1)));
  assert.equal(await image.getAttribute('alt'), await trigger.locator('img').getAttribute('alt'));
  const count = () => dialog.locator('.viewer-count').innerText();
  assert.equal(await count(), certificates.length + ' / ' + certificates.length);
  await page.keyboard.press('ArrowRight');
  assert.equal(await count(), '1 / ' + certificates.length);
  assert.equal(await dialog.locator('h3').innerText(), heading(certificates[0]));
  assert.equal(new URL(await image.getAttribute('src'), page.url()).pathname, certificates[0].full.src);
  await page.keyboard.press('ArrowLeft');
  assert.equal(await count(), certificates.length + ' / ' + certificates.length);
  await dialog.locator('.viewer-step[data-step="-1"]').click();
  assert.equal(await count(), certificates.length - 1 + ' / ' + certificates.length);
  await dialog.locator('.viewer-step[data-step="1"]').click();
  // A swipe to the left shows the next certificate.
  const box = await dialog.locator('.viewer-stage').boundingBox();
  await page.mouse.move(box.x + box.width * .7, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * .3, box.y + box.height / 2);
  await page.mouse.up();
  assert.equal(await count(), '1 / ' + certificates.length);
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  assert.ok(await active(trigger), 'Focus returns to the card');
  await trigger.press('Enter');
  await dialog.getByRole('button').first().press('Enter');
  await dialog.waitFor({ state: 'hidden' });
  // The dialog's close event returns focus asynchronously; let it settle first.
  await page.waitForFunction(() => document.activeElement?.matches('.deck-card'));
  assert.ok(await active(trigger));
}

async function checkFragments(page, origin, lang) {
  const top = selector => page.locator(selector).evaluate(el => el.getBoundingClientRect().top);
  const arrived = async (selector, label) => {
    // The target stops 76 px below the top, unless the page ends first.
    await page.waitForFunction(({ query, offset }) => {
      const y = document.querySelector(query).getBoundingClientRect().top;
      const end = scrollY >= document.documentElement.scrollHeight - innerHeight - 1;
      return Math.abs(y - offset) <= 2 || (end && y >= offset - 2 && y < innerHeight);
    }, { query: selector, offset }, { timeout: 5000 }).catch(async () => { throw Error(label + ' stops at ' + await top(selector)); });
  };
  for (const id of ['chi-sono', 'certificazioni']) {
    await page.goto('about:blank');
    await visit(page, origin, '/#' + id, lang);
    assert.ok(await page.locator('#chi-sono').evaluate(el => el.open), '#' + id + ' opens Chi sono');
    await arrived('#' + id, '/#' + id);
  }
  await checkCertificates(page);
  for (const [id, tab] of [['progetti', 'software'], ['ricerca', 'research']]) {
    await page.goto('about:blank');
    await visit(page, origin, '/#' + id, lang);
    assert.ok(await page.locator('#progetti').evaluate(el => el.open), '#' + id + ' opens the projects');
    assert.equal(await page.locator('#tab-' + tab).getAttribute('aria-selected'), 'true', '#' + id + ' selects ' + tab);
    assert.equal(await page.locator('#chi-sono').evaluate(el => el.open), false);
    await arrived('#progetti', '/#' + id);
  }
  // The hero action and the header links do the same without leaving the page.
  await page.goto('about:blank');
  await visit(page, origin, '/', lang);
  await page.locator('.hero-lead .cta').click();
  await settled(page, 'details.work');
  assert.equal(await page.locator('#tab-software').getAttribute('aria-selected'), 'true');
  await arrived('#progetti', 'hero action');
  assert.equal(new URL(page.url()).hash, '#progetti');
  assert.equal(new URL(page.url()).searchParams.get('lang'), lang, 'The language stays in the address');
  const phone = page.viewportSize().width < 700;
  for (const [hash, expected] of [['#ricerca', 'research'], ['#progetti', 'software']]) {
    if (phone) await page.locator('.menu-button').click();
    await page.locator('.site-nav a[href="' + hash + '"]').click();
    await page.waitForFunction(id => document.getElementById('tab-' + id).getAttribute('aria-selected') === 'true', expected);
    await arrived('#progetti', 'header ' + hash);
    if (phone) assert.equal(await page.locator('.menu-button').getAttribute('aria-expanded'), 'false', 'A link closes the menu');
  }
  if (phone) await page.locator('.menu-button').click();
  await page.locator('.site-nav a[href="#chi-sono"]').click();
  await settled(page, '#chi-sono');
  await arrived('#chi-sono', 'header #chi-sono');
}

async function checkMenu(page) {
  const button = page.locator('.menu-button');
  const links = page.locator('.site-nav a');
  assert.equal(await links.count(), 3);
  if (page.viewportSize().width >= 700) {
    assert.equal(await button.isVisible(), false);
    assert.equal(await links.locator('visible=true').count(), 3);
    return;
  }
  assert.equal(await button.getAttribute('aria-expanded'), 'false');
  assert.equal(await button.getAttribute('aria-controls'), 'site-nav');
  assert.equal(await links.locator('visible=true').count(), 0, 'Links wait behind the menu button');
  await button.press('Enter');
  assert.equal(await button.getAttribute('aria-expanded'), 'true');
  assert.equal(await links.locator('visible=true').count(), 3);
  assert.ok(await links.evaluateAll(nodes => Math.min(...nodes.map(node => node.getBoundingClientRect().height))) >= 44);
  await page.keyboard.press('Tab');
  assert.ok(await active(links.first()), 'The links follow the button in the tab order');
  await page.keyboard.press('Escape');
  assert.equal(await button.getAttribute('aria-expanded'), 'false');
  assert.ok(await active(button), 'Escape returns to the button');
  await button.click();
  await page.locator('main').click({ position: { x: 5, y: 200 } });
  assert.equal(await button.getAttribute('aria-expanded'), 'false', 'A click outside closes the menu');
}

async function checkLiveNexus(page, origin, lang) {
  const stats = { ...snapshot, uniqueModDownloads: snapshot.uniqueModDownloads + 123, modCount: snapshot.modCount + 2, checkedOn: '2031-02-03' };
  await page.route('https://raw.githubusercontent.com/falker47/falker47.github.io/main/data/nexus-downloads.json',
    route => route.fulfill({ json: stats, headers: { 'Access-Control-Allow-Origin': '*' } }));
  await page.goto('about:blank');
  await visit(page, origin, '/', lang);
  await openWork(page);
  await page.locator('#tab-modding').click();
  for (const language of [lang, lang === 'it' ? 'en' : 'it']) {
    await page.locator(`button[data-lang="${language}"]`).click();
    await page.waitForFunction(({ count, downloads, date }) =>
      [...document.querySelectorAll('[data-nexus-stat="modCount"]')].every(node => node.textContent === count)
      && document.querySelector('[data-i18n="moddingNumber"]').textContent === downloads
      && document.querySelector('time[data-nexus-stat="checkedOn"]').textContent === date,
    { count: String(stats.modCount), downloads: new Intl.NumberFormat(language).format(stats.uniqueModDownloads),
      date: language === 'it' ? '3 febbraio 2031' : 'February 3, 2031' });
  }
}

async function checkNoScript(browser, origin, viewport) {
  const context = await browser.newContext({ viewport, javaScriptEnabled: false, locale: 'it' });
  try {
    const verify = await isolateNetwork(context, origin);
    const page = await context.newPage();
    await page.goto(origin);
    assert.equal(await page.locator('.site-nav a:visible').count(), 3, 'Header links are visible without scripts');
    await page.locator('details.work > summary').click();
    assert.equal(await page.locator('.work-panel:visible').count(), panelIds.length, 'All panels readable without scripts');
    assert.equal(await page.locator('.work-tabs:visible, .picker-bar:visible').count(), 0);
    assert.equal(await page.locator('.picker-group:visible').count(), 5, 'Every category is listed without scripts');
    assert.equal(await page.locator('.picker-heading:visible').count(), 5);
    assert.equal(await page.locator('.card:visible').count(), await page.locator('.card').count());
    await page.locator('#chi-sono > summary').click();
    assert.equal(await page.locator('.deck-card:visible').count(), certificates.length);
    verify();
  } finally { await context.close(); }
}

async function home(page, origin, lang) {
  const header = await page.locator('.site-header').evaluate(el => ({ position: getComputedStyle(el).position, height: el.getBoundingClientRect().height }));
  assert.deepEqual(header, { position: 'sticky', height: 64 }, 'The header bar is sticky and keeps the 64 px the hero was drawn for');
  assert.equal(await page.locator('.masthead, .register-row, .filter-chips, .register-tabs, .tavola').count(), 0);
  assert.deepEqual(await page.locator('.site-nav a').evaluateAll(links => links.map(a => a.getAttribute('href'))), headerLinks);
  for (const details of await page.locator('details.about, details.work').all()) assert.equal(await details.evaluate(el => el.open), false);
  assert.equal(await page.locator('.hero-lead .cta').getAttribute('href'), '#progetti');
  await checkMenu(page);
  await checkTabs(page);
  await checkPickers(page);
  await page.locator('#chi-sono > summary').click();
  await settled(page, '#chi-sono');
  assert.equal(await page.locator('.about-actions a[href="/research/"]').count(), 1);
  assert.equal(await page.locator('.journey svg:visible').count(), 1, 'One journey drawing per width');
  assert.equal(await page.locator('.journey svg:visible').getAttribute('class'), page.viewportSize().width < 900 ? 'journey-tall' : 'journey-wide');
  assert.equal(await page.locator('.journey svg:visible .jr-pulse').evaluate(node => getComputedStyle(node).display), 'none', 'No pulse with reduced motion');
  await checkCertificates(page);
  await checkFragments(page, origin, lang);
  await checkLiveNexus(page, origin, lang);
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
    if (state === 'default') assert.equal(await cta.getAttribute('href'), '/#progetti');
  }
  const trigger = page.locator('.deck-card').first();
  await trigger.focus();
  await page.keyboard.press('Enter');
  const dialog = page.getByRole('dialog');
  await dialog.waitFor();
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
        assert.equal(header, 'sticky', 'The same header bar on every page');
        const nav = await page.locator('.site-nav a').evaluateAll(links => links.map(a => a.getAttribute('href')));
        assert.deepEqual(nav, headerLinks.map(hash => '/' + hash));
        await checkMenu(page);
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
      } else if (route === '/styleguide/') await guide(page);
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
