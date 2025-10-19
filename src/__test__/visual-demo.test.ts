import { chromium, type Browser, type Page } from 'playwright'
import { createCursor } from '../spoof'
import { installMouseHelper } from '../mouse-helper'

describe('Visual Demo - Human Cursor Movement and Scrolling', () => {
  let browser: Browser
  let page: Page

  beforeAll(async () => {
    browser = await chromium.launch({
      headless: false, // Show the browser so we can see the cursor
      slowMo: 50 // Slow down operations slightly for visibility
    })
  })

  afterAll(async () => {
    await browser.close()
  })

  beforeEach(async () => {
    page = await browser.newPage()
    await page.setViewportSize({ width: 1280, height: 720 })
    // Install mouse helper to visualize cursor movements
    await installMouseHelper(page)
  })

  afterEach(async () => {
    await page.close()
  })

  it('should demonstrate human-like cursor movement on a real website', async () => {
    // Navigate to a website with multiple elements
    await page.goto('https://example.com', { waitUntil: 'networkidle' })

    const cursor = createCursor(page, { x: 0, y: 0 }, true)

    console.log('🖱️  Starting cursor movement demo...')

    // Move to the heading
    console.log('📍 Moving to heading...')
    await cursor.move('h1')
    await page.waitForTimeout(1000)

    // Move to a paragraph
    console.log('📍 Moving to paragraph...')
    await cursor.move('p')
    await page.waitForTimeout(1000)

    // Move to a link
    console.log('📍 Moving to link...')
    await cursor.move('a')
    await page.waitForTimeout(1000)

    // Click the link
    console.log('🖱️  Clicking link...')
    await cursor.click('a')
    await page.waitForTimeout(2000)

    console.log('✅ Cursor movement demo complete!')
  }, 30000)

  it('should demonstrate human-like scrolling behavior', async () => {
    // Create a page with lots of content to scroll through
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 20px;
              font-family: Arial, sans-serif;
            }
            .section {
              height: 600px;
              padding: 40px;
              margin: 20px 0;
              border: 2px solid #333;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 32px;
              font-weight: bold;
            }
            .section:nth-child(odd) { background: #e3f2fd; }
            .section:nth-child(even) { background: #fff3e0; }
            .button {
              padding: 20px 40px;
              font-size: 18px;
              background: #2196f3;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
              margin: 10px;
            }
            .button:hover {
              background: #1976d2;
            }
          </style>
        </head>
        <body>
          <h1>Human Cursor Scrolling Demo</h1>
          <div class="section" id="section1">
            Section 1 - Top
            <button class="button" id="btn1">Button 1</button>
          </div>
          <div class="section" id="section2">
            Section 2
            <button class="button" id="btn2">Button 2</button>
          </div>
          <div class="section" id="section3">
            Section 3
            <button class="button" id="btn3">Button 3</button>
          </div>
          <div class="section" id="section4">
            Section 4
            <button class="button" id="btn4">Button 4</button>
          </div>
          <div class="section" id="section5">
            Section 5 - Bottom
            <button class="button" id="btn5">Button 5</button>
          </div>
        </body>
      </html>
    `)

    const cursor = createCursor(page, { x: 100, y: 100 }, true)

    console.log('📜 Starting scrolling demo...')

    // Scroll to section 2
    console.log('📍 Scrolling to Section 2...')
    await cursor.move('#section2')
    await page.waitForTimeout(1500)

    // Click button 2
    console.log('🖱️  Clicking Button 2...')
    await cursor.click('#btn2')
    await page.waitForTimeout(1000)

    // Scroll to section 4
    console.log('📍 Scrolling to Section 4...')
    await cursor.move('#section4')
    await page.waitForTimeout(1500)

    // Click button 4
    console.log('🖱️  Clicking Button 4...')
    await cursor.click('#btn4')
    await page.waitForTimeout(1000)

    // Scroll to section 5 (bottom)
    console.log('📍 Scrolling to Section 5 (bottom)...')
    await cursor.move('#section5')
    await page.waitForTimeout(1500)

    // Scroll back to top
    console.log('📍 Scrolling back to top...')
    await cursor.scrollTo('top')
    await page.waitForTimeout(1500)

    // Move to button 1
    console.log('📍 Moving to Button 1...')
    await cursor.move('#btn1')
    await page.waitForTimeout(1000)

    console.log('✅ Scrolling demo complete!')
  }, 45000)

  it('should demonstrate random mouse movements', async () => {
    await page.goto('https://example.com', { waitUntil: 'networkidle' })

    const cursor = createCursor(page, { x: 100, y: 100 }, true)

    console.log('🎲 Starting random movement demo...')
    console.log('⏱️  Random movements will occur for 10 seconds...')

    // Start random movements
    cursor.toggleRandomMove(true)

    // Let it run for 10 seconds
    await page.waitForTimeout(10000)

    // Stop random movements
    cursor.toggleRandomMove(false)

    console.log('✅ Random movement demo complete!')
  }, 20000)

  it('should demonstrate complex interaction flow', async () => {
    // Create a more complex page
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              margin: 0;
              padding: 40px;
              font-family: Arial, sans-serif;
              background: #f5f5f5;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              padding: 40px;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            h1 { color: #333; margin-bottom: 30px; }
            .form-group {
              margin-bottom: 20px;
            }
            label {
              display: block;
              margin-bottom: 8px;
              font-weight: bold;
              color: #555;
            }
            input, textarea {
              width: 100%;
              padding: 12px;
              border: 2px solid #ddd;
              border-radius: 4px;
              font-size: 16px;
              box-sizing: border-box;
            }
            input:focus, textarea:focus {
              outline: none;
              border-color: #2196f3;
            }
            button {
              background: #4caf50;
              color: white;
              padding: 15px 40px;
              border: none;
              border-radius: 4px;
              font-size: 18px;
              cursor: pointer;
              margin-top: 20px;
            }
            button:hover {
              background: #45a049;
            }
            .spacer {
              height: 800px;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #999;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Contact Form Demo</h1>
            <form id="contact-form">
              <div class="form-group">
                <label for="name">Name:</label>
                <input type="text" id="name" name="name" placeholder="Enter your name">
              </div>
              <div class="form-group">
                <label for="email">Email:</label>
                <input type="email" id="email" name="email" placeholder="Enter your email">
              </div>
              <div class="form-group">
                <label for="message">Message:</label>
                <textarea id="message" name="message" rows="5" placeholder="Enter your message"></textarea>
              </div>
              <button type="submit" id="submit-btn">Submit</button>
            </form>
          </div>
          <div class="spacer"></div>
          <div class="footer">
            <p>Footer Content - Scroll to see me!</p>
          </div>
        </body>
      </html>
    `)

    const cursor = createCursor(page, { x: 50, y: 50 }, true)

    console.log('🎯 Starting complex interaction demo...')

    // Move to title
    console.log('📍 Moving to title...')
    await cursor.move('h1')
    await page.waitForTimeout(800)

    // Fill out the form
    console.log('📝 Filling name field...')
    await cursor.click('#name')
    await page.keyboard.type('John Doe', { delay: 100 })
    await page.waitForTimeout(500)

    console.log('📝 Filling email field...')
    await cursor.click('#email')
    await page.keyboard.type('john@example.com', { delay: 100 })
    await page.waitForTimeout(500)

    console.log('📝 Filling message field...')
    await cursor.click('#message')
    await page.keyboard.type('This is a test message demonstrating human-like cursor movement!', { delay: 80 })
    await page.waitForTimeout(500)

    // Hover over submit button
    console.log('🖱️  Hovering over submit button...')
    await cursor.move('#submit-btn')
    await page.waitForTimeout(1000)

    // Scroll down to footer
    console.log('📜 Scrolling to footer...')
    await cursor.move('.footer')
    await page.waitForTimeout(1500)

    // Scroll back to form
    console.log('📜 Scrolling back to form...')
    await cursor.move('#submit-btn')
    await page.waitForTimeout(1000)

    // Click submit
    console.log('🖱️  Clicking submit...')
    await cursor.click('#submit-btn')
    await page.waitForTimeout(1000)

    console.log('✅ Complex interaction demo complete!')
  }, 60000)
})
