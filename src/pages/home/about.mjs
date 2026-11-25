import credentials from '../../../data/certifications.json' with { type: 'json' };
import profile from '../../../data/profile.json' with { type: 'json' };
import research from '../../../data/research.json' with { type: 'json' };
import tutoring from '../../../data/tutoring.json' with { type: 'json' };
import { html, raw } from '../../lib/html.mjs';
import { aggregateRating, formatScore } from '../../lib/rating.mjs';
import { studiesDrawing } from '../../partials/about-studies.mjs';
import { certificateDeck, label, localized } from '../../partials/components.mjs';
import { brand, brandFor, brandInk, icon } from '../../partials/icons.mjs';
import { categories } from './work.mjs';

const arrow = '<svg class="about-action-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M6 18 18 6M7 6h11v11"/></svg>';
const icons = {
  linkedin: '<svg class="about-action-icon" focusable="false" viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="3"/><path d="M7 10v7M11 17v-7M11 13c0-4 6-4 6 0v4"/><circle cx="7" cy="7" r=".8" fill="currentColor" stroke="none"/></svg>',
  research: '<svg class="about-action-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false"><path d="M18 3H6v26h20V11L18 3Zm0 0v8h8M10 8h3"/><circle cx="16" cy="19" r="4"/><path d="m19 22 4 4"/></svg>',
  tutoring: '<svg class="about-action-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false"><path d="M16 7c-4-3-9-3-13-1v19c4-2 9-2 13 1m0-19c4-3 9-3 13-1v19c-4-2-9-2-13 1V7Z"/><path d="M7 10h5m-5 5h5m8-5h5m-6 7 2 2 4-4"/></svg>',
};

// The master's profile row. Research opens the research page of this site.
const actions = [
  ['linkedin', profile.links.linkedin, 'LinkedIn'],
  ['github', profile.links.github, 'GitHub'],
  ['research', '/research/', 'research'],
  ['oeis', profile.links.oeis, 'OEIS'],
  ['orcid', profile.links.orcid, 'ORCID'],
  ['tutoring', 'https://www.letuelezioni.it/insegnanti/maurizio-falconi.htm', 'tutoring'],
];

// The figures beside the paragraphs, all counted from the data at build time. The Nexus total
// is the live counter of the Modding tab (same key, same snapshot); the rating is the weighted
// mean of the tutoring portals.
const integer = value => new Intl.NumberFormat('it-IT').format(value);
const rating = aggregateRating(tutoring.ratings);
const reviews = (copy, lang) => copy[lang][rating.count === 1 ? 'ratingReviewsOne' : 'ratingReviewsOther'].replace('{count}', rating.count);
// Each figure wears the colour of the section it opens, and its mark or icon.
const figures = {
  certificates: { key: 'factCertificates', href: '#certificazioni', tone: 'credentials', glyph: () => icon('medal'), value: credentials.length,
    topics: ['topicBlockchain', 'topicDataScience', 'topicMachineLearning', 'topicGenerativeAi'] },
  projects: { key: 'factProjects', href: '#progetti', tone: 'software', glyph: () => icon('code'), value: categories.reduce((sum, category) => sum + category.items.length, 0) },
  downloads: { key: 'factDownloads', href: '#panel-modding', tone: 'modding', glyph: () => brand('nexusmods'), live: 'moddingNumber' },
  rating: rating && { href: '#panel-teaching', tone: 'tutoring', glyph: () => icon('star'),
    score: { it: formatScore(rating.score, 'it'), en: formatScore(rating.score, 'en') }, reviews: copy => ({ it: reviews(copy, 'it'), en: reviews(copy, 'en') }) },
  papers: { key: 'factPapers', href: '#ricerca', tone: 'research', glyph: () => brand('arxiv'), value: research.papers.length },
};

// Each paragraph and, after it, its figure: who I am, the path, the way I work, the rest of the time.
export const aboutRows = [
  { text: 'aboutStudies', figure: 'studies' },
  { text: 'aboutWork', figure: 'work', facts: ['certificates'] },
  { text: 'aboutApproach', figure: 'approach', facts: ['projects', 'downloads'] },
  { text: 'aboutSpare', figure: 'spare', facts: ['rating', 'papers'] },
];

function fact({ t, copy }, item) {
  const value = item.live ? html`<strong class="fact-value" data-i18n="${item.live}">${t(item.live)}</strong>`
    : item.score ? html`<strong class="fact-value">${localized(item.score)}<span class="sr-only"> ${label(t, 'ratingOutOf')}</span></strong>`
    : html`<strong class="fact-value" data-i18n-number="${item.value}">${integer(item.value)}</strong>`;
  const name = item.key ? label(t, item.key) : localized(item.reviews(copy));
  const topics = item.topics ? html`<span class="fact-topics">${raw(item.topics.map(key => html`<span data-i18n="${key}">${t(key)}</span>`).join(''))}</span>` : '';
  return html`<li><a class="fact fact-${item.tone}" href="${item.href}"><span class="fact-glyph" aria-hidden="true">${item.glyph()}</span>${raw(value)}<span class="fact-label">${name}</span>${raw(topics)}</a></li>`;
}

function aboutRow(ctx, row) {
  const figure = row.facts
    ? html`<figure class="about-figure figure-${row.figure}"><ul class="facts-list">${raw(row.facts.map(name => figures[name]).filter(Boolean).map(item => fact(ctx, item)).join(''))}</ul></figure>`
    : html`<figure class="about-figure figure-${row.figure}" aria-hidden="true">${raw(studiesDrawing(ctx))}</figure>`;
  return html`<div class="about-row"><p data-i18n="${row.text}">${ctx.t(row.text)}</p>${raw(figure)}</div>`;
}

export function aboutSection(ctx) {
  const { t, copy } = ctx;
  const rows = aboutRows.map(row => aboutRow(ctx, row)).join('');
  const links = actions.map(([glyph, href, name]) => {
    const title = name === 'research' || name === 'tutoring'
      ? html`<span class="about-action-title" data-i18n="${name}">${t(name)}</span>`
      : html`<span class="about-action-title">${name}</span>`;
    // GitHub, OEIS and ORCID show their own marks and take their colour on hover.
    const mark = brandFor(href);
    const style = mark ? html` style="--brand:${brandInk(mark)}" data-brand="${mark}"` : '';
    return html`<a href="${href}" class="about-action about-action-profile"${raw(style)}>${mark ? brand(mark) : raw(icons[glyph])}${raw(title)}${raw(arrow)}</a>`;
  }).join('');
  return html`<details class="about" id="chi-sono"><summary><h2>${label(t, 'about')}</h2></summary><div class="about-content"><div class="about-rows">${raw(rows)}</div>
<p class="philosophy" data-i18n="philosophy">${t('philosophy')}</p><nav class="research-links about-actions" aria-label="${copy.it.researchProfiles}" data-label="researchProfiles">${raw(links)}</nav>
<section class="credentials" id="certificazioni" aria-labelledby="credentials-title"><h3 class="section-label" id="credentials-title">${label(t, 'guideCertificates')} <span aria-hidden="true">·</span> ${credentials.length}</h3>
${raw(certificateDeck(ctx, credentials, 'home-certificate'))}</section></div></details>`;
}
