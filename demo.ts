/**
 * Visual Demo Script - Run this to see the human cursor in action!
 * 
 * To run:
 * 1. First install Playwright browsers: yarn playwright install chromium
 * 2. Then run: yarn ts-node demo.ts
 */

import { chromium } from 'playwright'
import { createCursor } from './src/spoof'
import { installMouseHelper } from './src/mouse-helper'

async function main() {
  console.log('🚀 Starting Human Cursor Visual Demo...\n')

  const browser = await chromium.launch({
    headless: false // Show the browser
  })

  const page = await browser.newPage()
  await page.setViewportSize({ width: 1280, height: 720 })

  // Create a demo page with content
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            margin: 0;
            padding: 40px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }
          .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            padding: 50px;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          }
          h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 42px;
          }
          .subtitle {
            color: #666;
            font-size: 18px;
            margin-bottom: 40px;
          }
          .section {
            margin: 30px 0;
            padding: 30px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #667eea;
          }
          .section h2 {
            color: #667eea;
            margin-top: 0;
          }
          .button {
            display: inline-block;
            padding: 15px 30px;
            margin: 10px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s;
            text-decoration: none;
          }
          .button:hover {
            background: #5568d3;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          }
          .button.secondary {
            background: #48bb78;
          }
          .button.secondary:hover {
            background: #38a169;
          }
          .spacer {
            height: 800px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
            border-radius: 8px;
            margin: 40px 0;
          }
          .spacer-content {
            text-align: center;
            color: #666;
          }
          .footer {
            text-align: center;
            padding: 40px;
            color: #999;
            font-size: 14px;
          }
          .demo-info {
            background: #fff3cd;
            border: 2px solid #ffc107;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .demo-info strong {
            color: #856404;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🖱️ Human Cursor Demo</h1>
          <p class="subtitle">Watch the cursor move naturally with human-like behavior!</p>
          
          <div class="demo-info">
            <strong>👀 Watch for:</strong>
            <ul>
              <li>Smooth Bezier curves with natural imperfections</li>
              <li>Momentum-based scrolling with ease-out animation</li>
              <li>Random variations in positioning (±100px)</li>
              <li>Natural acceleration and deceleration</li>
            </ul>
          </div>

          <div class="section" id="section1">
            <h2>Section 1: Cursor Movement</h2>
            <p>The cursor will move to various elements using human-like Bezier curves.</p>
            <button class="button" id="btn1">Click Me First</button>
            <button class="button secondary" id="btn2">Then Click Me</button>
          </div>

          <div class="section" id="section2">
            <h2>Section 2: Form Interaction</h2>
            <p>Watch how the cursor interacts with form elements.</p>
            <input type="text" id="input1" placeholder="Name" style="padding: 12px; width: 300px; border: 2px solid #ddd; border-radius: 4px; margin: 10px 0;">
            <br>
            <input type="email" id="input2" placeholder="Email" style="padding: 12px; width: 300px; border: 2px solid #ddd; border-radius: 4px; margin: 10px 0;">
          </div>

          <div class="section" id="section3">
            <h2>Section 3: Multiple Targets</h2>
            <p>The cursor will move between multiple buttons rapidly.</p>
            <button class="button" id="btn3">Button A</button>
            <button class="button" id="btn4">Button B</button>
            <button class="button secondary" id="btn5">Button C</button>
          </div>
        </div>

        <div class="spacer">
          <div class="spacer-content">
            <h2>⬇️ Scroll Down Demo ⬇️</h2>
            <p>Watch the momentum-based scrolling!</p>
          </div>
        </div>

        <div class="container">
          <div class="section" id="section4">
            <h2>Section 4: Bottom Content</h2>
            <p>The cursor scrolled here with momentum physics!</p>
            <button class="button" id="btn6">Final Button</button>
          </div>

          <div class="footer">
            <p>Human Cursor Demo • Powered by humancursor algorithm</p>
          </div>
        </div>
      </body>
    </html>
  `)

  // Install mouse helper AFTER content is loaded
  await installMouseHelper(page)

  // Add a visible custom cursor overlay
  await page.evaluate(() => {
    // Create cursor element
    const cursor = document.createElement('div')
    cursor.id = 'custom-cursor'
    cursor.style.cssText = `
      position: fixed;
      width: 16px;
      height: 16px;
      background: red;
      border: 2px solid black;
      border-radius: 50%;
      pointer-events: none;
      z-index: 999999;
      transform: translate(-50%, -50%);
    `
    document.body.appendChild(cursor)

    // Update cursor position on mouse move
    document.addEventListener('mousemove', (e) => {
      cursor.style.left = e.clientX + 'px'
      cursor.style.top = e.clientY + 'px'
    })

    // Also style the default mouse helper
    const style = document.createElement('style')
    style.innerHTML = `
      p-mouse-pointer {
        background: rgba(255, 0, 0, 0.8) !important;
        border: 2px solid black !important;
        width: 16px !important;
        height: 16px !important;
        margin: -8px 0 0 -8px !important;
      }
    `
    document.head.appendChild(style)
  })

  console.log('✅ Custom cursor installed - you should see a small red cursor with black border!\n')

  // Start cursor at center top
  const startPosition = { x: 640, y: 100 }
  const cursor = createCursor(page, startPosition)

  // Move to starting position first to initialize
  console.log(`🎯 Initializing cursor at position: (${startPosition.x}, ${startPosition.y})`)
  await cursor.moveTo(startPosition)
  await page.waitForTimeout(1000)
  console.log('   ✓ Cursor should now be visible at the top center\n')

  console.log('📍 Demo Step 1: Moving to title...')
  await cursor.move('h1')
  await page.waitForTimeout(500)

  console.log('📍 Demo Step 2: Moving to first button...')
  await cursor.move('#btn1')
  await page.waitForTimeout(300)

  console.log('🖱️  Demo Step 3: Clicking first button...')
  await cursor.click('#btn1', { moveDelay: 0 })
  await page.waitForTimeout(300)

  console.log('📍 Demo Step 4: Moving to second button...')
  await cursor.move('#btn2')
  await page.waitForTimeout(300)

  console.log('🖱️  Demo Step 5: Clicking second button...')
  await cursor.click('#btn2', { moveDelay: 0 })
  await page.waitForTimeout(500)

  console.log('📝 Demo Step 6: Filling form - Name field...')
  await cursor.click('#input1', { moveDelay: 0 })
  await page.keyboard.type('John Doe', { delay: 100 })
  await page.waitForTimeout(300)

  console.log('📝 Demo Step 7: Filling form - Email field...')
  await cursor.click('#input2', { moveDelay: 0 })
  await page.keyboard.type('john@example.com', { delay: 100 })
  await page.waitForTimeout(500)

  console.log('📍 Demo Step 8: Moving between multiple buttons...')
  await cursor.move('#btn3')
  await page.waitForTimeout(200)
  await cursor.move('#btn4')
  await page.waitForTimeout(200)
  await cursor.move('#btn5')
  await page.waitForTimeout(500)

  console.log('📜 Demo Step 9: Scrolling down with momentum...')
  // First scroll down to ensure we need to scroll to see the button
  const scrollAmount = await page.evaluate(() => {
    const section4 = document.querySelector('#section4')
    if (section4) {
      const rect = section4.getBoundingClientRect()
      return rect.top + window.scrollY - window.innerHeight / 2
    }
    return 800
  })
  await cursor.scroll({ y: scrollAmount }, { scrollSpeed: 50 })
  await page.waitForTimeout(500)

  console.log('📍 Demo Step 10: Moving to bottom button...')
  await cursor.move('#btn6')
  await page.waitForTimeout(300)

  console.log('🖱️  Demo Step 11: Clicking bottom button...')
  await cursor.click('#btn6', { moveDelay: 0 })
  await page.waitForTimeout(500)

  console.log('📜 Demo Step 12: Scrolling back to top...')
  await cursor.scrollTo('top', { scrollSpeed: 50 })
  await page.waitForTimeout(500)

  console.log('📍 Demo Step 13: Final movement to title...')
  await cursor.move('h1')
  await page.waitForTimeout(500)

  console.log('\n✅ Demo complete! The browser will stay open for 10 more seconds...')
  console.log('   Notice how natural the movements and scrolling looked!\n')

  await page.waitForTimeout(10000)

  await browser.close()
  console.log('👋 Demo finished!')
}

main().catch(console.error)
