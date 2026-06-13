function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function gcd(a, b) { return b === 0 ? a : gcd(b, a % b) }

/**
 * Returns an algebraic equation string whose unique solution is exactly n (1–9).
 * Picks randomly from 21 templates across linear, multiplicative, and expression forms.
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

    // 7. ax + bx = (a+b)n  — combining like terms
    () => {
      const a = randInt(2, 5)
      const b = randInt(1, 4)
      return `${a}x + ${b}x = ${(a + b) * n}`
    },

    // 8. (x + a) / b = c  — division after offset (a=0 gives plain x/b = c)
    () => {
      const b = randInt(2, 4)
      const a = (b - (n % b)) % b
      const c = (n + a) / b
      return a === 0 ? `x / ${b} = ${c}` : `(x + ${a}) / ${b} = ${c}`
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

    // 12. a(x - b) = c  — distributive with subtraction (n≥2; else simple fallback)
    () => {
      const a = randInt(2, 4)
      if (n <= 1) return `${a}x + 1 = ${a * n + 1}`
      const b = randInt(1, n - 1)
      return `${a}(x - ${b}) = ${a * (n - b)}`
    },

    // 13. (a·b)x ÷ b = a·n  (simplifies cleanly)
    () => {
      const b = randInt(2, 3)
      const k = randInt(2, 4)
      return `${b * k}x ÷ ${b} = ${k * n}`
    },

    // 14. bx - ax = (b-a)n  — combining like terms (difference)
    () => {
      const a = randInt(2, 4)
      const b = a + randInt(1, 3)
      return `${b}x - ${a}x = ${(b - a) * n}`
    },

    // 15. x/a = b/c  — cross-multiply (b/c is n/a in fully reduced form, c > 1)
    () => {
      const candidates = [2, 3, 4, 6].filter(a => gcd(n, a) < a)
      if (candidates.length === 0) {
        const b = randInt(1, 6)
        return `2x + ${b} = ${2 * n + b}`
      }
      const a = candidates[Math.floor(Math.random() * candidates.length)]
      const g = gcd(n, a)
      return `x / ${a} = ${n / g} / ${a / g}`
    },

    // 16. x² = n²  — perfect square (x is 1–9 so solution is unambiguous)
    () => `x² = ${n * n}`,

    // 17. a(bx ± c) = d  — nested parentheses, expand then isolate
    () => {
      const a = randInt(2, 3)
      const b = randInt(2, 4)
      if (n > 1 && Math.random() < 0.5) {
        const c = randInt(1, Math.min(4, b * n - 1))
        return `${a}(${b}x - ${c}) = ${a * (b * n - c)}`
      }
      const c = randInt(1, 5)
      return `${a}(${b}x + ${c}) = ${a * (b * n + c)}`
    },

    // 18. ax + b = (a-1)x + c  — variable on both sides
    () => {
      const a = randInt(2, 5)
      const b = randInt(1, 6)
      const c = n + b
      const rhsCoef = a - 1
      const rhsTerm = rhsCoef === 1 ? `x + ${c}` : `${rhsCoef}x + ${c}`
      return `${a}x + ${b} = ${rhsTerm}`
    },

    // 19. ax = x + b  — variable on both sides, simpler form
    () => {
      const a = randInt(2, 5)
      const b = (a - 1) * n
      return `${a}x = x + ${b}`
    },

    // 20. (x + a + b) / 3 = c  — average of three numbers
    () => {
      const a = randInt(1, 8)
      const need = (3 - ((n + a) % 3)) % 3
      const b = need === 0 ? 3 : need
      const c = (n + a + b) / 3
      return `(x + ${a} + ${b}) / 3 = ${c}`
    },

    // 21. ax - cx + b = d  — three terms, combine like terms then isolate
    () => {
      const a = randInt(3, 6)
      const c = randInt(1, a - 1)
      const b = randInt(1, 8)
      return `${a}x - ${c}x + ${b} = ${(a - c) * n + b}`
    },
  ]

  const idx = Math.floor(Math.random() * TEMPLATES.length)
  return TEMPLATES[idx]()
}
