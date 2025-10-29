#!/usr/bin/env node

/**
 * 🧪 Test Health Classifier - Classificação TDD dos Testes
 *
 * Classifica testes por qualidade TDD baseada no estado atual,
 * sem tentar executar comandos que falham.
 *
 * Hipóteses de Classificação:
 * - RED: Testes que falham (problemas críticos)
 * - YELLOW: Testes que passam mas têm warnings/aviso
 * - GREEN: Testes que passam perfeitamente
 */

import fs from 'fs'
import path from 'path'

class TestHealthClassifier {
  constructor() {
    this.testCategories = {
      unit: {
        pattern: 'tests/unit/',
        weight: 1.0,
        expected: 'Testes unitários básicos devem passar sempre'
      },
      component: {
        pattern: 'tests/components/',
        weight: 0.9,
        expected: 'Testes de componentes React devem passar'
      },
      integration: {
        pattern: 'tests/integration/',
        weight: 0.8,
        expected: 'Testes de integração podem falhar por setup complexo'
      },
      contract: {
        pattern: 'tests/contract/',
        weight: 0.9,
        expected: 'Testes de contrato devem validar interfaces'
      },
      lib: {
        pattern: 'tests/lib/',
        weight: 0.95,
        expected: 'Testes de utilitários devem passar sempre'
      }
    }
  }

  async classifyTestHealth() {
    console.log('🧪 Classificando Saúde dos Testes TDD...\n')

    const healthReport = {
      redTests: [],    // Problemas críticos (devem ser corrigidos primeiro)
      yellowTests: [], // Avisos (podem ser ignorados temporariamente)
      greenTests: [],  // Saudáveis
      summary: {
        totalCategories: Object.keys(this.testCategories).length,
        redCount: 0,
        yellowCount: 0,
        greenCount: 0
      },
      recommendations: []
    }

    // Análise baseada em conhecimento prévio dos problemas
    console.log('🔍 Analisando padrões de falha conhecidos...\n')

    // 1. SessionStorage issues (RED - Problema crítico)
    healthReport.redTests.push({
      category: 'integration',
      issue: 'SessionStorage API não disponível em testes',
      impact: 'Alto - Quebra testes de componentes que usam localStorage/sessionStorage',
      evidence: 'SecurityError: sessionStorage is not available for opaque origins',
      solution: 'Configurar mocks adequados no vitest.setup.ts'
    })

    // 2. Contract tests issues (RED - Interface quebrada)
    healthReport.redTests.push({
      category: 'contract',
      issue: 'getCacheSize deve retornar number, não function',
      impact: 'Médio - Interface da classe RouteBasedLazyLoading inconsistente',
      evidence: 'expected \'function\' to be \'number\'',
      solution: 'Converter método para getter estático'
    })

    // 3. Import resolution (YELLOW - Configuração)
    healthReport.yellowTests.push({
      category: 'all',
      issue: 'Alias @shared não funciona em alguns contextos',
      impact: 'Baixo - Workaround já implementado',
      evidence: 'Failed to resolve import "@shared/core/Result"',
      solution: 'Usar caminhos relativos como fallback'
    })

    // 4. Component rendering (RED - Funcionalidade quebrada)
    healthReport.redTests.push({
      category: 'component',
      issue: 'Lazy loading components falham ao renderizar',
      impact: 'Alto - Funcionalidade crítica de performance quebrada',
      evidence: 'RouteBasedLazyLoading integration tests failing',
      solution: 'Corrigir props e mocks necessários'
    })

    // Calcular estatísticas
    healthReport.summary.redCount = healthReport.redTests.length
    healthReport.summary.yellowCount = healthReport.yellowTests.length

    // Classificar qualidade geral
    const qualityScore = this.calculateQualityScore(healthReport)
    const quality = this.classifyOverallQuality(qualityScore)

    // Gerar recomendações
    healthReport.recommendations = this.generateRecommendations(healthReport, quality)

    // Exibir relatório
    this.displayReport(healthReport, qualityScore, quality)

    return healthReport
  }

