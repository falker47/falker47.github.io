import assert from 'node:assert/strict';
import { runOffline, runReflow } from './shared-a11y.mjs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { options, viewports, visit, withBrowser } from './browser.mjs';
import { isolateNetwork } from './network.mjs';
import snapshot from '../../data/nexus-downloads.json' with { type: 'json' };
import certificates from '../../data/certifications.json' with { type: 'json' };
import tutoring from '../../data/tutoring.json' with { type: 'json' };
import italianCopy from '../../data/i18n/it.json' with { type: 'json' };
import englishCopy from '../../data/i18n/en.json' with { type: 'json' };
import { aggregateRating, formatScore } from '../../src/lib/rating.mjs';

const { pages, langs, out } = await options();
const rating = aggregateRating(tutoring.ratings);
const checks = [];
const active = locator => locator.evaluate(el => el === document.activeElement);
const controls = ':is(.site-header,.work-tabs,.picker-bar,.card-links,.rail,.deck,.site-footer,.detail-top,.detail-crumbs) :is(a[href],button):visible';
const minTargets = page => page.locator(controls).evaluateAll(nodes => Math.min(...nodes.map(el => el.getBoundingClientRect().height)));
const panelIds = ['software', 'modding', 'research', 'teaching'];
const headerLinks = ['#progetti', '#ricerca', '#chi-sono', '/uses/'];
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

// V4: every count in the three panels is the same tile: one height, radius, outline width, glyph
// and number size; a tile that opens a page ends with its arrow. The first panel sets the measure.
let tileMeasure;
async function checkTiles(scope, name) {
  const tiles = await scope.locator('.results-row .result:visible').evaluateAll(nodes => nodes.map(node => {
    const style = getComputedStyle(node);
    const glyph = node.firstElementChild;
    return {
      measure: [node.getBoundingClientRect().height, style.borderTopLeftRadius, style.borderTopWidth, glyph.getBoundingClientRect().width,
        getComputedStyle(node.querySelector('.result-value')).fontSize].join(' '),
      glyph: glyph.matches('svg.result-icon, svg.brand'), link: node.matches('a'), arrow: node.lastElementChild.matches('.result-arrow'),
    };
  }));
  assert.ok(tiles.length, name + ' has count tiles');
  tileMeasure ??= tiles[0].measure;
  for (const tile of tiles) {
    assert.equal(tile.measure, tileMeasure, name + ' tiles share one size');
    assert.ok(tile.glyph, name + ' tiles open with their drawing or mark');
    assert.equal(tile.arrow, tile.link, name + ' only linked tiles end with an arrow');
  }
  assert.ok(Number.parseFloat(tileMeasure) >= 44, 'Tiles are 44 px targets');
}

// V4: the buttons are the foot of each card: one to three per row, rows filling the card's width,
// each a 44 px target showing its whole label, the platform mark first or the arrow last.
async function checkCardButtons(scope, name) {
  const cards = await scope.locator('.card-links').evaluateAll(nodes => nodes.map(row => {
    const card = row.closest('.card').getBoundingClientRect();
    const strip = row.getBoundingClientRect();
    const links = [...row.children].map(link => {
      const box = link.getBoundingClientRect();
      return { top: Math.round(box.top), left: box.left, right: box.right, height: box.height, whole: link.scrollWidth <= link.clientWidth + 1,
        brand: link.hasAttribute('data-brand'), first: link.firstElementChild?.matches('svg.brand') ?? false, last: link.lastElementChild?.matches('svg.icon') ?? false };
    });
    return { title: row.closest('.card').querySelector('h4').textContent.trim(), inset: [strip.left - card.left, card.right - strip.right],
      edges: [strip.left + row.clientLeft, strip.left + row.clientLeft + row.clientWidth], links };
  }));
  assert.ok(cards.length, name + ' has cards');
  for (const { title, inset, edges, links } of cards) {
    const label = name + ' · ' + title;
    assert.ok(links.length >= 1 && links.length <= 3, label + ': one to three buttons');
    assert.ok(inset.every(gap => gap >= 0 && gap <= 1.5), label + ': the buttons span the card');
    const rows = Map.groupBy(links, link => link.top);
    for (const row of rows.values()) {
      assert.ok(row.length <= 3, label + ': at most three in a row');
      assert.ok(Math.abs(row[0].left - edges[0]) < 1 && Math.abs(row.at(-1).right - edges[1]) < 1, label + ': each row fills the card');
    }
    for (const link of links) {
      assert.ok(link.height >= 44, label + ': 44 px target');
      assert.ok(link.whole, label + ': whole label');
      assert.ok(link.brand ? link.first && !link.last : link.last && !link.first, label + ': the mark leads, the arrow ends');
    }
  }
}

