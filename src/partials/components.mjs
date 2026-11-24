import { html, raw } from '../lib/html.mjs';
import { img } from '../lib/media.mjs';
import { icon } from './icons.mjs';

export const label = (t, key) => raw(html`<span data-i18n="${key}">${t(key)}</span>`);
export const localized = (value, lang = 'it') => raw(html`<span data-text-it="${value.it}" data-text-en="${value.en}">${value[lang]}</span>`);
const group = items => raw(items.join('\n'));

export function primaryCta(t, key, href) {
  return html`<a class="cta primary-cta" href="${href}">${label(t, key)}<span class="cta-icon" aria-hidden="true">${icon('arrow-right')}</span></a>`;
}

/**
 * The certificates as a fan of overlapping cards. Each card is a button that
 * opens the viewer; the caption beside the fan names the card under the pointer.
 */
export function certificateDeck({ t, copy }, entries, id) {
  const cards = entries.map(({ thumbnail, full, alt, title, issuer, year }, index) =>
    html`<button type="button" class="deck-card" style="--i:${index}" data-viewer="${id}" data-full="${full.src}" data-width="${full.width}" data-height="${full.height}" data-meta="${issuer} · ${year}" data-title="${title}" aria-label="${title}, ${issuer}, ${year}" aria-haspopup="dialog" aria-controls="${id}">${raw(img({ ...thumbnail, alt, variants: [thumbnail] }, { sizes: '150px' }))}</button>`);
  return html`<div class="deck" style="--n:${entries.length}">
  <div class="deck-fan" role="group" data-label="guideCertificates" aria-label="${copy.it.guideCertificates}">
  ${group(cards)}
  </div>
  <div class="deck-caption">
    <div class="deck-default"><p class="deck-meta">${label(t, 'deckIssuers')}</p><p class="deck-title">${entries.length} ${label(t, 'deckCount')}</p></div>
    <div class="deck-current" aria-hidden="true" hidden><p class="deck-meta"></p><p class="deck-title"></p></div>
    <p class="deck-hint"><span class="hint-hover">${label(t, 'deckHintHover')}</span><span class="hint-touch">${label(t, 'deckHintTouch')}</span></p>
  </div>
</div>
<dialog class="certificate-viewer" id="${id}" aria-labelledby="${id}-title">
  <div class="viewer-bar"><div><p class="viewer-meta"></p><h3 id="${id}-title"></h3></div><form method="dialog"><button class="text-button">${label(t, 'closeViewer')}</button></form></div>
  <div class="viewer-stage"></div>
  <div class="viewer-foot"><button type="button" class="viewer-step" data-step="-1" data-label="viewerPrevious" aria-label="${copy.it.viewerPrevious}"><span aria-hidden="true">←</span></button><p class="viewer-count" aria-live="polite"><span class="viewer-index">1</span> / ${entries.length}</p><button type="button" class="viewer-step" data-step="1" data-label="viewerNext" aria-label="${copy.it.viewerNext}"><span aria-hidden="true">→</span></button></div>
</dialog>`;
}

export function statusPanel(t, { kind, heading, action, href }) {
  return html`<div class="status-panel ${kind}"><p class="status-code">${kind === 'not-found' ? '404' : icon('arrow-right')}</p><h3>${label(t, heading)}</h3>
  <a class="text-link" href="${href}">${label(t, action)} ${icon('arrow-right')}</a></div>`;
}
