import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import research from '../data/research.json' with { type: 'json' };
import projects from '../data/projects.json' with { type: 'json' };
import { origin, routes } from '../src/routes.mjs';
import { tags } from './qa/site.mjs';

function pageAt(path) {
  const route = routes.find(item => item.path === path);
  assert.ok(route, path);
  const source = readFileSync(new URL('../_site' + path + 'index.html', import.meta.url), 'utf8');
  const elements = tags(source);
  const graph = JSON.parse(elements.find(el => el.attrs.type === 'application/ld+json').body)['@graph'];
  return { source, elements, graph };
}

test('detail pages publish a priority picture, a canonical author and working return links', () => {
  for (const path of ['/research/', '/projects/prof-gecko/', '/projects/camaleonte/', '/uses/']) {
    const { source, elements, graph } = pageAt(path);
    const images = elements.filter(el => el.name === 'img' && el.attrs.fetchpriority === 'high');
    assert.equal(images.length, 1, path);
    assert.equal(images[0].attrs.loading, 'eager');
    assert.match(source, /<picture><source [^>]+srcset="[^"]+"[^>]*><img [^>]+fetchpriority="high">/);
    const person = graph.find(item => item['@type'] === 'Person');
    assert.equal(person['@id'], origin + '/#person');
    assert.equal(person.jobTitle, 'AI Engineer');
    assert.equal(graph.find(item => item.url === origin + path).author['@id'], person['@id']);
    // "← I miei progetti" for project pages, "← Home" for the recommendations.
    const crumb = source.match(/<nav class="detail-crumbs"[^>]*><a href="([^"]+)">/);
    assert.equal(crumb?.[1], path === '/uses/' ? '/' : '/#progetti', path + ' breadcrumb');
    assert.match(source, /<article class="detail-top[^"]*" aria-labelledby="page-title">[^]*?<dl class="facts">/, path + ' page top');
    assert.ok(!/class="[^"]*\b(?:register-row|filter-chips|register-tabs|tavola|sheet-frame|spec)\b/.test(source), path + ' retired components');
    assert.deepEqual(elements.filter(el => el.name === 'a' && el.attrs.href?.startsWith('/#')).map(el => el.attrs.href).slice(0, 3),
      ['/#progetti', '/#ricerca', '/#chi-sono'], path + ' header links');
    assert.match(source, /<footer\b[\s\S]*?<a href="\/uses\/"/);
  }
});

test('Ringmin articles preserve their identifiers, summaries and authorship', () => {
  const { elements, graph } = pageAt('/research/');
  const copy = JSON.parse(elements.find(el => el.attrs.id === 'page-i18n').body);
  const articles = graph.filter(item => item['@type'] === 'ScholarlyArticle');
  const collection = graph.find(item => item['@type'] === 'CollectionPage');
  const code = graph.find(item => item['@type'] === 'SoftwareSourceCode');
  assert.deepEqual(collection.hasPart.map(item => item['@id']), [...articles, code].map(item => item['@id']));
  // The Ringmin code and its archived release, as the page links them.
  assert.equal(code.codeRepository, research.repositories.find(repo => repo.project === 'ringmin').url);
  assert.equal(code.identifier, research.zenodo.url);
  assert.equal(code.author['@id'], origin + '/#person');
  assert.deepEqual(articles.map(item => item.identifier), research.papers.map(paper => 'arXiv:' + paper.arxiv));
  assert.equal(articles[0].headline, 'Minimum central circles: chain order, seam obstructions, and exact finite certification');
  for (const [index, article] of articles.entries()) {
    const paper = research.papers[index];
    assert.equal(article.url, paper.url);
    assert.equal(article.author['@id'], origin + '/#person');
    const key = 'researchPaper' + paper.number, home = 'paper' + paper.number;
    for (const lang of ['it', 'en']) {
      assert.equal(copy[lang].researchProgramSummary, research.summary[lang]);
      assert.equal(copy[lang][key + 'Title'], paper.title);
      assert.equal(copy[lang][key + 'Summary'], paper.summary[lang]);
      // The same three texts as the Research tab of the home.
      assert.equal(copy[lang][home + 'Title'], paper.heading[lang]);
      assert.equal(copy[lang][home + 'Highlight'], paper.highlight[lang]);
      assert.equal(copy[lang][home + 'Line'], paper.line[lang]);
      assert.doesNotMatch(paper.summary[lang], /euristic|heuristic/i);
    }
  }
});

test('project covers and public app links match the source catalogue', () => {
  for (const id of ['ringmin', 'prof-gecko', 'camaleonte']) {
    const project = projects.find(item => item.id === id);
    const { elements } = pageAt(project.page);
    const image = elements.find(el => el.attrs.fetchpriority === 'high');
    for (const lang of ['it', 'en']) assert.equal(image.attrs['data-alt-' + lang], project.cover.alt[lang]);
    if (id === 'ringmin') continue;
    const external = elements.filter(el => el.name === 'a').map(el => el.attrs.href);
    for (const link of project.links) assert.ok(external.includes(link.url), link.url);
    if (id === 'prof-gecko') assert.ok(!external.some(href => /github\.com\/[^/]+\/prof-gecko/i.test(href)));
  }
});

