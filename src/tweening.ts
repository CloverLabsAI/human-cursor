/**
 * Easing/tweening functions similar to pytweening
 * Ported from humancursor Python implementation
 */

export type TweeningFunction = (t: number) => number

export const linear: TweeningFunction = (t: number): number => t

export const easeInQuad: TweeningFunction = (t: number): number => t * t

export const easeOutQuad: TweeningFunction = (t: number): number => t * (2 - t)

export const easeInOutQuad: TweeningFunction = (t: number): number => {
  if (t < 0.5) return 2 * t * t
  return -1 + (4 - 2 * t) * t
}

export const easeInCubic: TweeningFunction = (t: number): number => t * t * t

export const easeOutCubic: TweeningFunction = (t: number): number => {
  const t1 = t - 1
  return t1 * t1 * t1 + 1
}

export const easeInOutCubic: TweeningFunction = (t: number): number => {
  if (t < 0.5) return 4 * t * t * t
  const t1 = 2 * t - 2
  return (t1 * t1 * t1 + 2) / 2
}

export const easeInQuart: TweeningFunction = (t: number): number => t * t * t * t

export const easeOutQuart: TweeningFunction = (t: number): number => {
  const t1 = t - 1
  return 1 - t1 * t1 * t1 * t1
}

export const easeInOutQuart: TweeningFunction = (t: number): number => {
  if (t < 0.5) return 8 * t * t * t * t
  const t1 = t - 1
  return 1 - 8 * t1 * t1 * t1 * t1
}

export const easeInQuint: TweeningFunction = (t: number): number => t * t * t * t * t

export const easeOutQuint: TweeningFunction = (t: number): number => {
  const t1 = t - 1
  return 1 + t1 * t1 * t1 * t1 * t1
}

export const easeInOutQuint: TweeningFunction = (t: number): number => {
  if (t < 0.5) return 16 * t * t * t * t * t
  const t1 = t - 1
  return 1 + 16 * t1 * t1 * t1 * t1 * t1
}

export const easeInSine: TweeningFunction = (t: number): number => {
  return 1 - Math.cos((t * Math.PI) / 2)
}

export const easeOutSine: TweeningFunction = (t: number): number => {
  return Math.sin((t * Math.PI) / 2)
}

export const easeInOutSine: TweeningFunction = (t: number): number => {
  return -(Math.cos(Math.PI * t) - 1) / 2
}

export const easeInExpo: TweeningFunction = (t: number): number => {
  return t === 0 ? 0 : Math.pow(2, 10 * t - 10)
}

export const easeOutExpo: TweeningFunction = (t: number): number => {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

export const easeInOutExpo: TweeningFunction = (t: number): number => {
  if (t === 0) return 0
  if (t === 1) return 1
  if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2
  return (2 - Math.pow(2, -20 * t + 10)) / 2
}

export const easeInCirc: TweeningFunction = (t: number): number => {
  return 1 - Math.sqrt(1 - Math.pow(t, 2))
}

export const easeOutCirc: TweeningFunction = (t: number): number => {
  return Math.sqrt(1 - Math.pow(t - 1, 2))
}

export const easeInOutCirc: TweeningFunction = (t: number): number => {
  if (t < 0.5) {
    return (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
  }
  return (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2
}

/**
 * Array of all available tweening functions
 */
export const TWEEN_OPTIONS: TweeningFunction[] = [
  easeOutExpo,
  easeInOutQuint,
  easeInOutSine,
  easeInOutQuart,
  easeInOutExpo,
  easeInOutCubic,
  easeInOutCirc,
  linear,
  easeOutSine,
  easeOutQuart,
  easeOutQuint,
  easeOutCubic,
  easeOutCirc
]
