/**
 * Alerts Manager - Sistema de Notificações Inteligentes (Node.js Compatible)
 */

// Simplified Alert class for Node.js
class Alert {
  constructor(options = {}) {
    this.id = options.id || ''
    this.level = options.level || 'info'
    this.category = options.category || 'quality'
    this.title = options.title || ''
    this.description = options.description || ''
    this.impact = options.impact || ''
    this.recommendation = options.recommendation || ''
    this.evidence = options.evidence || null
    this.actionable = options.actionable || false
    this.createdAt = options.createdAt || new Date().toISOString()
    this.expiresAt = options.expiresAt || null
    this.tags = options.tags || []
  }
}

// Simplified AlertSummary class for Node.js
class AlertSummary {
  constructor(options = {}) {
    this.total = options.total || 0
    this.byLevel = options.byLevel || {}
    this.byCategory = options.byCategory || {}
    this.critical = options.critical || []
    this.warnings = options.warnings || []
    this.recommendations = options.recommendations || []
  }
}

export class AlertsManager {
  constructor() {
    this.alerts = []
    this.maxAlerts = 50
  }

  /**
   * Analisa resultados e gera alertas inteligentes
   */
  analyzeAndGenerateAlerts(results, safeTestResult) {
    this.alerts = []

    // Alertas de maturidade
    this.checkMaturityAlerts(results)

    // Alertas de qualidade crítica
    this.checkQualityAlerts(results)

    // Alertas de performance
    this.checkPerformanceAlerts(results)

    // Alertas de cobertura
    this.checkCoverageAlerts(results)

    // Manter apenas os mais recentes
    this.alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(0, this.maxAlerts)
    }

    return this.generateSummary()
  }

  checkMaturityAlerts(results) {
    const maturity = results.maturity?.level || 'M0'
    const score = results.scores?.finalScore || 0
    const criticalCount = results.classifier?.redTests?.length || 0

    // Maturidade crítica há muito tempo
    if (maturity === 'M0' && criticalCount >= 3) {
      this.addAlert({
        id: 'maturity-stuck-critical',
        level: 'critical',
        category: 'maturity',
        title: 'Maturidade crítica persistente',
        description: `Projeto permanece em M0 com ${criticalCount} problemas críticos`,
        impact: 'Bloqueia acesso a métricas avançadas',
        recommendation: 'Priorizar correção dos problemas críticos',
        evidence: { maturity, criticalCount, score },
        actionable: true,
        tags: ['maturity', 'blocking', 'critical-path']
      })
    }
  }

  checkQualityAlerts(results) {
    const redTests = results.classifier?.redTests || []
    const yellowTests = results.classifier?.yellowTests || []

    // Muitos problemas críticos
    if (redTests.length >= 3) {
      this.addAlert({
        id: 'too-many-critical-issues',
        level: 'critical',
        category: 'quality',
        title: 'Excesso de problemas críticos',
        description: `${redTests.length} problemas críticos identificados`,
        impact: 'Qualidade do código comprometida',
        recommendation: 'Focar em correção dos problemas mais impactantes',
        evidence: { criticalCount: redTests.length },
        actionable: true,
        tags: ['quality', 'critical', 'prioritization']
      })
    }
  }

  checkPerformanceAlerts(results) {
    // Performance do cache (se disponível)
    if (results.cache?.performance) {
      const hitRate = results.cache.performance.hitRate || 0
      if (hitRate < 0.3) {
        this.addAlert({
          id: 'low-cache-hit-rate',
          level: 'info',
          category: 'performance',
          title: 'Taxa de acerto do cache baixa',
          description: `Cache atingindo apenas ${(hitRate * 100).toFixed(1)}%`,
          impact: 'Análises mais lentas',
          recommendation: 'Revisar estratégia de invalidação',
          evidence: { hitRate },
          actionable: true,
          tags: ['performance', 'cache', 'optimization']
        })
      }
    }
  }

  checkCoverageAlerts(results) {
    const coverage = results.scores?.coverage || 0
    const maturity = results.maturity?.level || 'M0'

    const expectedMin = { M0: 0, M1: 10, M2: 50, M3: 80 }[maturity] || 0

    if (coverage < expectedMin) {
      this.addAlert({
        id: 'coverage-below-maturity',
        level: maturity === 'M3' ? 'critical' : 'warning',
        category: 'coverage',
        title: 'Cobertura abaixo do esperado',
        description: `Cobertura de ${(coverage).toFixed(1)}% está abaixo dos ${expectedMin}% esperados`,
        impact: 'Risco maior de bugs não detectados',
        recommendation: 'Aumentar cobertura de testes',
        evidence: { coverage, expected: expectedMin, maturity },
        actionable: true,
        tags: ['coverage', 'testing', 'risk']
      })
    }
  }

  addAlert(alertOptions) {
    const fullAlert = new Alert({
      ...alertOptions,
      createdAt: new Date().toISOString()
    })

    // Evitar duplicatas recentes
    const existing = this.alerts.find(a =>
      a.id === alertOptions.id &&
      new Date().getTime() - new Date(a.createdAt).getTime() < 24 * 60 * 60 * 1000
    )

    if (!existing) {
      this.alerts.push(fullAlert)
    }
  }

  generateSummary() {
    const byLevel = this.alerts.reduce((acc, alert) => {
      acc[alert.level] = (acc[alert.level] || 0) + 1
      return acc
    }, {})

    const byCategory = this.alerts.reduce((acc, alert) => {
      acc[alert.category] = (acc[alert.category] || 0) + 1
      return acc
    }, {})

    const critical = this.alerts.filter(a => a.level === 'critical')
    const warnings = this.alerts.filter(a => a.level === 'warning')

    const recommendations = this.alerts
      .filter(a => a.actionable)
      .sort((a, b) => {
        const priorityOrder = { critical: 3, warning: 2, info: 1 }
        return priorityOrder[b.level] - priorityOrder[a.level]
      })
      .slice(0, 5)
      .map(a => a.recommendation)

    return new AlertSummary({
      total: this.alerts.length,
      byLevel,
      byCategory,
      critical,
      warnings,
      recommendations
    })
  }
}
