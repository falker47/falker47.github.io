import { html, raw } from '../lib/html.mjs';
import { img } from '../lib/media.mjs';
import { brand, brandFor, brandInk, icon } from './icons.mjs';

export const label = (t, key) => raw(html`<span data-i18n="${key}">${t(key)}</span>`);
export const localized = (value, lang = 'it') => raw(html`<span data-text-it="${value.it}" data-text-en="${value.en}">${value[lang]}</span>`);
const group = items => raw(items.join('\n'));

/**
 * An action link. An external platform (GitHub, Google Play, Nexus Mods, arXiv, Zenodo,
 * ORCID, OEIS) shows its mark left of the label and takes its colour on hover; any other
 * link keeps an arrow: → inside this site, ↗ elsewhere. The title names the card for screen readers.
 */
export function actionLink(href, text, { title, className } = {}) {
  const mark = brandFor(href);
  const internal = /^[/#.]/.test(href);
  const attrs = (className ? html` class="${className}"` : '') + (mark ? html` style="--brand:${brandInk(mark)}" data-brand="${mark}"` : '');
  return html`<a href="${href}"${raw(attrs)}>${mark ? brand(mark) : ''}${text}${title ? raw(html`<span class="sr-only"> · ${title}</span>`) : ''}${mark ? '' : icon(internal ? 'arrow-right' : 'arrow-ne')}</a>`;
}

export function primaryCta(t, key, href) {
  return html`<a class="cta primary-cta" href="${href}">${label(t, key)}<span class="cta-icon" aria-hidden="true">${icon('arrow-right')}</span></a>`;
}

/**
 * The certificates as a fan of overlapping cards, turned from −9° to +9°. Each
 * card is a button that opens the viewer; the caption beside the fan names the
 * card under the pointer or the focus.
 */
export function certificateDeck({ t, copy }, entries, id) {
  const last = Math.max(1, entries.length - 1);
  const cards = entries.map(({ thumbnail, full, alt, title, issuer, year }, index) => {
    const turn = index / last - .5;
    return html`<button type="button" class="deck-card" style="--r:${(turn * 18).toFixed(1)}deg;--y:${(Math.abs(turn) * 16).toFixed(1)}px" data-viewer="${id}" data-full="${full.src}" data-width="${full.width}" data-height="${full.height}" data-meta="${issuer} · ${year}" data-title="${title}" aria-label="${title}, ${issuer}, ${year}" aria-haspopup="dialog" aria-controls="${id}">${raw(img({ ...thumbnail, alt }, { sizes: '150px' }))}</button>`;
  });
  return html`<div class="deck" style="--n:${entries.length}">
  <div class="deck-fan" role="group" data-label="guideCertificates" aria-label="${copy.it.guideCertificates}">
  ${group(cards)}
  </div>
  <div class="deck-caption">
    <div class="deck-default"><p class="deck-meta">${label(t, 'deckIssuers')}</p><p class="deck-title"><strong class="deck-count">${entries.length}</strong> ${label(t, 'deckCount')}</p></div>
    <div class="deck-current" aria-hidden="true" hidden><p class="deck-meta"></p><p class="deck-title"></p></div>
    <p class="deck-hint"><span class="hint-hover">${label(t, 'deckHintHover')}</span><span class="hint-touch">${label(t, 'deckHintTouch')}</span></p>
  </div>
</div>
<dialog class="certificate-viewer" id="${id}" aria-labelledby="${id}-title">
  <div class="viewer-bar"><h3 id="${id}-title"></h3><form method="dialog"><button class="viewer-step viewer-close" data-label="closeViewer" aria-label="${copy.it.closeViewer}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></form></div>
  <div class="viewer-stage"></div>
  <div class="viewer-foot"><button type="button" class="viewer-step" data-step="-1" data-label="viewerPrevious" aria-label="${copy.it.viewerPrevious}"><span aria-hidden="true">←</span></button><p class="viewer-count" aria-live="polite"><span class="viewer-index">1</span> / ${entries.length}</p><button type="button" class="viewer-step" data-step="1" data-label="viewerNext" aria-label="${copy.it.viewerNext}"><span aria-hidden="true">→</span></button></div>
</dialog>`;
}

export function statusPanel(t, { kind, heading, action, href }) {
  return html`<div class="status-panel ${kind}"><p class="status-code">${kind === 'not-found' ? '404' : icon('arrow-right')}</p><h3>${label(t, heading)}</h3>
  <a class="text-link" href="${href}">${label(t, action)} ${icon('arrow-right')}</a></div>`;
}
