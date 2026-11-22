import { html, raw } from '../lib/html.mjs';
import projects from '../../data/projects.json' with { type: 'json' };
import mods from '../../data/mods.json' with { type: 'json' };
import credentials from '../../data/certifications.json' with { type: 'json' };
import { picture } from '../lib/media.mjs';
import { certificates, label, localized, primaryCta, statusPanel } from '../partials/components.mjs';
import { groups, specRows, tavola } from '../partials/sheets.mjs';
import { icon, iconNames } from '../partials/icons.mjs';

export const styleguide = {
  path: '/styleguide/', title: 'Technical sheets · Styleguide', noindex: true,
  descriptionKey: 'guideDescription', image: '/assets/images/falkerlogo.png',
  styles: ['/styles/sheets.css', '/styleguide/guide.css'], qaScript: '/styleguide/guide.js', render,
};


function gallery(t, entries) {
  return html`<ul class="data-gallery">${raw(entries.map(({ id, title, cover, hidden, summary, description }, index) =>
    html`<li data-entry="${id}">${raw(picture(cover, {
      sizes: '(min-width: 1296px) 288px, (min-width: 1000px) calc((100vw - 144px) / 4), (min-width: 700px) calc((100vw - 112px) / 3), (min-width: 600px) calc((100vw - 92px) / 2), calc((100vw - 44px) / 2)',
      fetchpriority: index === 0 && id === projects[0].id ? 'high' : undefined,
    }))}<strong>${title}</strong>${hidden ? label(t, 'guideHidden') : ''}
    <p>${localized(summary ?? description)}</p></li>`).join('\n'))}</ul>`;
}

function dataSection(ctx) {
  const { t } = ctx;
  return html`<section class="guide-section data-section" id="data" aria-labelledby="data-title">
  <h2 id="data-title">${label(t, 'guideData')}</h2>
  <h3>${label(t, 'workTitle')}</h3>${raw(gallery(t, projects))}
  <h3>${label(t, 'featuredMods')}</h3>${raw(gallery(t, mods.items))}
  <h3>${label(t, 'guideCertificates')}</h3>${raw(certificates(ctx, credentials, 'certificate-preview'))}
  </section>`;
}

function render(ctx) {
  const { t } = ctx;
  const sample = groups.find(group => group.id === 'giochi').items.find(item => item.id === 'camaleonte');
  return html`<main id="main" tabindex="-1" class="guide">
  <div class="guide-intro"><h1>${label(t, 'guideTitle')}</h1><label>${label(t, 'stateControl')}
  <select id="preview-state">${raw(['Default','Hover','Focus','Selected','Disabled'].map(state => html`<option value="${state.toLowerCase()}" data-i18n="state${state}">${t('state' + state)}</option>`).join(''))}</select></label></div>
  ${raw(dataSection(ctx))}
  <section class="guide-section"><h2>${label(t, 'guideSheet')}</h2>
    ${raw(tavola(ctx, sample, 0))}
  </section>
  <div class="guide-columns">
    <section class="guide-section"><h2>${label(t, 'guideSpec')}</h2>
    ${raw(specRows(t, [['specKind', localized(sample.kind)], ['specStack', sample.stack.join(' · ')], ['specWhere', localized(sample.where)]]))}</section>
    <section class="guide-section"><h2>${label(t, 'guideActions')}</h2>${raw(primaryCta(t, 'cta', '/projects/'))}</section>
  </div>
  <section class="guide-section"><h2>${label(t, 'guideStatus')}</h2><div class="guide-states">
  ${raw(statusPanel(t, { kind: 'redirect-stub', heading: 'moved', action: 'visitDestination', href: '/projects/' }))}
  ${raw(statusPanel(t, { kind: 'not-found', heading: 'missingPage', action: 'backHome', href: '/' }))}</div></section>
  <section class="guide-section"><h2>${label(t, 'guideIcons')}</h2><ul class="icon-list">${raw(iconNames.map(name => html`<li>${icon(name)}<code>${name}</code></li>`).join(''))}</ul></section>
</main>`;
}