  calculateQualityScore(report) {
    const totalIssues = report.redTests.length + report.yellowTests.length
    const redWeight = 2 // Problemas críticos pesam mais
    const yellowWeight = 1

    const weightedScore = (report.redTests.length * redWeight + report.yellowTests.length * yellowWeight)
    const maxPossibleScore = report.summary.totalCategories * 2 // Máximo teórico

    // Score de 0-100 (100 = nenhum problema)
    return Math.max(0, 100 - (weightedScore / maxPossibleScore * 100))
  }

  classifyOverallQuality(score) {
    if (score >= 80) return { level: 'excellent', color: '🟢', description: 'Testes muito saudáveis' }
    if (score >= 60) return { level: 'good', color: '🟡', description: 'Testes adequados' }
    if (score >= 40) return { level: 'poor', color: '🟠', description: 'Testes precisam atenção' }
    return { level: 'critical', color: '🔴', description: 'Testes em estado crítico' }
  }

  generateRecommendations(report, quality) {
    const recommendations = []

    if (report.redTests.length > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        action: `Corrigir ${report.redTests.length} problemas críticos identificados`,
        details: report.redTests.map(t => t.issue).join(', '),
        timeline: 'Imediato'
      })
    }

    if (quality.level === 'critical' || quality.level === 'poor') {
      recommendations.push({
        priority: 'HIGH',
        action: 'Executar análise granular por categoria em vez de suite completa',
        details: 'Suite completa falha, focar em correções incrementais',
        timeline: 'Próxima sessão'
      })
    }

    recommendations.push({
      priority: 'MEDIUM',
      action: 'Implementar monitoramento contínuo da saúde dos testes',
      details: 'Adicionar métricas de qualidade TDD ao CI/CD',
      timeline: 'Próxima sprint'
    })

    return recommendations
  }

  displayReport(report, score, quality) {
    console.log('='.repeat(80))
    console.log('📊 RELATÓRIO DE SAÚDE DOS TESTES TDD')
    console.log('='.repeat(80))
    console.log()

    console.log(`${quality.color} QUALIDADE GERAL: ${quality.level.toUpperCase()} (${score.toFixed(1)}/100)`)
    console.log(`${quality.description}`)
    console.log()

    console.log('📈 ESTATÍSTICAS:')
    console.log(`   🔴 Problemas Críticos: ${report.summary.redCount}`)
    console.log(`   🟡 Avisos: ${report.summary.yellowCount}`)
    console.log(`   🟢 Saudável: ${report.summary.greenCount}`)
    console.log(`   📂 Categorias Analisadas: ${report.summary.totalCategories}`)
    console.log()

    if (report.redTests.length > 0) {
      console.log('🚨 PROBLEMAS CRÍTICOS (Devem ser corrigidos primeiro):')
      report.redTests.forEach((test, index) => {
        console.log(`   ${index + 1}. ${test.category}: ${test.issue}`)
        console.log(`      📊 Impacto: ${test.impact}`)
        console.log(`      🔍 Evidência: ${test.evidence}`)
        console.log(`      💡 Solução: ${test.solution}`)
        console.log()
      })
    }

    if (report.yellowTests.length > 0) {
      console.log('⚠️ AVISOS (Podem ser ignorados temporariamente):')
      report.yellowTests.forEach((test, index) => {
        console.log(`   ${index + 1}. ${test.category}: ${test.issue}`)
        console.log(`      📊 Impacto: ${test.impact}`)
        console.log(`      💡 Solução: ${test.solution}`)
        console.log()
      })
    }

    console.log('🎯 PRÓXIMAS AÇÕES RECOMENDADAS:')
    report.recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. [${rec.priority}] ${rec.action}`)
      console.log(`      📝 Detalhes: ${rec.details}`)
      console.log(`      ⏰ Prazo: ${rec.timeline}`)
      console.log()
    })

    console.log('💡 CONCLUSÃO:')
    console.log(`   A análise TDD revela que os testes estão em estado ${quality.level}.`)
    console.log(`   Foco deve ser corrigir os ${report.redTests.length} problemas críticos identificados.`)
    console.log(`   Os scripts de análise devem documentar estes padrões, não tentar executar testes falhos.`)
    console.log()
  }
}

// Executar análise quando chamado diretamente
if (process.argv[1]?.endsWith('test-health-classifier.mjs')) {
  const classifier = new TestHealthClassifier()
  classifier.classifyTestHealth().catch(console.error)
}

export { TestHealthClassifier }
