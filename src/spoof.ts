import type { ElementHandle, Page, CDPSession } from 'playwright'
import debug from 'debug'
import { type Vector, type TimedVector, origin, add, clamp, scale } from './math'
import { installMouseHelper } from './mouse-helper'
import { HumanizeMouseTrajectory } from './human-curve-generator'
import { generateRandomCurveParameters } from './calculate-and-randomize'

export { installMouseHelper }

const log = debug('ghost-cursor')

// Playwright BoundingBox type
export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface BoxOptions {
  /**
   * Percentage of padding to be added inside the element when determining the target point.
   * Example:
   * - `0` = may be anywhere within the element.
   * - `100` = will always be center of element.
   * @default 0
   */
  readonly paddingPercentage?: number
  /**
   * Destination to move the cursor to, relative to the top-left corner of the element.
   * If specified, `paddingPercentage` is not used.
   * If not specified (default), destination is random point within the `paddingPercentage`.
   * @default undefined (random point)
   */
  readonly destination?: Vector
}

export interface GetElementOptions {
  /**
   * Time to wait for the selector to appear in milliseconds.
   * Default is to not wait for selector.
   */
  readonly waitForSelector?: number
}

export interface ScrollOptions {
  /**
   * Scroll speed. 0 to 100. 100 is instant.
   * @default 100
   */
  readonly scrollSpeed?: number
  /**
   * Time to wait after scrolling.
   * @default 200
   */
  readonly scrollDelay?: number
}

export interface ScrollIntoViewOptions extends ScrollOptions, GetElementOptions {
  /**
   * Scroll speed (when scrolling occurs). 0 to 100. 100 is instant.
   * @default 100
   */
  readonly scrollSpeed?: number
  /**
   * Time to wait after scrolling (when scrolling occurs).
   * @default 200
   */
  readonly scrollDelay?: number
  /**
   * Margin (in px) to add around the element when ensuring it is in the viewport.
   * (Does not take effect if CDP scroll fails.)
   * @default 0
   */
  readonly inViewportMargin?: number
}

export interface MoveOptions extends BoxOptions, ScrollIntoViewOptions, Pick<PathOptions, 'moveSpeed'> {
  /**
   * Delay after moving the mouse in milliseconds. If `randomizeMoveDelay=true`, delay is randomized from 0 to `moveDelay`.
   * @default 0
   */
  readonly moveDelay?: number
  /**
   * Randomize delay between actions from `0` to `moveDelay`. See `moveDelay` docs.
   * @default true
   */
  readonly randomizeMoveDelay?: boolean
  /**
   * Maximum number of attempts to mouse-over the element.
   * @default 10
   */
  readonly maxTries?: number
  /**
   * Distance from current location to destination that triggers overshoot to
   * occur. (Below this distance, no overshoot will occur).
   * @default 500
   */
  readonly overshootThreshold?: number
}

export interface ClickOptions extends MoveOptions {
  /**
   * Delay before initiating the click action in milliseconds.
   * @default 0
   */
  readonly hesitate?: number
  /**
   * Delay between mousedown and mouseup in milliseconds.
   * @default 0
   */
  readonly waitForClick?: number
  /**
   * @default 2000
   */
  readonly moveDelay?: number
  /**
   * @default "left"
   */
  readonly button?: 'left' | 'right' | 'middle'
  /**
   * @default 1
   */
  readonly clickCount?: number
}

export interface PathOptions {
  /**
   * Override the spread of the generated path.
   */
  readonly spreadOverride?: number
  /**
   * Speed of mouse movement.
   * Default is random.
   */
  readonly moveSpeed?: number

  /**
   * Generate timestamps for each point in the path.
   */
  readonly useTimestamps?: boolean
}

export interface RandomMoveOptions extends Pick<MoveOptions, 'moveDelay' | 'randomizeMoveDelay' | 'moveSpeed'> {
  /**
   * @default 2000
   */
  readonly moveDelay?: number
}

export interface MoveToOptions extends PathOptions, Pick<MoveOptions, 'moveDelay' | 'randomizeMoveDelay'> {
  /**
   * @default 0
   */
  readonly moveDelay?: number
}

export type ScrollToDestination = Partial<Vector> | 'top' | 'bottom' | 'left' | 'right'

