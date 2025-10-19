/**
 * Basic vector and math utilities for humancursor
 */

export interface Vector {
  x: number
  y: number
}

export interface TimedVector extends Vector {
  timestamp: number
}

export const origin: Vector = { x: 0, y: 0 }

export const add = (a: Vector, b: Vector): Vector => ({ x: a.x + b.x, y: a.y + b.y })

export const scale = (value: number, range1: [number, number], range2: [number, number]): number =>
  (value - range1[0]) * (range2[1] - range2[0]) / (range1[1] - range1[0]) + range2[0]

export const clamp = (target: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, target))
