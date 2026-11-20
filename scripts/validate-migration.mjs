import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { origin, routes } from '../src/routes.mjs';
import { indexable } from '../src/lib/sitemap.mjs';
import { decode } from './qa/site.mjs';

function hasNoindex(elements) {
  return elements.some(({ name, attrs }) => name === 'meta' && attrs.name?.toLowerCase() === 'robots'
    && /\b(?:noindex|none)\b/i.test(attrs.content));
}

export function validateCanonical(elements, route, redirect) {
  const links = elements.filter(e => e.name === 'link' && e.attrs.rel?.split(/\s+/).includes('canonical'));
  assert.equal(links.length, 1, route + ': one canonical');
  const expected = origin + (redirect?.to ?? route);
  assert.equal(links[0].attrs.href, expected, route + ': canonical');
  if (!redirect) return;
  assert.ok(!hasNoindex(elements), route + ': redirect must be indexable');
  const refresh = elements.filter(e => e.name === 'meta' && e.attrs['http-equiv']?.toLowerCase() === 'refresh');
  assert.equal(refresh.length, 1, route + ': one refresh');
  const target = /^0\s*;\s*url\s*=\s*(\S+)\s*$/i.exec(refresh[0].attrs.content)?.[1];
  assert.ok(target && new URL(target, origin + route).href === expected, route + ': immediate refresh must match canonical');
  assert.ok(elements.slice(0, elements.indexOf(refresh[0])).some(e => e.name === 'script' && !e.attrs.src
    && e.body.includes('location.replace(')), route + ': inline replacement before refresh');
}

export async function validateSitemap(site, xml, declared = routes) {
  const listed = [];
  const content = xml.replace(/<!--[\s\S]*?-->/g, '');
  for (const record of content.matchAll(/<url\b[^>]*>([\s\S]*?)<\/url\s*>/g)) {
    const locations = [...record[1].matchAll(/<loc\b[^>]*>\s*([^<]+?)\s*<\/loc\s*>/g)];
    assert.equal(locations.length, 1, 'One page location per sitemap record');
    const url = new URL(decode(locations[0][1]));
    assert.equal(url.href, origin + url.pathname, 'Canonical sitemap origin and path');
    const page = await site.document(await site.resolveFile(url));
    assert.equal(page.route, url.pathname, url.pathname + ': canonical page path');
    validateCanonical(page.elements, page.route);
    assert.ok(!hasNoindex(page.elements), url.pathname + ': noindex page in sitemap');
    const date = record[1].match(/<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/)?.[1];
    assert.ok(date && new Date(date).toISOString().startsWith(date + 'T'), url.pathname + ': valid lastmod');
    listed.push(url.pathname);
  }
  assert.equal([...content.matchAll(/<loc\b/g)].length, listed.length, 'Page locations must belong to a sitemap record');
  assert.deepEqual(listed.sort(), declared.filter(indexable).map(route => route.path).sort(),
    'Sitemap must contain each indexable route exactly once');
}

export async function validateMigration(site) {
  for (const redirect of site.map.redirects) {
    const source = await site.resolveFile(new URL(redirect.from, origin));
    validateCanonical((await site.document(source)).elements, redirect.from, redirect);
    if (routes.some(route => route.path === redirect.to)) await site.resolveFile(new URL(redirect.to, origin));
    else console.warn(`Pending route ${redirect.to} (${redirect.from}): not declared in src/routes.mjs`);
  }
  await validateSitemap(site, await readFile(join(site.root, 'sitemap.xml'), 'utf8'));
  const directives = (await readFile(join(site.root, 'robots.txt'), 'utf8')).split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  assert.deepEqual(directives, ['User-agent: *', 'Allow: /', 'Sitemap: ' + origin + '/sitemap.xml']);
}
