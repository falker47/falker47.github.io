import assert from 'node:assert/strict';
import projects from '../data/projects.json' with { type: 'json' };
import featured from '../data/mods.json' with { type: 'json' };
import nexus from '../data/nexus-mods.json' with { type: 'json' };
import research from '../data/research.json' with { type: 'json' };
import ringmin from '../data/ringmin.json' with { type: 'json' };
import tutoring from '../data/tutoring.json' with { type: 'json' };
import certificates from '../data/certifications.json' with { type: 'json' };
import identity from '../data/profile.json' with { type: 'json' };
import snapshot from '../data/nexus-downloads.json' with { type: 'json' };
import italianCopy from '../data/i18n/it.json' with { type: 'json' };
import { decode, tags } from './qa/site.mjs';
import { routes } from '../src/routes.mjs';
import { aggregateRating, formatScore } from '../src/lib/rating.mjs';

// The V3 home: header bar, hero, "Chi sono" and "I miei progetti". Every project,
// published mod and paper is rendered inside the page and read back from the data here.
const text = markup => decode(markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
const visible = projects.filter(item => !item.hidden).sort((a, b) => a.order - b.order);
const pages = new Set(routes.map(route => route.path));
const italian = value => new Intl.NumberFormat('it-IT').format(value);
const hrefs = markup => tags(markup).filter(node => node.name === 'a').map(node => node.attrs.href);
const panel = (source, id) => {
  const match = source.match(new RegExp('<section class="work-panel" id="panel-' + id + '"[^]*?(?=<section class="work-panel"|</div></div></details>)'));
  assert.ok(match, 'Missing panel ' + id);
  return match[0];
};
const cards = markup => [...markup.matchAll(/<li class="card[^"]*">([^]*?)<\/li>/g)].map(match => match[1]);
const groups = markup => [...markup.matchAll(/<section class="picker-group cat-([\w-]+)" data-group="([\w-]+)"[^>]*>([^]*?)<\/section>/g)]
  .map(([, colour, id, body]) => ({ colour, id, body }));
const toggles = markup => [...markup.matchAll(/<button type="button" class="picker-toggle result cat-([\w-]+)" data-group="([\w-]+)" aria-pressed="(true|false)">([^]*?)<\/button>/g)]
  .map(([, colour, id, pressed, body]) => ({ colour, id, pressed, label: text(body) }));
// Each card button: its destination, its platform mark (V4) or the arrow icon it keeps.
const buttons = markup => [...markup.matchAll(/<a href="([^"]+)"([^>]*)>([^]*?)<\/a>/g)]
  .map(([, href, attrs, body]) => ({ href, brand: /data-brand="([\w-]+)"/.exec(attrs)?.[1] ?? null,
    mark: /href="#brand-([\w-]+)"/.exec(body)?.[1] ?? null, arrow: /href="#icon-(arrow-[\w-]+)"/.exec(body)?.[1] ?? null,
    leads: body.startsWith('<svg class="brand '), ends: /<svg class="icon[^"]*"[^>]*><use href="#icon-arrow-[\w-]+"\/><\/svg>$/.test(body) }));
const expectedBrand = href => {
  const host = /^https:\/\/([^/]+)/.exec(href)?.[1] ?? '';
  return [['github.com', 'github'], ['play.google.com', 'googleplay'], ['nexusmods.com', 'nexusmods'], ['arxiv.org', 'arxiv'],
    ['zenodo.org', 'zenodo'], ['orcid.org', 'orcid'], ['oeis.org', 'oeis'], ['linkedin.com', 'linkedin']].find(([name]) => host === name || host.endsWith('.' + name))?.[1] ?? null;
};
// V4: one to three buttons; the platform mark leads the label, the arrow of any other link ends it.
export function checkButtons(markup, label) {
  const list = buttons(markup);
  assert.ok(list.length >= 1 && list.length <= 3, label + ': one to three buttons');
  for (const button of list) {
    assert.ok(button.mark ? button.leads && !button.ends : button.ends && !button.leads, label + ': ' + button.href + ' mark first, arrow last');
    const brand = expectedBrand(button.href);
    assert.equal(button.brand, brand, label + ': ' + button.href + ' brand');
    assert.equal(button.mark, brand, label + ': ' + button.href + ' mark');
    assert.equal(button.arrow, brand ? null : /^[/#.]/.test(button.href) ? 'arrow-right' : 'arrow-ne', label + ': ' + button.href + ' arrow');
  }
}

// V4: every count tile has the same parts in the same order: its drawing, emblem or mark, the number
// and the label; a linked tile ends with its arrow, a toggle has none.
function checkTiles(markup, label, expected) {
  const tiles = [...markup.matchAll(/<(a|button) [^>]*class="(?:picker-toggle )?result\b[^"]*"[^>]*>([^]*?)<\/\1>/g)];
  assert.equal(tiles.length, expected, label + ' tiles');
  for (const [, tag, body] of tiles) {
    assert.match(body, /^<svg class="(?:result-icon(?: emblem emblem-[\w-]+)?|brand [\w-]+)"[^]*?<\/svg><span class="result-body"><strong class="result-value"[^>]*>[^]*?<\/strong><span class="result-label">/, label + ' tile parts');
    assert.equal(body.endsWith('<span class="result-arrow" aria-hidden="true">→</span>') || body.endsWith('<span class="result-arrow" aria-hidden="true">↗</span>'), tag === 'a', label + ' tile arrow');
  }
}

function checkStructure(source) {
  for (const removed of ['masthead', 'register-row', 'register-tabs', 'filter-chips', 'tavola', 'sheet-frame', 'portfolio-cta', 'project-gallery', 'more-certificates']) {
    assert.ok(!new RegExp('class="[^"]*\\b' + removed + '\\b').test(source), 'Home must not render ' + removed);
  }
  const header = source.match(/<header class="site-header">[^]*?<\/header>/)?.[0];
  assert.ok(header, 'The header bar opens the home');
  assert.deepEqual(hrefs(header.match(/<nav class="site-nav"[^]*?<\/nav>/)[0]), ['#progetti', '#ricerca', '#chi-sono', '/uses/'], 'Header links: the three home sections, then /uses/');
  assert.ok(!header.includes('aria-current'), 'No header link is current on the home');
  assert.match(header, /<button class="menu-button" type="button" aria-expanded="false" aria-controls="site-nav"/, 'Phone menu button');
  assert.match(source, /<div class="hero-band">[^]*?<section class="hero" /, 'The hero sits in its own band');
  assert.match(source, /<a class="cta primary-cta" href="#progetti">/, 'The hero action opens the projects');
  assert.match(source, /<details class="about" id="chi-sono"[ >]/);
  assert.match(source, /<details class="work" id="progetti"[ >]/);
  assert.equal([...source.matchAll(/<details class="(?:about|work)"/g)].length, 2, 'two collapsed disclosures');
  assert.ok(!/<details class="(?:about|work)"[^>]*\bopen\b/.test(source), 'Both disclosures start collapsed');
  const tabs = [...source.matchAll(/<button id="tab-([\w-]+)" role="tab"/g)].map(match => match[1]);
  assert.deepEqual(tabs, ['software', 'modding', 'research', 'teaching']);
  assert.match(panel(source, 'research'), /<h3 class="panel-heading" id="ricerca">/, '#ricerca is the Research tab');
  assert.match(source, /<footer class="footer wrap"><p><a class="footer-home" href="\/">Maurizio Falconi <span aria-hidden="true">·<\/span> @falker47<\/a><\/p><\/footer>/, 'The signature links to the home');
}

// Software: the three counts are the toggles; each group lists its projects in data order.
function checkSoftware(source) {
  const markup = panel(source, 'software');
  checkTiles(markup, 'Software', 3);
  // V5: the first category is "App", for both the web apps and the Android app.
  const expected = [['app', 'app'], ['game', 'giochi'], ['tool', 'strumenti']].map(([id, word]) => ({ id, word, items: visible.filter(item => item.category === id) }));
  assert.deepEqual(toggles(markup), expected.map((group, index) => ({ colour: group.id, id: group.id, pressed: String(index === 0), label: `${group.items.length} ${group.word}` })),
    'Software tiles: counts from data, App selected, no "All"');
  // V5: each software toggle wears its category emblem, as the "Su di me" figures do.
  assert.deepEqual([...markup.match(/<div class="picker-bar"[^]*?<\/div>/)[0].matchAll(/<svg class="result-icon emblem emblem-([\w-]+)"/g)].map(match => match[1]),
    expected.map(group => group.id), 'Each tile has its emblem');
  const listed = groups(markup);
  assert.deepEqual(listed.map(group => group.id), expected.map(group => group.id));
  for (const [index, group] of listed.entries()) {
    assert.equal(group.colour, group.id, 'Category colour');
    const rendered = cards(group.body);
    assert.equal(rendered.length, expected[index].items.length, group.id + ' cards');
    for (const [position, card] of rendered.entries()) {
      const project = expected[index].items[position];
      // V5: a project with its own page says so on the cover: the title link carries a "Scheda"
      // label (part of its name) and spreads over the cover, so the cover opens the page too.
      const chip = ' <span class="cover-chip" data-i18n="projectPage">' + italianCopy.projectPage + '</span>';
      const title = card.match(/<h4>([^]*?)<\/h4>/)[1];
      assert.equal(text(title.replace(chip, '')), project.title, project.id + ' title');
      assert.equal(title, project.page ? `<a href="${project.page}">${project.title}${chip}</a>` : project.title.replace(/'/g, '&#39;'), project.id + ' page label');
      const image = tags(card).find(node => node.name === 'img');
      assert.equal(image.attrs.src, project.cover.src, project.id + ' cover');
      assert.equal(text(card.match(/<span class="pill">([^]*?)<\/span>(?=<span class="card-stack">)/)[1]), project.kind.it, project.id + ' kind');
      assert.equal(text(card.match(/<span class="card-stack">([^]*?)<\/span>/)[1]), project.stack.join(' · '), project.id + ' stack');
      assert.equal(text(card.match(/<p class="card-summary">([^]*?)<\/p>/)[1]), project.summary.it, project.id + ' summary');
      // The title opens the project's own page when there is one; the buttons follow the data order.
      // A published app shows no tester link on its card (V4); the project page keeps it.
      const shown = project.links.filter(link => link.type !== 'test' || !project.links.some(other => other.type === 'store'));
      const links = [...(project.page ? [project.page] : []), ...shown.map(link => link.url)];
      assert.deepEqual(hrefs(card), links, project.id + ' links');
      const names = [...card.match(/<p class="card-links">([^]*?)<\/p>/)[1].matchAll(/<a [^>]*>([^]*?)<span class="sr-only">/g)].map(match => text(match[1]));
      assert.deepEqual(names, shown.map(link => link.type === 'repo' ? (link.label.it === 'Repo GitHub' ? 'GitHub' : link.label.it)
        : link.type === 'store' ? 'Play Store' : link.type === 'test' ? 'Prova l’app' : 'Apri'), project.id + ' link names');
      checkButtons(card.match(/<p class="card-links">([^]*?)<\/p>/)[1], project.id);
    }
  }
  assert.ok(markup.includes('<span class="card-stack">Python · PySide6 · Qt Quick</span>'), 'Panacea is a PySide6 application');
  const notes = [...markup.matchAll(/<p class="sample-count picker-count" data-group="([\w-]+)" hidden>([^]*?)<\/p>/g)].map(match => [match[1], text(match[2])]);
  assert.deepEqual(notes, expected.map((group, index) => [group.id, `${['App', 'Giochi', 'Strumenti'][index]} · ${group.items.length} progetti · scorri per vederli tutti`]), 'One count line per category');
}

// Modding: every published mod, with its downloads, endorsements and bar.
function checkModding(source) {
  const markup = panel(source, 'modding');
  checkTiles(markup, 'Modding', 3);
  const expected = [['mod', 'mod'], ['translation', 'traduzioni italiane']].map(([id, word]) => ({ id, word, items: nexus.mods.filter(mod => mod.kind === id) }));
  assert.deepEqual(toggles(markup), expected.map((group, index) => ({ colour: group.id, id: group.id, pressed: String(index === 0), label: `${group.items.length} ${group.word}` })),
    'Modding tiles: "10 mod · 17 traduzioni italiane" from data');
  // The unique downloads lead the row as a tile of their own, with the Nexus mark, linked to the profile.
  assert.match(markup, new RegExp('<div class="results-row picker-head"><a class="result nexus-total" href="' + featured.profile + '"><svg class="brand brand-nexusmods"[^>]*><use href="#brand-nexusmods"/></svg><span class="result-body"><strong class="result-value" data-i18n="moddingNumber">'), 'The Nexus total leads the row');
  // Read the rendered markup only; the bundled Nexus client mentions the same attributes.
  assert.equal([...markup.matchAll(/data-nexus-stat=/g)].length, 0, 'No publication count or snapshot date (V4)');
  const downloads = [...markup.matchAll(/<strong\b[^>]*data-i18n="moddingNumber"[^>]*>([^<]+)</g)];
  assert.equal(downloads.length, 1, 'One live download total');
  assert.equal(downloads[0][1], italian(snapshot.uniqueModDownloads));
  const covers = new Map(featured.items.map(item => [item.url, item]));
  const max = Math.max(...nexus.mods.map(mod => mod.downloads));
  const listed = groups(markup);
  assert.deepEqual(listed.map(group => group.id), expected.map(group => group.id));
  for (const [index, group] of listed.entries()) {
    const rendered = cards(group.body);
    assert.equal(rendered.length, expected[index].items.length, group.id + ' cards');
    for (const [position, card] of rendered.entries()) {
      const mod = expected[index].items[position];
      assert.equal(text(card.match(/<h4>([^]*?)<\/h4>/)[1]), mod.name, mod.modId + ' name');
      assert.equal(hrefs(card)[0], mod.url, mod.name + ' Nexus link');
      const numbers = tags(card).filter(node => 'data-i18n-number' in node.attrs).map(node => Number(node.attrs['data-i18n-number']));
      assert.deepEqual(numbers, [mod.downloads, mod.endorsements], mod.name + ' counts');
      const width = Math.max(2, Math.round(Math.sqrt(mod.downloads / max) * 1000) / 10);
      assert.ok(card.includes('<span style="width:' + width + '%"></span>'), mod.name + ' bar');
      const image = tags(card).find(node => node.name === 'img');
      // V4: translations show their Nexus picture with an "IT" badge, like the mods; a typographic
      // cover only stands in for a mod that has no picture at all.
      const expectedSrc = covers.get(mod.url)?.cover.src ?? mod.image?.src;
      if (expectedSrc) assert.equal(image.attrs.src, expectedSrc, mod.name + ' picture');
      else assert.equal(text(card.match(/<div class="card-cover mod-type">([^]*?)<\/div>/)[1]), (mod.kind === 'translation' ? 'IT ' : 'MOD ') + mod.game, mod.name + ' typographic cover');
      assert.equal(card.includes('<b class="cover-badge">IT</b>'), mod.kind === 'translation' && Boolean(expectedSrc), mod.name + ' IT badge');
      const repo = covers.get(mod.url)?.repo;
      assert.deepEqual(hrefs(card).slice(1), repo ? [repo] : [], mod.name + ' repository');
      checkButtons(card.match(/<p class="card-links">([^]*?)<\/p>/)[1], mod.name);
    }
  }
}

function checkResearch(source) {
  const markup = panel(source, 'research');
  checkTiles(markup, 'Research', 1);
  // V5: the papers are project cards in a rail, like Software and Modding: the drawing as the cover,
  // the title, "Paper I" and the arXiv number in the card's meta line, the result as the summary.
  assert.match(markup, /<div class="rail rail-papers"><ul class="rail-track"><li class="card paper-card">/, 'The papers sit in a rail');
  assert.ok(!/paper-cards|paper-highlight|card-label|<article/.test(markup), 'No separate paper layout');
  const papers = [...markup.matchAll(/<li class="card paper-card">([^]*?)<\/li>/g)].map(match => match[1]);
  assert.equal(papers.length, research.papers.length);
  const repo = research.repositories.find(item => item.project === research.id).url;
  for (const [index, card] of papers.entries()) {
    const paper = research.papers[index];
    assert.match(card, /^<div class="card-cover paper-figure">/, 'Paper ' + paper.number + ' drawing as the cover');
    assert.equal(text(card.match(/<span class="pill">([^]*?)<\/span>(?=<span class="card-stack">)/)[1]), `Paper ${paper.number}`);
    assert.equal(text(card.match(/<span class="card-stack">([^]*?)<\/span>(?:<\/span>)?<\/p>/)[1]).split(' · ')[0], `arXiv ${paper.arxiv}`);
    assert.equal(text(card.match(/<h4>([^]*?)<\/h4>/)[1]), paper.heading.it);
    assert.equal(text(card.match(/<p class="card-summary">([^]*?)<\/p>/)[1]), paper.highlight.it);
    assert.deepEqual(hrefs(card), [paper.url, repo]);
    checkButtons(card.match(/<p class="card-links">([^]*?)<\/p>/)[1], 'Paper ' + paper.number);
  }
  assert.equal([...papers[0].matchAll(/<div class="rm-cell">/g)].length, ringmin.optima.length, 'One drawing per certified configuration');
  assert.equal([...papers[0].matchAll(/<circle class="rm-centre"/g)].length, ringmin.optima.length);
  assert.equal([...papers[0].matchAll(/<circle class="rm-(?:circle|floating)"/g)].length, ringmin.optima.reduce((sum, item) => sum + item.n, 0));
  assert.equal([...papers[0].matchAll(/<circle class="rm-floating"/g)].length, ringmin.optima.reduce((sum, item) => sum + item.floating_circles.length, 0));
  // Paper II: a 16:9 chart on true scales. R(n)/n² rises from the zero line on one scale, n runs
  // to the right on a 1/n scale ending at n = ∞, filled dots are certified and hollow ones not, and
  // the C* line sits on the same vertical scale, at least as thick as the certified interval.
  assert.match(papers[1], /<svg class="rm-chart" viewBox="0 0 272 153"/, 'Paper II is drawn at 16:9');
  const dots = [...papers[1].matchAll(/<circle class="rm-dot( rm-open)?" cx="([\d.]+)" cy="([\d.]+)" r="3"\/>/g)]
    .map(([, open, x, y]) => ({ open: Boolean(open), x: Number(x), y: Number(y) }));
  const points = dots;
  assert.equal(dots.length, ringmin.asymptotic.length, 'One dot per n');
  assert.equal([...papers[1].matchAll(/<circle class="rm-dot(?: rm-open)?" cx="[\d.]+" cy="[\d.]+" r="2.4"\/>/g)].length, 2, 'Two smaller dots in the legend');
  assert.deepEqual(points.map(item => item.open), ringmin.asymptotic.map(row => !row.certified), 'Filled dots are certified values, hollow ones non-exhaustive');
  const zero = Number(papers[1].match(/<line class="rm-axis" x1="[\d.]+" y1="([\d.]+)" x2="[\d.]+" y2="\1"\/>/)[1]);
  const scales = points.map((item, i) => (zero - item.y) / ringmin.asymptotic[i].ratio);
  assert.ok(Math.max(...scales) - Math.min(...scales) < .02 * scales[0], 'Each dot is R(n)/n² on one scale from zero');
  const first = ringmin.asymptotic[0].n, slope = (points[1].x - points[0].x) / (1 / first - 1 / ringmin.asymptotic[1].n);
  assert.ok(points.every((item, i) => Math.abs(item.x - points[0].x - slope * (1 / first - 1 / ringmin.asymptotic[i].n)) < .05), 'n runs on a 1/n scale');
  const line = papers[1].match(/<line class="rm-arc" x1="[\d.]+" y1="([\d.]+)" x2="[\d.]+" y2="\1" stroke-width="([\d.]+)"\/>/);
  assert.ok(line && Math.abs(zero - Number(line[1]) - scales[0] * (ringmin.constant.lower + ringmin.constant.upper) / 2) < .2, 'The C* line is on the same scale');
  assert.ok(Number(line[2]) >= scales[0] * (ringmin.constant.upper - ringmin.constant.lower) - .01, 'The C* line is as thick as the certified interval');
  const infinity = Number(papers[1].match(/<circle class="rm-limit" cx="([\d.]+)"/)[1]);
  assert.ok(Math.abs(infinity - points[0].x - slope / first) < .05, 'The limit dot sits at n = ∞ on the 1/n scale');
  assert.ok(points.every(item => item.y > Number(line[1])), 'Every dot stays under C*');
  assert.deepEqual([...papers[1].matchAll(/<text class="rm-label[^"]*"[^>]*>([^<]+)<\/text>/g)].map(match => decode(match[1])),
    ['0,05', '0,10', 'n = 3', '4', '6', '10', '18', '∞', '0', 'C*', 'R(n)/n²', italianCopy.ringminCertified, italianCopy.ringminBestFound], 'The labels of the chart');
  const it = value => new Intl.NumberFormat('it-IT', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value);
  const [low, high] = [Math.floor(ringmin.constant.lower * 1e4) / 1e4, Math.ceil(ringmin.constant.upper * 1e4) / 1e4];
  assert.equal(text(papers[1].match(/<span class="paper-bound">([^]*?)<\/span><\/span><\/p>/)[1]).replace(/\s+(?=[;\]])|(?<=\[)\s+/g, ''), `C* ∈ [${it(low)}; ${it(high)}]`, 'The C* interval from data/ringmin.json');
  const foot = markup.match(/<p class="research-foot">[^]*?<\/p>/)[0];
  assert.deepEqual(hrefs(foot), [research.repositories.find(item => item.project === 'power-ringmin').url, research.zenodo.url]);
  checkButtons(foot, 'Research foot');
  const tile = markup.match(/<a class="result" href="\/research\/">([^]*?)<\/a>/);
  assert.ok(tile, 'The paper count opens the research page');
  // V5: with the arXiv logomark, as the paper figure of "Su di me".
  assert.match(tile[1], /^<svg class="brand brand-arxivmark"/, 'The paper count shows the arXiv logomark');
  assert.equal(text(tile[1]).replace(/\s*→$/, ''), `${research.papers.length} articoli su arXiv`);
}

function checkLessons(source) {
  const ratings = [...panel(source, 'teaching').matchAll(/<a class="card feedback-result" href="([^"]+)">([^]*?)<\/a>/g)];
  assert.deepEqual(ratings.map(match => match[1]), tutoring.ratings.map(rating => rating.url));
  for (const [index, [, , markup]] of ratings.entries()) {
    const rating = tutoring.ratings[index];
    assert.ok(decode(markup.replace(/<[^>]+>/g, '')).includes(`${rating.score}/${rating.scale}`), rating.source + ' score');
    assert.ok(text(markup).includes(`${rating.ratings} valutazion`), rating.source + ' ratings');
  }
  const markup = panel(source, 'teaching');
  assert.ok(!markup.includes('card lesson-card') && !markup.includes('class="category-intro"'), 'The text replaces the separate lessons box');
  assert.equal(text(markup.match(/<h4 class="lessons-title">([^]*?)<\/h4>/)[1]), 'Lezioni di matematica e fisica');
  assert.match(text(markup.match(/<p class="lessons-body">([^]*?)<\/p>/)[1]), /^La passione per la scienza mi ha portato a volerla anche insegnare, e dal 2023 seguo studenti/);
  assert.match(markup, new RegExp('<a class="lessons-cta" href="' + tutoring.portal + '"><span data-i18n="lessonsCta">Scopri le lezioni</span><svg class="icon"[^>]*><use href="#icon-arrow-right"/>'), 'CTA');
  assert.equal(text(markup.match(/<p class="lessons-lead">([^]*?)<\/p>/)[1]), 'Vuoi sapere cosa ne pensano i miei studenti? Ecco i portali dove insegno.');
  const order = ['lessons-title', 'lessons-body', 'lessons-cta', 'lessons-lead', 'card feedback-result'].map(name => markup.indexOf('class="' + name));
  assert.deepEqual([...order].sort((a, b) => a - b), order, 'Text and action first, then the lead and the two portals');
}

function checkAbout(source) {
  const about = source.match(/<details class="about" id="chi-sono"[^]*?<\/details>/)[0];
  assert.ok(!/journey|jr-/.test(about), 'The "Percorso" drawing is gone');
  // The rows: each paragraph, then its figure. The figures are counted from the data and link
  // to their section; the first row is a drawing (studies have no number). V5: the rows are the
  // slides of a carousel, one per paragraph; the work paragraph is split in two (path, then work
  // and method), the second beside a drawing of a problem reduced to its model.
  assert.match(about, /<div class="about-carousel"><div class="about-rows"><div class="about-row">/, 'The rows are the slides of the carousel');
  // Each paragraph opens under the name of its chapter (a heading), the name its segment wears below.
  const chapters = ['chapterStudies', 'chapterPath', 'chapterWork', 'chapterMethod', 'chapterSpare'];
  const rows = [...about.matchAll(/<div class="about-row"><div class="about-text"><h3 class="about-chapter-title"><span data-i18n="(\w+)">([^<]*)<\/span><\/h3><p data-i18n="(\w+)">([^<]*)<\/p><\/div><figure class="about-figure figure-(\w+)"/g)]
    .map(([, chapter, name, key, value, figure]) => [chapter, decode(name), key, decode(value), figure]);
  assert.deepEqual(rows, [['aboutStudies', 'studies'], ['aboutWork', 'work'], ['aboutMethod', 'method'], ['aboutApproach', 'approach'], ['aboutSpare', 'spare']]
    .map(([key, figure], index) => [chapters[index], italianCopy[chapters[index]], key, italianCopy[key], figure]), 'About rows in order');
  const method = about.match(/<figure class="about-figure figure-method" aria-hidden="true"><svg class="studies-drawing"[^>]*>([^]*?)<\/svg><\/figure>/);
  assert.ok(method, 'The method drawing is decorative, in the pendulum language');
  assert.deepEqual([...method[1].matchAll(/data-i18n="(\w+)">([^<]+)</g)].map(match => [match[1], match[2]]), [['figureProblem', italianCopy.figureProblem], ['figureModel', italianCopy.figureModel]], 'Method labels');
  assert.match(method[1], /<text class="studies-eq"[^>]*>y = a x \+ b<\/text>/, 'The model is a straight line');
  assert.equal([...method[1].matchAll(/<circle class="st-pt(?: quiet)?" cx="\d+" cy="\d+" r="2.2"\/>/g)].length, 16, 'The same eight points on both panels');
  // The carousel controls wait for the script: without it the five rows stay in a column.
  const nav = about.match(/<div class="about-nav" hidden>([^]*?<\/button>)<\/div><\/div>/);
  assert.ok(nav, 'The carousel controls are hidden until the script runs');
  const controls = [...nav[1].matchAll(/<button type="button" class="about-step" data-step="(-?1)">([^]*?)<\/button>/g)].map(([, step, body]) => [step, text(body), /#icon-(chevron-\w+)/.exec(body)?.[1]]);
  assert.deepEqual(controls, [['-1', italianCopy.aboutPrevious, 'chevron-left'], ['1', italianCopy.aboutNext + ' ' + italianCopy.myProjects, 'chevron-right']], '"Indietro" and "Avanti" with their chevrons');
  // On the last paragraph "Avanti" becomes "I miei progetti": both labels are in the button, the second hidden.
  assert.match(nav[1], /<span class="about-step-next"><span data-i18n="aboutNext">[^<]+<\/span><\/span><span class="about-step-end" hidden><span data-i18n="myProjects">[^<]+<\/span><\/span>/, '"Avanti" and its last label');
  // The chapters, one named button per paragraph, the first filled and current; the counter is announced on a step.
  const chapterBar = nav[1].match(/^<div class="about-progress" role="group" aria-label="([^"]+)" data-label="aboutChapters">((?:<button type="button" class="about-chapter(?: on)?"(?: aria-current="step")?><span data-i18n="\w+">[^<]+<\/span><\/button>)+)<\/div>/);
  assert.ok(chapterBar && decode(chapterBar[1]) === italianCopy.aboutChapters, 'One segment per paragraph');
  assert.deepEqual([...chapterBar[2].matchAll(/<button type="button" class="about-chapter( on)?"( aria-current="step")?><span data-i18n="(\w+)">/g)].map(([, on, current, key]) => [Boolean(on), Boolean(current), key]),
    chapters.map((key, index) => [!index, !index, key]), 'One segment per paragraph, named after its chapter');
  assert.equal(text(nav[1].match(/<p class="about-count" aria-live="polite">([^]*?)<\/p>/)[1]), '1 / 5', 'Slide counter');
  assert.ok(!about.includes('class="philosophy"') && !('philosophy' in italianCopy), 'The closing quote is gone (V5)');
  assert.ok(!/about-facts|facts-grid/.test(about), 'The "In breve" card is gone');
  const facts = [...about.matchAll(/<li><a class="fact fact-([\w-]+)" href="([^"]+)"><span class="fact-glyph" aria-hidden="true">([^]*?)<\/span><strong class="fact-value"[^>]*>((?:<span[^>]*>[^<]*<\/span>)(?:<span class="sr-only"> <span data-i18n="\w+">[^<]*<\/span><\/span>)?|[^<]+)<\/strong><span class="fact-label">(<span[^>]*>[^<]*<\/span>)<\/span><\/a><\/li>/g)]
    .map(([, tone, href, glyph, number, name]) => [href, text(number), text(name), tone, /href="#((?:icon|brand)-[\w-]+)"/.exec(glyph)?.[1] ?? /^<svg class="emblem (emblem-\w+)" viewBox="0 0 24 24" aria-hidden="true" focusable="false">/.exec(glyph)?.[1] ?? null]);
  const rating = aggregateRating(tutoring.ratings);
  // V5: the public GitHub repositories (the count GitHub shows, in data/profile.json) beside the Nexus
  // total, then the three software categories, each with its emblem in its colour. Then the papers
  // before the rating. Each glyph is a badge like the Nexus emblem.
  assert.ok(Number.isInteger(identity.githubRepositories.count) && identity.githubRepositories.count > 0, 'GitHub repository count');
  assert.deepEqual(facts, [
    [identity.links.github, italian(identity.githubRepositories.count), 'repository su GitHub', 'github', 'brand-github'],
    ['#panel-modding', italian(snapshot.uniqueModDownloads), 'download unici', 'modding', 'brand-nexusmods'],
    ...[['app', 'app'], ['tool', 'strumenti'], ['game', 'giochi']].map(([id, word]) => ['#progetti', italian(visible.filter(item => item.category === id).length), word, id, 'emblem-' + id]),
    ['#ricerca', italian(research.papers.length), 'articoli su arXiv', 'research', 'brand-arxivmark'],
    // The score says it is out of five for screen readers (the star is decorative).
    ['#panel-teaching', formatScore(rating.score, 'it') + ' ' + italianCopy.ratingOutOf, italianCopy[rating.count === 1 ? 'ratingReviewsOne' : 'ratingReviewsOther'].replace('{count}', rating.count), 'tutoring', 'icon-star'],
  ], 'Facts from data');
  // The certificate fan is the figure of the work paragraph.
  assert.match(about, /<figure class="about-figure figure-work"><section class="credentials" id="certificazioni"/, 'The certificate fan sits beside the work paragraph');
  // Under the tutoring figures, a card of the students' reviews from the data, quoted in Italian: the
  // portal with five stars, each excerpt signed with the student's name, month and year in the
  // reader's language, one bar segment each.
  const strip = about.match(/<div class="reviews" role="group" aria-label="([^"]+)" data-label="reviewsLabel"><p class="reviews-head"><img src="\/assets\/images\/letuelezioni\.png"[^>]*>([^<]+)<span class="reviews-stars" aria-hidden="true">((?:<svg class="icon"[^>]*><use href="#icon-star"\/><\/svg>){5})<\/span><\/p><ul class="reviews-track" tabindex="0">([^]*?)<\/ul><span class="reviews-bar" aria-hidden="true">([^]*?)<\/span><\/div>/);
  assert.ok(strip && decode(strip[1]) === italianCopy.reviewsLabel && strip[2] === tutoring.reviews[0].source, 'The reviews card follows the tutoring figures');
  const monthYear = (date, lang) => new Intl.DateTimeFormat(lang, { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(date + '-15'));
  // The build moves the English month into the page catalogue (data-text-key).
  const english = JSON.parse(source.match(/<script type="application\/json" id="catalogue-en">([^]*?)<\/script>/)[1]);
  assert.deepEqual([...strip[4].matchAll(/<li class="review"><blockquote lang="it"><p>([^<]+)<\/p><\/blockquote><p class="review-by"><strong>([^<]+)<\/strong> · <span data-text-key="(\d+)">([^<]+)<\/span><\/p><\/li>/g)]
    .map(([, quote, name, key, when]) => [decode(quote), decode(name), decode(when), english[key] ?? english.text?.[key] ?? null]),
    tutoring.reviews.map(review => [review.text, review.name, monthYear(review.date, 'it'), monthYear(review.date, 'en')]), 'Reviews from data');
  assert.equal(strip[5], '<i class="on"></i>' + '<i></i>'.repeat(tutoring.reviews.length - 1), 'One bar segment per review');
  const order = ['data-i18n="aboutStudies"', 'figure-studies', 'data-i18n="aboutWork"', 'class="credentials"', 'data-i18n="aboutMethod"', 'figure-method', 'data-i18n="aboutApproach"', 'fact-github', 'fact-modding', 'fact-app', 'fact-tool', 'fact-game',
    'data-i18n="aboutSpare"', 'fact-research', 'fact-tutoring', 'class="reviews"', 'class="about-nav"', 'class="research-links about-actions"'].map(part => about.indexOf(part));
  assert.ok(order.every(index => index >= 0) && order.every((index, i) => !i || index > order[i - 1]), 'About order: each figure after its paragraph, then the controls and links');
  // The profile row keeps its arrow on every link. V5: each shows the mark of the place it opens:
  // LinkedIn, GitHub, OEIS and ORCID their own, the lessons the Letuelezioni logo, the research the
  // circles of Ringmin.
  const profile = about.match(/<nav class="research-links about-actions"[^]*?<\/nav>/)[0];
  const profileLinks = buttons(profile.replace(/<a href="([^"]+)" class="about-action about-action-profile"/g, '<a href="$1"'));
  for (const button of profileLinks) {
    assert.equal(button.brand, expectedBrand(button.href), 'About link ' + button.href);
    assert.equal(button.mark, expectedBrand(button.href), 'About link mark ' + button.href);
  }
  assert.deepEqual(profileLinks.map(button => button.mark).filter(Boolean), ['linkedin', 'github', 'oeis', 'orcid'], 'Profile marks');
  assert.match(profile, /<a href="\/research\/" class="about-action about-action-profile"><svg class="about-action-icon"[^>]*><use href="#icon-ringmin"\/><\/svg>/, 'The research link shows the Ringmin circles');
  assert.match(profile, /<a href="https:\/\/www\.letuelezioni\.it\/[^"]+" class="about-action about-action-profile"><img class="about-action-icon" src="\/assets\/images\/letuelezioni\.png" width="18" height="18" alt="" loading="lazy">/, 'The lessons link shows the Letuelezioni logo');
  const deck = tags(about).filter(node => node.name === 'button' && node.attrs.class === 'deck-card');
  assert.equal(deck.length, certificates.length, 'One card per certificate');
  for (const [index, card] of deck.entries()) {
    const certificate = certificates[index];
    assert.equal(card.attrs['aria-label'], `${certificate.title}, ${certificate.issuer}, ${certificate.year}`);
    assert.equal(card.attrs['data-full'], certificate.full.src);
    assert.equal(card.attrs['data-viewer'], 'home-certificate');
    // Cards render 150 CSS px wide: 300w for most screens, 480w for dense ones.
    const image = tags(about).filter(node => node.name === 'img' && node.attrs.src === certificate.thumbnail.src);
    assert.equal(image.length, 1, certificate.id + ' thumbnail');
    assert.equal(image[0].attrs.srcset, certificate.thumbnail.variants.map(variant => variant.src + ' ' + variant.width + 'w').join(', '));
    assert.deepEqual(certificate.thumbnail.variants.map(variant => variant.width), [300, 480], certificate.id + ' widths');
    assert.equal(image[0].attrs.sizes, '150px');
  }
  assert.ok(text(about.match(/<div class="deck-default">[^]*?<\/div>/)[0]).endsWith(`${certificates.length} certificazioni`));
  assert.equal(tags(source).filter(node => node.name === 'dialog' && node.attrs.id === 'home-certificate').length, 1);
  assert.match(about, /<section class="credentials" id="certificazioni"/);
}

function checkLinks(source) {
  const links = hrefs(source);
  assert.deepEqual(links.filter(href => href.includes('/Nexus-portfolio/')), [], 'Home links reach the new pages');
  assert.ok(links.includes('/projects/social-viewer/'), 'Social Viewer opens its page');
  assert.ok(links.includes('/research/'), 'Research opens its page');
  for (const href of links.filter(href => /^\/(?!\/)/.test(href) && !href.startsWith('/assets/'))) {
    assert.ok(pages.has(new URL(href, 'https://x.invalid').pathname), 'Unknown internal page link ' + href);
  }
}

export function validateHomeCatalogue(source) {
  checkStructure(source);
  checkSoftware(source);
  checkModding(source);
  checkResearch(source);
  checkLessons(source);
  checkAbout(source);
  checkLinks(source);
}
