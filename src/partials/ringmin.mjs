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

/** Paper II: R(n)/n² against n, with the 1/8 line that C* stays above. */
export function chart({ t, copy }) {
  const W = 520, H = 230, left = 62, bottom = 30, top = 18, right = 16;
  const rows = data.asymptotic;
  const first = rows[0].n, last = rows.at(-1).n, low = .02, high = .14;
  const x = n => fixed(left + (n - first) / (last - first) * (W - left - right), 1);
  const y = value => fixed(top + (high - value) / (high - low) * (H - top - bottom), 1);
  const grid = [.02, .05, .08, .11, .14].map(value => html`<path class="rm-axis" d="M${left} ${y(value)}H${W - right}"/><text class="rm-tick" x="${left - 8}" y="${y(value) + 4}" text-anchor="end">${value.toFixed(2)}</text>`).join('');
  const labels = rows.filter(row => row.n % 3 === 0).map(row => html`<text class="rm-tick" x="${x(row.n)}" y="${H - 8}" text-anchor="middle">${row.n}</text>`).join('');
  const dots = rows.map(row => html`<circle class="${row.certified ? 'rm-dot' : 'rm-dot rm-open'}" cx="${x(row.n)}" cy="${y(row.ratio)}" r="4"/>`).join('');
  const line = 'M' + rows.map(row => x(row.n) + ' ' + y(row.ratio)).join('L');
  return html`<svg class="rm-chart" viewBox="0 0 ${W} ${H}" role="img" data-label="ringminChartLabel" aria-label="${copy.it.ringminChartLabel}">
${raw(grid)}${raw(labels)}
<path class="rm-limit" d="M${left} ${y(1 / 8)}H${W - right}"/>
<text class="rm-limit-label" x="${W - right - 4}" y="${y(1 / 8) - 8}" text-anchor="end" data-i18n="ringminLimit">${t('ringminLimit')}</text>
<path class="rm-trend" d="${line}"/>${raw(dots)}
<text class="rm-tick" x="${left}" y="${top - 4}">R(n) / n²</text>
</svg>`;
}
