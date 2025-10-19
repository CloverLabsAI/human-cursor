import { HumanizeMouseTrajectory } from '../human-curve-generator'
import { calculatePointsInCurve } from '../bezier-calculator'
import { easeOutQuad, TWEEN_OPTIONS } from '../tweening'

// Simple unit tests that don't require browser
describe('HumanCursor Integration Tests', () => {
  describe('BezierCalculator', () => {
    it('should calculate points in a curve', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 50, y: 50 },
        { x: 100, y: 0 }
      ]
      const result = calculatePointsInCurve(10, points)
      
      expect(result).toHaveLength(10)
      expect(result[0]).toEqual({ x: 0, y: 0 })
      expect(result[result.length - 1]).toEqual({ x: 100, y: 0 })
    })
  })

  describe('Tweening Functions', () => {
    it('should have multiple tween options', () => {
      expect(TWEEN_OPTIONS.length).toBeGreaterThan(0)
    })

    it('should return correct values for easeOutQuad', () => {
      expect(easeOutQuad(0)).toBe(0)
      expect(easeOutQuad(1)).toBe(1)
      expect(easeOutQuad(0.5)).toBeGreaterThan(0)
      expect(easeOutQuad(0.5)).toBeLessThan(1)
    })
  })

  describe('HumanizeMouseTrajectory', () => {
    it('should generate a curve with default options', () => {
      const from = { x: 0, y: 0 }
      const to = { x: 100, y: 100 }
      
      const trajectory = new HumanizeMouseTrajectory(from, to)
      
      expect(trajectory.points).toBeDefined()
      expect(trajectory.points.length).toBeGreaterThan(0)
      expect(trajectory.fromPoint).toEqual(from)
      expect(trajectory.toPoint).toEqual(to)
    })

    it('should generate a curve with custom options', () => {
      const from = { x: 0, y: 0 }
      const to = { x: 200, y: 200 }
      
      const trajectory = new HumanizeMouseTrajectory(from, to, {
        offsetBoundaryX: 50,
        offsetBoundaryY: 50,
        knotsCount: 3,
        targetPoints: 50
      })
      
      expect(trajectory.points).toBeDefined()
      expect(trajectory.points.length).toBe(50)
    })

    it('should generate steady movements', () => {
      const from = { x: 0, y: 0 }
      const to = { x: 100, y: 100 }
      
      const trajectory = new HumanizeMouseTrajectory(from, to, {
        offsetBoundaryX: 10,
        offsetBoundaryY: 10,
        distortionMean: 1.2,
        distortionStDev: 1.2,
        distortionFrequency: 1
      })
      
      expect(trajectory.points).toBeDefined()
      expect(trajectory.points.length).toBeGreaterThan(0)
    })

    it('should handle short distances', () => {
      const from = { x: 0, y: 0 }
      const to = { x: 10, y: 10 }
      
      const trajectory = new HumanizeMouseTrajectory(from, to)
      
      expect(trajectory.points).toBeDefined()
      expect(trajectory.points.length).toBeGreaterThan(0)
    })

    it('should handle long distances', () => {
      const from = { x: 0, y: 0 }
      const to = { x: 1000, y: 1000 }
      
      const trajectory = new HumanizeMouseTrajectory(from, to)
      
      expect(trajectory.points).toBeDefined()
      expect(trajectory.points.length).toBeGreaterThan(0)
    })
  })
})
