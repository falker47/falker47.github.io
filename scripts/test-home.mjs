import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { validateHomeCatalogue } from './validate-home.mjs';

const home = await readFile(new URL('../_site/index.html', import.meta.url), 'utf8');

test('the home keeps the master structure and renders every catalogue from data', () => {
  validateHomeCatalogue(home);
  assert.throws(() => validateHomeCatalogue(home.replace('<details class="work" id="progetti">', '<details class="work" id="progetti" open>')), /collapsed/);
  assert.throws(() => validateHomeCatalogue(home.replace('<a class="cta primary-cta" href="#progetti">', '<a class="cta primary-cta" href="/projects/">')), /hero action/);
  assert.throws(() => validateHomeCatalogue(home.replace('<span data-i18n="apps">App</span> <span class="picker-count-value">4</span>', '<span data-i18n="apps">App</span> <span class="picker-count-value">9</span>')), /Software pills/);
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
});

test('the Lessons tab puts the text and its action before the two portals', () => {
  assert.throws(() => validateHomeCatalogue(home.replace('<p class="lessons-lead">', '<p class="lessons-intro">')));
  assert.throws(() => validateHomeCatalogue(home.replace('<div class="lesson-cards">', '<article class="card lesson-card"></article><div class="lesson-cards">')), /separate lessons box/);
});

test('the Modding tab lists every published mod with its own numbers and picture rule', () => {
  assert.throws(() => validateHomeCatalogue(home.replace('<span data-i18n="modsPill">Mod</span> <span class="picker-count-value">', '<span data-i18n="modsPill">Mod</span> <span class="picker-count-value">9')), /Modding pills/);
  assert.throws(() => validateHomeCatalogue(home.replace('<svg class="brand brand-nexusmods" aria-hidden="true" focusable="false"><use href="#brand-nexusmods"/></svg><strong data-i18n="moddingNumber">', '<strong data-i18n="moddingNumber">')), /Nexus mark/);
  assert.throws(() => validateHomeCatalogue(home.replace(/(<strong><span data-i18n-number=")(\d+)(")/, (_, start, value, end) => start + (Number(value) + 1) + end)), /counts/);
  assert.throws(() => validateHomeCatalogue(home.replace('<div class="mod-type"><b>IT</b>', '<div class="mod-type"><img src="/assets/nexus/1.webp" width="1" height="1" alt=""><b>IT</b>')), /translation has no picture/);
  assert.throws(() => validateHomeCatalogue(home.replace('href="https://github.com/falker47/HogwartsLegacy-SaveEditor"', 'href="https://github.com/falker47"')), /repository/);
  assert.throws(() => validateHomeCatalogue(home.replace(/<time data-nexus-stat="checkedOn" datetime="[\d-]+">/, '<time data-nexus-stat="checkedOn" datetime="2020-01-01">')), /Snapshot date/);
});

test('the Research tab draws the certified configurations and both kinds of dots', () => {
  assert.throws(() => validateHomeCatalogue(home.replace('<circle class="rm-dot rm-open"', '<circle class="rm-dot"')), /dots/);
  assert.throws(() => validateHomeCatalogue(home.replace('<circle class="rm-floating"', '<circle class="rm-circle"')));
  assert.throws(() => validateHomeCatalogue(home.replace('1/8 · limite inferiore', '1/8 · C* sta sotto')));
  assert.throws(() => validateHomeCatalogue(home.replace('<rect class="rm-band"', '<rect class="rm-box"')), /band/);
  assert.throws(() => validateHomeCatalogue(home.replace(/(<text class="rm-band-label"[^>]*>C\* ∈ \[<tspan[^>]*>)[^<]+/, '$1' + '0,1300')), /Band label/);
  assert.throws(() => validateHomeCatalogue(home.replace('text-anchor="middle">n = ∞</text>', 'text-anchor="middle">n = 1</text>')), /Axis labels/);
  assert.throws(() => validateHomeCatalogue(home.replace('<a class="result" href="/research/">', '<a class="result" href="https://arxiv.org/">')), /paper count/);
});

test('Chi sono shows the text, the facts from data and one deck card per certificate', () => {
  assert.throws(() => validateHomeCatalogue(home.replace('<span data-i18n="factPapers">articoli su arXiv</span>', '<span data-i18n="factPapers">articoli</span>')), /Facts/);
  assert.throws(() => validateHomeCatalogue(home.replace('<a class="fact" href="#ricerca">', '<a class="fact" href="/research/">')), /Facts/);
  assert.throws(() => validateHomeCatalogue(home.replace('<div class="about-text">', '<div class="about-text journey">')), /Percorso/);
  assert.throws(() => validateHomeCatalogue(home.replace(/(<img src="\/assets\/certifications\/[^"]+-thumb-300\.webp" srcset=")[^"]+/, '$1x.webp 300w')), /./);
  assert.throws(() => validateHomeCatalogue(home.replace(/<button type="button" class="deck-card" style="--r:9\.0deg[^]*?<\/button>/, '')), /One card per certificate/);
});
