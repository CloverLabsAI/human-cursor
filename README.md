

### ALL CREDIT GOES TO THE ORIGINAL GHOST-CRUSOR AUTHOR. This project is a direct fork and would not exist without Xterra.
This repository is updated and maintained by the TryRedRover[dot]com team.

# Playright Ghost Cursor
<img src="https://media2.giphy.com/media/26ufp2LYURTvL5PRS/giphy.gif" width="100" align="right">

Generate realistic, human-like mouse movement data between coordinates or navigate between elements with Playwright
like the definitely-not-robot you are.

> Oh yeah? Could a robot do _**this?**_

## Installation

```sh
yarn add playwright-ghost-cursor
```
or with npm
```sh
npm install playwright-ghost-cursor
```

## Usage
Generating movement data between 2 coordinates.

```js
import { path } from "playwright-ghost-cursor"

const from = { x: 100, y: 100 }
const to = { x: 600, y: 700 }

const route = path(from, to)

/**
 * [
 *   { x: 100, y: 100 },
 *   { x: 108.75573501957051, y: 102.83608396351725 },
 *   { x: 117.54686481838543, y: 106.20019239793275 },
 *   { x: 126.3749821408895, y: 110.08364505509256 },
 *   { x: 135.24167973152743, y: 114.47776168684264 }
 *   ... and so on
 * ]
 */
```

Generating movement data between 2 coordinates with timestamps.
```js
import { path } from "playwright-ghost-cursor"

const from = { x: 100, y: 100 }
const to = { x: 600, y: 700 }

const route = path(from, to, { useTimestamps: true })

/**
 * [
 *   { x: 100, y: 100, timestamp: 1711850430643 },
 *   { x: 114.78071695023473, y: 97.52340709495319, timestamp: 1711850430697 },
 *   { x: 129.1362373468682, y: 96.60141853603243, timestamp: 1711850430749 },
 *   { x: 143.09468422606352, y: 97.18676354029148, timestamp: 1711850430799 },
 *   { x: 156.68418062398405, y: 99.23217132478408, timestamp: 1711850430848 },
 *   ... and so on
 * ]
 */
```


Usage with Playwright:

```js
import { createCursor } from "playwright-ghost-cursor"
import { chromium, Browser, Page } from "playwright";

const run = async (url) => {
  const selector = "#sign-up button"
  const browser = await chromium.launch({
    headless: false, // Show browser window to see mouse movement
    args: ["--enable-features=VizDisplayCompositor"], // Help with cursor visibility
  });
  const page = await browser.newPage()
  const cursor = createCursor(page)

  await page.goto(url)
  await page.waitForSelector(selector)
  await cursor.click(selector)
}
```

### Puppeteer-specific behavior
* `cursor.move()` will automatically overshoot or slightly miss and re-adjust for elements that are too far away
from the cursor's starting point.
* When moving over objects, a random coordinate that's within the element will be selected instead of
hovering over the exact center of the element.
* The speed of the mouse will take the distance and the size of the element you're clicking on into account.

<br>

![ghost-cursor in action](https://cdn.discordapp.com/attachments/418699380833648644/664110683054538772/acc_gen.gif)

> Ghost cursor in action on a form

## Methods
Please reference the original [Ghost Cursor](https://github.com/Xetera/ghost-cursor) library for up to date documentation.
