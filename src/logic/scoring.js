const SCORE_CONFIG = {
  easy:   { base: 1000, decay: 1, min: 100 },
  medium: { base: 2500, decay: 2, min: 250 },
  hard:   { base: 5000, decay: 3, min: 500 },
}

export function calcScore(difficulty, seconds) {
  const { base, decay, min } = SCORE_CONFIG[difficulty] ?? SCORE_CONFIG.medium
  return Math.max(min, base - seconds * decay)
}
