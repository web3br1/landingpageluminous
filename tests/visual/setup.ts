import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Global setup for visual regression tests
 * Ensures consistent environment for screenshot comparisons
 */
async function globalSetup() {
  console.log('🎨 Setting up visual regression environment...');

  // Ensure baseline directory exists
  const baselineDir = path.join(process.cwd(), 'tests', 'visual', 'baselines');
  if (!fs.existsSync(baselineDir)) {
    fs.mkdirSync(baselineDir, { recursive: true });
    console.log('📁 Created baselines directory:', baselineDir);
  }

  // Ensure snapshots directory exists
  const snapshotsDir = path.join(process.cwd(), 'tests', 'visual', 'snapshots');
  if (!fs.existsSync(snapshotsDir)) {
    fs.mkdirSync(snapshotsDir, { recursive: true });
    console.log('📁 Created snapshots directory:', snapshotsDir);
  }

  // Pre-warm browser for consistent results
  if (process.env.CI) {
    console.log('🔥 Warming up browser in CI environment...');
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Visit homepage to warm up
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Let animations settle

    await browser.close();
    console.log('✅ Browser warm-up complete');
  }

  console.log('🎨 Visual regression setup complete');
}

export default globalSetup;
