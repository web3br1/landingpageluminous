/**
 * A/B Testing - Validação Experimental das Métricas TDD
 *
 * Sistema para testar hipóteses sobre métricas, pesos e recomendações
 * do TDD Quality System através de experimentos controlados.
 */

import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import type { TDDResults, MaturityLevel } from '../types.js'

export interface Experiment {
  id: string
  name: string
  hypothesis: string
  variants: ExperimentVariant[]
  targetMetric: string
  minSampleSize: number
  status: 'active' | 'completed' | 'paused'
  createdAt: string
  completedAt?: string
  results?: ExperimentResults
}

export interface ExperimentVariant {
  id: string
  name: string
  description: string
  config: ExperimentConfig
  sampleSize: number
  conversions: number
  metrics: {
    avgScore: number
    avgExecutionTime: number
    successRate: number
    criticalIssues: number
  }
}

export interface ExperimentConfig {
  // Configurações que podem ser testadas
  maturityWeights?: Record<string, number>
  scoreThresholds?: Record<string, number>
  cacheSettings?: {
    ttl: number
    maxEntries: number
  }
  safeTestCriteria?: {
    minSafetyScore: number
    maxDuration: number
  }
  alertSensitivity?: 'low' | 'medium' | 'high'
}

export interface ExperimentResults {
  winner: string
  confidence: number
  statisticalSignificance: boolean
  effectSize: number
  recommendations: string[]
  insights: string[]
}

export class ABTestingManager {
  private experimentsDir: string
  private activeExperiments: Experiment[] = []

  constructor(experimentsDir = path.join(process.cwd(), 'tmp', 'tdd-experiments')) {
    this.experimentsDir = experimentsDir
    this.ensureDirectories()
    this.loadActiveExperiments()
  }

  private ensureDirectories() {
    if (!fs.existsSync(this.experimentsDir)) {
      fs.mkdirSync(this.experimentsDir, { recursive: true })
    }
  }

  private loadActiveExperiments() {
    try {
      const files = fs.readdirSync(this.experimentsDir)
        .filter(f => f.endsWith('.json'))
        .map(f => path.join(this.experimentsDir, f))

      this.activeExperiments = files.map(file => {
        const content = fs.readFileSync(file, 'utf8')
        return JSON.parse(content)
      }).filter(exp => exp.status === 'active')
    } catch (error) {
      console.warn('Error loading experiments:', error instanceof Error ? error.message : String(error))
      this.activeExperiments = []
    }
  }

  /**
   * Cria um novo experimento
   */
  createExperiment(experiment: Omit<Experiment, 'id' | 'createdAt' | 'status'>): Experiment {
    const newExperiment: Experiment = {
      ...experiment,
      id: this.generateExperimentId(),
      status: 'active',
      createdAt: new Date().toISOString()
    }

    this.activeExperiments.push(newExperiment)
    this.saveExperiment(newExperiment)

    console.log(`🧪 Experimento criado: ${newExperiment.name}`)
    return newExperiment
  }

  /**
   * Processa resultado para experimentos ativos
   */
  processResult(results: TDDResults, userId?: string): void {
    const userIdentifier = userId || this.getAnonymousUserId()

    this.activeExperiments.forEach(experiment => {
      const variant = this.assignVariant(experiment, userIdentifier)
      this.recordObservation(experiment, variant, results)
      this.checkCompletion(experiment)
    })
  }

  /**
   * Atribui variante baseado no user ID (determinístico)
   */
  private assignVariant(experiment: Experiment, userId: string): ExperimentVariant {
    const hash = crypto.createHash('md5').update(userId + experiment.id).digest('hex')
    const index = parseInt(hash.substring(0, 8), 16) % experiment.variants.length
    return experiment.variants[index]
  }

  /**
   * Registra observação para uma variante
   */
  private recordObservation(experiment: Experiment, variant: ExperimentVariant, results: TDDResults): void {
    variant.sampleSize++

    // Métricas simples para exemplo
    const score = results.scores.finalScore
    // const executionTime = results.executionTime || 0
    const criticalCount = results.classifier.redTests?.length || 0

    // Atualizar médias
    const oldAvgScore = variant.metrics.avgScore
    const oldAvgTime = variant.metrics.avgExecutionTime
    // const executionTime = 0 // TODO: Add to TDDResults type

    variant.metrics.avgScore = (oldAvgScore * (variant.sampleSize - 1) + score) / variant.sampleSize
    // variant.metrics.avgExecutionTime = (oldAvgTime * (variant.sampleSize - 1) + executionTime) / variant.sampleSize
    variant.metrics.criticalIssues = (variant.metrics.criticalIssues * (variant.sampleSize - 1) + criticalCount) / variant.sampleSize

    // Conversão: score >= 70 é considerado sucesso
    if (score >= 70) {
      variant.conversions++
    }

    variant.metrics.successRate = (variant.conversions / variant.sampleSize) * 100

    this.saveExperiment(experiment)
  }

