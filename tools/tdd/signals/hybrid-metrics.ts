/**
 * Hybrid Metrics - Sistema de métricas híbridas
 *
 * Combina sinais do Classifier (sempre disponível) com métricas reais
 * do Engine (quando subset seguro roda) baseado na maturidade.
 */

import type {
  MaturityLevel,
  ContextualScores,
  TDDResults,
  StaticCoverageProxy,
  SafeTestResult,
} from "../types.js";

export class HybridMetricsCalculator {
  /**
   * Calcula métricas híbridas baseado na maturidade
   */
  calculateHybridMetrics(
    maturity: MaturityLevel,
    classifierScores: Record<string, number>,
    engineScores?: Record<string, number>,
    coverageProxy?: StaticCoverageProxy,
    safeTestResult?: SafeTestResult,
  ): ContextualScores {
    // Define pesos híbridos por maturidade
    const hybridWeights = this.getHybridWeights(maturity);

    // Valores base do classifier (sempre disponível)
    const baseScores = {
      isolation: classifierScores.isolation || 0,
      structure: classifierScores.structure || 0,
      naming: classifierScores.naming || 0,
      dependencies: classifierScores.dependencies || 0,
      coverage: 0, // será definido abaixo
      performance: 0, // será definido abaixo
      maintainability: classifierScores.maintainability || 0,
      complexity: classifierScores.complexity || 0,
    };

    // Incorpora proxy de cobertura quando disponível
    if (coverageProxy) {
      baseScores.coverage = coverageProxy.aggregate.proxyCoverage;
    }

    // Incorpora métricas reais do Engine quando disponível (M2+)
    if (engineScores && this.shouldUseEngineMetrics(maturity)) {
      baseScores.coverage = this.hybridizeMetric(
        baseScores.coverage,
        engineScores.coverage || 0,
        hybridWeights.engineWeight,
      );

      baseScores.performance = engineScores.performance || 0;
      baseScores.maintainability = this.hybridizeMetric(
        baseScores.maintainability,
        engineScores.maintainability || 0,
        hybridWeights.engineWeight,
      );
    }

    // Incorpora métricas de safe tests quando disponível
    if (safeTestResult) {
      baseScores.isolation = this.hybridizeMetric(
        baseScores.isolation,
        safeTestResult.reliability.successRate,
        0.2, // Safe tests contribuem 20% para isolamento
      );
    }

    // Calcula score final com pesos contextuais
    const weights = this.getMaturityWeights(maturity);
    const finalScore =
      baseScores.isolation * weights.isolation +
      baseScores.structure * weights.structure +
      baseScores.naming * weights.naming +
      baseScores.coverage * weights.coverage +
      baseScores.performance * weights.performance +
      baseScores.maintainability * weights.maintainability +
      baseScores.complexity * weights.complexity +
      baseScores.dependencies * weights.dependencies;

    // Breakdown detalhado
    const breakdown = Object.entries(weights).map(([metric, weight]) => ({
      metric,
      weight: (weight * 100).toFixed(1) + "%",
      score: (baseScores[metric as keyof typeof baseScores] || 0).toFixed(1),
      contribution: (
        (baseScores[metric as keyof typeof baseScores] || 0) * weight
      ).toFixed(1),
      source: this.getMetricSource(
        metric,
        maturity,
        !!engineScores,
        !!coverageProxy,
      ) as unknown,
    }));

    return {
      ...baseScores,
      finalScore: Math.round(finalScore * 10) / 10,
      maturity,
      weights,
      breakdown,
    };
  }

  /**
   * Define pesos híbridos por maturidade
   */
  private getHybridWeights(maturity: MaturityLevel): {
    classifierWeight: number;
    engineWeight: number;
    proxyWeight: number;
  } {
    switch (maturity) {
      case "M0":
        return {
          classifierWeight: 1.0, // 100% classifier
          engineWeight: 0.0, // 0% engine
          proxyWeight: 0.3, // Proxy contribui pouco
        };

      case "M1":
        return {
          classifierWeight: 0.8, // 80% classifier
          engineWeight: 0.2, // 20% engine (subset seguro)
          proxyWeight: 0.5, // Proxy mais relevante
        };

      case "M2":
        return {
          classifierWeight: 0.6, // 60% classifier
          engineWeight: 0.4, // 40% engine
          proxyWeight: 0.2, // Proxy menos necessário
        };

      case "M3":
        return {
          classifierWeight: 0.3, // 30% classifier
          engineWeight: 0.7, // 70% engine (métricas reais)
          proxyWeight: 0.0, // Proxy não necessário
        };

      default:
        return {
          classifierWeight: 1.0,
          engineWeight: 0.0,
          proxyWeight: 0.0,
        };
    }
  }

  /**
   * Decide se deve usar métricas do Engine
   */
  private shouldUseEngineMetrics(maturity: MaturityLevel): boolean {
    return ["M2", "M3"].includes(maturity);
  }

