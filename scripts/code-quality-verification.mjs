#!/usr/bin/env node

/**
 * Code Quality Verification - Lint and TypeScript Analysis
 * Integrates with TDD quality system to provide comprehensive code analysis
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

class CodeQualityVerifier {
  constructor() {
    this.errors = []
    this.warnings = []
    this.metrics = {
      typescript: { errors: 0, warnings: 0, score: 0 },
      eslint: { errors: 0, warnings: 0, score: 0 },
      totalFiles: 0,
      analyzedFiles: 0,
      errorDensity: 0
    }
  }

  async verifyCodeQuality() {
    console.log('🔍 Iniciando verificação de qualidade de código...')

    try {
      // 1. TypeScript analysis
      await this.analyzeTypeScript()

      // 2. ESLint analysis
      await this.analyzeESLint()

      // 3. Calculate metrics
      this.calculateMetrics()

      // 4. Generate report
      this.generateReport()

      return this.metrics

    } catch (error) {
      console.error('❌ Erro na verificação de qualidade:', error.message)
      throw error
    }
  }

  async analyzeTypeScript() {
    console.log('🔧 Analisando TypeScript...')

    try {
      // Run TypeScript compiler with detailed output
      const output = execSync('npx tsc --noEmit --pretty false --listFiles false', {
        encoding: 'utf8',
        stdio: 'pipe',
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      })

      console.log('✅ TypeScript: Sem erros encontrados')
      this.metrics.typescript.score = 100

    } catch (error) {
      console.log('⚠️ TypeScript: Erros encontrados')

      // Parse TypeScript errors
      const errorLines = error.stdout.split('\n').filter(line => line.trim())

      for (const line of errorLines) {
        if (line.includes('.ts') || line.includes('.tsx')) {
          const tsError = this.parseTypeScriptError(line)
          if (tsError) {
            if (tsError.severity === 'error') {
              this.errors.push(tsError)
              this.metrics.typescript.errors++
            } else {
              this.warnings.push(tsError)
              this.metrics.typescript.warnings++
            }
          }
        }
      }

      // Calculate TypeScript score based on errors
      this.metrics.typescript.score = Math.max(0, 100 - (this.metrics.typescript.errors * 5) - (this.metrics.typescript.warnings * 2))

    }
  }

  async analyzeESLint() {
    console.log('🧹 Analisando ESLint...')

    try {
      // First try with JSON format
      const output = execSync('npx eslint . --format json --max-warnings 0', {
        encoding: 'utf8',
        stdio: 'pipe',
        maxBuffer: 1024 * 1024 * 10
      })

      const results = JSON.parse(output)
      this.processESLintResults(results)

    } catch (error) {
      console.log('⚠️ ESLint JSON falhou, tentando análise de texto...')

      try {
        // Fallback: run ESLint and parse text output
        const textOutput = execSync('npx eslint . --max-warnings 0', {
          encoding: 'utf8',
          stdio: 'pipe',
          maxBuffer: 1024 * 1024 * 10
        })

        // If no error, score is perfect
        this.metrics.eslint.score = 100
        this.metrics.eslint.errors = 0
        this.metrics.eslint.warnings = 0
        console.log('✅ ESLint: Nenhum erro encontrado')

      } catch (textError) {
        // Parse the error output to extract issue counts
        const errorText = textError.stdout || textError.stderr || ''

        // Count errors and warnings from text output
        const errorMatches = errorText.match(/error/g) || []
        const warningMatches = errorText.match(/warning/g) || []

        const totalErrors = errorMatches.length
        const totalWarnings = warningMatches.length

        // Try to extract some file information
        const fileMatches = errorText.match(/\S+\.(ts|tsx|js|jsx)/g) || []
        const uniqueFiles = new Set(fileMatches)
        this.metrics.analyzedFiles = uniqueFiles.size

        this.metrics.eslint.errors = totalErrors
        this.metrics.eslint.warnings = totalWarnings

        // Calculate score based on error count
        this.metrics.eslint.score = Math.max(0, 100 - (totalErrors * 2) - (totalWarnings * 0.5))

        console.log(`📊 ESLint: ${totalErrors} erros, ${totalWarnings} avisos encontrados`)

        // Extract some sample errors for reporting
        this.extractSampleErrorsFromText(errorText)
      }
    }
  }

  processESLintResults(results) {
    let totalErrors = 0
    let totalWarnings = 0
    let filesWithIssues = 0

    for (const result of results) {
      if (result.messages && result.messages.length > 0) {
        this.metrics.analyzedFiles++
        filesWithIssues++

        for (const message of result.messages) {
          const eslintIssue = {
            file: result.filePath,
            line: message.line || 1,
            column: message.column || 1,
            rule: message.ruleId || 'unknown',
            message: message.message || 'Unknown error',
            severity: message.severity === 2 ? 'error' : 'warning',
            source: 'eslint'
          }

          if (message.severity === 2) {
            this.errors.push(eslintIssue)
            totalErrors++
          } else {
            this.warnings.push(eslintIssue)
            totalWarnings++
          }
        }
      }
    }

    this.metrics.eslint.errors = totalErrors
    this.metrics.eslint.warnings = totalWarnings
    this.metrics.eslint.score = Math.max(0, 100 - (totalErrors * 2) - (totalWarnings * 0.5))

    console.log(`📊 ESLint: ${totalErrors} erros, ${totalWarnings} avisos em ${filesWithIssues} arquivos`)
  }

  extractSampleErrorsFromText(errorText) {
    // Extract sample errors from text output for reporting
    const lines = errorText.split('\n')
    let currentFile = ''

    for (const line of lines.slice(0, 50)) { // Process first 50 lines
      if (line.includes('.ts') || line.includes('.tsx') || line.includes('.js') || line.includes('.jsx')) {
        const fileMatch = line.match(/(\S+\.(?:ts|tsx|js|jsx))/)
        if (fileMatch) {
          currentFile = fileMatch[1]
        }
      }

      if (line.includes('error') || line.includes('warning')) {
        const errorMatch = line.match(/(\d+):(\d+)\s+(error|warning)\s+(.+?)\s+(.+)/)
        if (errorMatch && currentFile) {
          const [, lineNum, colNum, severity, rule, message] = errorMatch
          this.errors.push({
            file: currentFile,
            line: parseInt(lineNum),
            column: parseInt(colNum),
            rule: rule,
            message: message,
            severity: severity,
            source: 'eslint'
          })

          if (severity === 'error') {
            this.metrics.eslint.errors++
          } else {
            this.metrics.eslint.warnings++
          }
        }
      }
    }
  }

  parseTypeScriptError(line) {
    // Parse TypeScript error format: file(line,column): error TS#### message
    const tsErrorRegex = /^(.+)\((\d+),(\d+)\):\s+(error|warning)\s+TS(\d+):\s+(.+)$/
    const match = line.match(tsErrorRegex)

    if (match) {
      return {
        file: match[1],
        line: parseInt(match[2]),
        column: parseInt(match[3]),
        severity: match[4],
        code: `TS${match[5]}`,
        message: match[6],
        source: 'typescript'
      }
    }

    return null
  }

  calculateMetrics() {
    // Calculate total files analyzed
    this.metrics.totalFiles = this.getTotalTypeScriptFiles()

    // Calculate error density (errors per 1000 lines of code)
    const totalLines = this.getTotalLinesOfCode()
    const totalIssues = this.errors.length + this.warnings.length

    this.metrics.errorDensity = totalLines > 0 ? (totalIssues / totalLines) * 1000 : 0

    // Overall code quality score
    this.metrics.overallScore = Math.round(
      (this.metrics.typescript.score * 0.6) +
      (this.metrics.eslint.score * 0.4)
    )
  }

  getTotalTypeScriptFiles() {
    try {
      const output = execSync('find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v .next | wc -l', {
        encoding: 'utf8',
        stdio: 'pipe'
      })
      return parseInt(output.trim()) || 0
    } catch (error) {
      return 0
    }
  }

  getTotalLinesOfCode() {
    try {
      const output = execSync('find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v .next | xargs wc -l | tail -1 | awk \'{print $1}\'', {
        encoding: 'utf8',
        stdio: 'pipe'
      })
      return parseInt(output.trim()) || 0
    } catch (error) {
      return 0
    }
  }

  generateReport() {
    console.log('\n' + '='.repeat(60))
    console.log('📊 RELATÓRIO DE QUALIDADE DE CÓDIGO')
    console.log('='.repeat(60))

    console.log(`\n🎯 Score Geral: ${this.metrics.overallScore}/100`)
    console.log(`📁 Arquivos Analisados: ${this.metrics.analyzedFiles}/${this.metrics.totalFiles}`)
    console.log(`📏 Densidade de Erros: ${this.metrics.errorDensity.toFixed(2)} erros/1000 linhas`)

    console.log('\n🔧 TYPE SCRIPT:')
    console.log(`   Score: ${this.metrics.typescript.score}/100`)
    console.log(`   Erros: ${this.metrics.typescript.errors}`)
    console.log(`   Avisos: ${this.metrics.typescript.warnings}`)

    console.log('\n🧹 ESLINT:')
    console.log(`   Score: ${this.metrics.eslint.score}/100`)
    console.log(`   Erros: ${this.metrics.eslint.errors}`)
    console.log(`   Avisos: ${this.metrics.eslint.warnings}`)

    if (this.errors.length > 0) {
      console.log('\n❌ PRINCIPAIS ERROS:')
      this.errors.slice(0, 10).forEach((error, index) => {
        console.log(`   ${index + 1}. ${path.relative(process.cwd(), error.file)}:${error.line}:${error.column}`)
        console.log(`      ${error.source.toUpperCase()} ${error.rule || error.code}: ${error.message}`)
      })

      if (this.errors.length > 10) {
        console.log(`   ... e mais ${this.errors.length - 10} erros`)
      }
    }

    console.log('\n💡 RECOMENDAÇÕES:')
    this.generateRecommendations()

    // Save detailed report
    this.saveDetailedReport()
  }

  generateRecommendations() {
    const recommendations = []

    if (this.metrics.typescript.score < 80) {
      recommendations.push('• Corrigir erros de TypeScript prioritários')
      recommendations.push('• Revisar tipos e interfaces problemáticas')
    }

    if (this.metrics.eslint.score < 80) {
      recommendations.push('• Executar eslint --fix para correções automáticas')
      recommendations.push('• Revisar regras de lint mais violadas')
    }

    if (this.metrics.errorDensity > 5) {
      recommendations.push('• Alta densidade de erros - considerar refatoração')
    }

    if (this.errors.length > 20) {
      recommendations.push('• Muitos erros - focar nos mais críticos primeiro')
    }

    recommendations.forEach(rec => console.log(rec))
  }

  saveDetailedReport() {
    const reportDir = path.join(process.cwd(), 'tmp', 'code-quality-reports')
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }

    const reportPath = path.join(reportDir, `report-${new Date().toISOString().split('T')[0]}.json`)

    const detailedReport = {
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      errors: this.errors.slice(0, 50), // Limit to first 50 errors
      warnings: this.warnings.slice(0, 50),
      summary: {
        totalErrors: this.errors.length,
        totalWarnings: this.warnings.length,
        filesWithErrors: new Set(this.errors.map(e => e.file)).size,
        topRulesViolated: this.getTopRulesViolated()
      }
    }

    fs.writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2))
    console.log(`\n📄 Relatório detalhado salvo: ${reportPath}`)
  }

  getTopRulesViolated() {
    const ruleCounts = {}

    this.errors.concat(this.warnings).forEach(issue => {
      const rule = issue.rule || issue.code || 'unknown'
      ruleCounts[rule] = (ruleCounts[rule] || 0) + 1
    })

    return Object.entries(ruleCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([rule, count]) => ({ rule, count }))
  }

  getStatusText(score) {
    if (score >= 90) return '🟢 Excelente'
    if (score >= 70) return '🟡 Bom'
    if (score >= 50) return '🟠 Regular'
    return '🔴 Precisa Melhorar'
  }
}

// CLI execution
const verifier = new CodeQualityVerifier()
verifier.verifyCodeQuality()
  .then(metrics => {
    console.log(`\n✅ Verificação concluída - Score: ${metrics.overallScore}/100`)
    process.exit(metrics.overallScore >= 70 ? 0 : 1)
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error.message)
    process.exit(1)
  })
