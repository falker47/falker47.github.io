import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { html, raw, jsonScript, translatedText } from '../../src/lib/html.mjs';
import { openSite, references, tags } from './site.mjs';
import { startServer } from './serve.mjs';

test('template interpolation escapes text, attributes and script data', () => {
  assert.equal(html`<p title="${'"&'}">${'<img>'}${raw('<br>')}</p>`, '<p title="&quot;&amp;">&lt;img&gt;<br></p>');
  assert.equal(html`${translatedText('first<br><b>last</b>')}`, 'first<br>&lt;b&gt;last&lt;/b&gt;');
  assert.ok(!html`${jsonScript({text:'</script><script>'})}`.includes('<'));
});

test('reference scanning ignores comments and JSON strings, and reads quoted and single-quoted attributes', () => {
  const markup = `<!-- <a href="/bad"> --><script type="application/json">{"html":"<a href='bad'>"}</script>
    <a title="1 > 0" href='/x/#proof'>x</a><img srcset="small.png 1x, large.png 2x">`;
  assert.deepEqual(references(tags(markup)).map(ref => ref.value), ['/x/#proof','small.png','large.png']);
});

test('directory indexes, query-preserving redirects, custom 404s and cross-page fragments', async t => {
  const root = await mkdtemp(join(tmpdir(), 'falker-pages-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'x'));
  await mkdir(join(root, 'data'));
  await writeFile(join(root, 'data/redirects.json'), '{"redirects":[]}');
  await writeFile(join(root, 'x/index.html'), '<h1 id="proof">Page</h1>');
  await writeFile(join(root, '404.html'), 'Custom error');
  const server = await startServer({ root });
  try {
    const redir = await fetch(server.origin + '/x?lang=en', { redirect: 'manual' });
    assert.equal(redir.status, 301);
    assert.equal(redir.headers.get('location'), '/x/?lang=en');
    assert.match(await (await fetch(server.origin + '/x/')).text(), /Page/);
    const missing = await fetch(server.origin + '/missing');
    assert.equal(missing.status, 404);
    assert.equal(await missing.text(), 'Custom error');
    const head = await fetch(server.origin + '/x/', { method: 'HEAD' });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), '');
    const site = await openSite(root);
    assert.equal((await site.check({value:'/x/#proof'}, '/')).kind, 'internal');
    await assert.rejects(site.check({value:'/x/#absent'}, '/'), /missing anchor/);
    await assert.rejects(site.check({value:'/bad.png'}, '/'), /Missing site file/);
  } finally { await server.close(); }
});
