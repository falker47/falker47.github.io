import featured from '../../../data/mods.json' with { type: 'json' };
import nexus from '../../../data/nexus-mods.json' with { type: 'json' };
import snapshot from '../../../data/nexus-downloads.json' with { type: 'json' };
import projects from '../../../data/projects.json' with { type: 'json' };
import research from '../../../data/research.json' with { type: 'json' };
import tutoring from '../../../data/tutoring.json' with { type: 'json' };
import { html, raw } from '../../lib/html.mjs';
import { img } from '../../lib/media.mjs';
import { aggregateRating, formatScore } from '../../lib/rating.mjs';
import { actionLink, label, localized } from '../../partials/components.mjs';
import { brand, icon } from '../../partials/icons.mjs';
import { chart, configurations, constantRange } from '../../partials/ringmin.mjs';

// "I miei progetti": every project lives here. All groups are rendered at build
// time; the client only shows one tab and one category at a time.
const visible = projects.filter(item => !item.hidden).sort((a, b) => a.order - b.order);
// The Modding toggles keep a line drawing; the software categories have emblems, the paper count the arXiv logomark.
const glyphs = {
  mod: '<path d="M4 4h6v2.5a2 2 0 1 0 4 0V4h6v6h-2.5a2 2 0 1 0 0 4H20v6h-6v-2.5a2 2 0 1 0-4 0V20H4v-6h2.5a2 2 0 1 0 0-4H4Z"/>',
  translation: '<path d="M3 5h9M7.5 3v2m3 0c-.8 4-3.4 7-7.5 9m2.5-6c1.2 2.3 3 4 5.5 5"/><path d="m12.5 21 4-10 4 10m-6.6-3.2h5.2"/>',
};
const glyph = name => raw(html`<svg class="result-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">${raw(glyphs[name])}</svg>`);
// V5: the software categories as emblems, solid like the GitHub and Nexus marks: a phone with its
// apps, a wrench over a screwdriver, a gamepad. White on the category's colour (the one its cards
// wear), in the category toggles and in the "Su di me" figures; the second plane is translucent.
const emblems = {
  app: '<path fill-rule="evenodd" d="M8.5 1.5h7A3.5 3.5 0 0 1 19 5v14a3.5 3.5 0 0 1-3.5 3.5h-7A3.5 3.5 0 0 1 5 19V5a3.5 3.5 0 0 1 3.5-3.5ZM7 4.5V18h10V4.5Zm3.4 15.4h3.2a.7.7 0 0 1 0 1.4h-3.2a.7.7 0 0 1 0-1.4Z"/><path d="M9 5.6h1.6a1 1 0 0 1 1 1v1.6a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V6.6a1 1 0 0 1 1-1Zm4.4 0H15a1 1 0 0 1 1 1v1.6a1 1 0 0 1-1 1h-1.6a1 1 0 0 1-1-1V6.6a1 1 0 0 1 1-1ZM9 10h1.6a1 1 0 0 1 1 1v1.6a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1Z"/><path opacity=".55" d="M13.4 10H15a1 1 0 0 1 1 1v1.6a1 1 0 0 1-1 1h-1.6a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1Z"/>',
  tool: '<g transform="rotate(-45 12 12)" opacity=".62"><path d="M11.3 3.4 12 2l.7 1.4V12h-1.4Zm-1 8.6h3.4v1.5h-3.4Zm1.3 1.9h.8a1.9 1.9 0 0 1 1.9 1.9v4.3a1.9 1.9 0 0 1-1.9 1.9h-.8a1.9 1.9 0 0 1-1.9-1.9v-4.3a1.9 1.9 0 0 1 1.9-1.9Z"/></g><path transform="rotate(45 12 12)" d="M10.6 1.22v4.58h2.8V1.22A4.5 4.5 0 1 1 10.6 1.22ZM10.75 9h2.5v11.25a1.25 1.25 0 0 1-2.5 0Z"/>',
  game: '<path fill-rule="evenodd" d="M7.2 6h9.6c2.6 0 4.6 1.8 5 4.4l.9 6c.3 2.2-2.4 3.6-4 2l-2.6-2.6H7.9l-2.6 2.6c-1.6 1.6-4.3.2-4-2l.9-6C2.6 7.8 4.6 6 7.2 6ZM6.2 8.7v1.5H4.7v1.6h1.5v1.5h1.6v-1.5h1.5v-1.6H7.8V8.7ZM17.35 10a1.05 1.05 0 1 0-2.1 0 1.05 1.05 0 1 0 2.1 0Zm1.9 2.3a1.05 1.05 0 1 0-2.1 0 1.05 1.05 0 1 0 2.1 0Z"/>',
};
export const emblem = (id, kind = '') => raw(`<svg class="${kind}emblem emblem-${id}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${emblems[id]}</svg>`);
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
// External platforms show their mark (actionLink); the other links keep an arrow.
function projectLink(t, project, entry) {
  const text = entry.type === 'repo' ? (entry.label.it === 'Repo GitHub' ? 'GitHub' : localized(entry.label))
    : entry.type === 'store' ? 'Play Store' : label(t, entry.type === 'test' ? 'tryApp' : 'openLink');
  return actionLink(entry.url, text, { title: project.title });
}

