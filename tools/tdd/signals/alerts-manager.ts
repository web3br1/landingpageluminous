/**
 * Alerts Manager - Sistema de Notificações Inteligentes
 *
 * Detecta anomalias, tendências preocupantes e oportunidades de melhoria
 * baseado no histórico de execuções TDD.
 */

import type { TDDResults, SafeTestResult } from "../types.js";

export interface Alert {
  id: string;
  level: "info" | "warning" | "critical";
  category: "quality" | "performance" | "coverage" | "stability" | "maturity";
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  evidence: unknown;
  actionable: boolean;
  createdAt: string;
  expiresAt?: string;
  tags: string[];
}

export interface AlertSummary {
  total: number;
  byLevel: Record<Alert["level"], number>;
  byCategory: Record<Alert["category"], number>;
  critical: Alert[];
  warnings: Alert[];
  recommendations: string[];
}

export class AlertsManager {
  private alerts: Alert[] = [];
  private readonly maxAlerts = 50;

  /**
   * Analisa resultados e gera alertas inteligentes
   */
  analyzeAndGenerateAlerts(
    results: TDDResults,
    safeTestResult?: SafeTestResult,
  ): AlertSummary {
    this.alerts = [];

    // Alertas de maturidade
    this.checkMaturityAlerts(results);

    // Alertas de qualidade crítica
    this.checkQualityAlerts(results);

    // Alertas de performance
    this.checkPerformanceAlerts(results);

    // Alertas de cobertura
    this.checkCoverageAlerts(results);

    // Alertas de safe tests (se disponível)
    if (safeTestResult) {
      this.checkSafeTestsAlerts(safeTestResult);
    }

    // Alertas de tendência (simulado por enquanto)
    this.checkTrendAlerts(results);

    // Manter apenas os mais recentes
    this.alerts.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(0, this.maxAlerts);
    }

