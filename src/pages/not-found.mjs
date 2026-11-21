import { html, raw } from '../lib/html.mjs';
import { label, primaryCta } from '../partials/components.mjs';

export function render({ t, copy }) {
  return html`<script>
  if (location.pathname.startsWith('/Nexus-portfolio/')) {
    const projects = location.pathname.split('/').some(part => part === 'projects' || part === 'projects.html');
    location.replace('/' + location.search + (projects ? '#software' : ''));
  }
</script>
<main id="main" tabindex="-1" class="status-main">
  <div class="status-panel not-found">
    <p class="status-code">HTTP 404</p>
    <h1>${label(t, 'missingPage')}</h1>
    <p class="status-description">${label(t, 'missingReason')}</p>
    <div class="status-actions">
      ${raw(primaryCta(t, 'backHome', '/'))}
      <a href="/#progetti">${label(t, 'workTitle')}</a>
    </div>
    <noscript><p lang="en">${copy.en.missingPage}. <a href="/">${copy.en.backHome}</a> · <a href="/#progetti">${copy.en.workTitle}</a></p></noscript>
  </div>
</main>`;
}