export interface GhostCursor {
  /** Toggles random mouse movements on or off. */
  toggleRandomMove: (random: boolean) => void
  /** Simulates a mouse click at the specified selector or element. */
  click: (selector?: string | ElementHandle, options?: ClickOptions) => Promise<void>
  /** Moves the mouse to the specified selector or element. */
  move: (selector: string | ElementHandle, options?: MoveOptions) => Promise<void>
  /** Moves the mouse to the specified destination point. */
  moveTo: (destination: Vector, options?: MoveToOptions) => Promise<void>
  /** Scrolls the element into view. If already in view, no scroll occurs. */
  scrollIntoView: (selector: ElementHandle, options?: ScrollIntoViewOptions) => Promise<void>
  /** Scrolls to the specified destination point. */
  scrollTo: (destination: ScrollToDestination, options?: ScrollOptions) => Promise<void>
  /** Scrolls the page the distance set by `delta`. */
  scroll: (delta: Partial<Vector>, options?: ScrollOptions) => Promise<void>
  /** Gets the element via a selector. Can use an XPath. */
  getElement: (selector: string | ElementHandle, options?: GetElementOptions) => Promise<ElementHandle<Element>>
  /** Get current location of the cursor. */
  getLocation: () => Vector
  /**
   * Make the cursor no longer visible.
   * Defined only if `visible=true` was passed.
   */
  removeMouseHelper?: Promise<() => Promise<void>>
}

/** Helper function to wait a specified number of milliseconds  */
const delay = async (ms: number): Promise<void> => {
  if (ms < 1) return
  return await new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Performs momentum-based wheel scrolling with easing for human-like behavior
 */
async function momentumWheelScroll(
  page: Page,
  x: number,
  y: number,
  duration: number = 600
): Promise<void> {
  const startTime = Date.now()
  // Add slight randomness to interval for more human-like behavior (14-18ms instead of fixed 16ms)
  const baseInterval = 16
  let nextTickTime = startTime

  return await new Promise<void>((resolve) => {
    const scheduleNextTick = (): void => {
      const elapsed = Date.now() - startTime
      const t = Math.min(elapsed / duration, 1)

      // Ease-out cubic → fast start, slow finish
      const ease = 1 - Math.pow(1 - t, 3)

      // Compute target scroll delta at this point in time
      const targetX = x * ease
      const targetY = y * ease

      // Compute incremental delta since last tick
      const prevT = Math.max(0, t - baseInterval / duration)
      const prevEase = 1 - Math.pow(1 - prevT, 3)
      const prevTargetX = x * prevEase
      const prevTargetY = y * prevEase
      const dx = targetX - prevTargetX
      const dy = targetY - prevTargetY

      page.mouse.wheel(dx, dy).catch(() => {}) // Fire and forget, don't block

      if (t >= 1) {
        resolve()
      } else {
        // Randomize next interval slightly (±2ms) for human-like variation
        const randomizedInterval = baseInterval + (Math.random() * 4 - 2)
        nextTickTime += randomizedInterval
        const delay = Math.max(0, nextTickTime - Date.now())
        setTimeout(scheduleNextTick, delay)
      }
    }
    
    scheduleNextTick()
  })
}

/** Get a random point on a box */
const getRandomBoxPoint = ({ x, y, width, height }: BoundingBox, options?: Pick<BoxOptions, 'paddingPercentage'>): Vector => {
  // Python uses range(20, 80) which is 20-79, so 0.20 to 0.79
  // This gives a 60% range centered in the element, avoiding edges
  const xRandomOffset = (Math.floor(Math.random() * 60) + 20) / 100 // 0.20 to 0.79
  const yRandomOffset = (Math.floor(Math.random() * 60) + 20) / 100 // 0.20 to 0.79

  let _paddingWidth = 0
  let _paddingHeight = 0

  if (options?.paddingPercentage !== undefined && options?.paddingPercentage > 0 && options?.paddingPercentage <= 100) {
    _paddingWidth = (width * options.paddingPercentage) / 100
    _paddingHeight = (height * options.paddingPercentage) / 100
  }

  return {
    x: x + (width * xRandomOffset),
    y: y + (height * yRandomOffset)
  }
}

/** Get the CDP session for Playwright */
export const getCDPClient = async (page: Page): Promise<CDPSession> => await page.context().newCDPSession(page)

/** Get a random point on a browser window */
export const getRandomPagePoint = async (page: Page): Promise<Vector> => {
  const viewport = page.viewportSize()
  if (viewport == null) {
    return { x: 0, y: 0 }
  }
  return getRandomBoxPoint({
    x: origin.x,
    y: origin.y,
    width: viewport.width,
    height: viewport.height
  })
}

/** Get correct position of elements. Uses Playwright's boundingBox method. */
export const getElementBox = async (page: Page, element: ElementHandle, relativeToMainFrame: boolean = true): Promise<BoundingBox> => {
  try {
    const elementBox = await element.boundingBox()
    if (elementBox === null) throw new Error('Element boundingBox is null, falling back to getBoundingClientRect')
    return elementBox
  } catch {
    log('BoundingBox null, using getBoundingClientRect')
    return await element.evaluate((el: Element) => el.getBoundingClientRect() as BoundingBox)
  }
}

/**
 * Generates a set of points for mouse movement between two coordinates.
 * @deprecated This function is deprecated. Path generation now happens internally using humancursor logic.
 * For external use, consider using the cursor methods directly (move, moveTo, etc.)
 */
export function path(
  start: Vector,
  end: Vector | BoundingBox,
  /** Additional options for generating the path. Can also be a number which will set `spreadOverride`. */
  options?: number | PathOptions
): Vector[] | TimedVector[] {
  // Simple fallback path generation for backward compatibility
  // This is a basic linear interpolation since the old bezier logic has been removed
  const optionsResolved: PathOptions = typeof options === 'number' ? { spreadOverride: options } : { ...options }
  const endPoint: Vector = 'width' in end ? { x: end.x, y: end.y } : end

  const steps = 50 // Default number of steps
  const vectors: Vector[] = []

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    vectors.push({
      x: start.x + (endPoint.x - start.x) * t,
      y: start.y + (endPoint.y - start.y) * t
    })
  }

  return clampPositive(vectors, optionsResolved)
}

