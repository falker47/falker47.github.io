import mods from '../../../data/mods.json' with { type: 'json' };
import projects from '../../../data/projects.json' with { type: 'json' };
import research from '../../../data/research.json' with { type: 'json' };
import tutoring from '../../../data/tutoring.json' with { type: 'json' };
import { html, raw } from '../../lib/html.mjs';
import { routes } from '../../routes.mjs';
import { label, localized, modRow, ratingCard, sheetFrame, statTile } from '../../partials/components.mjs';
import { icon } from '../../partials/icons.mjs';

export function moddingPanel({ t }) {
  const rows = mods.items.map((mod, index) => modRow(t, {
    title: mod.title, image: mod.cover, href: mod.url, summary: mod.description, game: mod.game,
  }, index));
  return html`<div class="stats-pair">
  ${raw(statTile(t, { valueKey: 'moddingNumber', key: 'downloadsLabel', iconName: 'download', href: mods.profile }))}
  ${raw(statTile(t, { valueKey: 'nexusModCount', nexusStat: 'modCount', key: 'modsLabel', iconName: 'file', href: mods.profile }))}
  </div><div class="register">${raw(rows.join('\n'))}</div>
  <a class="text-link panel-link" href="${mods.profile}"><span>${label(t, 'allModsStart')} <span data-i18n="nexusModCount" data-nexus-stat="modCount">${t('nexusModCount')}</span> ${label(t, 'allModsEnd')}</span> ${icon('arrow-ne')}</a>`;
}

export function researchPanel({ t }) {
  const ringmin = projects.find(project => project.id === research.id);
  const repo = research.repositories.find(item => item.project === ringmin.id).url;
  const internal = routes.some(route => route.path === ringmin.page);
  return html`<div class="research-layout">${raw(sheetFrame(t, { image: ringmin.cover, caption: 'sheetCaption' }))}
  <div><p class="research-intro">${localized(research.summary)}</p>
  <ol class="paper-list">${raw(research.papers.map(paper => html`<li>
  <span class="paper-id">arXiv:${paper.arxiv}</span>
  <h4><a href="${paper.url}">${paper.title} ${icon('arrow-ne')}</a></h4>
  <p>${localized(paper.highlight)}</p></li>`).join('\n'))}</ol>
  <nav class="panel-links" aria-label="${t('researchLinks')}" data-label="researchLinks">
  <a class="text-link" href="${internal ? ringmin.page : repo}">${label(t, 'learnMore')} ${icon(internal ? 'arrow-right' : 'arrow-ne')}</a>
  <a class="text-link" href="${repo}">GitHub ${icon('github')}</a>
  <a class="text-link" href="${research.zenodo.url}">Zenodo ${icon('arrow-ne')}</a></nav></div></div>`;
}

const logos = { Letuelezioni: '/assets/images/letuelezioni.png', Superprof: '/assets/images/superprof.png' };

export function tutoringPanel({ t, copy }) {
  const cards = tutoring.ratings.map(rating => {
    const detail = Object.fromEntries(Object.entries(copy).map(([lang, dictionary]) => {
      const count = dictionary[rating.ratings === 1 ? 'ratingOne' : 'ratingOther'].replace('{count}', rating.ratings);
      return [lang, rating.recommendations ? `${count} · ${rating.recommendations} ${dictionary.recommendations}` : count];
    }));
    return ratingCard(t, { ...rating, detail, href: rating.url, logo: logos[rating.source] });
  });
  return html`<div class="lesson-layout"><div><p class="category-intro">${label(t, 'teachingIntro')}</p>
  <div class="stats-pair">${raw(cards.join('\n'))}</div>
  <a class="text-link" href="${tutoring.portal}">${label(t, 'teachingPortal')} ${icon('arrow-ne')}</a>
  </div><svg class="project-visual" viewBox="0 0 300 164" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path class="art-surface" d="m66 14 169 13-10 128-169-13Z"/><path class="art-datum" d="m80 40 128 10M78 60l128 10M77 80l128 10M75 100l128 10M73 120l128 10"/><path class="art-muted" d="M101 119V51m-14 52h102"/><path class="art-line" d="M110 56c18 78 40 77 65 7"/><path class="art-muted" d="m97 57 4-6 4 6m79 42 5 4-5 4"/><path class="art-line" d="m210 128 34-68 9 5-34 68-9 4Z"/><path class="art-muted" d="m239 70 9 5"/></svg></div>`;
}
