import uses from '../../data/uses.json' with { type: 'json' };
import { html, raw } from '../lib/html.mjs';
import { label } from '../partials/components.mjs';
import { action, detailPage, facts, section } from '../partials/detail-page.mjs';
import { icon } from '../partials/icons.mjs';

const variants = [480, 960, 1440].map(width => ({
  src: `/assets/images/uses-${width}.webp`, width, height: width * 9 / 16,
}));
const cover = { ...variants[0], variants };

const picks = uses.items;

export const page = {
  path: '/uses/', titleKey: 'usesPageTitle', descriptionKey: 'usesPageLead', image: variants.at(-1).src, render,
};

function recommendation(t, item) {
  // The product beside its text, cut from the cover illustration (decorative: the name follows).
  return html`<li class="detail-pick"><img class="pick-photo" src="${item.image.src}" width="${item.image.width}" height="${item.image.height}" alt="" loading="lazy" decoding="async">
    <div class="pick-text"><p class="detail-meta">${icon(item.glyph)} ${label(t, item.category)}</p>
    <h3 id="${item.title}-name">${label(t, item.title)}</h3><p>${label(t, item.text)}</p>
    <a href="${item.url}" rel="sponsored noopener" aria-labelledby="${item.title}-cta ${item.title}-name">
      <span id="${item.title}-cta">${label(t, 'usesAmazon')}</span> <span aria-hidden="true">↗</span></a>
    <small>${label(t, 'usesPaidLink')}</small></div>
  </li>`;
}

export function render(ctx) {
  const { t } = ctx;
  return detailPage(ctx, {
    compact: true, kicker: 'usesPageKicker', media: cover, altKey: 'usesImageAlt',
    back: { href: '/', text: 'Home' },
    spec: facts(t, [
      ['specKind', label(t, 'usesSpecKind')], ['usesSpecCount', String(picks.length)], ['specWhere', label(t, 'usesSpecWhere')],
    ]),
    actions: [action(t, '#consigli', 'usesSeePicks')],
    body: section(t, 'usesPicksTitle', html`<ul class="detail-list detail-picks">${raw(picks.map(item => recommendation(t, item)).join('\n'))}</ul>`, 'consigli')
      + section(t, 'usesEditorialTitle', html`<p>${label(t, 'usesEditorialText')}</p>`, 'criterio')
      + section(t, 'usesDisclosureTitle', html`<p>${label(t, 'usesDisclosure')}</p>`, 'affiliazione'),
  });
}