/** Generates a set of points for mouse movement using humancursor logic with random parameters. */
async function pathWithHumanCurve(
  page: Page,
  start: Vector,
  end: Vector | BoundingBox,
  options?: number | PathOptions
): Promise<Vector[] | TimedVector[]> {
  const optionsResolved: PathOptions = typeof options === 'number' ? { spreadOverride: options } : { ...options }
  const endPoint: Vector = 'width' in end ? { x: end.x, y: end.y } : end

  // Generate random curve parameters
  const params = await generateRandomCurveParameters(page, start, endPoint)

  // Use spreadOverride if provided, otherwise use generated parameters
  const offsetBoundaryX = optionsResolved.spreadOverride ?? params.offsetBoundaryX
  const offsetBoundaryY = optionsResolved.spreadOverride ?? params.offsetBoundaryY

  const humanCurve = new HumanizeMouseTrajectory(start, endPoint, {
    offsetBoundaryX,
    offsetBoundaryY,
    knotsCount: params.knotsCount,
    distortionMean: params.distortionMean,
    distortionStDev: params.distortionStDev,
    distortionFrequency: params.distortionFrequency,
    tweening: params.tween,
    targetPoints: params.targetPoints
  })

  return clampPositive(humanCurve.points, optionsResolved)
}

const clampPositive = (vectors: Vector[], options?: PathOptions): Vector[] | TimedVector[] => {
  const clampedVectors = vectors.map(vector => ({
    x: Math.max(0, vector.x),
    y: Math.max(0, vector.y)
  }))

  return options?.useTimestamps === true ? generateTimestamps(clampedVectors, options) : clampedVectors
}

const generateTimestamps = (vectors: Vector[], options?: PathOptions): TimedVector[] => {
  const speed = options?.moveSpeed ?? 1.0
  const timedVectors: TimedVector[] = []
  const startTime = Date.now()

  for (let i = 0; i < vectors.length; i++) {
    if (i === 0) {
      timedVectors.push({ ...vectors[i], timestamp: startTime })
    } else {
      // Calculate distance between points
      const prev = vectors[i - 1]
      const curr = vectors[i]
      const distance = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2))

      // Simple time calculation based on distance and speed
      const timeIncrement = Math.round((distance / speed) * 2)

      timedVectors.push({
        ...vectors[i],
        timestamp: timedVectors[i - 1].timestamp + timeIncrement
      })
    }
  }

  return timedVectors
}

