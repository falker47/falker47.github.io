import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { checkButtons, validateHomeCatalogue } from './validate-home.mjs';

const home = await readFile(new URL('../_site/index.html', import.meta.url), 'utf8');

test('the home keeps the master structure and renders every catalogue from data', () => {
  validateHomeCatalogue(home);
  assert.throws(() => validateHomeCatalogue(home.replace('<details class="work" id="progetti">', '<details class="work" id="progetti" open>')), /collapsed/);
  assert.throws(() => validateHomeCatalogue(home.replace('<a class="cta primary-cta" href="#progetti">', '<a class="cta primary-cta" href="/projects/">')), /hero action/);
  assert.throws(() => validateHomeCatalogue(home.replace('<strong class="result-value">4</strong>', '<strong class="result-value">9</strong>')), /Software tiles/);
  assert.throws(() => validateHomeCatalogue(home.replace('<a href="/uses/">', '<a href="/uses/" aria-current="page">')), /current/);
  assert.throws(() => validateHomeCatalogue(home.replace('<a class="footer-home" href="/">', '<a class="footer-home" href="#main">')), /signature/);
  assert.throws(() => validateHomeCatalogue(home.replace('<span class="card-stack">Python · PySide6 · Qt Quick</span>', '<span class="card-stack">Python · CustomTkinter</span>')), /panacea stack/);
});

test('the home rejects V2 and R1 components', () => {
  for (const name of ['masthead', 'register-row', 'filter-chips', 'register-tabs', 'tavola', 'portfolio-cta']) {
    assert.throws(() => validateHomeCatalogue(home.replace('</main>', `<div class="${name}"></div></main>`)), new RegExp(name));
  }
});

test('home links reach existing pages, never the legacy portfolio or the old projects page', () => {
  const legacy = '<a href="https://falker47.github.io/Nexus-portfolio/">Portfolio</a>';
  assert.throws(() => validateHomeCatalogue(home.replace('</main>', legacy + '</main>')), /new pages/);
  assert.throws(() => validateHomeCatalogue(home.replace('</main>', '<a href="/projects/">Progetti</a></main>')), /Unknown internal page/);
  assert.throws(() => validateHomeCatalogue(home.replace('href="/projects/social-viewer/"', 'href="/projects/missing/"')));
});

