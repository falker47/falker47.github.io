import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { cssUrls, origin, tags } from './qa/site.mjs';

export const limits = { pageBytes: 160_000, homeBytes: 450_000, homeRequests: 15 };
export const snapshotUrl = 'https://raw.githubusercontent.com/falker47/falker47.github.io/main/data/nexus-downloads.json';

export function checkLoad({ bytes, requests }, label = '/') {
  assert.ok(bytes <= limits.homeBytes, label + ': ' + bytes + ' first-load bytes exceed ' + limits.homeBytes);
  assert.ok(requests <= limits.homeRequests, label + ': ' + requests + ' first-load requests exceed ' + limits.homeRequests);
}

export async function pageBudget(site, { route, source, elements }) {
  const page = new URL(route, origin);
  const code = new Set([page.href]);
  const styles = [];
  const first = new Set();
  const link = (value, base = page) => new URL(value, base).href;
  for (const { name, attrs, body } of elements) {
    if (name === 'style') styles.push({ css: body, base: page });
    if (name === 'script' && attrs.src) code.add(link(attrs.src));
    if (name !== 'link' || !attrs.href) continue;
    const href = link(attrs.href);
    if (attrs.rel === 'stylesheet' || (attrs.rel === 'preload' && attrs.as === 'style')) {
      if (!code.has(href)) styles.push({ css: await readFile(await site.resolveFile(new URL(href)), 'utf8'), base: href });
      code.add(href);
    } else if (attrs.rel === 'modulepreload' || (attrs.rel === 'preload' && attrs.as === 'script')) code.add(href);
    if (!href.startsWith('data:') && ['icon', 'preload', 'modulepreload'].includes(attrs.rel)) first.add(href);
  }
  for (const { css, base } of styles) {
    assert.doesNotMatch(css, /@import\s/i, route + ': list CSS imports in route.styles so the build can bundle them');
    for (const ref of cssUrls(css)) {
      const url = new URL(ref, base);
      if (url.protocol === 'data:') continue;
      assert.equal(url.origin, origin, route + ': external stylesheet resource ' + url.href);
      if (url.pathname.endsWith('.woff2')) first.add(url.href);
    }
  }
  async function size(urls) {
    let bytes = 0;
    for (const href of urls) {
      const file = await site.resolveFile(new URL(href === snapshotUrl ? '/data/nexus-downloads.json' : href, origin));
      bytes += (await stat(file)).size;
    }
    return bytes;
  }
  const bytes = await size(code);
  assert.ok(bytes <= limits.pageBytes, route + ': ' + bytes + ' HTML+CSS+JS bytes exceed ' + limits.pageBytes);
  if (route !== '/') return { bytes, styles };
  for (const href of code) first.add(href);
  first.add(snapshotUrl);
  // Count all declared priorities plus images in the masthead and hero, including
  // lazy ones. The browser audit additionally counts speculative and dynamic requests.
  const hero = source.match(/<section\b[^>]*class="[^"]*\bhero\b[^"]*"[^>]*>[\s\S]*?<\/section>/i)?.[0] || '';
  const header = source.match(/<header\b[^>]*>[\s\S]*?<\/header>/i)?.[0] || '';
  const images = [...tags(header + hero), ...elements.filter(e => e.name === 'img' && e.attrs.loading !== 'lazy')];
  // Count one candidate per picture, the largest available resource by bytes.
  let candidates = [];
  for (const { name, attrs } of images) {
    if (name === 'source' && attrs.srcset) candidates.push(...attrs.srcset.split(','));
    if (name !== 'img' || !attrs.src) continue;
    candidates.push(...(attrs.srcset || '').split(','), attrs.src);
    const urls = [...new Set(candidates.map(v => v.trim().split(/\s+/)[0]).filter(v => v && !v.startsWith('data:')).map(v => link(v)))];
    candidates = [];
    if (urls.length) {
      const sizes = await Promise.all(urls.map(url => size([url])));
      first.add(urls[sizes.indexOf(Math.max(...sizes))]);
    }
  }
  const load = { bytes: await size(first), requests: first.size };
  checkLoad(load);
  return { bytes, styles, load };
}
