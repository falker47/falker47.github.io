import assert from 'node:assert/strict';
import { test } from 'node:test';
import { aggregateRating, formatScore } from '../src/lib/rating.mjs';

test('weights each portal by its ratings', () => {
  assert.deepEqual(aggregateRating([{ score: 5, scale: 5, ratings: 10 }, { score: 5, scale: 5, ratings: 2 }]), { score: 5, count: 12 });
  assert.deepEqual(aggregateRating([{ score: 4, scale: 5, ratings: 1 }, { score: 5, scale: 5, ratings: 3 }]), { score: 4.75, count: 4 });
});

test('normalises other scales to five', () => {
  assert.deepEqual(aggregateRating([{ score: 8, scale: 10, ratings: 2 }]), { score: 4, count: 2 });
});

test('no ratings, no figure', () => {
  assert.equal(aggregateRating([{ score: 5, scale: 5, ratings: 0 }]), null);
  assert.equal(aggregateRating([]), null);
});

test('one decimal in each language', () => {
  assert.equal(formatScore(5, 'it'), '5,0');
  assert.equal(formatScore(5, 'en'), '5.0');
  assert.equal(formatScore(4.75, 'it'), '4,8');
});
