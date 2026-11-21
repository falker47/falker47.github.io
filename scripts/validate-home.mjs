import assert from 'node:assert/strict';
import projects from '../data/projects.json' with { type: 'json' };
import mods from '../data/mods.json' with { type: 'json' };
import research from '../data/research.json' with { type: 'json' };
import tutoring from '../data/tutoring.json' with { type: 'json' };
import certificates from '../data/certifications.json' with { type: 'json' };
import snapshot from '../data/nexus-downloads.json' with { type: 'json' };
import { decode, tags } from './qa/site.mjs';
import { routes } from '../src/routes.mjs';

const text = markup => decode(markup.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
const visible = projects.filter(item => !item.hidden && item.category !== 'research').sort((a, b) => a.order - b.order);

function checkCounts(source) {
  const [summary] = source.match(/<p class="work-summary">[^]*?<\/p>/);
  const totalReviews = tutoring.ratings.reduce((total, row) => total + row.ratings, 0);
  const scale = tutoring.ratings[0].scale;
  const rating = tutoring.ratings.reduce((total, row) => total + row.ratings * row.score / row.scale, 0) * scale / totalReviews;
  const score = new Intl.NumberFormat('it', { maximumFractionDigits: 1 }).format(rating) + '/' + scale;
  const modCount = new Intl.NumberFormat('it-IT').format(snapshot.modCount);
  assert.equal(text(summary), `${visible.length} software · ${modCount} mod · ${research.papers.length} paper · tutoring ${score}`);
  const tabs = [...source.matchAll(/<button id="tab-([\w-]+)"[^>]*>[^]*?<span class="count">([^]*?)<\/button>/g)];
  assert.deepEqual(tabs.map(([, id, markup]) => [id, text(markup)]), [
    ['software', String(visible.length)], ['modding', modCount],
    ['research', String(research.papers.length)], ['teaching', score],
  ]);
  const chips = [...source.matchAll(/<button[^>]+data-filter="(\w+)"[^>]*>[^]*?<span class="count">(\d+)<\/span>/g)];
  assert.deepEqual(chips.map(([, id]) => id), ['all', 'app', 'game', 'tool']);
  for (const [, kind, count] of chips) {
    assert.equal(Number(count), visible.filter(project => kind === 'all' || project.category === kind).length);
  }
  const counts = [...source.matchAll(/data-nexus-stat="modCount">([^<]+)</g)];
  assert.equal(counts.length, 4, 'summary, tab, stat tile and Nexus profile link');
  for (const [, count] of counts) assert.equal(count, modCount);
  const downloads = source.match(/data-i18n="moddingNumber">([^<]+)</);
  assert.equal(downloads[1], new Intl.NumberFormat('it-IT').format(snapshot.uniqueModDownloads));
  assert.equal(tags(source).filter(node => node.attrs['data-viewer'] === 'home-certificate').length, certificates.length);
  assert.ok(text(source.match(/<details class="more-certificates">[^]*?<\/summary>/)[0]).includes(`Mostra tutte (${certificates.length})`));
}

function checkRegister(source) {
  const rows = [...source.matchAll(/<article class="register-row"[^>]*>([^]*?)<\/article>/g)].map(match => match[1]);
  assert.equal(rows.length, visible.length);
  for (const [index, project] of visible.entries()) {
    const row = rows[index];
    const internal = routes.some(route => route.path === project.page);
    const preferred = ['demo', 'store', 'repo'].map(type => project.links.find(link => link.type === type)?.url);
    const [demo, store, repo] = preferred;
    const [titleLink] = row.match(/<a class="row-title"[^]*?<\/a>/);
    assert.equal(text(titleLink), project.title);
    assert.equal(tags(titleLink)[0].attrs.href, internal ? project.page : demo ?? store ?? repo);
    assert.equal(tags(row).find(element => element.attrs.class === 'icon-button')?.attrs.href, repo);
    assert.ok(tags(row).some(element => element.name === 'picture'));
  }
  assert.deepEqual([...source.matchAll(/<article class="mod-row">[^]*?<a class="row-title"[^>]*>([^<]*)/g)].map(match => decode(match[1])),
    mods.items.map(mod => mod.title));
}

function checkLegacyLinks(source) {
  const [footer] = source.match(/<footer\b[^]*?<\/footer>/);
  const legacy = markup => tags(markup).filter(element => element.attrs.href?.includes('/Nexus-portfolio/'));
  assert.deepEqual(legacy(source.replace(footer, '')), []);
  const expected = routes.some(route => route.path === '/uses/') ? [] : ['https://falker47.github.io/Nexus-portfolio/consigli.html'];
  assert.deepEqual(legacy(footer).map(element => element.attrs.href), expected);
}

export function validateHomeCatalogue(source) {
  checkCounts(source);
  checkRegister(source);
  checkLegacyLinks(source);
}
