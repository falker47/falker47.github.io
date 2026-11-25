import { html, raw } from '../lib/html.mjs';

// The drawing beside the studies paragraph, in the language of the hero: on the left a simple
// pendulum under its law, α = −(g/L) sin θ; on the right the same law as one step of a
// simulation in Python (semi-implicit Euler) and the angle it computes, which keeps its
// amplitude because nothing damps it. Decorative: the paragraph says it all.
const round = value => Math.round(value * 10) / 10;
const pivot = [70, 52], length = 64;
const swing = degrees => [round(pivot[0] + length * Math.sin(degrees * Math.PI / 180)), round(pivot[1] + length * Math.cos(degrees * Math.PI / 180))];
const [bob, release, ghost] = [swing(28), swing(-28), swing(-5)];
// θ(t) = θ₀ cos(ωt) over two periods on the axis y = 106: samples every eighth of a period, and
// the trace as one cubic per half period (controls at 0.3642 of it, the usual cosine fit).
const [x0, span, axis, amplitude] = [14, 114, 106, 14], half = span / 4;
const samples = Array.from({ length: 17 }, (_, i) => [Math.round(x0 + i * span / 16), Math.round(axis - amplitude * Math.cos(i * Math.PI / 4))]);
const trace = 'M' + x0 + ' ' + (axis - amplitude) + Array.from({ length: 4 }, (_, i) => {
  const [from, to, y0, y1] = [x0 + i * half, x0 + (i + 1) * half, axis + (i % 2 ? amplitude : -amplitude), axis + (i % 2 ? -amplitude : amplitude)];
  return 'C' + [round(from + .3642 * half), y0, round(to - .3642 * half), y1, round(to), y1].join(' ');
}).join('');

const drawing = `<defs><linearGradient id="studies-glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#1c415c"/><stop offset="1" stop-color="#0b2034"/></linearGradient>
<radialGradient id="studies-light"><stop stop-color="#e4f6ff" stop-opacity=".75"/><stop offset=".45" stop-color="#a4dcff" stop-opacity=".35"/><stop offset="1" stop-color="#86d5ff" stop-opacity="0"/></radialGradient></defs>
<g transform="translate(10 22)">
<rect class="st-gh" x="8" y="-6" width="138" height="134" rx="7"/><rect class="st-pn" fill="url(#studies-glass)" width="138" height="134" rx="7"/>
<text class="studies-eq" x="69" y="27" text-anchor="middle">α = −(g/L) sin θ</text><path class="st-qt" d="M30 36h78"/>
<path class="st-ln" d="M20 52h100"/><path class="st-qt" d="m28 52 5-6m9 6 5-6m9 6 5-6m23 6 5-6m9 6 5-6m9 6 5-6"/>
<path class="st-dt" d="M70 52v76M${release.join(' ')}A${length} ${length} 0 0 0 ${bob.join(' ')}"/>
<g opacity=".4"><path class="st-gh" d="M70 52L${release.join(' ')}"/><circle class="st-gh" cx="${release[0]}" cy="${release[1]}" r="8"/></g>
<g opacity=".65"><path class="st-gh" d="M70 52L${ghost.join(' ')}"/><circle class="st-gh" cx="${ghost[0]}" cy="${ghost[1]}" r="8"/></g>
<path class="st-br" d="M70 52L${bob.join(' ')}"/><circle fill="url(#studies-light)" cx="${bob[0]}" cy="${bob[1]}" r="18"/>
<circle class="st-pn bob" fill="url(#studies-glass)" cx="${bob[0]}" cy="${bob[1]}" r="9"/><circle class="st-pt" cx="${bob[0]}" cy="${bob[1]}" r="2.2"/>
<circle class="st-pt" cx="70" cy="52" r="2.8"/><path class="st-br" d="M70 74a22 22 0 0 0 10.3-2.6"/><text class="st-vr" x="74" y="92">θ</text>
</g>
<path class="st-ch" d="M156 88h33"/><path class="st-ar" d="m188 84 8 4-8 4z"/><circle class="st-pt" cx="156" cy="88" r="2.6"/>
<g transform="translate(200 22)">
<rect class="st-gh" x="8" y="-6" width="142" height="134" rx="7"/><rect class="st-pn" fill="url(#studies-glass)" width="142" height="134" rx="7"/>
<path class="st-ln" d="M0 17h142"/><circle class="st-pt quiet" cx="10" cy="8.5" r="1.7"/><circle class="st-pt quiet" cx="17" cy="8.5" r="1.7"/><circle class="st-pt quiet" cx="24" cy="8.5" r="1.7"/>
<text class="st-fl" x="134" y="11.5" text-anchor="end">pendolo.py</text>
<g class="st-gt"><text x="9" y="30">1</text><text x="9" y="42">2</text><text x="9" y="54">3</text><text x="9" y="66">4</text><text x="9" y="78">5</text></g>
<g class="studies-code"><text x="20" y="30"><tspan class="st-kw">from</tspan> math <tspan class="st-kw">import</tspan> sin</text><text x="20" y="42"><tspan class="st-kw">def</tspan> step(th, w, dt):</text><text x="31" y="54">a = -g/L * sin(th)</text><text x="31" y="66">w = w + a * dt</text><text x="31" y="78"><tspan class="st-kw">return</tspan> th + w*dt, w</text></g>
<rect class="st-bk" x="8" y="86" width="126" height="40" rx="4"/><path class="studies-axis" d="M14 106h114"/>
<path class="st-ln trace" d="${trace}"/>
<g class="studies-samples">${samples.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i ? 1.7 : 2.7}"/>`).join('')}</g>
<text class="st-vr small" x="129" y="123" text-anchor="end">θ(t)</text>
</g>`;

export function studiesDrawing({ t }) {
  return html`<svg class="studies-drawing" viewBox="0 12 360 170" fill="none" focusable="false">${raw(drawing)}
<text class="studies-label" x="79" y="176" text-anchor="middle" data-i18n="figurePhysics">${t('figurePhysics')}</text>
<text class="studies-label" x="271" y="176" text-anchor="middle" data-i18n="figureSimulation">${t('figureSimulation')}</text></svg>`;
}
