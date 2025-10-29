/**
 * Hybrid Metrics - Sistema de métricas híbridas (Node.js Compatible)
 */

export class HybridMetricsCalculator {
  constructor() {
    // Constructor for Node.js compatibility
  }

  /**
   * Calcula métricas híbridas baseado na maturidade
   */
  calculateHybridMetrics(
    maturity,
    classifierScores,
    engineScores,
    coverageProxy,
    safeTestResult
  ) {
    // Valores base do classifier (sempre disponível)
    const baseScores = {
      isolation: classifierScores?.isolation || 0,
      structure: classifierScores?.structure || 0,
      naming: classifierScores?.naming || 0,
      dependencies: classifierScores?.dependencies || 0,
      coverage: 0, // será definido abaixo
      performance: 0, // será definido abaixo
      maintainability: classifierScores?.maintainability || 0,
      complexity: classifierScores?.complexity || 0
    }

    // Incorpora proxy de cobertura quando disponível
    if (coverageProxy?.aggregate?.proxyCoverage) {
      baseScores.coverage = coverageProxy.aggregate.proxyCoverage
    }

    // Incorpora métricas reais do Engine quando disponível (M2+)
    if (engineScores && this.shouldUseEngineMetrics(maturity)) {
      baseScores.coverage = this.hybridizeMetric(
        baseScores.coverage,
        engineScores.coverage || 0,
        0.4 // 40% engine weight for M2+
      )

      baseScores.performance = engineScores.performance || 0
      baseScores.maintainability = this.hybridizeMetric(
        baseScores.maintainability,
        engineScores.maintainability || 0,
        0.4
      )
    }

    // Incorpora métricas de safe tests quando disponível
    if (safeTestResult?.reliability?.successRate) {
      baseScores.isolation = this.hybridizeMetric(
        baseScores.isolation,
        safeTestResult.reliability.successRate,
        0.2 // Safe tests contribuem 20% para isolamento
      )
    }

    // Calcula score final com pesos contextuais
    const weights = this.getMaturityWeights(maturity)
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

    // Breakdown detalhado
    const breakdown = Object.entries(weights).map(([metric, weight]) => ({
      metric,
      weight: (weight * 100).toFixed(1) + '%',
      score: (baseScores[metric] || 0).toFixed(1),
      contribution: ((baseScores[metric] || 0) * weight).toFixed(1),
      source: this.getMetricSource(metric, maturity, !!engineScores, !!coverageProxy)
    }))

    return {
      ...baseScores,
      finalScore: Math.round(finalScore * 10) / 10,
      maturity,
      weights,
      breakdown
    }
  }

  /**
   * Decide se deve usar métricas do Engine
   */
  shouldUseEngineMetrics(maturity) {
    return ['M2', 'M3'].includes(maturity)
  }

  /**
   * Hibridiza duas métricas com peso
   */
  hybridizeMetric(baseValue, engineValue, engineWeight) {
    const classifierWeight = 1 - engineWeight
    return (baseValue * classifierWeight) + (engineValue * engineWeight)
  }

  /**
   * Retorna pesos contextuais por maturidade
   */
  getMaturityWeights(maturity) {
    switch (maturity) {
      case 'M0':
        return {
          isolation: 0.25,
          structure: 0.20,
          naming: 0.15,
          dependencies: 0.15,
          coverage: 0.03,
          performance: 0.05,
          maintainability: 0.10,
          complexity: 0.07
        }

      case 'M1':
        return {
          isolation: 0.22,
          structure: 0.18,
          naming: 0.15,
          dependencies: 0.12,
          coverage: 0.10,
          performance: 0.08,
          maintainability: 0.08,
          complexity: 0.07
        }

      case 'M2':
        return {
          isolation: 0.18,
          coverage: 0.18,
          structure: 0.12,
          naming: 0.12,
          performance: 0.12,
          dependencies: 0.08,
          maintainability: 0.06,
          complexity: 0.04
        }

      case 'M3':
        return {
          coverage: 0.25,
          isolation: 0.15,
          performance: 0.15,
          naming: 0.10,
          structure: 0.10,
          dependencies: 0.08,
          maintainability: 0.07,
          complexity: 0.05
        }

      default:
        return {
          isolation: 0.20,
          structure: 0.15,
          naming: 0.15,
          coverage: 0.15,
          performance: 0.10,
          maintainability: 0.10,
          complexity: 0.05,
          dependencies: 0.10
        }
    }
  }

  /**
   * Determina fonte da métrica para transparência
   */
  getMetricSource(metric, maturity, hasEngineScores, hasCoverageProxy) {
    // Cobertura especial
    if (metric === 'coverage') {
      if (hasEngineScores && this.shouldUseEngineMetrics(maturity)) {
        return hasCoverageProxy ? 'hybrid' : 'engine'
      }
      return hasCoverageProxy ? 'proxy' : 'classifier'
    }

    // Performance só vem do engine
    if (metric === 'performance') {
      return hasEngineScores ? 'engine' : 'classifier'
    }

    // Outras métricas são híbridas quando engine disponível
    if (hasEngineScores && ['maintainability', 'complexity'].includes(metric)) {
      return 'hybrid'
    }

    return 'classifier'
  }
}
