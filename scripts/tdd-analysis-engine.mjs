#!/usr/bin/env node

/**
 * Simple Test Analyzer - Versão Simplificada
 * Executa testes e gera relatório básico
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

class SimpleTestAnalyzer {
  constructor() {
    this.resultsDir = path.join(process.cwd(), 'test-results')
    this.ensureDirectories()
  }

  ensureDirectories() {
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true })
    }
  }

  /**
   * Executa análise completa de testes
   */
  async runAnalysis() {
    console.log('🧪 Executando análise de testes...\n')

    try {
      const results = {
        timestamp: new Date().toISOString(),
        vitest: await this.runVitestTests(),
        eslint: await this.runEslintCheck(),
        typescript: await this.runTypeScriptCheck(),
        coverage: await this.runCoverageAnalysis(),
        summary: {}
      }

      results.summary = this.generateSummary(results)

      this.saveResults(results)
      this.printReport(results)

      return results

    } catch (error) {
      console.error('❌ Erro na análise:', error.message)
      return null
    }
  }

  /**
   * Executa testes com Vitest
   */
  async runVitestTests() {
    console.log('📋 Executando testes Vitest...')

    try {
      const output = execSync('npm run test:unit', {
        encoding: 'utf8',
        timeout: 300000 // 5 minutos
      })

      const passed = (output.match(/✓/g) || []).length
      const failed = (output.match(/✗|✕/g) || []).length
      const total = passed + failed

      return {
        success: failed === 0,
        total,
        passed,
        failed,
        output: output.slice(-1000) // últimos 1000 chars
      }

    } catch (error) {
      return {
        success: false,
        total: 0,
        passed: 0,
        failed: 1,
        error: error.message
      }
    }
  }

  /**
   * Executa verificação ESLint
   */
  async runEslintCheck() {
    console.log('🔍 Executando ESLint...')

    try {
      const output = execSync('npm run lint', {
        encoding: 'utf8',
        timeout: 120000 // 2 minutos
      })

      const errors = (output.match(/error/g) || []).length
      const warnings = (output.match(/warning/g) || []).length

      return {
        success: errors === 0,
        errors,
        warnings,
        clean: errors === 0 && warnings === 0
      }

    } catch (error) {
      const output = error.stdout || error.stderr || ''
      const errors = (output.match(/error/g) || []).length
      const warnings = (output.match(/warning/g) || []).length

      return {
        success: false,
        errors,
        warnings,
        error: error.message
      }
    }
  }

  /**
   * Executa verificação TypeScript
   */
  async runTypeScriptCheck() {
    console.log('🔧 Executando TypeScript check...')

    try {
      execSync('npm run typecheck', {
        encoding: 'utf8',
        timeout: 120000 // 2 minutos
      })

      return {
        success: true,
        errors: 0
      }

    } catch (error) {
      const output = error.stdout || error.stderr || ''
      const errorLines = output.split('\n').filter(line =>
        line.includes('error TS') || line.includes('Found ')
      )

      const errorCount = errorLines.length > 0 ?
        parseInt(errorLines[0].match(/Found (\d+) errors?/)?.[1] || '0') : 0

      return {
        success: false,
        errors: errorCount,
        error: error.message
      }
    }
  }

  /**
   * Executa análise de cobertura (simplificada)
   */
  async runCoverageAnalysis() {
    console.log('📊 Analisando cobertura...')

    try {
      const output = execSync('npm run test:coverage', {
        encoding: 'utf8',
        timeout: 300000 // 5 minutos
      })

      // Extrai percentual de cobertura da saída
      const coverageMatch = output.match(/All files[^│]*│[^│]*│[^│]*│[^│]*│\s*(\d+\.\d+)/)
      const coverage = coverageMatch ? parseFloat(coverageMatch[1]) : 0

      return {
        success: true,
        coverage: coverage,
        threshold: 80,
        met: coverage >= 80
      }

    } catch (error) {
      return {
        success: false,
        coverage: 0,
        threshold: 80,
        met: false,
        error: error.message
      }
    }
  }

  /**
   * Gera resumo dos resultados
   */
  generateSummary(results) {
    const allPassed = results.vitest.success &&
                     results.eslint.success &&
                     results.typescript.success &&
                     results.coverage.met

    const score = [
      results.vitest.success ? 25 : 0,
      results.eslint.success ? 25 : 0,
      results.typescript.success ? 25 : 0,
      results.coverage.met ? 25 : 0
    ].reduce((a, b) => a + b, 0)

    return {
      overall: allPassed ? 'PASS' : 'FAIL',
      score: `${score}/100`,
      grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : 'F',
      tests: `${results.vitest.passed}/${results.vitest.total} passed`,
      linting: `${results.eslint.errors} errors, ${results.eslint.warnings} warnings`,
      types: results.typescript.success ? 'OK' : `${results.typescript.errors} errors`,
      coverage: `${results.coverage.coverage.toFixed(1)}%`
    }
  }

  /**
   * Salva resultados em arquivo
   */
  saveResults(results) {
    const filename = `analysis-${new Date().toISOString().slice(0, 10)}.json`
    const filepath = path.join(this.resultsDir, filename)

    fs.writeFileSync(filepath, JSON.stringify(results, null, 2))
    console.log(`💾 Resultados salvos em: ${filepath}