  /**
   * Verifica se experimento atingiu tamanho mínimo de amostra
   */
  private checkCompletion(experiment: Experiment): void {
    const allVariantsReady = experiment.variants.every(v => v.sampleSize >= experiment.minSampleSize)

    if (allVariantsReady && experiment.status === 'active') {
      experiment.status = 'completed'
      experiment.completedAt = new Date().toISOString()
      experiment.results = this.calculateResults(experiment)
      this.saveExperiment(experiment)

      console.log(`✅ Experimento concluído: ${experiment.name}`)
      console.log(`🏆 Vencedor: ${experiment.results?.winner}`)
    }
  }

  /**
   * Calcula resultados estatísticos do experimento
   */
  private calculateResults(experiment: Experiment): ExperimentResults {
    const variants = experiment.variants.sort((a, b) => b.metrics.successRate - a.metrics.successRate)
    const winner = variants[0]

    // Cálculo simplificado de significância estatística
    const otherVariants = variants.slice(1)
    const avgOtherSuccess = otherVariants.reduce((sum, v) => sum + v.metrics.successRate, 0) / otherVariants.length
    const effectSize = winner.metrics.successRate - avgOtherSuccess

    // Significância: diferença > 5% com amostra > 30
    const statisticalSignificance = effectSize > 5 && winner.sampleSize > 30

    const confidence = Math.min(95, (winner.sampleSize / 100) * 95)

    return {
      winner: winner.name,
      confidence,
      statisticalSignificance,
      effectSize,
      recommendations: this.generateRecommendations(experiment, winner),
      insights: this.generateInsights(experiment, variants)
    }
  }

  /**
   * Gera recomendações baseadas nos resultados
   */
  private generateRecommendations(experiment: Experiment, winner: ExperimentVariant): string[] {
    const recommendations: string[] = []

    switch (experiment.targetMetric) {
      case 'score':
        recommendations.push(`Adotar configuração da variante '${winner.name}' para melhorar scores em ${winner.metrics.avgScore.toFixed(1)} pontos`)
        break

      case 'execution_time':
        recommendations.push(`Configuração '${winner.name}' reduz tempo de análise em ${winner.metrics.avgExecutionTime.toFixed(0)}ms`)
        break

      case 'critical_issues':
        recommendations.push(`Variante '${winner.name}' reduz problemas críticos em ${winner.metrics.criticalIssues.toFixed(1)}`)
        break
    }

    if (winner.config.maturityWeights) {
      recommendations.push('Ajustar pesos de maturidade conforme variante vencedora')
    }

    return recommendations
  }

  /**
   * Gera insights sobre o experimento
   */
  private generateInsights(experiment: Experiment, variants: ExperimentVariant[]): string[] {
    const insights: string[] = []

    // Comparar variantes
    const best = variants[0]
    const worst = variants[variants.length - 1]
    const diff = best.metrics.successRate - worst.metrics.successRate

    insights.push(`Melhor variante teve ${diff.toFixed(1)}% mais sucesso que a pior`)

    // Análise de maturidade se aplicável
    const maturityVariant = variants.find(v => v.config.maturityWeights)
    if (maturityVariant && maturityVariant.id === best.id) {
      insights.push('Pesos de maturidade influenciaram significativamente o resultado')
    }

    // Análise de cache se aplicável
    const cacheVariant = variants.find(v => v.config.cacheSettings)
    if (cacheVariant && cacheVariant.metrics.avgExecutionTime < best.metrics.avgExecutionTime * 0.9) {
      insights.push('Configurações de cache impactaram performance significativamente')
    }

    return insights
  }

