import { html, raw } from '../../lib/html.mjs';
import { label } from '../../partials/components.mjs';
import { icon } from '../../partials/icons.mjs';

const group = 'https://groups.google.com/g/camaleonte-testing';
const optIn = 'https://play.google.com/apps/testing/io.github.falker47.socialviewer';

function pathPanel({ t, copy }, id, store) {
  const first = id === 'first-time';
  const name = first ? 'svFirstAria' : 'svReturningAria';
  const steps = [...(first ? [[group, 'svJoinGroup']] : []), [optIn, 'svJoinTest'], [store, 'svTestInstall']];
  return html`<section id="${id}" tabindex="-1" class="sv-path-panel" data-label="${name}" aria-label="${copy.it[name]}">
    <p>${label(t, first ? 'svFirstNote' : 'svReturningNote')}${first ? raw(html`<br><strong>${label(t, 'svSameEmail')}</strong>`) : ''}</p>
    <ol class="sv-steps">
      ${raw(steps.map(([href, key], i) => html`<li><a href="${href}"><span class="sv-step-number" aria-hidden="true">${i + 1}</span>${label(t, key)}${icon('arrow-ne')}</a></li>`).join('\n'))}
    </ol>
    <p class="sv-after">${label(t, first ? 'svFirstAfter' : 'svReturningAfter')}</p>
  </section>`;
}

export function renderTest(ctx, store) {
  const { t, copy } = ctx;
  return html`<main id="main" class="sv sv-test">
  <header class="sv-test-head">
    <div class="sv-test-meta"><p class="sv-kicker">Falker Studio Testers</p><span class="sv-status">${label(t, 'svStatus')}</span></div>
    <h1><a href="../">Social Viewer</a></h1>
    <p class="sv-lead">${label(t, 'svTestLead')}</p>
  </header>
  <section class="sv-picker" aria-labelledby="path-question">
    <p class="sv-kicker">${label(t, 'svRouteKicker')}</p>
    <h2 id="path-question">${label(t, 'svQuestion')}</h2>
    <p class="sv-help">${label(t, 'svQuestionHelp')}</p>
    <nav class="sv-choices" data-label="svChoosePath" aria-label="${copy.it.svChoosePath}">
      <a href="#returning" aria-controls="returning">${label(t, 'svReturningTab')}</a>
      <a href="#first-time" aria-controls="first-time">${label(t, 'svFirstTab')}</a>
    </nav>
    ${raw(pathPanel(ctx, 'returning', store))}
    ${raw(pathPanel(ctx, 'first-time', store))}
  </section>
  <section class="sv-requirements" data-label="svRequirements" aria-label="${copy.it.svRequirements}">
    <div><strong>${label(t, 'svDaysTitle')}</strong> <span>${label(t, 'svDaysBody')}</span></div>
    <div><strong>${label(t, 'svUseTitle')}</strong> <span>${label(t, 'svUseBody')}</span></div>
    <div><a href="mailto:falker.dev@gmail.com">${label(t, 'svReportTitle')}</a> <span>${label(t, 'svReportBody')}</span></div>
  </section>
  <p class="sv-test-foot">© 2026 Falker Studio · <a href="/">Portfolio</a> · <a href="../privacy/">Privacy</a></p>
</main>`;
}
