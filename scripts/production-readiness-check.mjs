#!/usr/bin/env node

/**
 * Production Readiness Check Script
 * Validates critical requirements before production deployment
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const CHECKS = {
  build: {
    name: 'Build Production',
    command: 'npm run build',
    critical: true,
    description: 'Build must pass without errors'
  },
  typecheck: {
    name: 'TypeScript Compilation',
    command: 'npm run typecheck',
    critical: true,
    description: 'All TypeScript must compile without errors'
  },
  lint: {
    name: 'Code Quality (ESLint)',
    command: 'npm run lint',
    critical: false,
    description: 'Code should follow quality standards'
  },
  bundle: {
    name: 'Bundle Analysis',
    command: 'npm run analyze:bundle',
    critical: false,
    description: 'Bundle size should be optimized'
  }
}

const RESULTS = {
  passed: [],
  failed: [],
  warnings: []
}

function runCheck(checkId, check) {
  console.log(`\n🔍 Running: ${check.name}`)
  console.log(`   ${check.description}`)

  try {
    const output = execSync(check.command, {
      encoding: 'utf8',
      timeout: 300000, // 5 minutes
      stdio: check.critical ? 'pipe' : 'inherit'
    })

    if (check.critical) {
      RESULTS.passed.push(checkId)
      console.log(`✅ PASSED: ${check.name}`)
    } else {
      RESULTS.passed.push(checkId)
      console.log(`✅ PASSED: ${check.name}`)
    }

    return true
  } catch (error) {
    if (check.critical) {
      RESULTS.failed.push(checkId)
      console.log(`❌ FAILED (CRITICAL): ${check.name}`)
      console.log(`   Error: ${error.message}`)
    } else {
      RESULTS.warnings.push(checkId)
      console.log(`⚠️  WARNING: ${check.name}`)
      console.log(`   Error: ${error.message}`)
    }
    return false
  }
}

function validateEnvironment() {
  console.log('\n🌍 Environment Validation:')

  // Check package.json exists
  if (!fs.existsSync('package.json')) {
    RESULTS.failed.push('env-package')
    console.log('❌ FAILED: package.json not found')
    return false
  }

  // Check next.config.mjs exists
  if (!fs.existsSync('next.config.mjs')) {
    RESULTS.failed.push('env-nextconfig')
    console.log('❌ FAILED: next.config.mjs not found')
    return false
  }

  // Check .next build directory
  if (!fs.existsSync('.next')) {
    RESULTS.warnings.push('env-build-dir')
    console.log('⚠️  WARNING: .next directory not found (run build first)')
  }

  console.log('✅ PASSED: Environment validation')
  RESULTS.passed.push('env-validation')
  return true
}

function validateBundleSize() {
  console.log('\n📦 Bundle Size Validation:')

  try {
    const buildOutput = fs.readFileSync('.next/static/chunks/webpack-main.js.map', 'utf8')
    const sizeKb = (buildOutput.length / 1024).toFixed(1)

    console.log(`   Main bundle size: ${sizeKb} KB`)

    if (parseFloat(sizeKb) > 200) {
      RESULTS.warnings.push('bundle-size')
      console.log('⚠️  WARNING: Bundle size exceeds 200KB recommendation')
    } else {
      RESULTS.passed.push('bundle-size')
      console.log('✅ PASSED: Bundle size within limits')
    }
  } catch (error) {
    RESULTS.warnings.push('bundle-size-check')
    console.log('⚠️  WARNING: Could not check bundle size')
  }
}

function generateReport() {
  console.log('\n' + '='.repeat(60))
  console.log('🚀 PRODUCTION READINESS REPORT')
  console.log('='.repeat(60))

  console.log(`\n✅ PASSED: ${RESULTS.passed.length}`)
  RESULTS.passed.forEach(check => {
    const checkInfo = CHECKS[check] || { name: check }
    console.log(`   • ${checkInfo.name}`)
  })

  if (RESULTS.warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS: ${RESULTS.warnings.length}`)
    RESULTS.warnings.forEach(check => {
      const checkInfo = CHECKS[check] || { name: check }
      console.log(`   • ${checkInfo.name}`)
    })
  }

  if (RESULTS.failed.length > 0) {
    console.log(`\n❌ FAILED (CRITICAL): ${RESULTS.failed.length}`)
    RESULTS.failed.forEach(check => {
      const checkInfo = CHECKS[check] || { name: check }
      console.log(`   • ${checkInfo.name}`)
    })
  }

  console.log('\n' + '='.repeat(60))

  // Final decision
  const hasCriticalFailures = RESULTS.failed.length > 0
  const hasWarnings = RESULTS.warnings.length > 0

  if (hasCriticalFailures) {
    console.log('❌ DEPLOYMENT BLOCKED: Critical failures must be resolved')
    console.log('\n💡 Fix critical issues and re-run this check')
    process.exit(1)
  } else if (hasWarnings) {
    console.log('⚠️  DEPLOYMENT WITH WARNINGS: Review warnings before production')
    console.log('\n💡 Consider fixing warnings for optimal production experience')
    process.exit(0)
  } else {
    console.log('✅ PRODUCTION READY: All checks passed!')
    console.log('\n🚀 Ready for deployment')
    process.exit(0)
  }
}

async function main() {
  console.log('🔬 Production Readiness Check Starting...')
  console.log('Target: Enterprise Landing Page with A/B Testing & PWA')

  // Run environment validation
  validateEnvironment()

  // Run bundle size check
  validateBundleSize()

  // Run automated checks
  for (const [checkId, check] of Object.entries(CHECKS)) {
    await runCheck(checkId, check)
  }

  // Generate final report
  generateReport()
}

main().catch(error => {
  console.error('❌ Production readiness check failed:', error)
  process.exit(1)
})
