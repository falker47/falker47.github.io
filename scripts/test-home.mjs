import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { validateHomeCatalogue, validateProjectsPage } from './validate-home.mjs';

const home = await readFile(new URL('../_site/index.html', import.meta.url), 'utf8');
const sheets = await readFile(new URL('../_site/projects/index.html', import.meta.url), 'utf8');

test('the home is the master layout with data-driven counts', () => {
  validateHomeCatalogue(home);
  const stale = home.replace(/(<a class="result" href="\/projects\/#giochi">[^]*?<strong class="result-value">)\d+/, (_, start) => start + '9');
  assert.throws(() => validateHomeCatalogue(stale), /giochi/);
  assert.throws(() => validateHomeCatalogue(home.replace('<details class="work" id="cosa-faccio">', '<details class="work" id="cosa-faccio" open>')), /collapsed/);
});

test('the home rejects R1 components and the sticky header', () => {
  for (const name of ['register-row', 'filter-chips', 'register-tabs', 'site-header']) {
    assert.throws(() => validateHomeCatalogue(home.replace('</main>', `<div class="${name}"></div></main>`)), new RegExp(name));
  }
});

test('home links reach the new pages instead of the legacy portfolio', () => {
  const legacy = '<a href="https://falker47.github.io/Nexus-portfolio/">Portfolio</a>';
  assert.throws(() => validateHomeCatalogue(home.replace('</main>', legacy + '</main>')), /new pages/);
  assert.throws(() => validateHomeCatalogue(home.replace('<a class="portfolio-cta" href="/projects/">', '<a class="portfolio-cta" href="/#progetti">')));
  assert.throws(() => validateHomeCatalogue(home.replace('href="/projects/social-viewer/"', 'href="/projects/missing/"')));
});

test('every project sheet keeps its order, plate number and destinations', () => {
  validateProjectsPage(sheets);
  assert.throws(() => validateProjectsPage(sheets.replace('<span data-i18n="sheetLabel">Tav.</span> 02', '<span data-i18n="sheetLabel">Tav.</span> 03')), /plate/);
  assert.throws(() => validateProjectsPage(sheets.replace('href="/projects/prof-gecko/"', 'href="https://profgecko.vercel.app/"')), /first link/);
  assert.throws(() => validateProjectsPage(sheets.replace('href="https://github.com/falker47/HogwartsLegacy-SaveEditor"', 'href="https://github.com/falker47"')), /GitHub/);
  assert.throws(() => validateProjectsPage(sheets.replace(/<span class="index-count">4<\/span>/, '<span class="index-count">5</span>')));
});

test('the sheet partial links exactly the project pages this site renders', async () => {
  const { projectPages } = await import('../src/partials/sheets.mjs');
  const { routes } = await import('../src/routes.mjs');
  const projects = (await import('../data/projects.json', { with: { type: 'json' } })).default;
  const rendered = new Set(routes.map(route => route.path));
  assert.deepEqual([...projectPages].sort(), projects.map(project => project.page).filter(page => page && rendered.has(page)).sort());
});

test('the Save Editor sheet preserves both original project destinations', () => {
  const editor = sheets.match(/<article class="tavola[^"]*" aria-labelledby="tav-hogwarts-legacy-save-editor">[^]*?<\/article>/)[0];
  assert.match(editor, /class="tavola-link" href="https:\/\/www\.nexusmods\.com\/hogwartslegacy\/mods\/2414"/);
  assert.match(editor, /class="tavola-link" href="https:\/\/github\.com\/falker47\/HogwartsLegacy-SaveEditor"/);
});
