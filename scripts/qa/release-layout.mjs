import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { auditRoutes } from './audit-routes.mjs';
import { options, qaRequire, viewports, visitReviewState, withBrowser } from './browser.mjs';
import { isolateNetwork } from './network.mjs';
import { localPath, siteRoot } from './serve.mjs';

const { out, langs } = await options();
const { routes } = await auditRoutes();
const sections = ['/#chi-sono', '/#certificazioni'];
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
      // Heading scale: page title, sheet titles, group and block headings, everything else.
      headingLimits: headlines.map(node => {
        const size = parseFloat(getComputedStyle(node).fontSize);
        const limit = node.matches('h1') ? 40 : node.matches('.tavola h2') ? 34 : node.matches('.group-head h2') ? 30 : 32;
        return { text: node.textContent.trim().slice(0, 40), size, limit };
      }).filter(heading => heading.size > heading.limit),
      sheets: [...document.querySelectorAll('.sheets-page .tavola')].map(sheet => {
        const figure = sheet.querySelector('.sheet-figure').getBoundingClientRect();
        const title = sheet.querySelector('h2').getBoundingClientRect();
        const link = [...sheet.querySelectorAll('.tavola-link')].find(a => a.getClientRects().length).getBoundingClientRect();
        const top = Math.min(figure.top, title.top), bottom = Math.max(figure.bottom, title.bottom, link.bottom);
        return { id: sheet.getAttribute('aria-labelledby'), span: Math.ceil(bottom - top), linkHeight: link.height,
          imageAboveTitle: figure.bottom <= title.top + 1 };
      }),
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
  for (const sheet of row.sheets) {
    // Image, title and first link of every sheet fit within one screen height.
    assert.ok(sheet.span <= page.viewportSize().height, path + ' ' + sheet.id + ' spans ' + sheet.span + 'px');
    assert.ok(sheet.linkHeight >= 44, path + ' ' + sheet.id + ' link height');
    if (width < 900) assert.ok(sheet.imageAboveTitle, path + ' ' + sheet.id + ' image first on narrow screens');
  }
  assert.ok(row.primaryActions <= 1, path + ' primary buttons');
  assert.equal(row.obsoleteWording, false, path + ' outdated copy');
  for (const image of row.images) assert.ok(image.scale <= 1.001, path + ' enlarged ' + JSON.stringify(image));
  if (path === '/' || path.startsWith('/#')) {
    assert.deepEqual(await page.locator('a.result').evaluateAll(links => links.map(a => a.getAttribute('href'))),
      ['/projects/#app', '/projects/#giochi', '/projects/#strumenti', 'https://www.nexusmods.com/profile/falker47/mods', 'https://www.nexusmods.com/profile/falker47/mods', '/research/']);
  } else if (!path.startsWith('/Nexus-portfolio/')) {
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
}, { holdRedirects: held, auditScripts: true });
await writeFile(join(out, 'layout.json'), JSON.stringify(rows, null, 2) + '\n');
for (const row of rows.filter(row => row.error)) console.error(row.path, row.lang, row.width, row.error);
const errors = rows.filter(row => row.error).length;
console.log(rows.length + ' page and panel layouts, ' + assets.size + ' distinct image files, ' + errors + ' failures.');
if (errors) process.exitCode = 1;
