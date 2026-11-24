import featured from '../../../data/mods.json' with { type: 'json' };
import nexus from '../../../data/nexus-mods.json' with { type: 'json' };
import snapshot from '../../../data/nexus-downloads.json' with { type: 'json' };
import projects from '../../../data/projects.json' with { type: 'json' };
import research from '../../../data/research.json' with { type: 'json' };
import tutoring from '../../../data/tutoring.json' with { type: 'json' };
import { html, raw } from '../../lib/html.mjs';
import { img } from '../../lib/media.mjs';
import { label, localized } from '../../partials/components.mjs';
import { chart, configurations } from '../../partials/ringmin.mjs';

// "I miei progetti": every project lives here. All groups are rendered at build
// time; the client only shows one tab and one category at a time.
const visible = projects.filter(item => !item.hidden).sort((a, b) => a.order - b.order);
export const categories = [
  { id: 'app', key: 'appsCount' },
  { id: 'game', key: 'gamesCount' },
  { id: 'tool', key: 'toolsCount' },
].map(category => ({ ...category, items: visible.filter(item => item.category === category.id) }));
export const counts = Object.fromEntries(categories.map(category => [category.id, category.items.length]));
export const modGroups = [
  { id: 'mod', key: 'modsToggle' },
  { id: 'translation', key: 'translationsToggle' },
].map(group => ({ ...group, items: nexus.mods.filter(mod => mod.kind === group.id) }));

if (featured.profile !== 'https://www.nexusmods.com/profile/falker47/mods') throw Error('Unexpected Nexus profile');
const covers = new Map(featured.items.map(item => [Number(/\/mods\/(\d+)$/.exec(item.url)[1]), item]));
const { ratings } = tutoring;
const number = value => raw(html`<span data-i18n-number="${value}">${new Intl.NumberFormat('it-IT').format(value)}</span>`);
const join = items => raw(items.join('\n'));
const cardSizes = '(min-width: 1000px) 400px, (min-width: 700px) 55vw, 80vw';

// Card links, in order: this site's page, the live app, the store, the tester page, the code.
const linkKinds = { demo: ['openLink', '↗'], store: [null, '↗', 'Play Store'], test: ['tryApp', '→'], repo: [null, '↗', 'GitHub'] };
function link(t, href, key, arrow, text, title) {
  return html`<a href="${href}">${key ? label(t, key) : text}<span class="sr-only"> · ${title}</span> <span aria-hidden="true">${arrow}</span></a>`;
}

function projectCard(t, project) {
  const links = project.page ? [link(t, project.page, 'projectPage', '→', null, project.title)] : [];
  for (const type of ['demo', 'store', 'test', 'repo']) {
    const entry = project.links.find(item => item.type === type);
    if (entry) links.push(link(t, entry.url, linkKinds[type][0], linkKinds[type][1], linkKinds[type][2], project.title));
  }
  return html`<li class="card">
<div class="card-cover">${raw(img(project.cover, { sizes: cardSizes }))}</div>
<div class="card-body"><p class="pill">${localized(project.kind)}</p>
<h4>${project.title}</h4>
<p class="card-stack">${project.stack.join(' · ')}</p>
<p class="card-summary">${localized(project.summary)}</p>
<p class="card-links">${join(links)}</p></div></li>`;
}

function rail(copy, cards, modifier = '') {
  return html`<div class="rail${modifier}">
<button type="button" class="rail-step" data-step="-1" data-label="railPrevious" aria-label="${copy.it.railPrevious}" hidden><span aria-hidden="true">←</span></button>
<ul class="rail-track">
${join(cards)}
</ul>
<button type="button" class="rail-step" data-step="1" data-label="railNext" aria-label="${copy.it.railNext}" hidden><span aria-hidden="true">→</span></button>
</div>`;
}

