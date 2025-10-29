// Script de diagnóstico para verificar composição
import { chromium } from 'playwright';

async function checkComposition() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔍 Verificando composição da página...');

    // Intercept network requests to see composition data
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('composePage') || request.url().includes('page.tsx')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers()
        });
      }
    });

    await page.goto('http://localhost:3000');
    await page.waitForTimeout(5000);

    console.log('📡 Requests relacionados à composição:', requests.length);
    requests.forEach((req, i) => {
      console.log(`Request ${i+1}:`, req.url);
    });

    // Check if composition data is in the HTML
    const html = await page.content();
    const hasComposition = html.includes('composition') || html.includes('PageRenderer');
    console.log('📄 HTML contém dados de composição:', hasComposition);

    // Check for error messages
    const errors = await page.$$eval('.error, [class*="error"]', elements =>
      elements.map(el => el.textContent?.trim())
    );
    console.log('❌ Erros encontrados:', errors);

    // Check console logs
    const logs = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        logs.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);
    console.log('📝 Console errors:', logs);

  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
  } finally {
    await browser.close();
  }
}

checkComposition();