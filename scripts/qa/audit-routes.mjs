import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { routes } from '../../src/routes.mjs';
import { fileStat, localPath, siteRoot } from './serve.mjs';

export async function auditRoutes(root = siteRoot, declared = routes) {
  const manifest = JSON.parse(await readFile(join(root, 'data/redirects.json'), 'utf8'));
  const existing = new Map(), pending = [];
  async function exists(path) {
    const file = localPath(root, path.endsWith('/') ? path + 'index.html' : path);
    return (await fileStat(file))?.isFile();
  }
  for (const { path } of declared) {
    if (!await exists(path)) throw Error('Build is missing public route ' + path);
    existing.set(path, { path, stub: false });
  }
  for (const { from } of manifest.redirects) {
    if (await exists(from)) existing.set(from, { path: from, stub: true });
    else if (manifest.status === 'planned') pending.push(from);
    else throw Error('Build is missing active redirect ' + from);
  }
  if (await exists('/styleguide/')) existing.set('/styleguide/', { path: '/styleguide/', stub: false });
  return { routes: [...existing.values()], pending };
}
