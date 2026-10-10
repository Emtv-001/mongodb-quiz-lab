const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Forward all console logs to terminal
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  
  // Forward uncaught exceptions
  page.on('pageerror', error => {
    console.error('BROWSER PAGE ERROR (Uncaught Exception):', error.message);
  });

  await page.goto('http://localhost:3000');
  
  try {
    console.log("Waiting for menu button...");
    await page.waitForSelector('.lucide-menu', { timeout: 5000 });
    const menuBtn = await page.$('.lucide-menu');
    if (menuBtn) {
       await menuBtn.click();
       await new Promise(r => setTimeout(r, 1000));
    }

    console.log("Looking for Admin tab...");
    const buttons = await page.$$('button');
    let clicked = false;
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Instructor Portal')) {
        console.log("Clicking Admin Tab!");
        await btn.click();
        clicked = true;
        break;
      }
    }
    
    if (!clicked) {
      console.log("Could not find Instructor Portal button.");
    }
    
    // Wait to see if it crashes
    await new Promise(r => setTimeout(r, 3000));
    
  } catch(e) {
    console.error("Puppeteer Script Error:", e.message);
  }

  await browser.close();
  process.exit(0);
})();
