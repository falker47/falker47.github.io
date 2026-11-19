import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { origin } from '../../src/routes.mjs';
import { fileStat, localPath, siteRoot } from './serve.mjs';

export { origin, siteRoot };

function decode(value) {
  return value.replace(/&(?:amp|quot|apos|lt|gt|#\d+|#x[\da-f]+);/gi, entity => {
    const name = entity.slice(1, -1);
    if (name[0] === '#') return String.fromCodePoint(name[1].toLowerCase() === 'x' ? parseInt(name.slice(2), 16) : Number(name.slice(1)));
    return { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' }[name] ?? entity;
  });
}

// Tokenize start tags without treating comments, script bodies or quoted '>' as markup.
export function tags(source) {
  const result = [];
  const scan = /<!--[\s\S]*?-->|<([a-z][\w:-]*)\b((?:[^<>"']|"[^"]*"|'[^']*')*)>/gi;
  for (let match; (match = scan.exec(source));) {
    if (!match[1]) continue;
    const name = match[1].toLowerCase();
    const attrs = Object.create(null);
    for (const attr of match[2].matchAll(/([^\s=/'">]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
      attrs[attr[1].toLowerCase()] = decode(attr[2] ?? attr[3] ?? attr[4] ?? '');
    }
    let body = '';
    if (['script','style','title','textarea'].includes(name)) {
      const close = new RegExp('</' + name + '\\s*>', 'ig');
      close.lastIndex = scan.lastIndex;
      const end = close.exec(source);
      if (!end) throw Error(`Unclosed <${name}>`);
      body = source.slice(scan.lastIndex, end.index);
      scan.lastIndex = close.lastIndex;
    }
    result.push({ name, attrs, body });
  }
  return result;
}

export function cssUrls(css) {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const imports = Array.from(source.matchAll(/@import\s+["']([^"']+)["']/gi), m => m[1]);
  return imports.concat(Array.from(source.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]*))\s*\)/gi),
    m => m[1] ?? m[2] ?? m[3]));
}

export function references(elements) {
  const refs = [];
  for (const { name, attrs, body } of elements) {
    for (const key of ['href', 'xlink:href', 'src', 'poster', 'action']) {
      if (key in attrs) refs.push({ value: attrs[key], navigation: name === 'a' && key === 'href' });
    }
    if (attrs.srcset) {
      // A data URL may itself contain a comma. The descriptor separates candidates.
      for (const m of attrs.srcset.matchAll(/(?:^|,\s*)(data:\S+?|[^\s,]+)(?:\s+[\d.]+[wx])?(?=\s*(?:,|$))/g)) refs.push({ value: m[1] });
    }
    if (name === 'style' || attrs.style) for (const value of cssUrls(name === 'style' ? body : attrs.style)) refs.push({ value });
    if (name === 'meta' && ['og:image','twitter:image'].includes(attrs.property || attrs.name)) refs.push({ value: attrs.content });
  }
  return refs;
}

export function routeFor(file, root = siteRoot) {
  return ('/' + relative(root, file).split(sep).join('/')).replace(/\/index\.html$/, '/');
}

export async function* walk(dir) {
  for (const item of (await readdir(dir, { withFileTypes: true })).sort((a,b) => a.name.localeCompare(b.name))) {
    const path = join(dir, item.name);
    if (item.isDirectory()) yield* walk(path);
    else if (item.isFile()) yield path;
  }
}

// These project sites share the github.io hostname but are deployed by separate repositories.
const siblingSites = new Set(['camaleonte','SOMMATRIX','ZEROfilez','IBAN-Checker','Codice-Fiscale',
  'Crack-the-Code','our-soundtrack','mauriziofalconi-ripetizioni']);

export async function openSite(root = siteRoot) {
  const map = JSON.parse(await readFile(join(root, 'data/redirects.json'), 'utf8'));
  const planned = new Set(map.redirects.map(item => item.from));
  const legacyDeployed = map.status !== 'planned' || (await fileStat(join(root, 'Nexus-portfolio')))?.isDirectory();
  const documents = new Map();

  function classify(value, base, navigation = false) {
    const url = new URL(value, new URL(base, origin));
    if (url.protocol === 'data:') return { url, kind: 'data' };
    if (url.origin !== origin) return { url, kind: 'external' };
    if (navigation && /^https?:\/\//i.test(value)) {
      if (siblingSites.has(url.pathname.split('/')[1])) return { url, kind: 'external' };
      if (!legacyDeployed && planned.has(url.pathname)) return { url, kind: 'planned' };
    }
    return { url, kind: 'internal' };
  }

  async function resolveFile(url) {
    let file = localPath(root, url.pathname);
    let info = await fileStat(file);
    if (info?.isDirectory()) {
      file = join(file, 'index.html');
      info = await fileStat(file);
    } else if (url.pathname.endsWith('/')) info = null;
    if (!info?.isFile()) throw Error(`Missing site file ${url.pathname}`);
    return file;
  }

  async function document(file) {
    if (!documents.has(file)) {
      const source = await readFile(file, 'utf8');
      const elements = tags(source);
      const ids = elements.flatMap(({attrs}) => attrs.id === undefined ? [] : [attrs.id]);
      documents.set(file, { source, elements, ids, route: routeFor(file, root) });
    }
    return documents.get(file);
  }

  async function check(ref, base) {
    const result = classify(ref.value, base, ref.navigation);
    if (result.kind !== 'internal') return result;
    const file = await resolveFile(result.url);
    const fragment = decodeURIComponent(result.url.hash.slice(1)).split(':~:text=')[0];
    if (fragment && file.endsWith('.html') && !(await document(file)).ids.includes(fragment)) {
      throw Error(`${base}: missing anchor ${result.url.pathname}#${fragment}`);
    }
    return { ...result, file };
  }
  return { root, map, classify, check, resolveFile, document };
}
