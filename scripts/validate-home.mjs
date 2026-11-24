import assert from 'node:assert/strict';
import projects from '../data/projects.json' with { type: 'json' };
import featured from '../data/mods.json' with { type: 'json' };
import nexus from '../data/nexus-mods.json' with { type: 'json' };
import research from '../data/research.json' with { type: 'json' };
import ringmin from '../data/ringmin.json' with { type: 'json' };
import tutoring from '../data/tutoring.json' with { type: 'json' };
import certificates from '../data/certifications.json' with { type: 'json' };
import snapshot from '../data/nexus-downloads.json' with { type: 'json' };
import { decode, tags } from './qa/site.mjs';
import { routes } from '../src/routes.mjs';

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
const toggles = markup => [...markup.matchAll(/<button type="button" class="picker-toggle cat-([\w-]+)" data-group="([\w-]+)" aria-pressed="(true|false)">([^]*?)<\/button>/g)]
  .map(([, colour, id, pressed, body]) => ({ colour, id, pressed, label: text(body) }));
// Each card button: its destination, its platform mark (V4) or the arrow icon it keeps.
const buttons = markup => [...markup.matchAll(/<a href="([^"]+)"([^>]*)>([^]*?)<\/a>/g)]
  .map(([, href, attrs, body]) => ({ href, brand: /data-brand="([\w-]+)"/.exec(attrs)?.[1] ?? null,
    mark: /href="#brand-([\w-]+)"/.exec(body)?.[1] ?? null, arrow: /href="#icon-(arrow-[\w-]+)"/.exec(body)?.[1] ?? null }));
