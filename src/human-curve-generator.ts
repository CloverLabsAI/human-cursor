import type { Vector } from './math'
import { calculatePointsInCurve } from './bezier-calculator'
import { type TweeningFunction, easeOutQuad } from './tweening'

/**
 * Options for generating a human-like mouse trajectory curve
 */
export interface HumanCurveOptions {
  /** Boundary offset in X direction */
  offsetBoundaryX?: number
  /** Boundary offset in Y direction */
  offsetBoundaryY?: number
  /** Left boundary for internal knots */
  leftBoundary?: number
  /** Right boundary for internal knots */
  rightBoundary?: number
  /** Down boundary for internal knots */
  downBoundary?: number
  /** Up boundary for internal knots */
  upBoundary?: number
  /** Number of internal knots */
  knotsCount?: number
  /** Mean for distortion */
  distortionMean?: number
  /** Standard deviation for distortion */
  distortionStDev?: number
  /** Frequency of distortion (0-1) */
  distortionFrequency?: number
  /** Tweening function to use */
  tweening?: TweeningFunction
  /** Target number of points in the curve */
  targetPoints?: number
}

/**
 * Generates human-like mouse trajectory curves
 * Ported from humancursor Python implementation
 */
export class HumanizeMouseTrajectory {
  fromPoint: Vector
  toPoint: Vector
  points: Vector[]

  constructor (fromPoint: Vector, toPoint: Vector, options?: HumanCurveOptions) {
    this.fromPoint = fromPoint
    this.toPoint = toPoint
    this.points = this.generateCurve(options)
  }

  /**
   * Generates the curve based on provided options
   */
  generateCurve (options?: HumanCurveOptions): Vector[] {
    const offsetBoundaryX = options?.offsetBoundaryX ?? 80
    const offsetBoundaryY = options?.offsetBoundaryY ?? 80
    const leftBoundary = options?.leftBoundary ?? Math.min(this.fromPoint.x, this.toPoint.x) - offsetBoundaryX
    const rightBoundary = options?.rightBoundary ?? Math.max(this.fromPoint.x, this.toPoint.x) + offsetBoundaryX
    const downBoundary = options?.downBoundary ?? Math.min(this.fromPoint.y, this.toPoint.y) - offsetBoundaryY
    const upBoundary = options?.upBoundary ?? Math.max(this.fromPoint.y, this.toPoint.y) + offsetBoundaryY
    const knotsCount = options?.knotsCount ?? 2
    const distortionMean = options?.distortionMean ?? 1
    const distortionStDev = options?.distortionStDev ?? 1
    const distortionFrequency = options?.distortionFrequency ?? 0.5
    const tween = options?.tweening ?? easeOutQuad
    const targetPoints = options?.targetPoints ?? 100

    const internalKnots = this.generateInternalKnots(
      leftBoundary,
      rightBoundary,
      downBoundary,
      upBoundary,
      knotsCount
    )

    let points = this.generatePoints(internalKnots)
    points = this.distortPoints(points, distortionMean, distortionStDev, distortionFrequency)
    points = this.tweenPoints(points, tween, targetPoints)

    return points
  }

  /**
   * Generates internal knots randomly within boundaries
   */
  generateInternalKnots (
    lBoundary: number,
    rBoundary: number,
    dBoundary: number,
    uBoundary: number,
    knotsCount: number
  ): Vector[] {
    if (!this.checkIfNumeric(lBoundary) ||
        !this.checkIfNumeric(rBoundary) ||
        !this.checkIfNumeric(dBoundary) ||
        !this.checkIfNumeric(uBoundary)) {
      throw new Error('Boundaries must be numeric values')
    }

    if (!Number.isInteger(knotsCount) || knotsCount < 0) {
      knotsCount = 0
    }

    if (lBoundary > rBoundary) {
      throw new Error('left_boundary must be less than or equal to right_boundary')
    }

    if (dBoundary > uBoundary) {
      throw new Error('down_boundary must be less than or equal to upper_boundary')
    }

    const knots: Vector[] = []
    for (let i = 0; i < knotsCount; i++) {
      const x = Math.floor(Math.random() * (rBoundary - lBoundary + 1)) + lBoundary
      const y = Math.floor(Math.random() * (uBoundary - dBoundary + 1)) + dBoundary
      knots.push({ x, y })
    }

    return knots
  }

