/**
 * Structured Reporter - Reporter JSON estruturado para TDD
 *
 * Gera dados estruturados em vez de texto para parsing,
 * eliminando problemas de parsing frágil de stdout.
 */

import fs from 'fs'
import path from 'path'
import type { TDDResults, SafeTestResult, StaticCoverageProxy } from '../types.js'

export interface StructuredReport {
  metadata: {
    version: string;
    generatedAt: string;
    executionId: string;
    environment: 'local' | 'ci';
  };
  maturity: {
    level: string;
    name: string;
    description: string;
    assessedAt: string;
  };
  scores: {
    final: number;
    breakdown: Array<{
      metric: string;
      weight: string;
      score: number;
      contribution: number;
      source: string;
      confidence: 'high' | 'medium' | 'low';
    }>;
    confidence: {
      overall: number;
      sources: Record<string, number>;
    };
  };
  issues: {
    critical: Array<{
      id: string;
      category: string;
      title: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
      file?: string;
      line?: number;
      solution: string;
      tags: string[];
    }>;
    warnings: Array<{
      id: string;
      category: string;
      title: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
      file?: string;
      solution: string;
      tags: string[];
    }>;
  };
  coverage?: {
    source: 'real' | 'proxy' | 'hybrid';
    overall: number;
    byFile: Array<{
      file: string;
      lines: number;
      covered: number;
      percentage: number;
      functions: number;
      branches: number;
    }>;
    summary: {
      total: number;
      covered: number;
      percentage: number;
      threshold: number;
      met: boolean;
    };
  };
  performance?: {
    metrics: {
      lcp?: number;
      cls?: number;
      inp?: number;
      fcp?: number;
      ttfb?: number;
    };
    budget: {
      lcp: number;
      cls: number;
      inp: number;
    };
    status: 'pass' | 'fail' | 'warn';
  };
  safeTests?: {
    executed: boolean;
    subset: {
      totalTests: number;
      estimatedDuration: number;
      categories: Record<string, number>;
    };
    results: {
      passed: number;
      failed: number;
      skipped: number;
      total: number;
      successRate: number;
      averageDuration: number;
      flakyTests: string[];
    };
    reliability: {
      score: number; // 0-100
      trend: 'improving' | 'stable' | 'declining';
      recommendations: string[];
    };
  };
  cache?: {
    hitRate: number;
    decisions: Array<{
      domain: string;
      hit: boolean;
      reason?: string;
      changedFiles?: string[];
    }>;
    performance: {
      totalTime: number;
      domainsHit: number;
      domainsTotal: number;
    };
  };
  trends?: {
    period: string;
    totalRuns: number;
    averageScore: number;
    maturityDistribution: Record<string, number>;
    topFailurePatterns: Array<{
      pattern: string;
      occurrences: number;
    }>;
    riskyFiles: Array<{
      file: string;
      incidents: number;
      risk: 'high' | 'medium' | 'low';
    }>;
    scoreTrend: 'improving' | 'stable' | 'declining';
  };
  recommendations: Array<{
    id: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    category: 'testing' | 'quality' | 'performance' | 'architecture';
    title: string;
    description: string;
    impact: string;
    effort: 'low' | 'medium' | 'high';
    timeline: string;
    relatedFiles?: string[];
    tags: string[];
  }>;
  actions: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
}

export class StructuredReporter {
  private reportsDir: string

  constructor(reportsDir = path.join(process.cwd(), 'tmp', 'tdd-reports')) {
    this.reportsDir = reportsDir
    this.ensureDirectories()
  }

