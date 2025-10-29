import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Global setup for critical path E2E tests
 * Prepares test data and ensures clean environment
 */
async function globalSetup() {
  console.log('🚀 Setting up critical path E2E environment...');

  // Ensure test results directories exist
  const resultsDir = path.join(process.cwd(), 'test-results', 'critical-paths');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
    console.log('📁 Created critical paths results directory:', resultsDir);
  }

  // Clean up any leftover test data
  const tempDataDir = path.join(process.cwd(), 'test-data');
  if (fs.existsSync(tempDataDir)) {
    fs.rmSync(tempDataDir, { recursive: true, force: true });
    console.log('🧹 Cleaned up temporary test data');
  }

  // Pre-seed any necessary test data for critical paths
  if (process.env.E2E_PREPARE_DATA === 'true') {
    console.log('📝 Preparing test data for critical paths...');
    // Add test data preparation logic here
    // e.g., create test users, seed database, etc.
  }

  // Health check the application
  console.log('🔍 Performing application health check...');
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Quick health check
    await page.goto('http://localhost:3000', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    const title = await page.title();
    console.log('✅ Application health check passed - Title:', title);

    await browser.close();
  } catch (error) {
    console.error('❌ Application health check failed:', error);
    throw new Error('Application not ready for critical path testing');
  }

  console.log('🚀 Critical path E2E setup complete');
}

export default globalSetup;