  /**
   * Generates points from Bezier curve using the knots
   */
  generatePoints (knots: Vector[]): Vector[] {
    if (!this.checkIfListOfPoints(knots)) {
      throw new Error('knots must be valid list of points')
    }

    const distance = Math.sqrt(
      Math.pow(this.toPoint.x - this.fromPoint.x, 2) + 
      Math.pow(this.toPoint.y - this.fromPoint.y, 2)
    )
    
    // Generate enough points to ensure smooth curve
    // Use 1 point per pixel of distance, minimum 50 points
    // This balances smoothness with performance
    const midPtsCnt = Math.max(
      Math.floor(distance),
      50
    )

    const allKnots = [this.fromPoint, ...knots, this.toPoint]
    return calculatePointsInCurve(midPtsCnt, allKnots)
  }

  /**
   * Distorts points by adding random noise
   */
  distortPoints (
    points: Vector[],
    distortionMean: number,
    distortionStDev: number,
    distortionFrequency: number
  ): Vector[] {
    if (!this.checkIfNumeric(distortionMean) ||
        !this.checkIfNumeric(distortionStDev) ||
        !this.checkIfNumeric(distortionFrequency)) {
      throw new Error('Distortions must be numeric')
    }

    if (!this.checkIfListOfPoints(points)) {
      throw new Error('points must be valid list of points')
    }

    if (distortionFrequency < 0 || distortionFrequency > 1) {
      throw new Error('distortion_frequency must be in range [0,1]')
    }

    const distorted: Vector[] = [points[0]]

    for (let i = 1; i < points.length - 1; i++) {
      const { x, y } = points[i]
      const delta = Math.random() < distortionFrequency
        ? this.randomNormal(distortionMean, distortionStDev)
        : 0
      distorted.push({ x, y: y + delta })
    }

    distorted.push(points[points.length - 1])
    return distorted
  }

  /**
   * Applies tweening to the points
   */
  tweenPoints (points: Vector[], tween: TweeningFunction, targetPoints: number): Vector[] {
    if (!this.checkIfListOfPoints(points)) {
      throw new Error('List of points not valid')
    }

    if (!Number.isInteger(targetPoints) || targetPoints < 2) {
      throw new Error('target_points must be an integer greater or equal to 2')
    }

    // If we already have the target number of points or fewer, just return them
    if (points.length <= targetPoints) {
      return [...points]
    }

    // Use tweening to determine the distribution, then interpolate between actual points
    const res: Vector[] = []
    
    for (let i = 0; i < targetPoints; i++) {
      // Explicitly preserve first and last points to avoid any floating point errors
      if (i === 0) {
        res.push({ ...points[0] })
        continue
      }
      if (i === targetPoints - 1) {
        res.push({ ...points[points.length - 1] })
        continue
      }
      
      const t = i / (targetPoints - 1)
      const tweenedT = tween(t)
      
      // Map tweened value to continuous index in points array
      const continuousIndex = tweenedT * (points.length - 1)
      const lowerIndex = Math.floor(continuousIndex)
      const upperIndex = Math.min(lowerIndex + 1, points.length - 1)
      const fraction = continuousIndex - lowerIndex
      
      // Linearly interpolate between the two nearest points
      const lowerPoint = points[lowerIndex]
      const upperPoint = points[upperIndex]
      
      const interpolated: Vector = {
        x: lowerPoint.x + (upperPoint.x - lowerPoint.x) * fraction,
        y: lowerPoint.y + (upperPoint.y - lowerPoint.y) * fraction
      }
      
      res.push(interpolated)
    }

    return res
  }

  /**
   * Generates a random number from a normal distribution
   */
  private randomNormal (mean: number, stdDev: number): number {
    // Box-Muller transform
    const u1 = Math.random()
    const u2 = Math.random()
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2)
    return z0 * stdDev + mean
  }

  /**
   * Checks if value is numeric
   */
  private checkIfNumeric (val: any): boolean {
    return typeof val === 'number' && !isNaN(val)
  }

  /**
   * Checks if list contains valid points
   */
  private checkIfListOfPoints (listOfPoints: any): boolean {
    if (!Array.isArray(listOfPoints)) {
      return false
    }

    try {
      return listOfPoints.every(p =>
        p != null &&
        typeof p === 'object' &&
        'x' in p &&
        'y' in p &&
        this.checkIfNumeric(p.x) &&
        this.checkIfNumeric(p.y)
      )
    } catch {
      return false
    }
  }
}
