# HumanCursor Logic Migration

This document describes the migration of Python `humancursor` logic to JavaScript/TypeScript for the `ghost-cursor` module.

## Overview

The Python `humancursor` library's logic has been converted to TypeScript and integrated behind the existing `GhostCursor` interface. All public APIs and types remain unchanged, but the internal path generation now uses more human-like mouse movements based on the humancursor algorithm.

## New Files Created

### 1. `src/bezier-calculator.ts`
- **Purpose**: Bezier curve calculations using Bernstein polynomials
- **Key Functions**:
  - `calculatePointsInCurve(n, points)`: Generates n points along a Bezier curve defined by control points
  - `binomial(n, k)`: Calculates binomial coefficients
  - `bernsteinPolynomial(points)`: Creates a Bernstein polynomial function from control points

### 2. `src/tweening.ts`
- **Purpose**: Easing/tweening functions for smooth animations
- **Key Exports**:
  - Multiple easing functions: `linear`, `easeInQuad`, `easeOutQuad`, `easeInOutQuad`, `easeInCubic`, `easeOutCubic`, etc.
  - `TWEEN_OPTIONS`: Array of all available tweening functions for random selection
- **Ported from**: Python `pytweening` library

### 3. `src/human-curve-generator.ts`
- **Purpose**: Generates human-like mouse trajectory curves
- **Key Class**: `HumanizeMouseTrajectory`
  - Generates curves with internal knots for natural movement
  - Applies distortion to simulate human imperfection
  - Supports tweening for smooth acceleration/deceleration
- **Options**:
  - `offsetBoundaryX/Y`: Boundary offsets for curve generation
  - `knotsCount`: Number of internal control points
  - `distortionMean/StDev/Frequency`: Parameters for adding natural variation
  - `tweening`: Easing function to use
  - `targetPoints`: Number of points in the final curve

### 4. `src/calculate-and-randomize.ts`
- **Purpose**: Random parameter generation for human-like curves
- **Key Function**: `generateRandomCurveParameters(page, start, end)`
  - Generates randomized parameters based on viewport size
  - Uses weighted random selection for realistic variation
  - Adjusts complexity based on cursor position (simpler near edges)
- **Returns**: `RandomCurveParameters` object with all curve generation settings

## Modified Files

### `src/spoof.ts`
The main integration file was updated with:

1. **New Imports**:
   ```typescript
   import { HumanizeMouseTrajectory } from './human-curve-generator'
   import { generateRandomCurveParameters } from './calculate-and-randomize'
   ```

2. **Removed Old Logic**:
   - Removed `fitts()` function (Fitts's law calculation)
   - Removed `shouldOvershoot()` and overshoot behavior
   - Removed old `bezierCurve()` usage from path generation
   - Removed `OVERSHOOT_SPREAD` and `OVERSHOOT_RADIUS` constants
   - Simplified `generateTimestamps()` to not use old bezier speed calculations

3. **New Function**: `pathWithHumanCurve()`
   - Async function that generates paths using humancursor logic
   - Uses random parameters from `generateRandomCurveParameters()`
   - Respects existing options like `spreadOverride`

4. **Updated Functions**:
   - `randomMove()`: Now uses `pathWithHumanCurve()` for random movements
   - `move()`: Updated to use `pathWithHumanCurve()`, removed overshoot logic
   - `moveTo()`: Updated to use `pathWithHumanCurve()` for direct coordinate movements
   - `path()`: Deprecated, now uses simple linear interpolation for backward compatibility

5. **No New Configuration Options**:
   - All existing options remain unchanged
   - The humancursor logic is now the default and only path generation method
   - Existing options like `spreadOverride` and `moveSpeed` continue to work as before
   - `overshootThreshold` option is still accepted but no longer used

## Key Differences from Original ghost-cursor

### Before (Original Bezier Curve)
- Used simple Bezier curves with 2 anchor points
- Anchor points generated using perpendicular vectors
- Fixed spread based on distance
- Fitts's law for timing

### After (HumanCursor Logic)
- Uses Bernstein polynomial-based Bezier curves with multiple internal knots (1-10, weighted random)
- Knots placed randomly within boundaries
- Distortion applied to simulate human imperfection
- Tweening functions for natural acceleration/deceleration
- Weighted random parameter selection for all curve properties
- Viewport-aware complexity adjustment (simpler curves near edges)
- No overshoot behavior (natural curves handle this implicitly)
- Distance-based timing instead of Fitts's law

## Backward Compatibility

✅ **All existing APIs remain unchanged**
- `GhostCursor` interface is identical
- All function signatures are the same
- All options interfaces are unchanged (no new options added)
- The original `path()` function is preserved for external use
- Only the internal path generation algorithm has changed

## Usage Examples

### Basic Usage
```typescript
import { createCursor } from 'playwright-ghost-cursor'

const cursor = createCursor(page)
await cursor.move('#button') // Uses humancursor logic automatically
await cursor.click()
```

### With Custom Options
```typescript
await cursor.moveTo({ x: 100, y: 100 }, {
  moveSpeed: 1.5,
  spreadOverride: 50
})
```

### All Existing Options Still Work
```typescript
const cursor = createCursor(page, { x: 0, y: 0 }, false, {
  move: { 
    moveDelay: 1000,
    overshootThreshold: 500,
    paddingPercentage: 10
  }
})
await cursor.move('#button')
```

## Testing

Unit tests have been added in `src/__test__/humancursor-integration.test.ts` covering:
- Bezier curve calculations
- Tweening functions
- Human trajectory generation with various options
- Edge cases (short/long distances)

## Benefits

1. **More Human-Like**: Movements now include natural imperfections and variations
2. **Configurable**: Extensive options for fine-tuning behavior
3. **Viewport-Aware**: Automatically adjusts complexity based on cursor position
4. **Weighted Randomness**: Uses realistic probability distributions for parameters
5. **Backward Compatible**: Existing code continues to work without changes

## Python to JavaScript Mapping

| Python Module | JavaScript Module |
|--------------|-------------------|
| `humancursor.utilities.human_curve_generator.HumanizeMouseTrajectory` | `src/human-curve-generator.ts` → `HumanizeMouseTrajectory` |
| `humancursor.utilities.human_curve_generator.BezierCalculator` | `src/bezier-calculator.ts` → `calculatePointsInCurve()` |
| `humancursor.utilities.calculate_and_randomize.generate_random_curve_parameters` | `src/calculate-and-randomize.ts` → `generateRandomCurveParameters()` |
| `pytweening` (easing functions) | `src/tweening.ts` |

## Future Enhancements

Potential improvements:
- Add more tweening functions
- Expose more configuration options
- Add presets for different "personalities" (fast/slow, precise/sloppy, etc.)
- Performance optimizations for very long paths
- Support for custom distortion functions
