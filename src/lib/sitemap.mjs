import { execFileSync } from 'node:child_process';
import { stat } from 'node:fs/promises';
import { html, raw } from './html.mjs';
import { origin } from '../routes.mjs';
import profile from '../../data/profile.json' with { type: 'json' };

export function indexable(route) {
  return !route.noindex && !['/projects/social-viewer/test/', '/styleguide/'].includes(route.path)
    && !route.path.startsWith('/Nexus-portfolio/');
}

export async function contentDate(root) {
  // A rebuild or an evidence-only commit should not date all pages anew.
  try {
    const date = execFileSync('git', ['log', '-1', '--format=%cs', '--', 'src', 'data', 'assets'],
      { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (date) return date;
  } catch { /* A source archive can also be built without Git metadata. */ }
  return (await stat(new URL('../routes.mjs', import.meta.url))).mtime.toISOString().slice(0, 10);
}

export function sitemap(template, routes, lastmod) {
  const records = routes.filter(indexable).map(route => html`  <url>
    <loc>${new URL(route.path, origin).href}</loc>
    <lastmod>${route.lastmod ?? lastmod}</lastmod>${route.path === '/' ? raw(html`
    <image:image>
      <image:loc>${new URL(profile.photo.variants.at(-1).src, origin).href}</image:loc>
      <image:title>${profile.name} (${profile.handle})</image:title>
    </image:image>`) : ''}
  </url>`);
  return template.replace('  <!-- canonical routes -->', records.join('\n'));
}
