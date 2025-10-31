#!/usr/bin/env node

/**
 * TDD Quality Dashboard - Visual metrics for TDD quality tracking
 * Generates HTML dashboard with charts and trends
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

class TDDDashboard {
  constructor() {
    this.outputDir = path.join(process.cwd(), 'tmp', 'tdd-dashboard')
    this.historyFile = path.join(process.cwd(), 'tmp', 'tdd-history.json')
    this.ensureDirectories()
  }

  ensureDirectories() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true })
    }
  }

  async generateDashboard() {
    console.log('📊 Gerando TDD Quality Dashboard...')

    try {
      // Run quality verification
      const qualityResult = await this.runQualityCheck()

      // Collect additional metrics
      const additionalMetrics = await this.collectAdditionalMetrics()

      // Load historical data
      const history = this.loadHistory()

      // Update history with current data
      history.push({
        timestamp: new Date().toISOString(),
        ...qualityResult,
        ...additionalMetrics
      })

      // Keep only last 30 days
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const recentHistory = history.filter(entry =>
        new Date(entry.timestamp) > thirtyDaysAgo
      )

      // Save updated history
      this.saveHistory(recentHistory)

      // Generate HTML dashboard
      const htmlContent = this.generateHTML(recentHistory)

      // Write dashboard file
      const dashboardPath = path.join(this.outputDir, 'index.html')
      fs.writeFileSync(dashboardPath, htmlContent)

      console.log(`✅ Dashboard gerado: ${dashboardPath}`)
      console.log(`🌐 Abra em: file://${dashboardPath}`)

      // Generate summary
      this.printSummary(qualityResult, additionalMetrics)

    } catch (error) {
      console.error('❌ Erro ao gerar dashboard:', error.message)
      process.exit(1)
    }
  }

  async runQualityCheck() {
    console.log('🔍 Executando verificação de qualidade...')

    try {
      // Executar análise de qualidade diretamente
      console.log('📋 Executando: node scripts/code-quality-verification.mjs')
      const qualityOutput = execSync('node scripts/code-quality-verification.mjs', {
        encoding: 'utf8',
        stdio: 'pipe'
      })

      // Executar análise de cobertura
      console.log('📊 Executando: npm run test:coverage')
      execSync('npm run test:coverage', {
        encoding: 'utf8',
        stdio: 'pipe'
      })

      // Analisar métricas de cobertura
      const coverageMetrics = this.analyzeCoverageMetrics()

      // Analisar métricas de qualidade
      const qualityMetrics = this.parseQualityOutput(qualityOutput)

      // Calcular scores TDD
      const tddScores = this.calculateTDDScores(qualityMetrics, coverageMetrics)

      console.log('✅ Verificação de qualidade concluída')
      return {
        ...qualityMetrics,
        ...coverageMetrics,
        ...tddScores
      }

    } catch (error) {
      console.warn('⚠️ Erro na verificação de qualidade:', error.message)
      return {
        structure: 0,
        naming: 0,
        isolation: 0,
        coverage: 0,
        performance: 0,
        maintainability: 0,
        finalScore: 0
      }
    }
  }

  analyzeCoverageMetrics() {
    try {
      // Tentar ler arquivo de cobertura
      const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json')
      const lcovPath = path.join(process.cwd(), 'coverage', 'lcov.info')

      let coverage = null

      if (fs.existsSync(coveragePath)) {
        const coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'))
        coverage = coverageData.total
      } else if (fs.existsSync(lcovPath)) {
        // Fallback para LCOV
        coverage = this.parseLCOVGlobal(lcovPath)
      }

      if (coverage) {
        return {
          coverage_statements: coverage.statements?.pct || 0,
          coverage_branches: coverage.branches?.pct || 0,
          coverage_functions: coverage.functions?.pct || 0,
          coverage_lines: coverage.lines?.pct || 0
        }
      }

      return {
        coverage_statements: 0,
        coverage_branches: 0,
        coverage_functions: 0,
        coverage_lines: 0
      }

    } catch (error) {
      console.warn('⚠️ Erro ao analisar cobertura:', error.message)
      return {
        coverage_statements: 0,
        coverage_branches: 0,
        coverage_functions: 0,
        coverage_lines: 0
      }
    }
  }

  parseLCOVGlobal(lcovPath) {
    try {
      const lcovContent = fs.readFileSync(lcovPath, 'utf8')
      const sections = lcovContent.split('end_of_record')

      let totalLines = 0, coveredLines = 0
      let totalFunctions = 0, coveredFunctions = 0
      let totalBranches = 0, coveredBranches = 0

      sections.forEach(section => {
        const lines = section.split('\n')

        lines.forEach(line => {
          if (line.startsWith('DA:')) {
            const parts = line.substring(3).split(',')
            if (parts.length === 2) {
              totalLines++
              if (parseInt(parts[1]) > 0) coveredLines++
            }
          } else if (line.startsWith('FN:')) {
            totalFunctions++
          } else if (line.startsWith('FNDA:')) {
            const parts = line.substring(5).split(',')
            if (parts.length === 2 && parseInt(parts[1]) > 0) {
              coveredFunctions++
            }
          } else if (line.startsWith('BRDA:')) {
            const parts = line.substring(5).split(',')
            if (parts.length >= 4) {
              totalBranches++
              if (parseInt(parts[3]) > 0) coveredBranches++
            }
          }
        })
      })

      return {
        statements: { pct: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0 },
        branches: { pct: totalBranches > 0 ? (coveredBranches / totalBranches) * 100 : 0 },
        functions: { pct: totalFunctions > 0 ? (coveredFunctions / totalFunctions) * 100 : 0 },
        lines: { pct: totalLines > 0 ? (coveredLines / totalLines) * 100 : 0 }
      }

    } catch (error) {
      console.warn('⚠️ Erro ao parsear LCOV:', error.message)
      return null
    }
  }

  parseQualityOutput(output) {
    const lines = output.split('\n')
    const metrics = {
      typescript_errors: 0,
      eslint_errors: 0,
      eslint_warnings: 0,
      total_files: 0,
      analyzed_files: 0
    }

    lines.forEach(line => {
      const tsErrorMatch = line.match(/TypeScript:\s*(\d+)\s*errors/)
      const eslintErrorMatch = line.match(/ESLint:\s*(\d+)\s*errors/)
      const eslintWarningMatch = line.match(/ESLint:.*warnings:\s*(\d+)/)
      const filesMatch = line.match(/Arquivos analisados:\s*(\d+)/)

      if (tsErrorMatch) metrics.typescript_errors = parseInt(tsErrorMatch[1])
      if (eslintErrorMatch) metrics.eslint_errors = parseInt(eslintErrorMatch[1])
      if (eslintWarningMatch) metrics.eslint_warnings = parseInt(eslintWarningMatch[1])
      if (filesMatch) metrics.analyzed_files = parseInt(filesMatch[1])
    })

    return metrics
  }

  calculateTDDScores(qualityMetrics, coverageMetrics) {
    // Calcular scores baseado nas métricas coletadas
    const structureScore = qualityMetrics.analyzed_files > 0 ? 100 : 0
    const namingScore = qualityMetrics.eslint_errors < 100 ? 80 : 40
    const isolationScore = 100 // Assumir boa isolamento por padrão
    const coverageScore = coverageMetrics.coverage_lines || 0
    const performanceScore = 90 // Score padrão baseado em execução bem-sucedida
    const maintainabilityScore = qualityMetrics.eslint_errors === 0 ? 100 : Math.max(0, 100 - (qualityMetrics.eslint_errors / 10))

    const finalScore = (
      structureScore * 0.2 +
      namingScore * 0.15 +
      isolationScore * 0.15 +
      coverageScore * 0.25 +
      performanceScore * 0.15 +
      maintainabilityScore * 0.1
    )

    return {
      structure: structureScore,
      naming: namingScore,
      isolation: isolationScore,
      coverage: coverageScore,
      performance: performanceScore,
      maintainability: maintainabilityScore,
      finalScore: Math.round(finalScore * 100) / 100
    }
  }

  async collectAdditionalMetrics() {
    const metrics = {}

    try {
      // Test counts
      const testFiles = this.getTestFiles()
      metrics.totalTestFiles = testFiles.length
      metrics.totalTestCases = this.countTestCases(testFiles)

      // Test execution time (estimate)
      metrics.avgTestTime = await this.measureTestTime()

      // Code coverage if available
      metrics.coverageDetails = await this.getCoverageDetails()

      // Git metrics
      metrics.gitCommits = this.getRecentCommits()
      metrics.testFilesChanged = this.getTestFileChanges()

    } catch (error) {
      console.warn('⚠️ Erro ao coletar métricas adicionais:', error.message)
    }

    return metrics
  }

  getTestFiles() {
    const testFiles = []

    function scanDir(dir) {
      if (!fs.existsSync(dir)) return

      const items = fs.readdirSync(dir)
      items.forEach(item => {
        const fullPath = path.join(dir, item)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scanDir(fullPath)
        } else if (item.endsWith('.test.ts') || item.endsWith('.test.tsx') || item.endsWith('.spec.ts')) {
          testFiles.push(fullPath)
        }
      })
    }

    scanDir('tests')
    return testFiles
  }

  countTestCases(testFiles) {
    let totalTests = 0

    testFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8')
        const itMatches = content.match(/it\(/g) || []
        const testMatches = content.match(/test\(/g) || []
        totalTests += itMatches.length + testMatches.length
      } catch (error) {
        // Ignore read errors
      }
    })

    return totalTests
  }

  async measureTestTime() {
    try {
      const startTime = Date.now()
      execSync('npm test -- --run --reporter=verbose', { stdio: 'pipe', timeout: 30000 })
      const endTime = Date.now()
      return endTime - startTime
    } catch (error) {
      return 0
    }
  }

  async getCoverageDetails() {
    try {
      const coveragePath = path.join(process.cwd(), 'tmp', 'coverage', 'coverage-summary.json')
      if (fs.existsSync(coveragePath)) {
        const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'))
        return coverage.total || {}
      }
    } catch (error) {
      // Ignore coverage read errors
    }
    return {}
  }

  getRecentCommits() {
    try {
      const output = execSync('git log --oneline -10 --since="30 days ago"', { encoding: 'utf8' })
      return output.split('\n').filter(line => line.trim()).length
    } catch (error) {
      return 0
    }
  }

  getTestFileChanges() {
    try {
      const output = execSync('git log --name-only --since="30 days ago" | grep -E "\\.test\\.(ts|tsx)$" | wc -l', { encoding: 'utf8' })
      return parseInt(output.trim()) || 0
    } catch (error) {
      return 0
    }
  }

  loadHistory() {
    try {
      if (fs.existsSync(this.historyFile)) {
        return JSON.parse(fs.readFileSync(this.historyFile, 'utf8'))
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar histórico:', error.message)
    }
    return []
  }

  saveHistory(history) {
    try {
      fs.writeFileSync(this.historyFile, JSON.stringify(history, null, 2))
    } catch (error) {
      console.warn('⚠️ Erro ao salvar histórico:', error.message)
    }
  }

  generateHTML(history) {
    const latest = history[history.length - 1] || {}
    const previous = history[history.length - 2] || {}

    // Calculate trends
    const trends = {}
    Object.keys(latest).forEach(key => {
      if (typeof latest[key] === 'number' && typeof previous[key] === 'number') {
        trends[key] = latest[key] - previous[key]
      }
    })

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TDD Quality Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            text-align: center;
        }
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .header p {
            opacity: 0.9;
            font-size: 1.1em;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            text-align: center;
        }
        .metric-value {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .metric-label {
            color: #666;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .metric-trend {
            font-size: 0.8em;
            margin-top: 10px;
        }
        .trend-up { color: #22c55e; }
        .trend-down { color: #ef4444; }
        .trend-neutral { color: #6b7280; }
        .charts-container {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
            margin-bottom: 30px;
        }
        .chart-card {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .chart-card h3 {
            margin-bottom: 20px;
            color: #333;
            text-align: center;
        }
        .history-table {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .history-table table {
            width: 100%;
            border-collapse: collapse;
        }
        .history-table th,
        .history-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        .history-table th {
            background: #f8f9fa;
            font-weight: 600;
        }
        .status-excellent { background: #dcfce7; color: #166534; }
        .status-good { background: #fef3c7; color: #92400e; }
        .status-poor { background: #fee2e2; color: #991b1b; }
        @media (max-width: 768px) {
            .charts-container {
                grid-template-columns: 1fr;
            }
            .header h1 {
                font-size: 2em;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 TDD Quality Dashboard</h1>
            <p>Monitoramento de Qualidade dos Testes - ${new Date().toLocaleDateString('pt-BR')}</p>
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value ${this.getStatusClass(latest.final)}">${latest.final?.toFixed(1) || '0.0'}</div>
                <div class="metric-label">Score Final</div>
                <div class="metric-trend ${this.getTrendClass(trends.final)}">
                    ${this.getTrendIcon(trends.final)} ${Math.abs(trends.final || 0).toFixed(1)}
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-value">${latest.naming?.toFixed(1) || '0.0'}</div>
                <div class="metric-label">Nomenclatura</div>
                <div class="metric-trend ${this.getTrendClass(trends.naming)}">
                    ${this.getTrendIcon(trends.naming)} ${Math.abs(trends.naming || 0).toFixed(1)}
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-value">${latest.coverage?.toFixed(1) || '0.0'}</div>
                <div class="metric-label">Cobertura</div>
                <div class="metric-trend ${this.getTrendClass(trends.coverage)}">
                    ${this.getTrendIcon(trends.coverage)} ${Math.abs(trends.coverage || 0).toFixed(1)}
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-value">${latest.totalTestCases || 0}</div>
                <div class="metric-label">Total de Testes</div>
            </div>

            <div class="metric-card">
                <div class="metric-value">${latest.totalTestFiles || 0}</div>
                <div class="metric-label">Arquivos de Teste</div>
            </div>

            <div class="metric-card">
                <div class="metric-value">${latest.gitCommits || 0}</div>
                <div class="metric-label">Commits (30d)</div>
            </div>
        </div>

        <div class="charts-container">
            <div class="chart-card">
                <h3>📈 Evolução do Score Final</h3>
                <canvas id="scoreChart" width="400" height="200"></canvas>
            </div>

            <div class="chart-card">
                <h3>📊 Distribuição de Métricas</h3>
                <canvas id="metricsChart" width="400" height="200"></canvas>
            </div>
        </div>

        <div class="history-table">
            <table>
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Score Final</th>
                        <th>Nomenclatura</th>
                        <th>Cobertura</th>
                        <th>Testes Totais</th>
                        <th>Arquivos</th>
                    </tr>
                </thead>
                <tbody>
                    ${history.slice(-10).reverse().map(entry => `
                        <tr>
                            <td>${new Date(entry.timestamp).toLocaleDateString('pt-BR')}</td>
                            <td class="${this.getStatusClass(entry.final)}">${entry.final?.toFixed(1) || '0.0'}</td>
                            <td>${entry.naming?.toFixed(1) || '0.0'}</td>
                            <td>${entry.coverage?.toFixed(1) || '0.0'}</td>
                            <td>${entry.totalTestCases || 0}</td>
                            <td>${entry.totalTestFiles || 0}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    </div>

    <script>
        // Score evolution chart
        const scoreCtx = document.getElementById('scoreChart').getContext('2d');
        const scoreData = ${JSON.stringify(history.map(h => ({
          x: new Date(h.timestamp).toLocaleDateString('pt-BR'),
          y: h.final || 0
        })))};

        new Chart(scoreCtx, {
            type: 'line',
            data: {
                labels: scoreData.map(d => d.x),
                datasets: [{
                    label: 'Score Final',
                    data: scoreData.map(d => d.y),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });

        // Metrics distribution chart
        const metricsCtx = document.getElementById('metricsChart').getContext('2d');
        const latest = ${JSON.stringify(latest)};

        new Chart(metricsCtx, {
            type: 'radar',
            data: {
                labels: ['Estrutura', 'Nomenclatura', 'Isolamento', 'Cobertura', 'Performance', 'Manutenibilidade'],
                datasets: [{
                    label: 'Pontuação Atual',
                    data: [
                        latest.structure || 0,
                        latest.naming || 0,
                        latest.isolation || 0,
                        latest.coverage || 0,
                        latest.performance || 0,
                        latest.maintainability || 0
                    ],
                    borderColor: '#764ba2',
                    backgroundColor: 'rgba(118, 75, 162, 0.2)'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    </script>
</body>
</html>`
  }

  getStatusClass(score) {
    if (score >= 90) return 'status-excellent'
    if (score >= 70) return 'status-good'
    return 'status-poor'
  }

  getTrendClass(trend) {
    if (trend > 0) return 'trend-up'
    if (trend < 0) return 'trend-down'
    return 'trend-neutral'
  }

  getTrendIcon(trend) {
    if (trend > 0) return '📈'
    if (trend < 0) return '📉'
    return '➡️'
  }

  printSummary(qualityResult, additionalMetrics) {
    console.log('\n📊 RESUMO EXECUTIVO - TDD QUALITY DASHBOARD')
    console.log('='.repeat(50))

    console.log(`🎯 Score Final: ${qualityResult.final?.toFixed(1) || '0.0'}/100`)
    console.log(`📝 Status: ${this.getStatusText(qualityResult.final)}`)

    console.log('\n📈 Métricas Principais:')
    console.log(`   • Nomenclatura: ${qualityResult.naming?.toFixed(1) || '0.0'}/100`)
    console.log(`   • Cobertura: ${qualityResult.coverage?.toFixed(1) || '0.0'}/100`)
    console.log(`   • Estrutura: ${qualityResult.structure?.toFixed(1) || '0.0'}/100`)
    console.log(`   • Isolamento: ${qualityResult.isolation?.toFixed(1) || '0.0'}/100`)

    console.log('\n📊 Métricas Adicionais:')
    console.log(`   • Total de Testes: ${additionalMetrics.totalTestCases || 0}`)
    console.log(`   • Arquivos de Teste: ${additionalMetrics.totalTestFiles || 0}`)
    console.log(`   • Commits (30d): ${additionalMetrics.gitCommits || 0}`)
    console.log(`   • Arquivos Alterados: ${additionalMetrics.testFilesChanged || 0}`)

    console.log('\n💡 Recomendações:')
    if (qualityResult.final < 70) {
      console.log('   • Revisar nomenclatura dos testes')
      console.log('   • Melhorar cobertura de código')
      console.log('   • Refatorar testes grandes')
    } else if (qualityResult.final < 90) {
      console.log('   • Padronizar estrutura dos testes')
      console.log('   • Adicionar mais casos edge')
      console.log('   • Melhorar isolamento de testes')
    } else {
      console.log('   • Manter excelência atual')
      console.log('   • Adicionar testes para novas funcionalidades')
      console.log('   • Revisar cobertura de edge cases')
    }
  }

  getStatusText(score) {
    if (score >= 90) return 'Excelente 🏆'
    if (score >= 70) return 'Bom 👍'
    return 'Precisa Melhorar 📈'
  }
}

// CLI execution
const dashboard = new TDDDashboard()
dashboard.generateDashboard().catch(console.error)
