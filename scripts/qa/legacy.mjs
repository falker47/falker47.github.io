import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import map from '../../data/redirects.json' with { type: 'json' };
import manifest from '../../legacy/sha256.json' with { type: 'json' };
import { routes } from '../../src/routes.mjs';
import { legacyTarget } from '../../src/pages/redirect.mjs';
import { options, withBrowser } from './browser.mjs';
import { isolateNetwork } from './network.mjs';

const { out } = await options();
const records = [];
const declared = new Set(routes.map(route => route.path));
// A stub may add a default fragment (/projects/ → /#progetti).
const cases = map.redirects.map(({ from, to, hashMap }) => ({ from, to: legacyTarget(to, hashMap ?? {}, '', ''), sourceStatus: 200 }));
for (const { from, to, hashMap } of map.redirects) {
  for (const hash of Object.keys(hashMap ?? {})) {
    cases.push({ from: from + '?lang=en&ref=a%2Bb' + hash, to: legacyTarget(to, hashMap, '?lang=en&ref=a%2Bb', hash), sourceStatus: 200 });
  }
}
cases.push(
  { from: '/Nexus-portfolio/research.html?lang=en#paper', to: '/research/?lang=en#paper', sourceStatus: 200 },
  { from: '/Nexus-portfolio/research.html', to: '/research/', sourceStatus: 200, noScript: true },
  { from: '/Nexus-portfolio/projects/retired.html?lang=en', to: '/?lang=en#progetti', sourceStatus: 404 },
  { from: '/Nexus-portfolio/missing.html?lang=en', to: '/?lang=en', sourceStatus: 404 },
  { from: '/missing-p6-page?lang=en', to: '/missing-p6-page?lang=en', sourceStatus: 404 },
);

await withBrowser(async (browser, origin) => {
  for (const { from, to, sourceStatus, noScript = false } of cases) {
    const context = await browser.newContext({ javaScriptEnabled: !noScript, locale: 'it', serviceWorkers: 'block' });
    try {
      const verifyNetwork = await isolateNetwork(context, origin);
      const page = await context.newPage();
      const documents = [];
      page.on('response', response => {
        if (response.request().isNavigationRequest() && response.frame() === page.mainFrame()) documents.push(response);
      });
      const expected = new URL(to, origin);
      const finalStatus = sourceStatus === 200 || declared.has(expected.pathname) ? 200 : 404;
      await page.goto(origin + from, { waitUntil: 'commit' });
      await page.waitForURL(url => url.origin === origin && url.pathname === expected.pathname, { waitUntil: 'load' });
      const final = new URL(page.url());
      // Some destination layouts record their selected language in an initially bare URL.
      if (!noScript && !expected.search && final.searchParams.has('lang')) expected.searchParams.set('lang', 'it');
      assert.equal(documents[0].status(), sourceStatus, from);
      assert.equal(documents.at(-1).status(), finalStatus, to);
      assert.equal(final.href, expected.href);
      verifyNetwork();
      let note = 'location.replace';
      if (sourceStatus === 404) note = from === to ? 'Custom 404, URL retained' : '404 recovery';
      if (noScript) note = 'Native meta refresh, JavaScript disabled';
      records.push([from, sourceStatus, final.pathname + final.search + final.hash, finalStatus, note]);
    } finally { await context.close(); }
  }

  const page = await browser.newPage();
  try {
    const verifyNetwork = await isolateNetwork(page.context(), origin);
    for (const [path, digest] of Object.entries(manifest.files)) {
      const url = new URL(path, origin);
      const response = await page.goto(url.href);
      assert.equal(response.status(), 200, path);
      assert.equal(page.url(), url.href);
      assert.equal(createHash('sha256').update(await response.body()).digest('hex'), digest, path);
      records.push([path, 200, decodeURI(new URL(page.url()).pathname), 200, 'SHA-256 matches the original']);
    }
    verifyNetwork();
  } finally { await page.close(); }
});

const lines = ['# Legacy URLs in Chromium', '',
  'Paths below share the loopback origin. The server served the published files with normal scripts and automatic refresh. The native-refresh row used a JavaScript-disabled context. Each active mapped destination must return HTTP 200. Unmapped recovery probes exercise the custom 404.', '',
  '| Old URL | First HTTP | Final URL reached | Final HTTP | Mechanism |',
  '| --- | ---: | --- | ---: | --- |',
  ...records.map(([from, first, to, last, note]) => '| `' + from + '` | ' + first + ' | `' + to + '` | ' + last + ' | ' + note + ' |'), ''];
await writeFile(join(out, 'redirects.md'), lines.join('\n'));
console.log(records.length + ' browser navigations verified.');
