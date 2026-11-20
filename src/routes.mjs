import profile from '../data/profile.json' with { type: 'json' };
import { graph, render } from './pages/home.mjs';
import { socialViewerRoutes } from './pages/social-viewer/index.mjs';

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
  ...socialViewerRoutes,
];
