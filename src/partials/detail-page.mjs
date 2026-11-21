import { html, raw } from '../lib/html.mjs';
import { label, sheetFrame } from './components.mjs';
import { icon } from './icons.mjs';

export function detailPage({ route, copy, t }, { kicker, media, altKey, caption, body, resources, research = false }) {
  const back = research ? ['/#ricerca', 'detailBackResearch'] : ['/#software', 'detailBackSoftware'];
  const image = { ...media, alt: { it: copy.it[altKey], en: copy.en[altKey] } };
  return html`<main id="main" class="detail-page">
  <nav class="detail-crumbs" aria-label="${copy.it.detailBreadcrumb}" data-label="detailBreadcrumb">
    <a href="/#progetti">${label(t, 'workTitle')}</a><span aria-hidden="true">›</span>
    <span aria-current="page">${label(t, route.titleKey)}</span>
  </nav>
  <header class="detail-hero">
    <div class="detail-intro"><p class="detail-kicker">${label(t, kicker)}</p>
      <h1>${label(t, route.titleKey)}</h1>
      <p class="detail-lead">${label(t, route.descriptionKey)}</p>
    </div>
    ${raw(sheetFrame(t, { image, caption, fetchpriority: 'high',
      sizes: '(min-width: 1200px) 584px, (min-width: 800px) 51vw, (min-width: 600px) calc(100vw - 106px), calc(100vw - 58px)' }))}
  </header>
  ${raw(body)}
  ${raw(section(t, 'detailResources', resources, 'risorse'))}
  <a class="detail-back" href="${back[0]}"><span aria-hidden="true">←</span> ${label(t, back[1])}</a>
</main>`;
}

export function section(t, heading, content, id) {
  return html`<section class="detail-section" aria-labelledby="${id}">
    <h2 id="${id}">${label(t, heading)}</h2>
    <div class="detail-section-body">${raw(content)}</div>
  </section>`;
}

export function resource(t, href, key, glyph) {
  return html`<li><a class="detail-resource" href="${href}">${icon(glyph)}${label(t, key)}${icon('arrow-ne')}</a></li>`;
}

export function resourceList(links) {
  return html`<ul class="detail-links">${raw(links.join('\n'))}</ul>`;
}