// The counts are the toggles: one group of cards shows at a time.
async function checkPickers(page) {
  tileMeasure = undefined;
  await openWork(page);
  for (const [panel, groups] of [['software', ['app', 'game', 'tool']], ['modding', ['mod', 'translation']]]) {
    await page.locator('#tab-' + panel).click();
    const picker = page.locator('#panel-' + panel + ' .picker');
    const toggles = picker.locator('.picker-toggle');
    assert.deepEqual(await toggles.evaluateAll(nodes => nodes.map(node => node.dataset.group)), groups);
    assert.deepEqual(await toggles.evaluateAll(nodes => nodes.map(node => node.getAttribute('aria-pressed'))), groups.map((_, i) => String(i === 0)));
    // The pressed tile is outlined in the panel accent, the others in the neutral rule (V4).
    const [pressed, ...others] = await toggles.evaluateAll(nodes => nodes.map(node => getComputedStyle(node).borderTopColor));
    assert.equal(pressed, panel === 'modding' ? 'rgb(249, 115, 22)' : 'rgb(155, 220, 255)', panel + ' pressed tile uses the panel accent');
    const rule = await picker.locator('.results-row').evaluate(node => getComputedStyle(node).borderBottomColor);
    assert.ok(others.every(colour => colour === rule), panel + ' other tiles are outlined in the rule');
    await checkTiles(page.locator('#panel-' + panel), panel);
    for (const group of [...groups].reverse()) {
      await picker.locator('.picker-toggle[data-group="' + group + '"]').click();
      await checkCardButtons(picker.locator('.picker-group:visible'), panel + ' ' + group);
      assert.deepEqual(await picker.locator('.picker-group:visible').evaluateAll(nodes => nodes.map(node => node.dataset.group)), [group]);
      assert.equal(await picker.locator('.picker-toggle[aria-pressed="true"]').getAttribute('data-group'), group);
      const expected = Number(await picker.locator('.picker-toggle[data-group="' + group + '"] .result-value').innerText());
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
    // Cards sit side by side (V4, more compact): (row − 48 px) / 4.2 each on desktop, 78% of the row on a phone.
    const [card, row] = await track.evaluate(node => [node.querySelector('.card').getBoundingClientRect().width, node.clientWidth]);
    if (page.viewportSize().width < 600) assert.ok(card / row <= .8 && card / row > .7, panel + ' phone card ' + card / row);
    else if (panel === 'software') assert.ok(Math.abs(card - (row - 48) / 4.2) < 2, 'software card width ' + card);
    // The count line beside the toggles follows the category.
    if (panel === 'software') {
      assert.deepEqual(await picker.locator('.picker-count:visible').evaluateAll(nodes => nodes.map(node => node.dataset.group)), [groups[0]]);
      // V5: a project with its own page shows "Scheda" on its cover, and the cover opens that page.
      await picker.locator('.picker-toggle[data-group="app"]').click();
      const covers = await picker.locator('.picker-group:visible .card').evaluateAll(cards => cards.map(card => {
        const cover = card.querySelector('.card-cover').getBoundingClientRect();
        card.scrollIntoView({ block: 'center', inline: 'nearest' });
        const box = card.querySelector('.card-cover').getBoundingClientRect();
        const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)?.closest('a');
        const chip = card.querySelector('.cover-chip')?.getBoundingClientRect();
        return { page: card.querySelector('h4 a')?.getAttribute('href') ?? null, hit: hit ? hit.getAttribute('href') : null,
          chip: chip ? chip.top >= box.top && chip.right <= box.right + 1 && chip.bottom <= box.bottom && cover.width > 0 : null };
      }));
      for (const cover of covers) {
        assert.equal(cover.hit, cover.page, 'The cover opens ' + (cover.page ?? 'nothing'));
        assert.equal(cover.chip, cover.page ? true : null, 'The "Scheda" label sits on the cover of ' + cover.page);
      }
    }
  }
  // Research (V5): the paper count is the same tile; the two papers are project cards in a rail,
  // side by side on a phone like the other tabs, ending with the same buttons.
  await page.locator('#tab-research').click();
  await checkTiles(page.locator('#panel-research'), 'research');
  await checkCardButtons(page.locator('#panel-research .rail-papers'), 'research');
  const papers = await page.locator('#panel-research .rail-papers .card').evaluateAll(cards => cards.map(card => card.getBoundingClientRect()).map(box => ({ top: box.top, width: box.width })));
  assert.equal(papers.length, 2);
  assert.ok(Math.abs(papers[0].top - papers[1].top) < 1, 'The papers sit side by side');
  const row = await page.locator('#panel-research .rail-track').evaluate(node => node.clientWidth);
  if (page.viewportSize().width < 600) assert.ok(papers[0].width / row <= .8 && papers[0].width / row > .7, 'phone paper card ' + papers[0].width / row);
  else if (page.viewportSize().width >= 1000) assert.ok(Math.abs(papers[0].width - (row - 48) / 4.2) < 2, 'paper card width ' + papers[0].width);
  // Lessons (V5): from 900 px the two portals sit side by side.
  await page.locator('#tab-teaching').click();
  const portals = await page.locator('#panel-teaching .feedback-result').evaluateAll(cards => cards.map(card => card.getBoundingClientRect().top));
  if (page.viewportSize().width >= 900) assert.ok(Math.abs(portals[0] - portals[1]) < 1, 'The two portals sit side by side');
  else assert.ok(portals[1] > portals[0], 'On a phone the portals stack');
  await page.locator('#tab-software').click();
}

