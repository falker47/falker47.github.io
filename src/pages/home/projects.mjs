import projects from '../../../data/projects.json' with { type: 'json' };
import research from '../../../data/research.json' with { type: 'json' };
import tutoring from '../../../data/tutoring.json' with { type: 'json' };
import { html, raw } from '../../lib/html.mjs';
import { routes } from '../../routes.mjs';
import { chips, label, localized, registerRow, tabs } from '../../partials/components.mjs';
import { moddingPanel, researchPanel, tutoringPanel } from './panels.mjs';

const software = projects.filter(item => !item.hidden && item.category !== 'research').sort((a, b) => a.order - b.order);
const filters = [['all', 'allKinds'], ['app', 'apps'], ['game', 'games'], ['tool', 'tools']].map(([value, key]) => ({
  value, key, count: value === 'all' ? software.length : software.filter(item => item.category === value).length,
}));

function softwarePanel(ctx) {
  const rows = software.map((project, index) => {
    const internal = routes.some(route => route.path === project.page);
    const link = type => project.links.find(item => item.type === type)?.url;
    const github = link('repo');
    return registerRow(ctx, {
      title: project.title, filter: project.category, kind: project.kind, image: project.cover,
      summary: project.summary, stack: project.stack.join(' · '), github, internal,
      href: internal ? project.page : link('demo') ?? link('store') ?? github,
    }, index);
  });
  return html`<div data-filter-list>${raw(chips(ctx, filters, 'filters'))}
  <div class="register">${raw(rows.join('\n'))}</div></div>`;
}

function ratingSummary() {
  const { ratings } = tutoring;
  const scale = ratings[0].scale;
  const reviews = ratings.reduce((count, item) => count + item.ratings, 0);
  const mean = ratings.reduce((sum, item) => sum + item.score / item.scale * item.ratings, 0) / reviews;
  return Object.fromEntries(['it', 'en'].map(lang => [
    lang, new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(mean * scale) + '/' + scale,
  ]));
}

export function projectsSection(ctx) {
  const { t } = ctx;
  const score = ratingSummary();
  const modCount = raw(html`<span data-i18n="nexusModCount" data-nexus-stat="modCount">${t('nexusModCount')}</span>`);
  const areas = [
    { id: 'software', hash: 'software', key: 'softwareTitle', count: software.length, render: softwarePanel },
    { id: 'modding', hash: 'modding', key: 'moddingTitle', count: modCount, render: moddingPanel },
    { id: 'research', hash: 'ricerca', key: 'researchTitle', count: research.papers.length, render: researchPanel },
    { id: 'teaching', hash: 'tutoring', key: 'teachingTitle', count: localized(score), render: tutoringPanel },
  ];
  return html`<section class="work" id="progetti" aria-labelledby="work-title">
  <h2 id="work-title">${label(t, 'workTitle')}</h2>
  <p class="work-summary">${software.length} software · ${modCount} ${label(t, 'homeMods')} · ${research.papers.length} ${label(t, 'homePapers')} · tutoring ${localized(score)}</p>
  <div class="work-content">${raw(tabs(ctx, areas, 'workAreas'))}
  <div class="work-panels">${raw(areas.map(area => html`<section class="work-panel" id="panel-${area.id}" role="tabpanel" aria-labelledby="tab-${area.id}" tabindex="0">
  <h3 class="panel-heading" id="${area.hash}">${label(t, area.key)}</h3>
  ${raw(area.render(ctx))}</section>`).join('\n'))}</div></div></section>`;
}
