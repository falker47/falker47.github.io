import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { options, viewports, visit, withBrowser } from './browser.mjs';
import { isolateNetwork } from './network.mjs';

const { pages, langs, out } = await options();
const sessions = [];
try {
  await withBrowser(async (browser, origin) => {
    for (const route of pages) for (const lang of langs) for (const viewport of viewports) {
      const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: 'reduce', locale: lang, serviceWorkers: 'block' });
      const requests = [];
      sessions.push({ route, lang, viewport, requests });
      try {
        const verifyNetwork = await isolateNetwork(context, origin, requests);
        const page = await context.newPage();
        await visit(page, origin, route, lang);
        const slug = route === '/' ? 'home' : route.replace(/^\/|\/$/g, '').replaceAll('/', '-');
        for (const fullPage of [false, true]) {
          const name = `${slug}-${lang}-${viewport.width}${fullPage ? '-full' : ''}.png`;
          await page.screenshot({ path: join(out, name), fullPage });
          console.log(name);
        }
        verifyNetwork();
        if (route === '/') assert.ok(requests.some(r => r.disposition.startsWith('fulfilled')), 'Home must fetch the intercepted production snapshot');
      } finally { await context.close(); }
    }
  });
} finally {
  await writeFile(join(out, 'network.json'), JSON.stringify(sessions, null, 2) + '\n');
}
