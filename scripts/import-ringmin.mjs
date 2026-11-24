// Copy the certified Ringmin optima, the asymptotic table and the certified interval for C* into data/ringmin.json.
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

/**
 * The certified interval for the asymptotic constant C* = lim R*(n)/n².
 * Lower end: Paper II (arXiv 2609.13630), Proposition "Explicit global lower bound", whose directed
 * enclosure starts above this decimal. Upper end: the exact (directed-enclosure) bound on
 * limsup R*(n)/n² recorded in knowledge/GLOBAL_BOUNDS_ASYMPTOTICS.md; Paper II names its sharper
 * U_4 without a decimal value. Paper II proves that the limit exists, so both bound C*.
 */
export function readAsymptoticConstant(source) {
  const paper = join(source, 'paper_assets', 'asymptotic_sequel', 'ringmin_asymptotic.tex');
  const ledger = join(source, 'knowledge', 'GLOBAL_BOUNDS_ASYMPTOTICS.md');
  const lower = /exact directed enclosure\s*\\\[\s*(\.\d+)\s*<\s*C_\{\\rm term\}\+\\eta_\{\\rm width\}/.exec(readFileSync(paper, 'utf8'))?.[1];
  const upper = /weaker exact bound\s+limsup R\*\(n\)\/n\^2\s*<\s*(0\.\d+)/.exec(readFileSync(ledger, 'utf8'))?.[1];
  if (!lower) throw Error(paper + ': no lower enclosure for C_term + eta_width');
  if (!upper) throw Error(ledger + ': no exact upper bound for limsup R*(n)/n^2');
  const result = {
    lower: Number('0' + lower), upper: Number(upper),
    lowerSource: 'Paper II (arXiv 2609.13630), Proposition "Explicit global lower bound": C* ≥ C_term + η_width > 0' + lower,
    upperSource: 'ringmin knowledge/GLOBAL_BOUNDS_ASYMPTOTICS.md, shifted-family corollary: limsup R*(n)/n² < ' + upper,
  };
  if (!(1 / 8 < result.lower && result.lower < result.upper && result.upper < 1 / (2 * Math.PI))) throw Error('Inconsistent bounds for C*');
  return result;
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
  return { source: { repository: 'https://github.com/falker47/ringmin', commit }, optima, asymptotic, constant: readAsymptoticConstant(source) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const source = resolve(process.argv[2] ?? join(homedir(), 'sources', 'ringmin'));
  const data = importRingmin(source);
  writeFileSync(OUTPUT, JSON.stringify(data, null, 1) + '\n');
  console.log('Imported', data.optima.length, 'certified optima,', data.asymptotic.length, 'asymptotic rows and C* in [' + data.constant.lower + ', ' + data.constant.upper + '] from', source);
}
