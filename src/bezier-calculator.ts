import type { Vector } from './math'

/**
 * Calculate factorial of a number
 */
function factorial (n: number): number {
  if (n <= 1) return 1
  let result = 1
  for (let i = 2; i <= n; i++) {
    result *= i
  }
  return result
}

/**
 * Returns the binomial coefficient "n choose k"
 */
function binomial (n: number, k: number): number {
  return factorial(n) / (factorial(k) * factorial(n - k))
}

/**
 * Calculate the i-th component of a Bernstein polynomial of degree n
 */
function bernsteinPolynomialPoint (x: number, i: number, n: number): number {
  return binomial(n, i) * Math.pow(x, i) * Math.pow(1 - x, n - i)
}

/**
 * Given list of control points, returns a function which given a point [0,1]
 * returns a point in the Bézier curve described by these points
 */
function bernsteinPolynomial (points: Vector[]): (t: number) => Vector {
  return (t: number): Vector => {
    const n = points.length - 1
    let x = 0
    let y = 0

    for (let i = 0; i < points.length; i++) {
      const bern = bernsteinPolynomialPoint(t, i, n)
      x += points[i].x * bern
      y += points[i].y * bern
    }

    return { x, y }
  }
}

/**
 * Given list of control points, returns n points in the Bézier curve
 * described by these points
 * Ported from humancursor Python implementation
 */
export function calculatePointsInCurve (n: number, points: Vector[]): Vector[] {
  if (n < 2) {
    throw new Error('n must be at least 2')
  }

  const curvePoints: Vector[] = []
  const bernsteinPoly = bernsteinPolynomial(points)

  for (let i = 0; i < n; i++) {
    // Explicitly use first and last control points to avoid floating point errors
    if (i === 0) {
      curvePoints.push({ ...points[0] })
    } else if (i === n - 1) {
      curvePoints.push({ ...points[points.length - 1] })
    } else {
      const t = i / (n - 1)
      curvePoints.push(bernsteinPoly(t))
    }
  }

  return curvePoints
}
