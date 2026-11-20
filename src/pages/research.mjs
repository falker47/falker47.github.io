import projects from '../../data/projects.json' with { type: 'json' };
import research from '../../data/research.json' with { type: 'json' };
import { html } from '../lib/html.mjs';
import { label } from '../partials/components.mjs';
import { detailPage, resource, resourceList, section } from '../partials/detail-page.mjs';

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
  return html`<article class="detail-publication">
    <p class="detail-meta">${label(t, 'researchPaperLabel')} ${paper.number} · arXiv:${paper.arxiv}</p>
    <h3 lang="en"><a href="${paper.url}">${label(t, key + 'Title')}</a></h3>
    <p class="detail-result">${label(t, key + 'Result')}</p>
    <p>${label(t, key + 'Summary')}</p>
  </article>`;
}

export function render(ctx) {
  const { t } = ctx;
  const repo = research.repositories.find(item => item.project === research.id);
  const body = [
    section(t, 'researchProgramName', html`<p>${label(t, 'researchProgramSummary')}</p>`, 'ringmin'),
    section(t, 'researchPublications', research.papers.map(paper => publication(t, paper)).join('\n'), 'pubblicazioni'),
    section(t, 'researchReproTitle', html`<p>${label(t, 'researchReproText')}</p>`, 'riproducibilita'),
  ].join('\n');
  return detailPage(ctx, {
    kicker: 'researchPageKicker', caption: 'sheetCaption', media: project.cover, altKey: 'researchImageAlt', body, research: true,
    resources: resourceList([resource(t, repo.url, 'researchRepoLink', 'github'),
      resource(t, research.zenodo.url, 'researchZenodoLink', 'file')]),
  });
}
