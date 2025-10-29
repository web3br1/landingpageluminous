/**
 * TDD Trends & History - Detecta padrões e arquivos reincidentes
 *
 * Mantém histórico de execuções e identifica:
 * - Arquivos com problemas recorrentes
 * - Tendências de maturidade
 * - Padrões de falha por categoria
 */

import fs from 'fs'
import path from 'path'
import type { TDDHistoryEntry, TDDResults } from '../types.js'

export class TDDTrends {
  private historyFile: string
  private maxEntries = 200 // Mantém últimas 200 execuções

  constructor(historyFile = path.join(process.cwd(), 'tmp', 'tdd-reports', 'tdd-history.json')) {
    this.historyFile = historyFile
    this.ensureHistoryFile()
  }

  private ensureHistoryFile() {
    const dir = path.dirname(this.historyFile)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    if (!fs.existsSync(this.historyFile)) {
      fs.writeFileSync(this.historyFile, JSON.stringify([], null, 2))
    }
  }

  /**
   * Adiciona nova entrada ao histórico
   */
  addEntry(results: TDDResults, branch: string, commit?: string, cacheInfo?: any): void {
    try {
      const history = this.loadHistory()

      const entry: TDDHistoryEntry = {
        timestamp: new Date().toISOString(),
        branch,
        commit,
        maturity: results.maturity.level,
        scores: results.scores,
        topFindings: this.extractTopFindings(results),
        riskyFiles: this.calculateRiskyFiles(),
        cache: cacheInfo || { used: false, domains: {}, key: '' }
      }

      history.push(entry)

      // Mantém apenas as últimas entradas
      if (history.length > this.maxEntries) {
        history.splice(0, history.length - this.maxEntries)
      }

      fs.writeFileSync(this.historyFile, JSON.stringify(history, null, 2))
    } catch (error) {
      console.warn('Error saving to history:', error instanceof Error ? error.message : String(error))
    }
  }

  /**
   * Carrega histórico do disco
   */
  private loadHistory(): TDDHistoryEntry[] {
    try {
      const content = fs.readFileSync(this.historyFile, 'utf8')
      return JSON.parse(content)
    } catch (error) {
      console.warn('Error loading history:', error instanceof Error ? error.message : String(error))
      return []
    }
  }

  /**
   * Extrai top findings da execução atual
   */
  private extractTopFindings(results: TDDResults): Array<{file: string, severity: 'RED' | 'YELLOW' | 'GREEN', code: string}> {
    const findings: Array<{file: string, severity: 'RED' | 'YELLOW' | 'GREEN', code: string}> = []

    // Extrai dos problemas críticos
    if (results.classifier?.redTests) {
      results.classifier.redTests.slice(0, 5).forEach(test => {
        findings.push({
          file: test.category,
          severity: 'RED',
          code: `TDD-RED-${findings.length + 1}`
        })
      })
    }

    // Extrai dos avisos
    if (results.classifier?.yellowTests) {
      results.classifier.yellowTests.slice(0, 3).forEach(test => {
        findings.push({
          file: test.category,
          severity: 'YELLOW',
          code: `TDD-YEL-${findings.length + 1}`
        })
      })
    }

    return findings
  }

  /**
   * Calcula arquivos de risco baseado no histórico
   */
  calculateRiskyFiles(): Array<{file: string, incidentsLast10: number}> {
    const history = this.loadHistory()
    const recentEntries = history.slice(-10) // Últimas 10 execuções

    const fileIncidents: Record<string, number> = {}

    recentEntries.forEach(entry => {
      entry.topFindings.forEach(finding => {
        if (finding.severity === 'RED' || finding.severity === 'YELLOW') {
          fileIncidents[finding.file] = (fileIncidents[finding.file] || 0) + 1
        }
      })
    })

    // Converte para array e ordena por incidentes
    return Object.entries(fileIncidents)
      .map(([file, incidents]) => ({ file, incidentsLast10: incidents }))
      .filter(item => item.incidentsLast10 >= 3) // Pelo menos 3 incidentes
      .sort((a, b) => b.incidentsLast10 - a.incidentsLast10)
      .slice(0, 10) // Top 10
  }

