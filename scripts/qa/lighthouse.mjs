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
const { pages, langs, out, values, stubPages } = await options({ langs: { type: 'string', default: 'it' }, ...flags });
for (const key of Object.keys(limits)) {
  limits[key] = Number(values[key]);
  if (!Number.isFinite(limits[key]) || limits[key] < 0 || limits[key] > 100) throw Error(`Invalid --${key}`);
}
const executable = await chromePath();
process.env.CHROME_PATH = executable;
const server = await startServer({ holdRedirects: stubPages, auditScripts: true });
const results = [];
try {
  for (const route of pages) for (const lang of langs) for (const device of ['mobile','desktop']) {
    const chrome = await launch({ chromePath: executable, chromeFlags: ['--headless=new','--no-sandbox'] });
    try {
      const url = new URL(route, server.origin);
      url.searchParams.set('lang', lang);
      const { lhr } = await lighthouse(url.href, {
        port: chrome.port, output: 'json', logLevel: 'error',
        onlyCategories: ['performance','accessibility','best-practices'],
      }, device === 'desktop' ? desktopConfig : undefined);
      if (lhr.runtimeError) throw Error(lhr.runtimeError.message);
      if (new URL(lhr.finalDisplayedUrl).pathname !== route) throw Error('Lighthouse left ' + route);
      const scores = {};
      for (const [key, category] of Object.entries(lhr.categories)) {
        if (typeof category.score !== 'number') throw Error(`Missing score for ${key}`);
        scores[key] = Math.round(category.score * 100);
      }
      results.push({ route, lang, device, scores });
      console.log(route, lang, device, scores);
      if (scores.performance < limits['min-perf-' + device] || scores.accessibility < limits['min-a11y']
          || scores['best-practices'] < limits['min-bp']) process.exitCode = 1;
    } finally { await chrome.kill(); }
  }
} finally {
  await server.close();
  await writeFile(join(out, 'lighthouse.json'), JSON.stringify(results, null, 2) + '\n');
}
