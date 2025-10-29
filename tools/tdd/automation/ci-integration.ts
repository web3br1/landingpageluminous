/**
 * CI Integration - Automação para Pipelines de CI/CD
 *
 * Integra o TDD Quality System ao pipeline de desenvolvimento,
 * com gates automáticos, notificações e relatórios.
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import type { TDDResults, AlertSummary } from '../types.js'

export interface CIGate {
  name: string
  condition: (results: TDDResults) => boolean
  onPass: () => void
  onFail: (results: TDDResults) => void
  required: boolean
}

export interface CIConfig {
  environment: 'local' | 'ci'
  branch: string
  commit: string
  prNumber?: number
  gates: CIGate[]
  notifications: {
    slack?: { webhook: string; channel: string }
    github?: { token: string }
    email?: { recipients: string[] }
  }
  thresholds: {
    maxCriticalIssues: number
    minScoreForMerge: number
    maxAnalysisTime: number
  }
}

export class CIIntegration {
  private config: CIConfig
  private reportsDir: string

  constructor(config: CIConfig) {
    this.config = config
    this.reportsDir = path.join(process.cwd(), 'tmp', 'tdd-reports')
  }

  /**
   * Executa análise completa com gates de CI
   */
  async runCIAnalysis(): Promise<{
    results: TDDResults
    passed: boolean
    failedGates: string[]
    alerts: AlertSummary
  }> {
    console.log('🚀 Iniciando Análise CI TDD Quality...\n')

    try {
      // 1. Executar análise TDD
      const results = await this.runTDDAnalysis()

      // 2. Executar gates
      const { passed, failedGates } = this.runGates(results)

      // 3. Gerar alertas
      const alerts = await this.generateAlerts(results)

      // 4. Enviar notificações
      await this.sendNotifications(results, passed, failedGates, alerts)

      // 5. Salvar relatório de CI
      this.saveCIReport(results, passed, failedGates, alerts)

      console.log(`\n${passed ? '✅' : '❌'} CI Analysis ${passed ? 'PASSED' : 'FAILED'}`)
      if (!passed) {
        console.log(`Failed gates: ${failedGates.join(', ')}`)
      }

      return { results, passed, failedGates, alerts }

    } catch (error) {
      console.error('🚨 CI Analysis failed:', error.message)
      await this.sendFailureNotification(error)
      throw error
    }
  }

  /**
   * Executa análise TDD via orquestrador
   */
  private async runTDDAnalysis(): Promise<TDDResults> {
    try {
      // Import dinâmico para evitar dependências circulares
      const { TDDAnalysisEngine } = await import('../../scripts/tdd-orchestrator.mjs')

      const orchestrator = new TDDAnalysisEngine()
      return await orchestrator.runDualAnalysis()
    } catch (error) {
      // Fallback para script direto
      const output = execSync('node scripts/tdd-orchestrator.mjs', {
        encoding: 'utf8',
        timeout: 300000
      })

      // Parse do output (simplificado)
      throw new Error('TDDAnalysis fallback not implemented')
    }
  }

  /**
   * Executa todos os gates configurados
   */
  private runGates(results: TDDResults): { passed: boolean; failedGates: string[] } {
    const failedGates: string[] = []

    for (const gate of this.config.gates) {
      try {
        const passed = gate.condition(results)

        if (passed) {
          gate.onPass()
          console.log(`✅ Gate '${gate.name}' PASSED`)
        } else {
          failedGates.push(gate.name)
          gate.onFail(results)
          console.log(`❌ Gate '${gate.name}' FAILED`)

          if (gate.required) {
            console.log(`🚫 Gate '${gate.name}' é obrigatório - bloqueando merge`)
          }
        }
      } catch (error) {
        console.error(`🚨 Gate '${gate.name}' error:`, error.message)
        if (gate.required) {
          failedGates.push(gate.name)
        }
      }
    }

    const passed = failedGates.length === 0 ||
      !this.config.gates.some(g => g.required && failedGates.includes(g.name))

    return { passed, failedGates }
  }

  /**
   * Gates padrão para CI
   */
  static createDefaultGates(config: CIConfig): CIGate[] {
    return [
      {
        name: 'quality-gate',
        condition: (results) => {
          const criticalCount = results.classifier.redTests?.length || 0
          return criticalCount <= config.thresholds.maxCriticalIssues
        },
        onPass: () => console.log('🎯 Qualidade dentro dos limites'),
        onFail: (results) => {
          const criticalCount = results.classifier.redTests?.length || 0
          console.log(`🚫 Muitos problemas críticos: ${criticalCount}/${config.thresholds.maxCriticalIssues}`)
        },
        required: true
      },

      {
        name: 'score-gate',
        condition: (results) => results.scores.finalScore >= config.thresholds.minScoreForMerge,
        onPass: () => console.log('📊 Score satisfatório'),
        onFail: (results) => {
          console.log(`🚫 Score muito baixo: ${results.scores.finalScore}/${config.thresholds.minScoreForMerge}`)
        },
        required: true
      },

      {
        name: 'performance-gate',
        condition: (results) => (results.executionTime || 0) <= config.thresholds.maxAnalysisTime,
        onPass: () => console.log('⚡ Performance aceitável'),
        onFail: (results) => {
          const time = Math.round((results.executionTime || 0) / 1000)
          const maxTime = Math.round(config.thresholds.maxAnalysisTime / 1000)
          console.log(`🚫 Análise muito lenta: ${time}s/${maxTime}s`)
        },
        required: false
      },

      {
        name: 'maturity-gate',
        condition: (results) => {
          // Em PRs, permitir qualquer maturidade desde que não seja M0 com muitos críticos
          if (results.maturity.level === 'M0') {
            const criticalCount = results.classifier.redTests?.length || 0
            return criticalCount <= 2 // Permitir até 2 críticos em M0
          }
          return true
        },
        onPass: () => console.log('📈 Maturidade aceitável'),
        onFail: (results) => {
          console.log(`🚫 Maturidade ${results.maturity.level} não adequada para merge`)
        },
        required: false
      }
    ]
  }

  /**
   * Gera alertas para CI
   */
  private async generateAlerts(results: TDDResults): Promise<AlertSummary> {
    // Placeholder - seria integrado com AlertsManager
    return {
      total: 0,
      byLevel: { info: 0, warning: 0, critical: 0 },
      byCategory: {},
      critical: [],
      warnings: [],
      recommendations: []
    }
  }

  /**
   * Envia notificações
   */
  private async sendNotifications(
    results: TDDResults,
    passed: boolean,
    failedGates: string[],
    alerts: AlertSummary
  ): Promise<void> {
    const notifications = []

    // Notificação de falha em gates obrigatórios
    if (!passed) {
      notifications.push({
        type: 'failure',
        title: '🚫 CI TDD Quality Failed',
        message: `Gates falharam: ${failedGates.join(', ')}`,
        details: {
          score: results.scores.finalScore,
          maturity: results.maturity.level,
          criticalIssues: results.classifier.redTests?.length || 0
        }
      })
    }

    // Notificação de alertas críticos
    if (alerts.critical.length > 0) {
      notifications.push({
        type: 'alert',
        title: '🚨 TDD Quality Alerts',
        message: `${alerts.critical.length} alertas críticos detectados`,
        details: alerts.critical.slice(0, 3)
      })
    }

    // Enviar notificações
    for (const notification of notifications) {
      await this.sendSlackNotification(notification)
      await this.sendGitHubNotification(notification)
    }
  }

  /**
   * Envia notificação para Slack
   */
  private async sendSlackNotification(notification: any): Promise<void> {
    if (!this.config.notifications.slack) return

    try {
      const payload = {
        channel: this.config.notifications.slack.channel,
        text: notification.title,
        attachments: [{
          color: notification.type === 'failure' ? 'danger' : 'warning',
          fields: [
            { title: 'Branch', value: this.config.branch, short: true },
            { title: 'Commit', value: this.config.commit.substring(0, 7), short: true },
            { title: 'Message', value: notification.message },
            ...(notification.details ? Object.entries(notification.details).map(([k, v]) => ({
              title: k, value: String(v), short: true
            })) : [])
          ]
        }]
      }

      // Simulação - em produção faria HTTP request
      console.log('📢 Slack notification:', JSON.stringify(payload, null, 2))
    } catch (error) {
      console.warn('Slack notification failed:', error.message)
    }
  }

  /**
   * Envia notificação para GitHub (PR comment)
   */
  private async sendGitHubNotification(notification: any): Promise<void> {
    if (!this.config.notifications.github || !this.config.prNumber) return

    try {
      const comment = this.generateGitHubComment(notification)

      // Simulação - em produção usaria GitHub API
      console.log('🐙 GitHub PR comment:', comment)
    } catch (error) {
      console.warn('GitHub notification failed:', error.message)
    }
  }

  /**
   * Gera comentário para GitHub PR
   */
  private generateGitHubComment(notification: any): string {
    let comment = `## ${notification.title}\n\n`
    comment += `${notification.message}\n\n`

    if (notification.details) {
      comment += '### Detalhes\n'
      for (const [key, value] of Object.entries(notification.details)) {
        comment += `- **${key}**: ${value}\n`
      }
      comment += '\n'
    }

    comment += '### Ações Recomendadas\n'
    comment += '- Verificar relatório completo em `tmp/tdd-reports/`\n'
    comment += '- Executar `npm run tdd:analyze` localmente\n'
    comment += '- Revisar problemas críticos antes do merge\n'

    return comment
  }

  /**
   * Envia notificação de falha geral
   */
  private async sendFailureNotification(error: Error): Promise<void> {
    const notification = {
      type: 'failure',
      title: '🚨 CI TDD Quality System Failed',
      message: `Erro crítico: ${error.message}`,
      details: {
        error: error.message,
        environment: this.config.environment,
        branch: this.config.branch
      }
    }

    await this.sendSlackNotification(notification)
  }

  /**
   * Salva relatório específico para CI
   */
  private saveCIReport(
    results: TDDResults,
    passed: boolean,
    failedGates: string[],
    alerts: AlertSummary
  ): void {
    const ciReport = {
      metadata: {
        timestamp: new Date().toISOString(),
        environment: this.config.environment,
        branch: this.config.branch,
        commit: this.config.commit,
        prNumber: this.config.prNumber
      },
      results: {
        passed,
        score: results.scores.finalScore,
        maturity: results.maturity.level,
        executionTime: results.executionTime,
        criticalIssues: results.classifier.redTests?.length || 0
      },
      gates: {
        failed: failedGates,
        requiredFailed: failedGates.filter(gate =>
          this.config.gates.find(g => g.name === gate)?.required
        )
      },
      alerts: {
        total: alerts.total,
        critical: alerts.critical.length,
        warnings: alerts.warnings.length
      },
      recommendations: alerts.recommendations
    }

    const reportPath = path.join(this.reportsDir, `ci-report-${Date.now()}.json`)
    fs.writeFileSync(reportPath, JSON.stringify(ciReport, null, 2))

    console.log(`📄 CI Report salvo: ${reportPath}`)
  }

  /**
   * Cria configuração padrão para CI
   */
  static createDefaultConfig(): CIConfig {
    return {
      environment: process.env.CI === 'true' ? 'ci' : 'local',
      branch: process.env.GITHUB_HEAD_REF || process.env.BRANCH_NAME || 'unknown',
      commit: process.env.GITHUB_SHA || process.env.COMMIT_SHA || 'unknown',
      prNumber: process.env.GITHUB_PR_NUMBER ? parseInt(process.env.GITHUB_PR_NUMBER) : undefined,
      gates: this.createDefaultGates({
        environment: 'ci',
        branch: 'main',
        commit: 'unknown',
        gates: [],
        notifications: {},
        thresholds: {
          maxCriticalIssues: 3,
          minScoreForMerge: 60,
          maxAnalysisTime: 120000 // 2min
        }
      }),
      notifications: {
        // Configurar webhooks e tokens via variáveis de ambiente
        slack: process.env.SLACK_WEBHOOK ? {
          webhook: process.env.SLACK_WEBHOOK,
          channel: process.env.SLACK_CHANNEL || '#dev-notifications'
        } : undefined,
        github: process.env.GITHUB_TOKEN ? {
          token: process.env.GITHUB_TOKEN
        } : undefined
      },
      thresholds: {
        maxCriticalIssues: 3,
        minScoreForMerge: 60,
        maxAnalysisTime: 120000
      }
    }
  }
}
