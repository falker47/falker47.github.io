// Time to visible of the certificate fan after "Chi sono" opens, on Chrome DevTools' "Fast 4G".
// Usage: node scripts/qa/cert-loading.mjs --task V4 [--label after] [--root <another built _site>] [--runs 3]
// Each run is a cold visit. Three readers: one opens the section 3 s after the page has loaded,
// one opens it at the load event, one points at the summary and opens it 300 ms later.
// The time runs from the click (the page then scrolls to the fan) to the moment every thumbnail
// in the fan has loaded and decoded.
import { writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { options, viewports, withBrowser } from './browser.mjs';
import { isolateNetwork } from './network.mjs';

const { values, out } = await options({ label: { type: 'string', default: 'after' }, root: { type: 'string' }, runs: { type: 'string', default: '3' } });
// Chromium's DevTools preset "Fast 4G" (front_end/core/sdk/NetworkManager.ts).
const fast4g = { offline: false, latency: 60 * 2.75, downloadThroughput: 9 * 1000 * 1000 / 8 * .9, uploadThroughput: 1.5 * 1000 * 1000 / 8 * .9 };
const readers = [['after 3 s', 3000, false], ['at load', 0, false], ['hover, then 300 ms', 300, true]];
const median = list => [...list].sort((a, b) => a - b)[Math.floor(list.length / 2)];

const rows = [];
await withBrowser(async (browser, origin) => {
  for (const viewport of viewports) for (const [reader, delay, hover] of readers) {
    const times = [], traces = [];
    for (let run = 0; run < Number(values.runs); run++) {
      const context = await browser.newContext({ viewport, deviceScaleFactor: viewport.width < 600 ? 2.75 : 1, locale: 'it', serviceWorkers: 'block' });
      try {
        await isolateNetwork(context, origin);
        const page = await context.newPage();
        const cdp = await context.newCDPSession(page);
        await cdp.send('Network.enable');
        await cdp.send('Network.setCacheDisabled', { cacheDisabled: false });
        await cdp.send('Network.emulateNetworkConditions', fast4g);
        await page.goto(origin + '/?lang=it', { waitUntil: 'load' });
        if (hover) await page.hover('#chi-sono > summary');
        await page.waitForTimeout(delay);
        const result = await page.evaluate(async () => {
          const images = [...document.querySelectorAll('.deck-card img')];
          const start = performance.now();
          document.querySelector('#chi-sono > summary').click();
          // The reader goes straight to the fan, which may sit below the fold on a phone.
          document.querySelector('#certificazioni .deck').scrollIntoView({ block: 'center' });
          const ready = image => image.complete && image.naturalWidth > 0;
          while (!images.every(ready)) {
            if (performance.now() - start > 30000) throw Error('The fan did not load within 30 s');
            await new Promise(next => requestAnimationFrame(next));
          }
          await Promise.all(images.map(image => image.decode().catch(() => {})));
          const end = performance.now();
          const entries = performance.getEntriesByType('resource').filter(entry => /\/assets\/certifications\/.*-thumb/.test(entry.name));
          return { ms: end - start, requests: entries.map(entry => ({ path: new URL(entry.name).pathname, startAfterClick: Math.round(entry.startTime - start), duration: Math.round(entry.duration), bytes: entry.encodedBodySize })) };
        });
        times.push(result.ms);
        traces.push(result.requests);
      } finally { await context.close(); }
    }
    const row = { viewport: viewport.width, reader, medianMs: Math.round(median(times)), runsMs: times.map(Math.round), trace: traces[0] };
    rows.push(row);
    console.log(`${values.label} ${viewport.width} ${reader}: ${row.medianMs} ms (runs ${row.runsMs.join(', ')}), ${row.trace.length} thumbnails, first starts ${Math.min(...row.trace.map(r => r.startAfterClick))} ms after the click`);
  }
}, values.root ? { root: resolve(values.root) } : undefined);
await writeFile(join(out, 'cert-loading-' + values.label + '.json'), JSON.stringify({ profile: 'Fast 4G', conditions: fast4g, rows }, null, 2) + '\n');
