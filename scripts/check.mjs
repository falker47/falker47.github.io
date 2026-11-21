import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { basename, join, relative } from 'node:path';
import { walk } from './qa/site.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
function run(...args) {
  console.log('$ node ' + args.join(' '));
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run('scripts/build.mjs');
run('scripts/validate-site.mjs');
const tests = [];
for await (const file of walk(join(root, 'scripts'))) {
  if (/^test-.*\.mjs$/.test(basename(file))) tests.push(relative(root, file).replaceAll('\\', '/'));
}
if (!tests.length) throw Error('No test modules found');
run('--test', '--test-reporter=spec', ...tests.sort());
run('scripts/qa/links.mjs');
