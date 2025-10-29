#!/usr/bin/env node

/**
 * TDD Simple - Versão básica funcional do PR-1
 */

import fs from 'fs'
import path from 'path'
import { TestHealthClassifier } from './test-health-classifier.mjs'
import TDDAnalysisEngine from './tdd-analysis-engine.mjs'

class TDDQualityOrchestrator {
  constructor() {
    this.classifier = new TestHealthClassifier()
    this.engine = new TDDAnalysisEngine()
    this.reportsDir = path.join(process.cwd(), 'tmp', 'tdd-reports')
    this.ensureDirectories()
  }

  ensureDirectories() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true })
    }
  }

  determineMaturityLevel(healthReport) {
    const criticalCount = healthReport.redTests?.length || 0

    if (criticalCount >= 3 || healthReport.testQuality === 'critical') {
      return {
        level: 'M0',
        name: 'Crítico',
        description: 'Estado crítico - foco em correção básica',
        weights: {
          isolation: 0.25,
          structure: 0.20,
          naming: 0.15,
          dependencies: 0.15,
          coverage: 0.03,
          performance: 0.05,
          maintainability: 0.10,
          complexity: 0.07
        }
      }
    }

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

  calculateContextualScores(results) {
    const maturity = results.maturity
    const classifier = results.classifier

    const baseScores = {
      isolation: classifier.healthScore || 0,
      structure: 0,
      naming: 0,
      dependencies: 0,
      coverage: 0,
      performance: 0,
      maintainability: 0,
      complexity: 0
    }

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

    return {
      ...baseScores,
      finalScore: Math.round(finalScore * 10) / 10,
      maturity: maturity.level,
      weights: weights,
      breakdown: Object.entries(weights).map(([metric, weight]) => ({
        metric,
        weight: (weight * 100).toFixed(1) + '%',
        score: baseScores[metric]?.toFixed(1) || '0.0',
        contribution: ((baseScores[metric] || 0) * weight).toFixed(1)
      }))
    }
  }

  generateConsolidatedReport(results) {
    const { maturity, classifier, scores } = results

    return {
      metadata: {
        timestamp: new Date().toISOString(),
        maturity: maturity.level,
        executionTime: results.executionTime || 0,
        engineUsed: !!results.engine
      },
      executiveSummary: {
        maturity: `${maturity.level} - ${maturity.name}`,
        description: maturity.description,
        finalScore: scores.finalScore,
        criticalIssues: classifier.redTests?.length || 0,
        warningIssues: classifier.yellowTests?.length || 0
      },
      detailedScores: {
        ...scores,
        breakdown: scores.breakdown || []
      },
      criticalIssues: classifier.redTests || [],
      warnings: classifier.yellowTests || [],
      recommendations: classifier.recommendations || []
    }
  }

  generateMarkdownReport(report) {
    const { executiveSummary, detailedScores, criticalIssues, warnings, recommendations } = report

    return `# 📊 TDD Quality Report

**Gerado em:** ${report.metadata.timestamp}
**Maturidade:** ${executiveSummary.maturity}
**Score Final:** ${executiveSummary.finalScore}/100

## 🎯 Executive Summary

${executiveSummary.description}

- **Problemas Críticos:** ${executiveSummary.criticalIssues}
- **Avisos:** ${executiveSummary.warningIssues}

## 📈 Detailed Scores

| Métrica | Peso | Score | Contribuição |
|---------|------|-------|--------------|
${detailedScores.breakdown.map(row =>
  `| ${row.metric} | ${row.weight} | ${row.score} | ${row.contribution} |`
).join('\n')}

**Score Final:** ${detailedScores.finalScore}/100

## 🚨 Critical Issues

${criticalIssues.length > 0
  ? criticalIssues.map((issue, i) => `### ${i + 1}. ${issue.category}: ${issue.issue}

- **Impacto:** ${issue.impact}
- **Solução:** ${issue.solution}
`).join('\n')
  : '✅ Nenhum problema crítico identificado'}

## ⚠️ Warnings

${warnings.length > 0
  ? warnings.map((warning, i) => `### ${i + 1}. ${warning.category}: ${warning.issue}

- **Solução:** ${warning.solution}
`).join('\n')
  : '✅ Nenhum aviso identificado'}

## 🎯 Top Recommendations

${recommendations.slice(0, 3).map((rec, i) => `### ${i + 1}. [${rec.priority}] ${rec.action}

${rec.details}
`).join('\n')}

---

*Relatório gerado automaticamente pelo TDD Quality Orchestrator*
`
  }

  saveReport(report) {
    const reportPath = path.join(this.reportsDir, 'tdd-report.md')

    const markdown = this.generateMarkdownReport(report)
    fs.writeFileSync(reportPath, markdown)

    console.log(`📄 Relatório salvo: ${reportPath}`)
  }

  async runDualAnalysis() {
    console.log('🎯 Iniciando Análise TDD Básica...\n')

    const startTime = Date.now()
    const results = {}

    try {
      // 1. Executar Classifier
      console.log('🧪 Executando Classificação de Saúde dos Testes...')
      results.classifier = await this.classifier.classifyTestHealth()

      // 2. Determinar maturidade
      results.maturity = this.determineMaturityLevel(results.classifier)
      console.log(`📊 Maturidade: ${results.maturity.level} (${results.maturity.name})`)

      // 3. Calcular scores
      results.scores = this.calculateContextualScores(results)

      // 4. Gerar relatório
      results.report = this.generateConsolidatedReport(results)
      results.executionTime = Date.now() - startTime

      // 5. Salvar
      this.saveReport(results.report)

      // 6. Resumo
      console.log(`\n🎯 Score Final: ${results.scores.finalScore}/100`)
      console.log(`🔴 Críticos: ${results.classifier.redTests?.length || 0}`)
      console.log(`⏱️ Tempo: ${Math.round(results.executionTime / 1000)}s`)

      return results

    } catch (error) {
      console.error('🚨 Erro:', error.message)
      throw error
    }
  }
}

// Executar
if (process.argv[1]?.endsWith('tdd-simple.mjs')) {
  const orchestrator = new TDDQualityOrchestrator()
  orchestrator.runDualAnalysis()
    .then(() => console.log('\n✅ Análise concluída!'))
    .catch(() => process.exit(1))
}
