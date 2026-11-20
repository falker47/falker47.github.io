import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

const workflowDir = new URL('../.github/workflows/', import.meta.url);
const read = file => readFileSync(new URL(file, workflowDir), 'utf8');
const refresh = read('update-nexus-downloads.yml');
const pages = read('pages.yml');

test('the Nexus refresh keeps its daily schedule, manual trigger and parser test', () => {
  assert.match(refresh, /schedule:\n\s+- cron: '24 5 \* \* \*'/);
  assert.match(refresh, /^  workflow_dispatch:/m);
  assert.match(refresh, /node --test scripts\/test-nexus-downloads\.mjs/);
  assert.match(refresh, /node scripts\/update-nexus-downloads\.mjs/);
});

test('the scheduled commit stages only the snapshot, with an unchanged-snapshot exit', () => {
  assert.deepEqual([...refresh.matchAll(/^\s*git add (.+)$/gm)].map(m => m[1]), ['data/nexus-downloads.json']);
  assert.match(refresh, /if git diff --quiet -- data\/nexus-downloads\.json; then[\s\S]*?exit 0\n\s+fi/);
  assert.deepEqual([...refresh.matchAll(/^\s*git commit (.+)$/gm)].map(m => m[1]), ["-m 'data: refresh Nexus Mods download total'"]);
  assert.deepEqual([...refresh.matchAll(/^\s*git push (.+)$/gm)].map(m => m[1]), ['origin HEAD:main']);
});

test('Pages rebuilds main after a successful Nexus refresh without granting Actions write access', () => {
  const nexusName = refresh.match(/^name: (.+)$/m)?.[1];
  assert.ok(nexusName, 'The Nexus workflow must have a name');
  const trigger = pages.match(/^  workflow_run:\n((?:    [^\n]+\n)+)/m)?.[1] ?? '';
  assert.equal(trigger.match(/^    workflows: \["([^"]+)"\]$/m)?.[1], nexusName);
  assert.match(trigger, /^    types: \[completed\]$/m);
  assert.match(trigger, /^    branches: \[main\]$/m);

  const build = pages.match(/^  build:\n((?:    [^\n]+\n)+)/m)?.[1] ?? '';
  assert.equal(build.match(/^    if: (.+)$/m)?.[1],
    "github.event_name != 'workflow_run' || github.event.workflow_run.conclusion == 'success'");
  assert.match(build, /^      - uses: actions\/checkout@\S+\n        with:\n          ref: main$/m);
  assert.doesNotMatch(refresh, /\bgh\s+workflow\s+run\b/);

  for (const file of readdirSync(workflowDir).filter(name => /\.ya?ml$/i.test(name))) {
    const workflow = read(file);
    assert.doesNotMatch(workflow, /(?:^[ \t]*|[{,][ \t]*)["']?actions["']?\s*:\s*["']?write["']?(?=\s|[,}]|$)/m,
      file + ' must not grant actions: write');
    assert.doesNotMatch(workflow, /(?:^[ \t]*|[{,][ \t]*)["']?permissions["']?\s*:\s*["']?write-all["']?(?=\s|[,}]|$)/m,
      file + ' must not grant write-all');
  }
});

test('Pages deploys the checked artifact and branch validation runs on Node 22', () => {
  assert.match(pages, /push:\n\s+branches: \[main\]\n  workflow_dispatch:/);
  assert.match(pages, /node scripts\/check\.mjs[\s\S]*actions\/upload-pages-artifact@[^\n]+\n\s+with:\n\s+path: _site/);
  assert.match(pages, /needs: build[\s\S]*pages: write[\s\S]*id-token: write[\s\S]*actions\/deploy-pages@/);
  const validate = read('validate.yml');
  assert.match(validate, /pull_request:/);
  assert.match(validate, /branches: \[main, unify, 'codex\/\*\*'\]/);
  assert.match(validate, /node-version: '22'[\s\S]*node scripts\/check\.mjs/);
});
