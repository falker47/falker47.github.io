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
  return html`<div class="rm-cell"><svg viewBox="-50 -50 100 100" aria-hidden="true" focusable="false"><circle class="rm-centre" r="${fixed(optimum.R_float64 * scale)}"/>${raw(outer)}</svg><span>n = ${optimum.n}</span></div>`;
}

/** Paper I: the twelve certified configurations, six by two (four columns on a phone). */
export function configurations({ copy }) {
  return html`<div class="rm-grid" role="img" data-label="ringminGridLabel" aria-label="${copy.it.ringminGridLabel}">${raw(data.optima.map(configuration).join(''))}</div>`;
}

/**
 * Paper II: R(n)/n² against x = 1/n, so that n → ∞ sits at x = 0. There the certified
 * interval for C* (data.constant) is a short band, above the 1/8 lower bound. Filled dots
 * are certified values, hollow dots non-exhaustive ones. A faint dashed segment continues
 * the last two points to x = 0 when it lands near the band.
 */
const bound = (value, round, lang) => new Intl.NumberFormat(lang === 'it' ? 'it-IT' : 'en-GB',
  { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(round(value * 1e4) / 1e4);
export const constantRange = lang => [bound(data.constant.lower, Math.floor, lang), bound(data.constant.upper, Math.ceil, lang)];

export function chart({ t, copy }) {
  const W = 520, H = 250, left = 62, bottom = 46, top = 34, right = 16, inset = 16;
  const rows = data.asymptotic;
  const { lower, upper } = data.constant;
  const low = .02, high = .15, span = 1 / 3;
  const x = value => fixed(left + inset + value / span * (W - left - right - inset), 1);
  const y = value => fixed(top + (high - value) / (high - low) * (H - top - bottom), 1);
  const grid = [.03, .06, .09, .12, .15].map(value => html`<path class="rm-axis" d="M${left} ${y(value)}H${W - right}"/><text class="rm-tick" x="${left - 8}" y="${y(value) + 4}" text-anchor="end">${value.toFixed(2)}</text>`).join('');
  const ticks = [Infinity, 18, 10, 6, 4, 3].map(n => html`<path class="rm-axis" d="M${x(1 / n)} ${H - bottom}v5"/><text class="rm-tick" x="${x(1 / n)}" y="${H - bottom + 22}" text-anchor="middle">${n === Infinity ? 'n = ∞' : n}</text>`).join('');
  const dots = rows.map(row => html`<circle class="${row.certified ? 'rm-dot' : 'rm-dot rm-open'}" cx="${x(1 / row.n)}" cy="${y(row.ratio)}" r="4"/>`).join('');
  const line = 'M' + rows.map(row => x(1 / row.n) + ' ' + y(row.ratio)).join('L');
  const [a, b] = rows.slice(-2);
  const slope = (b.ratio - a.ratio) / (1 / b.n - 1 / a.n);
  const target = b.ratio - slope / b.n;
  const extrapolation = Math.abs(target - (lower + upper) / 2) < .005
    ? html`<path class="rm-extrapolation" d="M${x(1 / b.n)} ${y(b.ratio)}L${x(0)} ${y(target)}"/>` : '';
  const band = Math.max(6, y(lower) - y(upper));
  const [it, en] = [constantRange('it'), constantRange('en')];
  return html`<svg class="rm-chart" viewBox="0 0 ${W} ${H}" role="img" data-label="ringminChartLabel" aria-label="${copy.it.ringminChartLabel}">
${raw(grid)}<path class="rm-axis rm-baseline" d="M${left} ${H - bottom}H${W - right}"/>${raw(ticks)}
<text class="rm-tick rm-axis-title" x="${W - right}" y="${H - 4}" text-anchor="end">1/n</text>
<path class="rm-limit" d="M${left} ${y(1 / 8)}H${W - right}"/>
<text class="rm-limit-label" x="${W - right - 4}" y="${y(1 / 8) + 20}" text-anchor="end" data-i18n="ringminLimit">${t('ringminLimit')}</text>
${raw(extrapolation)}<path class="rm-trend" d="${line}"/>${raw(dots)}
<rect class="rm-band" x="${x(0) - 6}" y="${fixed(y(upper) - (band - (y(lower) - y(upper))) / 2, 1)}" width="12" height="${fixed(band, 1)}" rx="1"/>
<text class="rm-band-label" x="${x(0) + 12}" y="${y(upper) - 6}">C* ∈ [<tspan data-text-it="${it[0]}" data-text-en="${en[0]}">${it[0]}</tspan>; <tspan data-text-it="${it[1]}" data-text-en="${en[1]}">${it[1]}</tspan>]</text>
<text class="rm-tick" x="${W - right}" y="${top - 18}" text-anchor="end">R(n) / n²</text>
</svg>`;
}
