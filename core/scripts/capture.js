const puppeteer = require('puppeteer');

(async () => {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'], headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  try {
    // 1. Dashboard (Create Project)
    console.log("Navigating to dashboard...");
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle0' });
    await page.screenshot({ path: 'public/step1.png' });
    console.log("Saved step1.png");

    // Create a project to get to the project page
    await page.type('#topic', 'Traffic Sign Recognition with Deep Learning');
    await page.type('#context', 'Developing a robust hybrid deep learning model (CNN and LSTM) to classify traffic signs in real-time under poor weather and low light conditions.');
    await page.click('button[type="submit"]');
    
    console.log("Waiting for project page...");
    await page.waitForNavigation({ waitUntil: 'networkidle0' });
    
    // 2. Project Page (Upload/Papers view)
    await page.screenshot({ path: 'public/step2.png' });
    console.log("Saved step2.png");

    // 3. Project Page (Analysis view)
    console.log("Starting analysis...");
    
    // First, click the "Project Analysis" toggle button to show the section
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const toggleBtn = buttons.find(b => b.textContent.includes('Project Analysis'));
      if (toggleBtn) toggleBtn.click();
    });
    
    // Wait for the section to appear
    await new Promise(r => setTimeout(r, 500));
    
    // Find the button with text "Analyse and Find" and click it
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const analyzeBtn = buttons.find(b => b.textContent.includes('Analyse and Find'));
      if (analyzeBtn) analyzeBtn.click();
    });
    
    // Wait for the analysis to finish (it might take a few seconds)
    console.log("Waiting for analysis to complete...");
    await new Promise(r => setTimeout(r, 6000));
    
    // Scroll down to the analysis section
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Wait for scroll animation and rendering
    await new Promise(r => setTimeout(r, 1000));
    
    await page.screenshot({ path: 'public/step3.png' });
    console.log("Saved step3.png");

  } catch (err) {
    console.error("Error during capture:", err);
  } finally {
    await browser.close();
    console.log("Done.");
  }
})();