async function checkCertificates(page) {
  const cards = page.locator('#certificazioni .deck-card');
  assert.equal(await cards.count(), certificates.length);
  const caption = page.locator('.deck-caption');
  assert.ok(await caption.locator('.deck-default').isVisible());
  // V4: with a mouse the card follows the pointer's slot in the fan, as smoothly to the right as to the left.
  if (page.viewportSize().width >= 600) {
    await page.locator('#certificazioni .deck-fan').scrollIntoViewIfNeeded();
    const box = await page.locator('#certificazioni .deck-fan').boundingBox();
    const [x0, step] = await cards.evaluateAll(nodes => [nodes[0].offsetLeft, nodes[1].offsetLeft - nodes[0].offsetLeft]);
    const activeIndex = () => cards.evaluateAll(nodes => nodes.findIndex(node => node.hasAttribute('data-active')));
    for (const index of [0, 1, 2, 3, 4, 3, 2, 1]) {
      await page.mouse.move(box.x + x0 + step * index + step / 2, box.y + box.height - 24);
      assert.equal(await activeIndex(), index, 'The fan follows the pointer to card ' + index);
      assert.equal(await caption.locator('.deck-current .deck-title').innerText(), certificates[index].title);
    }
    await page.mouse.move(1, 1);
    assert.equal(await activeIndex(), -1, 'Leaving the fan lowers the card');
  }
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
    // V5: the certificates are on the second slide of the carousel, which the link brings in.
    assert.equal(await page.locator('.about-index').innerText(), id === 'certificazioni' ? '2' : '1', '/#' + id + ' slide');
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
  assert.equal(await links.count(), headerLinks.length);
  if (page.viewportSize().width >= 700) {
    assert.equal(await button.isVisible(), false);
    assert.equal(await links.locator('visible=true').count(), headerLinks.length);
    return;
  }
  assert.equal(await button.getAttribute('aria-expanded'), 'false');
  assert.equal(await button.getAttribute('aria-controls'), 'site-nav');
  assert.equal(await links.locator('visible=true').count(), 0, 'Links wait behind the menu button');
  await button.press('Enter');
  assert.equal(await button.getAttribute('aria-expanded'), 'true');
  assert.equal(await links.locator('visible=true').count(), headerLinks.length);
  assert.ok(await links.evaluateAll(nodes => Math.min(...nodes.map(node => node.getBoundingClientRect().height))) >= 44);
  await page.keyboard.press('Tab');
  assert.ok(await active(links.first()), 'The links follow the button in the tab order');
  await page.keyboard.press('Escape');
  assert.equal(await button.getAttribute('aria-expanded'), 'false');
  assert.ok(await active(button), 'Escape returns to the button');
  await button.click();
  // Below the open menu, which now holds four links.
  await page.locator('main').click({ position: { x: 5, y: 300 } });
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
    // V4: the live total shows in the Modding tile and in the "Chi sono" figure.
    await page.waitForFunction(({ downloads }) => [...document.querySelectorAll('[data-i18n="moddingNumber"]')].every(node => node.textContent === downloads),
      { downloads: new Intl.NumberFormat(language).format(stats.uniqueModDownloads) });
    // The tutoring rating follows the language: 5,0 / 5.0 and the review count in words.
    const copy = language === 'it' ? italianCopy : englishCopy;
    assert.deepEqual(await page.locator('.fact-tutoring').evaluate(el => [el.querySelector('.fact-value').textContent, el.querySelector('.fact-label').textContent]),
      [formatScore(rating.score, language) + ' ' + copy.ratingOutOf, copy[rating.count === 1 ? 'ratingReviewsOne' : 'ratingReviewsOther'].replace('{count}', rating.count)], 'Rating in ' + language);
  }
}