// A published app needs no tester link on its card: its project page keeps the tester programme.
export const cardLinks = project => project.links.filter(entry => entry.type !== 'test' || !project.links.some(link => link.type === 'store'));

function projectCard(t, project) {
  // The title opens the project's own page when this site has one. V5: its "Scheda" label sits on
  // the cover (part of the link's name, the arrow is CSS), and the link spreads over the cover, so
  // the picture opens the page too.
  const title = project.page ? html`<a href="${project.page}">${project.title} <span class="cover-chip" data-i18n="projectPage">${t('projectPage')}</span></a>` : html`${project.title}`;
  return html`<li class="card">
<div class="card-cover">${raw(img(project.cover, { sizes: cardSizes }))}</div>
<div class="card-body"><h4>${raw(title)}</h4>
<p class="card-meta"><span class="pill">${localized(project.kind)}</span><span class="card-stack">${project.stack.join(' · ')}</span></p>
<p class="card-summary">${localized(project.summary)}</p>
<p class="card-links">${join(cardLinks(project).map(entry => projectLink(t, project, entry)))}</p></div></li>`;
}

function rail(copy, cards, modifier = '') {
  return html`<div class="rail${modifier}">
<ul class="rail-track">
${join(cards)}
</ul>
<p class="rail-steps"><button type="button" class="rail-step" data-step="-1" data-label="railPrevious" aria-label="${copy.it.railPrevious}" hidden><span aria-hidden="true">←</span></button><button type="button" class="rail-step" data-step="1" data-label="railNext" aria-label="${copy.it.railNext}" hidden><span aria-hidden="true">→</span></button></p>
</div>`;
}

