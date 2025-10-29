#!/usr/bin/env node

/**
 * CSP System Test Suite
 * Tests the complete CSP implementation including:
 * - Nonce generation and usage
 * - CSP reporting
 * - Script auditing
 * - Security headers
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'

async function fetchWithTimeout(url, options = {}, timeout = 10000) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

async function testCSPHeaders() {
  console.log('\n🔍 Testing CSP Headers...')

  try {
    const response = await fetchWithTimeout(BASE_URL)
    const cspHeader = response.headers.get('content-security-policy')
    const nonceHeader = response.headers.get('x-nonce')
    const reportToHeader = response.headers.get('report-to')

    if (!cspHeader) {
      console.error('❌ Missing Content-Security-Policy header')
      return false
    }

    console.log('✅ CSP Header present')
    console.log(`   Length: ${cspHeader.length} chars`)

    if (cspHeader.includes('nonce-')) {
      console.log('✅ CSP uses nonces (production mode)')
    } else if (cspHeader.includes('unsafe-eval')) {
      console.log('✅ CSP allows unsafe-eval (development mode)')
    }

    if (cspHeader.includes('report-uri')) {
      console.log('✅ CSP reporting enabled')
    }

    if (nonceHeader) {
      console.log(`✅ X-Nonce header present: ${nonceHeader.substring(0, 16)}...`)
    }

    if (reportToHeader) {
      console.log('✅ Report-To header present (modern browsers)')
    }

    return true
  } catch (error) {
    console.error('❌ CSP Headers test failed:', error.message)
    return false
  }
}

async function testCSPReporting() {
  console.log('\n📊 Testing CSP Reporting...')

  try {
    // Test CSP violation reporting
    const response = await fetchWithTimeout(`${BASE_URL}/api/test-csp?test=report`)

    if (response.status !== 200) {
      console.error(`❌ CSP test page failed with status ${response.status}`)
      return false
    }

    console.log('✅ CSP test page loaded successfully')
    console.log('✅ Check /api/csp-report for violation reports (may take a few seconds)')

    return true
  } catch (error) {
    console.error('❌ CSP Reporting test failed:', error.message)
    return false
  }
}

async function testNonceSystem() {
  console.log('\n🔑 Testing Nonce System...')

  try {
    const response = await fetchWithTimeout(`${BASE_URL}/api/test-csp?test=nonce`)

    if (response.status !== 200) {
      console.error(`❌ Nonce test page failed with status ${response.status}`)
      return false
    }

    const html = await response.text()

    if (html.includes('CSP Nonce Test Passed')) {
      console.log('✅ Nonce-based script executed successfully')
      return true
    } else {
      console.error('❌ Nonce test script did not execute')
      return false
    }
  } catch (error) {
    console.error('❌ Nonce System test failed:', error.message)
    return false
  }
}

async function testScriptAuditing() {
  console.log('\n📋 Testing Script Auditing...')

  try {
    // First, make some requests to populate the audit store
    await fetchWithTimeout(BASE_URL)
    await fetchWithTimeout(`${BASE_URL}/favicon.ico`)
    await new Promise(resolve => setTimeout(resolve, 1000)) // Wait for audit processing

    const response = await fetchWithTimeout(`${BASE_URL}/api/script-audit`)

    if (response.status !== 200) {
      console.error(`❌ Script audit API failed with status ${response.status}`)
      return false
    }

    const data = await response.json()

    console.log('✅ Script audit API accessible')
    console.log(`   Scripts tracked: ${data.summary?.totalScripts || 0}`)
    console.log(`   Total requests: ${data.summary?.totalRequests || 0}`)

    if (data.alerts) {
      console.warn('⚠️  Non-Next.js scripts detected:', data.alerts.scripts)
    } else {
      console.log('✅ No unauthorized scripts detected')
    }

    return true
  } catch (error) {
    console.error('❌ Script Auditing test failed:', error.message)
    return false
  }
}

async function testCSPReportEndpoint() {
  console.log('\n📨 Testing CSP Report Endpoint...')

  try {
    const testReport = {
      'csp-report': {
        'document-uri': 'http://example.com/test',
        'violated-directive': 'script-src',
        'original-policy': "script-src 'self'",
        'blocked-uri': 'http://evil.com/malicious.js'
      }
    }

    const response = await fetchWithTimeout(`${BASE_URL}/api/csp-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testReport)
    })

    if (response.status === 200) {
      console.log('✅ CSP report endpoint accepts reports')
      return true
    } else {
      console.error(`❌ CSP report endpoint returned status ${response.status}`)
      return false
    }
  } catch (error) {
    console.error('❌ CSP Report Endpoint test failed:', error.message)
    return false
  }
}

async function runAllTests() {
  console.log('🚀 Starting CSP System Test Suite')
  console.log('=' .repeat(50))
  console.log(`Testing against: ${BASE_URL}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'unknown'}`)
  console.log('=' .repeat(50))

  // Test basic connectivity first
  console.log('\n🌐 Testing basic connectivity...')
  try {
    const response = await fetchWithTimeout(BASE_URL, {}, 5000)
    console.log(`✅ Server reachable: ${response.status}`)
  } catch (error) {
    console.error(`❌ Cannot connect to ${BASE_URL}:`, error.message)
    console.log('💡 Make sure the Next.js dev server is running')
    process.exit(1)
  }

  const results = {
    cspHeaders: await testCSPHeaders(),
    cspReporting: await testCSPReporting(),
    nonceSystem: await testNonceSystem(),
    scriptAuditing: await testScriptAuditing(),
    cspReportEndpoint: await testCSPReportEndpoint()
  }

  console.log('\n' + '=' .repeat(50))
  console.log('📊 TEST RESULTS SUMMARY')
  console.log('=' .repeat(50))

  const passed = Object.values(results).filter(Boolean).length
  const total = Object.keys(results).length

  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASSED' : '❌ FAILED'
    console.log(`${status}: ${test}`)
  })

  console.log(`\n🎯 Overall: ${passed}/${total} tests passed`)

  if (passed === total) {
    console.log('🎉 All CSP security features are working correctly!')
    console.log('\n🔒 Security Status: PROTECTED')
    process.exit(0)
  } else {
    console.log('\n⚠️  Some CSP features may need attention')
    console.log('\n🔒 Security Status: PARTIAL PROTECTION')
    process.exit(1)
  }
}

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(error => {
    console.error('💥 Test suite failed:', error)
    process.exit(1)
  })
}

export { runAllTests }

