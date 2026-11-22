import projects from '../../data/projects.json' with { type: 'json' };
import { html, raw } from '../lib/html.mjs';
import { label } from '../partials/components.mjs';
import { action, detailPage, plateFor, section } from '../partials/detail-page.mjs';
import { sheetNumber, specTable } from '../partials/sheets.mjs';

const project = projects.find(item => item.id === 'camaleonte');
const keys = { demo: 'camaPlay', store: 'camaAndroid', repo: 'camaSource' };

export const page = {
  path: project.page, titleKey: 'camaPageTitle', descriptionKey: 'camaPageLead',
  image: project.cover.variants.at(-1).src, render,
};

export function render(ctx) {
  const { t } = ctx;
  const rounds = [['camaCards', 'camaCardsText'], ['camaClue', 'camaClueText'], ['camaVote', 'camaVoteText']];
  const steps = html`<ol class="detail-list detail-steps">${raw(rounds.map(([heading, text]) =>
    html`<li><h3>${label(t, heading)}</h3><p>${label(t, text)}</p></li>`).join('\n'))}</ol>`;
  return detailPage(ctx, {
    plate: plateFor(t, sheetNumber(project.id)), media: project.cover, altKey: 'camaImageAlt',
    spec: specTable(t, project), actions: project.links.map(link => action(t, link.url, keys[link.type])),
    body: section(t, 'camaRound', steps, 'manche')
      + section(t, 'camaOffline', html`<p>${label(t, 'camaOfflineText')}</p>`, 'offline'),
  });
}