  /**
   * Experimentos pré-configurados
   */
  static createDefaultExperiments(): Experiment[] {
    return [
      {
        id: '',
        name: 'Maturity Weights Optimization',
        hypothesis: 'Ajustar pesos de maturidade melhora precisão dos scores',
        targetMetric: 'score',
        minSampleSize: 50,
        status: 'active',
        createdAt: '',
        variants: [
          {
            id: 'control',
            name: 'Pesos Atuais',
            description: 'Configuração padrão do sistema',
            config: {},
            sampleSize: 0,
            conversions: 0,
            metrics: { avgScore: 0, avgExecutionTime: 0, successRate: 0, criticalIssues: 0 }
          },
          {
            id: 'aggressive-coverage',
            name: 'Cobertura Prioritária',
            description: 'Aumenta peso da cobertura em M2/M3',
            config: {
              maturityWeights: { coverage: 0.20, isolation: 0.15, performance: 0.12 }
            },
            sampleSize: 0,
            conversions: 0,
            metrics: { avgScore: 0, avgExecutionTime: 0, successRate: 0, criticalIssues: 0 }
          },
          {
            id: 'stability-focus',
            name: 'Estabilidade em Primeiro Lugar',
            description: 'Prioriza isolamento e estrutura sobre cobertura',
            config: {
              maturityWeights: { isolation: 0.25, structure: 0.20, coverage: 0.08 }
            },
            sampleSize: 0,
            conversions: 0,
            metrics: { avgScore: 0, avgExecutionTime: 0, successRate: 0, criticalIssues: 0 }
          }
        ]
      },

      {
        id: '',
        name: 'Cache TTL Optimization',
        hypothesis: 'TTL mais agressivo melhora performance sem perder precisão',
        targetMetric: 'execution_time',
        minSampleSize: 30,
        status: 'active',
        createdAt: '',
        variants: [
          {
            id: 'ttl-60min',
            name: 'TTL 60min',
            description: 'Cache válido por 60 minutos',
            config: {
              cacheSettings: { ttl: 60 * 60 * 1000, maxEntries: 10 }
            },
            sampleSize: 0,
            conversions: 0,
            metrics: { avgScore: 0, avgExecutionTime: 0, successRate: 0, criticalIssues: 0 }
          },
          {
            id: 'ttl-30min',
            name: 'TTL 30min',
            description: 'Cache válido por 30 minutos',
            config: {
              cacheSettings: { ttl: 30 * 60 * 1000, maxEntries: 10 }
            },
            sampleSize: 0,
            conversions: 0,
            metrics: { avgScore: 0, avgExecutionTime: 0, successRate: 0, criticalIssues: 0 }
          },
          {
            id: 'ttl-15min',
            name: 'TTL 15min',
            description: 'Cache válido por 15 minutos',
            config: {
              cacheSettings: { ttl: 15 * 60 * 1000, maxEntries: 10 }
            },
            sampleSize: 0,
            conversions: 0,
            metrics: { avgScore: 0, avgExecutionTime: 0, successRate: 0, criticalIssues: 0 }
          }
        ]
      }
    ]
  }

  /**
   * Lista experimentos ativos
   */
  getActiveExperiments(): Experiment[] {
    return this.activeExperiments
  }

  /**
   * Obtém resultados de experimento concluído
   */
  getExperimentResults(experimentId: string): ExperimentResults | null {
    const experiment = this.activeExperiments.find(e => e.id === experimentId)
    return experiment?.results || null
  }

  /**
   * Pausa experimento
   */
  pauseExperiment(experimentId: string): boolean {
    const experiment = this.activeExperiments.find(e => e.id === experimentId)
    if (experiment) {
      experiment.status = 'paused'
      this.saveExperiment(experiment)
      return true
    }
    return false
  }

  /**
   * Retoma experimento pausado
   */
  resumeExperiment(experimentId: string): boolean {
    const experiment = this.activeExperiments.find(e => e.id === experimentId)
    if (experiment && experiment.status === 'paused') {
      experiment.status = 'active'
      this.saveExperiment(experiment)
      return true
    }
    return false
  }

  /**
   * Gera relatório de experimentos
   */
  generateExperimentsReport(): any {
    const active = this.activeExperiments.filter(e => e.status === 'active')
    const completed = this.activeExperiments.filter(e => e.status === 'completed')

    return {
      summary: {
        totalActive: active.length,
        totalCompleted: completed.length,
        experiments: this.activeExperiments.length
      },
      activeExperiments: active.map(exp => ({
        id: exp.id,
        name: exp.name,
        progress: exp.variants.map(v => ({
          name: v.name,
          sampleSize: v.sampleSize,
          targetSize: exp.minSampleSize,
          progress: (v.sampleSize / exp.minSampleSize) * 100
        }))
      })),
      completedExperiments: completed.map(exp => ({
        id: exp.id,
        name: exp.name,
        winner: exp.results?.winner,
        confidence: exp.results?.confidence,
        insights: exp.results?.insights
      }))
    }
  }

  /**
   * Gera ID único para experimento
   */
  private generateExperimentId(): string {
    return `exp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Gera ID anônimo para usuário (baseado em contexto)
   */
  private getAnonymousUserId(): string {
    const context = [
      process.cwd(),
      process.env.USER || process.env.USERNAME || 'anonymous',
      process.env.GITHUB_SHA || process.env.COMMIT_SHA || Date.now().toString()
    ].join('|')

    return crypto.createHash('md5').update(context).digest('hex')
  }

  /**
   * Salva experimento em arquivo
   */
  private saveExperiment(experiment: Experiment): void {
    const filePath = path.join(this.experimentsDir, `${experiment.id}.json`)
    fs.writeFileSync(filePath, JSON.stringify(experiment, null, 2))
  }
}
