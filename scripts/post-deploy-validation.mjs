#!/usr/bin/env node

/**
 * Post-Deploy Validation Script
 * Valida funcionalidades core e UX avançado após deploy
 */

import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

console.log('🚀 Post-Deploy Validation - Luminaris SaaS\n')

// Configuration
const BASE_URL = process.env.POST_DEPLOY_URL || 'http://localhost:3000'
const TIMEOUT = 30000
const DEBUG = process.env.DEBUG === 'true'

// Results tracking
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  checks: []
}

function logCheck(name, status, message, details = null) {
  const check = { name, status, message, details, timestamp: new Date().toISOString() }
  results.checks.push(check)

  const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️'
  console.log(`${icon} ${name}: ${message}`)

  if (status === 'pass') results.passed++
  else if (status === 'fail') results.failed++
  else results.warnings++
}

async function takeScreenshot(page, name) {
  if (DEBUG) {
    const screenshotPath = path.join(process.cwd(), 'tmp', `validation-${name}.png`)
    await page.screenshot({ path: screenshotPath, fullPage: true })
    console.log(`📸 Screenshot saved: ${screenshotPath}`)
  }
}

async function validateCoreFunctionality(browser) {
  console.log('🔧 Validating Core Functionality...\n')

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Post-Deploy-Validation/1.0'
  })

  const page = await context.newPage()

  try {
    // 1. CSS Loading - Página com estilos visuais
    console.log('📄 Checking CSS loading...')
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: TIMEOUT })

    // Check if CSS is loaded by verifying computed styles
    const cssLoaded = await page.evaluate(() => {
      const body = document.body
      const styles = window.getComputedStyle(body)
      return styles.fontFamily !== '' && styles.backgroundColor !== ''
    })

    if (cssLoaded) {
      logCheck('CSS Loading', 'pass', 'Styles applied successfully')
    } else {
      logCheck('CSS Loading', 'fail', 'CSS not loaded or applied')
    }

    await takeScreenshot(page, 'css-loading')

    // 2. Design System ativo - Cores, tipografia, espaçamento
    console.log('🎨 Checking Design System...')

    const designSystemCheck = await page.evaluate(() => {
      // Try different elements to find where CSS variables are applied
      const root = document.documentElement
      const body = document.body
      const html = document.querySelector('html')

      const rootStyles = getComputedStyle(root)
      const bodyStyles = getComputedStyle(body)
      const htmlStyles = html ? getComputedStyle(html) : null

      // Debug: collect all CSS custom properties from different elements
      const allProperties = []
      let totalProps = 0
      let customPropsCount = 0

      // Check root element
      for (let i = 0; i < rootStyles.length; i++) {
        const prop = rootStyles[i]
        if (prop.startsWith('--')) {
          customPropsCount++
          const value = rootStyles.getPropertyValue(prop)
          if (value && value.trim() !== '') {
            allProperties.push(`root: ${prop}: ${value}`)
          }
        }
      }
      totalProps += rootStyles.length

      // Check body element
      for (let i = 0; i < bodyStyles.length; i++) {
        const prop = bodyStyles[i]
        if (prop.startsWith('--')) {
          customPropsCount++
          const value = bodyStyles.getPropertyValue(prop)
          if (value && value.trim() !== '' && !allProperties.some(p => p.includes(prop))) {
            allProperties.push(`body: ${prop}: ${value}`)
          }
        }
      }
      totalProps += bodyStyles.length

      // Check html element
      if (htmlStyles) {
        for (let i = 0; i < htmlStyles.length; i++) {
          const prop = htmlStyles[i]
          if (prop.startsWith('--')) {
            customPropsCount++
            const value = htmlStyles.getPropertyValue(prop)
            if (value && value.trim() !== '' && !allProperties.some(p => p.includes(prop))) {
              allProperties.push(`html: ${prop}: ${value}`)
            }
          }
        }
        totalProps += htmlStyles.length
      }

      // Add debug info
      allProperties.unshift(`Total CSS properties across elements: ${totalProps}`)
      allProperties.unshift(`Unique custom properties found: ${customPropsCount}`)

      // Check if our test tokens are defined (simpler test first)
      const hasTestToken = rootStyles.getPropertyValue('--test-token') !== '' ||
                          bodyStyles.getPropertyValue('--test-token') !== '' ||
                          (htmlStyles && htmlStyles.getPropertyValue('--test-token') !== '')

      // Check if design system CSS custom properties are defined
      const primaryColorValue = rootStyles.getPropertyValue('--color-primary-500') || bodyStyles.getPropertyValue('--color-primary-500') || (htmlStyles && htmlStyles.getPropertyValue('--color-primary-500')) || ''
      const typographyValue = rootStyles.getPropertyValue('--font-inter') || bodyStyles.getPropertyValue('--font-inter') || (htmlStyles && htmlStyles.getPropertyValue('--font-inter')) || ''
      const backgroundValue = rootStyles.getPropertyValue('--background') || bodyStyles.getPropertyValue('--background') || (htmlStyles && htmlStyles.getPropertyValue('--background')) || ''
      const neutral50Value = rootStyles.getPropertyValue('--color-neutral-50') || bodyStyles.getPropertyValue('--color-neutral-50') || (htmlStyles && htmlStyles.getPropertyValue('--color-neutral-50')) || ''
      const primaryValue = rootStyles.getPropertyValue('--primary') || bodyStyles.getPropertyValue('--primary') || (htmlStyles && htmlStyles.getPropertyValue('--primary')) || ''

      const hasPrimaryColor = primaryColorValue !== ''
      const hasTypography = typographyValue !== ''
      const hasSpacing = backgroundValue !== '' // using background as spacing indicator

      // Check if body has design system classes
      const hasBodyClasses = body.classList.contains('font-sans') || body.classList.contains('antialiased')

      // Additional checks for design system integration
      const hasDesignSystemTokens = neutral50Value !== ''
      const hasSemanticTokens = primaryValue !== '' && backgroundValue !== ''

      // Debug specific token values
      const debugTokens = {
        primaryColor: primaryColorValue,
        typography: typographyValue,
        background: backgroundValue,
        neutral50: neutral50Value,
        primary: primaryValue
      }

      return {
        hasTestToken,
        hasPrimaryColor,
        hasTypography,
        hasSpacing,
        hasBodyClasses,
        hasDesignSystemTokens,
        hasSemanticTokens,
        debugProperties: allProperties.slice(0, 20), // First 20 properties for debugging
        debugTokens
      }
    })

    if (designSystemCheck.hasDesignSystemTokens && designSystemCheck.hasSemanticTokens) {
      logCheck('Design System', 'pass', 'Design system tokens and semantic tokens active')
    } else {
      const missingTokens = Object.entries(designSystemCheck).filter(([k, v]) => !v && !k.includes('hasBodyClasses') && !k.includes('debug')).map(([k]) => k).join(', ')
      logCheck('Design System', 'fail', `Missing tokens: ${missingTokens}`)

      // Debug output
      console.log(`🔍 Debug - Test token found: ${designSystemCheck.hasTestToken}`)
      console.log('🔍 Debug - Token values:')
      console.log(`   --color-primary-500: "${designSystemCheck.debugTokens.primaryColor}"`)
      console.log(`   --font-inter: "${designSystemCheck.debugTokens.typography}"`)
      console.log(`   --background: "${designSystemCheck.debugTokens.background}"`)
      console.log(`   --color-neutral-50: "${designSystemCheck.debugTokens.neutral50}"`)
      console.log(`   --primary: "${designSystemCheck.debugTokens.primary}"`)

      console.log(`🔍 Debug - Found ${designSystemCheck.debugProperties.length} CSS custom properties:`)
      designSystemCheck.debugProperties.slice(0, 10).forEach(prop => console.log(`   ${prop}`))
      if (designSystemCheck.debugProperties.length > 10) {
        console.log(`   ... and ${designSystemCheck.debugProperties.length - 10} more`)
      }
    }

    if (designSystemCheck.hasBodyClasses) {
      logCheck('Design System Classes', 'pass', 'Body has design system classes')
    } else {
      logCheck('Design System Classes', 'fail', 'Body missing design system classes')
    }

    // 3. Componentes funcionais - Botões, forms, navegação
    console.log('🧩 Checking Functional Components...')

    // Check for buttons
    const buttonCount = await page.locator('button, [role="button"]').count()
    if (buttonCount > 0) {
      logCheck('Buttons', 'pass', `${buttonCount} buttons found`)
    } else {
      logCheck('Buttons', 'fail', 'No buttons found')
    }

    // Check for forms
    const formCount = await page.locator('form').count()
    if (formCount > 0) {
      logCheck('Forms', 'pass', `${formCount} forms found`)
    } else {
      logCheck('Forms', 'warn', 'No forms found (may be expected)')
    }

    // Check for navigation
    const navElements = await page.locator('nav, [role="navigation"]').count()
    const linkCount = await page.locator('a[href]').count()
    if (navElements > 0 || linkCount > 5) {
      logCheck('Navigation', 'pass', `${navElements} nav elements, ${linkCount} links`)
    } else {
      logCheck('Navigation', 'fail', 'Insufficient navigation elements')
    }

    await takeScreenshot(page, 'functional-components')

  } finally {
    await context.close()
  }
}

