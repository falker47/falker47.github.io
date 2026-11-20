import { cp, mkdir, mkdtemp, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { routes } from '../src/routes.mjs';
import { layout } from '../src/partials/layout.mjs';
import { translatedText } from '../src/lib/html.mjs';
import { formatStats } from './nexus-downloads.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const json = async name => JSON.parse(await readFile(join(root, 'data', name), 'utf8'));
const snapshot = await json('nexus-downloads.json');
const desktopSizing = await readFile(join(root, 'src/styles/desktop-visual-sizing.css'), 'utf8');
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
  await cp(join(root, 'src/client'), join(next, 'scripts'), { recursive: true });
  for (const file of ['nexus-downloads.mjs', 'animated-disclosures.js']) {
    await cp(join(root, 'scripts', file), join(next, 'scripts', file));
  }
  const inlineStyle = join(root, 'src/styles/desktop-visual-sizing.css');
  await cp(join(root, 'src/styles'), join(next, 'styles'), {
    recursive: true, filter: source => source !== inlineStyle,
  });
  for (const file of ['robots.txt', 'sitemap.xml']) await cp(join(root, file), join(next, file));
  const pages = new Set();
  if (includeStyleguide) {
    const guide = join(next, 'styleguide');
    await mkdir(guide);
    await cp(join(root, 'src/styleguide/assets'), join(guide, 'assets'), { recursive: true });
    for (const file of ['guide.css', 'guide.js']) await cp(join(root, 'src/styleguide', file), join(guide, file));
  }
  for (const route of buildRoutes) {
    if (!/^\/(?:[\w-]+\/)*(?:[\w-]+\.html)?$/.test(route.path)) throw Error(`Invalid route ${route.path}`);
    const page = resolve(next, '.' + route.path, ...(route.path.endsWith('/') ? ['index.html'] : []));
    if (pages.has(page)) throw Error(`Duplicate route ${route.path}`);
    pages.add(page);
    await mkdir(dirname(page), { recursive: true });
    const t = key => translatedText(copy.it[key]);
    await writeFile(page, layout({ route, copy, t, desktopSizing }));
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
