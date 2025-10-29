/**
 * Safe Tests Manager - Subset confiável de testes para execução
 *
 * Identifica testes que são:
 * - Rápidos (< 100ms)
 * - Estáveis (baixa taxa de falha)
 * - Isolados (não dependem de estado externo)
 * - Representativos (cobrem funcionalidades críticas)
 */

import fs from 'fs'
import path from 'path'
import { glob } from 'glob'
import type { SafeTestInfo, SafeTestResult, SafeTestSubset } from '../types.js'

export class SafeTestsManager {
  private projectRoot: string
  private safeTestsFile: string
  private executionHistoryFile: string

  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot
    this.safeTestsFile = path.join(process.cwd(), 'tmp', 'tdd-safe-tests.json')
    this.executionHistoryFile = path.join(process.cwd(), 'tmp', 'tdd-test-history.json')
    this.ensureDirectories()
  }

  private ensureDirectories() {
    const dir = path.dirname(this.safeTestsFile)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }

  /**
   * Descobre testes candidatos a "safe tests"
   */
  async discoverSafeTestCandidates(): Promise<SafeTestInfo[]> {
    const testFiles = await this.findTestFiles()
    const candidates: SafeTestInfo[] = []

    for (const testFile of testFiles) {
      const candidate = await this.analyzeTestFile(testFile)
      if (candidate) {
        candidates.push(candidate)
      }
    }

    return candidates.sort((a, b) => b.safetyScore - a.safetyScore)
  }

  /**
   * Encontra arquivos de teste
   */
  private async findTestFiles(): Promise<string[]> {
    const patterns = [
      'tests/**/*.test.ts',
      'tests/**/*.test.tsx',
      'tests/**/*.spec.ts',
      'tests/**/*.spec.tsx',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx'
    ]

    const allFiles: string[] = []

    for (const pattern of patterns) {
      try {
        const files = await glob(pattern, {
          cwd: this.projectRoot,
          absolute: false,
          ignore: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/coverage/**',
            '**/.next/**',
            '**/tmp/**'
          ]
        })
        allFiles.push(...files)
      } catch (error) {
        console.warn(`Glob error for ${pattern}:`, error.message)
      }
    }

    return [...new Set(allFiles)]
  }

  /**
   * Analisa um arquivo de teste para determinar se é "safe"
   */
  private async analyzeTestFile(testFile: string): Promise<SafeTestInfo | null> {
    try {
      const content = fs.readFileSync(path.join(this.projectRoot, testFile), 'utf8')
      const lines = content.split('\n')

      // Análise básica do arquivo
      const analysis = this.analyzeTestContent(content, lines)

      if (!analysis.isValidTestFile) {
        return null
      }

      // Calcula score de segurança
      const safetyScore = this.calculateSafetyScore(analysis)

      // Só inclui se score > 60
      if (safetyScore < 60) {
        return null
      }

      return {
        file: testFile,
        category: analysis.category,
        estimatedDuration: analysis.estimatedDuration,
        dependencies: analysis.dependencies,
        safetyScore,
        reasons: analysis.reasons,
        testCount: analysis.testCount,
        hasMocks: analysis.hasMocks,
        coversCriticalPath: analysis.coversCriticalPath
      }
    } catch (error) {
      console.warn(`Error analyzing ${testFile}:`, error.message)
      return null
    }
  }

  /**
   * Analisa conteúdo do arquivo de teste
   */
  private analyzeTestContent(content: string, lines: string[]): any {
    const analysis = {
      isValidTestFile: false,
      category: 'unknown' as 'unit' | 'integration' | 'component' | 'e2e' | 'unknown',
      estimatedDuration: 100, // ms
      dependencies: [] as string[],
      reasons: [] as string[],
      testCount: 0,
      hasMocks: false,
      coversCriticalPath: false
    }

    // Verifica se é arquivo de teste válido
    const hasTestKeywords = /describe|it|test|expect/.test(content)
    const hasImport = /import.*from/.test(content) || /require\(/.test(content)

    if (!hasTestKeywords) {
      return analysis
    }

    analysis.isValidTestFile = true

    // Conta testes
    const testMatches = content.match(/(describe|it|test)\s*\(/g)
    analysis.testCount = testMatches ? testMatches.length : 0

    // Detecta categoria
    if (content.includes('.spec.tsx') || content.includes('render(')) {
      analysis.category = 'component'
      analysis.estimatedDuration = 200
    } else if (content.includes('axios') || content.includes('fetch') || content.includes('api')) {
      analysis.category = 'integration'
      analysis.estimatedDuration = 500
    } else if (content.includes('describe(') && analysis.testCount > 5) {
      analysis.category = 'unit'
      analysis.estimatedDuration = 50
    }

    // Detecta mocks
    analysis.hasMocks = /vi\.mock|jest\.mock|mock\(/.test(content)

    // Detecta dependências externas
    const externalDeps = []
    if (content.includes('localStorage') || content.includes('sessionStorage')) {
      externalDeps.push('browser-storage')
    }
    if (content.includes('Date.now') || content.includes('new Date')) {
      externalDeps.push('date-time')
    }
    if (content.includes('Math.random')) {
      externalDeps.push('random')
    }
    if (content.includes('fetch') || content.includes('axios')) {
      externalDeps.push('network')
    }
    analysis.dependencies = externalDeps

    // Detecta se cobre caminho crítico
    analysis.coversCriticalPath =
      content.includes('error') ||
      content.includes('fail') ||
      content.includes('auth') ||
      content.includes('login') ||
      content.includes('critical') ||
      content.includes('core')

    return analysis
  }

  /**
   * Calcula score de segurança (0-100)
   */
  private calculateSafetyScore(analysis: any): number {
    let score = 50 // Base

    // Bônus por categoria
    const categoryBonus = {
      unit: 20,
      component: 10,
      integration: 5,
      e2e: -10,
      unknown: 0
    }
    score += categoryBonus[analysis.category] || 0

    // Bônus por velocidade
    if (analysis.estimatedDuration < 100) score += 15
    else if (analysis.estimatedDuration < 300) score += 10
    else if (analysis.estimatedDuration > 1000) score -= 10

    // Bônus por isolamento (mocks)
    if (analysis.hasMocks) score += 10

    // Penalidade por dependências externas
    score -= analysis.dependencies.length * 5

    // Bônus por cobrir caminho crítico
    if (analysis.coversCriticalPath) score += 10

    // Penalidade por muitos testes no arquivo
    if (analysis.testCount > 20) score -= 10
    else if (analysis.testCount > 10) score -= 5

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Cria subset de safe tests baseado nos critérios
   */
  async createSafeSubset(targetDuration = 30000): Promise<SafeTestSubset> {
    const candidates = await this.discoverSafeTestCandidates()
    const subset: SafeTestSubset = {
      tests: [],
      totalEstimatedDuration: 0,
      coverage: {
        unit: 0,
        component: 0,
        integration: 0,
        total: 0
      },
      lastUpdated: new Date().toISOString(),
      criteria: {
        maxDuration: targetDuration,
        minSafetyScore: 70,
        maxDependencies: 2,
        prioritizeCriticalPath: true
      }
    }

    // Ordena por score de segurança + caminho crítico
    candidates.sort((a, b) => {
      const aCritical = a.coversCriticalPath ? 20 : 0
      const bCritical = b.coversCriticalPath ? 20 : 0
      return (b.safetyScore + bCritical) - (a.safetyScore + aCritical)
    })

    for (const candidate of candidates) {
      // Verifica limites
      if (subset.totalEstimatedDuration + candidate.estimatedDuration > targetDuration) {
        break
      }

      if (candidate.safetyScore < subset.criteria.minSafetyScore) {
        continue
      }

      if (candidate.dependencies.length > subset.criteria.maxDependencies) {
        continue
      }

      // Adiciona ao subset
      subset.tests.push(candidate)
      subset.totalEstimatedDuration += candidate.estimatedDuration

      // Atualiza cobertura
      subset.coverage[candidate.category] =
        (subset.coverage[candidate.category] || 0) + 1
      subset.coverage.total++
    }

    return subset
  }

  /**
   * Salva subset de safe tests
   */
  saveSafeSubset(subset: SafeTestSubset): void {
    try {
      fs.writeFileSync(this.safeTestsFile, JSON.stringify(subset, null, 2))
    } catch (error) {
      console.warn('Error saving safe tests subset:', error.message)
    }
  }

  /**
   * Carrega subset salvo
   */
  loadSafeSubset(): SafeTestSubset | null {
    try {
      if (fs.existsSync(this.safeTestsFile)) {
        const content = fs.readFileSync(this.safeTestsFile, 'utf8')
        return JSON.parse(content)
      }
    } catch (error) {
      console.warn('Error loading safe tests subset:', error.message)
    }
    return null
  }

  /**
   * Executa subset de safe tests e coleta métricas
   */
  async executeSafeSubset(subset: SafeTestSubset): Promise<SafeTestResult> {
    const result: SafeTestResult = {
      subset: subset,
      executedAt: new Date().toISOString(),
      totalDuration: 0,
      results: [],
      summary: {
        passed: 0,
        failed: 0,
        skipped: 0,
        total: subset.tests.length
      },
      reliability: {
        successRate: 0,
        averageDuration: 0,
        flakyTests: []
      }
    }

    // Simula execução (placeholder - seria integrado com vitest)
    const startTime = Date.now()

    for (const test of subset.tests) {
      const testResult = await this.simulateTestExecution(test)
      result.results.push(testResult)

      if (testResult.passed) {
        result.summary.passed++
      } else {
        result.summary.failed++
        if (testResult.flaky) {
          result.reliability.flakyTests.push(test.file)
        }
      }
    }

    result.totalDuration = Date.now() - startTime
    result.reliability.successRate = (result.summary.passed / result.summary.total) * 100
    result.reliability.averageDuration = result.totalDuration / result.summary.total

    // Salva resultado no histórico
    this.saveExecutionResult(result)

    return result
  }

  /**
   * Simula execução de teste (placeholder)
   */
  private async simulateTestExecution(test: SafeTestInfo): Promise<any> {
    // Simula duração baseada na categoria
    const baseDuration = test.estimatedDuration
    const variance = Math.random() * 0.3 - 0.15 // ±15%
    const actualDuration = Math.max(10, baseDuration * (1 + variance))

    await new Promise(resolve => setTimeout(resolve, actualDuration / 10)) // Simula execução mais rápida

    // Simula resultado baseado no score de segurança
    const successProbability = Math.min(0.95, test.safetyScore / 100)
    const passed = Math.random() < successProbability

    return {
      file: test.file,
      duration: actualDuration,
      passed,
      flaky: !passed && test.safetyScore > 80, // Tests seguros que falham são considerados flaky
      error: passed ? null : 'Simulated test failure'
    }
  }

  /**
   * Salva resultado de execução no histórico
   */
  private saveExecutionResult(result: SafeTestResult): void {
    try {
      const history = this.loadExecutionHistory()
      history.push(result)

      // Mantém apenas últimas 50 execuções
      if (history.length > 50) {
        history.splice(0, history.length - 50)
      }

      fs.writeFileSync(this.executionHistoryFile, JSON.stringify(history, null, 2))
    } catch (error) {
      console.warn('Error saving execution result:', error.message)
    }
  }

  /**
   * Carrega histórico de execuções
   */
  private loadExecutionHistory(): SafeTestResult[] {
    try {
      if (fs.existsSync(this.executionHistoryFile)) {
        const content = fs.readFileSync(this.executionHistoryFile, 'utf8')
        return JSON.parse(content)
      }
    } catch (error) {
      console.warn('Error loading execution history:', error.message)
    }
    return []
  }

  /**
   * Atualiza subset baseado no histórico de execuções
   */
  updateSubsetFromHistory(): SafeTestSubset | null {
    const subset = this.loadSafeSubset()
    if (!subset) return null

    const history = this.loadExecutionHistory()
    if (history.length === 0) return subset

    // Calcula métricas de confiabilidade baseadas no histórico
    const testReliability: Record<string, { runs: number, failures: number, avgDuration: number }> = {}

    for (const execution of history.slice(-10)) { // Últimas 10 execuções
      for (const testResult of execution.results) {
        if (!testReliability[testResult.file]) {
          testReliability[testResult.file] = { runs: 0, failures: 0, avgDuration: 0 }
        }

        const stats = testReliability[testResult.file]
        stats.runs++
        if (!testResult.passed) stats.failures++
        stats.avgDuration = (stats.avgDuration + testResult.duration) / 2
      }
    }

    // Remove testes pouco confiáveis do subset
    subset.tests = subset.tests.filter(test => {
      const stats = testReliability[test.file]
      if (!stats || stats.runs < 3) return true // Mantém se não há dados suficientes

      const failureRate = stats.failures / stats.runs
      return failureRate < 0.1 // Mantém se taxa de falha < 10%
    })

    // Recalcula totais
    subset.coverage.total = subset.tests.length
    subset.coverage.unit = subset.tests.filter(t => t.category === 'unit').length
    subset.coverage.component = subset.tests.filter(t => t.category === 'component').length
    subset.coverage.integration = subset.tests.filter(t => t.category === 'integration').length
    subset.totalEstimatedDuration = subset.tests.reduce((sum, t) => sum + t.estimatedDuration, 0)

    this.saveSafeSubset(subset)
    return subset
  }
}
