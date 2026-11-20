import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { validateHomeCatalogue } from './validate-home.mjs';

const home = await readFile(new URL('../_site/index.html', import.meta.url), 'utf8');

test('the home validator rejects stale printed totals and chip counts', () => {
  assert.throws(() => validateHomeCatalogue(home.replace('class="work-summary">', 'class="work-summary">999')));
  const wrongChip = home.replace(/(data-filter="tool"[^]*?<span class="count">)\d+/, (_, start) => start + '999');
  assert.throws(() => validateHomeCatalogue(wrongChip));
});

test('the home validator rejects a wrong register destination', () => {
  const wrongLink = home.replace(/class="row-title" href="[^"]+"/, 'class="row-title" href="/"');
  assert.throws(() => validateHomeCatalogue(wrongLink));
});

test('only the Uses link in the footer can refer to the legacy portfolio', () => {
  validateHomeCatalogue(home);
  const link = '<a href="https://falker47.github.io/Nexus-portfolio/">Portfolio</a>';
  assert.throws(() => validateHomeCatalogue(home.replace('</main>', link + '</main>')));
  assert.throws(() => validateHomeCatalogue(home.replace('</footer>', link + '</footer>')));
});
