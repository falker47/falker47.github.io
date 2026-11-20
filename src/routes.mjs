import profile from '../data/profile.json' with { type: 'json' };
import { graph, render } from './pages/home.mjs';
import { render as notFound } from './pages/not-found.mjs';

export const origin = 'https://falker47.github.io';
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
    path: '/404.html', title: '404 · Maurizio Falconi', noindex: true,
    descriptionKey: 'missingReason', styles: ['/styles/status.css'],
    image: profile.photo.src, render: notFound,
  },
];
