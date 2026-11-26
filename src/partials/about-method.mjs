import { html, raw } from '../lib/html.mjs';

// The drawing beside the work paragraph (V5), in the language of the pendulum: on the left a
// problem as it arrives, points tangled together; on the right the same points under the most
// general deterministic form they follow, one straight line. Decorative: the paragraph says it all.
// It reuses the glass gradient of the pendulum drawing, which is always in the same page.
// The points lie around y = 108 − 0.708 (x − 22), each pushed off by a fixed amount.
const noise = [6, -5, 4, -7, 5, -4, 6, -3];
export const methodPoints = noise.map((offset, i) => [26 + 12 * i, Math.round(108 - .708 * (4 + 12 * i) + offset)]);
const tangle = 'M' + [3, 0, 5, 1, 7, 2, 6, 4].map(i => methodPoints[i].join(' ')).join('L');
const dots = kind => methodPoints.map(([x, y]) => `<circle class="${kind}" cx="${x}" cy="${y}" r="2.2"/>`).join('');
const panel = '<rect class="st-gh" x="8" y="-6" width="138" height="134" rx="7"/><rect class="st-pn" fill="url(#studies-glass)" width="138" height="134" rx="7"/>';

const drawing = `<g transform="translate(10 22)">${panel}<path class="st-ln trace" d="${tangle}"/>${dots('st-pt quiet')}</g>
<path class="st-ch" d="M156 88h33"/><path class="st-ar" d="m188 84 8 4-8 4z"/><circle class="st-pt" cx="156" cy="88" r="2.6"/>
<g transform="translate(200 22)">${panel}<text class="studies-eq" x="69" y="27" text-anchor="middle">y = a x + b</text><path class="st-qt" d="M30 36h78M16 120h112M16 120V48"/>
<path class="st-br" d="M20 109.4L116 41.4"/>${dots('st-pt')}</g>`;

export function methodDrawing({ t }) {
  return html`<svg class="studies-drawing" viewBox="0 12 360 170" fill="none" focusable="false">${raw(drawing)}
<text class="studies-label" x="79" y="176" text-anchor="middle" data-i18n="figureProblem">${t('figureProblem')}</text>
<text class="studies-label" x="269" y="176" text-anchor="middle" data-i18n="figureModel">${t('figureModel')}</text></svg>`;
}