// The counts are the category toggles. Without scripts every group is listed under its own label.
function picker({ t, copy }, name, groups, labelKey, card, note = '', modifier = '') {
  const toggles = groups.map((group, index) => html`<button type="button" class="picker-toggle cat-${group.id}" data-group="${group.id}" aria-pressed="${index === 0}"><strong>${group.items.length}</strong> ${label(t, group.key)}</button>`);
  const sections = groups.map(group => html`<section class="picker-group cat-${group.id}" data-group="${group.id}" aria-labelledby="${name}-${group.id}">
<p class="picker-heading" id="${name}-${group.id}">${group.items.length} ${label(t, group.key)}</p>
${raw(rail(copy, group.items.map(item => card(t, item)), modifier))}
</section>`);
  return html`<div class="picker">
<div class="picker-head"><div class="picker-bar" role="group" data-label="${labelKey}" aria-label="${copy.it[labelKey]}" hidden>${join(toggles)}</div>${raw(note)}</div>
${join(sections)}
</div>`;
}

const maxDownloads = Math.max(...nexus.mods.map(mod => mod.downloads));
function modCard(t, mod) {
  const cover = covers.get(mod.modId);
  const links = [link(t, mod.url, null, '↗', 'Nexus', mod.name)];
  if (cover?.repo) links.push(link(t, cover.repo, null, '↗', 'GitHub', mod.name));
  const head = mod.kind === 'translation'
    ? html`<div class="mod-type"><span class="pill">IT</span><span>${mod.game}</span></div>`
    : html`<div class="card-cover">${raw(cover
      ? img(cover.cover, { sizes: '(min-width: 700px) 310px, 80vw' })
      : html`<img src="${mod.image.src}" width="${mod.image.width}" height="${mod.image.height}" alt="" loading="lazy" decoding="async">`)}</div>`;
  const width = Math.max(2, Math.round(Math.sqrt(mod.downloads / maxDownloads) * 1000) / 10);
  return html`<li class="card mod-card">
${raw(head)}
<div class="card-body"><h4>${mod.name}</h4>
<p class="card-stack">${mod.kind === 'translation' ? mod.category ?? mod.game : [mod.game, mod.category].filter(Boolean).join(' · ')}</p>
<p class="mod-stats"><strong>${number(mod.downloads)}</strong> ${label(t, 'downloadsWord')}<span class="mod-endorsements">${number(mod.endorsements)} ${label(t, 'endorsementsWord')}</span></p>
<div class="mod-bar" aria-hidden="true"><span style="width:${width}%"></span></div>
<p class="card-links">${join(links)}</p></div></li>`;
}

function nexusNote(t) {
  return html`<p class="picker-note"><a href="${featured.profile}"><strong data-i18n="moddingNumber">${t('moddingNumber')}</strong> ${label(t, 'uniqueDownloads')}</a> <span aria-hidden="true">·</span> <strong data-nexus-stat="modCount" data-i18n="nexusModCount">${t('nexusModCount')}</strong> ${label(t, 'publications')} <span aria-hidden="true">·</span> ${label(t, 'nexusDataOf')} <time data-nexus-stat="checkedOn" datetime="${snapshot.checkedOn}">${new Intl.DateTimeFormat('it-IT', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(snapshot.checkedOn + 'T00:00:00Z'))}</time></p>`;
}

function paperCard(t, paper, figure, repo) {
  const key = 'paper' + paper.number;
  return html`<article class="card paper-card" aria-labelledby="${key}-title">
<div class="paper-figure">${raw(figure)}</div>
<div class="card-body"><p class="card-label">Paper ${paper.number} · arXiv ${paper.arxiv}</p>
<h4 id="${key}-title">${label(t, key + 'Title')}</h4>
<p class="paper-highlight">${label(t, key + 'Highlight')}</p>
<p class="card-summary">${label(t, key + 'Line')}</p>
<p class="card-links"><a href="${paper.url}">arXiv<span class="sr-only"> · Paper ${paper.number}</span> <span aria-hidden="true">↗</span></a>
<a href="${repo}">${label(t, 'codeLink')}<span class="sr-only"> · Paper ${paper.number}</span> <span aria-hidden="true">↗</span></a></p></div></article>`;
}

