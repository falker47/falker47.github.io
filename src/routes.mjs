import profile from '../data/profile.json' with { type: 'json' };
import it from '../data/i18n/it.json' with { type: 'json' };
import { graph, render } from './pages/home.mjs';
import { render as notFound } from './pages/not-found.mjs';
import { page as research } from './pages/research.mjs';
import { page as gecko } from './pages/prof-gecko.mjs';
import { page as camaleonte } from './pages/camaleonte.mjs';
import { page as uses } from './pages/uses.mjs';
import { socialViewerRoutes } from './pages/social-viewer/index.mjs';

export const origin = 'https://falker47.github.io';

const person = {
  '@type': 'Person', '@id': origin + '/#person',
  name: profile.name, alternateName: profile.handle, jobTitle: profile.role, url: origin + '/',
};

const author = { '@id': person['@id'] };

// The page by its author, with the entities it describes.
function pageGraph(path, { type = 'WebPage', name, descriptionKey, entities }) {
  const url = new URL(path, origin).href;
  const parts = entities?.(url, author) ?? [];
  const document = { '@type': type, '@id': url + '#page', url, name, description: it[descriptionKey], author };
  if (type === 'CollectionPage' && parts.length) document.hasPart = parts.map(item => ({ '@id': item['@id'] }));
  else if (parts.length) document.mainEntity = { '@id': parts[0]['@id'] };
  return [person, document, ...parts];
}

// The document title adds the author's name; the heading keeps the page's own.
function detailRoute(page) {
  const titleKey = 'title.' + page.path;
  return {
    path: page.path, titleKey, title: it[titleKey], headingKey: page.titleKey, descriptionKey: page.descriptionKey,
    styles: page.styles ?? ['/styles/detail.css'], image: page.image, render: page.render,
    graph: pageGraph(page.path, { type: page.type, name: it[page.titleKey], descriptionKey: page.descriptionKey, entities: page.entities }),
  };
}

export const routes = [
  {
    path: '/',
    title: `${profile.name} (${profile.handle}) — ${profile.role}`,
    descriptionKey: 'intro',
    styles: ['/styles/home.css', '/styles/sections.css'],
    image: '/assets/images/maurizio-falconi-native.webp',
    graph,
    render,
  },
  {
    path: '/404.html', title: 'Pagina non trovata · Maurizio Falconi', noindex: true,
    descriptionKey: 'missingReason', styles: ['/styles/status.css'],
    image: profile.photo.src, render: notFound,
  },
  ...[research, gecko, camaleonte, uses].map(detailRoute),
  ...socialViewerRoutes.map(route => ({ ...route, graph: pageGraph(route.path, route) })),
];
