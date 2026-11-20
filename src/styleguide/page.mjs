import { html, raw } from '../lib/html.mjs';
import { software, mods, ratings } from '../pages/home-examples.mjs';
import { certificates, chips, disclosure, label, modRow, primaryCta, ratingCard, registerRow, sheetFrame, statTile, statusPanel, tabs } from '../partials/components.mjs';
import { icon, iconNames } from '../partials/icons.mjs';

export const styleguide = {
  path: '/styleguide/', title: 'Sheets & Register · Styleguide', noindex: true,
  descriptionKey: 'guideDescription', image: '/assets/images/falkerlogo.png',
  styles: ['/styleguide/guide.css'], qaScript: '/styleguide/guide.js', render,
};

const certificatesShown = [
  { key: 'certAlgorithms', thumb: 'assets/algorithms-thumb.webp', full: 'assets/algorithms-full.webp' },
  { key: 'certArchaeo', thumb: 'assets/archaeoastronomy-thumb.webp', full: 'assets/archaeoastronomy-full.webp' },
];
const kinds = [['all','allKinds'], ['game','games'], ['tool','tools']];

function render(ctx) {
  const { t } = ctx;
  const examples = software.filter(item => item.filter !== 'app');
  const filters = kinds.map(([value, key]) => ({ value, key, count: examples.filter(item => value === 'all' || item.filter === value).length }));
  const categories = [{ id: 'examples', key: 'softwareTitle', count: examples.length }, { id: 'mod-examples', key: 'moddingTitle', count: mods.length }];
  return html`<main id="main" tabindex="-1" class="guide">
  <div class="guide-intro"><h1>${label(t, 'guideTitle')}</h1><label>${label(t, 'stateControl')}
  <select id="preview-state">${raw(['Default','Hover','Focus','Selected','Disabled'].map(state => html`<option value="${state.toLowerCase()}" data-i18n="state${state}">${t('state' + state)}</option>`).join(''))}</select></label></div>
  <section class="guide-section"><h2>${label(t, 'guideRegister')}</h2>
    ${raw(tabs(ctx, categories, 'workAreas'))}
    <div id="panel-examples" role="tabpanel" aria-labelledby="tab-examples" tabindex="0" data-filter-list>
    ${raw(chips(ctx, filters, 'filters'))}
    ${raw(examples.map((item, index) => registerRow(ctx, item, index)).join('\n'))}</div>
    <div id="panel-mod-examples" role="tabpanel" aria-labelledby="tab-mod-examples" tabindex="0">
    ${raw(mods.map((item, index) => modRow(t, item, index)).join('\n'))}</div>
  </section>
  <div class="guide-columns">
    <section class="guide-section"><h2>${label(t, 'guideSheet')}</h2>
    ${raw(sheetFrame(t, { image: 'assets/ringmin.webp', caption: 'sheetCaption', width: 840, height: 560 }))}
    ${raw(disclosure(t, { id: 'research-details', key: 'guideDisclosure', content: html`<p>${label(t, 'ringminText')}</p>` }))}</section>
    <div><section class="guide-section"><h2>${label(t, 'guideMods')}</h2>${raw(modRow(t, mods[0], 0))}</section>
    <section class="guide-section"><h2>${label(t, 'guideEvidence')}</h2><div class="guide-stats">
    ${raw(statTile(t, { valueKey: 'moddingNumber', key: 'downloadsLabel', iconName: 'download', href: 'https://www.nexusmods.com/profile/falker47/mods' }))}
    ${raw(ratingCard(t, ratings[0]))}</div></section>
    <section class="guide-section"><h2>${label(t, 'guideActions')}</h2>${raw(primaryCta(t, 'cta', '/#progetti'))}</section></div>
  </div>
  <section class="guide-section"><h2>${label(t, 'guideCertificates')}</h2>${raw(certificates(ctx, certificatesShown, 'certificate-preview'))}</section>
  <section class="guide-section"><h2>${label(t, 'guideStatus')}</h2><div class="guide-states">
  ${raw(statusPanel(t, { kind: 'redirect-stub', heading: 'moved', action: 'visitDestination', href: '/#progetti' }))}
  ${raw(statusPanel(t, { kind: 'not-found', heading: 'missingPage', action: 'backHome', href: '/' }))}</div></section>
  <section class="guide-section"><h2>${label(t, 'guideIcons')}</h2><ul class="icon-list">${raw(iconNames.map(name => html`<li>${icon(name)}<code>${name}</code></li>`).join(''))}</ul></section>
</main>`;
}
