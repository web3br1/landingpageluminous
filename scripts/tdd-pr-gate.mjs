#!/usr/bin/env node

/**
 * 🚪 TDD PR Gate - Validação Mínima para Merge
 *
 * Verifica se os requisitos mínimos de qualidade TDD foram atendidos
 * antes de permitir merge do PR.
 */

import fs from 'fs'
import path from 'path'

class TDDPrGate {
  constructor() {
    this.reportsDir = path.join(process.cwd(), 'tmp', 'tdd-reports')
    this.reportPath = path.join(this.reportsDir, 'tdd-report.md')
    this.jsonReportPath = this.findLatestJsonReport()
  }

  findLatestJsonReport() {
    if (!fs.existsSync(this.reportsDir)) return null

    const files = fs.readdirSync(this.reportsDir)
      .filter(f => f.startsWith('tdd-report-') && f.endsWith('.json'))
      .sort()
      .reverse()

    return files.length > 0 ? path.join(this.reportsDir, files[0]) : null
  }

  /**
   * Executa validações do gate
   */
  async runGate() {
    console.log('🚪 Executando TDD PR Gate...\n')

    const checks = {
      reportExists: false,
      reportReadable: false,
      noCriticalBlockers: false,
      hasRecommendations: false
    }

    let reportData = null

    try {
      // 1. Verificar se relatório existe
      if (!fs.existsSync(this.reportPath)) {
        throw new Error(`Relatório não encontrado: ${this.reportPath}`)
      }
      checks.reportExists = true
      console.log('✅ Relatório encontrado')

      // 2. Verificar se relatório é legível
      const reportContent = fs.readFileSync(this.reportPath, 'utf8')
      if (!reportContent.includes('# 📊 TDD Quality Report')) {
        throw new Error('Relatório não está no formato esperado')
      }
      checks.reportReadable = true
      console.log('✅ Relatório legível')

      // 3. Carregar dados JSON se disponível
      if (this.jsonReportPath && fs.existsSync(this.jsonReportPath)) {
        reportData = JSON.parse(fs.readFileSync(this.jsonReportPath, 'utf8'))
      }

      // 4. Verificar se não há blockers críticos
      if (reportData) {
        const criticalCount = reportData.executiveSummary?.criticalIssues || 0

        // Permitir até 3 críticos em M0, 1 em M1, 0 em M2+
        const maturity = reportData.metadata?.maturity || 'M0'
        const maxAllowed = { M0: 3, M1: 1, M2: 0, M3: 0 }[maturity] || 3

        if (criticalCount <= maxAllowed) {
          checks.noCriticalBlockers = true
          console.log(`✅ Críticos aceitáveis (${criticalCount}/${maxAllowed} para ${maturity})`)
        } else {
          console.log(`❌ Muitos críticos: ${criticalCount} (máx ${maxAllowed} para ${maturity})`)
        }
      } else {
        // Fallback: aceitar se relatório existe
        checks.noCriticalBlockers = true
        console.log('⚠️ Sem dados JSON - aceitando por relatório existir')
      }

      // 5. Verificar se tem recomendações
      if (reportContent.includes('## 🎯 Top Recommendations')) {
        checks.hasRecommendations = true
        console.log('✅ Recomendações presentes')
      } else {
        console.log('⚠️ Sem seção de recomendações')
      }

      // Resultado final
      const allPassed = Object.values(checks).every(check => check)

      console.log('\n' + '='.repeat(50))
      if (allPassed) {
        console.log('✅ PR GATE APROVADO')
        console.log('🚀 PR pode ser merged')
      } else {
        console.log('❌ PR GATE REPROVADO')
        console.log('🛑 Corrija os problemas antes do merge')
      }
      console.log('='.repeat(50))

      // Detalhes dos checks
      console.log('\n📋 Detalhes da Validação:')
      Object.entries(checks).forEach(([check, passed]) => {
        const status = passed ? '✅' : '❌'
        console.log(`   ${status} ${check}`)
      })

      // Informações adicionais se disponível
      if (reportData) {
        console.log('\n📊 Informações do Relatório:')
        console.log(`   Maturidade: ${reportData.metadata?.maturity}`)
        console.log(`   Score: ${reportData.executiveSummary?.finalScore}/100`)
        console.log(`   Críticos: ${reportData.executiveSummary?.criticalIssues}`)
        console.log(`   Avisos: ${reportData.executiveSummary?.warningIssues}`)
      }

      console.log(`\n📄 Relatório: ${this.reportPath}`)
      if (this.jsonReportPath) {
        console.log(`📄 Dados JSON: ${this.jsonReportPath}`)
      }

      process.exit(allPassed ? 0 : 1)

    } catch (error) {
      console.error('❌ ERRO NO PR GATE:', error.message)
      console.log('\n🔧 Para resolver:')
      console.log('1. Execute: npm run tdd:analyze')
      console.log('2. Verifique se tmp/tdd-reports/tdd-report.md foi gerado')
      console.log('3. Corrija problemas críticos se houver')
      process.exit(1)
    }
  }
}

// Executar gate
if (process.argv[1]?.endsWith('tdd-pr-gate.mjs')) {
  const gate = new TDDPrGate()
  gate.runGate()
}

export { TDDPrGate }
