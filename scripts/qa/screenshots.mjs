import { join } from 'node:path';
import { options, viewports, visit, withBrowser } from './browser.mjs';

const { pages, langs, out } = await options();
await withBrowser(async (browser, origin) => {
  for (const route of pages) for (const lang of langs) for (const viewport of viewports) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce', locale: lang });
    try {
      await visit(page, origin, route, lang);
      const slug = route === '/' ? 'home' : route.replace(/^\/|\/$/g, '').replaceAll('/', '-');
      for (const fullPage of [false, true]) {
        const name = `${slug}-${lang}-${viewport.width}${fullPage ? '-full' : ''}.png`;
        await page.screenshot({ path: join(out, name), fullPage });
        console.log(name);
      }
    } finally { await page.close(); }
  }
});
