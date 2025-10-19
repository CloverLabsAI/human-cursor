/**
 * Osu-like Game Test - Tests rapid clicking and movement patterns
 * 
 * To run:
 * 1. First install Playwright browsers: yarn playwright install chromium
 * 2. Then run: yarn ts-node osu-test.ts
 */

import { chromium } from 'playwright'
import { createCursor } from './src/spoof'
import { installMouseHelper } from './src/mouse-helper'

async function main () {
  console.log('🎮 Starting Osu-like Game Test...\n')

  const browser = await chromium.launch({
    headless: false
  })

  const page = await browser.newPage()
  await page.setViewportSize({ width: 1280, height: 720 })

  // Install custom cursor visualization BEFORE loading content
  await installMouseHelper(page)
  console.log('✅ Custom cursor helper installed!\n')

  // Create osu-like game page
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            overflow: hidden;
            height: 100vh;
          }
          #game-container {
            position: relative;
            width: 100%;
            height: 100%;
          }
          .circle {
            position: absolute;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.9);
            border: 4px solid #ff6b9d;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            color: #ff6b9d;
            transition: all 0.1s ease;
            box-shadow: 0 4px 20px rgba(255, 107, 157, 0.4);
          }
          .circle:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 30px rgba(255, 107, 157, 0.6);
          }
          .circle.hit {
            animation: hit 0.3s ease-out forwards;
          }
          @keyframes hit {
            0% {
              transform: scale(1);
              opacity: 1;
            }
            100% {
              transform: scale(2);
              opacity: 0;
            }
          }
          #score {
            position: fixed;
            top: 20px;
            left: 20px;
            color: white;
            font-size: 32px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            z-index: 1000;
          }
          #combo {
            position: fixed;
            top: 60px;
            left: 20px;
            color: #ffd700;
            font-size: 24px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            z-index: 1000;
          }
          #timer {
            position: fixed;
            top: 20px;
            right: 20px;
            color: white;
            font-size: 28px;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            z-index: 1000;
          }
          #status {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            color: white;
            font-size: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
            z-index: 1000;
          }
        </style>
      </head>
      <body>
        <div id="score">Score: 0</div>
        <div id="combo">Combo: 0x</div>
        <div id="timer">Time: 30s</div>
        <div id="status">Click circles as they appear!</div>
        <div id="game-container"></div>

        <script>
          let score = 0;
          let combo = 0;
          let circleCount = 0;
          let timeLeft = 30;
          let gameActive = true;
          let activeCircles = 0;
          const MAX_CIRCLES = 3; // Keep 3 circles on screen at once

          const container = document.getElementById('game-container');
          const scoreEl = document.getElementById('score');
          const comboEl = document.getElementById('combo');
          const timerEl = document.getElementById('timer');
          const statusEl = document.getElementById('status');

          function createCircle() {
            if (!gameActive || activeCircles >= MAX_CIRCLES) return;

            const circle = document.createElement('div');
            circle.className = 'circle';
            circle.id = 'circle-' + circleCount++;
            circle.textContent = circleCount;

            // Random position (avoid edges)
            const x = Math.random() * (window.innerWidth - 120) + 20;
            const y = Math.random() * (window.innerHeight - 120) + 20;
            
            circle.style.left = x + 'px';
            circle.style.top = y + 'px';

            activeCircles++;

            circle.addEventListener('click', function() {
              if (!gameActive) return;
              
              score += 100 * (combo + 1);
              combo++;
              
              scoreEl.textContent = 'Score: ' + score;
              comboEl.textContent = 'Combo: ' + combo + 'x';
              
              circle.classList.add('hit');
              activeCircles--;
              setTimeout(() => circle.remove(), 300);
              
              // Create new circle to maintain count
              setTimeout(createCircle, 200);
            });

            container.appendChild(circle);

            // Auto-remove after 4 seconds if not clicked (breaks combo)
            setTimeout(() => {
              if (circle.parentElement && gameActive) {
                combo = 0;
                comboEl.textContent = 'Combo: 0x';
                activeCircles--;
                circle.remove();
                setTimeout(createCircle, 200);
              }
            }, 4000);
          }

          // Timer countdown
          const timerInterval = setInterval(() => {
            timeLeft--;
            timerEl.textContent = 'Time: ' + timeLeft + 's';
            
            if (timeLeft <= 0) {
              gameActive = false;
              clearInterval(timerInterval);
              statusEl.textContent = 'Game Over! Final Score: ' + score;
              statusEl.style.fontSize = '32px';
              statusEl.style.color = '#ffd700';
              
              // Remove all circles
              document.querySelectorAll('.circle').forEach(c => c.remove());
            }
          }, 1000);

          // Start the game with multiple circles
          for (let i = 0; i < MAX_CIRCLES; i++) {
            setTimeout(() => createCircle(), i * 300);
          }
        </script>
      </body>
    </html>
  `)

  console.log('✅ Game loaded!\n')

  // Wait for page to be fully ready
  await page.waitForLoadState('domcontentloaded')
  await page.waitForTimeout(500)

  // Add custom red cursor visualization
  await page.evaluate(() => {
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

  console.log('✅ Custom RED cursor installed - you should see it now!\n')

  // Create ghost cursor
  const cursor = createCursor(page)

  // Initialize cursor at center
  const startPosition = { x: 640, y: 360 }
  await cursor.moveTo(startPosition)
  console.log('🎯 Cursor initialized at center - red dot should be visible!\n')

  await page.waitForTimeout(500)

  console.log('🎮 Starting automated gameplay...\n')
  console.log('Watch how the cursor moves and clicks circles!\n')

  // Play the game for 30 seconds
  const startTime = Date.now()
  let clickCount = 0

  while (Date.now() - startTime < 30000) {
    try {
      // Find all visible circles
      const circles = await page.$$('.circle:not(.hit)')
      
      if (circles.length > 0) {
        // Click the first available circle
        const circle = circles[0]
        const box = await circle.boundingBox()
        
        if (box) {
          clickCount++
          const targetX = Math.round(box.x + box.width/2)
          const targetY = Math.round(box.y + box.height/2)
          
          const moveStart = Date.now()
          console.log(`🎯 Click #${clickCount}: Moving to circle at (${targetX}, ${targetY})`)
          
          await cursor.click(circle)
          
          const moveTime = Date.now() - moveStart
          console.log(`   ⏱️  Movement took ${moveTime}ms`)
          
          // Check score and combo after click
          const score = await page.$eval('#score', el => el.textContent).catch(() => 'N/A')
          const combo = await page.$eval('#combo', el => el.textContent).catch(() => 'N/A')
          console.log(`   📊 ${score} | ${combo}`)
          
          // No delay - go as fast as possible like a real player
          await page.waitForTimeout(10)
        }
      } else {
        // Wait for next circle to appear
        await page.waitForTimeout(100)
      }
    } catch (error) {
      // Circle might have disappeared, continue
      console.log(`   ⚠️  Error: ${(error as Error).message}`)
      await page.waitForTimeout(50)
    }
  }

  console.log('\n🎮 Game finished!')
  
  // Get final score
  const finalScore = await page.$eval('#score', el => el.textContent)
  const finalCombo = await page.$eval('#combo', el => el.textContent)
  
  console.log(`\n📊 Final Results:`)
  console.log(`   ${finalScore}`)
  console.log(`   ${finalCombo}`)
  console.log(`   Total Clicks: ${clickCount}`)

  console.log('\n✅ Test complete! Browser will stay open for 5 more seconds...')
  await page.waitForTimeout(5000)

  await browser.close()
  console.log('👋 Test finished!')
}

main().catch(console.error)
