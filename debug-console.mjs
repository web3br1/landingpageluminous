// Script de diagnóstico para capturar logs do console
import { chromium } from 'playwright';

async function debugConsoleLogs() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const logs = [];
  const errors = [];

  // Capture all console logs
  page.on('console', msg => {
    const logEntry = {
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    };
    logs.push(logEntry);
    console.log(`[${logEntry.timestamp}] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  // Capture errors
  page.on('pageerror', error => {
    errors.push({
      message: error.message,
      timestamp: new Date().toISOString()
    });
    console.error(`[ERROR] ${error.message}`);
  });

  try {
    console.log('🔍 Capturando logs do console...');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(5000);

    // Filter logs for our debug messages
    const debugLogs = logs.filter(log =>
      log.text.includes('[PageRenderer]') ||
      log.text.includes('[OptimizedLazySection]')
    );

    console.log('\n📋 Logs de Debug Encontrados:', debugLogs.length);
    debugLogs.forEach((log, i) => {
      console.log(`${i + 1}. [${log.type}] ${log.text}`);
    });

    console.log('\n❌ Erros Encontrados:', errors.length);
    errors.forEach((error, i) => {
      console.log(`${i + 1}. ${error.message}`);
    });

    // Check for specific debug markers in DOM
    const debugElements = await page.$$eval('[data-debug]', elements =>
      elements.map(el => ({
        tag: el.tagName,
        id: el.id,
        debugType: el.getAttribute('data-debug'),
        text: el.textContent?.slice(0, 50)
      }))
    );

    console.log('\n🔧 Elementos de Debug no DOM:', debugElements.length);
    debugElements.forEach((el, i) => {
      console.log(`${i + 1}. ${el.tag} #${el.id} [${el.debugType}]: "${el.text}"`);
    });

  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
  } finally {
    await browser.close();
  }
}

debugConsoleLogs();
