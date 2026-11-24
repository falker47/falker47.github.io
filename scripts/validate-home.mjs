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

function checkStructure(source) {
  for (const removed of ['masthead', 'register-row', 'register-tabs', 'filter-chips', 'tavola', 'sheet-frame', 'portfolio-cta', 'project-gallery', 'more-certificates']) {
    assert.ok(!new RegExp('class="[^"]*\\b' + removed + '\\b').test(source), 'Home must not render ' + removed);
  }
  const header = source.match(/<header class="site-header">[^]*?<\/header>/)?.[0];
  assert.ok(header, 'The header bar opens the home');
  assert.deepEqual(hrefs(header.match(/<nav class="site-nav"[^]*?<\/nav>/)[0]), ['#progetti', '#ricerca', '#chi-sono'], 'Header links stay on the page');
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
  assert.match(source, /<footer class="footer wrap"><p>Maurizio Falconi <span aria-hidden="true">·<\/span> @falker47<\/p><\/footer>/);
}

// Software: the three counts are the toggles; each group lists its projects in data order.
function checkSoftware(source) {
  const markup = panel(source, 'software');
  const expected = [['app', 'app'], ['game', 'giochi'], ['tool', 'strumenti']].map(([id, word]) => ({ id, word, items: visible.filter(item => item.category === id) }));
  assert.deepEqual(toggles(markup), expected.map((group, index) => ({ colour: group.id, id: group.id, pressed: String(index === 0), label: `${group.items.length} ${group.word}` })),
    'Software toggles: counts from data, App selected, no "All"');
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
      assert.equal(text(card.match(/<p class="pill">([^]*?)<\/p>/)[1]), project.kind.it, project.id + ' kind');
      assert.equal(text(card.match(/<p class="card-stack">([^]*?)<\/p>/)[1]), project.stack.join(' · '), project.id + ' stack');
      assert.equal(text(card.match(/<p class="card-summary">([^]*?)<\/p>/)[1]), project.summary.it, project.id + ' summary');
      const links = [];
      if (project.page) links.push(project.page);
      for (const type of ['demo', 'store', 'test', 'repo']) {
        const entry = project.links.find(link => link.type === type);
        if (entry) links.push(entry.url);
      }
      assert.deepEqual(hrefs(card), links, project.id + ' links');
    }
  }
  assert.ok(markup.includes('<p class="card-stack">Python · PySide6 · Qt Quick</p>'), 'Panacea is a PySide6 application');
}

// Modding: every published mod, with its downloads, endorsements and bar.
function checkModding(source) {
  const markup = panel(source, 'modding');
  const expected = [['mod', 'mod'], ['translation', 'traduzioni italiane']].map(([id, word]) => ({ id, word, items: nexus.mods.filter(mod => mod.kind === id) }));
  assert.deepEqual(toggles(markup), expected.map((group, index) => ({ colour: group.id, id: group.id, pressed: String(index === 0), label: `${group.items.length} ${group.word}` })));
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
  }
  assert.equal([...papers[0].matchAll(/<div class="rm-cell">/g)].length, ringmin.optima.length, 'One drawing per certified configuration');
  assert.equal([...papers[0].matchAll(/<circle class="rm-centre"/g)].length, ringmin.optima.length);
  assert.equal([...papers[0].matchAll(/<circle class="rm-(?:circle|floating)"/g)].length, ringmin.optima.reduce((sum, item) => sum + item.n, 0));
  assert.equal([...papers[0].matchAll(/<circle class="rm-floating"/g)].length, ringmin.optima.reduce((sum, item) => sum + item.floating_circles.length, 0));
  assert.equal([...papers[1].matchAll(/<circle class="rm-dot"/g)].length, ringmin.asymptotic.filter(row => row.certified).length, 'Filled dots are certified values');
  assert.equal([...papers[1].matchAll(/<circle class="rm-dot rm-open"/g)].length, ringmin.asymptotic.filter(row => !row.certified).length, 'Hollow dots are non-exhaustive');
  assert.match(papers[1], /<text class="rm-limit-label"[^>]*data-i18n="ringminLimit">1\/8 · C\* sta sopra questa linea ↑<\/text>/);
  const foot = markup.match(/<p class="research-foot">[^]*?<\/p>/)[0];
  assert.deepEqual(hrefs(foot), ['/research/', research.repositories.find(item => item.project === 'power-ringmin').url, research.zenodo.url]);
}

function checkLessons(source) {
  const ratings = [...panel(source, 'teaching').matchAll(/<a class="card feedback-result" href="([^"]+)">([^]*?)<\/a>/g)];
  assert.deepEqual(ratings.map(match => match[1]), tutoring.ratings.map(rating => rating.url));
  for (const [index, [, , markup]] of ratings.entries()) {
    const rating = tutoring.ratings[index];
    assert.ok(decode(markup.replace(/<[^>]+>/g, '')).includes(`${rating.score}/${rating.scale}`), rating.source + ' score');
    assert.ok(text(markup).includes(`${rating.ratings} valutazion`), rating.source + ' ratings');
  }
  assert.ok(hrefs(panel(source, 'teaching')).includes(tutoring.portal), 'Tutoring portal');
}

function checkAbout(source) {
  const about = source.match(/<details class="about" id="chi-sono"[^]*?<\/details>/)[0];
  for (const variant of ['journey-wide', 'journey-tall']) {
    const drawing = about.match(new RegExp('<svg class="' + variant + '"[^]*?</svg>'))?.[0];
    assert.ok(drawing, 'Missing ' + variant);
    assert.equal([...drawing.matchAll(/<g class="jr-node(?: jr-current)?"/g)].length, 4, variant + ' nodes');
    assert.equal([...drawing.matchAll(/<g class="jr-node jr-current"/g)].length, 1, variant + ' highlights today');
    assert.equal([...drawing.matchAll(/<path class="jr-pulse"/g)].length, 1, variant + ' pulse');
    assert.deepEqual([...drawing.matchAll(/<text class="jr-title"[^>]*>([^<]+)</g)].map(match => decode(match[1])), ['FISICA', 'CREDITO', 'DATI', 'AI & INNOVAZIONE']);
  }
  assert.ok(about.indexOf('class="about-journey"') > about.indexOf('data-i18n="aboutResearch"') && about.indexOf('class="about-journey"') < about.indexOf('class="philosophy"'),
    'The journey sits between the text and the philosophy line');
  const deck = tags(about).filter(node => node.name === 'button' && node.attrs.class === 'deck-card');
  assert.equal(deck.length, certificates.length, 'One card per certificate');
  for (const [index, card] of deck.entries()) {
    const certificate = certificates[index];
    assert.equal(card.attrs['aria-label'], `${certificate.title}, ${certificate.issuer}, ${certificate.year}`);
    assert.equal(card.attrs['data-full'], certificate.full.src);
    assert.equal(card.attrs['data-viewer'], 'home-certificate');
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
