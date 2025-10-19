import type { Vector } from './math'
import { type TweeningFunction, TWEEN_OPTIONS } from './tweening'

/**
 * Parameters for generating a random curve
 */
export interface RandomCurveParameters {
  offsetBoundaryX: number
  offsetBoundaryY: number
  knotsCount: number
  distortionMean: number
  distortionStDev: number
  distortionFrequency: number
  tween: TweeningFunction
  targetPoints: number
}

/**
 * Weighted random choice helper
 */
function weightedRandomChoice<T> (items: T[], weights: number[]): T {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  let random = Math.random() * totalWeight

  for (let i = 0; i < items.length; i++) {
    random -= weights[i]
    if (random <= 0) {
      return items[i]
    }
  }

  return items[items.length - 1]
}

/**
 * Random choice from range
 */
function randomFromRange (min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/**
 * Generates random parameters for the curve
 * Ported from humancursor Python implementation
 */
export async function generateRandomCurveParameters (
  preOrigin: Vector,
  postDestination: Vector
): Promise<RandomCurveParameters> {
  // Random tween selection
  const tween = TWEEN_OPTIONS[Math.floor(Math.random() * TWEEN_OPTIONS.length)]

  // Offset boundary X with weighted random selection
  // Python uses [0.2, 0.65, 15] which heavily favors the 75-99 range (~94.65%)
  const offsetBoundaryXRanges = [
    { min: 20, max: 44 },
    { min: 45, max: 74 },
    { min: 75, max: 99 }
  ]
  const offsetBoundaryXWeights = [0.2, 0.65, 15]
  const selectedXRange = weightedRandomChoice(offsetBoundaryXRanges, offsetBoundaryXWeights)
  let offsetBoundaryX = randomFromRange(selectedXRange.min, selectedXRange.max)

  // Offset boundary Y with weighted random selection
  // Python uses [0.2, 0.65, 15] which heavily favors the 75-99 range (~94.65%)
  const offsetBoundaryYRanges = [
    { min: 20, max: 44 },
    { min: 45, max: 74 },
    { min: 75, max: 99 }
  ]
  const offsetBoundaryYWeights = [0.2, 0.65, 15]
  const selectedYRange = weightedRandomChoice(offsetBoundaryYRanges, offsetBoundaryYWeights)
  let offsetBoundaryY = randomFromRange(selectedYRange.min, selectedYRange.max)

  // Knots count with weighted random selection
  const knotsOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  const knotsWeights = [0.15, 0.36, 0.17, 0.12, 0.08, 0.04, 0.03, 0.02, 0.015, 0.005]
  let knotsCount = weightedRandomChoice(knotsOptions, knotsWeights)

  // Distortion parameters
  const distortionMean = randomFromRange(80, 109) / 100
  const distortionStDev = randomFromRange(85, 109) / 100
  const distortionFrequency = randomFromRange(25, 69) / 100

  // Target points with weighted random selection - EXACTLY matches Python for web
  const targetPointsRanges = [
    { min: 35, max: 44 },  // range(35, 45)
    { min: 45, max: 59 },  // range(45, 60)
    { min: 60, max: 79 }   // range(60, 80)
  ]
  const targetPointsWeights = [0.53, 0.32, 0.15]
  const selectedPointsRange = weightedRandomChoice(targetPointsRanges, targetPointsWeights)
  let targetPoints = randomFromRange(selectedPointsRange.min, selectedPointsRange.max)

  // Calculate movement distance for relative boundaries
  const distance = Math.sqrt(
    Math.pow(postDestination.x - preOrigin.x, 2) +
    Math.pow(postDestination.y - preOrigin.y, 2)
  )
  
  // Always use natural curves - don't reduce boundaries based on position
  // The original logic created straight lines for edge movements
  // Instead, ensure minimum curve variation regardless of position
  const minBoundary = Math.max(30, distance * 0.15)
  offsetBoundaryX = Math.max(offsetBoundaryX, minBoundary)
  offsetBoundaryY = Math.max(offsetBoundaryY, minBoundary)
  
  // Ensure minimum knots for natural curves
  knotsCount = Math.max(knotsCount, 2)

  return {
    offsetBoundaryX,
    offsetBoundaryY,
    knotsCount,
    distortionMean,
    distortionStDev,
    distortionFrequency,
    tween,
    targetPoints
  }
}

/**
 * Calculates absolute offset from relative position
 */
export function calculateAbsoluteOffset (
  elementSize: { width: number, height: number },
  relativePosition: [number, number]
): [number, number] {
  const xFinal = Math.floor(elementSize.width * relativePosition[0])
  const yFinal = Math.floor(elementSize.height * relativePosition[1])
  return [xFinal, yFinal]
}
