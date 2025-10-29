#!/usr/bin/env node

/**
 * Tailwind CSS Loading Check Script
 * Verifica especificamente se as classes do Tailwind estão sendo aplicadas
 */

import { chromium } from 'playwright'

const URL = process.argv[2] || 'http://localhost:3000'

console.log('🎨 Tailwind CSS Loading Check')
console.log('=============================')
console.log(`🌐 URL: ${URL}`)
console.log('')

async function checkTailwind() {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  try {
    console.log('📄 Carregando página...')
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 })

    console.log('🎨 Verificando classes do Tailwind...')

    // Verificar classes específicas do Tailwind
    const tailwindCheck = await page.evaluate(() => {
      // Verificar se elementos têm classes do Tailwind aplicadas
      const body = document.body
      const html = document.documentElement

      // Verificar classes básicas
      const hasBgWhite = !!document.querySelector('[class*="bg-white"], [class*="bg-gray-50"]')
      const hasTextGray = !!document.querySelector('[class*="text-gray"], [class*="text-black"]')
      const hasPadding = !!document.querySelector('[class*="p-"], [class*="px-"], [class*="py-"]')
      const hasMargin = !!document.querySelector('[class*="m-"], [class*="mx-"], [class*="my-"]')
      const hasFlex = !!document.querySelector('[class*="flex"], [class*="grid"]')
      const hasButtons = !!document.querySelector('button[class*="bg-"], button[class*="text-"]')

      // Verificar se há estilos computados para classes do Tailwind
      const testElement = document.createElement('div')
      testElement.className = 'bg-blue-500 text-white p-4 m-2'
      testElement.style.position = 'absolute'
      testElement.style.left = '-9999px'
      document.body.appendChild(testElement)

      const computedStyle = window.getComputedStyle(testElement)
      const hasComputedStyles = computedStyle.backgroundColor !== '' ||
                               computedStyle.color !== '' ||
                               computedStyle.padding !== '' ||
                               computedStyle.margin !== ''

      document.body.removeChild(testElement)

      // Verificar se o CSS do Tailwind foi carregado
      const allStylesheets = Array.from(document.styleSheets)
      const hasTailwindCSS = allStylesheets.some(sheet => {
        try {
          const css = sheet.cssRules || []
          return Array.from(css).some(rule =>
            rule.cssText && (
              rule.cssText.includes('bg-blue-500') ||
              rule.cssText.includes('text-white') ||
              rule.cssText.includes('.bg-') ||
              rule.cssText.includes('.text-')
            )
          )
        } catch (e) {
          return false
        }
      })

      // Contar elementos com classes do Tailwind
      const allElements = document.querySelectorAll('*')
      let tailwindElements = 0
      let totalClasses = 0

      allElements.forEach(el => {
        const className = el.className || ''
        const classes = className.toString().split(' ').filter(cls =>
          cls.startsWith('bg-') ||
          cls.startsWith('text-') ||
          cls.startsWith('p-') ||
          cls.startsWith('m-') ||
          cls.startsWith('flex') ||
          cls.startsWith('grid') ||
          cls.startsWith('w-') ||
          cls.startsWith('h-')
        )
        if (classes.length > 0) {
          tailwindElements++
          totalClasses += classes.length
        }
      })

      return {
        hasBgWhite,
        hasTextGray,
        hasPadding,
        hasMargin,
        hasFlex,
        hasButtons,
        hasComputedStyles,
        hasTailwindCSS,
        tailwindElements,
        totalClasses,
        bodyClasses: body.className,
        htmlClasses: html.className
      }
    })

    console.log('📊 Resultados das classes Tailwind:')
    console.log(`   ✅ Elementos com bg-*: ${tailwindCheck.hasBgWhite ? 'SIM' : 'NÃO'}`)
    console.log(`   ✅ Elementos com text-*: ${tailwindCheck.hasTextGray ? 'SIM' : 'NÃO'}`)
    console.log(`   ✅ Elementos com padding: ${tailwindCheck.hasPadding ? 'SIM' : 'NÃO'}`)
    console.log(`   ✅ Elementos com margin: ${tailwindCheck.hasMargin ? 'SIM' : 'NÃO'}`)
    console.log(`   ✅ Elementos com flex/grid: ${tailwindCheck.hasFlex ? 'SIM' : 'NÃO'}`)
    console.log(`   ✅ Botões estilizados: ${tailwindCheck.hasButtons ? 'SIM' : 'NÃO'}`)
    console.log(`   ✅ Estilos computados: ${tailwindCheck.hasComputedStyles ? 'SIM' : 'NÃO'}`)
    console.log(`   ✅ CSS do Tailwind carregado: ${tailwindCheck.hasTailwindCSS ? 'SIM' : 'NÃO'}`)
    console.log(`   📊 Elementos com classes Tailwind: ${tailwindCheck.tailwindElements}`)
    console.log(`   📊 Total de classes Tailwind: ${tailwindCheck.totalClasses}`)
    console.log(`   📄 Classes do body: "${tailwindCheck.bodyClasses}"`)
    console.log(`   📄 Classes do html: "${tailwindCheck.htmlClasses}"`)

    console.log('')
    if (tailwindCheck.tailwindElements > 0 && tailwindCheck.hasComputedStyles) {
      console.log('🎉 TAILWIND CSS CARREGADO COM SUCESSO!')
      console.log('✅ Classes sendo aplicadas')
      console.log('✅ Estilos computados corretamente')
    } else {
      console.log('❌ PROBLEMA DETECTADO:')
      if (tailwindCheck.tailwindElements === 0) console.log('   - Nenhuma classe Tailwind encontrada nos elementos')
      if (!tailwindCheck.hasComputedStyles) console.log('   - Estilos não estão sendo computados')
      if (!tailwindCheck.hasTailwindCSS) console.log('   - CSS do Tailwind não foi carregado')
    }

    // Manter o navegador aberto por 10 segundos para inspeção visual
    console.log('')
    console.log('🔍 Navegador permanecerá aberto por 10 segundos para inspeção visual...')
    console.log('💡 Verifique no DevTools se as classes estão aplicadas e se há CSS carregado.')

    await new Promise(resolve => setTimeout(resolve, 10000))

  } catch (error) {
    console.error('❌ Erro durante verificação:', error.message)
  } finally {
    await browser.close()
  }
}

checkTailwind().catch(console.error)
