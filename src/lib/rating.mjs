// The tutoring rating across the portals: each portal's score brought to five stars and
// weighted by its number of ratings. Recommendations are not ratings and do not count.
export function aggregateRating(ratings) {
  const count = ratings.reduce((sum, rating) => sum + rating.ratings, 0);
  if (!count) return null;
  const total = ratings.reduce((sum, rating) => sum + rating.score / rating.scale * 5 * rating.ratings, 0);
  return { score: total / count, count };
}

// One decimal in the reader's language: 5,0 / 5.0.
export const formatScore = (score, lang) =>
  new Intl.NumberFormat(lang, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(score);