  private ensureDirectories() {
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true })
    }
  }

  /**
   * Gera relatório estruturado completo
   */
  generateStructuredReport(
    results: TDDResults,
    safeTestResult?: SafeTestResult,
    coverageProxy?: StaticCoverageProxy,
    trendsData?: any
  ): StructuredReport {
    const executionId = this.generateExecutionId()

    const report: StructuredReport = {
      metadata: {
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        executionId,
        environment: this.detectEnvironment()
      },
      maturity: {
        level: results.maturity.level,
        name: results.maturity.name,
        description: results.maturity.description,
        assessedAt: new Date().toISOString()
      },
      scores: this.buildScoresSection(results),
      issues: this.buildIssuesSection(results),
      recommendations: this.buildRecommendations(results),
      actions: this.buildActions(results),
      cache: results.cache ? this.buildCacheSection(results.cache) : undefined,
      safeTests: safeTestResult ? this.buildSafeTestsSection(safeTestResult) : undefined,
      trends: trendsData
    }

    // Adiciona seções opcionais
    if (results.engine?.scores?.coverage !== undefined || coverageProxy) {
      report.coverage = this.buildCoverageSection(results, coverageProxy)
    }

    if (results.engine?.scores?.performance !== undefined) {
      report.performance = this.buildPerformanceSection(results.engine.scores)
    }

    return report
  }

  /**
   * Gera ID único para execução
   */
  private generateExecutionId(): string {
    return `tdd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Detecta ambiente
   */
  private detectEnvironment(): 'local' | 'ci' {
    return process.env.CI === 'true' ||
           process.env.GITHUB_ACTIONS === 'true' ||
           process.env.GITLAB_CI === 'true' ? 'ci' : 'local'
  }

  /**
   * Constrói seção de scores
   */
  private buildScoresSection(results: TDDResults): StructuredReport['scores'] {
    const breakdown = results.scores.breakdown.map(item => ({
      metric: item.metric,
      weight: item.weight,
      score: parseFloat(item.score),
      contribution: parseFloat(item.contribution),
      source: item.source,
      confidence: this.getMetricConfidence(item.source)
    }))

    const sources = breakdown.reduce((acc, item) => {
      acc[item.source] = (acc[item.source] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      final: results.scores.finalScore,
      breakdown,
      confidence: {
        overall: this.calculateOverallConfidence(sources, breakdown.length),
        sources
      }
    }
  }

  /**
   * Determina confiança da métrica
   */
  private getMetricConfidence(source: string): 'high' | 'medium' | 'low' {
    switch (source) {
      case 'engine': return 'high'
      case 'hybrid': return 'medium'
      case 'proxy': return 'low'
      default: return 'medium'
    }
  }

  /**
   * Calcula confiança geral
   */
  private calculateOverallConfidence(sources: Record<string, number>, totalMetrics: number): number {
    let confidence = 50

    if (sources.engine) confidence += (sources.engine / totalMetrics) * 30
    if (sources.hybrid) confidence += (sources.hybrid / totalMetrics) * 20
    if (sources.proxy) confidence += (sources.proxy / totalMetrics) * 10

    return Math.min(100, Math.max(0, confidence))
  }

  /**
   * Constrói seção de issues
   */
  private buildIssuesSection(results: TDDResults): StructuredReport['issues'] {
    const critical = (results.classifier?.redTests || []).map((issue, index) => ({
      id: `CRIT-${index + 1}`,
      category: issue.category,
      title: issue.issue,
      description: issue.evidence,
      impact: this.mapImpact(issue.impact),
      solution: issue.solution,
      tags: ['critical', 'testing', issue.category]
    }))

    const warnings = (results.classifier?.yellowTests || []).map((issue, index) => ({
      id: `WARN-${index + 1}`,
      category: issue.category,
      title: issue.issue,
      description: issue.evidence,
      impact: this.mapImpact(issue.impact),
      solution: issue.solution,
      tags: ['warning', 'testing', issue.category]
    }))

    return { critical, warnings }
  }

  /**
   * Mapeia impacto para níveis padronizados
   */
  private mapImpact(impact: string): 'high' | 'medium' | 'low' {
    const lower = impact.toLowerCase()
    if (lower.includes('alto') || lower.includes('high')) return 'high'
    if (lower.includes('baixo') || lower.includes('low')) return 'low'
    return 'medium'
  }

  /**
   * Constrói seção de recomendações
   */
  private buildRecommendations(results: TDDResults): StructuredReport['recommendations'] {
    const recommendations: StructuredReport['recommendations'] = []

    // Recomendações do classifier
    if (results.classifier?.recommendations) {
      results.classifier.recommendations.forEach((rec, index) => {
        recommendations.push({
          id: `REC-${index + 1}`,
          priority: rec.priority.toLowerCase() as any,
          category: 'testing',
          title: rec.action,
          description: rec.details,
          impact: 'Métricas de qualidade TDD mais confiáveis',
          effort: 'medium',
          timeline: rec.timeline,
          tags: ['testing', 'quality', rec.priority.toLowerCase()]
        })
      })
    }

    // Recomendação baseada na maturidade
    if (results.maturity.level === 'M0') {
      recommendations.push({
        id: 'MATURITY-UPGRADE',
        priority: 'high',
        category: 'testing',
        title: 'Corrigir problemas críticos para avançar maturidade',
        description: `O projeto está em ${results.maturity.level} - corrija os ${results.classifier?.redTests?.length || 0} problemas críticos para desbloquear métricas mais precisas`,
        impact: 'Habilitar métricas reais de cobertura e performance',
        effort: 'high',
        timeline: 'Próxima sprint',
        tags: ['maturity', 'testing', 'upgrade']
      })
    }

    return recommendations
  }

  /**
   * Constrói seção de ações
   */
  private buildActions(results: TDDResults): StructuredReport['actions'] {
    const actions = {
      immediate: [] as string[],
      shortTerm: [] as string[],
      longTerm: [] as string[]
    }

    // Ações imediatas dos problemas críticos
    if (results.classifier?.redTests) {
      results.classifier.redTests.slice(0, 3).forEach(issue => {
        actions.immediate.push(issue.solution)
      })
    }

    // Ações de curto prazo
    if (results.maturity.level === 'M0') {
      actions.shortTerm.push('Executar análise granular por categoria de testes')
      actions.shortTerm.push('Implementar mocks para dependências externas')
    }

    // Ações de longo prazo
    actions.longTerm.push('Implementar monitoramento contínuo da saúde dos testes')
    actions.longTerm.push('Automatizar correção de problemas recorrentes')

    return actions
  }

  /**
   * Constrói seção de cache
   */
  private buildCacheSection(cache: NonNullable<TDDResults['cache']>): StructuredReport['cache'] {
    return {
      hitRate: cache.performance.hitRate,
      decisions: cache.decisions,
      performance: cache.performance
    }
  }

  /**
   * Constrói seção de safe tests
   */
  private buildSafeTestsSection(result: SafeTestResult): StructuredReport['safeTests'] {
    return {
      executed: true,
      subset: {
        totalTests: result.subset.tests.length,
        estimatedDuration: result.subset.totalEstimatedDuration,
        categories: result.subset.coverage
      },
      results: {
        ...result.summary,
        successRate: result.reliability.successRate,
        averageDuration: 0,
        flakyTests: []
      },
      reliability: {
        score: Math.round(result.reliability.successRate),
        trend: 'stable', // TODO: calcular baseado em histórico
        recommendations: [
          result.reliability.successRate < 80 ? 'Revisar testes flaky no subset' : 'Subset confiável mantido'
        ]
      }
    }
  }

  /**
   * Constrói seção de coverage
   */
  private buildCoverageSection(results: TDDResults, coverageProxy?: StaticCoverageProxy): StructuredReport['coverage'] {
    const engineCoverage = results.engine?.scores?.coverage
    const proxyCoverage = coverageProxy?.aggregate.proxyCoverage

    let source: 'real' | 'proxy' | 'hybrid' = 'proxy'
    let overall = 0
    const byFile: any[] = []

    if (engineCoverage !== undefined && proxyCoverage !== undefined) {
      source = 'hybrid'
      overall = (engineCoverage + proxyCoverage) / 2
    } else if (engineCoverage !== undefined) {
      source = 'real'
      overall = engineCoverage
    } else if (proxyCoverage !== undefined) {
      source = 'proxy'
      overall = proxyCoverage
    }

    // Adiciona arquivos se disponíveis
    if (coverageProxy?.byFile && Array.isArray(coverageProxy.byFile)) {
      coverageProxy.byFile.slice(0, 10).forEach(file => {
        byFile.push({
          file: file.file,
          lines: file.totalLines,
          covered: file.estimatedCovered,
          percentage: file.proxyCoverage,
          functions: 0, // TODO: implementar análise de funções
          branches: 0   // TODO: implementar análise de branches
        })
      })
    }

    return {
      source,
      overall: Math.round(overall * 10) / 10,
      byFile,
      summary: {
        total: 100, // placeholder
        covered: Math.round(overall),
        percentage: Math.round(overall),
        threshold: 80,
        met: overall >= 80
      }
    }
  }

  /**
   * Constrói seção de performance
   */
  private buildPerformanceSection(engineScores: Record<string, number>): StructuredReport['performance'] {
    const lcp = engineScores.lcp || 0
    const cls = engineScores.cls || 0
    const inp = engineScores.inp || 0

    const budget = { lcp: 2500, cls: 0.1, inp: 200 }
    const status = (lcp <= budget.lcp && cls <= budget.cls && inp <= budget.inp) ? 'pass' :
                   (lcp <= budget.lcp * 1.2 && cls <= budget.cls * 1.2 && inp <= budget.inp * 1.2) ? 'warn' : 'fail'

    return {
      metrics: { lcp, cls, inp },
      budget,
      status
    }
  }

  /**
   * Salva relatório estruturado
   */
  saveStructuredReport(report: StructuredReport, filename?: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const reportPath = path.join(this.reportsDir, filename || `structured-report-${timestamp}.json`)

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    return reportPath
  }

  /**
   * Carrega relatório estruturado
   */
  loadStructuredReport(filename: string): StructuredReport | null {
    try {
      const reportPath = path.join(this.reportsDir, filename)
      if (fs.existsSync(reportPath)) {
        const content = fs.readFileSync(reportPath, 'utf8')
        return JSON.parse(content)
      }
    } catch (error) {
      console.warn('Error loading structured report:', error instanceof Error ? error.message : String(error))
    }
    return null
  }
}
