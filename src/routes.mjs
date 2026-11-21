import profile from '../data/profile.json' with { type: 'json' };
import it from '../data/i18n/it.json' with { type: 'json' };
import { graph, render } from './pages/home.mjs';
import { render as notFound } from './pages/not-found.mjs';
import { page as research } from './pages/research.mjs';
import { page as gecko } from './pages/prof-gecko.mjs';
import { page as camaleonte } from './pages/camaleonte.mjs';
import { page as uses } from './pages/uses.mjs';

export const origin = 'https://falker47.github.io';

const person = {
  '@type': 'Person', '@id': origin + '/#person',
  name: profile.name, alternateName: profile.handle, jobTitle: profile.role, url: origin + '/',
};

function detailRoute(page) {
  const url = new URL(page.path, origin).href;
  const author = { '@id': person['@id'] };
  const entities = page.entities?.(url, author) ?? [];
  const document = {
    '@type': page.type ?? 'WebPage', '@id': url + '#page', url,
    name: it[page.titleKey], description: it[page.descriptionKey], author,
  };
  if (page.type === 'CollectionPage') document.hasPart = entities.map(item => ({ '@id': item['@id'] }));
  else if (entities.length) document.mainEntity = { '@id': entities[0]['@id'] };
  return {
    path: page.path, titleKey: page.titleKey, title: it[page.titleKey], descriptionKey: page.descriptionKey,
    styles: ['/styles/detail.css'], image: page.image, graph: [person, document, ...entities], render: page.render,
  };
}

export const routes = [
  {
    path: '/',
    title: `${profile.name} (${profile.handle}) — ${profile.role}`,
    descriptionKey: 'intro',
    styles: ['/styles/home.css'],
    image: '/assets/images/maurizio-falconi.webp',
    graph,
    render,
  },
  {
    path: '/404.html', title: 'Pagina non trovata · Maurizio Falconi', noindex: true,
    descriptionKey: 'missingReason', styles: ['/styles/status.css'],
    image: profile.photo.src, render: notFound,
  },
  ...[research, gecko, camaleonte, uses].map(detailRoute),
];
