import { html } from '../lib/html.mjs';

// The drawing beside the studies paragraph, in the line style of the hero: a wave (physics)
// that leads to a code window (computer science). Decorative: the paragraph says it all.
export function studiesDrawing({ t }) {
  return html`<svg class="studies-drawing" viewBox="0 0 300 170" fill="none" focusable="false">
<path class="studies-line" d="M20 85q15-45 30 0t30 0 30 0 30 0"/><circle class="studies-dot" cx="80" cy="85" r="3"/>
<path class="studies-line studies-dash" d="M150 85h40"/><path class="studies-line" d="m184 79 7 6-7 6"/>
<rect class="studies-line" x="200" y="50" width="80" height="70" rx="8"/><path class="studies-bright" d="m226 74-10 11 10 11m28-22 10 11-10 11m-8-26-12 30"/>
<text class="studies-label" x="65" y="150" text-anchor="middle" data-i18n="figurePhysics">${t('figurePhysics')}</text>
<text class="studies-label" x="240" y="150" text-anchor="middle" data-i18n="figureComputing">${t('figureComputing')}</text></svg>`;
}
