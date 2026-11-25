import brands from '../../data/brands.json' with { type: 'json' };
import { html, raw } from '../lib/html.mjs';

const drawings = {
  github: '<path d="M9 20c-4 1-4-2-6-2m12 4v-3.1c0-1 .1-1.7-.6-2.4 2.9-.3 6-1.4 6-6.4 0-1.4-.5-2.6-1.4-3.6.1-.4.6-1.8-.1-3.5 0 0-1.1-.4-3.7 1.4a12 12 0 0 0-6.5 0C6.1 2.7 5 3.1 5 3.1c-.7 1.7-.2 3.1-.1 3.5C4 7.6 3.5 8.8 3.5 10.2c0 5 3.1 6.1 6 6.4-.5.5-.7 1.2-.7 2.2V22"/>',
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7.5 10v7m4-7v7m0-4c0-4 5-4 5 0v4"/><circle cx="7.5" cy="7" r=".6"/>',
  mail: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="m3.5 6 8.5 7 8.5-7"/>',
  orcid: '<circle cx="12" cy="12" r="9"/><path d="M8 10v6m3-8h2a4 4 0 0 1 0 8h-2Z"/><circle cx="8" cy="7.5" r=".5"/>',
  'arrow-ne': '<path d="M5 19 19 5M6 5h13v13"/>',
  'arrow-right': '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  external: '<path d="M12 4h8v8m0-8L10 14m-2-9H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  file: '<path d="M5 2h9l5 5v15H5Zm9 0v6h5M8 13h8m-8 4h6"/>',
  wifi: '<path d="M2 9a16 16 0 0 1 20 0M5.5 12.5a10.5 10.5 0 0 1 13 0M9 16a5 5 0 0 1 6 0"/><circle cx="12" cy="19.5" r="1"/>',
  monitor: '<rect x="2.5" y="4" width="19" height="13" rx="1.5"/><path d="M12 17v3m-5 0h10"/>',
  bolt: '<path d="M13.5 2 5 13h6l-.5 9L19 10h-6Z"/>',
  camera: '<path d="m3 6 4-2 13 5-4 7L3 11Zm14 9 3 2v3h-5"/><path d="m5 12-1 2 5 2 1-2"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  code: '<rect x="2.5" y="4" width="19" height="16" rx="2"/><path d="M2.5 8h19M9 12l-2.5 2.5L9 17m6-5 2.5 2.5L15 17"/>',
  medal: '<circle cx="12" cy="15" r="5.5"/><path d="m9 9.8-3-6.8h4l2 4 2-4h4l-3 6.8M12 12.5v5"/>',
  star: '<path d="m12 2.5 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4-4.6-4.5 6.4-.9Z"/>',
  // V5: a terminal prompt for the software figure; a central circle and the circles tangent to it for the research link.
  terminal: '<path d="m6 7.5 4.5 4.5L6 16.5m7 1h5.5"/>',
  ringmin: '<circle cx="12" cy="12" r="4.5" fill="currentColor" fill-opacity=".35"/><circle cx="19.5" cy="12" r="3"/><circle cx="15.75" cy="18.5" r="3"/><circle cx="8.25" cy="18.5" r="3"/><circle cx="4.5" cy="12" r="3"/><circle cx="8.25" cy="5.5" r="3"/><circle cx="15.75" cy="5.5" r="3"/>',
};

export const iconNames = Object.keys(drawings);

export const brandNames = Object.keys(brands.marks);
const brandHosts = [['github.com', 'github'], ['play.google.com', 'googleplay'], ['nexusmods.com', 'nexusmods'],
  ['arxiv.org', 'arxiv'], ['zenodo.org', 'zenodo'], ['orcid.org', 'orcid'], ['oeis.org', 'oeis'], ['linkedin.com', 'linkedin']];

/** The platform of an external URL, if it has a brand mark (data/brands.json). */
export function brandFor(url) {
  let host;
  try { host = new URL(url).hostname; } catch { return null; }
  return brandHosts.find(([name]) => host === name || host.endsWith('.' + name))?.[1] ?? null;
}

/** A platform mark from the sprite; one-colour marks take the text colour. */
export function brand(name) {
  if (!Object.hasOwn(brands.marks, name)) throw Error(`Unknown brand: ${name}`);
  return raw(html`<svg class="brand brand-${name}" aria-hidden="true" focusable="false"><use href="#brand-${name}"/></svg>`);
}

/** The hover ink of a mark: its brand colour, or near white where that colour is too dark on the cards. */
export const brandInk = name => brands.marks[name].hover;

// The sprite holds only the icons and marks that the page uses.
export function sprite(content = '') {
  const icons = iconNames.filter(name => content.includes(`href="#icon-${name}"`));
  const used = brandNames.filter(name => content.includes(`href="#brand-${name}"`));
  const marks = used.map(name => {
    const { viewBox, body, mono } = brands.marks[name];
    // Several-colour marks keep their published colours, including the implicit black fill.
    return html`<symbol id="brand-${name}" viewBox="${viewBox}">${raw(mono ? body : '<g fill="#000">' + body + '</g>')}</symbol>`;
  });
  return html`<svg class="icon-sprite" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="0" height="0">${raw(icons.map(name =>
    html`<symbol id="icon-${name}" viewBox="0 0 24 24">${raw(drawings[name])}</symbol>`).join(''))}${raw(marks.join(''))}</svg>`;
}

export function icon(name) {
  if (!Object.hasOwn(drawings, name)) throw Error(`Unknown icon: ${name}`);
  return raw(html`<svg class="icon" aria-hidden="true"><use href="#icon-${name}"/></svg>`);
}