const expectedBrand = href => {
  const host = /^https:\/\/([^/]+)/.exec(href)?.[1] ?? '';
  return [['github.com', 'github'], ['play.google.com', 'googleplay'], ['nexusmods.com', 'nexusmods'], ['arxiv.org', 'arxiv'],
    ['zenodo.org', 'zenodo'], ['orcid.org', 'orcid'], ['oeis.org', 'oeis']].find(([name]) => host === name || host.endsWith('.' + name))?.[1] ?? null;
};
function checkButtons(markup, label) {
  for (const button of buttons(markup)) {
    const brand = expectedBrand(button.href);
    assert.equal(button.brand, brand, label + ': ' + button.href + ' brand');
    assert.equal(button.mark, brand, label + ': ' + button.href + ' mark');
    assert.equal(button.arrow, brand ? null : /^[/#.]/.test(button.href) ? 'arrow-right' : 'arrow-ne', label + ': ' + button.href + ' arrow');
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
  const expected = [['app', 'App'], ['game', 'Giochi'], ['tool', 'Strumenti']].map(([id, word]) => ({ id, word, items: visible.filter(item => item.category === id) }));
  assert.deepEqual(toggles(markup), expected.map((group, index) => ({ colour: group.id, id: group.id, pressed: String(index === 0), label: `${group.word} ${group.items.length}` })),
    'Software pills: "App 4 · Giochi 5 · Strumenti 5" from data, App selected, no "All"');
  assert.ok(!/class="result-icon"/.test(markup.match(/<div class="picker-bar"[^]*?<\/div>/)[0]), 'The pills are text only');
  const listed = groups(markup);
  assert.deepEqual(listed.map(group => group.id), expected.map(group => group.id));
  for (const [index, group] of listed.entries()) {
    assert.equal(group.colour, group.id, 'Category colour');
    const rendered = cards(group.body);
    assert.equal(rendered.length, expected[index].items.length, group.id + ' cards');
    for (const [position, card] of rendered.entries()) {
      const project = expected[index].items[position];
      assert.equal(text(card.match(/<h4>([^]*?)<\/h4>/)[1]), project.title, project.id + ' title');
      const image = tags(card).find(node => node.name === 'img');
      assert.equal(image.attrs.src, project.cover.src, project.id + ' cover');
      assert.equal(text(card.match(/<span class="pill">([^]*?)<\/span>(?=<span class="card-stack">)/)[1]), project.kind.it, project.id + ' kind');
      assert.equal(text(card.match(/<span class="card-stack">([^]*?)<\/span>/)[1]), project.stack.join(' · '), project.id + ' stack');
      assert.equal(text(card.match(/<p class="card-summary">([^]*?)<\/p>/)[1]), project.summary.it, project.id + ' summary');
      // The title opens the project's own page when there is one; the buttons follow the data order.
      const links = [...(project.page ? [project.page] : []), ...project.links.map(link => link.url)];
      assert.deepEqual(hrefs(card), links, project.id + ' links');
      const names = [...card.match(/<p class="card-links">([^]*?)<\/p>/)[1].matchAll(/<a [^>]*>([^]*?)<span class="sr-only">/g)].map(match => text(match[1]));
      assert.deepEqual(names, project.links.map(link => link.type === 'repo' ? (link.label.it === 'Repo GitHub' ? 'GitHub' : link.label.it)
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
  const expected = [['mod', 'Mod'], ['translation', 'Traduzioni']].map(([id, word]) => ({ id, word, items: nexus.mods.filter(mod => mod.kind === id) }));
  assert.deepEqual(toggles(markup), expected.map((group, index) => ({ colour: group.id, id: group.id, pressed: String(index === 0), label: `${group.word} ${group.items.length}` })),
    'Modding pills: "Mod 10 · Traduzioni 17" from data');
  assert.match(markup, /<p class="sample-count"><a href="[^"]+"><svg class="brand brand-nexusmods"[^>]*><use href="#brand-nexusmods"\/><\/svg><strong data-i18n="moddingNumber">/, 'The Nexus mark opens the download summary');
  // Read the rendered markup only; the bundled Nexus client mentions the same attributes.
  const counts = [...markup.matchAll(/<strong\b[^>]*data-nexus-stat="modCount"[^>]*>([^<]+)</g)];
  assert.equal(counts.length, 1, 'One live mod count');
  assert.equal(counts[0][1], italian(snapshot.modCount));
  const downloads = [...markup.matchAll(/<strong\b[^>]*data-i18n="moddingNumber"[^>]*>([^<]+)</g)];
  assert.equal(downloads.length, 1, 'One live download total');
  assert.equal(downloads[0][1], italian(snapshot.uniqueModDownloads));
  assert.match(markup, new RegExp('<time data-nexus-stat="checkedOn" datetime="' + snapshot.checkedOn + '">'), 'Snapshot date');
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
      if (mod.kind === 'translation') {
        assert.equal(image, undefined, mod.name + ': a translation has no picture');
        assert.equal(text(card.match(/<div class="mod-type">([^]*?)<\/div>/)[1]), 'IT ' + mod.game, mod.name + ' typographic header');
      } else {
        assert.equal(image.attrs.src, covers.get(mod.url)?.cover.src ?? mod.image.src, mod.name + ' picture');
      }
      const repo = covers.get(mod.url)?.repo;
      assert.deepEqual(hrefs(card).slice(1), repo ? [repo] : [], mod.name + ' repository');
      checkButtons(card.match(/<p class="card-links">([^]*?)<\/p>/)[1], mod.name);
    }
  }
}

function checkResearch(source) {
  const markup = panel(source, 'research');
  const papers = [...markup.matchAll(/<article class="card paper-card"[^>]*>([^]*?)<\/article>/g)].map(match => match[1]);
  assert.equal(papers.length, research.papers.length);
  const repo = research.repositories.find(item => item.project === research.id).url;
  for (const [index, card] of papers.entries()) {
    const paper = research.papers[index];
    assert.equal(text(card.match(/<p class="card-label">([^]*?)<\/p>/)[1]), `Paper ${paper.number} · arXiv ${paper.arxiv}`);
    assert.equal(text(card.match(/<h4 [^>]*>([^]*?)<\/h4>/)[1]), paper.heading.it);
    assert.equal(text(card.match(/<p class="paper-highlight">([^]*?)<\/p>/)[1]), paper.highlight.it);
    assert.equal(text(card.match(/<p class="card-summary">([^]*?)<\/p>/)[1]), paper.line.it);
    assert.deepEqual(hrefs(card), [paper.url, repo]);
    checkButtons(card.match(/<p class="card-links">([^]*?)<\/p>/)[1], 'Paper ' + paper.number);
  }
  assert.equal([...papers[0].matchAll(/<div class="rm-cell">/g)].length, ringmin.optima.length, 'One drawing per certified configuration');
  assert.equal([...papers[0].matchAll(/<circle class="rm-centre"/g)].length, ringmin.optima.length);
  assert.equal([...papers[0].matchAll(/<circle class="rm-(?:circle|floating)"/g)].length, ringmin.optima.reduce((sum, item) => sum + item.n, 0));
  assert.equal([...papers[0].matchAll(/<circle class="rm-floating"/g)].length, ringmin.optima.reduce((sum, item) => sum + item.floating_circles.length, 0));
  assert.equal([...papers[1].matchAll(/<circle class="rm-dot"/g)].length, ringmin.asymptotic.filter(row => row.certified).length, 'Filled dots are certified values');
  assert.equal([...papers[1].matchAll(/<circle class="rm-dot rm-open"/g)].length, ringmin.asymptotic.filter(row => !row.certified).length, 'Hollow dots are non-exhaustive');
  assert.match(papers[1], /<text class="rm-limit-label"[^>]*data-i18n="ringminLimit">1\/8 · limite inferiore<\/text>/);
  // Paper II is drawn against 1/n: n = ∞ at the origin, where the certified interval for C* is a band.
  const ticks = [...papers[1].matchAll(/<text class="rm-tick" x="([\d.]+)" y="[\d.]+" text-anchor="middle">([^<]+)<\/text>/g)].map(match => [Number(match[1]), decode(match[2])]);
  assert.deepEqual(ticks.map(tick => tick[1]), ['n = ∞', '18', '10', '6', '4', '3'], 'Axis labels at 1/n');
  const [origin, third] = [ticks[0][0], ticks.at(-1)[0]];
  for (const [x, value] of ticks.slice(1)) assert.ok(Math.abs(x - (origin + (third - origin) * 3 / Number(value))) < .2, 'Tick ' + value + ' sits at 1/n');
  assert.match(papers[1], />1\/n<\/text>/, 'Axis title 1/n');
  assert.equal([...papers[1].matchAll(/<rect class="rm-band"/g)].length, 1, 'One band for C*');
  const it = value => new Intl.NumberFormat('it-IT', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value);
  const [low, high] = [Math.floor(ringmin.constant.lower * 1e4) / 1e4, Math.ceil(ringmin.constant.upper * 1e4) / 1e4];
  assert.equal(decode(papers[1].match(/<text class="rm-band-label"[^>]*>([^]*?)<\/text>/)[1].replace(/<[^>]+>/g, '')), `C* ∈ [${it(low)}; ${it(high)}]`, 'Band label from data/ringmin.json');
  const line = papers[1].match(/<path class="rm-limit" d="M[\d.]+ ([\d.]+)H/)[1];
  const band = papers[1].match(/<rect class="rm-band" x="[\d.]+" y="([\d.]+)"/)[1];
  assert.ok(Number(band) < Number(line), 'The C* band sits above the 1/8 line');
  const foot = markup.match(/<p class="research-foot">[^]*?<\/p>/)[0];
  assert.deepEqual(hrefs(foot), [research.repositories.find(item => item.project === 'power-ringmin').url, research.zenodo.url]);
  checkButtons(foot, 'Research foot');
  const tile = markup.match(/<a class="result" href="\/research\/">([^]*?)<\/a>/);
  assert.ok(tile, 'The paper count opens the research page');
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
  assert.match(text(markup.match(/<p class="lessons-body">([^]*?)<\/p>/)[1]), /^Sono laureato in fisica e dal 2023 seguo studenti/);
  assert.match(markup, new RegExp('<a class="lessons-cta" href="' + tutoring.portal + '"><span data-i18n="lessonsCta">Scopri le lezioni</span><svg class="icon"[^>]*><use href="#icon-arrow-right"/>'), 'CTA');
  assert.equal(text(markup.match(/<p class="lessons-lead">([^]*?)<\/p>/)[1]), 'Vuoi sapere cosa ne pensano i miei studenti? Ecco i portali dove insegno.');
  const order = ['lessons-title', 'lessons-body', 'lessons-cta', 'lessons-lead', 'card feedback-result'].map(name => markup.indexOf('class="' + name));
  assert.deepEqual([...order].sort((a, b) => a - b), order, 'Text and action first, then the lead and the two portals');
}

function checkAbout(source) {
  const about = source.match(/<details class="about" id="chi-sono"[^]*?<\/details>/)[0];
  assert.ok(!/journey|jr-/.test(about), 'The "Percorso" drawing is gone');
  // The facts card: four figures counted from the data, each a link to its section.
  const facts = [...about.matchAll(/<li><a class="fact" href="([^"]+)"><strong class="fact-value"[^>]*>([^<]+)<\/strong><span class="fact-label">([^]*?)<\/span><\/a><\/li>/g)]
    .map(([, href, value, name]) => [href, value, text(name)]);
  assert.deepEqual(facts, [
    ['#progetti', italian(visible.filter(item => ['app', 'game', 'tool'].includes(item.category)).length), 'progetti software'],
    ['#panel-modding', italian(snapshot.uniqueModDownloads), 'download unici su Nexus Mods'],
    ['#ricerca', italian(research.papers.length), 'articoli su arXiv'],
    ['#certificazioni', italian(certificates.length), 'certificazioni'],
  ], 'Facts from data');
  const order = ['data-i18n="aboutWork"', 'data-i18n="aboutResearch"', 'class="about-facts"', 'class="philosophy"', 'class="research-links about-actions"', 'class="credentials"'].map(part => about.indexOf(part));
  assert.ok(order.every(index => index >= 0) && order.every((index, i) => !i || index > order[i - 1]), 'Text, facts, quote, links, certificates');
  // The profile row keeps its arrow on every link; GitHub, OEIS and ORCID show their marks.
  for (const button of buttons(about.match(/<nav class="research-links about-actions"[^]*?<\/nav>/)[0].replace(/<a href="([^"]+)" class="about-action about-action-profile"/g, '<a href="$1"'))) {
    assert.equal(button.brand, expectedBrand(button.href), 'About link ' + button.href);
    assert.equal(button.mark, expectedBrand(button.href), 'About link mark ' + button.href);
  }
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
