import projects from '../../data/projects.json' with { type: 'json' };
import research from '../../data/research.json' with { type: 'json' };
import { html, raw } from '../lib/html.mjs';
import { label } from '../partials/components.mjs';
import { action, detailPage, projectFacts, section } from '../partials/detail-page.mjs';

const project = projects.find(item => item.id === research.id);
const repository = research.repositories.find(item => item.project === research.id).url;

export const page = {
  path: project.page, titleKey: 'researchPageTitle', descriptionKey: 'researchPageLead',
  image: project.cover.variants.at(-1).src, type: 'CollectionPage', render,
  entities: (_url, author) => [
    ...research.papers.map(paper => ({
      '@type': 'ScholarlyArticle', '@id': paper.url + '#article',
      headline: paper.title, identifier: 'arXiv:' + paper.arxiv,
      datePublished: '20' + paper.arxiv.slice(0, 2), url: paper.url, sameAs: paper.url, author,
    })),
    // The code and its archived release, both linked on the page.
    {
      '@type': 'SoftwareSourceCode', '@id': repository + '#code', name: research.title, codeRepository: repository,
      programmingLanguage: project.stack, identifier: research.zenodo.url, sameAs: research.zenodo.url, author,
    },
  ],
};

// The same texts as the Research tab of the home, followed by the arXiv title and a longer summary.
function publication(t, paper) {
  const home = 'paper' + paper.number, key = 'researchPaper' + paper.number;
  return html`<li class="detail-paper">
    <p class="detail-meta">Paper ${paper.number} · arXiv ${paper.arxiv}</p>
    <h3>${label(t, home + 'Title')}</h3>
    <p class="detail-result">${label(t, home + 'Highlight')}</p>
    <p>${label(t, home + 'Line')}</p>
    <p class="detail-source" lang="en"><a href="${paper.url}">${label(t, key + 'Title')} <span aria-hidden="true">↗</span></a></p>
    <p>${label(t, key + 'Summary')}</p>
  </li>`;
}

export function render(ctx) {
  const { t } = ctx;
  const repo = research.repositories.find(item => item.project === research.id);
  return detailPage(ctx, {
    kicker: 'research', media: project.cover, altKey: 'researchImageAlt',
    spec: projectFacts(t, project),
    actions: [action(t, repo.url, 'researchRepoLink'), action(t, research.zenodo.url, 'researchZenodoLink')],
    body: [
      section(t, 'researchProgramName', html`<p>${label(t, 'researchProgramSummary')}</p>`, 'ringmin'),
      section(t, 'researchPublications', html`<ol class="detail-list">${raw(research.papers.map(paper => publication(t, paper)).join('\n'))}</ol>`, 'pubblicazioni'),
      section(t, 'researchReproTitle', html`<p>${label(t, 'researchReproText')}</p>`, 'riproducibilita'),
    ].join('\n'),
  });
}
