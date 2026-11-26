import { html, raw } from '../lib/html.mjs';

// The drawing beside the work paragraph (V5), in the language of the pendulum: on the left a
// problem as it arrives, a data file whose points two tangles join at random, with questions; on
// the right the same points on axes, under the most general deterministic form they follow, one
// straight line, each point tied to it by its residual. Decorative: the paragraph says it all.
// It reuses the glass gradient of the pendulum drawing, which is always in the same page.
// The points lie around y = 108 − 0.708 (x − 22), each pushed off by a fixed amount.
const round = value => Math.round(value * 10) / 10;
const line = x => round(108 - .708 * (x - 22));
const noise = [6, -5, 4, -7, 5, -4, 6, -3];
export const methodPoints = noise.map((offset, i) => [26 + 12 * i, Math.round(line(26 + 12 * i) + offset)]);
// On the left the same eight readings, still unsorted: scattered over the panel and crossed by two tangles.
const raw8 = [[30, 104], [112, 46], [58, 54], [100, 110], [40, 70], [124, 86], [76, 96], [70, 32]];
const tangle = order => 'M' + order.map(i => raw8[i].join(' ')).join('L');
const dots = (kind, points = methodPoints) => points.map(([x, y]) => `<circle class="${kind}" cx="${x}" cy="${y}" r="2.2"/>`).join('');
const residuals = methodPoints.map(([x, y]) => `M${x} ${y}V${line(x)}`).join('');
const glass = width => `<rect class="st-gh" x="8" y="-6" width="${width}" height="134" rx="7"/><rect class="st-pn" fill="url(#studies-glass)" width="${width}" height="134" rx="7"/>`;

const drawing = `<g transform="translate(10 22)">${glass(138)}
<path class="st-ln" d="M0 17h138"/><circle class="st-pt quiet" cx="10" cy="8.5" r="1.7"/><circle class="st-pt quiet" cx="17" cy="8.5" r="1.7"/><circle class="st-pt quiet" cx="24" cy="8.5" r="1.7"/>
<text class="st-fl" x="130" y="11.5" text-anchor="end">dati.csv</text>
<path class="st-dt" d="M8 48h122M8 78h122M8 108h122M46 24v104M92 24v104"/>
<path class="st-gh" d="${tangle([6, 1, 4, 5, 0, 7, 3, 2])}"/><path class="st-ln trace" d="${tangle([0, 1, 2, 3, 4, 5, 6, 7, 0])}"/>${dots('st-pt quiet', raw8)}
<text class="st-vr" x="22" y="40">?</text><text class="st-vr small" x="118" y="120">?</text><text class="st-vr small" x="92" y="64">?</text>
</g>
<path class="st-ch" d="M156 88h33"/><path class="st-ar" d="m188 84 8 4-8 4z"/><circle class="st-pt" cx="156" cy="88" r="2.6"/>
<g transform="translate(200 22)">${glass(142)}
<text class="studies-eq" x="71" y="27" text-anchor="middle">y = a x + b</text><path class="st-qt" d="M32 36h78"/>
<path class="st-ln" d="M16 120h118M16 120V44"/><path class="st-qt" d="M40 120v3m24-3v3m24-3v3m24-3v3M16 96h-3m3-24h-3m3-24h-3"/>
<path class="st-gh" d="${residuals}"/>
<path class="st-br glow" d="M20 ${line(20)}L118 ${line(118)}"/><path class="st-br" d="M20 ${line(20)}L118 ${line(118)}"/>${dots('st-pt')}
</g>`;

export function methodDrawing({ t }) {
  return html`<svg class="studies-drawing" viewBox="0 12 360 170" fill="none" focusable="false">${raw(drawing)}
<text class="studies-label" x="79" y="176" text-anchor="middle" data-i18n="figureProblem">${t('figureProblem')}</text>
<text class="studies-label" x="271" y="176" text-anchor="middle" data-i18n="figureModel">${t('figureModel')}</text></svg>`;
}
