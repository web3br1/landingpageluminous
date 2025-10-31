#!/usr/bin/env node

/**
 * CI Bundle Gate - Sprint 3: Governância Automática
 *
 * Porta de qualidade que executa automaticamente em CI
 * Bloqueia merges se bundle estiver acima do budget
 */

import { execSync } from 'child_process'
import { formatBytes } from '../lib/utils/formatters.mjs'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

// Configuração
const CONFIG = {
  budgets: {
    marketing: 900 * 1024,    // 900KB (atual: ~850KB)
    product: 900 * 1024,      // 900KB (atual: ~850KB)
    admin: 1000 * 1024,       // 1000KB (lazy loaded)
    framework: 300 * 1024,    // 300KB (atual: ~200KB)
    total: 2500 * 1024        // 2.5MB total (atual: ~1.8MB)
  },
  thresholds: {
    warning: 0.9,   // 90% do budget = warning
    error: 1.0      // 100% do budget = error
  },
  requiredFiles: [
    '.next/analyze/client.html',
    '.next/static/chunks/main.js'
  ]
}

// Cores para output
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`)
}


// Verificar pré-requisitos
function checkPrerequisites() {
  log(colors.blue, '🔍 Checking prerequisites...')

  for (const file of CONFIG.requiredFiles) {
    if (!existsSync(join(process.cwd(), file))) {
      log(colors.red, `❌ Missing required file: ${file}`)
      log(colors.yellow, '💡 Run: npm run build && npm run analyze:bundle')
      return false
    }
  }

  log(colors.green, '✅ All prerequisites met')
  return true
}

// Executar análise de bundle
function runBundleAnalysis() {
  log(colors.blue, '📊 Running bundle analysis...')

  try {
    // Executar script de análise
    execSync('node scripts/bundle-analysis-report.mjs', {
      stdio: 'inherit',
      cwd: process.cwd()
    })

    log(colors.green, '✅ Bundle analysis completed')
    return true
  } catch (error) {
    log(colors.red, '❌ Bundle analysis failed')
    console.error(error.message)
    return false
  }
}

// Ler resultados da análise
function readAnalysisResults() {
  const resultsPath = join(process.cwd(), 'reports', 'bundle-analysis-latest.json')

  if (!existsSync(resultsPath)) {
    log(colors.red, '❌ Analysis results not found')
    return null
  }

  try {
    const data = JSON.parse(readFileSync(resultsPath, 'utf8'))
    return data
  } catch (error) {
    log(colors.red, '❌ Failed to read analysis results')
    return null
  }
}

// Validar budgets
function validateBudgets(analysis) {
  log(colors.blue, '🚨 Validating bundle budgets...')

  let hasErrors = false
  let hasWarnings = false

  console.log('') // Linha em branco

  // Verificar cada chunk
  for (const [chunk, budget] of Object.entries(CONFIG.budgets)) {
    const chunkData = analysis.analysis.chunks[chunk]
    if (!chunkData) continue

    const size = chunkData.size
    const usagePercent = (size / budget) * 100
    const warningThreshold = CONFIG.thresholds.warning * budget
    const errorThreshold = CONFIG.thresholds.error * budget

    let status, color, icon

    if (size > errorThreshold) {
      status = 'ERROR'
      color = colors.red
      icon = '❌'
      hasErrors = true
    } else if (size > warningThreshold) {
      status = 'WARNING'
      color = colors.yellow
      icon = '⚠️'
      hasWarnings = true
    } else {
      status = 'PASS'
      color = colors.green
      icon = '✅'
    }

    console.log(`${icon} ${chunk.padEnd(10)} | ${formatBytes(size).padEnd(8)} | ${usagePercent.toFixed(1).padEnd(5)}% | ${color}${status}${colors.reset}`)
  }

  console.log('') // Linha em branco

  return { hasErrors, hasWarnings }
}

// Gerar relatório para CI
function generateCIReport(analysis, validation) {
  const report = {
    status: validation.hasErrors ? 'failure' : validation.hasWarnings ? 'warning' : 'success',
    timestamp: new Date().toISOString(),
    analysis: analysis.analysis,
    validation: {
      hasErrors: validation.hasErrors,
      hasWarnings: validation.hasWarnings,
      budgets: CONFIG.budgets,
      thresholds: CONFIG.thresholds
    },
    summary: {
      totalSize: analysis.analysis.total.size,
      totalChunks: analysis.analysis.total.chunks,
      compressedSize: analysis.analysis.total.compressedSize
    }
  }

  // Salvar relatório CI
  const ciReportPath = join(process.cwd(), 'reports', 'ci-bundle-report.json')
  require('fs').writeFileSync(ciReportPath, JSON.stringify(report, null, 2))

  return report
}

// Função principal
async function main() {
  console.log(`${colors.bold}🚀 CI Bundle Gate - Sprint 3${colors.reset}\n`)

  try {
    // 1. Verificar pré-requisitos
    if (!checkPrerequisites()) {
      process.exit(1)
    }

    // 2. Executar análise
    if (!runBundleAnalysis()) {
      process.exit(1)
    }

    // 3. Ler resultados
    const analysis = readAnalysisResults()
    if (!analysis) {
      process.exit(1)
    }

    // 4. Validar budgets
    const validation = validateBudgets(analysis)

    // 5. Gerar relatório CI
    const report = generateCIReport(analysis, validation)

    // 6. Resultado final
    console.log(`${colors.bold}📋 Final Result:${colors.reset}`)

    if (validation.hasErrors) {
      log(colors.red, '❌ BUILD FAILED: Bundle budget exceeded!')
      log(colors.yellow, '💡 Fix bundle size issues before merging')
      log(colors.blue, '📊 Check reports/bundle-analysis-*.md for details')
      process.exit(1)
    } else if (validation.hasWarnings) {
      log(colors.yellow, '⚠️ BUILD PASSED WITH WARNINGS: Bundle approaching limits')
      log(colors.blue, '📊 Check reports/bundle-analysis-*.md for optimization suggestions')
      process.exit(0)
    } else {
      log(colors.green, '✅ BUILD PASSED: Bundle within budgets')
      log(colors.blue, '🎉 Ready for deployment!')
      process.exit(0)
    }

  } catch (error) {
    log(colors.red, `❌ CI Bundle Gate failed: ${error.message}`)
    process.exit(1)
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { CONFIG, validateBudgets }
