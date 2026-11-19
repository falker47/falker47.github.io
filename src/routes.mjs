import { graph, jobTitle, render } from './pages/home.mjs';

export const origin = 'https://falker47.github.io';
export const routes = [
  {
    path: '/',
    title: `Maurizio Falconi (falker47) — ${jobTitle}`,
    descriptionKey: 'intro',
    styles: ['/styles/home.css'],
    image: '/assets/images/maurizio-falconi.webp',
    graph,
    render,
  },
];
