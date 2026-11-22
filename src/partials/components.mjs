import { html, raw } from '../lib/html.mjs';
import { picture } from '../lib/media.mjs';
import { icon } from './icons.mjs';

export const label = (t, key) => raw(html`<span data-i18n="${key}">${t(key)}</span>`);
export const localized = (value, lang = 'it') => raw(html`<span data-text-it="${value.it}" data-text-en="${value.en}">${value[lang]}</span>`);
const group = items => raw(items.join('\n'));

export function primaryCta(t, key, href) {
  return html`<a class="cta primary-cta" href="${href}">${label(t, key)}<span class="cta-icon" aria-hidden="true">${icon('arrow-right')}</span></a>`;
}

export function certificates({ t }, entries, id, previewCount = entries.length) {
  const grid = items => html`<div class="certificate-grid">
  ${group(items.map(({ thumbnail, full, alt, title, issuer, year }) => html`<a class="certificate" href="${full.src}" data-viewer="${id}" data-width="${full.width}" data-height="${full.height}" aria-haspopup="dialog" aria-controls="${id}">${raw(picture({ ...thumbnail, alt, variants: [thumbnail, full] }, { sizes: 'auto, (min-width: 700px) 25vw, 45vw' }))}<span>${title}</span> ${icon('external')} <small>${issuer} · ${year}</small></a>`))}
  </div>`;
  return html`${raw(grid(entries.slice(0, previewCount)))}
  ${entries.length > previewCount ? raw(html`<details class="more-certificates"><summary>
  <span class="when-closed">${label(t, 'showCertificates')} (${entries.length})</span>
  <span class="when-open">${label(t, 'fewerCertificates')}</span> ${icon('chevron')}</summary>
  ${raw(grid(entries.slice(previewCount)))}</details>`) : ''}
  <dialog class="certificate-viewer" id="${id}" aria-modal="true" aria-labelledby="${id}-title"><div class="viewer-bar"><h3 id="${id}-title"></h3><form method="dialog"><button class="text-button" autofocus>${label(t, 'closeViewer')}</button></form></div></dialog>`;
}

export function statusPanel(t, { kind, heading, action, href }) {
  return html`<div class="status-panel ${kind}"><p class="status-code">${kind === 'not-found' ? '404' : icon('arrow-right')}</p><h3>${label(t, heading)}</h3>
  <a class="text-link" href="${href}">${label(t, action)} ${icon('arrow-right')}</a></div>`;
}
