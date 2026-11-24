// Write data/brands.json: the platform marks drawn left of the external action buttons.
// Usage: node scripts/tools/make-brands.mjs
// Simple Icons (CC0-1.0) comes from <HOME>/qa-tools at the pinned version. Nexus Mods and
// OEIS are not in Simple Icons: their official files are read from <HOME>/sources/brand
// (see docs/unify/BRANDS.md for where each was retrieved and under which terms).
// Marks are copied as published, never redrawn. A second run leaves the file byte-identical.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const SIMPLE_ICONS_VERSION = '16.38.1';
const qaDir = process.env.QA_TOOLS_DIR || join(homedir(), 'qa-tools');
const brandDir = join(homedir(), 'sources', 'brand');
const OUTPUT = new URL('../../data/brands.json', import.meta.url);

// Hover ink: the brand colour, unless it reads below 3:1 on the card surface (#171a21).
const surface = '#171a21';
const channel = value => { const c = value / 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; };
const luminance = hex => { const n = parseInt(hex.slice(1), 16); return .2126 * channel(n >> 16) + .7152 * channel(n >> 8 & 255) + .0722 * channel(n & 255); };
export const contrast = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };
const hover = colour => contrast(colour, surface) >= 3 ? colour : '#f1f4f5';

const simple = [
  ['github', 'siGithub', 'https://github.com/logos'],
  ['googleplay', 'siGoogleplay', 'https://partnermarketinghub.withgoogle.com/brands/google-play/'],
  ['arxiv', 'siArxiv', 'https://arxiv.org/about/brand'],
  ['zenodo', 'siZenodo', 'https://about.zenodo.org'],
  ['orcid', 'siOrcid', 'https://info.orcid.org/brand-guidelines/'],
];

// Official files kept outside the repository; the hash pins the exact bytes used.
const official = {
  nexusmods: {
    title: 'Nexus Mods', file: 'nexusmods-logo-emblem.svg', sha256: '039ea05b89f10092b7b684052fa1d02832bd1a606358534ed8767c80f4888418',
    source: 'https://next.nexusmods.com/assets/images/default/logo-emblem.svg', colour: '#f97316',
    licence: 'Trademark of Black Tree Gaming Ltd; used unaltered to identify links to Nexus Mods (no licence granted).',
  },
  oeis: {
    title: 'OEIS', file: 'oeis-favicon.svg', sha256: '94f32c8db8859225dc65a159f65ac3fe7ef475440a846bc4a410c7cdaae60182',
    source: 'https://oeis.org/favicon.svg', colour: '#ffffff',
    licence: 'Mark of The OEIS Foundation Inc.; used unaltered to identify links to oeis.org (site content CC BY-SA 4.0).',
  },
};

/** The inner markup of an SVG file, with comments and the <title> removed and whitespace collapsed. */
export function svgBody(source) {
  const viewBox = /viewBox="([^"]+)"/.exec(source)?.[1];
  const inner = /<svg\b[^>]*>([^]*)<\/svg>/.exec(source)?.[1];
  if (!viewBox || inner === undefined) throw Error('Not an SVG document');
  const body = inner.replace(/<!--[^]*?-->/g, '').replace(/<title>[^]*?<\/title>/g, '').replace(/\s+/g, ' ').replace(/> </g, '><').trim();
  if (/<(?:script|foreignObject|image|use)\b|\son\w+=|href=/i.test(body)) throw Error('Unexpected content in a brand mark');
  return { viewBox, body };
}

export function makeBrands() {
  const require = createRequire(join(qaDir, 'package.json'));
  const version = JSON.parse(readFileSync(join(qaDir, 'node_modules', 'simple-icons', 'package.json'), 'utf8')).version;
  if (version !== SIMPLE_ICONS_VERSION) throw Error(`Install simple-icons@${SIMPLE_ICONS_VERSION} in ${qaDir} (found ${version})`);
  const icons = require('simple-icons');
  const marks = {};
  for (const [id, key, guidelines] of simple) {
    const icon = icons[key];
    if (!icon) throw Error('Simple Icons has no ' + key);
    const colour = '#' + icon.hex.toLowerCase();
    marks[id] = { title: icon.title, origin: 'Simple Icons ' + version, licence: 'CC0-1.0', source: icon.source, guidelines,
      colour, hover: hover(colour), viewBox: '0 0 24 24', body: `<path d="${icon.path}"/>`, mono: true };
  }
  for (const [id, entry] of Object.entries(official)) {
    const bytes = readFileSync(join(brandDir, entry.file));
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    if (sha256 !== entry.sha256) throw Error(`${entry.file}: expected SHA-256 ${entry.sha256}, found ${sha256}`);
    const { viewBox, body } = svgBody(bytes.toString('utf8'));
    marks[id] = { title: entry.title, origin: entry.source, licence: entry.licence, source: entry.source, sha256,
      colour: entry.colour, hover: hover(entry.colour), viewBox, body, mono: false };
  }
  return { simpleIcons: { version, licence: 'CC0-1.0', url: 'https://github.com/simple-icons/simple-icons' }, surface, marks };
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/tools/make-brands.mjs')) {
  const data = makeBrands();
  writeFileSync(OUTPUT, JSON.stringify(data, null, 1) + '\n');
  console.log('Wrote', Object.keys(data.marks).length, 'brand marks to data/brands.json');
}
