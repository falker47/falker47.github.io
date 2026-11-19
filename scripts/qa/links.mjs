import { readFile } from 'node:fs/promises';
import { cssUrls, openSite, origin, references } from './site.mjs';

const site = await openSite();
const queue = [
  { value: '/', base: '/' },
  { value: '/sitemap.xml', base: '/' },
  ...site.map.redirects.map(entry => ({ value: new URL(entry.from, origin).href, base: '/', navigation: true })),
];
const visited = new Set(), external = new Set(), pending = new Set(), errors = new Set();
for (let index = 0; index < queue.length; index++) {
  const ref = queue[index];
  try {
    const { kind, url, file } = await site.check(ref, ref.base);
    if (kind === 'external') { external.add(url.href); continue; }
    if (kind === 'planned') { pending.add(url.pathname); continue; }
    if (kind !== 'internal' || visited.has(file)) continue;
    visited.add(file);
    if (file.endsWith('.html')) {
      const { elements, route } = await site.document(file);
      for (const link of references(elements)) queue.push({ ...link, base: route });
    } else if (file.endsWith('.css')) {
      const css = await readFile(file, 'utf8');
      for (const value of cssUrls(css)) if (!value.startsWith('#')) queue.push({ value, base: url.pathname });
    } else if (file.endsWith('.xml')) {
      const xml = await readFile(file, 'utf8');
      for (const match of xml.matchAll(/<(?:[\w-]+:)?loc>\s*([^<]+?)\s*<\/(?:[\w-]+:)?loc>/gi)) {
        queue.push({ value: match[1].replaceAll('&amp;', '&'), base: url.pathname });
      }
    }
  } catch (error) { errors.add(`${ref.base} → ${ref.value}: ${error.message}`); }
}
console.log(`Crawled ${visited.size} local file(s).`);
for (const url of [...external].sort()) console.log(`External (unfetched) ${url}`);
for (const path of [...pending].sort()) console.log(`P6 redirect source (separate Pages site) ${path}`);
for (const message of errors) console.error(message);
if (errors.size) process.exitCode = 1;
