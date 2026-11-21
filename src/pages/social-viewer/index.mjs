import { readFileSync } from 'node:fs';
import projects from '../../../data/projects.json' with { type: 'json' };
import { html, raw } from '../../lib/html.mjs';
import { picture } from '../../lib/media.mjs';
import { label, localized, primaryCta } from '../../partials/components.mjs';
import { icon } from '../../partials/icons.mjs';
import { renderTest } from './test.mjs';

const project = projects.find(item => item.id === 'social-viewer');
const link = type => project.links.find(item => item.type === type).url;
const privacy = readFileSync(new URL('./privacy.html', import.meta.url), 'utf8');
// The product sheet is designed for the 480 px cover. Honour smaller originals too.
const native = project.cover.variants.filter(v => v.width <= Math.min(480, project.cover.nativeWidth)).at(-1);
if (!native) throw Error('No native-resolution Social Viewer cover in the catalogue');
const cover = { ...project.cover, ...native, variants: [native] };

function renderProduct({ t }) {
  return html`<main id="main" class="sv sv-product">
  <a class="sv-back" href="/#progetti">${icon('arrow-right')}${label(t, 'workTitle')}</a>
  <div class="sv-product-sheet">
    <header class="sv-product-head">
      <p class="sv-kicker">${localized(project.kind)} · Falker Studio</p>
      <h1>${project.title}</h1>
      <p class="sv-lead">${localized(project.summary)}</p>
    </header>
    <figure class="sheet sv-cover"><div class="sheet-frame">
      ${raw(picture(cover, { sizes: `(max-width: 540px) calc(100vw - 58px), ${native.width}px`, fetchpriority: 'high' }))}
    </div><figcaption>TAV. ${String(project.order).padStart(2, '0')} · ${localized(project.kind)}</figcaption></figure>
    <div class="sv-product-copy">
      <ul class="sv-points">
        ${raw(['svShare', 'svRead', 'svHistory'].map(key => html`<li>${label(t, key)}</li>`).join('\n'))}
      </ul>
      <div class="sv-actions">
        ${raw(primaryCta(t, 'svInstall', link('store')))}
        <a class="sv-secondary" href="./test/">${label(t, 'svBecomeTester')} ${icon('arrow-right')}</a>
      </div>
      <nav class="sv-related" aria-label="Social Viewer">
        <a href="./privacy/">Privacy</a><a href="${link('repo')}">${icon('github')} GitHub</a>
      </nav>
    </div>
  </div>
</main>`;
}

const shared = { styles: ['/styles/social-viewer.css'], image: cover.src };
export const socialViewerRoutes = [
  { ...shared, path: project.page, title: 'Social Viewer · Android', descriptionKey: 'svDescription', render: renderProduct },
  { ...shared, path: link('test'), title: 'Social Viewer · Falker Studio Testers', descriptionKey: 'svTestDescription',
    robots: 'noindex,follow', render: ctx => renderTest(ctx, link('store')) },
  { ...shared, path: project.page + 'privacy/', title: 'Social Viewer · Informativa sulla privacy', descriptionKey: 'svPolicyDescription',
    render: () => privacy },
];
