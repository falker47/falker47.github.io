import data from '../../data/ringmin.json' with { type: 'json' };
import { html, raw } from '../lib/html.mjs';

const fixed = (value, digits = 2) => Number(value.toFixed(digits));

/**
 * The circles of one certified configuration, around a central circle of radius
 * R at the origin. Circle i has radius ordering[i] and sits at angle positions[i],
 * measured from the top: (R + r)(cos(θ − π/2), sin(θ − π/2)).
 */
export function circles({ R_float64: R, ordering, positions, floating_circles: floating }) {
  return ordering.map((r, i) => ({
    r,
    x: (R + r) * Math.cos(positions[i] - Math.PI / 2),
    y: (R + r) * Math.sin(positions[i] - Math.PI / 2),
    floating: floating.includes(r),
  }));
}

/** The smallest gap between two outer circles: zero when tangent, positive when apart. */
export function smallestGap(configuration) {
  const list = circles(configuration);
  let gap = Infinity;
  for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
    gap = Math.min(gap, Math.hypot(list[i].x - list[j].x, list[i].y - list[j].y) - list[i].r - list[j].r);
  }
  return gap;
}

// One configuration in a 100-unit square centred on the central circle. The
// farthest a circle can reach is R + 2n, which sets the scale of each drawing.
function configuration(optimum) {
  const scale = 46 / (optimum.R_float64 + 2 * optimum.n);
  const outer = circles(optimum).map(c => html`<circle class="${c.floating ? 'rm-floating' : 'rm-circle'}" cx="${fixed(c.x * scale)}" cy="${fixed(c.y * scale)}" r="${fixed(c.r * scale)}"/>`).join('');
  return html`<div class="rm-cell"><svg viewBox="-50 -50 100 100" aria-hidden="true" focusable="false"><circle class="rm-centre" r="${fixed(optimum.R_float64 * scale)}"/>${raw(outer)}</svg><span>n=${optimum.n}</span></div>`;
}

/** Paper I: the twelve certified configurations, six by two (four columns on a phone). */
export function configurations({ copy }) {
  return html`<div class="rm-grid" role="img" data-label="ringminGridLabel" aria-label="${copy.it.ringminGridLabel}">${raw(data.optima.map(configuration).join(''))}</div>`;
}

/**
 * Paper II, drawn like Paper I: one circle per n, of radius R(n)/n² on a common scale, around
 * a common centre. Certified values are solid, non-exhaustive ones dashed. The circles close in
 * on the glowing ring of the certified interval for C* (data.constant), outside the dashed 1/8.
 */
const bound = (value, round, lang) => new Intl.NumberFormat(lang === 'it' ? 'it-IT' : 'en-GB',
  { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(round(value * 1e4) / 1e4);
export const constantRange = lang => [bound(data.constant.lower, Math.floor, lang), bound(data.constant.upper, Math.ceil, lang)];

// A label sitting on a circle: a small rounded tag that masks the line behind it.
function tag(x, y, text, className) {
  const width = 12 + text.length * 7.6;
  return html`<g class="${className}"><rect x="${fixed(x - width / 2)}" y="${fixed(y - 9)}" width="${fixed(width)}" height="18" rx="9"/><text x="${x}" y="${fixed(y + 4.2)}" text-anchor="middle">${text}</text></g>`;
}

export function chart({ copy }) {
  const W = 288, H = 162, cx = 144, cy = 81;
  const { lower, upper } = data.constant;
  const scale = 70 / ((lower + upper) / 2);
  const radius = value => fixed(value * scale);
  const rows = data.asymptotic;
  const rings = rows.map(row => html`<circle class="${row.certified ? 'rm-ring' : 'rm-ring rm-open'}" cx="${cx}" cy="${cy}" r="${radius(row.ratio)}"/>`).join('');
  const band = Math.max(1.6, radius(upper) - radius(lower));
  return html`<svg class="rm-chart rm-rings" viewBox="0 0 ${W} ${H}" role="img" data-label="ringminChartLabel" aria-label="${copy.it.ringminChartLabel}">
<circle class="rm-band" cx="${cx}" cy="${cy}" r="${fixed((radius(lower) + radius(upper)) / 2)}" stroke-width="${fixed(band)}"/>
<circle class="rm-limit" cx="${cx}" cy="${cy}" r="${radius(1 / 8)}"/>
${raw(rings)}<circle class="rm-centre" cx="${cx}" cy="${cy}" r="2"/>
${raw(tag(cx, fixed(cy - (radius(lower) + radius(upper)) / 2), 'C*', 'rm-tag rm-tag-band'))}
${raw(tag(cx, fixed(cy + radius(1 / 8)), '1/8', 'rm-tag rm-tag-limit'))}
</svg>`;
}
