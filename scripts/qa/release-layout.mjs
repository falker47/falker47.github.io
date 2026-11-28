import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { auditRoutes } from './audit-routes.mjs';
import { homeStates, options, qaRequire, viewports, visitReviewState, withBrowser } from './browser.mjs';
import { isolateNetwork } from './network.mjs';
import { localPath, siteRoot } from './serve.mjs';

const { out, langs } = await options();
const { routes } = await auditRoutes();
const sections = homeStates;
const held = new Set(routes.filter(route => route.stub).map(route => route.path));
const sharp = qaRequire('sharp');
const assets = new Map();
const rows = [];

async function verify(page, path, lang, width) {
  const images = page.locator('img[src]:visible');
  await images.evaluateAll(async nodes => {
    for (const node of nodes) {
      node.closest('picture')?.querySelector('[data-preview]')?.remove();
      node.loading = 'eager';
    }
    await Promise.all(nodes.map(node => node.decode()));
  });
  const row = await page.evaluate(() => {
    const visible = node => node.getClientRects().length > 0 && getComputedStyle(node).visibility === 'visible';
    const text = document.body.innerText;
    const headlines = [...document.querySelectorAll('h1,h2,h3,h4')].filter(node => visible(node) && !node.closest('.hero'));
    return {
      overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
      largestHeadingOutsideHero: Math.max(0, ...headlines.map(node => parseFloat(getComputedStyle(node).fontSize))),
      // Heading scale: page titles up to 40 px, every other heading up to 32 px.
      headingLimits: headlines.map(node => {
        const size = parseFloat(getComputedStyle(node).fontSize);
        const limit = node.matches('h1') ? 40 : 32;
        return { text: node.textContent.trim().slice(0, 40), size, limit };
      }).filter(heading => heading.size > heading.limit),
      // Every visible card: its text stays inside it and its links are 44 px targets.
      cards: [...document.querySelectorAll('.card')].filter(visible).map(card => {
        const bounds = card.getBoundingClientRect();
        const links = [...card.querySelectorAll('a')].map(link => link.getBoundingClientRect().height);
        return { title: card.querySelector('h4')?.textContent.trim().slice(0, 30) ?? card.className, width: Math.round(bounds.width),
          spill: card.scrollWidth > card.clientWidth + 1, smallestLink: links.length ? Math.min(...links) : null };
      }),
      // SVG labels: at least 11 px as rendered.
      smallestChartText: Math.min(Infinity, ...[...document.querySelectorAll('.rm-chart text')].filter(visible)
        .map(node => parseFloat(getComputedStyle(node).fontSize) * node.ownerSVGElement.getBoundingClientRect().width / node.ownerSVGElement.viewBox.baseVal.width)),
      primaryActions: [...document.querySelectorAll('.primary-cta')].filter(visible).length,
      obsoleteWording: /Nexus Portfolio|Data Engineer(?:\s|$)|AI & Automation Engineer/i.test(text),
      images: [...document.images].filter(node => node.currentSrc && visible(node)).map(node => {
        const bounds = node.getBoundingClientRect(), css = getComputedStyle(node);
        const edges = side => parseFloat(css['border' + side + 'Width']) + parseFloat(css['padding' + side]);
        return { src: new URL(node.currentSrc).pathname, width: bounds.width - edges('Left') - edges('Right'),
          height: bounds.height - edges('Top') - edges('Bottom'), fit: css.objectFit };
      }),
    };
  });
  for (const image of row.images) {
    if (!assets.has(image.src)) assets.set(image.src, await sharp(localPath(siteRoot, image.src)).metadata());
    const native = assets.get(image.src);
    image.native = [native.width, native.height];
    const ratio = [image.width / native.width, image.height / native.height];
    image.scale = (image.fit === 'contain' || image.fit === 'scale-down' ? Math.min : Math.max)(...ratio);
  }
  const result = { path, lang, width, ...row };
  rows.push(result);
  assert.equal(row.overflow, 0, path + ' overflow');
  assert.deepEqual(row.headingLimits, [], path + ' heading size');
  for (const card of row.cards) {
    assert.ok(!card.spill, path + ' ' + card.title + ' overflows its card');
    assert.ok(card.smallestLink === null || card.smallestLink >= 44, path + ' ' + card.title + ' link height');
  }
  assert.ok(row.smallestChartText >= 11, path + ' drawing labels render at ' + row.smallestChartText + 'px');
  assert.ok(row.primaryActions <= 1, path + ' primary buttons');
  assert.equal(row.obsoleteWording, false, path + ' outdated copy');
  for (const image of row.images) assert.ok(image.scale <= 1.001, path + ' enlarged ' + JSON.stringify(image));
  if (path === '/' || path.startsWith('/#')) {
    assert.deepEqual(await page.locator('.site-nav a').evaluateAll(links => links.map(a => a.getAttribute('href'))), ['#progetti', '#ricerca', '#chi-sono', '/uses/']);
    assert.equal(await page.locator('a[href="/projects/"]').count(), 0, 'The old projects page is not linked');
  } else if (!held.has(path)) {
    assert.equal(await page.locator('.site-footer a[href="/uses/"]').count(), 1);
  }
  const back = page.locator('.detail-crumbs a:visible').first();
  if (await back.count()) {
    const target = await back.getAttribute('href');
    const expected = new URL(target, page.url()).pathname;
    await back.click();
    await page.waitForURL(url => url.pathname === expected);
    result.crumb = target;
  }
}

await withBrowser(async (browser, origin) => {
  for (const { path, stub } of [...routes, ...sections.map(path => ({ path }))]) {
    for (const lang of langs) for (const viewport of viewports) {
      const page = await browser.newPage({ viewport, locale: lang, reducedMotion: 'reduce', deviceScaleFactor: 1, serviceWorkers: 'block' });
      try {
        const network = await isolateNetwork(page.context(), origin);
        await visitReviewState(page, origin, path, lang, Boolean(stub));
        const start = rows.length;
        try { await verify(page, path, lang, viewport.width); }
        catch (error) {
          if (rows.length === start) rows.push({ path, lang, width: viewport.width });
          rows.at(-1).error = error.message;
        }
        network();
      } finally { await page.close(); }
    }
  }
  // First screen: with both sections closed, the home shows the title, the action, the identity card
  // and the two section rows without scrolling, on an iPhone under Safari's bars (390×664) as on the desktop.
  for (const lang of langs) for (const viewport of [{ width: 390, height: 664 }, viewports[0]]) {
    const page = await browser.newPage({ viewport, locale: lang, reducedMotion: 'reduce', deviceScaleFactor: 1, serviceWorkers: 'block' });
    try {
      const network = await isolateNetwork(page.context(), origin);
      await visitReviewState(page, origin, '/', lang);
      const bottom = Math.round(await page.locator('#progetti > summary').evaluate(node => node.getBoundingClientRect().bottom));
      const row = { path: '/ first screen', lang, width: viewport.width, height: viewport.height, projectsRowBottom: bottom };
      if (bottom > viewport.height) row.error = 'The projects row ends at ' + bottom + ' px, below the first screen';
      rows.push(row);
      network();
    } finally { await page.close(); }
  }
}, { holdRedirects: held, auditScripts: true });
await writeFile(join(out, 'layout.json'), JSON.stringify(rows, null, 2) + '\n');
for (const row of rows.filter(row => row.error)) console.error(row.path, row.lang, row.width, row.error);
const errors = rows.filter(row => row.error).length;
console.log(rows.length + ' page and panel layouts, ' + assets.size + ' distinct image files, ' + errors + ' failures.');
if (errors) process.exitCode = 1;
