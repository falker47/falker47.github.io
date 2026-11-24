import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import data from '../data/ringmin.json' with { type: 'json' };
import { circles, smallestGap } from '../src/partials/ringmin.mjs';
import { CERTIFIED, importRingmin, readAsymptoticConstant } from './import-ringmin.mjs';

const tolerance = 1e-4;
const source = join(homedir(), 'sources', 'ringmin');

test('the snapshot holds the twelve certified optima and the asymptotic table', () => {
  assert.deepEqual(data.optima.map(item => item.n), Array.from({ length: CERTIFIED.to - CERTIFIED.from + 1 }, (_, i) => i + CERTIFIED.from));
  for (const { n, R_float64, ordering, positions, floating_circles } of data.optima) {
    assert.ok(R_float64 > 0, 'n = ' + n);
    assert.deepEqual([...ordering].sort((a, b) => a - b), Array.from({ length: n }, (_, i) => i + 1), 'n = ' + n + ': radii 1..n');
    assert.equal(positions.length, n);
    assert.ok(positions.every((angle, i) => angle >= 0 && angle < 2 * Math.PI && (i === 0 || angle > positions[i - 1])), 'n = ' + n + ': increasing angles');
    assert.ok(floating_circles.every(radius => ordering.includes(radius)), 'n = ' + n + ': floating circles are radii');
  }
  assert.deepEqual(data.asymptotic.map(row => row.n), Array.from({ length: 16 }, (_, i) => i + 3));
  assert.deepEqual(data.asymptotic.filter(row => row.certified).map(row => row.n), data.optima.map(item => item.n));
  for (const { n, ratio } of data.asymptotic) {
    assert.ok(ratio > 0 && ratio < 1 / 8, 'n = ' + n + ': R(n)/n² stays below 1/8');
    const optimum = data.optima.find(item => item.n === n);
    if (optimum) assert.ok(Math.abs(ratio - optimum.R_float64 / (n * n)) < 1e-9, 'n = ' + n + ': the table matches the optimum');
  }
  const ratios = data.asymptotic.map(row => row.ratio);
  assert.deepEqual(ratios, [...ratios].sort((a, b) => a - b), 'R(n)/n² grows with n');
});

test('in every configuration each pair of circles is tangent or apart', () => {
  for (const optimum of data.optima) {
    const list = circles(optimum);
    assert.equal(list.length, optimum.n);
    for (const circle of list) {
      // Every outer circle touches the central one: its centre lies at R + r from the origin.
      assert.ok(Math.abs(Math.hypot(circle.x, circle.y) - (optimum.R_float64 + circle.r)) < 1e-9, 'n = ' + optimum.n + ': radius ' + circle.r + ' touches the centre');
    }
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const gap = Math.hypot(list[i].x - list[j].x, list[i].y - list[j].y) - list[i].r - list[j].r;
      assert.ok(gap >= -tolerance, `n = ${optimum.n}: circles ${list[i].r} and ${list[j].r} overlap by ${-gap}`);
    }
    // An optimum is rigid somewhere: at least one pair is tangent.
    assert.ok(Math.abs(smallestGap(optimum)) <= tolerance, 'n = ' + optimum.n + ': a tangent pair exists');
    assert.equal(list.filter(circle => circle.floating).length, optimum.floating_circles.length);
  }
});

test('an overlapping drawing fails the same check', () => {
  const [first] = data.optima;
  const squeezed = { ...first, R_float64: first.R_float64 * .5 };
  assert.ok(smallestGap(squeezed) < -tolerance);
});

test('the snapshot matches the reference checkout', { skip: !existsSync(source) && 'reference checkout unavailable' }, t => {
  const fresh = importRingmin(source);
  const committed = JSON.parse(readFileSync(new URL('../data/ringmin.json', import.meta.url), 'utf8'));
  if (fresh.source.commit !== committed.source.commit) return t.skip('the reference checkout is at another commit: run scripts/import-ringmin.mjs');
  assert.deepEqual(fresh.optima, committed.optima);
  assert.deepEqual(fresh.asymptotic, committed.asymptotic);
});

test('the certified interval for C* lies above 1/8 and above every finite value', () => {
  const { lower, upper, lowerSource, upperSource } = data.constant;
  assert.ok(1 / 8 < lower && lower < upper && upper < 1 / (2 * Math.PI), 'ordered bounds');
  assert.ok(data.asymptotic.every(row => row.ratio < lower), 'R(n)/n² for n ≤ 18 stays below the interval');
  assert.ok(upper - lower < .01, 'a short interval');
  assert.match(lowerSource, /arXiv 2609\.13630/);
  assert.match(upperSource, /GLOBAL_BOUNDS_ASYMPTOTICS\.md/);
});

test('the importer reads both bounds and rejects sources without them', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ringmin-'));
  mkdirSync(join(dir, 'paper_assets', 'asymptotic_sequel'), { recursive: true });
  mkdirSync(join(dir, 'knowledge'));
  const tex = join(dir, 'paper_assets', 'asymptotic_sequel', 'ringmin_asymptotic.tex');
  const ledger = join(dir, 'knowledge', 'GLOBAL_BOUNDS_ASYMPTOTICS.md');
  writeFileSync(tex, 'with exact directed enclosure\n\\[\n .1405 < C_{\\rm term}+\\eta_{\\rm width}\n < .1406.\n\\]');
  writeFileSync(ledger, 'directed rational sqrt/log/pi enclosures also give the weaker exact bound\nlimsup R*(n)/n^2<0.142. This');
  assert.deepEqual([readAsymptoticConstant(dir).lower, readAsymptoticConstant(dir).upper], [.1405, .142]);
  writeFileSync(ledger, 'no bound here');
  assert.throws(() => readAsymptoticConstant(dir), /no exact upper bound/);
  writeFileSync(ledger, 'weaker exact bound\nlimsup R*(n)/n^2<0.12. This');
  assert.throws(() => readAsymptoticConstant(dir), /Inconsistent/);
});
