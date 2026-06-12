function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Returns an algebraic equation string whose unique solution is exactly n (1–9).
 * Picks randomly from 14 templates across linear, multiplicative, and expression forms.
 */
export function generateEquation(n) {
  const TEMPLATES = [
    // 1. x + b = n+b
    () => {
      const b = randInt(1, 9)
      return `x + ${b} = ${n + b}`
    },

    // 2. b - x = b-n  (b always > n)
    () => {
      const b = n + randInt(1, 8)
      return `${b} - x = ${b - n}`
    },

    // 3. ax = a·n
    () => {
      const a = randInt(2, 5)
      return `${a}x = ${a * n}`
    },

    // 4. ax + b = a·n + b
    () => {
      const a = randInt(2, 4)
      const b = randInt(1, 6)
      return `${a}x + ${b} = ${a * n + b}`
    },

    // 5. ax - b = a·n - b  (b < a·n guaranteed)
    () => {
      const a = randInt(2, 4)
      const b = randInt(1, Math.min(6, Math.max(1, a * n - 1)))
      return `${a}x - ${b} = ${a * n - b}`
    },

    // 6. 2(x + b) = 2·(n+b)
    () => {
      const b = randInt(1, 5)
      return `2(x + ${b}) = ${2 * (n + b)}`
    },

    // 7. x = a + b  where a+b = n  (n≥2; else fallback)
    () => {
      if (n < 2) return `x + 1 = ${n + 1}`
      const a = randInt(1, n - 1)
      return `x = ${a} + ${n - a}`
    },

    // 8. x = c - b  where c-b = n
    () => {
      const b = randInt(1, 8)
      return `x = ${n + b} - ${b}`
    },

    // 9. x ÷ a = c  OR  (x + b) ÷ a = c  with (n+b) % a === 0
    () => {
      const a = randInt(2, 3)
      const rem = n % a
      const b = rem === 0 ? 0 : a - rem
      const c = (n + b) / a
      return b === 0 ? `x ÷ ${a} = ${c}` : `(x + ${b}) ÷ ${a} = ${c}`
    },

    // 10. a + bx = a + b·n
    () => {
      const a = randInt(1, 6)
      const b = randInt(2, 4)
      return `${a} + ${b}x = ${a + b * n}`
    },

    // 11. x - b = n - b  (n≥2; else fallback)
    () => {
      if (n < 2) return `x + 2 = ${n + 2}`
      const b = randInt(1, n - 1)
      return `x - ${b} = ${n - b}`
    },

    // 12. x = (a·n) ÷ a  — presented as a division expression
    () => {
      const a = randInt(2, 4)
      return `x = ${a * n} ÷ ${a}`
    },

    // 13. (a·b)x ÷ b = a·n  (simplifies cleanly)
    () => {
      const b = randInt(2, 3)
      const k = randInt(2, 4)
      return `${b * k}x ÷ ${b} = ${k * n}`
    },

    // 14. x = a × b  where a·b = n  (only for composite n; else fallback)
    () => {
      if (n < 4) {
        const b = randInt(1, 8)
        return `x = ${n + b} - ${b}`
      }
      const factors = []
      for (let f = 2; f * f <= n; f++) {
        if (n % f === 0) factors.push([f, n / f])
      }
      if (factors.length === 0) {
        const b = randInt(1, 8)
        return `x = ${n + b} - ${b}`
      }
      const [a, c] = factors[Math.floor(Math.random() * factors.length)]
      return `x = ${a} × ${c}`
    },
  ]

  const idx = Math.floor(Math.random() * TEMPLATES.length)
  return TEMPLATES[idx]()
}
