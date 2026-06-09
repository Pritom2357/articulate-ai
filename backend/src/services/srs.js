/**
 * SM-2 Spaced Repetition Algorithm
 * https://www.supermemo.com/en/blog/application-of-a-computer-to-improve-the-results-obtained-in-working-with-the-super-memo-method
 */

function scoreToQuality(score) {
  if (score >= 80) return 5;
  if (score >= 70) return 4;
  if (score >= 60) return 3;
  if (score >= 40) return 2;
  return 1;
}

/**
 * @param {object} card - { streak, easiness, interval_days }
 * @param {number} pronunciationScore - 0–100
 * @returns {{ streak, easiness, interval_days, next_review }}
 */
function sm2(card, pronunciationScore) {
  const quality = scoreToQuality(pronunciationScore);

  let { streak, easiness, interval_days } = card;

  if (quality < 3) {
    streak = 0;
    interval_days = 1;
  }
  else {
    if (streak === 0) {
      interval_days = 1;
    }
    else if (streak === 1) {
      interval_days = 6;
    }
    else {
      interval_days = Math.round(interval_days * easiness);
    }
    streak += 1;
  }

  easiness = easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easiness < 1.3) easiness = 1.3;

  const next_review = new Date();
  next_review.setDate(next_review.getDate() + interval_days);

  return {
    streak,
    easiness: parseFloat(easiness.toFixed(4)),
    interval_days,
    next_review,
  };
}

module.exports = { sm2, scoreToQuality };