test('external actions show their platform mark; other actions keep an arrow', () => {
  assert.throws(() => validateHomeCatalogue(home.replace(/<svg class="brand brand-github"[^>]*><use href="#brand-github"\/><\/svg>/, '')), /mark/);
  assert.throws(() => validateHomeCatalogue(home.replace(/<a href="(https:\/\/www\.nexusmods\.com[^"]+)" style="--brand:#[0-9a-f]+" data-brand="nexusmods">/, '<a href="$1">')), /brand/);
  assert.throws(() => validateHomeCatalogue(home.replace('<use href="#icon-arrow-ne"/>', '<use href="#icon-arrow-right"/>')), /arrow/);
  // V4: the mark leads the label, the arrow ends it, and a card has at most three buttons.
  assert.throws(() => validateHomeCatalogue(home.replace(/(<svg class="brand brand-github"[^>]*><use href="#brand-github"\/><\/svg>)GitHub/, 'GitHub$1')), /mark first, arrow last/);
  assert.throws(() => validateHomeCatalogue(home.replace(/(<a href="https:\/\/profgecko\.vercel\.app\/">)([^]*?)(<svg class="icon[^"]*"[^>]*><use href="#icon-arrow-ne"\/><\/svg>)(<\/a>)/, '$1$3$2$4')), /mark first, arrow last/);
  const row = home.match(/<p class="card-links">([^]*?)<\/p>/g).find(markup => markup.includes('data-brand="googleplay"') && markup.includes('icon-arrow-ne'));
  assert.doesNotThrow(() => checkButtons(row, 'Camaleonte'));
  assert.throws(() => checkButtons(row + row, 'Camaleonte twice'), /one to three buttons/);
  assert.throws(() => checkButtons('<p class="card-links"></p>', 'Empty'), /one to three buttons/);
});

test('every count is the same tile: drawing or mark, number, label, and an arrow only on links', () => {
  assert.throws(() => validateHomeCatalogue(home.replace(/(<a class="result" href="\/research\/">)<svg class="result-icon"[^]*?<\/svg>/, '$1')), /tile parts/);
  assert.throws(() => validateHomeCatalogue(home.replace(/(<button type="button" class="picker-toggle result cat-mod"[^>]*>[^]*?)(<\/button>)/, '$1<span class="result-arrow" aria-hidden="true">→</span>$2')), /tile arrow/);
  assert.throws(() => validateHomeCatalogue(home.replace(/<span class="result-arrow" aria-hidden="true">↗<\/span>(<\/a>)/, '$1')), /tile arrow/);
});

test('the Lessons tab puts the text and its action before the two portals', () => {
  assert.throws(() => validateHomeCatalogue(home.replace('<p class="lessons-lead">', '<p class="lessons-intro">')));
  assert.throws(() => validateHomeCatalogue(home.replace('<div class="lesson-cards">', '<article class="card lesson-card"></article><div class="lesson-cards">')), /separate lessons box/);
});

test('the Modding tab lists every published mod with its own numbers and picture rule', () => {
  assert.throws(() => validateHomeCatalogue(home.replace('<a class="result nexus-total"', '<a class="result"')), /Nexus total/);
  assert.throws(() => validateHomeCatalogue(home.replace(/(<strong><span data-i18n-number=")(\d+)(")/, (_, start, value, end) => start + (Number(value) + 1) + end)), /counts/);
  assert.throws(() => validateHomeCatalogue(home.replace('<b class="cover-badge">IT</b>', '')), /IT badge/);
  assert.throws(() => validateHomeCatalogue(home.replace('href="https://github.com/falker47/HogwartsLegacy-SaveEditor"', 'href="https://github.com/falker47"')), /repository/);
});

test('the Research tab draws the certified configurations and both kinds of dots', () => {
  assert.throws(() => validateHomeCatalogue(home.replace('<line class="rm-spoke rm-open"', '<line class="rm-spoke"')), /dashed/);
  assert.throws(() => validateHomeCatalogue(home.replace('<circle class="rm-floating"', '<circle class="rm-circle"')));
  assert.throws(() => validateHomeCatalogue(home.replace(/(<path class="rm-arc" d="M[\d.]+ [\d.]+ A)[\d.]+/, '$1' + '90')), /C\*/);
  assert.throws(() => validateHomeCatalogue(home.replace('<svg class="rm-chart" viewBox="0 0 320 180"', '<svg class="rm-chart" viewBox="0 0 288 162"')), /16:9/);
  assert.throws(() => validateHomeCatalogue(home.replace('>C*</text>', '>1/8</text>')), /labels/);
  assert.throws(() => validateHomeCatalogue(home.replace(/(<p class="paper-bound">C\* ∈ \[<span[^>]*>)[^<]+/, '$1' + '0,1300')), /C\* interval/);
  assert.throws(() => validateHomeCatalogue(home.replace(/(<line class="rm-spoke" x1="[\d.]+" y1="[\d.]+" x2=")[\d.]+/, '$1' + '5')), /scale/);
  assert.throws(() => validateHomeCatalogue(home.replace('<a class="result" href="/research/">', '<a class="result" href="https://arxiv.org/">')), /paper count/);
});

test('Su di me shows each paragraph beside its figure, the facts from data and one deck card per certificate', () => {
  assert.throws(() => validateHomeCatalogue(home.replace('<span data-i18n="factPapers">articoli su arXiv</span>', '<span data-i18n="factPapers">articoli</span>')), /Facts/);
  assert.throws(() => validateHomeCatalogue(home.replace('<a class="fact fact-research" href="#ricerca">', '<a class="fact fact-research" href="/research/">')), /Facts/);
  assert.throws(() => validateHomeCatalogue(home.replace(/<li><a class="fact fact-tutoring"[^]*?<\/li>/, '')), /Facts/);
  assert.throws(() => validateHomeCatalogue(home.replace('<a class="fact fact-tutoring" href="#panel-teaching">', '<a class="fact fact-tutoring" href="/lessons/">')), /Facts/);
  const work = home.match(/<div class="about-row"><p data-i18n="aboutWork">[^]*?<\/figure><\/div>/)[0];
  const approach = home.match(/<div class="about-row"><p data-i18n="aboutApproach">[^]*?<\/figure><\/div>/)[0];
  assert.throws(() => validateHomeCatalogue(home.replace(work + approach, approach + work)), /order/);
  assert.throws(() => validateHomeCatalogue(home.replace('<div class="about-rows">', '<div class="about-rows journey">')), /Percorso/);
  assert.throws(() => validateHomeCatalogue(home.replace(/(<img src="\/assets\/certifications\/[^"]+-thumb-300\.webp" srcset=")[^"]+/, '$1x.webp 300w')), /./);
  assert.throws(() => validateHomeCatalogue(home.replace(/<button type="button" class="deck-card" style="--r:9\.0deg[^]*?<\/button>/, '')), /One card per certificate/);
});
