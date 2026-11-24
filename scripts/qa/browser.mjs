import { mkdir, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import redirectMap from '../../data/redirects.json' with { type: 'json' };
import { startServer } from './serve.mjs';

const qaDir = process.env.QA_TOOLS_DIR || join(homedir(), 'qa-tools');
export const qaRequire = createRequire(join(qaDir, 'package.json'));
export const chromePath = async () => process.env.QA_CHROME_PATH || (await readFile(join(qaDir, 'chrome-path.txt'), 'utf8')).trim();
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
  const stubPages = new Set(redirectMap.redirects.map(entry => entry.from).filter(path => pages.includes(path)));
  return { values, pages, langs, out, stubPages };
}

export async function withBrowser(callback, serverOptions) {
  const executablePath = await chromePath();
  const server = await startServer(serverOptions);
  try {
    const browser = await qaRequire('playwright').chromium.launch({ executablePath, headless: true });
    try { return await callback(browser, server.origin); }
    finally { await browser.close(); }
  } finally { await server.close(); }
}

export async function visit(page, origin, route, lang, bilingualFallback = false) {
  const url = new URL(route, origin);
  url.searchParams.set('lang', lang);
  const response = await page.goto(url.href, { waitUntil: 'networkidle' });
  if (response?.status() !== 200) throw Error(`${url.pathname} HTTP ${response?.status()}`);
  await page.evaluate(() => document.fonts.ready);
  if (new URL(page.url()).pathname !== url.pathname) throw Error('Visual audit left ' + route);
  if (bilingualFallback) {
    if (!await page.locator('.redirect-stub a[lang="' + lang + '"]').isVisible()) throw Error('Missing ' + lang + ' fallback');
  }
  if (await page.locator('html').getAttribute('lang') !== lang) throw Error(`Language did not switch to ${lang}`);
}

// Home states for review. A fragment opens its section; "#tab-…" also selects that tab.
export const homeStates = ['/#chi-sono', '/#progetti', '/#tab-modding', '/#ricerca', '/#tab-teaching', '/#certificazioni'];

/** Open a home state as a visitor would: the certificate fragment is captured with its viewer open. */
export async function visitReviewState(page, origin, route, lang, stub = false) {
  await visit(page, origin, route, lang, stub);
  const hash = route.startsWith('/#') ? route.slice(1) : '';
  if (!hash) return;
  await page.waitForFunction(() => !document.getAnimations().some(animation => animation.effect?.target?.matches?.('details')));
  if (hash.startsWith('#tab-')) await page.locator(hash).click();
  if (hash === '#certificazioni') {
    // The next card covers most of the first one: open it from the keyboard.
    await page.locator('#certificazioni .deck-card').first().press('Enter');
    await page.locator('dialog[open] .viewer-stage img').evaluate(image => image.decode());
  }
}