    return this.generateSummary();
  }

  /**
   * Verifica alertas relacionados à maturidade
   */
  private checkMaturityAlerts(results: TDDResults): void {
    const maturity = results.maturity.level;
    const score = results.scores.finalScore;
    const criticalCount = results.classifier.redTests?.length || 0;

    // Maturidade crítica há muito tempo
    if (maturity === "M0" && criticalCount >= 3) {
      this.addAlert({
        id: "maturity-stuck-critical",
        level: "critical",
        category: "maturity",
        title: "Maturidade crítica persistente",
        description: `Projeto permanece em M0 com ${criticalCount} problemas críticos há múltiplas execuções`,
        impact:
          "Bloqueia acesso a métricas avançadas e aumenta risco de regressões",
        recommendation:
          "Priorizar correção dos problemas críticos identificados antes de adicionar novas funcionalidades",
        evidence: { maturity, criticalCount, score },
        actionable: true,
        tags: ["maturity", "blocking", "critical-path"],
      });
    }

    // Score muito baixo para maturidade atual
    if (maturity !== "M0" && score < 40) {
      this.addAlert({
        id: "score-maturity-mismatch",
        level: "warning",
        category: "maturity",
        title: "Score incompatível com maturidade",
        description: `Score de ${score}/100 é muito baixo para maturidade ${maturity}`,
        impact:
          "Indicativo de problemas não detectados ou métricas desatualizadas",
        recommendation:
          "Revisar configuração de pesos e validar fontes de métricas",
        evidence: { maturity, score, expectedMin: 60 },
        actionable: true,
        tags: ["maturity", "metrics", "validation"],
      });
    }
  }

  /**
   * Verifica alertas de qualidade crítica
   */
  private checkQualityAlerts(results: TDDResults): void {
    const redTests = results.classifier.redTests || [];
    const yellowTests = results.classifier.yellowTests || [];

    // Muitos problemas críticos
    if (redTests.length >= 5) {
      this.addAlert({
        id: "too-many-critical-issues",
        level: "critical",
        category: "quality",
        title: "Excesso de problemas críticos",
        description: `${redTests.length} problemas críticos identificados - limite recomendado é 3`,
        impact:
          "Qualidade do código comprometida, alto risco de bugs em produção",
        recommendation:
          "Focar em correção dos problemas mais impactantes primeiro",
        evidence: {
          criticalCount: redTests.length,
          issues: redTests.slice(0, 3),
        },
        actionable: true,
        tags: ["quality", "critical", "prioritization"],
      });
    }

    // Problemas recorrentes
    const recurringCategories = this.findRecurringIssues(redTests);
    if (recurringCategories.length > 0) {
      this.addAlert({
        id: "recurring-issues-pattern",
        level: "warning",
        category: "quality",
        title: "Padrão de problemas recorrentes",
        description: `Problemas em ${recurringCategories.join(", ")} aparecem consistentemente`,
        impact: "Indicativo de antipadrões ou falta de padrões de codificação",
        recommendation:
          "Implementar regras de lint ou revisões específicas para essas categorias",
        evidence: { recurringCategories, frequency: "consistent" },
        actionable: true,
        tags: ["quality", "patterns", "recurring"],
      });
    }

    // Avisos ignorados há muito tempo
    if (yellowTests.length >= 10) {
      this.addAlert({
        id: "too-many-warnings",
        level: "info",
        category: "quality",
        title: "Acúmulo de avisos",
        description: `${yellowTests.length} avisos acumulados - considerar limpeza`,
        impact: "Ruído pode mascarar problemas reais importantes",
        recommendation:
          "Resolver avisos não críticos ou ajustar regras de qualidade",
        evidence: { warningCount: yellowTests.length },
        actionable: false,
        tags: ["quality", "warnings", "maintenance"],
      });
    }
  }

  /**
   * Verifica alertas de performance
   */
  private checkPerformanceAlerts(results: TDDResults): void {
    // Performance do cache (se disponível)
    if (results.cache?.performance) {
      const hitRate = results.cache.performance.hitRate;
      if (hitRate < 0.3) {
        this.addAlert({
          id: "low-cache-hit-rate",
          level: "info",
          category: "performance",
          title: "Taxa de acerto do cache baixa",
          description: `Cache atingindo apenas ${(hitRate * 100).toFixed(1)}% - oportunidade de otimização`,
          impact: "Análises mais lentas, maior uso de recursos",
          recommendation: "Revisar estratégia de invalidação ou aumentar TTL",
          evidence: { hitRate, domains: results.cache.decisions.length },
          actionable: true,
          tags: ["performance", "cache", "optimization"],
        });
      }
    }

    // Tempo de execução longo - TODO: Add executionTime to TDDResults
    // const executionTime = results.executionTime || 0
    // if (executionTime > 60000) { // 1 minuto
    //   this.addAlert({
    //     id: 'slow-analysis-time',
    //     level: 'warning',
    //     category: 'performance',
    //     title: 'Análise muito lenta',
    //     description: `Análise levou ${Math.round(executionTime / 1000)}s - acima do recomendado`,
    //     impact: 'Feedback lento para desenvolvedores, possível gargalo em CI',
    //     recommendation: 'Otimizar componentes ou implementar cache mais agressivo',
    //     evidence: { executionTime, threshold: 60000 },
    //     actionable: true,
    //     tags: ['performance', 'ci', 'feedback']
    //   })
    // }
  }

  /**
   * Verifica alertas de cobertura
   */
  private checkCoverageAlerts(results: TDDResults): void {
    // Cobertura muito baixa para maturidade
    const coverage = results.engine?.scores?.coverage || 0;
    const maturity = results.maturity.level;

    const expectedMin = { M0: 0, M1: 10, M2: 50, M3: 80 }[maturity] || 0;

    if (coverage < expectedMin) {
      this.addAlert({
        id: "coverage-below-maturity",
        level: maturity === "M3" ? "critical" : "warning",
        category: "coverage",
        title: "Cobertura abaixo do esperado",
        description: `Cobertura de ${coverage.toFixed(1)}% está abaixo dos ${expectedMin}% esperados para ${maturity}`,
        impact: "Risco maior de bugs não detectados, confiança reduzida",
        recommendation:
          maturity === "M0"
            ? "Focar primeiro na estabilização antes de cobertura"
            : "Aumentar cobertura de testes ou ajustar expectativas de maturidade",
        evidence: { coverage, expected: expectedMin, maturity },
        actionable: true,
        tags: ["coverage", "testing", "risk"],
      });
    }

    // Cobertura baseada apenas em proxy (não real)
    const hasRealCoverage = results.engine?.scores?.coverage !== undefined;
    if (!hasRealCoverage && maturity !== "M0") {
      this.addAlert({
        id: "proxy-only-coverage",
        level: "info",
        category: "coverage",
        title: "Cobertura baseada em estimativas",
        description:
          "Usando apenas proxy de cobertura - métricas reais não disponíveis",
        impact: "Métricas aproximadas, menor precisão para tomada de decisão",
        recommendation:
          "Melhorar maturidade para habilitar métricas reais de cobertura",
        evidence: { hasRealCoverage, maturity },
        actionable: false,
        tags: ["coverage", "proxy", "accuracy"],
      });
    }
  }

  /**
   * Verifica alertas de safe tests
   */
  private checkSafeTestsAlerts(safeTestResult: SafeTestResult): void {
    const successRate = safeTestResult.reliability.successRate;
    const flakyCount = safeTestResult.reliability.flakyTests.length;

    // Taxa de sucesso baixa
    if (successRate < 70) {
      this.addAlert({
        id: "low-safe-tests-success",
        level: "critical",
        category: "stability",
        title: "Safe tests com baixa confiabilidade",
        description: `Subset seguro atingindo apenas ${successRate.toFixed(1)}% de sucesso`,
        impact: "Métricas híbridas comprometidas, subset não confiável",
        recommendation:
          "Revisar critérios de seleção do safe subset ou corrigir testes flaky",
        evidence: { successRate, totalTests: safeTestResult.summary.total },
        actionable: true,
        tags: ["stability", "safe-tests", "reliability"],
      });
    }

    // Muitos testes flaky
    if (flakyCount > 0) {
      this.addAlert({
        id: "flaky-safe-tests",
        level: "warning",
        category: "stability",
        title: "Testes flaky no subset seguro",
        description: `${flakyCount} testes marcados como flaky no subset`,
        impact: "Resultados inconsistentes, métricas menos confiáveis",
        recommendation:
          "Investigar e corrigir testes flaky ou removê-los do subset",
        evidence: {
          flakyCount,
          flakyTests: safeTestResult.reliability.flakyTests,
        },
        actionable: true,
        tags: ["stability", "flaky", "reliability"],
      });
    }
  }

  /**
   * Verifica alertas de tendência (simulado)
   */
  private checkTrendAlerts(results: TDDResults): void {
    // Simulação de alertas baseados em tendências
    // Em produção, isso seria baseado em dados históricos reais

    // Score caindo
    if (results.scores.finalScore < 50) {
      this.addAlert({
        id: "score-declining-trend",
        level: "warning",
        category: "quality",
        title: "Tendência de queda no score",
        description:
          "Score geral apresentando tendência de queda nas últimas execuções",
        impact: "Qualidade regredindo ao longo do tempo",
        recommendation:
          "Revisar commits recentes e identificar causas da queda",
        evidence: {
          currentScore: results.scores.finalScore,
          trend: "declining",
        },
        actionable: true,
        tags: ["trends", "quality", "regression"],
      });
    }

    // Maturidade estagnada
    if (results.maturity.level === "M1") {
      this.addAlert({
        id: "maturity-stagnant",
        level: "info",
        category: "maturity",
        title: "Maturidade estagnada",
        description:
          "Projeto permanece em M1 há múltiplas execuções sem progresso",
        impact: "Limita acesso a métricas mais avançadas",
        recommendation:
          "Focar em resolver problemas críticos para avançar para M2",
        evidence: { maturity: "M1", stagnationPeriod: "multiple runs" },
        actionable: true,
        tags: ["maturity", "progress", "stagnation"],
      });
    }
  }

  /**
   * Encontra categorias de problemas recorrentes
   */
  private findRecurringIssues(issues: unknown[]): string[] {
    const categories = issues.map((issue) => issue.category);
    const categoryCount: Record<string, number> = {};

    categories.forEach((cat) => {
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    return Object.entries(categoryCount)
      .filter(([, count]) => count >= 2)
      .map(([category]) => category);
  }

  /**
   * Adiciona alerta à lista
   */
  private addAlert(alert: Omit<Alert, "createdAt">): void {
    const fullAlert: Alert = {
      ...alert,
      createdAt: new Date().toISOString(),
    };

    // Evitar duplicatas recentes (mesmo ID nas últimas 24h)
    const existing = this.alerts.find(
      (a) =>
        a.id === alert.id &&
        new Date().getTime() - new Date(a.createdAt).getTime() <
          24 * 60 * 60 * 1000,
    );

    if (!existing) {
      this.alerts.push(fullAlert);
    }
  }

  /**
   * Gera resumo dos alertas
   */
  private generateSummary(): AlertSummary {
    const byLevel = this.alerts.reduce(
      (acc, alert) => {
        acc[alert.level] = (acc[alert.level] || 0) + 1;
        return acc;
      },
      {} as Record<Alert["level"], number>,
    );

    const byCategory = this.alerts.reduce(
      (acc, alert) => {
        acc[alert.category] = (acc[alert.category] || 0) + 1;
        return acc;
      },
      {} as Record<Alert["category"], number>,
    );

    const critical = this.alerts.filter((a) => a.level === "critical");
    const warnings = this.alerts.filter((a) => a.level === "warning");

    const recommendations = this.alerts
      .filter((a) => a.actionable)
      .sort((a, b) => {
        const priorityOrder = { critical: 3, warning: 2, info: 1 };
        return priorityOrder[b.level] - priorityOrder[a.level];
      })
      .slice(0, 5)
      .map((a) => a.recommendation);

    return {
      total: this.alerts.length,
      byLevel,
      byCategory,
      critical,
      warnings,
      recommendations,
    };
  }

  /**
   * Obtém alertas ativos
   */
  getActiveAlerts(): AlertSummary {
    // Filtrar alertas não expirados
    const active = this.alerts.filter(
      (alert) => !alert.expiresAt || new Date(alert.expiresAt) > new Date(),
    );

    this.alerts = active;
    return this.generateSummary();
  }

  /**
   * Limpa alertas expirados
   */
  cleanupExpiredAlerts(): void {
    const now = new Date();
    this.alerts = this.alerts.filter(
      (alert) => !alert.expiresAt || new Date(alert.expiresAt) > now,
    );
  }
}
