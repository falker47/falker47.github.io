import assert from 'node:assert/strict';
import projects from '../data/projects.json' with { type: 'json' };
import mods from '../data/mods.json' with { type: 'json' };
import research from '../data/research.json' with { type: 'json' };
import tutoring from '../data/tutoring.json' with { type: 'json' };
import certificates from '../data/certifications.json' with { type: 'json' };
import snapshot from '../data/nexus-downloads.json' with { type: 'json' };
import { decode, tags } from './qa/site.mjs';
import { routes } from '../src/routes.mjs';

const text = markup => decode(markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
const visible = projects.filter(item => !item.hidden).sort((a, b) => a.order - b.order);
const software = visible.filter(item => item.category !== 'research');
const count = kind => software.filter(item => item.category === kind).length;
const link = (item, type) => item.links.find(entry => entry.type === type)?.url;
const pages = new Set(routes.map(route => route.path));

// The master home: masthead, hero, "Chi sono" and "Cosa faccio" disclosures, signature footer.
function checkStructure(source) {
  for (const removed of ['site-header', 'register-row', 'register-tabs', 'filter-chips', 'work-summary', 'mod-row', 'stat-tile']) {
    assert.ok(!new RegExp('class="[^"]*\\b' + removed + '\\b').test(source), 'Home must not render ' + removed);
  }
  assert.match(source, /<header class="masthead">/);
  assert.match(source, /<details class="about" id="chi-sono"[ >]/);
  assert.match(source, /<details class="work" id="cosa-faccio"[ >]/);
  assert.equal([...source.matchAll(/<details class="(?:about|work)"/g)].length, 2, 'two collapsed disclosures');
  assert.ok(!/<details class="(?:about|work)"[^>]*\bopen\b/.test(source), 'Both disclosures start collapsed');
  const tabs = [...source.matchAll(/<button id="tab-([\w-]+)" role="tab"/g)].map(match => match[1]);
  assert.deepEqual(tabs, ['software', 'modding', 'research', 'teaching']);
  assert.match(source, /<footer class="footer"><p>Maurizio Falconi <span aria-hidden="true">·<\/span> @falker47<\/p><\/footer>/);
}

function checkCounts(source) {
  const tile = href => {
    const match = source.match(new RegExp('<a class="result" href="' + href.replace(/[/#]/g, '\\$&') + '">([^]*?)</a>'));
    assert.ok(match, 'Missing result tile ' + href);
    return text(match[1]).replace(/\s*↗$/, '');
  };
  assert.equal(tile('/projects/#app'), `${count('app')} app`);
  assert.equal(tile('/projects/#giochi'), `${count('game')} giochi`);
  assert.equal(tile('/projects/#strumenti'), `${count('tool')} strumenti`);
  assert.equal(tile('/research/'), `${research.papers.length} articoli su arXiv`);
  const modCount = new Intl.NumberFormat('it-IT').format(snapshot.modCount);
  // Read the rendered markup only; the bundled Nexus client mentions the same attributes.
  const markup = source.slice(0, source.indexOf('<script type="application/json"'));
  const counts = [...markup.matchAll(/<strong\b[^>]*data-nexus-stat="modCount"[^>]*>([^<]+)</g)];
  assert.equal(counts.length, 1, 'One live mod count');
  assert.equal(counts[0][1], modCount);
  const downloads = [...markup.matchAll(/<strong\b[^>]*data-i18n="moddingNumber"[^>]*>([^<]+)</g)];
  assert.equal(downloads.length, 1, 'One live download total');
  assert.equal(downloads[0][1], new Intl.NumberFormat('it-IT').format(snapshot.uniqueModDownloads));
  const ratings = [...source.matchAll(/<a class="feedback-result" href="([^"]+)">([^]*?)<\/a>/g)];
  assert.deepEqual(ratings.map(match => match[1]), tutoring.ratings.map(rating => rating.url));
  for (const [index, [, , markup]] of ratings.entries()) {
    const rating = tutoring.ratings[index];
    assert.ok(decode(markup.replace(/<[^>]+>/g, '')).includes(`${rating.score}/${rating.scale}`), rating.source + ' score');
    assert.ok(text(markup).includes(`${rating.ratings} valutazion`), rating.source + ' ratings');
  }
  assert.equal(tags(source).filter(node => node.attrs['data-viewer'] === 'home-certificate').length, certificates.length);
  const preview = source.match(/<section class="credentials" id="certificazioni"[^]*?<details class="more-certificates">/)[0];
  assert.equal(tags(preview).filter(node => node.attrs['data-viewer']).length, 4, 'Four visible certificates');
  assert.ok(text(source.match(/<details class="more-certificates">[^]*?<\/summary>/)[0]).includes(`Mostra tutte (${certificates.length})`));
  assert.equal(tags(source).filter(node => node.name === 'dialog' && node.attrs.id === 'home-certificate').length, 1);
}

function checkLinks(source) {
  const hrefs = tags(source).filter(node => node.name === 'a').map(node => node.attrs.href);
  assert.deepEqual(hrefs.filter(href => href.includes('/Nexus-portfolio/')), [], 'Home links reach the new pages');
  assert.match(source, /<a class="cta primary-cta" href="\/projects\/">/);
  assert.match(source, /<a class="portfolio-cta" href="\/projects\/">/);
  assert.ok(hrefs.includes('/projects/social-viewer/'), 'Social Viewer opens its page');
  assert.ok(hrefs.includes('/research/'), 'Research opens its page');
  for (const href of hrefs.filter(href => /^\/(?!\/)/.test(href) && !href.startsWith('/assets/'))) {
    assert.ok(pages.has(new URL(href, 'https://x.invalid').pathname), 'Unknown internal page link ' + href);
  }
}

export function validateHomeCatalogue(source) {
  checkStructure(source);
  checkCounts(source);
  checkLinks(source);
}

// The projects page: one sheet per project, in data order inside each group.
export function expectedSheets() {
  const fromProject = item => {
    const internal = pages.has(item.page) && item.page !== '/';
    const external = link(item, 'demo') ?? link(item, 'store');
    return { id: item.id, title: item.title, first: internal ? item.page : external ?? link(item, 'repo'),
      internal, github: link(item, 'repo') };
  };
  return [
    ['app', software.filter(item => item.category === 'app').map(fromProject)],
    ['giochi', software.filter(item => item.category === 'game').map(fromProject)],
    ['strumenti', software.filter(item => item.category === 'tool').map(fromProject)],
    ['mod', mods.items.map(mod => ({ id: mod.id, title: mod.title, first: mod.url, internal: false, github: mod.repo ?? undefined }))],
    ['ricerca', visible.filter(item => item.category === 'research').map(fromProject)],
  ];
}

export function validateProjectsPage(source) {
  const groups = expectedSheets();
  const index = [...source.matchAll(/<li><a href="#([\w-]+)">[^]*?<span class="index-count">(\d+)<\/span><\/a><\/li>/g)];
  assert.deepEqual(index.map(([, id, n]) => [id, Number(n)]), groups.map(([id, items]) => [id, items.length]));
  const sections = [...source.matchAll(/<section class="sheet-group" id="([\w-]+)"[^>]*>([^]*?)<\/section>/g)];
  assert.deepEqual(sections.map(match => match[1]), groups.map(([id]) => id));
  let number = 0;
  for (const [[, id, markup], [, items]] of sections.map((section, i) => [section, groups[i]])) {
    const sheets = [...markup.matchAll(/<article class="tavola[^"]*"[^>]*>([^]*?)<\/article>/g)].map(match => match[1]);
    assert.equal(sheets.length, items.length, id);
    for (const [i, sheet] of sheets.entries()) {
      const item = items[i];
      number++;
      assert.match(sheet, new RegExp('<p class="tavola-label"><span data-i18n="sheetLabel">Tav\\.</span> ' + String(number).padStart(2, '0') + '</p>'), item.id + ' plate');
      assert.equal(text(sheet.match(/<h2 [^>]*>([^]*?)<\/h2>/)[1]), item.title);
      assert.match(sheet, /<div class="sheet-frame" style="--image-max: \d+px"><picture>/, item.id + ' framed picture');
      const rows = [...sheet.matchAll(/<th scope="row"><span data-i18n="(\w+)">/g)].map(match => match[1]);
      assert.deepEqual(rows, ['specKind', 'specStack', 'specWhere'], item.id + ' spec table');
      const links = tags(sheet).filter(node => node.name === 'a' && node.attrs.class === 'tavola-link');
      assert.equal(links[0].attrs.href, item.first, item.id + ' first link');
      const firstKey = tags(sheet).find(node => node.attrs['data-i18n'] === 'openSheet' || node.attrs['data-i18n'] === 'openLink');
      if (item.first === item.github && !item.internal) assert.ok(!firstKey || links.length === 1, item.id);
      else assert.equal(firstKey.attrs['data-i18n'], item.internal ? 'openSheet' : 'openLink', item.id + ' first link label');
      assert.equal(links.filter(node => node.attrs.href === item.github).length, item.github ? 1 : 0, item.id + ' GitHub');
    }
  }
  assert.equal(number, groups.reduce((total, [, items]) => total + items.length, 0));
}