  /**
   * Hibridiza duas métricas com peso
   */
  private hybridizeMetric(
    baseValue: number,
    engineValue: number,
    engineWeight: number,
  ): number {
    const classifierWeight = 1 - engineWeight;
    return baseValue * classifierWeight + engineValue * engineWeight;
  }

  /**
   * Retorna pesos contextuais por maturidade (compatível com PR-1)
   */
  private getMaturityWeights(maturity: MaturityLevel): Record<string, number> {
    switch (maturity) {
      case "M0":
        return {
          isolation: 0.25,
          structure: 0.2,
          naming: 0.15,
          dependencies: 0.15,
          coverage: 0.03,
          performance: 0.05,
          maintainability: 0.1,
          complexity: 0.07,
        };

      case "M1":
        return {
          isolation: 0.22,
          structure: 0.18,
          naming: 0.15,
          dependencies: 0.12,
          coverage: 0.1,
          performance: 0.08,
          maintainability: 0.08,
          complexity: 0.07,
        };

      case "M2":
        return {
          isolation: 0.18,
          coverage: 0.18,
          structure: 0.12,
          naming: 0.12,
          performance: 0.12,
          dependencies: 0.08,
          maintainability: 0.06,
          complexity: 0.04,
        };

      case "M3":
        return {
          coverage: 0.25,
          isolation: 0.15,
          performance: 0.15,
          naming: 0.1,
          structure: 0.1,
          dependencies: 0.08,
          maintainability: 0.07,
          complexity: 0.05,
        };

      default:
        return {
          isolation: 0.2,
          structure: 0.15,
          naming: 0.15,
          coverage: 0.15,
          performance: 0.1,
          maintainability: 0.1,
          complexity: 0.05,
          dependencies: 0.1,
        };
    }
  }

  /**
   * Determina fonte da métrica para transparência
   */
  private getMetricSource(
    metric: string,
    maturity: MaturityLevel,
    hasEngineScores: boolean,
    hasCoverageProxy: boolean,
  ): "classifier" | "engine" | "proxy" | "hybrid" {
    // Cobertura especial
    if (metric === "coverage") {
      if (hasEngineScores && this.shouldUseEngineMetrics(maturity)) {
        return hasCoverageProxy ? "hybrid" : "engine";
      }
      return hasCoverageProxy ? "proxy" : "classifier";
    }

    // Performance só vem do engine
    if (metric === "performance") {
      return hasEngineScores ? "engine" : "classifier";
    }

    // Outras métricas são híbridas quando engine disponível
    if (hasEngineScores && ["maintainability", "complexity"].includes(metric)) {
      return "hybrid";
    }

    return "classifier";
  }

  /**
   * Gera relatório de confiança das métricas híbridas
   */
  generateConfidenceReport(scores: ContextualScores): unknown {
    const sources = scores.breakdown.reduce(
      (acc, item) => {
        acc[item.source] = (acc[item.source] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const totalMetrics = scores.breakdown.length;
    const confidence = {
      overall: this.calculateOverallConfidence(sources, totalMetrics),
      bySource: sources,
      maturity: scores.maturity,
      recommendations: this.generateConfidenceRecommendations(
        sources,
        scores.maturity,
      ),
    };

    return confidence;
  }

  /**
   * Calcula confiança geral das métricas (0-100)
   */
  private calculateOverallConfidence(
    sources: Record<string, number>,
    totalMetrics: number,
  ): number {
    let confidence = 50; // Base

    // Engine metrics = alta confiança
    if (sources.engine) {
      confidence += (sources.engine / totalMetrics) * 30;
    }

    // Hybrid metrics = confiança média
    if (sources.hybrid) {
      confidence += (sources.hybrid / totalMetrics) * 20;
    }

    // Proxy metrics = confiança baixa
    if (sources.proxy) {
      confidence += (sources.proxy / totalMetrics) * 10;
    }

    // Classifier-only = confiança mínima
    if (sources.classifier === totalMetrics) {
      confidence = Math.max(20, confidence - 20);
    }

    return Math.min(100, Math.max(0, confidence));
  }

  /**
   * Gera recomendações baseadas na confiança
   */
  private generateConfidenceRecommendations(
    sources: Record<string, number>,
    maturity: MaturityLevel,
  ): string[] {
    const recommendations: string[] = [];

    if (sources.classifier && !sources.engine && maturity !== "M0") {
      recommendations.push(
        "Considere executar subset seguro para métricas mais precisas",
      );
    }

    if (sources.proxy && sources.proxy > 2) {
      recommendations.push(
        "Métricas de proxy são estimativas - valide com execução real quando possível",
      );
    }

    if (sources.hybrid) {
      recommendations.push(
        "Métricas híbridas combinam sinais confiáveis com estimativas",
      );
    }

    if (maturity === "M0" && sources.engine) {
      recommendations.push(
        "Execução do Engine em M0 é surpreendente - verifique configuração",
      );
    }

    return recommendations;
  }
}
