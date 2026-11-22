import { readFileSync } from 'node:fs';
import projects from '../../../data/projects.json' with { type: 'json' };
import { html, raw } from '../../lib/html.mjs';
import { label, localized, primaryCta } from '../../partials/components.mjs';
import { crumb, plateFor, section } from '../../partials/detail-page.mjs';
import { sheetFigure, sheetNumber, specTable } from '../../partials/sheets.mjs';
import { renderTest } from './test.mjs';

const project = projects.find(item => item.id === 'social-viewer');
const link = type => project.links.find(item => item.type === type).url;
const privacy = readFileSync(new URL('./privacy.html', import.meta.url), 'utf8');
// The product sheet is designed for the 480 px cover. Honour smaller originals too.
const native = project.cover.variants.filter(v => v.width <= Math.min(480, project.cover.nativeWidth)).at(-1);
if (!native) throw Error('No native-resolution Social Viewer cover in the catalogue');
const cover = { ...project.cover, ...native, variants: [native] };

function renderProduct(ctx) {
  const { t } = ctx;
  return html`<main id="main" tabindex="-1" class="sv sv-product detail-page">
  ${raw(crumb(ctx))}
  <article class="tavola tavola-top tavola-narrow" aria-labelledby="page-title">
    ${raw(sheetFigure(cover, { fetchpriority: 'high', sizes: `(max-width: 540px) calc(100vw - 58px), ${native.width}px` }))}
    <div class="tavola-text">${raw(plateFor(t, sheetNumber(project.id)))}
      <h1 id="page-title">${project.title}</h1>
      <p class="tavola-summary">${localized(project.summary)}</p>
      ${raw(specTable(t, project))}
      <div class="tavola-links sv-actions">
        ${raw(primaryCta(t, 'svInstall', link('store')))}
        <a class="tavola-link" href="./test/">${label(t, 'svBecomeTester')} <span aria-hidden="true">→</span></a>
        <a class="tavola-link" href="./privacy/">Privacy <span aria-hidden="true">→</span></a>
        <a class="tavola-link" href="${link('repo')}">GitHub <span aria-hidden="true">↗</span></a>
      </div>
    </div>
  </article>
  ${raw(section(t, 'svHowTitle', html`<ul class="detail-list sv-points">
    ${raw(['svShare', 'svRead', 'svHistory'].map(key => html`<li><p>${label(t, key)}</p></li>`).join(''))}
  </ul>`, 'come-funziona'))}
</main>`;
}

const shared = { styles: ['/styles/sheets.css', '/styles/detail.css', '/styles/social-viewer.css'], image: cover.src };
export const socialViewerRoutes = [
  { ...shared, path: project.page, title: 'Social Viewer · Android', descriptionKey: 'svDescription', render: renderProduct },
  { ...shared, path: link('test'), title: 'Social Viewer · Falker Studio Testers', descriptionKey: 'svTestDescription',
    robots: 'noindex,follow', render: ctx => renderTest(ctx, link('store')) },
  { ...shared, path: project.page + 'privacy/', title: 'Social Viewer · Informativa sulla privacy', descriptionKey: 'svPolicyDescription',
    render: ctx => crumb(ctx, { href: '../', text: 'Social Viewer' }) + privacy },
];
