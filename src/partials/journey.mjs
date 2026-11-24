import { html, raw } from '../lib/html.mjs';

// "Percorso": physics → credit → data → AI, drawn in the hero diagram's line
// style. One pulse travels along the path; reduced motion removes it.
const nodes = [
  { title: 'journeyPhysics', note: 'journeyPhysicsNote', glyph: 'atom' },
  { title: 'journeyCredit', note: 'journeyCreditNote', glyph: 'bars' },
  { title: 'journeyData', note: 'journeyDataNote', glyph: 'cylinder' },
  { title: 'journeyAi', note: 'journeyAiNote', glyph: 'chip', current: true },
];

// Icons are drawn in a 48-unit box centred on the node.
const glyphs = {
  atom: '<ellipse rx="19" ry="7.5"/><ellipse rx="19" ry="7.5" transform="rotate(60)"/><ellipse rx="19" ry="7.5" transform="rotate(120)"/><circle class="jr-dot" r="2.6"/>',
  bars: '<path d="M-17 15h34M-12 15V4M-4 15V-6M4 15V-1M12 15V-13"/><path class="jr-quiet" d="M-15 -4-5 -12 3 -8 14 -17"/>',
  cylinder: '<ellipse cy="-11" rx="14" ry="5"/><path d="M-14-11v22c0 2.8 6.3 5 14 5s14-2.2 14-5v-22M-14-3.5c0 2.8 6.3 5 14 5s14-2.2 14-5M-14 4c0 2.8 6.3 5 14 5s14-2.2 14-5"/>',
  chip: '<rect x="-11" y="-11" width="22" height="22" rx="3"/><rect class="jr-core" x="-5" y="-5" width="10" height="10" rx="1.5"/><path d="M-6-11v-6M0-11v-6M6-11v-6M-6 11v6M0 11v6M6 11v6M-11-6h-6M-11 0h-6M-11 6h-6M11-6h6M11 0h6M11 6h6"/>',
};

function node(t, item, x, y, anchor, tx, ty) {
  return html`<g class="jr-node${item.current ? ' jr-current' : ''}" transform="translate(${x} ${y})"><circle class="jr-plate" r="30"/><g class="jr-glyph">${raw(glyphs[item.glyph])}</g></g>
<text class="jr-title" x="${tx}" y="${ty}" text-anchor="${anchor}" data-i18n="${item.title}">${t(item.title)}</text><text class="jr-note" x="${tx}" y="${ty + 19}" text-anchor="${anchor}" data-i18n="${item.note}">${t(item.note)}</text>`;
}

export function journey({ t, copy }) {
  // Wide: four nodes on one line. Tall: the same nodes stacked, labels at the side.
  const wideX = [80, 300, 520, 740], wideY = 46;
  const wide = html`<svg class="journey-wide" viewBox="0 0 820 132" aria-hidden="true" focusable="false">
<path class="jr-track" d="M${wideX[0] + 30} ${wideY}H${wideX[1] - 30}M${wideX[1] + 30} ${wideY}H${wideX[2] - 30}M${wideX[2] + 30} ${wideY}H${wideX[3] - 30}"/>
<path class="jr-pulse" pathLength="100" d="M${wideX[0]} ${wideY}H${wideX[3]}"/>
${raw(nodes.map((item, i) => node(t, item, wideX[i], wideY, 'middle', wideX[i], 104)).join('\n'))}
</svg>`;
  const tallY = [40, 130, 220, 310], tallX = 40;
  const tall = html`<svg class="journey-tall" viewBox="0 0 320 350" aria-hidden="true" focusable="false">
<path class="jr-track" d="M${tallX} ${tallY[0] + 30}V${tallY[1] - 30}M${tallX} ${tallY[1] + 30}V${tallY[2] - 30}M${tallX} ${tallY[2] + 30}V${tallY[3] - 30}"/>
<path class="jr-pulse" pathLength="100" d="M${tallX} ${tallY[0]}V${tallY[3]}"/>
${raw(nodes.map((item, i) => node(t, item, tallX, tallY[i], 'start', 88, tallY[i] - 3)).join('\n'))}
</svg>`;
  return html`<figure class="journey" data-label="journeyLabel" aria-label="${copy.it.journeyLabel}" role="img">
${raw(wide)}
${raw(tall)}
</figure>`;
}
