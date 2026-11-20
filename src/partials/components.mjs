import { html, raw } from '../lib/html.mjs';
import { img, picture } from '../lib/media.mjs';
import { icon } from './icons.mjs';

export const label = (t, key) => raw(html`<span data-i18n="${key}">${t(key)}</span>`);
export const localized = (value, lang = 'it') => raw(html`<span data-text-it="${value.it}" data-text-en="${value.en}">${value[lang]}</span>`);
const group = items => raw(items.join('\n'));
const serial = index => String(index + 1).padStart(2, '0');

export function primaryCta(t, key, href) {
  return html`<a class="cta primary-cta" href="${href}">${label(t, key)}<span class="cta-icon" aria-hidden="true">${icon('arrow-right')}</span></a>`;
}

export function tabs({ t, copy }, items, labelKey) {
  return html`<div class="register-tabs" role="tablist" aria-label="${copy.it[labelKey]}" data-label="${labelKey}" hidden>
  ${group(items.map(({ id, key, count }, i) => html`<button id="tab-${id}" type="button" role="tab" aria-selected="${i === 0}" aria-controls="panel-${id}" tabindex="${i === 0 ? 0 : -1}">${label(t, key)}<span class="count">${count}</span></button>`))}
</div>`;
}

export function chips({ t, copy }, items, labelKey) {
  return html`<div class="filter-chips" role="group" aria-label="${copy.it[labelKey]}" data-label="${labelKey}">
  ${group(items.map(({ key, value, count }, i) => html`<button type="button" data-filter="${value}" aria-pressed="${i === 0}">${label(t, key)}<span class="count">${count}</span></button>`))}
</div>`;
}

function rowThumbnail(image) {
  if (typeof image === 'string') return html`<img class="row-thumb" src="${image}" alt="" width="128" height="72" loading="lazy">`;
  return picture(image, { className: 'row-thumb', sizes: '(max-width: 699px) 104px, 128px' });
}

function rowSummary(t, summary) {
  if (typeof summary === 'string') return html`<p class="row-summary" data-i18n="${summary}">${t(summary)}</p>`;
  return html`<p class="row-summary">${localized(summary)}</p>`;
}

export function registerRow({ t }, item, index) {
  const { title, image, href, summary, kind, stack, github, filter, internal = false } = item;
  return html`<article class="register-row" data-kind="${filter}">
  <span class="row-index">${serial(index)}</span>${raw(rowThumbnail(image))}
  <div class="row-copy"><h3><a class="row-title" href="${href}">${title}<span class="row-arrow">${icon(internal ? 'arrow-right' : 'arrow-ne')}</span></a></h3>
  ${raw(rowSummary(t, summary))}</div>
  <span class="row-kind">${typeof kind === 'string' ? label(t, kind) : localized(kind)}</span><span class="row-stack">${stack}</span>
  <div class="row-actions"><span aria-hidden="true">${label(t, internal ? 'viewSheet' : 'openLink')} ${icon(internal ? 'arrow-right' : 'arrow-ne')}</span>
  ${github ? raw(html`<a class="icon-button" href="${github}" aria-label="GitHub · ${title}">${icon('github')}</a>`) : ''}</div>
</article>`;
}

export function modRow(t, item, index) {
  return html`<article class="mod-row">
  <span class="row-index">${serial(index)}</span>${raw(rowThumbnail(item.image))}
  <div class="row-copy"><h3><a class="row-title" href="${item.href}">${item.title}<span class="row-arrow">${icon('arrow-ne')}</span></a></h3>
  ${raw(rowSummary(t, item.summary))}</div>
  <span class="row-kind">${item.game}</span><span class="mod-action" aria-hidden="true">Nexus Mods ${icon('arrow-ne')}</span></article>`;
}

export function sheetFrame(t, { image, caption }) {
  return html`<figure class="sheet"><div class="sheet-frame">${raw(img(image, { sizes: '(min-width: 840px) 560px, 90vw' }))}</div><figcaption>${label(t, caption)}</figcaption></figure>`;
}

export function statTile(t, { value, key, valueKey, iconName, href, nexusStat }) {
  return html`<a class="stat-tile" href="${href}">${icon(iconName)}<span><strong${raw(valueKey ? html` data-i18n="${valueKey}"` : '')}${raw(nexusStat ? html` data-nexus-stat="${nexusStat}"` : '')}>${valueKey ? t(valueKey) : value}</strong>${label(t, key)}</span>${icon('arrow-ne')}</a>`;
}

export function ratingCard(t, { source, score, scale, detail, href, logo }) {
  return html`<a class="rating-card" href="${href}"><span>${logo ? raw(html`<img src="${logo}" width="24" height="24" alt="" loading="lazy">`) : ''}${source} ${icon('arrow-ne')}</span><strong>${score}<small>/${scale}</small></strong>${typeof detail === 'string' ? label(t, detail) : localized(detail)}</a>`;
}

export function certificates({ t }, entries, id) {
  return html`<div class="certificate-grid">
  ${group(entries.map(({ thumbnail, full, alt, title, issuer, year }) => html`<a class="certificate" href="${full.src}" data-viewer="${id}">${raw(picture({ ...thumbnail, alt, variants: [thumbnail, full] }, { sizes: '(min-width: 700px) 235px, 45vw' }))}<span>${title}</span> ${icon('external')} <small>${issuer} · ${year}</small></a>`))}
</div>
<dialog class="certificate-viewer" id="${id}" aria-labelledby="${id}-title"><div class="viewer-bar"><h3 id="${id}-title"></h3><form method="dialog"><button class="text-button" autofocus>${label(t, 'closeViewer')}</button></form></div><img alt=""></dialog>`;
}

export function disclosure(t, { id, key, content, className = '' }) {
  return html`<details class="disclosure${className ? ` ${className}` : ''}" id="${id}"><summary>${label(t, key)}${icon('chevron')}</summary><div class="disclosure-body">${raw(content)}</div></details>`;
}

export function statusPanel(t, { kind, heading, action, href }) {
  return html`<div class="status-panel ${kind}"><p class="status-code">${kind === 'not-found' ? '404' : icon('arrow-right')}</p><h3>${label(t, heading)}</h3>
  <a class="text-link" href="${href}">${label(t, action)} ${icon('arrow-right')}</a></div>`;
}
