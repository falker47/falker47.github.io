// Put each reference screenshot of the approved prototype beside the matching capture.
// Usage: node scripts/qa/side-by-side.mjs --task V3 --reference <folder with ref/*.webp>
// Left: the prototype. Right: this build (Italian). Both keep their own pixels; nothing is scaled.
import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { options, qaRequire } from './browser.mjs';

const { out, values } = await options({ reference: { type: 'string' } });
if (!values.reference) throw Error('Provide --reference PATH (the folder that holds the prototype screenshots)');
const sharp = qaRequire('sharp');
const reference = resolve(values.reference);

// Prototype screenshot → capture of this build, as written by screenshots.mjs --format webp.
const pairs = [
  ['desktop-hero', 'home-it-1440'],
  ['desktop-chi-sono', 'home-chi-sono-it-1440-full'],
  ['desktop-software', 'home-progetti-it-1440-full'],
  ['desktop-modding', 'home-tab-modding-it-1440-full'],
  ['desktop-ricerca', 'home-ricerca-it-1440-full'],
  ['mobile-chi-sono', 'home-chi-sono-it-390-full'],
  ['mobile-software', 'home-progetti-it-390-full'],
  ['mobile-modding', 'home-tab-modding-it-390-full'],
  ['mobile-ricerca', 'home-ricerca-it-390-full'],
  ['mobile-visore', 'home-certificate-dialog-it-390'],
];
const gap = 24, band = 34, background = { r: 15, g: 16, b: 20, alpha: 1 };
const caption = (text, width) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${band}"><rect width="100%" height="100%" fill="#0c0d11"/><text x="12" y="22" font-family="Segoe UI, Arial, sans-serif" font-size="14" fill="#d8dee9">${text}</text></svg>`);

const rows = [];
for (const [before, after] of pairs) {
  const left = sharp(await readFile(join(reference, before + '.webp')));
  const right = sharp(await readFile(join(out, after + '.webp')));
  const [a, b] = [await left.metadata(), await right.metadata()];
  const height = Math.max(a.height, b.height) + band;
  const image = await sharp({ create: { width: a.width + gap + b.width, height, channels: 4, background } }).composite([
    { input: caption('Prototype · ' + before + ' (' + a.width + '×' + a.height + ')', a.width), left: 0, top: 0 },
    { input: caption('V3 build · ' + after + ' (' + b.width + '×' + b.height + ')', b.width), left: a.width + gap, top: 0 },
    { input: await left.toBuffer(), left: 0, top: band },
    { input: await right.toBuffer(), left: a.width + gap, top: band },
  ]).webp({ quality: 72, effort: 5 }).toBuffer();
  const name = 'compare-' + before + '.webp';
  await writeFile(join(out, name), image);
  rows.push({ prototype: before, capture: after, file: name, prototypeSize: [a.width, a.height], captureSize: [b.width, b.height], bytes: image.length });
  console.log(name, image.length);
}
await writeFile(join(out, 'side-by-side.json'), JSON.stringify(rows, null, 2) + '\n');
