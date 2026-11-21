import { stat } from 'node:fs/promises';
import { checkLoad, snapshotUrl } from '../budgets.mjs';
import { viewports, visit, withBrowser } from './browser.mjs';
import { isolateNetwork } from './network.mjs';

export async function verifyHomeLoad(site) {
  await withBrowser(async (browser, origin) => {
    for (const viewport of viewports) for (const lang of ['it', 'en']) {
      const context = await browser.newContext({ viewport, locale: lang, deviceScaleFactor: viewport.width < 600 ? 2.75 : 1,
        serviceWorkers: 'block' });
      try {
        const requests = [];
        const verify = await isolateNetwork(context, origin, requests);
        await visit(await context.newPage(), origin, '/', lang);
        verify();
        // Count each request as observed, including repeat fetches and images
        // requested by Chromium's lookahead. Use uncompressed response body bytes.
        let bytes = 0;
        for (const { url } of requests) {
          const local = url === snapshotUrl ? new URL('/data/nexus-downloads.json', origin) : new URL(url);
          bytes += (await stat(await site.resolveFile(local))).size;
        }
        const label = '/ ' + lang + ' ' + viewport.width;
        checkLoad({ bytes, requests: requests.length }, label);
        console.log(label + ': cold browser load ' + bytes + ' bytes / ' + requests.length + ' requests');
      } finally { await context.close(); }
    }
  });
}
