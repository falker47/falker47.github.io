import projects from '../../data/projects.json' with { type: 'json' };
import { html, raw } from '../lib/html.mjs';
import { label } from '../partials/components.mjs';
import { action, detailPage, projectFacts, section } from '../partials/detail-page.mjs';

const project = projects.find(item => item.id === 'prof-gecko');
const live = project.links.find(link => link.type === 'demo').url;

export const page = {
  path: project.page, titleKey: 'geckoPageTitle', descriptionKey: 'geckoPageLead',
  image: project.cover.variants.at(-1).src, render,
  entities: (url, author) => [{
    '@type': 'SoftwareApplication', '@id': url + '#app', name: project.title, url: live,
    applicationCategory: 'ReferenceApplication', operatingSystem: 'Web', inLanguage: ['it', 'en'],
    image: new URL(project.cover.variants.at(-1).src, url).href, description: project.description.en, author,
  }],
};

export function render(ctx) {
  const { t } = ctx;
  const features = [['geckoRagTitle', 'geckoRagText'], ['geckoToolsTitle', 'geckoToolsText']];
  const list = html`<ul class="detail-list">${raw(features.map(([heading, text]) =>
    html`<li><h3>${label(t, heading)}</h3><p>${label(t, text)}</p></li>`).join('\n'))}</ul>`;
  return detailPage(ctx, {
    kicker: 'apps', media: project.cover, altKey: 'geckoImageAlt',
    spec: projectFacts(t, project), actions: [action(t, live, 'geckoLiveLink')],
    body: section(t, 'geckoOverviewTitle', html`<p>${label(t, 'geckoOverviewText')}</p>`, 'app')
      + section(t, 'geckoFeaturesTitle', list, 'funzioni')
      + section(t, 'geckoAccessTitle', html`<p>${label(t, 'geckoAccessText')}</p>`, 'risorse'),
  });
}