const intersectsElement = (vec: Vector, box: BoundingBox): boolean => {
  return vec.x > box.x && vec.x <= box.x + box.width && vec.y > box.y && vec.y <= box.y + box.height
}

export const createCursor = (
  page: Page,
  /**
   * Cursor start position.
   * @default { x: 0, y: 0 }
   */
  start: Vector = origin,
  /**
   * Initially perform random movements.
   * If `move`,`click`, etc. is performed, these random movements end.
   * @default false
   */
  performRandomMoves: boolean = false,
  defaultOptions: {
    /**
     * Default options for the `randomMove` function that occurs when `performRandomMoves=true`
     * @default RandomMoveOptions
     */
    randomMove?: RandomMoveOptions
    /**
     * Default options for the `move` function
     * @default MoveOptions
     */
    move?: MoveOptions
    /**
     * Default options for the `moveTo` function
     * @default MoveToOptions
     */
    moveTo?: MoveToOptions
    /**
     * Default options for the `click` function
     * @default ClickOptions
     */
    click?: ClickOptions
    /**
     * Default options for the `scrollIntoView`, `scrollTo`, and `scroll` functions
     * @default ScrollIntoViewOptions
     */
    scroll?: ScrollOptions & ScrollIntoViewOptions
    /**
     * Default options for the `getElement` function
     * @default GetElementOptions
     */
    getElement?: GetElementOptions
  } = {},
  visible: boolean = false
): GhostCursor => {
  let previous: Vector = start

  // Initial state: mouse is not moving
  let moving: boolean = false

  // Initialize the actual mouse position to match the start position
  // This MUST complete before any movements to prevent teleporting from (0,0)
  // We make this synchronous by immediately moving the mouse
  page.mouse.move(start.x, start.y).catch(() => {})

  /** Move the mouse over a number of vectors */
  const tracePath = async (vectors: Iterable<Vector | TimedVector>, abortOnMove: boolean = false): Promise<void> => {
    const vectorArray = Array.from(vectors)
    if (vectorArray.length === 0) return

    for (const v of vectorArray) {
      try {
        if (abortOnMove && moving) {
          return
        }

        // Move directly to each point without interpolation
        // Our curve already has enough points for smooth movement
        await page.mouse.move(v.x, v.y)
        previous = v
      } catch (error) {
        if (page.isClosed()) return
        log('Warning: could not move mouse, error message:', error)
      }
    }
  }
  /** Start random mouse movements. Function recursively calls itself. */
  const randomMove = async (options?: RandomMoveOptions): Promise<void> => {
    const optionsResolved = {
      moveDelay: 2000,
      randomizeMoveDelay: true,
      ...defaultOptions?.randomMove,
      ...options
    } satisfies RandomMoveOptions

    try {
      if (!moving) {
        const rand = await getRandomPagePoint(page)
        const pathPoints = await pathWithHumanCurve(page, previous, rand, optionsResolved)
        await tracePath(pathPoints, true)
        // Don't set previous = rand here! tracePath already updated previous to the actual last point
      }
      await delay(optionsResolved.moveDelay * (optionsResolved.randomizeMoveDelay ? Math.random() : 1))
      randomMove(options).then(
        _ => { },
        _ => { }
      ) // fire and forget, recursive function
    } catch (_) {
      log('Warning: stopping random mouse movements')
    }
  }

  const actions: GhostCursor = {
    /** Toggles random mouse movements on or off. */
    toggleRandomMove(random: boolean): void {
      moving = !random
    },

    /** Get current location of the cursor. */
    getLocation(): Vector {
      return previous
    },

    /** Simulates a mouse click at the specified selector or element. */
    async click(selector?: string | ElementHandle, options?: ClickOptions): Promise<void> {
      const optionsResolved = {
        moveDelay: 50 + Math.random() * 100, // 50-150ms delay for human-like pacing
        hesitate: 0,
        waitForClick: 0,
        randomizeMoveDelay: false, // Already randomized above
        button: 'left',
        clickCount: 1,
        ...defaultOptions?.click,
        ...options
      } satisfies ClickOptions

      const wasRandom = !moving
      actions.toggleRandomMove(false)

      if (selector !== undefined) {
        await actions.move(selector, {
          ...optionsResolved,
          // apply moveDelay after click, but not after actual move
          moveDelay: 0
        })
      }

      try {
        await delay(optionsResolved.hesitate)

        await page.mouse.click(previous.x, previous.y, {
          button: optionsResolved.button,
          clickCount: optionsResolved.clickCount,
          delay: optionsResolved.waitForClick
        })
      } catch (error) {
        log('Warning: could not click mouse, error message:', error)
      }

      await delay(optionsResolved.moveDelay * (optionsResolved.randomizeMoveDelay ? Math.random() : 1))

      actions.toggleRandomMove(wasRandom)
    },

    /** Moves the mouse to the specified selector or element. */
    async move(selector: string | ElementHandle, options?: MoveOptions): Promise<void> {
      const optionsResolved = {
        moveDelay: 0,
        maxTries: 10,
        randomizeMoveDelay: true,
        ...defaultOptions?.move,
        ...options
      } satisfies MoveOptions

      const wasRandom = !moving

      const go = async (iteration: number): Promise<void> => {
        if (iteration > optionsResolved.maxTries) {
          throw Error('Could not mouse-over element within enough tries')
        }

        actions.toggleRandomMove(false)

        const elem = await this.getElement(selector, optionsResolved)

        // Check if element is in viewport BEFORE scrolling
        // This avoids unnecessary scroll operations
        const _box = await getElementBox(page, elem)
        
        // Only scroll if element is not fully visible in viewport
        await this.scrollIntoView(elem, optionsResolved)

        // Get box again after potential scroll (position may have changed)
        const boxAfterScroll = await getElementBox(page, elem)
        
        // Check if cursor is already within the element bounds
        const alreadyInElement = intersectsElement(previous, boxAfterScroll)
        
        // If already in element and no specific destination, skip movement to avoid zigzag
        // Otherwise, get destination point (random or specified)
        const destination = optionsResolved.destination !== undefined 
          ? add(boxAfterScroll, optionsResolved.destination) 
          : (alreadyInElement ? previous : getRandomBoxPoint(boxAfterScroll, optionsResolved))

        // Skip movement if already very close to destination (within 5px)
        const distance = Math.sqrt(Math.pow(destination.x - previous.x, 2) + Math.pow(destination.y - previous.y, 2))
        if (distance > 5) {
          const pathPoints = await pathWithHumanCurve(page, previous, destination, optionsResolved)
          await tracePath(pathPoints)
        } else {
          // Even if we skip movement, update previous to destination
          // Otherwise next movement will start from wrong position
          previous = destination
        }
        // tracePath updates previous for each point, or we updated it above if skipped

        actions.toggleRandomMove(true)

        const newBoundingBox = await getElementBox(page, elem)

        // It's possible that the element that is being moved towards
        // has moved to a different location by the time
        // the the time the mouseover animation finishes
        if (!intersectsElement(destination, newBoundingBox)) {
          return await go(iteration + 1)
        }
      }
      await go(0)

      actions.toggleRandomMove(wasRandom)

      await delay(optionsResolved.moveDelay * (optionsResolved.randomizeMoveDelay ? Math.random() : 1))
    },

    /** Moves the mouse to the specified destination point. */
    async moveTo(destination: Vector, options?: MoveToOptions): Promise<void> {
      const optionsResolved = {
        moveDelay: 0,
        randomizeMoveDelay: true,
        ...defaultOptions?.moveTo,
        ...options
      } satisfies MoveToOptions

      const wasRandom = !moving
      actions.toggleRandomMove(false)
      
      // Skip movement if already very close to destination (within 5px)
      const distance = Math.sqrt(Math.pow(destination.x - previous.x, 2) + Math.pow(destination.y - previous.y, 2))
      if (distance > 5) {
        const pathPoints = await pathWithHumanCurve(page, previous, destination, optionsResolved)
        await tracePath(pathPoints)
      } else {
        // Even if we skip movement, update previous to destination
        previous = destination
      }
      // tracePath updates previous for each point, or we updated it above if skipped
      actions.toggleRandomMove(wasRandom)

      await delay(optionsResolved.moveDelay * (optionsResolved.randomizeMoveDelay ? Math.random() : 1))
    },

    /** Scrolls the element into view. If already in view, no scroll occurs. */
    async scrollIntoView(selector: string | ElementHandle, options?: ScrollIntoViewOptions): Promise<void> {
      const optionsResolved = {
        scrollDelay: 200,
        scrollSpeed: 100,
        inViewportMargin: 0,
        ...defaultOptions?.scroll,
        ...options
      } satisfies ScrollIntoViewOptions

      const _scrollSpeed = clamp(optionsResolved.scrollSpeed, 1, 100)

      const elem = await this.getElement(selector, optionsResolved)

      const { viewportWidth, viewportHeight, docHeight, docWidth, scrollPositionTop, scrollPositionLeft } = await page.evaluate(() => ({
        viewportWidth: document.body.clientWidth,
        viewportHeight: document.body.clientHeight,
        docHeight: document.body.scrollHeight,
        docWidth: document.body.scrollWidth,
        scrollPositionTop: window.scrollY,
        scrollPositionLeft: window.scrollX
      }))

      const elemBoundingBox = await getElementBox(page, elem) // is relative to viewport
      const elemBox = {
        top: elemBoundingBox.y,
        left: elemBoundingBox.x,
        bottom: elemBoundingBox.y + elemBoundingBox.height,
        right: elemBoundingBox.x + elemBoundingBox.width
      }

      // Add margin around the element
      const marginedBox = {
        top: elemBox.top - optionsResolved.inViewportMargin,
        left: elemBox.left - optionsResolved.inViewportMargin,
        bottom: elemBox.bottom + optionsResolved.inViewportMargin,
        right: elemBox.right + optionsResolved.inViewportMargin
      }

      // Get position relative to the whole document
      const marginedBoxRelativeToDoc = {
        top: marginedBox.top + scrollPositionTop,
        left: marginedBox.left + scrollPositionLeft,
        bottom: marginedBox.bottom + scrollPositionTop,
        right: marginedBox.right + scrollPositionLeft
      }

      // Convert back to being relative to the viewport-- though if box with margin added goes outside
      // the document, restrict to being *within* the document.
      // This makes it so that when element is on the edge of window scroll, isInViewport=true even after
      // margin was added.
      const targetBox = {
        top: Math.max(marginedBoxRelativeToDoc.top, 0) - scrollPositionTop,
        left: Math.max(marginedBoxRelativeToDoc.left, 0) - scrollPositionLeft,
        bottom: Math.min(marginedBoxRelativeToDoc.bottom, docHeight) - scrollPositionTop,
        right: Math.min(marginedBoxRelativeToDoc.right, docWidth) - scrollPositionLeft
      }

      const { top, left, bottom, right } = targetBox

      const isInViewport = top >= 0 && left >= 0 && bottom <= viewportHeight && right <= viewportWidth

      if (isInViewport) return

      const manuallyScroll = async (): Promise<void> => {
        let deltaY: number = 0
        let deltaX: number = 0

        if (top < 0) {
          deltaY = top // Scroll up
        } else if (bottom > viewportHeight) {
          deltaY = bottom - viewportHeight // Scroll down
        }

        if (left < 0) {
          deltaX = left // Scroll left
        } else if (right > viewportWidth) {
          deltaX = right - viewportWidth // Scroll right
        }

        // Add random padding for more human-like scrolling (humans don't scroll perfectly)
        // Scale padding based on scroll distance to avoid over-scrolling
        const scrollDistanceY = Math.abs(deltaY)
        const scrollDistanceX = Math.abs(deltaX)
        
        // Use smaller padding for small scrolls, larger for big scrolls (max ±50px)
        const paddingScaleY = Math.min(scrollDistanceY * 0.1, 50)
        const paddingScaleX = Math.min(scrollDistanceX * 0.1, 50)
        
        const randomPaddingY = (Math.random() * 2 - 1) * paddingScaleY // -paddingScaleY to +paddingScaleY
        const randomPaddingX = (Math.random() * 2 - 1) * paddingScaleX // -paddingScaleX to +paddingScaleX

        await this.scroll({
          x: deltaX + randomPaddingX,
          y: deltaY + randomPaddingY
        }, optionsResolved)
      }

      try {
        // Always use manual scroll for human-like momentum behavior
        // Never use scrollIntoViewIfNeeded as it teleports instantly
        await manuallyScroll()
      } catch (e) {
        // use regular JS scroll method as a fallback
        log('Falling back to JS scroll method', e)
        await elem.evaluate((e: Element) => {
          e.scrollIntoView({
            block: 'center',
            // Always use smooth behavior to avoid instant teleport
            behavior: 'smooth'
          })
        })
      }
    },

    /** Scrolls the page the distance set by `delta`. */
    async scroll(delta: Partial<Vector>, options?: ScrollOptions) {
      const optionsResolved = {
        scrollDelay: 200,
        scrollSpeed: 100,
        ...defaultOptions?.scroll,
        ...options
      } satisfies ScrollOptions

      const scrollSpeed = clamp(optionsResolved.scrollSpeed, 1, 100)
      const deltaX = delta.x ?? 0
      const deltaY = delta.y ?? 0

      // Calculate duration based on scrollSpeed (inverse relationship)
      // scrollSpeed 100 = 300ms, scrollSpeed 1 = 2000ms
      const duration = scale(scrollSpeed, [1, 100], [2000, 300])

      // Use momentum-based scrolling for human-like behavior
      await momentumWheelScroll(page, deltaX, deltaY, duration)

      await delay(optionsResolved.scrollDelay)
    },

    /** Scrolls to the specified destination point. */
    async scrollTo(destination: ScrollToDestination, options?: ScrollOptions) {
      const optionsResolved = {
        scrollDelay: 200,
        scrollSpeed: 100,
        ...defaultOptions?.scroll,
        ...options
      } satisfies ScrollOptions

      const { docHeight, docWidth, scrollPositionTop, scrollPositionLeft } = await page.evaluate(() => ({
        docHeight: document.body.scrollHeight,
        docWidth: document.body.scrollWidth,
        scrollPositionTop: window.scrollY,
        scrollPositionLeft: window.scrollX
      }))

      const to = ((): Partial<Vector> => {
        switch (destination) {
          case 'top':
            return { y: 0 }
          case 'bottom':
            return { y: docHeight }
          case 'left':
            return { x: 0 }
          case 'right':
            return { x: docWidth }
          default:
            return destination
        }
      })()

      await this.scroll(
        {
          y: to.y !== undefined ? to.y - scrollPositionTop : 0,
          x: to.x !== undefined ? to.x - scrollPositionLeft : 0
        },
        optionsResolved
      )
    },

    /** Gets the element via a selector. Can use an XPath. */
    async getElement(selector: string | ElementHandle, options?: GetElementOptions): Promise<ElementHandle<Element>> {
      const optionsResolved = {
        ...defaultOptions?.getElement,
        ...options
      } satisfies GetElementOptions

      let elem: ElementHandle<Element> | null = null
      if (typeof selector === 'string') {
        if (selector.startsWith('//') || selector.startsWith('(//')) {
          if (optionsResolved.waitForSelector !== undefined) {
            await page.waitForSelector(`xpath=${selector}`, { timeout: optionsResolved.waitForSelector })
          }
          elem = await page.$(`xpath=${selector}`)
        } else {
          if (optionsResolved.waitForSelector !== undefined) {
            await page.waitForSelector(selector, { timeout: optionsResolved.waitForSelector })
          }
          elem = await page.$(selector)
        }
        if (elem === null) {
          throw new Error(`Could not find element with selector "${selector}", make sure you're waiting for the elements by specifying "waitForSelector"`)
        }
      } else {
        // ElementHandle
        elem = selector as ElementHandle<Element>
      }
      return elem
    }
  }

  /**
   * Make the cursor no longer visible.
   * Defined only if `visible=true` was passed.
   */
  actions.removeMouseHelper = visible ? installMouseHelper(page).then(result => result.removeMouseHelper) : undefined

  // Start random mouse movements. Do not await the promise but return immediately
  if (performRandomMoves) {
    randomMove().then(
      _ => { },
      _ => { }
    )
  }

  return actions
}
