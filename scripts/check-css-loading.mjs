#!/usr/bin/env node

/**
 * CSS Loading Check Script
 * Verifica se os estilos CSS estão carregando corretamente
 */

import { chromium } from 'playwright'

const URL = process.argv[2] || 'http://localhost:3000'

console.log('🔍 CSS Loading Check')
console.log('===================')
console.log(`🌐 URL: ${URL}`)
console.log('')

async function checkCSS() {
  const browser = await chromium.launch({ headless: false }) // Headless false para ver o navegador
  const page = await browser.newPage()

  try {
    console.log('📄 Carregando página...')
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 })

    console.log('🎨 Verificando variáveis CSS...')

    // Verificar variáveis CSS específicas
    const cssVars = await page.evaluate(() => {
      const root = document.documentElement
      const styles = getComputedStyle(root)

      const vars = {}
      for (let i = 0; i < styles.length; i++) {
        const prop = styles[i]
        if (prop.startsWith('--color-primary')) {
          vars[prop] = styles.getPropertyValue(prop)
        }
      }

      // Verificar se o body tem classes do Tailwind
      const body = document.body
      const bodyClasses = Array.from(body.classList)

      // Verificar se há elementos visíveis com estilos aplicados
      const styledElements = document.querySelectorAll('[class*="bg-"], [class*="text-"], [class*="p-"], [class*="m-"]')

      return {
        cssVars: Object.keys(vars).length,
        cssVarSample: Object.fromEntries(Object.entries(vars).slice(0, 5)),
        bodyClasses: bodyClasses.filter(cls => cls.includes('font-') || cls.includes('antialiased')),
        styledElements: styledElements.length,
        hasDesignSystem: !!vars['--color-primary-500'],
        pageTitle: document.title
      }
    })

    console.log('📊 Resultados:')
    console.log(`   ✅ Variáveis CSS encontradas: ${cssVars.cssVars}`)
    console.log(`   ✅ Elementos estilizados: ${cssVars.styledElements}`)
    console.log(`   ✅ Classes do body: ${cssVars.bodyClasses.join(', ')}`)
    console.log(`   ✅ Design System ativo: ${cssVars.hasDesignSystem ? 'SIM' : 'NÃO'}`)
    console.log(`   📄 Título da página: "${cssVars.pageTitle}"`)

    if (cssVars.cssVars > 0) {
      console.log('')
      console.log('🎨 Amostra de variáveis CSS:')
      Object.entries(cssVars.cssVarSample).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`)
      })
    }

    console.log('')
    if (cssVars.hasDesignSystem && cssVars.cssVars > 10 && cssVars.styledElements > 20) {
      console.log('🎉 CSS CARREGADO COM SUCESSO!')
      console.log('✅ Design System ativo')
      console.log('✅ Componentes estilizados')
      console.log('✅ Variáveis CSS aplicadas')
    } else {
      console.log('❌ PROBLEMA DETECTADO:')
      if (!cssVars.hasDesignSystem) console.log('   - Design System não carregado')
      if (cssVars.cssVars < 10) console.log('   - Poucas variáveis CSS encontradas')
      if (cssVars.styledElements < 20) console.log('   - Poucos elementos estilizados')
    }

    // Manter o navegador aberto por 10 segundos para inspeção visual
    console.log('')
    console.log('🔍 Navegador permanecerá aberto por 10 segundos para inspeção visual...')
    await new Promise(resolve => setTimeout(resolve, 10000))

  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message)
  } finally {
    await browser.close()
  }
}

checkCSS().catch(console.error)
