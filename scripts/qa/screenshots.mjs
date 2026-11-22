import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { options, qaRequire, viewports, visitReviewState, withBrowser } from './browser.mjs';
import { isolateNetwork } from './network.mjs';

const { pages, langs, out, values, stubPages } = await options({ format: { type: 'string', default: 'png' } });
if (!['png', 'webp'].includes(values.format)) throw Error('Use --format png or webp');
const sharp = values.format === 'webp' ? qaRequire('sharp') : null;

async function saveWebp(png, name, route, fullPage) {
  // Full pages get 200 KB per 3,000 px of height (long catalogues such as /projects/).
  const { height } = await sharp(png).metadata();
  const limit = route !== '/' && fullPage ? 200 * 1024 * Math.max(1, Math.ceil(height / 3000)) : 300_000;
  const qualities = route === '/' ? [100] : [80, 70, 60, 50, 40, 35, 30, 25, 20];
  for (const quality of qualities) {
    const bytes = await sharp(png).webp({ lossless: route === '/', quality, effort: 6 }).toBuffer();
    if (bytes.length <= limit) return writeFile(join(out, name), bytes);
  }
  throw Error('Screenshot exceeds its byte budget: ' + name);
}

async function loadCatalogueImages(page, selector) {
  await page.locator(selector).evaluateAll(async images => {
    for (const image of images) {
      image.closest('picture')?.querySelector('source[data-preview]')?.remove();
      image.loading = 'eager';
    }
    await Promise.all(images.map(image => image.decode()));
  });
}
const sessions = [];
try {
  await withBrowser(async (browser, origin) => {
    for (const route of pages) for (const lang of langs) for (const viewport of viewports) {
      const context = await browser.newContext({ viewport, javaScriptEnabled: true, deviceScaleFactor: 1, reducedMotion: 'reduce', locale: lang, serviceWorkers: 'block' });
      const requests = [];
      sessions.push({ route, lang, viewport, javaScriptEnabled: true, requests });
      try {
        const verifyNetwork = await isolateNetwork(context, origin, requests);
        const page = await context.newPage();
        await visitReviewState(page, origin, route, lang, stubPages.has(route));
        const slug = route === '/#certificazioni' ? 'home-certificate-dialog' : route === '/' ? 'home' :
          route.replace(/^\/#/, 'home-').replace(/^\/|\/(?=#|$)/g, '').replace(/[/#]/g, '-');
        // Capture the pair back-to-back, before compression can affect offscreen image painting.
        const captures = [];
        for (const fullPage of [false, true]) {
          if (fullPage && route.startsWith('/#') && route !== '/#certificazioni') await page.evaluate(() => scrollTo(0, 0));
          if (fullPage && route === '/styleguide/') await loadCatalogueImages(page, 'img[src]');
          if (fullPage && route !== '/styleguide/') await loadCatalogueImages(page, 'img[src]:visible');
          const name = `${slug}-${lang}-${viewport.width}${fullPage ? '-full' : ''}.${values.format}`;
          const png = await page.screenshot({ fullPage, path: sharp ? undefined : join(out, name) });
          if (sharp) captures.push({ png, name, fullPage });
          console.log(name);
        }
        for (const { png, name, fullPage } of captures) await saveWebp(png, name, route, fullPage);
        verifyNetwork();
        if (route === '/') assert.ok(requests.some(r => r.disposition.startsWith('fulfilled')), 'Home must fetch the intercepted production snapshot');
      } finally { await context.close(); }
    }
  }, { holdRedirects: stubPages, auditScripts: true });
} finally {
  await writeFile(join(out, 'network.json'), JSON.stringify(sessions, null, 2) + '\n');
}
