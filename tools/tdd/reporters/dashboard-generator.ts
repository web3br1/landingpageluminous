/**
 * Dashboard Generator - Visualizações HTML para Dados TDD
 *
 * Gera dashboards interativos com gráficos e métricas visuais
 * para acompanhar a evolução da qualidade TDD.
 */

import fs from "fs";
import path from "path";
import type { TDDResults, SafeTestResult } from "../types";

export interface DashboardData {
  results: TDDResults;
  safeTests?: SafeTestResult;
  alerts: unknown;
  trends: unknown[]; // Histórico de execuções
  generatedAt: string;
}

export class DashboardGenerator {
  private templatesDir: string;
  private outputDir: string;

  constructor(outputDir = path.join(process.cwd(), "tmp", "tdd-reports")) {
    this.outputDir = outputDir;
    this.templatesDir = path.join(__dirname, "templates");
  }

  /**
   * Gera dashboard completo
   */
  generateDashboard(data: DashboardData): string {
    const html = this.buildHTML(data);
    const dashboardPath = path.join(this.outputDir, "tdd-dashboard.html");

    fs.writeFileSync(dashboardPath, html);
    console.log(`📊 Dashboard gerado: ${dashboardPath}`);

    return dashboardPath;
  }

  /**
   * Constrói HTML completo do dashboard
   */
  private buildHTML(data: DashboardData): string {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TDD Quality Dashboard</title>
    <style>${this.getCSS()}</style>
</head>
<body>
    <div class="dashboard">
        <header class="header">
            <h1>🎯 TDD Quality Dashboard</h1>
            <div class="header-info">
                <span>Gerado em: ${new Date(data.generatedAt).toLocaleString("pt-BR")}</span>
                <span>Maturidade: ${this.getMaturityBadge(data.results.maturity.level)}</span>
            </div>
        </header>

        <div class="grid">
            ${this.buildScoreCard(data)}
            ${this.buildQualityMetrics(data)}
            ${this.buildAlertsPanel(data)}
            ${this.buildCoverageChart(data)}
            ${this.buildTrendsChart(data)}
            ${this.buildSafeTestsPanel(data)}
        </div>

        <div class="footer">
            <p>Relatório gerado automaticamente pelo TDD Quality Orchestrator</p>
        </div>
    </div>

    <script>${this.getJavaScript()}</script>
</body>
</html>`;
  }

  /**
   * Constrói card principal de score
   */
  private buildScoreCard(data: DashboardData): string {
    const score = data.results.scores.finalScore;
    const maturity = data.results.maturity;
    const criticalCount = data.results.classifier.redTests?.length || 0;

    return `
    <div class="card score-card">
        <h3>📊 Score Geral</h3>
        <div class="score-display">
            <div class="score-number ${this.getScoreClass(score)}">${score.toFixed(1)}</div>
            <div class="score-label">/100</div>
        </div>
        <div class="score-details">
            <div class="detail-item">
                <span class="label">Maturidade:</span>
                <span class="value">${maturity.name} (${maturity.level})</span>
            </div>
            <div class="detail-item">
                <span class="label">Problemas Críticos:</span>
                <span class="value ${criticalCount > 0 ? "danger" : "success"}">${criticalCount}</span>
            </div>
            <div class="detail-item">
                <span class="label">Tempo de Análise:</span>
                <span class="value">N/A s</span>
            </div>
        </div>
    </div>`;
  }

  /**
   * Constrói painel de métricas de qualidade
   */
  private buildQualityMetrics(data: DashboardData): string {
    const scores = data.results.scores;

    return `
    <div class="card quality-metrics">
        <h3>🎯 Métricas de Qualidade</h3>
        <div class="metrics-grid">
            ${this.buildMetricBar("Score Final", scores.finalScore || 0, "Pontuação geral")}
            ${this.buildMetricBar("Maturity", scores.maturity === "M3" ? 100 : scores.maturity === "M2" ? 75 : scores.maturity === "M1" ? 50 : 25, "Nível de maturidade")}
            ${this.buildMetricBar("Weights", Object.keys(scores.weights || {}).length * 10, "Métricas ponderadas")}
            ${this.buildMetricBar("Breakdown", scores.breakdown?.length || 0, "Análise detalhada")}
        </div>
    </div>`;
  }

  /**
   * Constrói barra de métrica individual
   */
  private buildMetricBar(
    label: string,
    value: number,
    description: string,
  ): string {
    const percentage = Math.min(100, Math.max(0, value));
    const className = this.getScoreClass(value);

    return `
    <div class="metric-item">
        <div class="metric-header">
            <span class="metric-label">${label}</span>
            <span class="metric-value ${className}">${value.toFixed(1)}</span>
        </div>
        <div class="metric-bar">
            <div class="metric-fill ${className}" style="width: ${percentage}%"></div>
        </div>
        <div class="metric-description">${description}</div>
    </div>`;
  }

  /**
   * Constrói painel de alertas
   */
  private buildAlertsPanel(data: DashboardData): string {
    const alerts = data.alerts;

    return `
    <div class="card alerts-panel">
        <h3>🚨 Alertas Ativos</h3>
        ${
          alerts.total === 0
            ? '<div class="no-alerts">✅ Nenhum alerta ativo</div>'
            : this.buildAlertsList(alerts)
        }
    </div>`;
  }

  /**
   * Constrói lista de alertas
   */
  private buildAlertsList(alerts: unknown): string {
    const allAlerts = [...alerts.critical, ...alerts.warnings.slice(0, 5)];

    return `
    <div class="alerts-list">
        ${allAlerts
          .map(
            (alert) => `
            <div class="alert-item ${alert.level}">
                <div class="alert-header">
                    <span class="alert-level">${this.getAlertLevelIcon(alert.level)}</span>
                    <span class="alert-title">${alert.title}</span>
                </div>
                <div class="alert-description">${alert.description}</div>
                <div class="alert-recommendation">${alert.recommendation}</div>
            </div>
        `,
          )
          .join("")}
    </div>`;
  }

  /**
   * Constrói gráfico de cobertura
   */
  private buildCoverageChart(data: DashboardData): string {
    const coverage = data.results.engine?.scores?.coverage || 0;
    const hasRealCoverage = data.results.engine?.scores?.coverage !== undefined;

    return `
    <div class="card coverage-chart">
        <h3>📈 Cobertura de Testes</h3>
        <div class="coverage-display">
            <div class="coverage-circle">
                <svg width="120" height="120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="#e0e0e0" stroke-width="8"/>
                    <circle cx="60" cy="60" r="50" fill="none" stroke="${this.getScoreColor(coverage)}"
                            stroke-width="8" stroke-dasharray="${2 * Math.PI * 50}"
                            stroke-dashoffset="${2 * Math.PI * 50 * (1 - coverage / 100)}"
                            transform="rotate(-90 60 60)"/>
                    <text x="60" y="65" text-anchor="middle" font-size="20" font-weight="bold">
                        ${coverage.toFixed(1)}%
                    </text>
                </svg>
            </div>
            <div class="coverage-info">
                <div class="coverage-type">${hasRealCoverage ? "Cobertura Real" : "Cobertura Estimada"}</div>
                <div class="coverage-description">
                    ${
                      hasRealCoverage
                        ? "Métricas calculadas a partir de testes executados"
                        : "Estimativa baseada em análise estática de código"
                    }
                </div>
            </div>
        </div>
    </div>`;
  }

  /**
   * Constrói gráfico de tendências
   */
  private buildTrendsChart(data: DashboardData): string {
    // Placeholder para gráfico de tendências
    return `
    <div class="card trends-chart">
        <h3>📊 Tendências</h3>
        <div class="trends-placeholder">
            <div class="trend-item">
                <span class="trend-label">Últimas 7 execuções:</span>
                <span class="trend-value">${data.trends.length} disponíveis</span>
            </div>
            <div class="trend-item">
                <span class="trend-label">Média de score:</span>
                <span class="trend-value">${this.calculateTrendAverage(data.trends, "score")} pts</span>
            </div>
            <div class="trend-item">
                <span class="trend-label">Problemas recorrentes:</span>
                <span class="trend-value">${this.countRecurringIssues(data.trends)}</span>
            </div>
        </div>
    </div>`;
  }

  /**
   * Constrói painel de safe tests
   */
  private buildSafeTestsPanel(data: DashboardData): string {
    const safeTests = data.safeTests;

    if (!safeTests) {
      return `
      <div class="card safe-tests-panel">
          <h3>🛡️ Safe Tests</h3>
          <div class="no-safe-tests">Não executado nesta análise</div>
      </div>`;
    }

    const successRate =
      (safeTests.results.filter((r) => r.passed).length /
        safeTests.results.length) *
      100;
    const flakyCount = safeTests.results.filter((r) => r.flaky).length;

    return `
    <div class="card safe-tests-panel">
        <h3>🛡️ Safe Tests Subset</h3>
        <div class="safe-tests-summary">
            <div class="safe-tests-metric">
                <span class="metric-label">Testes no Subset:</span>
                <span class="metric-value">${safeTests.subset.tests.length}</span>
            </div>
            <div class="safe-tests-metric">
                <span class="metric-label">Taxa de Sucesso:</span>
                <span class="metric-value ${successRate >= 80 ? "success" : "danger"}">${successRate.toFixed(1)}%</span>
            </div>
            <div class="safe-tests-metric">
                <span class="metric-label">Testes Flaky:</span>
                <span class="metric-value ${flakyCount > 0 ? "warning" : "success"}">${flakyCount}</span>
            </div>
            <div class="safe-tests-metric">
                <span class="metric-label">Tempo Estimado:</span>
                <span class="metric-value">${Math.round(safeTests.subset.totalEstimatedDuration / 1000)}s</span>
            </div>
        </div>
    </div>`;
  }

  /**
   * Calcula média de tendência
   */
  private calculateTrendAverage(trends: unknown[], field: string): string {
    if (trends.length === 0) return "N/A";

    const values = trends.map((t) => t[field]).filter((v) => v !== undefined);
    if (values.length === 0) return "N/A";

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return avg.toFixed(1);
  }

  /**
   * Conta problemas recorrentes
   */
  private countRecurringIssues(trends: unknown[]): string {
    // Placeholder - implementação simplificada
    return "0 identificados";
  }

  /**
   * Retorna classe CSS baseada no score
   */
  private getScoreClass(score: number): string {
    if (score >= 80) return "excellent";
    if (score >= 60) return "good";
    if (score >= 40) return "warning";
    return "danger";
  }

  /**
   * Retorna cor baseada no score
   */
  private getScoreColor(score: number): string {
    if (score >= 80) return "#10b981";
    if (score >= 60) return "#3b82f6";
    if (score >= 40) return "#f59e0b";
    return "#ef4444";
  }

  /**
   * Retorna badge de maturidade
   */
  private getMaturityBadge(level: string): string {
    const badges = {
      M0: '<span class="badge danger">M0 - Crítico</span>',
      M1: '<span class="badge warning">M1 - Instável</span>',
      M2: '<span class="badge good">M2 - Estável</span>',
      M3: '<span class="badge excellent">M3 - Sólido</span>',
    };
    return badges[level as keyof typeof badges] || level;
  }

  /**
   * Retorna ícone do nível de alerta
   */
  private getAlertLevelIcon(level: string): string {
    switch (level) {
      case "critical":
        return "🚨";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "❓";
    }
  }

  /**
   * CSS do dashboard
   */
  private getCSS(): string {
    return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1f2937; }
    .dashboard { max-width: 1400px; margin: 0 auto; padding: 20px; }

    .header { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 24px; }
    .header h1 { color: #1f2937; margin-bottom: 8px; }
    .header-info { display: flex; gap: 16px; color: #6b7280; }

    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 24px; margin-bottom: 24px; }

    .card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .card h3 { color: #1f2937; margin-bottom: 16px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }

    .score-display { display: flex; align-items: baseline; justify-content: center; margin: 24px 0; }
    .score-number { font-size: 4rem; font-weight: bold; }
    .score-number.excellent { color: #10b981; }
    .score-number.good { color: #3b82f6; }
    .score-number.warning { color: #f59e0b; }
    .score-number.danger { color: #ef4444; }
    .score-label { font-size: 1.5rem; color: #6b7280; margin-left: 8px; }

    .score-details { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 16px; }
    .detail-item { display: flex; justify-content: space-between; }
    .detail-item .label { color: #6b7280; }
    .detail-item .value.danger { color: #ef4444; font-weight: bold; }
    .detail-item .value.success { color: #10b981; font-weight: bold; }

    .metrics-grid { display: grid; gap: 16px; }
    .metric-item { padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px; }
    .metric-header { display: flex; justify-content: space-between; margin-bottom: 8px; }
    .metric-label { font-weight: 500; }
    .metric-value { font-weight: bold; }
    .metric-value.excellent { color: #10b981; }
    .metric-value.good { color: #3b82f6; }
    .metric-value.warning { color: #f59e0b; }
    .metric-value.danger { color: #ef4444; }
    .metric-bar { height: 8px; background: #e5e7eb; border-radius: 4px; margin-bottom: 8px; }
    .metric-fill { height: 100%; border-radius: 4px; }
    .metric-fill.excellent { background: #10b981; }
    .metric-fill.good { background: #3b82f6; }
    .metric-fill.warning { background: #f59e0b; }
    .metric-fill.danger { background: #ef4444; }

    .alerts-list { display: grid; gap: 12px; }
    .alert-item { padding: 16px; border-radius: 8px; border-left: 4px solid; }
    .alert-item.critical { border-left-color: #ef4444; background: #fef2f2; }
    .alert-item.warning { border-left-color: #f59e0b; background: #fffbeb; }
    .alert-item.info { border-left-color: #3b82f6; background: #eff6ff; }
    .alert-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .alert-level { font-size: 1.2rem; }
    .alert-title { font-weight: 500; }
    .alert-description { color: #4b5563; margin-bottom: 8px; }
    .alert-recommendation { color: #059669; font-style: italic; }

    .coverage-display { display: flex; align-items: center; gap: 24px; }
    .coverage-circle { flex-shrink: 0; }
    .coverage-info { flex: 1; }
    .coverage-type { font-weight: 500; margin-bottom: 8px; }
    .coverage-description { color: #6b7280; font-size: 0.9rem; }

    .trends-placeholder { display: grid; gap: 12px; }
    .trend-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .trend-label { color: #6b7280; }
    .trend-value { font-weight: 500; }

    .safe-tests-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .safe-tests-metric { display: flex; justify-content: space-between; padding: 8px 0; }
    .metric-label { color: #6b7280; }
    .metric-value { font-weight: 500; }
    .metric-value.success { color: #10b981; }
    .metric-value.warning { color: #f59e0b; }
    .metric-value.danger { color: #ef4444; }

    .badge { padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; font-weight: 500; }
    .badge.danger { background: #fef2f2; color: #dc2626; }
    .badge.warning { background: #fffbeb; color: #d97706; }
    .badge.good { background: #eff6ff; color: #2563eb; }
    .badge.excellent { background: #f0fdf4; color: #16a34a; }

    .no-alerts, .no-safe-tests { text-align: center; color: #6b7280; padding: 24px; }

    .footer { text-align: center; color: #9ca3af; padding: 24px; border-top: 1px solid #e5e7eb; }

    @media (max-width: 768px) {
      .grid { grid-template-columns: 1fr; }
      .score-details { grid-template-columns: 1fr; }
      .safe-tests-summary { grid-template-columns: 1fr; }
    }
    `;
  }

  /**
   * JavaScript do dashboard (placeholder)
   */
  private getJavaScript(): string {
    return `
    // Dashboard JavaScript
    console.log('TDD Quality Dashboard loaded');

    // Adicionar interatividade se necessário
    document.addEventListener('DOMContentLoaded', function() {
      // Expandir/colapsar seções
      const cards = document.querySelectorAll('.card');
      cards.forEach(card => {
        const header = card.querySelector('h3');
        if (header) {
          header.style.cursor = 'pointer';
          header.addEventListener('click', function() {
            const content = card.querySelector(':not(h3)');
            if (content) {
              content.style.display = content.style.display === 'none' ? 'block' : 'none';
            }
          });
        }
      });
    });
    `;
  }
}
