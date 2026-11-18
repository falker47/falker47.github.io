// Generates the static English page (en/index.html) and sitemap.xml from index.html + assets/app.js.
// index.html (Italian) is the source of truth; run `node scripts/build-site.mjs` after editing it.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const ORIGIN = 'https://falker47.github.io';
const root = new URL('../', import.meta.url);
const read = path => readFileSync(new URL(path, root), 'utf8');

export function readCopy() {
  return JSON.parse(read('assets/app.js').match(/const copy=(\{[^\n]*\});/)[1]);
}

const escapeText = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttr = value => escapeText(value).replace(/"/g, '&quot;');

/** Replace the content of the element opened at `start` (end of its opening tag) with `html`. */
function replaceContent(source, tag, openEnd, html) {
  const re = new RegExp(`<(/?)${tag}\\b[^>]*?(/?)>`, 'g');
  re.lastIndex = openEnd;
  let depth = 1, match;
  while ((match = re.exec(source))) {
    if (match[2]) continue; // self-closing
    depth += match[1] ? -1 : 1;
    if (!depth) return { source: source.slice(0, openEnd) + html + source.slice(match.index), next: openEnd + html.length };
  }
  throw new Error('Unclosed <' + tag + '>');
}

/** Apply the inline translation table to every data-i18n / data-label node, as the browser did at runtime. */
export function localize(html, lang, copy = readCopy()) {
  const strings = copy[lang];
  let out = html, from = 0, match;
  const open = /<([a-zA-Z][\w:-]*)\b[^>]*?\sdata-i18n="([^"]+)"[^>]*>/g;
  while (true) {
    open.lastIndex = from;
    match = open.exec(out);
    if (!match) break;
    const [, tag, key] = match;
    if (typeof strings[key] !== 'string') throw new Error(`Missing ${lang} translation: ${key}`);
    const text = key === 'headlineStart' ? strings[key] : escapeText(strings[key]);
    const result = replaceContent(out, tag, match.index + match[0].length, text);
    out = result.source;
    from = result.next;
  }
  return out.replace(/(<[^>]*?\sdata-label="([^"]+)"[^>]*?\saria-label=")[^"]*(")/g, (all, head, key, tail) => head + escapeAttr(strings[key]) + tail)
            .replace(/(<[^>]*?\saria-label=")[^"]*("[^>]*?\sdata-label="([^"]+)")/g, (all, head, tail, key) => head + escapeAttr(strings[key]) + tail);
}

export function buildEnglish(html, copy = readCopy()) {
  const en = copy.en;
  let out = localize(html, 'en', copy);
  const swap = (pattern, replacement) => {
    if (!pattern.test(out)) throw new Error('Pattern not found: ' + pattern);
    out = out.replace(pattern, replacement);
  };
  swap(/<html lang="it"/, '<html lang="en"');
  swap(/(<meta name="description" content=")[^"]*"/, `$1${escapeAttr(en.intro)}"`);
  swap(/(<meta property="og:description" content=")[^"]*"/, `$1${escapeAttr(en.intro)}"`);
  swap(/(<meta name="twitter:description" content=")[^"]*"/, `$1${escapeAttr(en.intro)}"`);
  swap(/(<link rel="canonical" href=")[^"]*"/, `$1${ORIGIN}/en/"`);
  swap(/(<meta property="og:url" content=")[^"]*"/, `$1${ORIGIN}/en/"`);
  swap(/(<meta property="og:locale" content=")[^"]*"/, '$1en_US"');
  swap(/(<meta property="og:locale:alternate" content=")[^"]*"/, '$1it_IT"');
  // Structured data: same entities, English description and page URL.
  swap(/("@type": "ProfilePage",\s*"@id": "[^"]*",\s*"url": ")[^"]*"/, `$1${ORIGIN}/en/"`);
  swap(/("@type": "Person"[\s\S]*?"description": ")[^"]*"/, `$1${en.intro.replace(/"/g, '\\"')}"`);
  swap(/("@type": "ProfilePage",)/, '$1\n      "inLanguage": "en",');
  return out;
}

function lastModified(paths) {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cs', '--', ...paths], { cwd: root, encoding: 'utf8' }).trim() || null;
  } catch { return null; }
}

export function buildSitemap(lastmod) {
  const alt = (lang, href) => `      <xhtml:link rel="alternate" hreflang="${lang}" href="${href}"/>`;
  const entry = href => `  <url>
    <loc>${href}</loc>
    <lastmod>${lastmod}</lastmod>
${alt('it', ORIGIN + '/')}
${alt('en', ORIGIN + '/en/')}
${alt('x-default', ORIGIN + '/')}
  </url>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entry(ORIGIN + '/')}
${entry(ORIGIN + '/en/')}
</urlset>
`;
}

if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  const italian = read('index.html');
  mkdirSync(new URL('en/', root), { recursive: true });
  writeFileSync(new URL('en/index.html', root), buildEnglish(italian));
  const lastmod = lastModified(['index.html', 'assets', 'en']) || new Date().toISOString().slice(0, 10);
  writeFileSync(new URL('sitemap.xml', root), buildSitemap(lastmod));
  console.log('Built en/index.html and sitemap.xml (lastmod ' + lastmod + ')');
}
