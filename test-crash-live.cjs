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

  await page.goto('https://mongodbquizlab.emtvtech.com/');
  
  // Inject fake admin session
  await page.evaluate(() => {
    sessionStorage.setItem('mongo_quiz_logged_admin_user', JSON.stringify({
      id: 'admin_master_1',
      username: 'admin',
      role: 'super-admin',
      status: 'active'
    }));
  });

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
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Instructor Portal')) {
        console.log("Clicking Admin Tab!");
        await btn.click();
        break;
      }
    }
    
    // Wait to see if it crashes
    await new Promise(r => setTimeout(r, 3000));
    
  } catch(e) {
    console.error("Puppeteer Script Error:", e.message);
  }

  await browser.close();
  process.exit(0);
})();