async function validateResponsiveness(browser) {
  console.log('📱 Checking Responsiveness...\n')

  const viewports = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1280, height: 720 }
  ]

  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport,
      userAgent: `Post-Deploy-Validation-${viewport.name}/1.0`
    })

    const page = await context.newPage()

    try {
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: TIMEOUT })

      // Check if content is visible and properly laid out
      const layoutCheck = await page.evaluate(() => {
        const body = document.body
        const html = document.documentElement

        // Check for horizontal overflow
        const hasOverflow = body.scrollWidth > window.innerWidth

        // Check if content is visible
        const contentVisible = body.offsetHeight > 100

        // Check if there are any elements with negative positioning issues
        const elements = Array.from(document.querySelectorAll('*'))
        const hasPositioningIssues = elements.some(el => {
          const rect = el.getBoundingClientRect()
          return rect.width < 0 || rect.height < 0
        })

        // Debug: Find elements causing overflow
        const overflowElements = []
        if (hasOverflow) {
          elements.forEach(el => {
            const rect = el.getBoundingClientRect()
            const computedStyle = window.getComputedStyle(el)
            if (rect.right > window.innerWidth) {
              overflowElements.push({
                tag: el.tagName.toLowerCase(),
                class: el.className,
                right: rect.right,
                width: rect.width,
                left: rect.left,
                position: computedStyle.position,
                display: computedStyle.display
              })
            }
          })
        }

        return {
          hasOverflow,
          contentVisible,
          hasPositioningIssues,
          overflowElements: overflowElements.slice(0, 5), // First 5 overflow elements
          viewportWidth: window.innerWidth,
          bodyScrollWidth: body.scrollWidth
        }
      })

      if (!layoutCheck.hasOverflow && layoutCheck.contentVisible && !layoutCheck.hasPositioningIssues) {
        logCheck(`Responsiveness ${viewport.name}`, 'pass', 'Layout correct, no overflow')
      } else {
        const issues = []
        if (layoutCheck.hasOverflow) issues.push(`horizontal overflow (${layoutCheck.bodyScrollWidth}px > ${layoutCheck.viewportWidth}px)`)
        if (!layoutCheck.contentVisible) issues.push('content not visible')
        if (layoutCheck.hasPositioningIssues) issues.push('positioning issues')

        // Log overflow elements for debugging
        if (layoutCheck.overflowElements.length > 0) {
          console.log(`🔍 Debug - Overflow elements in ${viewport.name}:`)
          layoutCheck.overflowElements.forEach((el, i) => {
            console.log(`  ${i + 1}. ${el.tag}.${el.class.split(' ').slice(0, 2).join('.')} (${el.position}) - right: ${Math.round(el.right)}px, width: ${Math.round(el.width)}px`)
          })
        }

        logCheck(`Responsiveness ${viewport.name}`, 'fail', `Issues: ${issues.join(', ')}`)
      }

      await takeScreenshot(page, `responsive-${viewport.name.toLowerCase()}`)

    } finally {
      await context.close()
    }
  }
}

