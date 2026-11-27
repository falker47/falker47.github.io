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

// A decimal tick in both number formats; the page starts in Italian and swaps on a language change.
const decimal = value => {
  const [it, en] = ['it-IT', 'en-GB'].map(locale => new Intl.NumberFormat(locale, { minimumFractionDigits: 2 }).format(value));
  return { it, en };
};

/**
 * Paper II as a plain chart, on true scales: R(n)/n² upwards from zero, n to the right on a 1/n
 * scale, so that n = ∞ is a point on the axis. One dot per n from the table, filled when certified
 * and hollow when the search was not exhaustive. The dashed line is C*, the limit Paper II proves,
 * as thick as its certified interval (data.constant) on this scale and never thinner than a hairline;
 * the dot at ∞ marks where the points are heading. Nothing is fitted or extrapolated between 18 and ∞.
 */
export const chartFrame = { W: 272, H: 153, x0: 38, x1: 258, yBottom: 122, yTop: 18, yMax: .15 };
export const chartX = n => chartFrame.x0 + (1 - (Number.isFinite(n) ? data.asymptotic[0].n / n : 0)) * (chartFrame.x1 - chartFrame.x0);
export const chartY = value => chartFrame.yBottom - value / chartFrame.yMax * (chartFrame.yBottom - chartFrame.yTop);

export function chart({ t, copy }) {
  const { W, H, x0, x1, yBottom, yTop } = chartFrame;
  const rows = data.asymptotic, { lower, upper } = data.constant, cStar = chartY((lower + upper) / 2);
  const text = (x, y, value, anchor = 'middle', className = 'rm-label') => html`<text class="${className}" x="${x}" y="${y}" text-anchor="${anchor}">${value}</text>`;
  const localized = (x, y, { it, en }, anchor) => html`<text class="rm-label rm-tick" x="${x}" y="${y}" text-anchor="${anchor}" data-text-it="${it}" data-text-en="${en}">${it}</text>`;
  const word = (x, y, key) => html`<text class="rm-label rm-legend" x="${x}" y="${y}" text-anchor="end" data-i18n="${key}">${t(key)}</text>`;
  const dot = row => html`<circle class="rm-dot${row.certified ? '' : ' rm-open'}" cx="${fixed(chartX(row.n))}" cy="${fixed(chartY(row.ratio))}" r="3"/>`;
  const yTicks = [.05, .1].map(value => html`<line class="rm-grid-line" x1="${x0}" y1="${fixed(chartY(value))}" x2="${x1}" y2="${fixed(chartY(value))}"/>${raw(localized(x0 - 6, fixed(chartY(value) + 4.5), decimal(value), 'end'))}`);
  const xTicks = [3, 4, 6, 10, 18, Infinity].map(n => html`<line class="rm-axis" x1="${fixed(chartX(n))}" y1="${yBottom}" x2="${fixed(chartX(n))}" y2="${yBottom + 4}"/>${raw(text(fixed(chartX(n)), yBottom + 17, n === 3 ? 'n = 3' : Number.isFinite(n) ? String(n) : '∞', 'middle', 'rm-label rm-tick'))}`);
  const trend = rows.map((row, i) => (i ? 'L' : 'M') + fixed(chartX(row.n)) + ' ' + fixed(chartY(row.ratio))).join('');
  // The legend sits in the empty lower right, its dots in one column under the limit dot at ∞.
  const [legendX, legendY] = [x1, 99];
  return html`<svg class="rm-chart" viewBox="0 0 ${W} ${H}" role="img" data-label="ringminChartLabel" aria-label="${copy.it.ringminChartLabel}">
${raw(yTicks.join(''))}
<line class="rm-arc" x1="${x0}" y1="${fixed(cStar)}" x2="${x1}" y2="${fixed(cStar)}" stroke-width="${fixed(Math.max(1.2, (chartY(lower) - chartY(upper))))}"/>
<path class="rm-trend" d="${trend}"/>
${raw(rows.map(dot).join(''))}<circle class="rm-limit" cx="${x1}" cy="${fixed(cStar)}" r="3.5"/>
<line class="rm-axis" x1="${x0}" y1="${yTop - 6}" x2="${x0}" y2="${yBottom}"/><line class="rm-axis" x1="${x0}" y1="${yBottom}" x2="${x1 + 8}" y2="${yBottom}"/>
${raw(xTicks.join(''))}${raw(text(x0 - 6, yBottom + 4.5, '0', 'end', 'rm-label rm-tick'))}
${raw(text(x0 - 6, fixed(cStar + 5), 'C*', 'end', 'rm-label rm-key'))}${raw(text(x0 + 6, yTop - 4, 'R(n)/n²', 'start'))}
<circle class="rm-dot" cx="${legendX}" cy="${legendY}" r="2.4"/>${raw(word(legendX - 6, legendY + 4, 'ringminCertified'))}
<circle class="rm-dot rm-open" cx="${legendX}" cy="${legendY + 12}" r="2.4"/>${raw(word(legendX - 6, legendY + 16, 'ringminBestFound'))}
</svg>`;
}
