# Playwright Ghost Cursor

<img src="https://media2.giphy.com/media/26ufp2LYURTvL5PRS/giphy.gif" width="100" align="right">

Generate realistic, human-like mouse movements in Playwright. This library creates natural cursor paths using Bezier curves with randomized parameters, making automated browser interactions indistinguishable from real users.

> **Built on the original [ghost-cursor](https://github.com/Xetera/ghost-cursor) by Xetera**  
> Ported to Playwright with enhanced features and active maintenance.

## ✨ Features

- 🎯 **Human-like movements** - Bezier curves with natural imperfections
- 🎲 **Randomized parameters** - Each movement is unique
- 🎨 **Smart targeting** - Clicks random points within elements, not centers
- 📊 **Easing functions** - Natural acceleration and deceleration
- 🔄 **Momentum scrolling** - Realistic scroll behavior with overshoot
- 🎮 **Zero teleporting** - Smooth, continuous paths with no jumps
- ⚡ **Performance optimized** - Efficient point generation and interpolation

## 📦 Installation

```bash
npm install playwright-ghost-cursor
# or
yarn add playwright-ghost-cursor
```

**Note:** Playwright is a peer dependency. Install it separately:
```bash
npm install -D playwright
```

## 🚀 Quick Start

```typescript
import { chromium } from 'playwright'
import { createCursor } from 'playwright-ghost-cursor'

const browser = await chromium.launch({ headless: false })
const page = await browser.newPage()
const cursor = createCursor(page)

await page.goto('https://example.com')

// Move to an element and click
await cursor.click('#submit-button')

// Move to coordinates
await cursor.moveTo({ x: 100, y: 200 })

// Type with human-like delays
await cursor.click('input[name="email"]')
await page.keyboard.type('user@example.com', { delay: 100 })

// Scroll naturally
await cursor.scroll({ y: 500 })
```

## 📖 API Reference

### `createCursor(page, start?, performRandomMoves?, defaultOptions?, visible?)`

Creates a cursor instance for the given page.

**Parameters:**
- `page` - Playwright Page instance
- `start` - Starting position (default: `{ x: 0, y: 0 }`)
- `performRandomMoves` - Enable random movements (default: `false`)
- `defaultOptions` - Default options for all movements
- `visible` - Show cursor helper (default: `false`)

**Returns:** `GhostCursor` instance

### Cursor Methods

#### `cursor.move(selector, options?)`
Move to an element and hover over it.

```typescript
await cursor.move('#button', {
  paddingPercentage: 0.1,  // Stay 10% away from edges
  waitForSelector: 5000,    // Wait up to 5s for element
  moveDelay: 1000          // Delay after movement
})
```

#### `cursor.moveTo(destination, options?)`
Move to specific coordinates.

```typescript
await cursor.moveTo({ x: 500, y: 300 }, {
  moveDelay: 500
})
```

#### `cursor.click(selector?, options?)`
Click an element or current position.

```typescript
await cursor.click('#submit', {
  hesitate: 200,        // Pause before clicking
  waitForClick: 100,    // Hold click duration
  moveDelay: 500,       // Delay after click
  button: 'left'        // 'left', 'right', or 'middle'
})
```

#### `cursor.scroll(delta, options?)`
Scroll with momentum.

```typescript
await cursor.scroll({ y: 500 }, {
  scrollSpeed: 50,      // 1-100, higher = faster
  scrollDelay: 200      // Delay after scroll
})
```

#### `cursor.scrollTo(target, options?)`
Scroll to element or position.

```typescript
// Scroll to element
await cursor.scrollTo('#footer')

// Scroll to position
await cursor.scrollTo('top')  // or 'bottom'
```

## 🎮 Advanced Usage

### Custom Movement Options

```typescript
const cursor = createCursor(page, { x: 640, y: 360 }, false, {
  move: {
    paddingPercentage: 0.15,
    waitForSelector: 10000,
    moveDelay: 2000
  },
  click: {
    hesitate: 300,
    waitForClick: 150
  },
  scroll: {
    scrollSpeed: 75,
    scrollDelay: 300
  }
})
```

### Random Movements

Enable random movements to simulate idle behavior:

```typescript
const cursor = createCursor(page, { x: 640, y: 360 }, true, {
  randomMove: {
    maxTries: 10,
    moveDelay: 3000
  }
})

// Random movements will occur automatically
// They stop when you perform explicit actions
```

### Visible Cursor Helper

For debugging, show a visual cursor:

```typescript
import { installMouseHelper } from 'playwright-ghost-cursor'

await installMouseHelper(page)
const cursor = createCursor(page)
```

## 🔬 How It Works

1. **Bezier Curve Generation** - Creates smooth paths using randomized control points
2. **Distortion** - Adds natural imperfections to the path
3. **Easing Functions** - Applies acceleration/deceleration curves
4. **Interpolation** - Samples points along the curve for smooth movement
5. **Execution** - Moves the mouse through each point sequentially

The library uses the [humancursor](https://github.com/Sudoeranas/humancursor) algorithm ported from Python, ensuring movements are statistically indistinguishable from real users.

## 🎯 Examples

Check out the `demo.ts` and `osu-test.ts` files for complete examples including:
- Form filling
- Button clicking
- Scrolling
- Fast-paced clicking games

## 🤝 Contributing

Contributions welcome! This library is actively maintained.

## 📄 License

ISC

## 🙏 Credits

- Original [ghost-cursor](https://github.com/Xetera/ghost-cursor) by Xetera
- [humancursor](https://github.com/Sudoeranas/humancursor) algorithm by Sudoeranas
- Maintained by the TryRedRover team