test('indexable subpages name the author in the document title, not in the heading', () => {
  for (const path of ['/research/', '/projects/prof-gecko/', '/projects/camaleonte/', '/uses/', '/projects/social-viewer/', '/projects/social-viewer/privacy/']) {
    const { source, elements } = pageAt(path);
    const title = source.match(/<title[^>]*>([^<]*)<\/title>/)[1];
    assert.match(title, / · Maurizio Falconi$/, path + ' title');
    assert.equal(elements.find(el => el.attrs.property === 'og:title').attrs.content, title, path + ' og:title');
    const language = elements.find(el => el.attrs.id === 'site-language').attrs;
    for (const lang of ['it', 'en']) assert.match(language['data-title-' + lang], / · Maurizio Falconi$/, path + ' ' + lang);
    assert.doesNotMatch(source.match(/<h1\b[^>]*>([^]*?)<\/h1>/)[1], /Maurizio Falconi/, path + ' heading');
  }
});

test('app pages describe their application for the same author', () => {
  const author = origin + '/#person';
  const camaleonte = projects.find(item => item.id === 'camaleonte');
  const game = pageAt('/projects/camaleonte/').graph;
  const app = game.find(item => item['@type'] === 'SoftwareApplication');
  assert.equal(game.find(item => item['@type'] === 'WebPage').mainEntity['@id'], app['@id']);
  assert.equal(app.applicationCategory, 'GameApplication');
  assert.equal(app.url, camaleonte.links.find(link => link.type === 'demo').url);
  assert.deepEqual(app.sameAs, [camaleonte.links.find(link => link.type === 'store').url]);
  assert.equal(app.author['@id'], author);

  const viewer = projects.find(item => item.id === 'social-viewer');
  const product = pageAt('/projects/social-viewer/').graph;
  const mobile = product.find(item => item['@type'] === 'MobileApplication');
  assert.equal(product.find(item => item['@type'] === 'Person')['@id'], author);
  assert.equal(product.find(item => item['@type'] === 'WebPage').mainEntity['@id'], mobile['@id']);
  assert.equal(mobile.operatingSystem, 'Android');
  assert.equal(mobile.applicationCategory, 'UtilitiesApplication');
  assert.equal(mobile.url, viewer.links.find(link => link.type === 'store').url);
  assert.equal(mobile.author['@id'], author);
  const policy = pageAt('/projects/social-viewer/privacy/').graph;
  assert.equal(policy.find(item => item['@type'] === 'WebPage').author['@id'], author);
});

test('recommendations preserve the approved affiliate URLs and both original disclosures', () => {
  const { elements } = pageAt('/uses/');
  const links = elements.filter(el => el.name === 'a' && el.attrs.href.startsWith('https://link.amazon/'));
  assert.deepEqual(links.map(el => el.attrs.href.split('/').at(-1)), ['B01Um942w','B0cuqIZyw','B04ikrTOS','B0h5EUEl1']);
  for (const { attrs } of links) assert.equal(attrs.rel, 'sponsored noopener');
  const translations = JSON.parse(elements.find(el => el.attrs.id === 'page-i18n').body);
  assert.equal(translations.it.usesDisclosure, 'In qualità di Affiliato Amazon io ricevo un guadagno dagli acquisti idonei.');
  assert.equal(translations.en.usesDisclosure, 'As an Amazon Associate I earn from qualifying purchases.');
});

test('every page links its signature to the home and lists "Cosa uso" last in the header', () => {
  for (const route of routes) {
    const file = route.path.endsWith('/') ? route.path + 'index.html' : route.path;
    const source = readFileSync(new URL('../_site' + file, import.meta.url), 'utf8');
    const nav = source.match(/<nav class="site-nav"[^]*?<\/nav>/)?.[0];
    assert.ok(nav, route.path + ': header navigation');
    const links = tags(nav).filter(node => node.name === 'a');
    assert.equal(links.at(-1).attrs.href, '/uses/', route.path + ': "Cosa uso" comes last');
    assert.match(nav, /<a href="\/uses\/"[^>]*><span data-i18n="navUsesShort">Cosa uso<\/span><\/a>/, route.path);
    assert.deepEqual(links.filter(node => node.attrs['aria-current'] === 'page').map(node => node.attrs.href), route.path === '/uses/' ? ['/uses/'] : [], route.path + ': current item');
    // The Social Viewer privacy text keeps its own policy footer; the site footer follows it.
    const footer = source.match(/<footer class="(?:site-footer|footer wrap)"[^]*?<\/footer>/)?.[0];
    assert.ok(footer && /<a class="footer-home" href="\/">/.test(footer), route.path + ': the signature links to the home');
  }
});
