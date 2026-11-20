import { html, raw } from '../lib/html.mjs';

const drawings = {
  github: '<path d="M9 20c-4 1-4-2-6-2m12 4v-3.1c0-1 .1-1.7-.6-2.4 2.9-.3 6-1.4 6-6.4 0-1.4-.5-2.6-1.4-3.6.1-.4.6-1.8-.1-3.5 0 0-1.1-.4-3.7 1.4a12 12 0 0 0-6.5 0C6.1 2.7 5 3.1 5 3.1c-.7 1.7-.2 3.1-.1 3.5C4 7.6 3.5 8.8 3.5 10.2c0 5 3.1 6.1 6 6.4-.5.5-.7 1.2-.7 2.2V22"/>',
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7.5 10v7m4-7v7m0-4c0-4 5-4 5 0v4"/><circle cx="7.5" cy="7" r=".6"/>',
  mail: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="m3.5 6 8.5 7 8.5-7"/>',
  orcid: '<circle cx="12" cy="12" r="9"/><path d="M8 10v6m3-8h2a4 4 0 0 1 0 8h-2Z"/><circle cx="8" cy="7.5" r=".5"/>',
  oeis: '<path d="M2 17h3m2-5h3m2 2h3m2-8h4"/><circle cx="3.5" cy="14" r="1"/><circle cx="8.5" cy="9" r="1"/><circle cx="13.5" cy="11" r="1"/><circle cx="19" cy="3" r="1"/>',
  'arrow-ne': '<path d="M5 19 19 5M6 5h13v13"/>',
  'arrow-right': '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  external: '<path d="M12 4h8v8m0-8L10 14m-2-9H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/>',
  'play-store': '<path d="m5 3 14 8a1 1 0 0 1 0 2L5 21ZM5 3l10 12M5 21 15 9"/>',
  file: '<path d="M5 2h9l5 5v15H5Zm9 0v6h5M8 13h8m-8 4h6"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
};

export const iconNames = Object.keys(drawings);

export function sprite() {
  return html`<svg class="icon-sprite" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" width="0" height="0">${raw(iconNames.map(name =>
    html`<symbol id="icon-${name}" viewBox="0 0 24 24">${raw(drawings[name])}</symbol>`).join(''))}</svg>`;
}

export function icon(name) {
  if (!Object.hasOwn(drawings, name)) throw Error(`Unknown icon: ${name}`);
  return raw(html`<svg class="icon" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" width="20" height="20" aria-hidden="true" focusable="false"><use href="#icon-${name}"/></svg>`);
}