// V5: the carousel's height transition runs only with motion, and the main pass reduces motion.
// Tab into the certificates of slide 2: the focused card stays in view and the track keeps its
// scroll at 0. Open "Su di me" after switching language while it was closed: the opening ends at
// the height the section settles at, with no snap.
async function checkCarouselMotion(browser, origin, viewport) {
  const context = await browser.newContext({ viewport, locale: 'it', reducedMotion: 'no-preference', serviceWorkers: 'block' });
  try {
    const page = await context.newPage();
    await visit(page, origin, '/', 'it');
    const toggle = () => page.evaluate(async () => {
      const details = document.querySelector('#chi-sono');
      details.querySelector(':scope > summary').click();
      const animation = details.getAnimations()[0];
      const end = animation ? parseFloat(animation.effect.getKeyframes().at(-1).height) : null;
      if (animation) await animation.finished;
      await new Promise(resolve => setTimeout(resolve, 600));
      return { open: details.open, end, final: details.getBoundingClientRect().height };
    });
    let state = await toggle();
    assert.ok(state.open && (state.end === null || Math.abs(state.end - state.final) <= 1), `Opening ends at ${state.end} px and settles at ${state.final} px`);
    await page.locator('#chi-sono > summary').focus();
    await page.keyboard.press('Tab');
    await page.waitForTimeout(600);
    const focus = await page.evaluate(() => {
      const box = document.activeElement.getBoundingClientRect();
      return { card: document.activeElement.matches('.deck-card'), slide: document.querySelector('.about-index').textContent,
        top: box.top, bottom: box.bottom, view: innerHeight, scroll: document.querySelector('.about-rows').scrollTop };
    });
    assert.ok(focus.card && focus.slide === '2', 'Tab from the summary reaches the certificates on slide 2');
    assert.ok(focus.top >= 0 && focus.bottom <= focus.view, `The focused card is in view (${Math.round(focus.top)}–${Math.round(focus.bottom)} of ${focus.view} px)`);
    assert.equal(focus.scroll, 0, 'The track keeps its scroll at 0');
    state = await toggle();
    assert.equal(state.open, false);
    await page.locator('button[data-lang="en"]').click();
    state = await toggle();
    assert.ok(state.open && (state.end === null || Math.abs(state.end - state.final) <= 1), `After a language switch the opening ends at ${state.end} px and settles at ${state.final} px`);
  } finally { await context.close(); }
}

