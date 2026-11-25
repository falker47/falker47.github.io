import { html, raw } from '../lib/html.mjs';
import { picture } from '../lib/media.mjs';
import { actionLink, label, localized } from './components.mjs';
import { icon } from './icons.mjs';

// Breadcrumb back to the projects inside the home, written as "← I miei progetti".
export function crumb({ t, copy }, { href = '/#progetti', key = 'backToProjects', text } = {}) {
  return html`<nav class="detail-crumbs" aria-label="${copy.it.detailBreadcrumb}" data-label="detailBreadcrumb"><a href="${href}"><span aria-hidden="true">←</span> ${text ?? label(t, key)}</a></nav>`;
}

export function action(t, href, key) {
  return actionLink(href, label(t, key), { className: 'detail-link' });
}

// Short facts beside the cover: a label and its value on one line each.
export function facts(t, rows) {
  return html`<dl class="facts">${raw(rows.map(([key, value]) =>
    html`<div><dt>${label(t, key)}</dt><dd>${value}</dd></div>`).join(''))}</dl>`;
}

export function projectFacts(t, { kind, stack, where }) {
  return facts(t, [['specKind', localized(kind)], ['specStack', stack.join(' · ')], ['specWhere', localized(where)]]);
}

const largest = media => Math.max(...media.variants.filter(variant => variant.width <= (media.nativeWidth ?? Infinity)).map(variant => variant.width));

// The cover never grows past its largest rendition.
export function cover(media, { sizes, fetchpriority = 'high' } = {}) {
  const max = largest(media);
  const fitted = sizes ?? `(min-width: 900px) min(${max}px, calc((min(100vw, 1504px) - 152px) * 0.56)), min(${max}px, calc(100vw - 32px))`;
  return html`<figure class="detail-cover" style="--image-max: ${max}px">${raw(picture(media, { sizes: fitted, fetchpriority }))}</figure>`;
}

/**
 * The top of a project page: the cover, a label, the title, a lead, the facts
 * and the links. Short blocks follow under ruled headings.
 */
export function detailPage(ctx, { kicker, media, altKey, spec, actions, body, back = {}, sizes, compact = false }) {
  const { route, copy, t } = ctx;
  const image = altKey ? { ...media, alt: { it: copy.it[altKey], en: copy.en[altKey] } } : media;
  return html`<main id="main" tabindex="-1" class="detail-page${compact ? ' detail-compact' : ''}">
  ${raw(crumb(ctx, back))}
  <article class="detail-top" aria-labelledby="page-title">
    ${raw(cover(image, { sizes }))}
    <div class="detail-text"><p class="detail-kicker">${label(t, kicker)}</p>
      <h1 id="page-title">${label(t, route.titleKey)}</h1>
      <p class="detail-lead">${label(t, route.descriptionKey)}</p>
      ${raw(spec)}
      <div class="detail-links">${raw(actions.join(''))}</div>
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

export { icon };
