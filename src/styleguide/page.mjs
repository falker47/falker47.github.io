import { html, raw } from '../lib/html.mjs';
import projects from '../../data/projects.json' with { type: 'json' };
import mods from '../../data/mods.json' with { type: 'json' };
import credentials from '../../data/certifications.json' with { type: 'json' };
import research from '../../data/research.json' with { type: 'json' };
import tutoring from '../../data/tutoring.json' with { type: 'json' };
import { picture } from '../lib/media.mjs';
import { certificates, chips, disclosure, label, localized, modRow, primaryCta, ratingCard, registerRow, sheetFrame, statTile, statusPanel, tabs } from '../partials/components.mjs';
import { icon, iconNames } from '../partials/icons.mjs';

export const styleguide = {
  path: '/styleguide/', title: 'Sheets & Register · Styleguide', noindex: true,
  descriptionKey: 'guideDescription', image: '/assets/images/falkerlogo.png',
  styles: ['/styleguide/guide.css'], qaScript: '/styleguide/guide.js', render,
};

const kinds = [['all', 'allKinds'], ['game', 'games'], ['tool', 'tools']];
const ringmin = projects.find(project => project.id === research.id);

function gallery(t, entries) {
  return html`<ul class="data-gallery">${raw(entries.map(({ id, title, cover, hidden, summary, description }, index) =>
    html`<li data-entry="${id}">${raw(picture(cover, {
      sizes: '(min-width: 1000px) 270px, (min-width: 700px) 30vw, 45vw',
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
  const { t, copy } = ctx;
  const examples = projects.filter(item => ['camaleonte', 'panacea'].includes(item.id)).map(item => ({
    ...item, image: item.cover, href: item.links[0].url, filter: item.category,
    stack: item.stack.join(' · '), github: item.links.find(link => link.type === 'repo')?.url,
  }));
  const modExamples = mods.items.slice(0, 2).map(item => ({
    ...item, image: item.cover, href: item.url, summary: item.description,
  }));
  const rating = tutoring.ratings[0];
  const detail = Object.fromEntries(Object.entries(copy).map(([lang, dictionary]) =>
    [lang, dictionary[rating.ratings === 1 ? 'ratingOne' : 'ratingOther'].replace('{count}', rating.ratings)]));
  const filters = kinds.map(([value, key]) => ({ value, key, count: examples.filter(item => value === 'all' || item.filter === value).length }));
  const categories = [{ id: 'examples', key: 'softwareTitle', count: examples.length }, { id: 'mod-examples', key: 'moddingTitle', count: modExamples.length }];
  return html`<main id="main" tabindex="-1" class="guide">
  <div class="guide-intro"><h1>${label(t, 'guideTitle')}</h1><label>${label(t, 'stateControl')}
  <select id="preview-state">${raw(['Default','Hover','Focus','Selected','Disabled'].map(state => html`<option value="${state.toLowerCase()}" data-i18n="state${state}">${t('state' + state)}</option>`).join(''))}</select></label></div>
  ${raw(dataSection(ctx))}
  <section class="guide-section"><h2>${label(t, 'guideRegister')}</h2>
    ${raw(tabs(ctx, categories, 'workAreas'))}
    <div id="panel-examples" role="tabpanel" aria-labelledby="tab-examples" tabindex="0" data-filter-list>
    ${raw(chips(ctx, filters, 'filters'))}
    ${raw(examples.map((item, index) => registerRow(ctx, item, index)).join('\n'))}</div>
    <div id="panel-mod-examples" role="tabpanel" aria-labelledby="tab-mod-examples" tabindex="0">
    ${raw(modExamples.map((item, index) => modRow(t, item, index)).join('\n'))}</div>
  </section>
  <div class="guide-columns">
    <section class="guide-section"><h2>${label(t, 'guideSheet')}</h2>
    ${raw(sheetFrame(t, { image: ringmin.cover, caption: 'sheetCaption' }))}
    ${raw(disclosure(t, { id: 'research-details', key: 'guideDisclosure', content: html`<p>${localized(research.summary)}</p>` }))}</section>
    <div><section class="guide-section"><h2>${label(t, 'guideMods')}</h2>${raw(modRow(t, modExamples[0], 0))}</section>
    <section class="guide-section"><h2>${label(t, 'guideEvidence')}</h2><div class="guide-stats">
    ${raw(statTile(t, { valueKey: 'moddingNumber', key: 'downloadsLabel', iconName: 'download', href: mods.profile }))}
    ${raw(ratingCard(t, { ...rating, href: rating.url, detail }))}</div></section>
    <section class="guide-section"><h2>${label(t, 'guideActions')}</h2>${raw(primaryCta(t, 'cta', '/#progetti'))}</section></div>
  </div>
  <section class="guide-section"><h2>${label(t, 'guideStatus')}</h2><div class="guide-states">
  ${raw(statusPanel(t, { kind: 'redirect-stub', heading: 'moved', action: 'visitDestination', href: '/#progetti' }))}
  ${raw(statusPanel(t, { kind: 'not-found', heading: 'missingPage', action: 'backHome', href: '/' }))}</div></section>
  <section class="guide-section"><h2>${label(t, 'guideIcons')}</h2><ul class="icon-list">${raw(iconNames.map(name => html`<li>${icon(name)}<code>${name}</code></li>`).join(''))}</ul></section>
</main>`;
}
