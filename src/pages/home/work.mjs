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
const glyphs = {
  app: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 5h4m-3 14h2M9 9h6v6H9Z"/>',
  game: '<path d="M7 7h10c3 0 5 9 3 11-1 1-3-1-5-3H9c-2 2-4 4-5 3-2-2 0-11 3-11ZM7 10v4m-2-2h4"/><circle cx="16" cy="11" r=".7"/><circle cx="18" cy="13" r=".7"/>',
  tool: '<path d="m14 7 3 3 4-4c1 6-3 9-7 7L6 21l-3-3 8-8c-2-4 1-8 7-7Z"/>',
  paper: '<path d="M5 3h10l4 4v14H5ZM15 3v5h4M9 12h6m-6 4h6"/>',
};
const glyph = name => raw(html`<svg class="result-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">${raw(glyphs[name])}</svg>`);
export const categories = [
  { id: 'app', key: 'appsCount', name: 'apps' },
  { id: 'game', key: 'gamesCount', name: 'games' },
  { id: 'tool', key: 'toolsCount', name: 'tools' },
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
const cardSizes = '(min-width: 1000px) 400px, (min-width: 600px) 55vw, 80vw';

// A card link reads "Apri", "Play Store", "Prova l'app" or "GitHub"; a repository with its own name keeps it.
function cardLink(t, title, href, text, arrow = '↗') {
  return html`<a href="${href}">${text}<span class="sr-only"> · ${title}</span> <span aria-hidden="true">${arrow}</span></a>`;
}
function projectLink(t, project, entry) {
  const text = entry.type === 'repo' ? (entry.label.it === 'Repo GitHub' ? 'GitHub' : localized(entry.label))
    : entry.type === 'store' ? 'Play Store' : label(t, entry.type === 'test' ? 'tryApp' : 'openLink');
  return cardLink(t, project.title, entry.url, text, entry.url.startsWith('/') ? '→' : '↗');
}

function projectCard(t, project) {
  // The title opens the project's own page when this site has one.
  const title = project.page ? html`<a href="${project.page}">${project.title}</a>` : html`${project.title}`;
  return html`<li class="card">
<div class="card-cover">${raw(img(project.cover, { sizes: cardSizes }))}</div>
<div class="card-body"><h4>${raw(title)}</h4>
<p class="card-meta"><span class="pill">${localized(project.kind)}</span><span class="card-stack">${project.stack.join(' · ')}</span></p>
<p class="card-summary">${localized(project.summary)}</p>
<p class="card-links">${join(project.links.map(entry => projectLink(t, project, entry)))}</p></div></li>`;
}

function rail(copy, cards, modifier = '') {
  return html`<div class="rail${modifier}">
<ul class="rail-track">
${join(cards)}
</ul>
<p class="rail-steps"><button type="button" class="rail-step" data-step="-1" data-label="railPrevious" aria-label="${copy.it.railPrevious}" hidden><span aria-hidden="true">←</span></button><button type="button" class="rail-step" data-step="1" data-label="railNext" aria-label="${copy.it.railNext}" hidden><span aria-hidden="true">→</span></button></p>
</div>`;
}

// The counts are the category toggles. Without scripts every group is listed under its own label.
function picker({ t, copy }, name, groups, labelKey, card, note, modifier = '') {
  const toggles = groups.map((group, index) => html`<button type="button" class="picker-toggle result cat-${group.id}" data-group="${group.id}" aria-pressed="${index === 0}">${glyphs[group.id] ? glyph(group.id) : ''}<span class="result-body"><strong class="result-value">${group.items.length}</strong><span class="result-label">${label(t, group.key)}</span></span></button>`);
  const sections = groups.map(group => html`<section class="picker-group cat-${group.id}" data-group="${group.id}" aria-labelledby="${name}-${group.id}">
<p class="picker-heading" id="${name}-${group.id}">${group.items.length} ${label(t, group.key)}</p>
${raw(rail(copy, group.items.map(item => card(t, item)), modifier))}
</section>`);
  return html`<div class="picker">
<div class="results-row picker-head"><div class="picker-bar" role="group" data-label="${labelKey}" aria-label="${copy.it[labelKey]}" hidden>${join(toggles)}</div>${raw(note)}</div>
${join(sections)}
</div>`;
}

// Beside the software toggles: "App · 4 progetti · scorri per vederli tutti", one line per category.
function softwareNote(t) {
  return categories.map(category => html`<p class="sample-count picker-count" data-group="${category.id}" hidden>${label(t, category.name)} <span aria-hidden="true">·</span> ${category.items.length} ${label(t, 'projectsWord')} <span aria-hidden="true">·</span> ${label(t, 'scrollHint')}</p>`).join('');
}

const maxDownloads = Math.max(...nexus.mods.map(mod => mod.downloads));
const shortGame = game => game.replace(' Special Edition', ' SE');
function modCard(t, mod) {
  const cover = covers.get(mod.modId);
  const links = [cardLink(t, mod.name, mod.url, 'Nexus')];
  if (cover?.repo) links.push(cardLink(t, mod.name, cover.repo, 'GitHub'));
  const translation = mod.kind === 'translation';
  const head = translation
    ? html`<div class="mod-type"><b>IT</b><span>${mod.game}</span></div>`
    : html`<div class="card-cover">${raw(cover
      ? img(cover.cover, { sizes: '(min-width: 600px) 386px, 80vw' })
      : html`<img src="${mod.image.src}" width="${mod.image.width}" height="${mod.image.height}" alt="" loading="lazy" decoding="async">`)}</div>`;
  const width = Math.max(2, Math.round(Math.sqrt(mod.downloads / maxDownloads) * 1000) / 10);
  return html`<li class="card mod-card${translation ? ' compact' : ''}">
${raw(head)}
<div class="card-body"><h4>${mod.name}</h4>
<p class="card-meta">${translation ? '' : raw(html`<span class="pill">${shortGame(mod.game)}</span>`)}<span class="card-stack">${mod.category ?? (translation ? '' : mod.game)}</span></p>
<p class="mod-stats"><strong>${number(mod.downloads)}</strong> <span>${label(t, 'downloadsWord')} · ${number(mod.endorsements)} ${label(t, 'endorsementsWord')}</span></p>
<div class="mod-bar" aria-hidden="true"><span style="width:${width}%"></span></div>
<p class="card-links">${join(links)}</p></div></li>`;
}

function nexusNote(t) {
  return html`<p class="sample-count"><a href="${featured.profile}"><strong data-i18n="moddingNumber">${t('moddingNumber')}</strong> ${label(t, 'uniqueDownloads')}</a> <span aria-hidden="true">·</span> <strong data-nexus-stat="modCount" data-i18n="nexusModCount">${t('nexusModCount')}</strong> ${label(t, 'publications')} <span aria-hidden="true">·</span> ${label(t, 'nexusDataOf')} <time data-nexus-stat="checkedOn" datetime="${snapshot.checkedOn}">${new Intl.DateTimeFormat('it-IT', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(snapshot.checkedOn + 'T00:00:00Z'))}</time></p>`;
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
${raw(panel('software', 'softwareTitle', 'softwareIntro', picker(ctx, 'software', categories, 'softwareCategories', projectCard, softwareNote(t))))}
${raw(panel('modding', 'moddingTitle', 'moddingIntro', picker(ctx, 'modding', modGroups, 'moddingCategories', modCard, nexusNote(t), ' rail-mods')))}
${raw(panel('research', 'researchTitle', 'researchIntro', html`<div class="results-row"><a class="result" href="/research/">${glyph('paper')}<span class="result-body"><strong class="result-value">${research.papers.length}</strong><span class="result-label">${label(t, 'papersLabel')}</span></span><span class="result-arrow" aria-hidden="true">→</span></a></div>
<div class="paper-cards">
${raw(paperCard(t, research.papers[0], configurations(ctx), repo))}
${raw(paperCard(t, research.papers[1], chart(ctx), repo))}
</div>
<p class="research-foot">${label(t, 'researchFigures')} ${label(t, 'researchAlso')} <a href="${power}">Power-Ringmin <span aria-hidden="true">↗</span></a> <span aria-hidden="true">·</span> <a href="${research.zenodo.url}">Zenodo <span aria-hidden="true">↗</span></a></p>`))}
${raw(panel('teaching', 'teachingTitle', 'teachingIntro', html`<div class="lesson-cards">
${raw(ratingCard(copy, ratings[0], 'letuelezioni'))}
${raw(ratingCard(copy, ratings[1], 'superprof'))}
<article class="card lesson-card"><h4>${label(t, 'lessonExample')}</h4><p class="card-summary">${label(t, 'lessonText')}</p><p class="card-links"><a href="${tutoring.portal}">${label(t, 'lessonPortal')} <span aria-hidden="true">↗</span></a></p></article>
</div>`))}
</div></div></details>`;
}
