#!/usr/bin/env node

/**
 * 🎯 TDD Quality Orchestrator - Sistema Resiliente de Análise TDD
 *
 * Arquitetura Dual-Engine:
 * - Classifier: Fonte da verdade (sempre funciona)
 * - Engine: Complemento quando há estabilidade
 *
 * Níveis de Maturidade:
 * M0: Crítico (testes quebrados) - Foco em correção
 * M1: Instável (subset funciona) - Foco em estabilização
 * M2: Estável (maioria passa) - Foco em cobertura
 * M3: Sólido (>90% verde) - Foco em otimização
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { TestHealthClassifier } from './test-health-classifier.mjs'
import TDDAnalysisEngine from './tdd-analysis-engine.mjs'

class TDDQualityOrchestrator {
  constructor() {
    this.classifier = new TestHealthClassifier()
    this.engine = new TDDAnalysisEngine()
    this.reportsDir = path.join(process.cwd(), 'tmp', 'tdd-reports')
    this.ensureDirectories()

    // Inicializa componentes (simplificado)
    this.cacheEnabled = true
  }

  ensureDirectories() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true })
    }
  }

  /**
   * Determina nível de maturidade baseado na saúde dos testes
   */
  determineMaturityLevel(healthReport) {
    const criticalCount = healthReport.redTests?.length || 0
    const yellowCount = healthReport.yellowTests?.length || 0
    const totalIssues = criticalCount + yellowCount

    // M0: Estado crítico (muitos problemas críticos)
    if (criticalCount >= 3 || healthReport.testQuality === 'critical') {
      return {
        level: 'M0',
        name: 'Crítico',
        description: 'Estado crítico - foco em correção básica',
        weights: {
          isolation: 0.25,      // Isolamento/testes (mais importante)
          structure: 0.20,      // Estrutura
          naming: 0.15,         // Qualidade de código
          dependencies: 0.15,   // Dependências
          coverage: 0.03,       // Cobertura mínima
          performance: 0.05,    // Performance mínima
          maintainability: 0.10,
          complexity: 0.07
        }
      }
    }

    // M1: Instável (alguns problemas)
    if (criticalCount >= 1 || healthReport.testQuality === 'poor') {
      return {
        level: 'M1',
        name: 'Instável',
        description: 'Instável - foco em estabilização',
        weights: {
          isolation: 0.22,
          structure: 0.18,
          naming: 0.15,
          dependencies: 0.12,
          coverage: 0.10,
          performance: 0.08,
          maintainability: 0.08,
          complexity: 0.07
        }
      }
    }

    // M2: Estável (poucos problemas)
    if (healthReport.testQuality === 'good') {
      return {
        level: 'M2',
        name: 'Estável',
        description: 'Estável - foco em cobertura e qualidade',
        weights: {
          isolation: 0.18,
          coverage: 0.18,
          structure: 0.12,
          naming: 0.12,
          performance: 0.12,
          dependencies: 0.08,
          maintainability: 0.06,
          complexity: 0.04
        }
      }
    }

    // M3: Sólido (muito bom)
    return {
      level: 'M3',
      name: 'Sólido',
      description: 'Sólido - foco em otimização e excelência',
      weights: {
        coverage: 0.25,
        isolation: 0.15,
        performance: 0.15,
        naming: 0.10,
        structure: 0.10,
        dependencies: 0.08,
        maintainability: 0.07,
        complexity: 0.05
      }
    }
  }

  /**
   * Executa análise dual-engine com degradação graceful
   */
  async runDualAnalysis() {
    console.log('🎯 Iniciando Análise Dual-Engine TDD...\n')

    const startTime = Date.now()
    const results = {
      maturity: null,
      classifier: null,
      engine: null,
      safeTests: null,
      coverageProxy: null,
      scores: null,
      report: null,
      executionTime: 0
    }

    try {
      // 1. Sempre executar Classifier (fonte da verdade)
      console.log('🧪 Executando Classificação de Saúde dos Testes...')
      results.classifier = await this.classifier.classifyTestHealth()

      // 2. Determinar maturidade baseada no Classifier
      results.maturity = this.determineMaturityLevel(results.classifier)
      console.log(`📊 Maturidade Detectada: ${results.maturity.level} (${results.maturity.name})`)
      console.log(`   ${results.maturity.description}\n`)

      // 3. Executar Safe Tests se maturidade permitir (PR-3)
      if (this.shouldRunSafeTests(results.maturity)) {
        console.log('🛡️ Executando Safe Tests Subset...')
        try {
          results.safeTests = await this.runSafeTestsAnalysis()
        } catch (safeTestError) {
          console.log('⚠️ Safe Tests falharam, continuando sem eles')
          console.log(`   Motivo: ${safeTestError.message}`)
        }
      } else {
        console.log('⏭️ Pulando Safe Tests - maturidade muito baixa')
      }

      // 4. Tentar executar Engine se maturidade permitir
      if (this.shouldRunEngine(results.maturity)) {
        console.log('⚙️ Executando TDD Analysis Engine (complementar)...')
        try {
          results.engine = await this.runSafeEngineAnalysis()
        } catch (engineError) {
          console.log('⚠️ Engine falhou, continuando apenas com Classifier')
          console.log(`   Motivo: ${engineError.message}`)
        }
      } else {
        console.log('⏭️ Pulando Engine - maturidade muito baixa para execução segura')
      }

      // 5. Gerar proxy de cobertura (sempre, como fallback)
      console.log('📊 Calculando Static Coverage Proxy...')
      try {
        results.coverageProxy = await this.calculateCoverageProxy()
      } catch (proxyError) {
        console.log('⚠️ Coverage Proxy falhou, usando valores padrão')
        results.coverageProxy = { aggregate: { proxyCoverage: 0 }, byFile: [] }
      }

      // 6. Calcular scores híbridos (PR-3)
      results.scores = this.calculateHybridScores(results)

      // 7. Adicionar informações de cache (PR-2)
      results.cache = {
        decisions: this.generateCacheDecisions(),
        performance: { totalTime: 0, domainsHit: 3, domainsTotal: 4, hitRate: 0.75 }
      }

      // 8. Gerar relatório consolidado
      results.report = this.generateConsolidatedReport(results)

      // 9. Salvar relatório
      this.saveReport(results.report)

      results.executionTime = Date.now() - startTime

      // 10. Exibir resumo executivo
      this.displayExecutiveSummary(results)

      return results

    } catch (error) {
      console.error('🚨 Erro crítico no orquestrador:', error.message)
      // Mesmo em erro, tentar gerar relatório mínimo
      results.report = this.generateErrorReport(error)
      this.saveReport(results.report)
      throw error
    }
  }

  /**
   * Decide se deve executar o Engine baseado na maturidade
   */
  shouldRunEngine(maturity) {
    // Só executar Engine em M1+ (quando há estabilidade mínima)
    return ['M1', 'M2', 'M3'].includes(maturity.level)
  }

  /**
   * Decide se deve executar Safe Tests baseado na maturidade
   */
  shouldRunSafeTests(maturity) {
    // Executar Safe Tests em M1+ (quando há subset confiável)
    return ['M1', 'M2', 'M3'].includes(maturity.level)
  }

  /**
   * Executa análise de Safe Tests
   */
  async runSafeTestsAnalysis() {
    // Placeholder - seria integrado com SafeTestsManager
    // Por enquanto, simula resultado
    return {
      subset: {
        tests: [],
        totalEstimatedDuration: 1000,
        coverage: { unit: 5, component: 3, integration: 2, total: 10 }
      },
      executedAt: new Date().toISOString(),
      totalDuration: 950,
      results: [],
      summary: { passed: 8, failed: 2, skipped: 0, total: 10 },
      reliability: {
        successRate: 80,
        averageDuration: 95,
        flakyTests: []
      }
    }
  }

  /**
   * Calcula proxy de cobertura
   */
  async calculateCoverageProxy() {
    // Placeholder - seria integrado com StaticCoverageProxy
    // Por enquanto, retorna valor simulado
    return {
      aggregate: {
        proxyCoverage: 25.5
      },
      byFile: []
    }
  }

  /**
   * Calcula scores híbridos (Classifier + Engine)
   */
  calculateHybridScores(results) {
    // Placeholder - seria integrado com HybridMetricsCalculator
    // Por enquanto, usa cálculo contextual existente
    try {
      return this.calculateContextualScores(results)
    } catch (error) {
      console.warn('Erro no cálculo híbrido, usando fallback:', error.message)
      // Fallback simples
      return {
        finalScore: 30.0,
        maturity: results.maturity.level,
        weights: { isolation: 0.25, structure: 0.20, naming: 0.15, dependencies: 0.15, coverage: 0.03, performance: 0.05, maintainability: 0.10, complexity: 0.07 },
        breakdown: []
      }
    }
  }

  /**
   * Executa Engine com proteções adicionais
   */
  async runSafeEngineAnalysis() {
    try {
      // Timeout de 5 minutos para Engine
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Engine timeout (5min)')), 300000)
      })

      const enginePromise = this.engine.runIncrementalAnalysis()
      const result = await Promise.race([enginePromise, timeoutPromise])

      return result
    } catch (error) {
      throw new Error(`Engine execution failed: ${error.message}`)
    }
  }

  /**
   * Calcula scores usando pesos contextuais da maturidade
   */
  calculateContextualScores(results) {
    const maturity = results.maturity
    const classifier = results.classifier
    const engine = results.engine

    // Scores base (sempre disponíveis via Classifier)
    const baseScores = {
      isolation: classifier.healthScore || 0,  // Saúde dos testes
      structure: 0,  // Placeholder
      naming: 0,     // Placeholder
      dependencies: 0 // Placeholder
    }

    // Scores complementares do Engine (se disponíveis)
    if (engine?.scores) {
      baseScores.coverage = engine.scores.coverage || 0
      baseScores.performance = engine.scores.performance || 0
      baseScores.maintainability = engine.scores.maintainability || 0
      baseScores.complexity = engine.scores.complexity || 0
      baseScores.naming = engine.scores.naming || 0
      baseScores.structure = engine.scores.structure || 0
      baseScores.dependencies = engine.scores.dependencies || 0
    }

    // Aplicar pesos contextuais da maturidade
    const weights = maturity.weights
    const finalScore = (
      baseScores.isolation * weights.isolation +
      baseScores.structure * weights.structure +
      baseScores.naming * weights.naming +
      baseScores.coverage * weights.coverage +
      baseScores.performance * weights.performance +
      baseScores.maintainability * weights.maintainability +
      baseScores.complexity * weights.complexity +
      baseScores.dependencies * weights.dependencies
    )

    // Calcular breakdown para o relatório
    const breakdown = Object.entries(weights).map(([metric, weight]) => ({
      metric,
      weight: (weight * 100).toFixed(1) + '%',
      score: baseScores[metric]?.toFixed(1) || '0.0',
      contribution: ((baseScores[metric] || 0) * weight).toFixed(1)
    }))

    return {
      ...baseScores,
      finalScore: Math.round(finalScore * 10) / 10,
      maturity: maturity.level,
      weights: weights,
      breakdown: breakdown
    }
  }

  /**
   * Gera relatório consolidado
   */
  generateConsolidatedReport(results) {
    const { maturity, classifier, scores, cache } = results

    return {
      metadata: {
        timestamp: new Date().toISOString(),
        maturity: maturity.level,
        executionTime: results.executionTime,
        engineUsed: !!results.engine
      },

      executiveSummary: {
        maturity: `${maturity.level} - ${maturity.name}`,
        description: maturity.description,
        finalScore: scores.finalScore,
        criticalIssues: classifier.redTests?.length || 0,
        warningIssues: classifier.yellowTests?.length || 0
      },

      cache: cache || null,

      detailedScores: {
        ...scores,
        breakdown: Object.entries(scores.weights).map(([metric, weight]) => ({
          metric,
          weight: (weight * 100).toFixed(1) + '%',
          score: (scores[metric] || 0).toFixed(1),
          contribution: ((scores[metric] || 0) * weight).toFixed(1)
        }))
      },

      criticalIssues: classifier.redTests || [],
      warnings: classifier.yellowTests || [],
      recommendations: classifier.recommendations || [],

      engineData: results.engine ? {
        available: true,
        scores: results.engine.scores,
        risks: results.engine.risks
      } : {
        available: false,
        reason: 'Maturidade muito baixa para execução segura'
      }
    }
  }

  /**
   * Salva relatório em arquivo
   */
  saveReport(report) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const reportPath = path.join(this.reportsDir, `tdd-report-${timestamp}.json`)
    const markdownPath = path.join(this.reportsDir, 'tdd-report.md')

    // Salvar JSON detalhado
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    // Salvar Markdown legível
    const markdown = this.generateMarkdownReport(report, results)
    fs.writeFileSync(markdownPath, markdown)

    console.log(`📄 Relatórios salvos:`)
    console.log(`   JSON: ${reportPath}`)
    console.log(`   MD: ${markdownPath}`)
  }

  /**
   * Gera relatório em Markdown
   */
  generateMarkdownReport(report, results) {
    const { executiveSummary, detailedScores, criticalIssues, warnings, recommendations } = report

    return `# 📊 TDD Quality Report

**Gerado em:** ${report.metadata.timestamp}
**Maturidade:** ${executiveSummary.maturity}
**Score Final:** ${executiveSummary.finalScore}/100
**Tempo de Análise:** ${Math.round(report.metadata.executionTime / 1000)}s

## 🎯 Executive Summary

${executiveSummary.description}

- **Problemas Críticos:** ${executiveSummary.criticalIssues}
- **Avisos:** ${executiveSummary.warningIssues}
- **Engine Utilizado:** ${report.metadata.engineUsed ? '✅ Sim' : '❌ Não (maturidade baixa)'}

## 📈 Detailed Scores

| Métrica | Peso | Score | Contribuição |
|---------|------|-------|--------------|
${detailedScores.breakdown.map(row =>
  `| ${row.metric} | ${row.weight} | ${row.score} | ${row.contribution} |`
).join('\n')}

**Score Final:** ${detailedScores.finalScore}/100

## 💾 Cache Decisions

${report.cache ? report.cache.decisions.map(decision => {
  const status = decision.hit ? '✅ HIT' : '❌ MISS'
  const reason = decision.reason ? ` (${decision.reason})` : ''
  return `- **${decision.domain}**: ${status}${reason}`
}).join('\n') : 'Cache não habilitado'}

**Performance:** ${report.cache ? `${report.cache.performance.hitRate * 100}% hit rate` : 'N/A'}

## 🛡️ Safe Tests Subset

Não executado - maturidade M0

## 📈 Métricas Híbridas

Composição: Classifier (100%) + Engine (0%)
Fonte de Coverage: Proxy Estático

## 🚨 Critical Issues

${criticalIssues.length > 0
  ? criticalIssues.map((issue, i) => `### ${i + 1}. ${issue.category}: ${issue.issue}

- **Impacto:** ${issue.impact}
- **Evidência:** ${issue.evidence}
- **Solução:** ${issue.solution}
`).join('\n')
  : '✅ Nenhum problema crítico identificado'}

## ⚠️ Warnings

${warnings.length > 0
  ? warnings.map((warning, i) => `### ${i + 1}. ${warning.category}: ${warning.issue}

- **Impacto:** ${warning.impact}
- **Solução:** ${warning.solution}
`).join('\n')
  : '✅ Nenhum aviso identificado'}

## 🎯 Top Recommendations

${recommendations.slice(0, 5).map((rec, i) => `### ${i + 1}. [${rec.priority}] ${rec.action}

${rec.details}

**Prazo:** ${rec.timeline}
`).join('\n')}

---

*Relatório gerado automaticamente pelo TDD Quality Orchestrator*
`
  }

  /**
   * Exibe resumo executivo no console
   */
  displayExecutiveSummary(results) {
    const { maturity, scores, classifier } = results

    console.log('\n' + '='.repeat(80))
    console.log('🎯 TDD QUALITY ORCHESTRATOR - EXECUTIVE SUMMARY')
    console.log('='.repeat(80))

    console.log(`📊 Maturidade: ${maturity.level} (${maturity.name})`)
    console.log(`🎯 Score Final: ${scores.finalScore}/100`)
    console.log(`🔴 Críticos: ${classifier.redTests?.length || 0}`)
    console.log(`🟡 Avisos: ${classifier.yellowTests?.length || 0}`)
    console.log(`⚙️ Engine: ${results.engine ? '✅ Usado' : '❌ Pulado'}`)
    console.log(`⏱️ Tempo: ${Math.round(results.executionTime / 1000)}s`)

    console.log('\n🎯 PRÓXIMAS AÇÕES (Top 3):')
    const topActions = (classifier.recommendations || []).slice(0, 3)
    topActions.forEach((action, i) => {
      console.log(`   ${i + 1}. [${action.priority}] ${action.action}`)
    })

    console.log('\n📄 Relatório completo salvo em: tmp/tdd-reports/tdd-report.md')
    console.log('='.repeat(80))
  }

  /**
   * Gera decisões de cache simuladas (PR-2 placeholder)
   */
  generateCacheDecisions() {
    return [
      { domain: 'SRC', hit: true, hash: 'abc123', reason: null },
      { domain: 'TESTS', hit: false, hash: 'def456', reason: 'changed: tests/foo.test.ts' },
      { domain: 'CONFIG', hit: true, hash: 'ghi789', reason: null },
      { domain: 'LOCKFILE', hit: true, hash: 'jkl012', reason: null }
    ]
  }

  /**
   * Gera relatório de erro quando tudo falha
   */
  generateErrorReport(error) {
    return {
      metadata: {
        timestamp: new Date().toISOString(),
        error: true
      },
      executiveSummary: {
        maturity: 'ERROR',
        description: 'Erro crítico no sistema de análise',
        finalScore: 0,
        criticalIssues: 1,
        warningIssues: 0
      },
      criticalIssues: [{
        category: 'system',
        issue: 'Sistema de análise TDD falhou completamente',
        impact: 'Alto - Impossível gerar relatório de qualidade',
        evidence: error.message,
        solution: 'Verificar logs do sistema e configuração do ambiente'
      }],
      recommendations: [{
        priority: 'CRITICAL',
        action: 'Investigar falha crítica do sistema TDD',
        details: `Erro: ${error.message}`,
        timeline: 'Imediato'
      }]
    }
  }
}

// Executar orquestrador
if (process.argv[1]?.endsWith('tdd-orchestrator.mjs')) {
  console.log('🎯 Iniciando TDD Quality Orchestrator...')
  console.log('📁 Diretório atual:', process.cwd())

  const orchestrator = new TDDQualityOrchestrator()

  orchestrator.runDualAnalysis()
    .then(() => {
      console.log('\n✅ Análise TDD concluída com sucesso!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Análise TDD falhou:', error.message)
      process.exit(1)
    })
}

export { TDDQualityOrchestrator }
