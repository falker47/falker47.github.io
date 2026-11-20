import projects from '../../data/projects.json' with { type: 'json' };
import { html, raw } from '../lib/html.mjs';
import { label } from '../partials/components.mjs';
import { detailPage, resource, resourceList, section } from '../partials/detail-page.mjs';

const project = projects.find(item => item.id === 'camaleonte');
const actions = {
  demo: ['camaPlay', 'external'], store: ['camaAndroid', 'play-store'], repo: ['camaSource', 'github'],
};

export const page = {
  path: project.page, titleKey: 'camaPageTitle', descriptionKey: 'camaPageLead',
  image: project.cover.variants.at(-1).src, render,
};

export function render(ctx) {
  const { t } = ctx;
  const rounds = [['camaCards', 'camaCardsText'], ['camaClue', 'camaClueText'], ['camaVote', 'camaVoteText']];
  const steps = html`<ol class="detail-steps">${raw(rounds.map(([heading, text]) =>
    html`<li><h3>${label(t, heading)}</h3><p>${label(t, text)}</p></li>`).join('\n'))}</ol>`;
  return detailPage(ctx, {
    kicker: 'camaPageKicker', caption: 'camaSheet', media: project.cover, altKey: 'camaImageAlt',
    body: section(t, 'camaRound', steps, 'manche')
      + section(t, 'camaOffline', html`<p>${label(t, 'camaOfflineText')}</p>`, 'offline'),
    resources: resourceList(project.links.map(link => resource(t, link.url, ...actions[link.type]))),
  });
}