async function validateUXAdvanced(browser) {
  console.log('🎯 Validating Advanced UX...\n')

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Post-Deploy-Validation-UX/1.0'
  })

  const page = await context.newPage()

  try {
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: TIMEOUT })

    // 1. UX Orchestrator presente - Componente carregado
    console.log('🎭 Checking UX Orchestrator...')

    // Wait a bit for potential orchestration
    await page.waitForTimeout(2000)

    const uxOrchestratorCheck = await page.evaluate(() => {
      // Check if UX orchestrator components are present
      const hasChat = document.querySelector('[data-testid="live-chat"]') !== null
      const hasOnboarding = document.querySelector('[data-testid="onboarding-flow"]') !== null
      const hasRecommendations = document.querySelector('[data-testid="product-recommendations"]') !== null

      // Check for debug overlay if in debug mode
      const debugOverlay = document.querySelector('.fixed.bottom-4.left-4.bg-black\\/80')

      return { hasChat, hasOnboarding, hasRecommendations, debugOverlay: !!debugOverlay }
    })

    const orchestratorPresent = uxOrchestratorCheck.hasChat || uxOrchestratorCheck.hasOnboarding || uxOrchestratorCheck.hasRecommendations || uxOrchestratorCheck.debugOverlay

    if (orchestratorPresent) {
      logCheck('UX Orchestrator', 'pass', 'Component loaded and active')
    } else {
      logCheck('UX Orchestrator', 'warn', 'No UX components detected (may be conditional)')
    }

    await takeScreenshot(page, 'ux-orchestrator')

    // 2. Chat ativo - Aparece após 10s de navegação
    console.log('💬 Checking Chat functionality...')

    // Wait for chat to potentially appear (10+ seconds)
    await page.waitForTimeout(12000)

    const chatCheck = await page.evaluate(() => {
      const chatElements = document.querySelectorAll('[data-testid="live-chat"], .chat-widget, .chat-bubble, [class*="chat"]')
      return chatElements.length > 0
    })

    if (chatCheck) {
      logCheck('Chat Active', 'pass', 'Chat appeared after delay')
    } else {
      logCheck('Chat Active', 'warn', 'Chat not visible (may be conditional or disabled)')
    }

    // 3. Onboarding funcional - Flow de boas-vindas
    console.log('👋 Checking Onboarding flow...')

    const onboardingCheck = await page.evaluate(() => {
      const onboardingElements = document.querySelectorAll('[data-testid="onboarding-flow"], .onboarding, [class*="onboarding"]')
      return onboardingElements.length > 0
    })

    if (onboardingCheck) {
      logCheck('Onboarding Flow', 'pass', 'Onboarding components present')
    } else {
      logCheck('Onboarding Flow', 'warn', 'Onboarding not visible (may be conditional)')
    }

    // 4. Recomendações - Sistema de sugestões ativo
    console.log('💡 Checking Recommendations system...')

    const recommendationsCheck = await page.evaluate(() => {
      const recommendationElements = document.querySelectorAll('[data-testid="product-recommendations"], .recommendations, [class*="recommendation"]')
      return recommendationElements.length > 0
    })

    if (recommendationsCheck) {
      logCheck('Recommendations', 'pass', 'Recommendation system active')
    } else {
      logCheck('Recommendations', 'warn', 'Recommendations not visible (may be conditional)')
    }

    await takeScreenshot(page, 'ux-advanced-final')

  } finally {
    await context.close()
  }
}

