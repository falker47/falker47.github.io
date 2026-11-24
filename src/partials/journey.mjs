import { html, raw } from '../lib/html.mjs';

// "Percorso": physics → credit → data → AI, drawn in the hero diagram's line
// style. One pulse travels along the path; reduced motion removes it.
const nodes = [
  { title: 'journeyPhysics', note: 'journeyPhysicsNote', glyph: 'atom' },
  { title: 'journeyCredit', note: 'journeyCreditNote', glyph: 'chart' },
  { title: 'journeyData', note: 'journeyDataNote', glyph: 'data' },
  { title: 'journeyAi', note: 'journeyAiNote', glyph: 'chip', current: true },
];

// Icons are drawn around the centre of their node.
const glyphs = {
  atom: '<circle r="3"/><ellipse rx="18" ry="7"/><ellipse rx="18" ry="7" transform="rotate(60)"/><ellipse rx="18" ry="7" transform="rotate(-60)"/>',
  chart: '<path d="M-17 15h34M-12 15V5M-3 15V-2M6 15V2M14 15V-7"/><path d="m-16-2 9-7 8 5 14-12"/>',
  data: '<ellipse cy="-12" rx="15" ry="5"/><path d="M-15-12v24c0 3 7 5 15 5s15-2 15-5v-24M-15 0c0 3 7 5 15 5s15-2 15-5"/>',
  chip: '<rect x="-12" y="-12" width="24" height="24" rx="4"/><path d="M-6-17v5M0-17v5M6-17v5M-6 12v5M0 12v5M6 12v5M-17-6h5M-17 0h5M-17 6h5M12-6h5M12 0h5M12 6h5"/><path d="m0-6 2 4 4 2-4 2-2 4-2-4-4-2 4-2z"/>',
};

function node(t, item, x, y, radius, anchor, tx, ty, gap) {
  return html`<g class="${item.current ? 'jr-node jr-current' : 'jr-node'}"><circle class="jr-plate" cx="${x}" cy="${y}" r="${radius}"/><g class="jr-glyph" transform="translate(${x} ${y})">${raw(glyphs[item.glyph])}</g></g>
<text class="jr-title" x="${tx}" y="${ty}" text-anchor="${anchor}" data-i18n="${item.title}">${t(item.title)}</text><text class="jr-note" x="${tx}" y="${ty + gap}" text-anchor="${anchor}" data-i18n="${item.note}">${t(item.note)}</text>`;
}

export function journey({ t, copy }) {
  // Wide: four nodes joined by a gentle wave. The path runs under the node plates.
  const xs = [110, 370, 630, 890], y = 62, r = 36;
  let wave = 'M' + (xs[0] + r) + ' ' + y;
  for (let i = 0; i < 3; i++) {
    const from = xs[i] + r, to = xs[i + 1] - r, middle = (from + to) / 2;
    wave += 'C' + middle + ' ' + (y - 34) + ' ' + middle + ' ' + (y + 34) + ' ' + to + ' ' + y;
  }
  const wide = html`<svg class="journey-wide" viewBox="0 0 1000 175" aria-hidden="true" focusable="false">
<path class="jr-track" d="${wave}"/><path class="jr-pulse" pathLength="100" d="${wave}"/>
${raw(nodes.map((item, i) => node(t, item, xs[i], y, r, 'middle', xs[i], y + 66, 22)).join('\n'))}
</svg>`;
  // Tall, for phones: the same nodes on a vertical line, labels at the side.
  const ys = [46, 146, 246, 346], x0 = 46;
  const line = 'M' + x0 + ' ' + ys[0] + 'V' + ys[3];
  const tall = html`<svg class="journey-tall" viewBox="0 0 340 392" aria-hidden="true" focusable="false">
<path class="jr-track" d="${line}"/><path class="jr-pulse" pathLength="100" d="${line}"/>
${raw(nodes.map((item, i) => node(t, item, x0, ys[i], 32, 'start', x0 + 52, ys[i] - 3, 21)).join('\n'))}
</svg>`;
  return html`<figure class="journey" data-label="journeyLabel" aria-label="${copy.it.journeyLabel}" role="img">
${raw(wide)}
${raw(tall)}
</figure>`;
}
