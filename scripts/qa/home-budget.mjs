import { stat } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { checkDeferred, checkLoad, isCertificateThumbnail, snapshotUrl } from '../budgets.mjs';
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
        const label = '/ ' + lang + ' ' + viewport.width;
        const page = await context.newPage();
        // V4: once the page has loaded, the home prefetches the certificate thumbnails while idle.
        // They are counted on their own (checkDeferred).
        let firstLoad = null;
        page.once('load', () => { firstLoad = requests.length; });
        await visit(page, origin, '/', lang);
        verify();
        // Count each request as observed, including repeat fetches and images
        // requested by Chromium's lookahead. Use uncompressed response body bytes.
        const weigh = async list => {
          let bytes = 0;
          for (const { url } of list) {
            const local = url === snapshotUrl ? new URL('/data/nexus-downloads.json', origin) : new URL(url);
            bytes += (await stat(await site.resolveFile(local))).size;
          }
          return bytes;
        };
        // The certificate thumbnails must start after the load event; every other request,
        // including lazy pictures that start just after it, counts towards the first load.
        const thumbnail = entry => isCertificateThumbnail(new URL(entry.url).pathname);
        const early = requests.slice(0, firstLoad ?? requests.length).filter(thumbnail);
        assert.deepEqual(early.map(entry => entry.url), [], label + ': certificate thumbnails before the load event');
        const first = requests.filter(entry => !thumbnail(entry));
        const deferred = requests.filter(thumbnail);
        const bytes = await weigh(first);
        checkLoad({ bytes, requests: first.length }, label);
        const later = { bytes: await weigh(deferred), requests: deferred.length, urls: deferred.map(entry => new URL(entry.url).pathname) };
        checkDeferred(later, label);
        console.log(label + ': cold browser load ' + bytes + ' bytes / ' + first.length + ' requests; idle prefetch ' + later.bytes + ' bytes / ' + later.requests + ' requests');
      } finally { await context.close(); }
    }
  });
}
