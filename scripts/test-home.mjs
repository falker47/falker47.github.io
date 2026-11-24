import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { validateHomeCatalogue } from './validate-home.mjs';

const home = await readFile(new URL('../_site/index.html', import.meta.url), 'utf8');

test('the home keeps the master structure and renders every catalogue from data', () => {
  validateHomeCatalogue(home);
  assert.throws(() => validateHomeCatalogue(home.replace('<details class="work" id="progetti">', '<details class="work" id="progetti" open>')), /collapsed/);
  assert.throws(() => validateHomeCatalogue(home.replace('<a class="cta primary-cta" href="#progetti">', '<a class="cta primary-cta" href="/projects/">')), /hero action/);
  assert.throws(() => validateHomeCatalogue(home.replace('<strong class="result-value">4</strong>', '<strong class="result-value">9</strong>')), /Software toggles/);
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

test('the Modding tab lists every published mod with its own numbers and picture rule', () => {
  assert.throws(() => validateHomeCatalogue(home.replace(/(<strong><span data-i18n-number=")(\d+)(")/, (_, start, value, end) => start + (Number(value) + 1) + end)), /counts/);
  assert.throws(() => validateHomeCatalogue(home.replace('<div class="mod-type"><b>IT</b>', '<div class="mod-type"><img src="/assets/nexus/1.webp" width="1" height="1" alt=""><b>IT</b>')), /translation has no picture/);
  assert.throws(() => validateHomeCatalogue(home.replace('href="https://github.com/falker47/HogwartsLegacy-SaveEditor"', 'href="https://github.com/falker47"')), /repository/);
  assert.throws(() => validateHomeCatalogue(home.replace(/<time data-nexus-stat="checkedOn" datetime="[\d-]+">/, '<time data-nexus-stat="checkedOn" datetime="2020-01-01">')), /Snapshot date/);
});

test('the Research tab draws the certified configurations and both kinds of dots', () => {
  assert.throws(() => validateHomeCatalogue(home.replace('<circle class="rm-dot rm-open"', '<circle class="rm-dot"')), /dots/);
  assert.throws(() => validateHomeCatalogue(home.replace('<circle class="rm-floating"', '<circle class="rm-circle"')));
  assert.throws(() => validateHomeCatalogue(home.replace('C* sta sopra questa linea ↑', 'C* sta sotto questa linea')));
  assert.throws(() => validateHomeCatalogue(home.replace('<a class="result" href="/research/">', '<a class="result" href="https://arxiv.org/">')), /paper count/);
});

test('Chi sono keeps the journey between text and philosophy and one deck card per certificate', () => {
  assert.throws(() => validateHomeCatalogue(home.replace('<g class="jr-node jr-current"', '<g class="jr-node"')), /highlights today/);
  assert.throws(() => validateHomeCatalogue(home.replace(/<button type="button" class="deck-card" style="--r:9\.0deg[^]*?<\/button>/, '')), /One card per certificate/);
});
