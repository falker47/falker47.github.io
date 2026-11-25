import { writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromePath, options, qaRequire } from './browser.mjs';
import { startServer } from './serve.mjs';
import { auditRoutes } from './audit-routes.mjs';
import { checkDeferred, checkLoad, isCertificateThumbnail, snapshotUrl } from '../budgets.mjs';

const load = name => import(pathToFileURL(qaRequire.resolve(name)));
// V3 floors: the home now holds every project, so mobile performance must reach 90 and desktop 95.
export const gates = { 'min-perf-mobile': 90, 'min-perf-desktop': 95, 'min-a11y': 100, 'min-bp': 95 };
// Extra Chrome flags for machines whose headless GPU stalls the main thread (for example
// QA_CHROME_FLAGS=--disable-gpu during a remote-desktop session). The report records them.
const extraFlags = (process.env.QA_CHROME_FLAGS ?? '').split(' ').filter(Boolean);

export async function runLighthouse(pages, langs, thresholds = gates, root) {
  const { default: lighthouse } = await load('lighthouse');
  const { default: desktopConfig } = await load('lighthouse/core/config/desktop-config.js');
  const { launch } = await load('chrome-launcher');
  const executable = await chromePath();
  process.env.CHROME_PATH = executable;
  const results = [];
  for (const { path: route, stub } of pages) {
    const server = await startServer({ root, holdRedirects: stub ? new Set([route]) : undefined, auditScripts: true });
    try {
      for (const lang of langs) for (const device of ['mobile', 'desktop']) {
        const row = { route, lang: lang || 'default', device, pass: false };
        results.push(row);
        let chrome;
        try {
          chrome = await launch({ chromePath: executable, chromeFlags: ['--headless=new', '--no-sandbox', ...extraFlags] });
          const url = new URL(route, server.origin);
          if (lang) url.searchParams.set('lang', lang);
          const { lhr } = await lighthouse(url.href, {
            port: chrome.port, output: 'json', logLevel: 'error',
            onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
          }, device === 'desktop' ? desktopConfig : undefined);
          if (lhr.runtimeError) throw Error(lhr.runtimeError.message);
          if (new URL(lhr.finalDisplayedUrl).pathname !== route) throw Error('Audited another document: ' + lhr.finalDisplayedUrl);
          row.scores = {};
          for (const key of ['performance', 'accessibility', 'best-practices', 'seo']) {
            const score = lhr.categories[key]?.score;
            if (typeof score !== 'number') throw Error('Missing score: ' + key);
            row.scores[key] = Math.round(score * 100);
          }
          const audits = lhr.audits;
          const requests = audits['network-requests'].details.items.filter(item => /^https?:/.test(item.url));
          row.metrics = {
            bytes: requests.reduce((total, item) => total + item.transferSize, 0), requests: requests.length,
            lcpMs: audits['largest-contentful-paint'].numericValue, cls: audits['cumulative-layout-shift'].numericValue,
            fcpMs: audits['first-contentful-paint'].numericValue, tbtMs: audits['total-blocking-time'].numericValue,
            speedIndexMs: audits['speed-index'].numericValue,
            lcpElement: audits['largest-contentful-paint-element']?.details?.items?.[0]?.items?.[0]?.node?.selector,
          };
          row.resources = requests.map(item => ({
            url: new URL(item.url).origin === server.origin ? new URL(item.url).pathname : item.url,
            bytes: item.transferSize,
          }));
          row.version = lhr.lighthouseVersion;
          if (extraFlags.length) row.chromeFlags = extraFlags;
          const bad = requests.find(item => new URL(item.url).origin !== server.origin && item.url !== snapshotUrl);
          if (bad) throw Error('Unexpected request: ' + bad.url);
          if (route === '/') {
            // V4: the certificate thumbnails prefetched after the load event have their own budget.
            const path = item => new URL(item.url).pathname;
            const later = requests.filter(item => isCertificateThumbnail(path(item)));
            const first = requests.filter(item => !isCertificateThumbnail(path(item)));
            const sum = list => list.reduce((total, item) => total + item.transferSize, 0);
            row.metrics.firstLoad = { bytes: sum(first), requests: first.length };
            row.metrics.idlePrefetch = { bytes: sum(later), requests: later.length };
            checkLoad(row.metrics.firstLoad, device + ' home');
            checkDeferred({ ...row.metrics.idlePrefetch, urls: later.map(path) }, device + ' home');
          }
          row.pass = row.scores.performance >= thresholds['min-perf-' + device] &&
            row.scores.accessibility >= thresholds['min-a11y'] && row.scores['best-practices'] >= thresholds['min-bp'];
        } catch (error) { row.error = error.message; }
        finally { if (chrome) await chrome.kill(); }
        console.log(route, row.lang, device, row.scores || {}, row.pass ? 'PASS' : 'FAIL', row.error || '');
      }
    } finally { await server.close(); }
  }
  return results;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const flags = Object.fromEntries(Object.entries(gates).map(([key, value]) => [key, { type: 'string', default: String(value) }]));
  const { pages, langs, out, values } = await options({ ...flags, runs: { type: 'string', default: '1' } });
  const thresholds = {};
  for (const key of Object.keys(gates)) {
    thresholds[key] = Number(values[key]);
    if (!Number.isFinite(thresholds[key]) || thresholds[key] < 0 || thresholds[key] > 100) throw Error('Invalid --' + key);
  }
  const available = (await auditRoutes()).routes;
  const count = Number(values.runs);
  if (!Number.isSafeInteger(count) || count < 1 || count % 2 !== 1) throw Error('Use an odd positive --runs count');
  const selection = pages.map(path => available.find(r => r.path === path) || { path });
  const attempts = [];
  for (let i = 0; i < count; i++) attempts.push(await runLighthouse(selection, langs, thresholds));
  const results = attempts[0].map((row, i) => {
    if (count === 1) return row;
    const samples = attempts.map(run => run[i]);
    const median = [...samples].sort((a, b) => (a.scores?.performance ?? 0) - (b.scores?.performance ?? 0))[Math.floor(count / 2)];
    const pass = median.pass && samples.every(s => !s.error && s.scores.accessibility >= thresholds['min-a11y'] && s.scores['best-practices'] >= thresholds['min-bp']);
    return { ...median, pass, samples };
  });
  await writeFile(join(out, 'lighthouse.json'), JSON.stringify(results, null, 2) + '\n');
  if (results.some(row => !row.pass)) process.exitCode = 1;
}