async function generateSummary() {
  console.log('\n📊 Post-Deploy Validation Summary')
  console.log('=' .repeat(60))

  console.log(`✅ Passed: ${results.passed}`)
  console.log(`❌ Failed: ${results.failed}`)
  console.log(`⚠️  Warnings: ${results.warnings}`)
  console.log(`📋 Total Checks: ${results.checks.length}`)

  const successRate = ((results.passed / results.checks.length) * 100).toFixed(1)
  console.log(`🎯 Success Rate: ${successRate}%`)

  // Overall status
  if (results.failed === 0 && results.warnings <= 3) {
    console.log('\n🎉 Overall Status: DEPLOY SUCCESSFUL')
    console.log('All core functionality validated!')
  } else if (results.failed <= 2) {
    console.log('\n⚠️  Overall Status: MOSTLY SUCCESSFUL')
    console.log('Minor issues detected. Review warnings.')
  } else {
    console.log('\n❌ Overall Status: DEPLOY ISSUES DETECTED')
    console.log('Critical functionality failures. Review immediately.')
  }

  // Detailed breakdown
  console.log('\n📋 Check Details:')
  results.checks.forEach(check => {
    console.log(`  ${check.status === 'pass' ? '✅' : check.status === 'fail' ? '❌' : '⚠️'} ${check.name}: ${check.message}`)
  })

  // Recommendations
  console.log('\n💡 Recommendations:')
  if (results.failed > 0) {
    console.log('• Address failed checks before considering deploy complete')
    console.log('• Check server logs for errors')
    console.log('• Verify environment variables are set correctly')
  }
  if (results.warnings > 0) {
    console.log('• Review warning items for potential improvements')
    console.log('• Consider enabling debug mode for more detailed checks')
  }
  console.log('• Run this validation script in CI/CD pipeline')
  console.log('• Monitor Core Web Vitals in production')

  return results
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2)
  const checkArg = args.find(arg => arg.startsWith('--check='))

  if (checkArg) {
    return checkArg.split('=')[1]
  }

  return 'all'
}

