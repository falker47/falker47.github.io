import credentials from '../../../data/certifications.json' with { type: 'json' };
import profile from '../../../data/profile.json' with { type: 'json' };
import research from '../../../data/research.json' with { type: 'json' };
import tutoring from '../../../data/tutoring.json' with { type: 'json' };
import { html, raw } from '../../lib/html.mjs';
import { aggregateRating, formatScore } from '../../lib/rating.mjs';
import { methodDrawing } from '../../partials/about-method.mjs';
import { studiesDrawing } from '../../partials/about-studies.mjs';
import { certificateDeck, label, localized } from '../../partials/components.mjs';
import { brand, brandFor, brandInk, icon } from '../../partials/icons.mjs';
import { categories } from './work.mjs';

const arrow = '<svg class="about-action-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M6 18 18 6M7 6h11v11"/></svg>';
// V5: every profile link shows the mark of the place it opens. LinkedIn, GitHub, OEIS and ORCID
// have their own (data/brands.json); the lessons open Letuelezioni, the research this site's
// research page, drawn as the circles of Ringmin.
const icons = {
  research: '<svg class="about-action-icon" aria-hidden="true" focusable="false"><use href="#icon-ringmin"/></svg>',
  tutoring: '<img class="about-action-icon" src="/assets/images/letuelezioni.png" width="18" height="18" alt="" loading="lazy">',
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
// Each figure wears the colour of the section it opens, and its mark or icon: V5, a badge like the
// Nexus emblem (the terminal and the star on a solid square, the official arXiv logomark).
const figures = {
  projects: { key: 'factProjects', href: '#progetti', tone: 'software', glyph: () => icon('terminal'), value: categories.reduce((sum, category) => sum + category.items.length, 0) },
  downloads: { key: 'factDownloads', href: '#panel-modding', tone: 'modding', glyph: () => brand('nexusmods'), live: 'moddingNumber' },
  rating: rating && { href: '#panel-teaching', tone: 'tutoring', glyph: () => icon('star'),
    score: { it: formatScore(rating.score, 'it'), en: formatScore(rating.score, 'en') }, reviews: copy => ({ it: reviews(copy, 'it'), en: reviews(copy, 'en') }) },
  papers: { key: 'factPapers', href: '#ricerca', tone: 'research', glyph: () => brand('arxivmark'), value: research.papers.length },
};

// Each paragraph and, after it, its figure: who I am (the pendulum and its simulation), the path
// (the certificate fan), the work and the method (a problem reduced to its general form), the way
// I work outside it, the rest of the time. V5: the work paragraph is split in two, so the slides
// have similar lengths.
export const aboutRows = [
  { text: 'aboutStudies', figure: 'studies', art: ctx => studiesDrawing(ctx) },
  { text: 'aboutWork', figure: 'work', art: ctx => certificates(ctx) },
  { text: 'aboutMethod', figure: 'method', art: ctx => methodDrawing(ctx) },
  { text: 'aboutApproach', figure: 'approach', facts: ['projects', 'downloads'] },
  { text: 'aboutSpare', figure: 'spare', facts: ['rating', 'papers'] },
];

function fact({ t, copy }, item) {
  const value = item.live ? html`<strong class="fact-value" data-i18n="${item.live}">${t(item.live)}</strong>`
    : item.score ? html`<strong class="fact-value">${localized(item.score)}<span class="sr-only"> ${label(t, 'ratingOutOf')}</span></strong>`
    : html`<strong class="fact-value" data-i18n-number="${item.value}">${integer(item.value)}</strong>`;
  const name = item.key ? label(t, item.key) : localized(item.reviews(copy));
  return html`<li><a class="fact fact-${item.tone}" href="${item.href}"><span class="fact-glyph" aria-hidden="true">${item.glyph()}</span>${raw(value)}<span class="fact-label">${name}</span></a></li>`;
}

// The certificate fan; its heading is for screen readers, the fan's caption shows the count.
function certificates(ctx) {
  return html`<section class="credentials" id="certificazioni" aria-labelledby="credentials-title"><h3 class="sr-only" id="credentials-title">${label(ctx.t, 'guideCertificates')} · ${credentials.length}</h3>
${raw(certificateDeck(ctx, credentials, 'home-certificate'))}</section>`;
}

function aboutRow(ctx, row) {
  const figure = row.facts
    ? html`<figure class="about-figure figure-${row.figure}"><ul class="facts-list">${raw(row.facts.map(name => figures[name]).filter(Boolean).map(item => fact(ctx, item)).join(''))}</ul></figure>`
    : html`<figure class="about-figure figure-${row.figure}"${raw(row.figure === 'work' ? '' : ' aria-hidden="true"')}>${raw(row.art(ctx))}</figure>`;
  return html`<div class="about-row"><p data-i18n="${row.text}">${ctx.t(row.text)}</p>${raw(figure)}</div>`;
}

// V5: the rows are the slides of a carousel, one paragraph at a time, in reading order, all as tall
// as the tallest so the controls never move. Above the controls a progress bar, one segment per
// paragraph; "Indietro" and "Avanti" sit at the two ends, the counter between them tells screen
// readers that the paragraph changed. They wait for the script; without it the rows stay in a column.
function carouselNav(t) {
  const step = (direction, key) => html`<button type="button" class="about-step" data-step="${direction}">${direction < 0 ? icon('chevron-left') : ''}${label(t, key)}${direction > 0 ? icon('chevron-right') : ''}</button>`;
  return html`<div class="about-nav" hidden><span class="about-progress" aria-hidden="true">${raw(aboutRows.map((row, index) => index ? '<i></i>' : '<i class="on"></i>').join(''))}</span>${raw(step(-1, 'aboutPrevious'))}<p class="about-count" aria-live="polite"><span class="about-index">1</span> / ${aboutRows.length}</p>${raw(step(1, 'aboutNext'))}</div>`;
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
  return html`<details class="about" id="chi-sono"><summary><h2>${label(t, 'about')}</h2></summary><div class="about-content"><div class="about-carousel"><div class="about-rows">${raw(rows)}</div>${raw(carouselNav(t))}</div>
<nav class="research-links about-actions" aria-label="${copy.it.researchProfiles}" data-label="researchProfiles">${raw(links)}</nav></div></details>`;
}
