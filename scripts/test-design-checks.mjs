import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { checkText, designChecks } from './design-checks.mjs';

test('text arrows, ordinary digits and fragments survive the emoji check', () => {
  checkText('Scheda 01 · 5/5 · #ricerca → ↗ ⟶', 'fixture');
  for (const sequence of ['1\uFE0F\u20E3', '\u{1F1EE}\u{1F1F9}', '\u{1F642}', '\u2197\uFE0F']) {
    assert.throws(() => checkText(sequence, 'fixture'), /emoji/);
  }
});

test('unknown font, insufficient contrast and undersized controls fail Node validation', async () => {
  const root = await mkdtemp(join(tmpdir(), 'site-css-'));
  try {
    const css = `:root { --bg:#071525; --surface:#0b1d30; --surface-raised:#0d2338; --header-bg:#071525ee; --paper:#f1f4f5; --blue:#9bdcff; --target:44px; }
      :where(.site-header, .site-footer, .detail-top, .detail-crumbs, .deck, .work) :is(a, button) { min-height: var(--target); }
      body { color:var(--paper); background:var(--bg); font-family:system-ui,sans-serif; }`;
    await writeFile(join(root, 'site.css'), css);
    await designChecks(root);
    await assert.rejects(designChecks(root, ['.detail-link {font-family: Gelaasio, serif}']), /undeclared font/);
    await assert.rejects(designChecks(root, ['.detail-link {color:var(--paper);background:var(--blue)}']), /below 4.5/);
    await assert.rejects(designChecks(root, ['.detail-link {min-height:20px}']), /min-height/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
