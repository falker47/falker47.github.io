import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = name => readFileSync(new URL(`../.github/workflows/${name}.yml`, import.meta.url), 'utf8');
const refresh = read('update-nexus-downloads');

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

test('a successful changed snapshot dispatches the Pages workflow on main', () => {
  assert.ok(/actions: write/.test(refresh), 'The snapshot workflow needs permission to dispatch Pages');
  assert.match(refresh, /git push origin HEAD:main\n\s+echo 'pushed=true' >> "\$GITHUB_OUTPUT"/);
  assert.match(refresh, /if: [^\n]*outputs\.pushed == 'true'/);
  assert.match(refresh, /GH_TOKEN: \$\{\{ github\.token \}\}/);
  assert.match(refresh, /run: gh workflow run pages\.yml --ref main/);
});

test('Pages deploys the checked artifact and branch validation runs on Node 22', () => {
  const pages = read('pages');
  assert.match(pages, /push:\n\s+branches: \[main\]\n  workflow_dispatch:/);
  assert.match(pages, /node scripts\/check\.mjs[\s\S]*actions\/upload-pages-artifact@[^\n]+\n\s+with:\n\s+path: _site/);
  assert.match(pages, /needs: build[\s\S]*pages: write[\s\S]*id-token: write[\s\S]*actions\/deploy-pages@/);
  const validate = read('validate');
  assert.match(validate, /pull_request:/);
  assert.match(validate, /branches: \[main, unify, 'codex\/\*\*'\]/);
  assert.match(validate, /node-version: '22'[\s\S]*node scripts\/check\.mjs/);
});
