import data from '../../data/ringmin.json' with { type: 'json' };
import { html, raw } from '../lib/html.mjs';

const round = value => Number(value.toFixed(2));

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

// One configuration in a 100-unit square. Each drawing has its own scale, so
// the central circle grows with n while the frame stays the same.
function configuration(optimum) {
  const list = circles(optimum);
  const extent = Math.max(...list.map(c => Math.max(Math.abs(c.x), Math.abs(c.y)) + c.r));
  const k = 46 / extent;
  const at = value => round(50 + value * k);
  const outer = list.map(c => html`<circle class="${c.floating ? 'rm-floating' : 'rm-circle'}" cx="${at(c.x)}" cy="${at(c.y)}" r="${round(c.r * k)}"/>`).join('');
  return html`<div class="rm-cell"><svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">${raw(outer)}<circle class="rm-centre" cx="50" cy="50" r="${round(optimum.R_float64 * k)}"/></svg><span>n = ${optimum.n}</span></div>`;
}

/** Paper I: the twelve certified configurations, six by two (four columns on a phone). */
export function configurations({ copy }) {
  return html`<div class="rm-grid" role="img" data-label="ringminGridLabel" aria-label="${copy.it.ringminGridLabel}">${raw(data.optima.map(configuration).join(''))}</div>`;
}

/** Paper II: R(n)/n² against n, with the 1/8 line that C* stays above. */
export function chart({ t, copy }) {
  const W = 360, H = 216, left = 44, right = 24, top = 30, bottom = 30;
  const rows = data.asymptotic;
  const first = rows[0].n, last = rows.at(-1).n, max = .14;
  const x = n => round(left + (n - first) / (last - first) * (W - left - right));
  const y = value => round(top + (1 - value / max) * (H - top - bottom));
  const ticks = [0, .05, .1];
  const grid = ticks.map(value => html`<path class="rm-axis" d="M${left} ${y(value)}H${W - right}"/><text class="rm-tick" x="${left - 6}" y="${y(value) + 4}" text-anchor="end">${value === 0 ? '0' : value.toFixed(2)}</text>`).join('');
  const labels = rows.filter(row => row.n % 3 === 0).map(row => html`<text class="rm-tick" x="${x(row.n)}" y="${H - bottom + 16}" text-anchor="middle">${row.n}</text>`).join('');
  const dots = rows.map(row => html`<circle class="${row.certified ? 'rm-dot' : 'rm-dot rm-open'}" cx="${x(row.n)}" cy="${y(row.ratio)}" r="3.4"/>`).join('');
  const line = 'M' + rows.map(row => x(row.n) + ' ' + y(row.ratio)).join('L');
  return html`<svg class="rm-chart" viewBox="0 0 ${W} ${H}" role="img" data-label="ringminChartLabel" aria-label="${copy.it.ringminChartLabel}">
${raw(grid)}${raw(labels)}
<text class="rm-tick" x="${W - 2}" y="${H - bottom + 16}" text-anchor="end">n</text>
<text class="rm-tick" x="4" y="12">R(n)/n²</text>
<path class="rm-limit" d="M${left} ${y(1 / 8)}H${W - right}"/>
<text class="rm-limit-label" x="${W - 4}" y="${y(1 / 8) - 7}" text-anchor="end" data-i18n="ringminLimit">${t('ringminLimit')}</text>
<path class="rm-trend" d="${line}"/>${raw(dots)}
</svg>`;
}
