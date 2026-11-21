import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { auditRoutes } from './audit-routes.mjs';
import { options, qaRequire, viewports, visitReviewState, withBrowser } from './browser.mjs';
import { isolateNetwork } from './network.mjs';
import { localPath, siteRoot } from './serve.mjs';

const { out, langs } = await options();
const { routes } = await auditRoutes();
const sections = ['/#modding', '/#ricerca', '/#tutoring', '/#certificazioni'];
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
  assert.ok(row.largestHeadingOutsideHero <= 32, path + ' heading size');
  assert.ok(row.primaryActions <= 1, path + ' primary buttons');
  assert.equal(row.obsoleteWording, false, path + ' outdated copy');
  for (const image of row.images) assert.ok(image.scale <= 1.001, path + ' enlarged ' + JSON.stringify(image));
  if (path === '/') {
    const rows = page.locator('.register-row');
    for (const name of ['prof-gecko', 'camaleonte', 'social-viewer']) {
      const item = rows.filter({ has: page.locator('a.row-title[href="/projects/' + name + '/"]') });
      assert.equal(await item.locator('.row-actions [data-i18n="viewSheet"]').innerText(), lang === 'it' ? 'Scheda' : 'Details');
    }
    assert.equal(await page.locator('.site-footer a[href="/uses/"]').count(), 1);
  }
  if (path === '/#ricerca') assert.equal(await page.locator('#panel-research a[href="/research/"]:visible').count(), 1);
  const back = page.locator('a.detail-back');
  if (await back.count()) {
    await back.click();
    const tab = path === '/research/' ? 'research' : 'software';
    await page.waitForFunction(id => document.getElementById('tab-' + id)?.getAttribute('aria-selected') === 'true', tab);
    result.returnTab = tab;
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
