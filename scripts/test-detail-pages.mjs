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
    assert.equal(person.jobTitle, 'AI & Digital Innovation Specialist');
    assert.equal(graph.find(item => item.url === origin + path).author['@id'], person['@id']);
    // "← Progetti" for project pages, "← Home" for the recommendations.
    const crumb = source.match(/<nav class="detail-crumbs"[^>]*><a href="([^"]+)">/);
    assert.equal(crumb?.[1], path === '/uses/' ? '/' : '/projects/', path + ' breadcrumb');
    assert.match(source, /<article class="tavola tavola-top[^"]*" aria-labelledby="page-title">[^]*?<table class="spec">/, path + ' top sheet');
    assert.ok(!/class="[^"]*\b(?:register-row|filter-chips|register-tabs)\b/.test(source), path + ' R1 components');
    assert.match(source, /<footer\b[\s\S]*?<a href="\/uses\/"/);
  }
});

test('Ringmin articles preserve their identifiers, summaries and authorship', () => {
  const { elements, graph } = pageAt('/research/');
  const copy = JSON.parse(elements.find(el => el.attrs.id === 'page-i18n').body);
  const articles = graph.filter(item => item['@type'] === 'ScholarlyArticle');
  const collection = graph.find(item => item['@type'] === 'CollectionPage');
  assert.deepEqual(collection.hasPart.map(item => item['@id']), articles.map(item => item['@id']));
  assert.deepEqual(articles.map(item => item.identifier), research.papers.map(paper => 'arXiv:' + paper.arxiv));
  for (const [index, article] of articles.entries()) {
    const paper = research.papers[index];
    assert.equal(article.url, paper.url);
    assert.equal(article.author['@id'], origin + '/#person');
    const key = 'researchPaper' + paper.number;
    for (const lang of ['it', 'en']) {
      assert.equal(copy[lang].researchProgramSummary, research.summary[lang]);
      assert.equal(copy[lang][key + 'Title'], paper.title);
      assert.equal(copy[lang][key + 'Summary'], paper.summary[lang]);
      assert.equal(copy[lang][key + 'Result'], paper.highlight[lang]);
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

test('recommendations preserve the approved affiliate URLs and both original disclosures', () => {
  const { elements } = pageAt('/uses/');
  const links = elements.filter(el => el.name === 'a' && el.attrs.href.startsWith('https://link.amazon/'));
  assert.deepEqual(links.map(el => el.attrs.href.split('/').at(-1)), ['B01Um942w','B0cuqIZyw','B04ikrTOS','B0h5EUEl1']);
  for (const { attrs } of links) assert.equal(attrs.rel, 'sponsored noopener');
  const translations = JSON.parse(elements.find(el => el.attrs.id === 'page-i18n').body);
  assert.equal(translations.it.usesDisclosure, 'In qualità di Affiliato Amazon io ricevo un guadagno dagli acquisti idonei.');
  assert.equal(translations.en.usesDisclosure, 'As an Amazon Associate I earn from qualifying purchases.');
});
