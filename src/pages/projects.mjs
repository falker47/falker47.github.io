import { html, raw } from '../lib/html.mjs';
import { label } from '../partials/components.mjs';
import { groups, tavola } from '../partials/sheets.mjs';

export const page = {
  path: '/projects/', titleKey: 'projectsPageTitle', descriptionKey: 'projectsIntro',
  image: groups[0].items[0].cover.variants.at(-1).src, type: 'CollectionPage', render,
  styles: ['/styles/sheets.css'],
};

export function render(ctx) {
  const { t, copy } = ctx;
  let index = 0;
  const sections = groups.map(group => html`<section class="sheet-group" id="${group.id}" aria-labelledby="${group.id}-title">
  <div class="group-head"><h2 id="${group.id}-title">${label(t, group.key)}</h2><span class="group-count" aria-hidden="true">${String(group.items.length).padStart(2, '0')}</span></div>
  ${raw(group.items.map(item => tavola(ctx, item, index++)).join('\n'))}
</section>`);
  return html`<main id="main" tabindex="-1" class="sheets-page">
  <header class="sheets-intro">
    <h1>${label(t, 'workTitle')}</h1>
    <p class="sheets-lead">${label(t, 'projectsIntro')}</p>
    <nav class="sheets-index" aria-label="${copy.it.projectsIndex}" data-label="projectsIndex"><ul>
    ${raw(groups.map(group => html`<li><a href="#${group.id}">${label(t, group.key)} <span class="index-count">${group.items.length}</span></a></li>`).join('\n'))}
    </ul></nav>
  </header>
  ${raw(sections.join('\n'))}
</main>`;
}
