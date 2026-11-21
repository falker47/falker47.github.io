import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromePath, options, qaRequire } from './browser.mjs';
import { startServer } from './serve.mjs';

const load = name => import(pathToFileURL(qaRequire.resolve(name)));
const { default: lighthouse } = await load('lighthouse');
const { default: desktopConfig } = await load('lighthouse/core/config/desktop-config.js');
const { launch } = await load('chrome-launcher');
const limits = { 'min-perf-mobile': 90, 'min-perf-desktop': 95, 'min-a11y': 95, 'min-bp': 95 };
const flags = Object.fromEntries(Object.entries(limits).map(([key, value]) => [key, { type: 'string', default: String(value) }]));
const { pages, langs, out, values, stubPages } = await options({ langs: { type: 'string', default: 'it' }, ...flags, runs: { type: 'string', default: '1' } });
const runs = Number(values.runs);
if (!Number.isSafeInteger(runs) || runs < 1 || runs % 2 !== 1) throw Error('Use an odd positive --runs count');
for (const key of Object.keys(limits)) {
  limits[key] = Number(values[key]);
  if (!Number.isFinite(limits[key]) || limits[key] < 0 || limits[key] > 100) throw Error(`Invalid --${key}`);
}
const executable = await chromePath();
process.env.CHROME_PATH = executable;
const server = await startServer({ holdRedirects: stubPages, auditScripts: true });
const results = [];

async function measure(route, lang, device) {
  const chrome = await launch({ chromePath: executable, chromeFlags: ['--headless=new','--no-sandbox'] });
  try {
    const url = new URL(route, server.origin);
    url.searchParams.set('lang', lang);
    const { lhr } = await lighthouse(url.href, {
      port: chrome.port, output: 'json', logLevel: 'error',
      onlyCategories: ['performance','accessibility','best-practices','seo'],
    }, device === 'desktop' ? desktopConfig : undefined);
    if (lhr.runtimeError) throw Error(lhr.runtimeError.message);
    if (new URL(lhr.finalDisplayedUrl).pathname !== route) throw Error('Lighthouse left ' + route);
    const scores = {};
    for (const [key, category] of Object.entries(lhr.categories)) {
      if (typeof category.score !== 'number') throw Error(`Missing score for ${key}`);
      scores[key] = Math.round(category.score * 100);
    }
    return scores;
  } finally { await chrome.kill(); }
}

try {
  for (const route of pages) for (const lang of langs) for (const device of ['mobile','desktop']) {
    const samples = [];
    for (let run = 0; run < runs; run++) samples.push(await measure(route, lang, device));
    // Keep a complete observed run as the representative score and retain all samples.
    const scores = [...samples].sort((a, b) => a.performance - b.performance)[Math.floor(runs / 2)];
    results.push(runs === 1 ? { route, lang, device, scores } : { route, lang, device, scores, samples });
    console.log(route, lang, device, scores, 'performance samples:', samples.map(sample => sample.performance));
    if (scores.performance < limits['min-perf-' + device] || samples.some(sample =>
      sample.accessibility < limits['min-a11y'] || sample['best-practices'] < limits['min-bp'])) process.exitCode = 1;
  }
} finally {
  await server.close();
  await writeFile(join(out, 'lighthouse.json'), JSON.stringify(results, null, 2) + '\n');
}
