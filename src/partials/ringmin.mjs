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

// The certified interval for C*, rounded outwards to four decimals in the reader's format.
const bound = (value, round, lang) => new Intl.NumberFormat(lang === 'it' ? 'it-IT' : 'en-GB',
  { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(round(value * 1e4) / 1e4);
export const constantRange = lang => [bound(data.constant.lower, Math.floor, lang), bound(data.constant.upper, Math.ceil, lang)];

/**
 * Paper II, drawn like Paper I: a fan of thin spokes from a common hub, one per n from left
 * to right, each as long as R(n)/n² on a common scale and capped by a small circle. Certified
 * values are solid, non-exhaustive ones dashed. Above them glows the semicircle of radius C*,
 * as thick as the certified interval (data.constant) allows on this scale.
 */
export function chart({ copy }) {
  const W = 320, H = 180, cx = 160, cy = 158, reach = 124;
  const rows = data.asymptotic, { lower, upper } = data.constant;
  const scale = reach / ((lower + upper) / 2);
  const [from, to] = [Math.PI * 1.04, Math.PI * 1.96];
  const spoke = (row, i) => {
    const angle = from + (to - from) * i / (rows.length - 1), length = row.ratio * scale;
    const [x, y] = [fixed(cx + length * Math.cos(angle)), fixed(cy + length * Math.sin(angle))];
    const open = row.certified ? '' : ' rm-open';
    return html`<line class="rm-spoke${open}" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/><circle class="rm-tip${open}" cx="${x}" cy="${y}" r="2.2"/>`;
  };
  const label = (x, y, text, className = 'rm-label') => html`<text class="${className}" x="${x}" y="${y}" text-anchor="middle">${text}</text>`;
  return html`<svg class="rm-chart" viewBox="0 0 ${W} ${H}" role="img" data-label="ringminChartLabel" aria-label="${copy.it.ringminChartLabel}">
<path class="rm-arc" d="M${cx - reach} ${cy} A${reach} ${reach} 0 0 1 ${cx + reach} ${cy}" stroke-width="${fixed(Math.max(1.6, (upper - lower) * scale))}"/>
<line class="rm-base" x1="${cx - reach - 10}" y1="${cy}" x2="${cx + reach + 10}" y2="${cy}"/>
${raw(rows.map(spoke).join(''))}<circle class="rm-hub" cx="${cx}" cy="${cy}" r="3"/>
${raw(label(cx - reach, cy + 17, 'n = ' + rows[0].n))}${raw(label(cx + reach, cy + 17, String(rows.at(-1).n)))}
${raw(label(cx, cy - reach - 9, 'C*', 'rm-label rm-key'))}
</svg>`;
}
