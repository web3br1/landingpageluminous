#!/usr/bin/env node

/**
 * Duplications Audit Script - Sprint 4: Quality Assurance
 *
 * Detecta duplicações de código automaticamente
 * Executa em CI para prevenir regressões
 *
 * Usage: node scripts/check-duplications.mjs [--fix] [--report]
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Configurações
const CONFIG = {
  minLines: 6, // Mínimo de linhas para considerar duplicação
  minTokens: 50, // Mínimo de tokens para considerar duplicação
  exclude: [
    'node_modules/**',
    '.next/**',
    'dist/**',
    'build/**',
    '**/*.test.*',
    '**/*.spec.*',
    '**/*.config.*',
    '**/package.json',
    '**/tsconfig.json',
    '**/eslint.config.js',
    '**/.eslintrc*',
    '**/vitest.config.*',
    '**/playwright.config.*',
    '**/postcss.config.*',
    '**/tailwind.config.*',
  ],
  // Padrões específicos para detectar duplicações conhecidas
  patterns: {
    formatBytes: /formatBytes\s*\(\s*bytes[^}]*}/g,
    formatCurrency: /formatCurrency\s*\([^}]*Intl\.NumberFormat/g,
    cn: /function cn\(|const cn = \(/g,
    useLocalStorage: /function useLocalStorage\(|const useLocalStorage = /g,
  }
}

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

// Função de logging colorido
function log(color, message) {
  console.log(`${color}${message}${colors.reset}`)
}

// Detectar duplicações usando análise simples
async function detectDuplications() {
  log(colors.blue, '🔍 Scanning for code duplications...')

  const results = {
    formatBytes: [],
    formatCurrency: [],
    cn: [],
    useLocalStorage: [],
    total: 0,
  }

  try {
    // Verificar arquivos diretamente (mais compatível cross-platform)
    const fs = await import('fs/promises')
    const path = await import('path')
    const { glob } = await import('glob')

    // Procurar por padrões específicos
    for (const [patternName, regex] of Object.entries(CONFIG.patterns)) {
      log(colors.cyan, `  Checking ${patternName}...`)

      const files = await glob('**/*.{ts,tsx,js,jsx,mjs}', {
        ignore: CONFIG.exclude,
        cwd: process.cwd()
      })

      const matches = []

      for (const file of files) {
        try {
          const content = await fs.readFile(path.join(process.cwd(), file), 'utf8')
          const lines = content.split('\n')

          lines.forEach((line, index) => {
            if (regex.test(line)) {
              matches.push(`${file}:${index + 1}:${line.trim()}`)
            }
          })
        } catch (error) {
          // Ignorar erros de leitura
        }
      }

      if (matches.length > 1) {
        results[patternName] = matches
        results.total += matches.length - 1 // -1 porque uma ocorrência centralizada é esperada
        log(colors.yellow, `    ⚠️  Found ${matches.length} occurrences of ${patternName}`)
        matches.slice(0, 3).forEach(match => log(colors.gray, `       ${match}`))
        if (matches.length > 3) {
          log(colors.gray, `       ... and ${matches.length - 3} more`)
        }
      } else if (matches.length === 1) {
        log(colors.green, `    ✅ Only 1 occurrence of ${patternName} (expected)`)
      } else {
        log(colors.green, `    ✅ No occurrences of ${patternName} found`)
      }
    }
  } catch (error) {
    log(colors.red, `❌ Error during duplication scan: ${error.message}`)
    return results
  }

  return results
}

// Verificar se duplicações foram corrigidas
function checkKnownDuplications() {
  log(colors.blue, '🔍 Checking known duplication fixes...')

  const issues = []

  // Verificar se arquivos duplicados foram removidos
  const removedFiles = [
    'tests/landing-page-e2e.spec.ts',
    'tests/visual-regression.spec.ts',
    'tests/load-performance.spec.ts',
    'components/ui/cta-button.tsx',
    'components/ui/fade-up.tsx',
  ]

  for (const file of removedFiles) {
    if (existsSync(join(process.cwd(), file))) {
      issues.push(`File ${file} still exists (should be removed)`)
    }
  }

  // Verificar se implementações centralizadas existem
  const requiredFiles = [
    'lib/utils/formatters.ts',
    'lib/utils/formatters.mjs',
    'lib/utils/storage.ts',
    'lib/utils/class-utils.ts',
    'lib/hooks/use-local-storage.ts',
  ]

  for (const file of requiredFiles) {
    if (!existsSync(join(process.cwd(), file))) {
      issues.push(`File ${file} missing (should exist)`)
    }
  }

  return issues
}

// Gerar relatório
function generateReport(results, issues) {
  const report = {
    timestamp: new Date().toISOString(),
    totalDuplications: results.total,
    knownIssues: issues,
    patternResults: results,
    status: results.total === 0 && issues.length === 0 ? 'PASS' : 'FAIL',
  }

  const reportPath = join(process.cwd(), 'reports', 'duplications-audit.json')
  writeFileSync(reportPath, JSON.stringify(report, null, 2))

  return report
}

// Função principal
async function main() {
  const args = process.argv.slice(2)
  const shouldFix = args.includes('--fix')
  const shouldReport = args.includes('--report')

  log(colors.blue, '🚀 Starting Duplications Audit')
  log(colors.gray, '================================')

  // Verificar correções conhecidas
  const issues = checkKnownDuplications()
  if (issues.length > 0) {
    log(colors.red, '❌ Known duplication fixes not applied:')
    issues.forEach(issue => log(colors.red, `   ${issue}`))
  } else {
    log(colors.green, '✅ All known duplication fixes applied')
  }

  // Detectar novas duplicações
  const results = await detectDuplications()

  log(colors.gray, '================================')
  log(colors.blue, `📊 Results Summary:`)
  log(colors.gray, `   Total duplications found: ${results.total}`)

  if (results.total > 0) {
    log(colors.red, '❌ Duplications detected!')
    for (const [pattern, occurrences] of Object.entries(results)) {
      if (pattern !== 'total' && occurrences.length > 1) {
        log(colors.red, `   ${pattern}: ${occurrences.length} occurrences`)
      }
    }
  } else {
    log(colors.green, '✅ No duplications detected!')
  }

  // Gerar relatório se solicitado
  if (shouldReport) {
    const report = generateReport(results, issues)
    log(colors.blue, `📄 Report saved to: reports/duplications-audit.json`)
    log(colors.gray, `   Status: ${report.status}`)
  }

  // Exit code baseado nos resultados
  const hasIssues = results.total > 0 || issues.length > 0
  if (hasIssues) {
    log(colors.red, '💥 Audit FAILED - Duplications found or fixes not applied')
    process.exit(1)
  } else {
    log(colors.green, '🎉 Audit PASSED - No duplications detected')
    process.exit(0)
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { detectDuplications, checkKnownDuplications }
