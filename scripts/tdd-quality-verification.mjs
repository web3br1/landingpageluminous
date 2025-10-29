#!/usr/bin/env node

/**
 * TDD Quality Verification Script
 * Verifica qualidade dos testes seguindo princípios TDD
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

class TDDQualityVerifier {
  constructor() {
    this.scores = {
      structure: 0,
      naming: 0,
      isolation: 0,
      coverage: 0,
      performance: 0,
      maintainability: 0,
      codeQuality: 0  // New: Code quality score
    }
    this.issues = []
    this.warnings = []
    this.codeQualityMetrics = null
  }

  // 1. Verificar estrutura dos testes
  checkTestStructure() {
    console.log('🔍 Verificando estrutura dos testes...')

    const testFiles = this.getTestFiles()
    let structureScore = 0

    testFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8')

      // Verificar AAA pattern
      if (content.includes('// Arrange') || content.includes('// Act') || content.includes('// Assert')) {
        structureScore += 5
      }

      // Verificar describes aninhados apropriadamente
      const describeCount = (content.match(/describe\(/g) || []).length
      const itCount = (content.match(/it\(/g) || []).length

      if (describeCount > 0 && itCount > 0 && describeCount <= itCount) {
        structureScore += 5
      }

      // Verificar imports apropriados
      if (content.includes('import { render, screen }') ||
          content.includes('from \'@testing-library/react\'')) {
        structureScore += 5
      }
    })

    this.scores.structure = Math.min(100, structureScore)
    console.log(`✅ Estrutura: ${this.scores.structure}/100`)
  }

  // 2. Verificar nomenclatura
  checkNamingConventions() {
    console.log('🔍 Verificando nomenclatura...')

    const testFiles = this.getTestFiles()
    let namingScore = 0
    let totalTests = 0

    testFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8')
      const its = content.match(/it\(['"`](.*?)['"`]/g) || []

      totalTests += its.length

      its.forEach(it => {
        const testName = it.replace(/it\(['"`]/, '').replace(/['"`].*/, '')

        // Verificar se começa com "deve" ou "should"
        if (testName.startsWith('deve ') || testName.startsWith('should ')) {
          namingScore += 2
        }

        // Verificar se é específico (não genérico)
        if (!testName.includes('funcionar') && !testName.includes('work')) {
          namingScore += 2
        }

        // Verificar se não é muito longo
        if (testName.length < 100) {
          namingScore += 1
        }
      })
    })

    this.scores.naming = totalTests > 0 ? Math.min(100, (namingScore / (totalTests * 5)) * 100) : 0
    console.log(`✅ Nomenclatura: ${this.scores.naming.toFixed(1)}/100 (${totalTests} testes analisados)`)
  }

  // 3. Verificar isolamento
  checkIsolation() {
    console.log('🔍 Verificando isolamento...')

    const testFiles = this.getTestFiles()
    let isolationScore = 0

    testFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8')

      // Verificar uso de mocks
      if (content.includes('vi.mock') || content.includes('jest.mock')) {
        isolationScore += 10
      }

      // Verificar cleanup
      if (content.includes('cleanup()') || content.includes('afterEach')) {
        isolationScore += 10
      }

      // Verificar beforeEach para setup
      if (content.includes('beforeEach')) {
        isolationScore += 5
      }

      // Verificar ausência de estado compartilhado
      if (!content.includes('let shared') && !content.includes('var global')) {
        isolationScore += 5
      }
    })

    this.scores.isolation = Math.min(100, isolationScore)
    console.log(`✅ Isolamento: ${this.scores.isolation}/100`)
  }

  // 4. Verificar cobertura
  async checkCoverage() {
    console.log('🔍 Verificando cobertura...')

    try {
      // Verificar se existe relatório de cobertura (pode estar em tmp/coverage ou coverage/)
      const possiblePaths = [
        path.join(process.cwd(), 'coverage', 'coverage-summary.json'),
        path.join(process.cwd(), 'tmp', 'coverage', 'coverage-summary.json')
      ]

      let coverageData = null
      for (const coveragePath of possiblePaths) {
        if (fs.existsSync(coveragePath)) {
          coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'))
          break
        }
      }

      if (coverageData && coverageData.total) {
        const total = coverageData.total

        const avgCoverage = (
          total.lines.pct +
          total.statements.pct +
          total.branches.pct +
          total.functions.pct
        ) / 4

        this.scores.coverage = Math.min(100, avgCoverage)

        console.log(`✅ Cobertura: ${this.scores.coverage.toFixed(1)}%/100`)
        console.log(`   - Linhas: ${total.lines.pct}%`)
        console.log(`   - Declarações: ${total.statements.pct}%`)
        console.log(`   - Ramos: ${total.branches.pct}%`)
        console.log(`   - Funções: ${total.functions.pct}%`)
      } else {
        this.warnings.push('Relatório de cobertura não encontrado. Execute: npm run test:coverage')
        this.scores.coverage = 0
      }
    } catch (error) {
      this.warnings.push('Erro ao ler relatório de cobertura')
      this.scores.coverage = 0
    }
  }

  // 5. Verificar performance
  async checkPerformance() {
    console.log('🔍 Verificando performance...')

    // Simulação baseada em métricas conhecidas
    // Em um ambiente real, isso seria integrado com CI/CD
    const estimatedTestTime = 30000 // 30 segundos estimados

    if (estimatedTestTime < 60000) { // Menos de 1 minuto
      this.scores.performance = 90
    } else if (estimatedTestTime < 120000) { // Menos de 2 minutos
      this.scores.performance = 70
    } else {
      this.scores.performance = 50
    }

    console.log(`✅ Performance: ${this.scores.performance}/100 (~${estimatedTestTime}ms estimados)`)
    this.warnings.push('Performance baseada em estimativa. Integre com CI/CD para métricas reais.')
  }

  // 6. Verificar manutenibilidade
  checkMaintainability() {
    console.log('🔍 Verificando manutenibilidade...')

    const testFiles = this.getTestFiles()
    let maintainabilityScore = 0
    let totalFiles = testFiles.length

    testFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8')
      const lines = content.split('\n').length

      // Arquivo não muito grande
      if (lines < 500) {
        maintainabilityScore += 10
      }

      // Uso de helpers/utilitários
      if (content.includes('renderWithAct') || content.includes('testUtils')) {
        maintainabilityScore += 10
      }

      // Estrutura organizada
      if (content.includes('describe(') && content.includes('it(')) {
        maintainabilityScore += 5
      }

      // Sem comentários TODO/FIXME
      if (!content.includes('TODO') && !content.includes('FIXME')) {
        maintainabilityScore += 5
      }
    })

    this.scores.maintainability = totalFiles > 0 ? Math.min(100, (maintainabilityScore / totalFiles) * 10) : 0
    console.log(`✅ Manutenibilidade: ${this.scores.maintainability.toFixed(1)}/100`)
  }

  // 7. Verificar qualidade de código (TypeScript + ESLint)
  async checkCodeQuality() {
    console.log('🔍 Verificando qualidade de código (TypeScript + ESLint)...')

    try {
      // Try to run code quality verification
      const output = execSync('node scripts/code-quality-verification.mjs', {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 60000 // 60 seconds timeout
      })

      // Parse the output to extract score
      const lines = output.split('\n')
      let codeQualityScore = 0

      for (const line of lines) {
        const scoreMatch = line.match(/Score Geral:\s+(\d+)/)
        if (scoreMatch) {
          codeQualityScore = parseInt(scoreMatch[1])
          break
        }
      }

      this.scores.codeQuality = codeQualityScore
      console.log(`✅ Qualidade de Código: ${this.scores.codeQuality}/100`)

    } catch (error) {
      console.warn('⚠️ Erro ao executar verificação de qualidade de código:', error.message)
      console.log('ℹ️ Continuando sem score de qualidade de código...')
      this.scores.codeQuality = 0
    }
  }

  // Utilitários
  getTestFiles() {
    const testDir = path.join(process.cwd(), 'tests')

    if (!fs.existsSync(testDir)) {
      return []
    }

    const files = []

    function scanDir(dir) {
      const items = fs.readdirSync(dir)

      items.forEach(item => {
        const fullPath = path.join(dir, item)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory() && !item.startsWith('__') && item !== 'node_modules') {
          scanDir(fullPath)
        } else if (stat.isFile() && (item.endsWith('.test.ts') || item.endsWith('.test.tsx') || item.endsWith('.spec.ts') || item.endsWith('.spec.tsx'))) {
          files.push(fullPath)
        }
      })
    }

    scanDir(testDir)
    return files
  }

  // Calcular score final
  calculateFinalScore() {
    const weights = {
      structure: 0.12,      // Reduzido para acomodar qualidade de código
      naming: 0.12,
      isolation: 0.15,
      coverage: 0.15,
      performance: 0.12,
      maintainability: 0.12,
      codeQuality: 0.22     // Novo: peso significativo para qualidade de código
    }

    let finalScore = 0
    Object.entries(weights).forEach(([key, weight]) => {
      finalScore += this.scores[key] * weight
    })

    return Math.round(finalScore * 10) / 10
  }

  // Determinar nível
  getLevel(score) {
    if (score >= 90) return { level: '🟢 Excelente', description: 'Testes TDD maduros e bem estruturados' }
    if (score >= 70) return { level: '🟡 Bom', description: 'Testes funcionais com oportunidades de melhoria' }
    return { level: '🔴 Crítico', description: 'Revisão completa necessária' }
  }

  // Executar verificação completa
  async run() {
    console.log('🚀 Iniciando verificação de qualidade TDD...\n')

    await this.checkTestStructure()
    await this.checkNamingConventions()
    await this.checkIsolation()
    await this.checkCoverage()
    await this.checkPerformance()
    await this.checkMaintainability()
    await this.checkCodeQuality()

    const finalScore = this.calculateFinalScore()
    const { level, description } = this.getLevel(finalScore)

    console.log('\n' + '='.repeat(60))
    console.log('📊 RELATÓRIO FINAL DE QUALIDADE TDD')
    console.log('='.repeat(60))
    console.log(`\n🎯 Score Final: ${finalScore}/100`)
    console.log(`🏆 Nível: ${level}`)
    console.log(`📝 Descrição: ${description}`)

    console.log('\n📈 Breakdown:')
    Object.entries(this.scores).forEach(([key, score]) => {
      console.log(`   ${key.padEnd(15)}: ${score.toFixed(1).padStart(5)}/100`)
    })

    if (this.issues.length > 0) {
      console.log('\n🚨 Problemas encontrados:')
      this.issues.forEach(issue => console.log(`   • ${issue}`))
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️ Avisos:')
      this.warnings.forEach(warning => console.log(`   • ${warning}`))
    }

    console.log('\n💡 Recomendações:')
    if (finalScore < 70) {
      console.log('   • Revisar estrutura dos testes')
      console.log('   • Melhorar isolamento com mocks apropriados')
      console.log('   • Aumentar cobertura de código')
      console.log('   • Otimizar performance dos testes')
    } else if (finalScore < 90) {
      console.log('   • Padronizar nomenclatura dos testes')
      console.log('   • Refatorar testes grandes')
      console.log('   • Adicionar mais testes de edge cases')
    } else {
      console.log('   • Manter padrões atuais')
      console.log('   • Considerar adicionar testes de propriedade')
      console.log('   • Explorar test coverage mais avançada')
    }

    console.log('\n✅ Verificação concluída!')
    return finalScore
  }
}

// Executar verificação
const verifier = new TDDQualityVerifier()
verifier.run().catch(console.error)
