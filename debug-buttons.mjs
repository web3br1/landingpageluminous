// Script de diagnóstico para verificar botões na página
import { chromium } from 'playwright';

async function checkButtons() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('🔍 Verificando botões na página...');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(3000);

    // Check all buttons on the page
    const buttons = await page.$$eval('button', buttons =>
      buttons.map(btn => ({
        text: btn.textContent?.trim(),
        ariaLabel: btn.getAttribute('aria-label'),
        className: btn.className,
        visible: btn.offsetWidth > 0 && btn.offsetHeight > 0
      }))
    );

    console.log(`📊 Total de botões encontrados: ${buttons.length}`);
    buttons.forEach((btn, i) => {
      console.log(`Botão ${i+1}:`, {
        text: btn.text,
        ariaLabel: btn.ariaLabel,
        visible: btn.visible,
        classes: btn.className.split(' ').slice(0, 3).join(' ')
      });
    });

    // Check hero section specifically
    const heroSection = await page.$('[data-section="hero"]');
    if (heroSection) {
      console.log('\n🎯 Seção Hero encontrada!');
      const heroButtons = await heroSection.$$eval('button', buttons =>
        buttons.map(btn => ({
          text: btn.textContent?.trim(),
          visible: btn.offsetWidth > 0 && btn.offsetHeight > 0
        }))
      );
      console.log('Botões na seção hero:', heroButtons);
    } else {
      console.log('❌ Seção Hero não encontrada');
    }

    // Check all sections
    const sections = await page.$$eval('[data-section]', sections =>
      sections.map(section => section.getAttribute('data-section'))
    );
    console.log('\n📋 Seções encontradas:', sections);

  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
  } finally {
    await browser.close();
  }
}

checkButtons();