  /**
   * Gera relatório de tendências
   */
  generateTrendsReport(days = 30): any {
    const history = this.loadHistory()
    const cutoffDate = new Date(Date.now() - (days * 24 * 60 * 60 * 1000))

    const recentEntries = history.filter(entry =>
      new Date(entry.timestamp) >= cutoffDate
    )

    if (recentEntries.length === 0) {
      return {
        period: `${days} days`,
        totalRuns: 0,
        message: 'Sem dados suficientes para análise de tendências'
      }
    }

    // Análise de maturidade ao longo do tempo
    const maturityProgression = recentEntries.map(entry => ({
      date: entry.timestamp.split('T')[0],
      maturity: entry.maturity,
      score: entry.scores.finalScore
    }))

    // Padrões de falha mais comuns
    const failurePatterns: Record<string, number> = {}
    recentEntries.forEach(entry => {
      entry.topFindings.forEach(finding => {
        if (finding.severity === 'RED') {
          failurePatterns[finding.file] = (failurePatterns[finding.file] || 0) + 1
        }
      })
    })

    const topFailurePatterns = Object.entries(failurePatterns)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)

    // Estatísticas gerais
    const avgScore = recentEntries.reduce((sum, entry) => sum + entry.scores.finalScore, 0) / recentEntries.length
    const maturityDistribution = recentEntries.reduce((dist, entry) => {
      dist[entry.maturity] = (dist[entry.maturity] || 0) + 1
      return dist
    }, {} as Record<string, number>)

    return {
      period: `${days} days`,
      totalRuns: recentEntries.length,
      averageScore: Math.round(avgScore * 10) / 10,
      maturityDistribution,
      maturityProgression: maturityProgression.slice(-10), // Últimas 10
      topFailurePatterns,
      riskyFiles: this.calculateRiskyFiles(),
      trends: {
        scoreTrend: this.calculateTrend(recentEntries.map(e => e.scores.finalScore)),
        maturityTrend: this.calculateMaturityTrend(recentEntries.map(e => e.maturity))
      }
    }
  }

  /**
   * Calcula tendência de scores (melhorando/estagnando/piorando)
   */
  private calculateTrend(values: number[]): 'improving' | 'stable' | 'declining' {
    if (values.length < 3) return 'stable'

    const recent = values.slice(-3)
    const avgRecent = recent.reduce((a, b) => a + b) / recent.length
    const avgOlder = values.slice(0, -3).reduce((a, b) => a + b) / Math.max(1, values.length - 3)

    const diff = avgRecent - avgOlder
    if (diff > 5) return 'improving'
    if (diff < -5) return 'declining'
    return 'stable'
  }

  /**
   * Calcula tendência de maturidade
   */
  private calculateMaturityTrend(maturities: string[]): 'improving' | 'stable' | 'declining' {
    if (maturities.length < 3) return 'stable'

    const levels = { M0: 0, M1: 1, M2: 2, M3: 3 }
    const recent = maturities.slice(-3).map(m => levels[m as keyof typeof levels] || 0)
    const older = maturities.slice(0, -3).map(m => levels[m as keyof typeof levels] || 0)

    const avgRecent = recent.reduce((a, b) => a + b) / recent.length
    const avgOlder = older.length > 0 ? older.reduce((a, b) => a + b) / older.length : avgRecent

    if (avgRecent > avgOlder + 0.5) return 'improving'
    if (avgRecent < avgOlder - 0.5) return 'declining'
    return 'stable'
  }

  /**
   * Limpa histórico antigo
   */
  cleanup(daysToKeep = 90): void {
    try {
      const history = this.loadHistory()
      const cutoffDate = new Date(Date.now() - (daysToKeep * 24 * 60 * 60 * 1000))

      const filtered = history.filter(entry =>
        new Date(entry.timestamp) >= cutoffDate
      )

      fs.writeFileSync(this.historyFile, JSON.stringify(filtered, null, 2))
      console.log(`Histórico limpo: ${history.length - filtered.length} entradas removidas`)
    } catch (error) {
      console.warn('Error cleaning history:', error instanceof Error ? error.message : String(error))
    }
  }

  /**
   * Estatísticas do histórico
   */
  getStats(): any {
    const history = this.loadHistory()

    if (history.length === 0) {
      return { totalEntries: 0, message: 'Nenhum histórico disponível' }
    }

    const latest = history[history.length - 1]
    const oldest = history[0]

    const maturityCount = history.reduce((count, entry) => {
      count[entry.maturity] = (count[entry.maturity] || 0) + 1
      return count
    }, {} as Record<string, number>)

    const avgScore = history.reduce((sum, entry) => sum + entry.scores.finalScore, 0) / history.length

    return {
      totalEntries: history.length,
      dateRange: {
        from: oldest.timestamp.split('T')[0],
        to: latest.timestamp.split('T')[0]
      },
      maturityDistribution: maturityCount,
      averageScore: Math.round(avgScore * 10) / 10,
      riskyFiles: this.calculateRiskyFiles(),
      latestRun: {
        maturity: latest.maturity,
        score: latest.scores.finalScore,
        timestamp: latest.timestamp
      }
    }
  }
}
