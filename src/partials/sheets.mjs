import mods from '../../data/mods.json' with { type: 'json' };
import projects from '../../data/projects.json' with { type: 'json' };
import { html, raw } from '../lib/html.mjs';
import { picture } from '../lib/media.mjs';
import { label, localized } from './components.mjs';

// Project pages that this site renders. Kept here so the catalogue and the
// detail pages agree without importing the route table (which imports them).
export const projectPages = new Set(['/research/', '/projects/prof-gecko/', '/projects/camaleonte/', '/projects/social-viewer/']);

const link = (item, type) => item.links?.find(entry => entry.type === type)?.url;

function fromProject(project) {
  const internal = projectPages.has(project.page);
  const external = link(project, 'demo') ?? link(project, 'store');
  return {
    id: project.id, title: project.title, kind: project.kind, stack: project.stack, where: project.where,
    summary: project.summary, cover: project.cover, github: link(project, 'repo'),
    primary: internal ? { href: project.page, internal: true } : external ? { href: external, internal: false } : null,
  };
}

function fromMod(mod) {
  return {
    id: mod.id, title: mod.title, kind: mod.kind, stack: mod.stack, where: mod.where,
    summary: mod.description, cover: mod.cover, github: mod.repo ?? undefined,
    primary: { href: mod.url, internal: false },
  };
}

const visible = projects.filter(project => !project.hidden).sort((a, b) => a.order - b.order);
const of = category => visible.filter(project => project.category === category).map(fromProject);

// Page order: the software groups in data order, then the mods, then the research.
export const groups = [
  { id: 'app', key: 'apps', items: of('app') },
  { id: 'giochi', key: 'games', items: of('game') },
  { id: 'strumenti', key: 'tools', items: of('tool') },
  { id: 'mod', key: 'featuredMods', items: mods.items.map(fromMod) },
  { id: 'ricerca', key: 'research', items: of('research') },
];

const numbers = new Map(groups.flatMap(group => group.items).map((item, index) => [item.id, index + 1]));
export const sheetNumber = id => {
  if (!numbers.has(id)) throw Error('No sheet for ' + id);
  return String(numbers.get(id)).padStart(2, '0');
};

const largest = media => Math.max(...media.variants.filter(variant => variant.width <= (media.nativeWidth ?? Infinity)).map(variant => variant.width));

// A 16:10 sheet with four corner ticks. The drawing never exceeds its largest rendition.
export function sheetFigure(media, { sizes, fetchpriority, className = '' } = {}) {
  const max = largest(media);
  const fitted = sizes ?? `(min-width: 900px) min(${max}px, calc((min(100vw, 1504px) - 152px) * 0.58 - 34px)), (min-width: 600px) min(${max}px, calc(100vw - 114px)), min(${max}px, calc(100vw - 58px))`;
  return html`<figure class="sheet-figure${className ? ' ' + className : ''}"><div class="sheet-frame" style="--image-max: ${max}px">${raw(picture(media, { sizes: fitted, fetchpriority }))}</div></figure>`;
}

export function specRows(t, rows) {
  return html`<table class="spec"><tbody>${raw(rows.map(([key, value]) =>
    html`<tr><th scope="row">${label(t, key)}</th><td>${value}</td></tr>`).join(''))}</tbody></table>`;
}

export function specTable(t, { kind, stack, where }) {
  return specRows(t, [['specKind', localized(kind)], ['specStack', stack.join(' · ')], ['specWhere', localized(where)]]);
}

export function sheetLabel(t, id) {
  return html`<p class="tavola-label">${label(t, 'sheetLabel')} ${sheetNumber(id)}</p>`;
}

function actions(t, item) {
  const links = [];
  if (item.primary) {
    const key = item.primary.internal ? 'openSheet' : 'openLink';
    links.push(html`<a class="tavola-link" href="${item.primary.href}">${label(t, key)}<span class="sr-only"> · ${item.title}</span> <span aria-hidden="true">${item.primary.internal ? '→' : '↗'}</span></a>`);
  }
  if (item.github) links.push(html`<a class="tavola-link" href="${item.github}">GitHub<span class="sr-only"> · ${item.title}</span> <span aria-hidden="true">↗</span></a>`);
  return html`<p class="tavola-links">${raw(links.join(''))}</p>`;
}

// The first sheet of a page can be its largest contentful paint: pass { priority: true }.
export function tavola(ctx, item, index, { priority = false } = {}) {
  const { t } = ctx;
  const titleId = 'tav-' + item.id;
  return html`<article class="tavola${index % 2 ? ' tavola-flip' : ''}" aria-labelledby="${titleId}">
  ${raw(sheetFigure(item.cover, { fetchpriority: priority ? 'high' : undefined }))}
  <div class="tavola-text">${raw(sheetLabel(t, item.id))}
  <h2 id="${titleId}">${item.title}</h2>
  <p class="tavola-summary">${localized(item.summary)}</p>
  ${raw(specTable(t, item))}
  ${raw(actions(t, item))}</div>
</article>`;
}
