import { html, raw } from '../lib/html.mjs';
import { label } from './components.mjs';
import { icon } from './icons.mjs';
import { sheetFigure, specTable } from './sheets.mjs';

// Breadcrumb back to a parent page, written as "← Progetti".
export function crumb({ t, copy }, { href = '/projects/', key = 'workTitle', text } = {}) {
  return html`<nav class="detail-crumbs" aria-label="${copy.it.detailBreadcrumb}" data-label="detailBreadcrumb"><a href="${href}"><span aria-hidden="true">←</span> ${text ?? label(t, key)}</a></nav>`;
}

export function action(t, href, key, external = true) {
  return html`<a class="tavola-link" href="${href}">${label(t, key)} <span aria-hidden="true">${external ? '↗' : '→'}</span></a>`;
}

/**
 * The top sheet of a project page: a framed image, plate label, title, lead,
 * spec table and actions. Short blocks follow under ruled headings.
 */
export function detailPage(ctx, { plate, media, altKey, spec, actions, body, back = {}, sizes }) {
  const { route, copy, t } = ctx;
  const image = altKey ? { ...media, alt: { it: copy.it[altKey], en: copy.en[altKey] } } : media;
  return html`<main id="main" tabindex="-1" class="detail-page">
  ${raw(crumb(ctx, back))}
  <article class="tavola tavola-top" aria-labelledby="page-title">
    ${raw(sheetFigure(image, { fetchpriority: 'high', sizes }))}
    <div class="tavola-text">${raw(plate)}
      <h1 id="page-title">${label(t, route.titleKey)}</h1>
      <p class="tavola-summary">${label(t, route.descriptionKey)}</p>
      ${raw(spec)}
      <div class="tavola-links">${raw(actions.join(''))}</div>
    </div>
  </article>
  ${raw(body)}
</main>`;
}

export function section(t, heading, content, id) {
  return html`<section class="detail-block" id="${id}" aria-labelledby="${id}-title">
    <h2 id="${id}-title">${label(t, heading)}</h2>
    <div class="detail-block-body">${raw(content)}</div>
  </section>`;
}

export function plateFor(t, number, extraKey) {
  return html`<p class="tavola-label">${label(t, 'sheetLabel')} ${number}${extraKey ? raw(html` · ${label(t, extraKey)}`) : ''}</p>`;
}

export { specTable, icon };
