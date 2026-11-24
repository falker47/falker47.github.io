import assert from 'node:assert/strict';
import { stat, readFile } from 'node:fs/promises';
import { walk } from './qa/site.mjs';

const systemFamilies = new Set(['system-ui','sans-serif','serif','monospace','cursive','fantasy','ui-serif','ui-sans-serif','ui-monospace','ui-rounded','arial','helvetica','georgia','times new roman','courier new','segoe ui','sfmono-regular','menlo','monaco','consolas','inherit','initial','unset','revert','revert-layer','-apple-system','blinkmacsystemfont','helvetica neue']);
const roots = ['.site-header', '.site-footer', '.detail-top', '.detail-crumbs', '.deck', '.work'];

function rules(css) {
  // Leaf blocks also cover declarations inside media queries.
  return Array.from(css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g), ([, selector, body]) => {
    const values = new Map();
    for (const declaration of body.split(';')) {
      const colon = declaration.indexOf(':');
      if (colon >= 0) values.set(declaration.slice(0, colon).trim(), declaration.slice(colon + 1).trim());
    }
    return { selector: selector.trim(), values };
  });
}

function resolve(value, tokens, seen = new Set()) {
  return value.replace(/var\(\s*(--[\w-]+)\s*\)/g, (_, name) => {
    assert.ok(tokens.has(name) && !seen.has(name), 'Missing or cyclic CSS token ' + name);
    return resolve(tokens.get(name), tokens, new Set([...seen, name]));
  });
}

function rgb(hex, background = [0,0,0]) {
  assert.match(hex, /^#[\da-f]{6}(?:[\da-f]{2})?$/i, 'Expected a color token: ' + hex);
  const channels = hex.slice(1).match(/../g).map(x => parseInt(x,16));
  const alpha = (channels[3] ?? 255) / 255;
  return channels.slice(0,3).map((c, i) => c * alpha + background[i] * (1 - alpha));
}

function luminance(channels) {
  return channels.map(c => c / 255).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4)
    .reduce((total, value, i) => total + value * [.2126,.7152,.0722][i], 0);
}

export function checkText(text, where) {
  // Text arrows, ordinary digits and fragment identifiers are valid. Emoji
  // presentation selectors and keycap sequences still make those glyphs emoji.
  const emoji = /\p{Emoji_Presentation}|\p{Regional_Indicator}|\uFE0F|[#*0-9]\uFE0E?\u20E3/u;
  const textSymbols = text.replace(/[\u2190-\u21ff©®™]/gu, '');
  assert.ok(!emoji.test(text) && !/\p{Extended_Pictographic}/u.test(textSymbols), where + ': emoji in rendered text');
}

export async function designChecks(siteRoot, inlineCss = []) {
  const files = [];
  let bytes = 0;
  for await (const file of walk(siteRoot)) {
    if (file.endsWith('.css')) files.push(file);
    if (file.toLowerCase().endsWith('.woff2')) bytes += (await stat(file)).size;
  }
  assert.ok(bytes <= 120000, `Shipped WOFF2: ${bytes} exceeds 120000 bytes`);
  const all = rules((await Promise.all(files.map(file => readFile(file, 'utf8')))).concat(inlineCss).join('\n'));
  const tokens = new Map();
  const families = new Set(systemFamilies);
  const clean = name => name.replace(/["']/g, '').trim().toLowerCase();
  for (const { selector, values } of all) {
    if (selector === '@font-face') {
      families.add(clean(values.get('font-family')));
      assert.equal(values.get('font-display'), 'swap');
      assert.ok(values.has('unicode-range'), 'Fontsource Latin range required');
    }
    if (selector === ':root') for (const [key, value] of values) if (key.startsWith('--')) tokens.set(key, value);
  }
  const pairs = new Set();
  const darkSurfaces = ['--bg','--surface','--surface-raised','--header-bg'];
  function contrast(foreground, background, minimum = 4.5) {
    const pair = foreground + '/' + background + ' ' + minimum;
    if (pairs.has(pair)) return;
    const backdrop = rgb(resolve('var(' + background + ')', tokens), rgb(tokens.get('--bg')));
    const fg = luminance(rgb(resolve('var(' + foreground + ')', tokens), backdrop));
    const bg = luminance(backdrop);
    const ratio = (Math.max(fg, bg) + .05) / (Math.min(fg, bg) + .05);
    assert.ok(ratio >= minimum, `${pair}: ${ratio.toFixed(2)}:1 is below ${minimum}:1`);
    pairs.add(pair);
  }
  if (tokens.has('--control-line')) for (const background of darkSurfaces) {
    for (const border of ['--control-line', '--blue', '--stroke']) contrast(border, background, 3);
  }
  // Category and accent colours mark labels on every dark surface (V3).
  for (const ink of ['--accent', '--cat-app', '--cat-game', '--cat-tool', '--nexus', '--nexus-amber']) {
    if (tokens.has(ink)) for (const background of darkSurfaces) contrast(ink, background);
  }
  // A pressed category pill sets the page background colour on the panel accent.
  for (const accent of ['--blue', '--nexus']) if (tokens.has(accent)) contrast('--bg', accent);
  const covered = new Set();
  for (const { selector, values } of all) {
    let family = values.get('font-family');
    if (!family && values.has('font')) {
      const shorthand = resolve(values.get('font'), tokens);
      family = shorthand.match(/(?:^|\s)(?:[\d.]+(?:px|em|rem|%)|clamp\([^)]+\))(?:\s*\/\s*[^\s]+)?\s+(.+)$/)?.[1];
    }
    if (family) for (const name of resolve(family, tokens).split(',')) {
      assert.ok(families.has(clean(name)), `${selector}: undeclared font family ${name}`);
    }
    const foreground = values.get('color')?.match(/^var\((--[\w-]+)\)$/)?.[1];
    if (foreground) {
      const background = (values.get('background-color') || values.get('background'))?.match(/^var\((--[\w-]+)\)$/)?.[1];
      if (background) contrast(foreground, background);
      // Light ink may sit on any shared dark surface, inverse ink on a light control.
      for (const surface of foreground === '--bg' ? ['--blue','--paper'] : darkSurfaces) contrast(foreground, surface);
    }
    if (!values.has('min-height')) continue;
    const min = resolve(values.get('min-height'), tokens);
    if (/ :is\(a,\s*button\)$/.test(selector)) for (const root of roots) {
      if (selector.split(/[^.\w-]+/).includes(root)) {
        assert.ok(/^\d+(?:\.\d+)?px$/.test(min) && parseFloat(min) >= 44, `${root}: min-height ${min}`);
        covered.add(root);
      }
    }
    if (/\.(?:site-header|site-nav|site-footer|work-tabs|detail-top|detail-crumbs|card-links|picker-bar|deck)\b[^,{]*(?:\s[ab]\b|\sbutton\b)|\.(?:detail-link|site-brand|picker-toggle|rail-step|menu-button|viewer-step)\b/.test(selector) && /^\d+(?:\.\d+)?px$/.test(min)) {
      assert.ok(parseFloat(min) >= 44, `${selector}: min-height ${min}`);
    }
  }
  assert.deepEqual(covered, new Set(roots), '44px rule must cover every shared control group');
  console.log(`Validated font families, ${bytes}/120000 WOFF2 bytes, ${pairs.size} contrast pairs and 44px control rules.`);
}