const star = '<svg viewBox="0 0 24 24"><path d="m12 2.5 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4-4.6-4.5 6.4-.9Z"/></svg>';
function ratingCard(copy, rating, logo) {
  const detail = localized(Object.fromEntries(Object.entries(copy).map(([lang, dictionary]) => {
    const total = dictionary[rating.ratings === 1 ? 'ratingOne' : 'ratingOther'].replace('{count}', rating.ratings);
    return [lang, rating.recommendations ? total + ' · ' + rating.recommendations + ' ' + dictionary.recommendations : total];
  })));
  return html`<a class="card feedback-result" href="${rating.url}"><span class="feedback-source"><img class="platform-logo" src="/assets/images/${logo}.png" alt="" width="24" height="24" loading="lazy">${rating.source} <span aria-hidden="true">↗</span></span><span class="rating-line"><strong class="result-value">${rating.score}<span class="rating-scale">/${rating.scale}</span></strong><span class="rating-stars" aria-hidden="true">${raw(star.repeat(rating.scale))}</span></span><span class="result-label">${detail}</span></a>`;
}

export function workSection(ctx) {
  const { t, copy } = ctx;
  const tabs = [['software', 'softwareTitle'], ['modding', 'moddingTitle'], ['research', 'researchTitle'], ['teaching', 'teachingTitle']];
  const tab = ([id, key], index) => html`<button id="tab-${id}" role="tab" type="button" aria-selected="${index === 0}" aria-controls="panel-${id}" tabindex="${index === 0 ? 0 : -1}" data-panel="${id}">${label(t, key)}</button>`;
  const panel = (id, key, intro, body) => html`<section class="work-panel" id="panel-${id}" role="tabpanel" aria-labelledby="tab-${id}" tabindex="0">
<h3 class="panel-heading"${raw(id === 'research' ? ' id="ricerca"' : '')}>${label(t, key)}</h3><p class="category-intro">${label(t, intro)}</p>
${raw(body)}
</section>`;
  const repo = research.repositories.find(item => item.project === research.id).url;
  const power = research.repositories.find(item => item.project === 'power-ringmin').url;
  return html`<details class="work" id="progetti"><summary><h2 id="work-title">${label(t, 'myProjects')}</h2></summary>
<div class="work-content"><div class="work-tabs" role="tablist" aria-label="${copy.it.workAreas}" data-label="workAreas" hidden>${join(tabs.map(tab))}</div>
<div class="work-panels">
${raw(panel('software', 'softwareTitle', 'softwareIntro', picker(ctx, 'software', categories, 'softwareCategories', projectCard)))}
${raw(panel('modding', 'moddingTitle', 'moddingIntro', picker(ctx, 'modding', modGroups, 'moddingCategories', modCard, nexusNote(t), ' rail-compact')))}
${raw(panel('research', 'researchTitle', 'researchIntro', html`<div class="paper-cards">
${raw(paperCard(t, research.papers[0], configurations(ctx), repo))}
${raw(paperCard(t, research.papers[1], chart(ctx), repo))}
</div>
<p class="research-foot">${label(t, 'researchFigures')} <a href="/research/">${label(t, 'researchPageLink')} <span aria-hidden="true">→</span></a> <a href="${power}">Power-Ringmin <span aria-hidden="true">↗</span></a> <a href="${research.zenodo.url}">Zenodo <span aria-hidden="true">↗</span></a></p>`))}
${raw(panel('teaching', 'teachingTitle', 'teachingIntro', html`<div class="lesson-cards">
${raw(ratingCard(copy, ratings[0], 'letuelezioni'))}
${raw(ratingCard(copy, ratings[1], 'superprof'))}
<article class="card lesson-card"><h4>${label(t, 'lessonExample')}</h4><p class="card-summary">${label(t, 'lessonText')}</p><p class="card-links"><a href="${tutoring.portal}">${label(t, 'lessonPortal')} <span aria-hidden="true">↗</span></a></p></article>
</div>`))}
</div></div></details>`;
}
