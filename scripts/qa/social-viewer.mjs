import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { options, viewports, visit, withBrowser } from './browser.mjs';
import { isolateNetwork } from './network.mjs';

const { out, langs } = await options();
const product = '/projects/social-viewer/';
const tester = product + 'test/';
const privacy = product + 'privacy/';
const store = 'https://play.google.com/store/apps/details?id=io.github.falker47.socialviewer';
const optIn = 'https://play.google.com/apps/testing/io.github.falker47.socialviewer';
const group = 'https://groups.google.com/g/camaleonte-testing';
const source = join(homedir(), 'sources', 'Nexus-portfolio', 'socialviewer-privacy.html');
const legacy = existsSync(source) ? await readFile(source, 'utf8') : null;
const results = [];

async function checkPaths(page, lang, jsEnabled) {
  assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'), 'noindex,follow');
  assert.equal(await page.locator('.sv-path-panel:visible').count(), 0);
  for (const [id, expected] of [['returning', [optIn, store]], ['first-time', [group, optIn, store]]]) {
    await page.locator(`a[href="#${id}"]`).press('Enter');
    const panel = page.locator('.sv-path-panel:visible');
    assert.equal(await panel.getAttribute('id'), id);
    assert.deepEqual(await panel.locator('li a').evaluateAll(nodes => nodes.map(n => n.href)), expected);
    const bounds = await page.evaluate(() => ({
      width: innerWidth, height: innerHeight, scrollY,
      contentRight: document.documentElement.scrollWidth,
      stepsBottom: Math.ceil(document.querySelector('.sv-path-panel:target').getBoundingClientRect().bottom),
      feedbackBottom: Math.ceil(document.querySelector('.sv-requirements').getBoundingClientRect().bottom),
    }));
    assert.ok(bounds.contentRight <= bounds.width, 'horizontal overflow');
    if (bounds.width === 390) {
      assert.equal(bounds.scrollY, 0, 'choosing a path must keep the top of the page visible');
      assert.ok(bounds.feedbackBottom <= bounds.height && bounds.stepsBottom <= bounds.height, 'steps and requirements must fit');
    }
    results.push({ page: tester, lang, jsEnabled, path: id, steps: expected.length, ...bounds });
  }
  await page.goBack();
  assert.equal(await page.locator('.sv-path-panel:visible').getAttribute('id'), 'returning');
}

const visibleText = locator => locator.evaluate(el => el.innerText.replace(/\s+/gu, ' ').trim());

async function checkPrivacy(page, origin, lang) {
  await visit(page, origin, privacy, lang);
  const selected = page.locator('.language-panel:visible');
  assert.equal(await selected.getAttribute('lang'), lang);
  const other = lang === 'it' ? 'en' : 'it';
  const switcher = page.locator('.site-header .language-switch');
  await switcher.locator(`[data-lang="${other}"]`).click();
  assert.equal(await selected.getAttribute('lang'), other);
  assert.equal(new URL(page.url()).searchParams.get('lang'), other);
  await switcher.locator(`[data-lang="${lang}"]`).click();
  const summaries = selected.locator('summary');
  assert.equal(await summaries.count(), 6);
  for (const summary of await summaries.all()) await summary.press('Enter');
  assert.equal(await selected.locator('details[open]').count(), 6);
  assert.equal(await selected.locator('a[href^="mailto:"]:visible').getAttribute('href'), 'mailto:falker.dev@gmail.com');
  if (legacy) {
    const reference = await page.context().newPage();
    try {
      await reference.setContent(legacy);
      await reference.locator(`button[data-language="${lang}"]`).click();
      await reference.locator('details').evaluateAll(nodes => nodes.forEach(node => { node.open = true; }));
      const originalText = await visibleText(reference.locator('main'));
      const footer = lang === 'it' ? 'Contatti falker47' : 'Contact falker47';
      assert.equal(await visibleText(page.locator('main')), originalText.replace(/Contact \/ Contatti Nexus Portfolio$/, footer));
    } finally { await reference.close(); }
  }
  results.push({ page: privacy, lang, width: page.viewportSize().width, disclosuresOpened: 6, renderedOriginalCompared: Boolean(legacy) });
}

await withBrowser(async (browser, origin) => {
  for (const viewport of viewports) for (const lang of langs) {
    const context = await browser.newContext({ viewport, locale: lang, reducedMotion: 'reduce', serviceWorkers: 'block' });
    try {
      const verifyNetwork = await isolateNetwork(context, origin);
      const page = await context.newPage();
      page.on('pageerror', error => { throw error; });
      await visit(page, origin, product, lang);
      const cover = await page.locator('main picture img').evaluate(image => ({
        file: new URL(image.currentSrc).pathname, rendered: image.getBoundingClientRect().width, native: image.naturalWidth,
        alt: image.alt, expectedAlt: image.getAttribute('data-alt-' + document.documentElement.lang),
      }));
      assert.equal(cover.file, '/assets/projects/social-viewer-480.webp');
      assert.ok(cover.rendered <= 480 && cover.rendered > 0);
      assert.equal(cover.alt, cover.expectedAlt);
      assert.equal(await page.locator('main a.primary-cta').getAttribute('href'), store);
      results.push({ page: product, lang, width: viewport.width, cover: cover.file, displayedWidth: cover.rendered });
      await page.locator('a[href="./test/"]').click();
      await checkPaths(page, lang, true);
      await checkPrivacy(page, origin, lang);
      verifyNetwork();
    } finally { await context.close(); }
  }
  const mobile = await browser.newContext({ viewport: viewports[1], locale: 'it', javaScriptEnabled: false });
  try {
    const page = await mobile.newPage();
    await page.goto(origin + tester);
    await checkPaths(page, 'it', false);
    await page.goto(origin + privacy);
    assert.equal(await page.locator('.language-panel:visible').count(), 2);
    await page.locator('a[href="?lang=en#policy-en"]').click();
    assert.equal(new URL(page.url()).hash, '#policy-en');
    results.push({ page: privacy, jsEnabled: false, readableEditions: 2 });
  } finally { await mobile.close(); }
});
await writeFile(join(out, 'social-viewer-interactions.json'), JSON.stringify(results, null, 2) + '\n');
console.log(`Passed ${results.length} Social Viewer interaction checks.`);
