// Copy the certified Ringmin optima and the asymptotic table into data/ringmin.json.
// Usage: node scripts/import-ringmin.mjs [path to a ringmin checkout]
// The default source is <HOME>/sources/ringmin (https://github.com/falker47/ringmin).
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUTPUT = new URL('../data/ringmin.json', import.meta.url);
export const CERTIFIED = { from: 3, to: 14 };

const finite = value => typeof value === 'number' && Number.isFinite(value);

/** One certified configuration: the radii in chain order and their angles in radians. */
export function readOptimum(source, n) {
  const file = join(source, 'results', 'n' + String(n).padStart(2, '0'), 'optimum.json');
  const data = JSON.parse(readFileSync(file, 'utf8'));
  if (data.n !== n || data.certified !== true) throw Error(file + ': expected the certified optimum for n = ' + n);
  const { R_float64, ordering, positions, floating_circles } = data;
  if (!finite(R_float64) || R_float64 <= 0) throw Error(file + ': invalid R_float64');
  if (!Array.isArray(ordering) || ordering.length !== n || [...ordering].sort((a, b) => a - b).some((radius, i) => radius !== i + 1)) {
    throw Error(file + ': ordering must list the radii 1..' + n + ' once each');
  }
  if (!Array.isArray(positions) || positions.length !== n || !positions.every(finite)) throw Error(file + ': invalid positions');
  // floating_circles lists radii, not indices.
  if (!Array.isArray(floating_circles) || floating_circles.some(radius => !ordering.includes(radius))) throw Error(file + ': invalid floating_circles');
  return { n, R_float64, ordering, positions, floating_circles };
}

/** n, R(n)/n² and whether the value is certified, from the paper's table. */
export function readAsymptotic(source) {
  const file = join(source, 'paper_assets', 'asymptotic_fit.csv');
  const [header, ...lines] = readFileSync(file, 'utf8').trim().split(/\r?\n/);
  const columns = header.split(',');
  for (const name of ['n', 'R', 'label']) if (!columns.includes(name)) throw Error(file + ': missing column ' + name);
  return lines.map(line => {
    const cells = line.split(',');
    const n = Number(cells[columns.indexOf('n')]);
    const R = Number(cells[columns.indexOf('R')]);
    const label = cells[columns.indexOf('label')];
    if (!Number.isSafeInteger(n) || n < 1 || !finite(R) || R <= 0 || !['CERTIFIED', 'NON-EXHAUSTIVE'].includes(label)) {
      throw Error(file + ': invalid row ' + line);
    }
    return { n, ratio: Number((R / (n * n)).toFixed(12)), certified: label === 'CERTIFIED' };
  });
}

export function importRingmin(source) {
  const optima = [];
  for (let n = CERTIFIED.from; n <= CERTIFIED.to; n++) optima.push(readOptimum(source, n));
  const asymptotic = readAsymptotic(source);
  for (const { n, R_float64 } of optima) {
    const row = asymptotic.find(item => item.n === n);
    if (!row?.certified || Math.abs(row.ratio - R_float64 / (n * n)) > 1e-9) throw Error('The table and the optimum disagree for n = ' + n);
  }
  let commit = null;
  try { commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: source, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { /* A source archive has no Git metadata. */ }
  return { source: { repository: 'https://github.com/falker47/ringmin', commit }, optima, asymptotic };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const source = resolve(process.argv[2] ?? join(homedir(), 'sources', 'ringmin'));
  const data = importRingmin(source);
  writeFileSync(OUTPUT, JSON.stringify(data, null, 1) + '\n');
  console.log('Imported', data.optima.length, 'certified optima and', data.asymptotic.length, 'asymptotic rows from', source);
}
