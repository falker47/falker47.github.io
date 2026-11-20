import { mkdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { startServer } from './serve.mjs';

const qaDir = join(homedir(), 'qa-tools');
export const qaRequire = createRequire(join(qaDir, 'package.json'));
export const chromePath = async () => (await readFile(join(qaDir, 'chrome-path.txt'), 'utf8')).trim();
export const viewports = [{ width: 1440, height: 900 }, { width: 390, height: 844 }];

export async function options(extra = {}) {
  const { values } = parseArgs({ options: {
    task: { type: 'string' }, pages: { type: 'string', default: '/' },
    langs: { type: 'string', default: 'it,en' }, ...extra,
  } });
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(values.task || '')) throw Error('Provide --task ID');
  const pages = values.pages.split(',');
  const langs = values.langs.split(',');
  if (pages.some(page => !/^\/(?:[\w-]+\/)*(?:[\w-]+\.html)?(?:#[\w-]+)?$/.test(page))) throw Error('Use comma-separated site routes');
  if (langs.some(lang => !['it','en'].includes(lang))) throw Error('Use it or en for --langs');
  const out = fileURLToPath(new URL(`../../_review/${values.task}/`, import.meta.url));
  await mkdir(out, { recursive: true });
  return { values, pages, langs, out };
}

export async function withBrowser(callback) {
  const executablePath = await chromePath();
  const server = await startServer();
  try {
    const browser = await qaRequire('playwright').chromium.launch({ executablePath, headless: true });
    try { return await callback(browser, server.origin); }
    finally { await browser.close(); }
  } finally { await server.close(); }
}

export async function visit(page, origin, route, lang) {
  const url = new URL(route, origin);
  url.searchParams.set('lang', lang);
  const response = await page.goto(url.href, { waitUntil: 'networkidle' });
  if (response?.status() !== 200) throw Error(`${url.pathname} HTTP ${response?.status()}`);
  await page.evaluate(() => document.fonts.ready);
  if (await page.locator('html').getAttribute('lang') !== lang) throw Error(`Language did not switch to ${lang}`);
}