async function main() {
  const checkType = parseArgs()
  let browser

  try {
    console.log(`🌐 Validating deployment at: ${BASE_URL}`)
    console.log(`⏱️  Timeout: ${TIMEOUT}ms`)
    console.log(`🐛 Debug mode: ${DEBUG ? 'ON' : 'OFF'}`)
    console.log(`🔍 Check type: ${checkType}\n`)

    browser = await chromium.launch({
      headless: !DEBUG,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    // Run validation checks based on type
    switch (checkType) {
      case 'css':
        await validateCoreFunctionality(browser)
        break
      case 'design-system':
        await validateCoreFunctionality(browser)
        break
      case 'components':
        await validateCoreFunctionality(browser)
        break
      case 'core':
        await validateCoreFunctionality(browser)
        console.log('')
        await validateResponsiveness(browser)
        break
      case 'responsive':
        await validateResponsiveness(browser)
        break
      case 'ux':
        await validateUXAdvanced(browser)
        break
      case 'ux-orchestrator':
        await validateUXAdvanced(browser)
        break
      case 'chat':
        await validateUXAdvanced(browser)
        break
      case 'onboarding':
        await validateUXAdvanced(browser)
        break
      case 'recommendations':
        await validateUXAdvanced(browser)
        break
      case 'all':
      default:
        await validateCoreFunctionality(browser)
        console.log('')
        await validateResponsiveness(browser)
        console.log('')
        await validateUXAdvanced(browser)
        break
    }

    // Generate final summary
    const summary = await generateSummary()

    // Exit with appropriate code
    if (results.failed > 0) {
      process.exit(1)
    } else {
      process.exit(0)
    }

  } catch (error) {
    console.error('❌ Validation failed:', error.message)
    if (DEBUG) {
      console.error(error.stack)
    }
    process.exit(1)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n⚠️  Validation interrupted by user')
  process.exit(130)
})

process.on('SIGTERM', () => {
  console.log('\n⚠️  Validation terminated')
  process.exit(143)
})

main()
