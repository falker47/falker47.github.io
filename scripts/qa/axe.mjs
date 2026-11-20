import { isolateNetwork } from './network.mjs';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { options, qaRequire, viewports, visit, withBrowser } from './browser.mjs';

const { pages, langs, out, stubPages } = await options();
const results = [];
await withBrowser(async (browser, origin) => {
  for (const route of pages) for (const lang of langs) for (const viewport of viewports) {
    const page = await browser.newPage({ viewport, locale: lang, reducedMotion: 'reduce', serviceWorkers: 'block' });
    try {
      const verifyNetwork = await isolateNetwork(page.context(), origin);
      await visit(page, origin, route, lang, stubPages.has(route));
      await page.addScriptTag({ path: qaRequire.resolve('axe-core/axe.min.js') });
      const violations = await page.evaluate(async () => {
        const { violations } = await window.axe.run(document);
        return violations.map(({id, impact, help, nodes}) => ({
          id, impact, help, targets: nodes.map(node => node.target),
        }));
      });
      verifyNetwork();
      results.push({ route, lang, width: viewport.width, violations });
      console.log(`${route} ${lang} ${viewport.width}: ${violations.length} violation(s)`);
      for (const violation of violations) console.log(violation.impact, violation.id, violation.targets);
    } finally { await page.close(); }
  }
}, { holdRedirects: stubPages, auditScripts: true });
await writeFile(join(out, 'axe.json'), JSON.stringify(results, null, 2) + '\n');
if (results.some(row => row.violations.some(v => ['serious','critical'].includes(v.impact)))) process.exitCode = 1;