// The counts are the category toggles, tiles like the research count; one is pressed at a time.
// A lead tile (the Nexus total) may precede them. Without scripts every group is listed under its own label.
function picker({ t, copy }, name, groups, labelKey, card, note, modifier = '', lead = '') {
  const toggles = groups.map((group, index) => html`<button type="button" class="picker-toggle result cat-${group.id}" data-group="${group.id}" aria-pressed="${index === 0}">${group.id in emblems ? emblem(group.id, 'result-icon ') : glyph(group.id)}<span class="result-body"><strong class="result-value">${group.items.length}</strong><span class="result-label">${label(t, group.key)}</span></span></button>`);
  const sections = groups.map(group => html`<section class="picker-group cat-${group.id}" data-group="${group.id}" aria-labelledby="${name}-${group.id}">
<p class="picker-heading" id="${name}-${group.id}">${group.items.length} ${label(t, group.key)}</p>
${raw(rail(copy, group.items.map(item => card(t, item)), modifier))}
</section>`);
  return html`<div class="picker">
<div class="results-row picker-head">${raw(lead)}<div class="picker-bar" role="group" data-label="${labelKey}" aria-label="${copy.it[labelKey]}" hidden>${join(toggles)}</div>${raw(note)}</div>
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
  const links = [actionLink(mod.url, 'Nexus', { title: mod.name })];
  if (cover?.repo) links.push(actionLink(cover.repo, 'GitHub', { title: mod.name }));
  const translation = mod.kind === 'translation';
  // Every card shows a picture: the cover from data/mods.json, else the Nexus picture (translations
  // too, with an "IT" badge). A mod that Nexus shows without one gets a typographic cover.
  const picture = cover ? img(cover.cover, { sizes: '(min-width: 600px) 386px, 80vw' })
    : mod.image ? html`<img src="${mod.image.src}" width="${mod.image.width}" height="${mod.image.height}" alt="" loading="lazy" decoding="async">` : null;
  const head = picture
    ? html`<div class="card-cover">${raw(picture)}${translation ? raw('<b class="cover-badge">IT</b>') : ''}</div>`
    : html`<div class="card-cover mod-type"><b>${translation ? 'IT' : 'MOD'}</b><span>${mod.game}</span></div>`;
  const width = Math.max(2, Math.round(Math.sqrt(mod.downloads / maxDownloads) * 1000) / 10);
  return html`<li class="card mod-card${translation ? ' translation' : ''}">
${raw(head)}
<div class="card-body"><h4>${mod.name}</h4>
<p class="card-meta"><span class="pill">${shortGame(mod.game)}</span><span class="card-stack">${mod.category ?? mod.game}</span></p>
<p class="mod-stats"><strong>${number(mod.downloads)}</strong> <span>${label(t, 'downloadsWord')} · ${number(mod.endorsements)} ${label(t, 'endorsementsWord')}</span></p>
<div class="mod-bar" aria-hidden="true"><span style="width:${width}%"></span></div>
<p class="card-links">${join(links)}</p></div></li>`;
}

// Before the Modding toggles: the unique downloads of the Nexus profile, the live total.
function nexusTotal(t) {
  return html`<a class="result nexus-total" href="${featured.profile}">${brand('nexusmods')}<span class="result-body"><strong class="result-value" data-i18n="moddingNumber">${t('moddingNumber')}</strong><span class="result-label">${label(t, 'factDownloads')}</span></span><span class="result-arrow" aria-hidden="true">↗</span></a>`;
}

// Paper II states the certified interval for C* in its meta line, in the reader's number format.
function constantLine() {
  const [it, en] = [constantRange('it'), constantRange('en')];
  return html` · <span class="paper-bound">C* ∈ [<span data-text-it="${it[0]}" data-text-en="${en[0]}">${it[0]}</span>; <span data-text-it="${it[1]}" data-text-en="${en[1]}">${it[1]}</span>]</span>`;
}

// V5: a paper is a project card: its drawing as the cover, "Paper I" and the arXiv number in the
// meta line, the result as the summary, arXiv and GitHub at the foot.
function paperCard(t, paper, figure, repo, extra = '') {
  const key = 'paper' + paper.number;
  return html`<li class="card paper-card"><div class="card-cover paper-figure">${raw(figure)}</div>
<div class="card-body"><h4>${label(t, key + 'Title')}</h4>
<p class="card-meta"><span class="pill">Paper ${paper.number}</span><span class="card-stack">arXiv ${paper.arxiv}${raw(extra)}</span></p>
<p class="card-summary">${label(t, key + 'Highlight')}</p>
<p class="card-links">${raw(actionLink(paper.url, 'arXiv', { title: 'Paper ' + paper.number }))}
${raw(actionLink(repo, 'GitHub', { title: 'Paper ' + paper.number }))}</p></div></li>`;
}

const star = '<svg viewBox="0 0 24 24"><path d="m12 2.5 2.8 5.8 6.4.9-4.6 4.5 1.1 6.4-5.7-3-5.7 3 1.1-6.4-4.6-4.5 6.4-.9Z"/></svg>';
function ratingCard(copy, rating, logo) {
  const detail = localized(Object.fromEntries(Object.entries(copy).map(([lang, dictionary]) => {
    const total = dictionary[rating.ratings === 1 ? 'ratingOne' : 'ratingOther'].replace('{count}', rating.ratings);
    return [lang, rating.recommendations ? total + ' · ' + rating.recommendations + ' ' + dictionary.recommendations : total];
  })));
  return html`<a class="card feedback-result" href="${rating.url}"><span class="feedback-source"><img class="platform-logo" src="/assets/images/${logo}.png" alt="" width="24" height="24" loading="lazy">${rating.source} <span aria-hidden="true">↗</span></span><span class="rating-line"><strong class="result-value">${rating.score}<span class="rating-scale">/${rating.scale}</span></strong><span class="rating-stars" aria-hidden="true">${raw(star.repeat(rating.scale))}</span></span><span class="result-label">${detail}</span></a>`;
}

// Under the closed title, what the section holds, counted from the data: the software, every
// published mod, the papers and the lessons' rating (the weighted mean of the portals).
function workTeaser() {
  const rating = aggregateRating(tutoring.ratings);
  const text = (lang, words) => {
    const number = value => new Intl.NumberFormat(lang === 'it' ? 'it-IT' : 'en-US').format(value);
    const software = categories.reduce((sum, category) => sum + category.items.length, 0);
    const parts = [`${number(software)} software`, `${number(nexus.mods.length)} ${words.mods}`, `${number(research.papers.length)} ${words.papers}`];
    if (rating) parts.push(`${words.lessons} ${formatScore(rating.score, lang)}/5`);
    return parts.join(' · ');
  };
  return { it: text('it', { mods: 'mod', papers: 'paper', lessons: 'lezioni' }), en: text('en', { mods: 'mods', papers: 'papers', lessons: 'lessons' }) };
}

export function workSection(ctx) {
  const { t, copy } = ctx;
  const tabs = [['software', 'softwareTitle'], ['modding', 'moddingTitle'], ['research', 'researchTitle'], ['teaching', 'teachingTitle']];
  const tab = ([id, key], index) => html`<button id="tab-${id}" role="tab" type="button" aria-selected="${index === 0}" aria-controls="panel-${id}" tabindex="${index === 0 ? 0 : -1}" data-panel="${id}">${label(t, key)}</button>`;
  const panel = (id, key, intro, body) => html`<section class="work-panel" id="panel-${id}" role="tabpanel" aria-labelledby="tab-${id}" tabindex="0">
<h3 class="panel-heading"${raw(id === 'research' ? ' id="ricerca"' : '')}>${label(t, key)}</h3>${intro ? raw(html`<p class="category-intro">${label(t, intro)}</p>`) : ''}
${raw(body)}
</section>`;
  const repo = research.repositories.find(item => item.project === research.id).url;
  const power = research.repositories.find(item => item.project === 'power-ringmin').url;
  return html`<details class="work" id="progetti"><summary><h2 id="work-title">${label(t, 'myProjects')}</h2><span class="section-teaser">${localized(workTeaser())}</span></summary>
<div class="work-content"><div class="work-tabs" role="tablist" aria-label="${copy.it.workAreas}" data-label="workAreas" hidden>${join(tabs.map(tab))}</div>
<div class="work-panels">
${raw(panel('software', 'softwareTitle', 'softwareIntro', picker(ctx, 'software', categories, 'softwareCategories', projectCard, softwareNote(t))))}
${raw(panel('modding', 'moddingTitle', 'moddingIntro', picker(ctx, 'modding', modGroups, 'moddingCategories', modCard, '', ' rail-mods', nexusTotal(t))))}
${raw(panel('research', 'researchTitle', 'researchIntro', html`<div class="results-row"><a class="result" href="/research/">${brand('arxivmark')}<span class="result-body"><strong class="result-value">${research.papers.length}</strong><span class="result-label">${label(t, 'papersLabel')}</span></span><span class="result-arrow" aria-hidden="true">→</span></a></div>
<div class="rail rail-papers"><ul class="rail-track">${raw(paperCard(t, research.papers[0], configurations(ctx), repo))}
${raw(paperCard(t, research.papers[1], chart(ctx), repo, constantLine()))}</ul></div>
<p class="research-foot">${label(t, 'researchAlso')} ${raw(actionLink(power, 'Power-Ringmin'))} <span aria-hidden="true">·</span> ${raw(actionLink(research.zenodo.url, 'Zenodo'))}</p>`))}
${raw(panel('teaching', 'teachingTitle', null, html`<div class="lessons">
<div class="lessons-text"><h4 class="lessons-title">${label(t, 'lessonsTitle')}</h4><p class="lessons-body">${label(t, 'lessonsText')}</p>
<p class="lessons-action"><a class="lessons-cta" href="${tutoring.portal}">${label(t, 'lessonsCta')}${icon('arrow-right')}</a></p></div>
<div class="lessons-reviews"><p class="lessons-lead">${label(t, 'lessonsLead')}</p>
<div class="lesson-cards">
${raw(ratingCard(copy, ratings[0], 'letuelezioni'))}
${raw(ratingCard(copy, ratings[1], 'superprof'))}
</div></div>
</div>`))}
</div></div></details>`;
}
