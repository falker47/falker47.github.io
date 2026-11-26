import { readFileSync } from 'node:fs';
import projects from '../../../data/projects.json' with { type: 'json' };
import { html, raw } from '../../lib/html.mjs';
import { actionLink, label, localized, primaryCta } from '../../partials/components.mjs';
import { cover as coverFigure, crumb, projectFacts, section } from '../../partials/detail-page.mjs';
import { renderTest } from './test.mjs';

const project = projects.find(item => item.id === 'social-viewer');
const link = type => project.links.find(item => item.type === type).url;
const privacy = readFileSync(new URL('./privacy.html', import.meta.url), 'utf8');
// The product page is designed for the 480 px cover. Honour smaller originals too.
const native = project.cover.variants.filter(v => v.width <= Math.min(480, project.cover.nativeWidth)).at(-1);
if (!native) throw Error('No native-resolution Social Viewer cover in the catalogue');
const cover = { ...project.cover, ...native, variants: [native] };

function renderProduct(ctx) {
  const { t } = ctx;
  return html`<main id="main" tabindex="-1" class="sv sv-product detail-page">
  ${raw(crumb(ctx))}
  <article class="detail-top detail-narrow" aria-labelledby="page-title">
    ${raw(coverFigure(cover, { sizes: `(max-width: 540px) calc(100vw - 32px), ${native.width}px` }))}
    <div class="detail-text"><p class="detail-kicker">${label(t, 'apps')}</p>
      <h1 id="page-title">${project.title}</h1>
      <p class="detail-lead">${localized(project.summary)}</p>
      ${raw(projectFacts(t, project))}
      <div class="detail-links sv-actions">
        ${raw(primaryCta(t, 'svInstall', link('store')))}
        ${raw(actionLink('./privacy/', 'Privacy', { className: 'detail-link' }))}
        ${raw(actionLink(link('repo'), 'GitHub', { className: 'detail-link' }))}
      </div>
    </div>
  </article>
  ${raw(section(t, 'svHowTitle', html`<ul class="detail-list sv-points">
    ${raw(['svShare', 'svRead', 'svHistory'].map(key => html`<li><p>${label(t, key)}</p></li>`).join(''))}
  </ul>`, 'come-funziona'))}
</main>`;
}

const shared = { styles: ['/styles/detail.css', '/styles/social-viewer.css'], image: cover.src };
// `title` names the document, `name` the page in its structured data.
export const socialViewerRoutes = [
  { ...shared, path: project.page, title: 'Social Viewer · Android · Maurizio Falconi', name: 'Social Viewer · Android',
    descriptionKey: 'svDescription', render: renderProduct,
    entities: (url, author) => [{
      '@type': 'MobileApplication', '@id': url + '#app', name: project.title, url: link('store'),
      applicationCategory: 'UtilitiesApplication', operatingSystem: 'Android',
      image: new URL(cover.src, url).href, description: project.description.en, author,
    }] },
  { ...shared, path: link('test'), title: 'Social Viewer · Falker Studio Testers', name: 'Social Viewer · Falker Studio Testers',
    descriptionKey: 'svTestDescription', robots: 'noindex,follow', render: ctx => renderTest(ctx, link('store')) },
  { ...shared, path: project.page + 'privacy/', title: 'Social Viewer · Informativa sulla privacy · Maurizio Falconi',
    name: 'Social Viewer · Informativa sulla privacy', descriptionKey: 'svPolicyDescription',
    render: ctx => crumb(ctx, { href: '../', text: 'Social Viewer' }) + privacy },
];
