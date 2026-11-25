import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

export const inlineLimit = 14_000;

// Change whitespace only in ordinary text. Attribute values and whitespace-sensitive
// elements (including SVG labels and the signed desktop style) pass through verbatim.
export function minifyHtml(source) {
  const tokens = /<!--[\s\S]*?-->|<(script|style|pre|textarea|text|tspan)\b(?:[^>"']|"[^"]*"|'[^']*')*>[\s\S]*?<\/\1\s*>|<(?:[^<>"']|"[^"]*"|'[^']*')+>|[\t\n\r ]+/gi;
  return source.replace(tokens, token => token.startsWith('<!--') ? '' : token.startsWith('<') ? token : ' ').trim() + '\n';
}

const quoted = /"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'/;
export function minifyCss(source) {
  const withoutComments = source.replace(new RegExp(quoted.source + '|/\\*[\\s\\S]*?\\*/', 'g'), (token, index) => {
    if (!token.startsWith('/*')) return token;
    // Removing a separator between names would turn two CSS tokens into one.
    return /[\w-]/.test(source[index - 1] || '') && /[\w-]/.test(source[index + token.length] || '') ? '/**/' : '';
  });
  const tokens = new RegExp(quoted.source + '|\\s*([{};,])\\s*|\\s+', 'g');
  return withoutComments.replace(tokens, (token, punctuation) => {
    if (punctuation) return punctuation;
    return token.trim() ? token : ' ';
  }).trim();
}

export function minifyJs(source) {
  // Keep line terminators (ASI), identifiers and expressions. A template or a
  // continued string may contain significant indentation, so leave its suffix intact.
  const sensitive = /^[^\n]*(?:`|\/\*|\\\r?$)/m.exec(source);
  const split = sensitive?.index ?? source.length;
  const simple = source.slice(0, split);
  // Only erase standalone comments. Inline slashes may belong to a regexp or a URL.
  return simple.replace(/^[\t ]*\/\/[^\r\n]*(?:\r?\n|$)/gm, '')
    .replace(/^[\t ]+/gm, '').replace(/\n{2,}/g, '\n') + source.slice(split);
}

export function buildAssets(root, output) {
  const emitted = new Set();
  const load = path => readFile(join(root, path), 'utf8');
  async function stylesheet(source) {
    const hash = createHash('sha256').update(source).digest('hex').slice(0, 16);
    const path = '/styles/site-' + hash + '.css';
    if (!emitted.has(path)) {
      const file = join(output, path);
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, source);
      emitted.add(path);
    }
    return path;
  }

  async function styles(route, desktopSizing) {
    const urls = ['/styles/tokens.css', '/styles/base.css', ...(route.styles || []), '/styles/components.css'];
    const sheets = await Promise.all(urls.map(async url => {
      const css = await load('src' + url);
      // Preserve the base URL of relative assets after inlining or moving a stylesheet.
      const urlToken = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)'" ]+))\s*\)/;
      const tokens = new RegExp(quoted.source + '|/\\*[\\s\\S]*?\\*/|' + urlToken.source, 'gi');
      const rebased = css.replace(tokens, (token, double, single, bare) => {
        if (double === undefined && single === undefined && bare === undefined) return token;
        const ref = (double ?? single ?? bare).trim();
        if (/^(?:[/#]|[a-z][\w+.-]*:)/i.test(ref)) return token;
        const resolved = new URL(ref, 'https://site.invalid' + url);
        return 'url("' + resolved.pathname + resolved.search + resolved.hash + '")';
      });
      return minifyCss(rebased);
    }));
    const css = sheets.join('');
    const protectedBytes = route.path === '/' ? Buffer.byteLength(desktopSizing) : 0;
    if (Buffer.byteLength(css) + protectedBytes <= inlineLimit) return '<style>' + css + '</style>';
    // Inline the longest complete prefix that fits. The original cascade is
    // preserved, and small route layouts can paint before shared controls arrive.
    let index = 0, used = protectedBytes;
    while (index < sheets.length && used + Buffer.byteLength(sheets[index]) <= inlineLimit) {
      used += Buffer.byteLength(sheets[index]);
      index++;
    }
    const initial = sheets.slice(0, index).join('');
    const path = await stylesheet(sheets.slice(index).join(''));
    const critical = initial ? '<style>' + initial + '</style>' : '';
    // Fetch a single content-addressed sheet. The native stylesheet applies the
    // complete layout before paint and also works when scripting is disabled.
    return critical + '<link rel="preload" as="style" href="' + path + '"><link rel="stylesheet" href="' + path + '">';
  }

  async function scripts(paths) {
    const sources = await Promise.all(paths.map(path => readFile(join(output, path), 'utf8')));
    // Separate classic scripts even when the previous one ends without a semicolon.
    // These clients are self-contained IIFEs. A module is deferred even inline.
    // Keeping it in the HTML avoids another round trip before panels and language initialize.
    return sources.join('\n;\n').replace(/<\/script/gi, match => '<\\/' + match.slice(2));
  }
  return { styles, scripts };
}
