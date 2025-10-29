#!/usr/bin/env node

/**
 * Análise Rápida de Qualidade - Versão Simplificada
 * Executa verificações essenciais rapidamente
 */

import { execSync } from 'child_process'

class QuickAnalysis {
  async run() {
    console.log('⚡ ANÁLISE RÁPIDA DE QUALIDADE')
    console.log('='.repeat(40))

    const startTime = Date.now()

    try {
      // 1. Verificação TDD (rápida)
      console.log('🎯 Verificando qualidade TDD...')
      const tddResult = this.runCommand('node scripts/tdd-quality-verification.mjs', 30000)
      const tddScore = this.extractScore(tddResult, 'Score Final')

      // 2. Verificação Código (rápida)
      console.log('🔧 Verificando qualidade código...')
      const codeResult = this.runCommand('node scripts/code-quality-verification.mjs', 30000)
      const codeScore = this.extractScore(codeResult, 'Score Geral')

      // 3. Testes básicos
      console.log('🧪 Executando testes básicos...')
      const testResult = this.runCommand('npm run test:vitest:unit', 60000)
      const testPassed = !testResult.includes('failed') && testResult.includes('passed')

      // 4. Calcular resultado
      const overallScore = Math.round((tddScore * 0.6) + (codeScore * 0.4))
      const duration = Date.now() - startTime

      // 5. Relatório
      this.printReport(overallScore, tddScore, codeScore, testPassed, duration)

    } catch (error) {
      console.error('❌ Erro na análise rápida:', error.message)
      process.exit(1)
    }
  }

  runCommand(command, timeout = 30000) {
    try {
      return execSync(command, {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout
      })
    } catch (error) {
      return error.stdout || error.stderr || ''
    }
  }

  extractScore(output, pattern) {
    const match = output.match(new RegExp(`${pattern}:\\s*(\\d+)`))
    return match ? parseInt(match[1]) : 0
  }

  printReport(overall, tdd, code, testsPass, duration) {
    console.log('\n📊 RESULTADO DA ANÁLISE RÁPIDA')
    console.log('='.repeat(40))

    console.log(`🎯 Score Geral: ${overall}/100 ${this.getEmoji(overall)}`)
    console.log(`🎯 Qualidade TDD: ${tdd}/100`)
    console.log(`🔧 Qualidade Código: ${code}/100`)
    console.log(`🧪 Testes Unitários: ${testsPass ? '✅ OK' : '❌ Falha'}`)
    console.log(`⏱️ Tempo: ${Math.round(duration/1000)}s`)

    console.log('\n💡 STATUS:')
    if (overall >= 80) {
      console.log('   ✅ Qualidade excelente - pode prosseguir')
    } else if (overall >= 60) {
      console.log('   🟡 Qualidade aceitável - pequenas melhorias recomendadas')
    } else {
      console.log('   🔴 Qualidade crítica - correções necessárias antes de prosseguir')
    }

    if (tdd < 70) {
      console.log('   📝 Melhorar testes TDD (nomenclatura, estrutura)')
    }

    if (code < 70) {
      console.log('   🧹 Corrigir qualidade código (ESLint, TypeScript)')
    }

    console.log('\n🚀 PRÓXIMOS PASSOS:')
    console.log('   • Análise completa: node scripts/analyze-all-tests.mjs')
    console.log('   • Correções auto: node scripts/code-quality-fix.mjs')
    console.log('   • Dashboard: tmp/tdd-dashboard/index.html')
  }

  getEmoji(score) {
    if (score >= 90) return '🏆'
    if (score >= 80) return '✅'
    if (score >= 70) return '🟡'
    if (score >= 60) return '🟠'
    return '🔴'
  }
}

// Execute
const analyzer = new QuickAnalysis()
analyzer.run()
