// Script para testar imports dinâmicos
import { chromium } from 'playwright';

async function testImports() {
  console.log('🔍 Testando imports dinâmicos...');

  // Test 1: Verificar se arquivos existem
  const fs = await import('fs');
  const path = await import('path');

  const components = [
    'components/sections/hero/index.ts',
    'components/sections/benefits/index.ts',
    'components/sections/features/index.ts',
    'components/sections/pricing/index.ts',
    'components/sections/social-proof/index.ts',
    'components/sections/demo/index.ts',
    'components/sections/faq/index.ts',
    'components/sections/final-cta/index.ts',
    'components/sections/footer/index.ts'
  ];

  console.log('\n📦 Verificando se arquivos existem:');
  for (const componentPath of components) {
    try {
      const fullPath = path.join(process.cwd(), componentPath);
      const exists = fs.existsSync(fullPath);
      console.log(`${exists ? '✅' : '❌'} ${componentPath} - ${exists ? 'Existe' : 'Não encontrado'}`);
    } catch (error) {
      console.log(`❌ ${componentPath} - ERRO: ${error.message}`);
    }
  }

  // Test 2: Verificar função getComponentForSection
  console.log('\n🔧 Testando getComponentForSection:');
  try {
    const routeBasedLazyLoading = await import('../../../lib/composition/performance/route-based-lazy-loading.js');
    const { getComponentForSection } = routeBasedLazyLoading;

    const sectionIds = ['hero', 'benefits', 'features', 'pricing', 'social-proof', 'demo', 'faq', 'final-cta', 'footer'];

    for (const sectionId of sectionIds) {
      try {
        const component = getComponentForSection(sectionId);
        console.log(`✅ ${sectionId} -> ${component?.name || 'null'}`);
      } catch (error) {
        console.log(`❌ ${sectionId} -> ERRO: ${error.message}`);
      }
    }
  } catch (error) {
    console.log(`❌ Erro ao importar getComponentForSection: ${error.message}`);
  }

  // Test 3: Verificar se o servidor está rodando
  console.log('\n🌐 Testando conexão com servidor:');
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto('http://localhost:3000/test');
    await page.waitForTimeout(2000);

    const title = await page.title();
    const hasContent = await page.locator('text=Teste Isolado').isVisible();

    console.log(`✅ Servidor responde - Title: "${title}"`);
    console.log(`✅ Página de teste: ${hasContent ? 'Conteúdo visível' : 'Conteúdo não encontrado'}`);

    await browser.close();
  } catch (error) {
    console.log(`❌ Erro na conexão: ${error.message}`);
  }
}

testImports().catch(console.error);
