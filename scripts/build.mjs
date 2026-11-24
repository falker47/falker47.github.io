import { cp, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAssets, minifyHtml, minifyJs } from './build-assets.mjs';
import { routes } from '../src/routes.mjs';
import { redirectPage } from '../src/pages/redirect.mjs';
import { contentDate, sitemap } from '../src/lib/sitemap.mjs';
import { layout } from '../src/partials/layout.mjs';
import { translatedText } from '../src/lib/html.mjs';
import { formatStats } from './nexus-downloads.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const json = async name => JSON.parse(await readFile(join(root, 'data', name), 'utf8'));
const snapshot = await json('nexus-downloads.json');
const desktopSizing = await readFile(join(root, 'src/styles/desktop-visual-sizing.css'), 'utf8');
const favicon = 'data:image/webp;base64,' + (await readFile(join(root, 'assets/images/favicon-32.webp'))).toString('base64');
const copy = {};
for (const lang of ['it', 'en']) {
  const dictionary = await json(`i18n/${lang}.json`);
  const { counter } = formatStats(snapshot.uniqueModDownloads, lang);
  dictionary.moddingNumber = dictionary.moddingNumber.replace('{count}', counter);
  dictionary.modProof = dictionary.modProof.replace('{count}', counter);
  const mods = new Intl.NumberFormat(lang === 'it' ? 'it-IT' : 'en-US').format(snapshot.modCount);
  dictionary.nexusModCount = dictionary.nexusModCount.replace('{count}', mods);
  copy[lang] = dictionary;
}

function pageFile(dir, path) {
  if (!/^\/(?:[\w-]+\/)*(?:[\w-]+\.html)?$/.test(path)) throw Error(`Invalid route ${path}`);
  return resolve(dir, '.' + path, ...(path.endsWith('/') ? ['index.html'] : []));
}

const includeStyleguide = process.argv.slice(2).includes('--styleguide');
const buildRoutes = includeStyleguide ? [...routes, (await import('../src/styleguide/page.mjs')).styleguide] : routes;
const output = join(root, '_site');
const staging = await mkdtemp(join(root, '.site-build-'));
const next = join(staging, 'next');
const prior = join(staging, 'prior');
let priorNeedsRestore = false;
try {
  await mkdir(next);
  await cp(join(root, 'assets'), join(next, 'assets'), { recursive: true });
  await cp(join(root, 'data'), join(next, 'data'), { recursive: true });
  const assets = buildAssets(root, next);
  async function copyScript(from, to) {
    const target = join(next, to);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, minifyJs(await readFile(join(root, from), 'utf8')));
  }
  for (const file of await readdir(join(root, 'src/client'))) await copyScript('src/client/' + file, 'scripts/' + file);
  for (const file of ['nexus-downloads.mjs', 'animated-disclosures.js']) await copyScript('scripts/' + file, 'scripts/' + file);
  await cp(join(root, 'robots.txt'), join(next, 'robots.txt'));
  const template = await readFile(join(root, 'sitemap.xml'), 'utf8');
  await writeFile(join(next, 'sitemap.xml'), sitemap(template, routes, await contentDate(root)));
  await cp(join(root, 'legacy/Nexus-portfolio/assets'), join(next, 'Nexus-portfolio/assets'), { recursive: true });
  const pages = new Set();
  if (includeStyleguide) {
    const guide = join(next, 'styleguide');
    await mkdir(guide);
    await copyScript('src/styleguide/guide.js', 'styleguide/guide.js');
  }
  for (const route of buildRoutes) {
    const page = pageFile(next, route.path);
    if (pages.has(page)) throw Error(`Duplicate route ${route.path}`);
    pages.add(page);
    await mkdir(dirname(page), { recursive: true });
    const t = key => translatedText(copy.it[key]);
    const styles = await assets.styles(route, desktopSizing);
    const document = await layout({ route, copy, t, desktopSizing, styles, favicon }, assets.scripts);
    await writeFile(page, minifyHtml(document));
  }
  const stubs = new Map();
  const stubStyles = await assets.styles({ styles: ['/styles/status.css'] }, '');
  for (const entry of (await json('redirects.json')).redirects) {
    // Stubs: the old portfolio's pages and /projects/, whose projects now live in the home.
    if (!(entry.from.startsWith('/Nexus-portfolio/') || entry.from === '/projects/') || entry.to.startsWith('/Nexus-portfolio/')) {
      throw Error(`Unexpected legacy mapping ${entry.from} → ${entry.to}`);
    }
    pageFile(next, entry.to);
    const file = pageFile(next, entry.from);
    const markup = minifyHtml(redirectPage(entry, copy, stubStyles));
    if (pages.has(file)) throw Error(`A stub would replace the page ${entry.from}`);
    if (stubs.has(file) && stubs.get(file) !== markup) throw Error(`Conflicting legacy aliases: ${entry.from}`);
    stubs.set(file, markup);
  }
  for (const [file, markup] of stubs) {
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, markup, { flag: 'wx' });
    pages.add(file);
  }
  // Publish only complete builds. Keep the last good tree if the final rename fails.
  try { await rename(output, prior); priorNeedsRestore = true; }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  try { await rename(next, output); }
  catch (error) {
    if (priorNeedsRestore) {
      await rename(prior, output);
      priorNeedsRestore = false;
    }
    throw error;
  }
  priorNeedsRestore = false;
  console.log(`Built ${pages.size} page(s) in _site.`);
} finally {
  if (!priorNeedsRestore) await rm(staging, { recursive: true, force: true });
}
