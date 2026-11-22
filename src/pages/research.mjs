import projects from '../../data/projects.json' with { type: 'json' };
import research from '../../data/research.json' with { type: 'json' };
import { html, raw } from '../lib/html.mjs';
import { label } from '../partials/components.mjs';
import { action, detailPage, plateFor, section } from '../partials/detail-page.mjs';
import { sheetNumber, specTable } from '../partials/sheets.mjs';

const project = projects.find(item => item.id === research.id);

export const page = {
  path: project.page, titleKey: 'researchPageTitle', descriptionKey: 'researchPageLead',
  image: project.cover.variants.at(-1).src, type: 'CollectionPage', render,
  entities: (_url, author) => research.papers.map(paper => ({
    '@type': 'ScholarlyArticle', '@id': paper.url + '#article',
    headline: paper.title, identifier: 'arXiv:' + paper.arxiv,
    datePublished: '20' + paper.arxiv.slice(0, 2), url: paper.url, sameAs: paper.url, author,
  })),
};

function publication(t, paper) {
  const key = 'researchPaper' + paper.number;
  return html`<li class="detail-paper">
    <p class="detail-meta">${label(t, 'researchPaperLabel')} ${paper.number} · arXiv:${paper.arxiv}</p>
    <h3 lang="en"><a href="${paper.url}">${label(t, key + 'Title')} <span aria-hidden="true">↗</span></a></h3>
    <p class="detail-result">${label(t, key + 'Result')}</p>
    <p>${label(t, key + 'Summary')}</p>
  </li>`;
}

export function render(ctx) {
  const { t } = ctx;
  const repo = research.repositories.find(item => item.project === research.id);
  return detailPage(ctx, {
    plate: plateFor(t, sheetNumber(project.id)), media: project.cover, altKey: 'researchImageAlt',
    spec: specTable(t, project),
    actions: [action(t, repo.url, 'researchRepoLink'), action(t, research.zenodo.url, 'researchZenodoLink')],
    body: [
      section(t, 'researchProgramName', html`<p>${label(t, 'researchProgramSummary')}</p>`, 'ringmin'),
      section(t, 'researchPublications', html`<ol class="detail-list">${raw(research.papers.map(paper => publication(t, paper)).join('\n'))}</ol>`, 'pubblicazioni'),
      section(t, 'researchReproTitle', html`<p>${label(t, 'researchReproText')}</p>`, 'riproducibilita'),
    ].join('\n'),
  });
}