async function checkNoScript(browser, origin, viewport) {
  const context = await browser.newContext({ viewport, javaScriptEnabled: false, locale: 'it' });
  try {
    const verify = await isolateNetwork(context, origin);
    const page = await context.newPage();
    await page.goto(origin);
    assert.equal(await page.locator('.site-nav a:visible').count(), headerLinks.length, 'Header links are visible without scripts');
    await page.locator('details.work > summary').click();
    assert.equal(await page.locator('.work-panel:visible').count(), panelIds.length, 'All panels readable without scripts');
    assert.equal(await page.locator('.work-tabs:visible, .picker-bar:visible').count(), 0);
    assert.equal(await page.locator('.picker-group:visible').count(), 5, 'Every category is listed without scripts');
    assert.equal(await page.locator('.picker-heading:visible').count(), 5);
    assert.equal(await page.locator('.card:visible').count(), await page.locator('.card').count());
    await page.locator('#chi-sono > summary').click();
    assert.equal(await page.locator('.deck-card:visible').count(), certificates.length);
    // V5: without scripts the four paragraphs stay in a column and the carousel controls stay hidden.
    assert.equal(await page.locator('.about-row:visible').count(), 4, 'Every paragraph is readable without scripts');
    assert.equal(await page.locator('.about-nav:visible').count(), 0);
    const tops = await page.locator('.about-row').evaluateAll(rows => rows.map(row => row.getBoundingClientRect().top));
    assert.ok(tops.every((top, i) => !i || top > tops[i - 1]), 'The paragraphs follow one another down the page');
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
  // V5: the rows of "Su di me" are the slides of a carousel, each paragraph with its figure. From
  // 900 px the figure sits right of its paragraph on every slide; below, it follows the paragraph.
  // The arrows move one slide, the counter and the lit dot follow, and the track takes the height
  // of the open slide.
  const track = page.locator('.about-rows');
  const nav = page.locator('.about-nav');
  assert.ok(await nav.isVisible(), 'The carousel controls show with the script');
  assert.equal(await track.evaluate(node => getComputedStyle(node).scrollSnapType), 'x mandatory');
  const slide = () => page.locator('.about-index').innerText();
  const fitted = index => page.waitForFunction(i => {
    const rows = document.querySelector('.about-rows');
    const row = rows.children[i];
    return Math.abs(rows.getBoundingClientRect().height - row.offsetHeight) <= 1 && Math.abs(rows.scrollLeft - (row.offsetLeft - rows.children[0].offsetLeft)) <= 2;
  }, index, { timeout: 5000 });
  assert.equal(await slide(), '1', 'The carousel opens on the first paragraph');
  assert.ok(await nav.locator('.about-step[data-step="-1"]').isDisabled(), 'No step back from the first paragraph');
  const rows = [];
  for (let index = 0; index < 4; index++) {
    if (index) await nav.locator('.about-step[data-step="1"]').click();
    await fitted(index);
    assert.equal(await slide(), String(index + 1), 'The counter follows the arrows');
    assert.equal(await nav.locator('.about-dots i').evaluateAll(dots => dots.findIndex(dot => dot.classList.contains('on'))), index, 'The lit dot follows the arrows');
    rows.push(await page.locator('.about-row').nth(index).evaluate(row => {
      const text = row.querySelector('p').getBoundingClientRect(), figure = row.querySelector('.about-figure').getBoundingClientRect();
      return { text: { left: text.left, right: text.right, bottom: text.bottom }, figure: { left: figure.left, right: figure.right, top: figure.top, width: figure.width, height: figure.height } };
    }));
  }
  assert.ok(await nav.locator('.about-step[data-step="1"]').isDisabled(), 'No step past the last paragraph');
  for (const [index, { text, figure }] of rows.entries()) {
    if (page.viewportSize().width < 900) assert.ok(figure.top >= text.bottom - 1, `Row ${index + 1}: the figure follows its paragraph`);
    else {
      assert.ok(figure.left >= text.right - 1, `Row ${index + 1}: the figure sits right of its paragraph`);
      // The text fills its column: no empty band between a paragraph and its figure.
      assert.ok(figure.left - text.right <= 48, `Row ${index + 1}: ${Math.round(figure.left - text.right)} px between the paragraph and its figure`);
    }
  }
  // A swipe (a native scroll of the track) also moves the counter; the arrow goes back.
  await track.evaluate(node => node.scrollTo({ left: node.children[1].offsetLeft - node.children[0].offsetLeft }));
  await fitted(1);
  assert.equal(await slide(), '2', 'A swipe moves the counter');
  await nav.locator('.about-step[data-step="-1"]').click();
  await fitted(0);
  // The pendulum stays about 400 px wide beside the short first paragraph, cropped to its panels.
  if (page.viewportSize().width >= 900) {
    const { width, height } = rows[0].figure;
    assert.ok(width <= 402 && height <= 225, `Row 1: the drawing is ${Math.round(width)}×${Math.round(height)} px`);
  }
  assert.equal(await page.locator('.journey, .about-journey').count(), 0, 'No "Percorso" drawing');
  // Once the page has loaded and gone idle, the certificate thumbnails have started loading.
  assert.ok(await page.locator('.deck-card img').evaluateAll(images => images.every(image => image.loading === 'eager')), 'Thumbnails warmed after load');
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
        assert.deepEqual(nav, headerLinks.map(target => target.startsWith('/') ? target : '/' + target));
        // "Cosa uso" is marked current on its own page only.
        assert.deepEqual(await page.locator('.site-nav a[aria-current="page"]').evaluateAll(links => links.map(a => a.getAttribute('href'))), route === '/uses/' ? ['/uses/'] : []);
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
        if (lang === 'it') {
          await checkNoScript(browser, origin, viewport);
          await checkCarouselMotion(browser, origin, viewport);
        }
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
