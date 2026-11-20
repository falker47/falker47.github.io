import { writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { options, qaRequire, viewports, visit, withBrowser } from './browser.mjs';
import { isolateNetwork } from './network.mjs';
import { auditRoutes } from './audit-routes.mjs';

export async function runAxe(pages, langs, root) {
  const results = [];
  for (const { path: route, stub } of pages) await withBrowser(async (browser, origin) => {
    for (const lang of langs) for (const viewport of viewports) {
      const row = { route, lang, width: viewport.width, pass: false };
      results.push(row);
      const page = await browser.newPage({ viewport, locale: lang, reducedMotion: 'reduce', serviceWorkers: 'block' });
      try {
        const verifyNetwork = await isolateNetwork(page.context(), origin);
        await visit(page, origin, route, lang, { stub });
        await page.addScriptTag({ path: qaRequire.resolve('axe-core/axe.min.js') });
        row.violations = await page.evaluate(async () => {
          const { violations } = await window.axe.run(document);
          return violations.map(({ id, impact, help, nodes }) => ({ id, impact, help, targets: nodes.map(node => node.target) }));
        });
        verifyNetwork();
        row.pass = row.violations.length === 0;
      } catch (error) { row.error = error.message; }
      finally { await page.close(); }
      console.log(route, lang, viewport.width, row.pass ? '0 violations' : JSON.stringify(row));
    }
  }, { root, holdDocument: stub ? route : undefined });
  return results;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { pages, langs, out } = await options();
  const available = (await auditRoutes()).routes;
  const results = await runAxe(pages.map(path => available.find(r => r.path === path) || { path }), langs);
  await writeFile(join(out, 'axe.json'), JSON.stringify(results, null, 2) + '\n');
  if (results.some(row => !row.pass)) process.exitCode = 1;
}
