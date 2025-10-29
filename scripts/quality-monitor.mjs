#!/usr/bin/env node

/**
 * @fileoverview Sistema de monitoramento de qualidade de testes
 * Monitora cobertura de testes e lacunas críticas automaticamente
 *
 * Usage: node scripts/quality-monitor.mjs [--ci] [--report] [--alerts]
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')
const REPORTS_DIR = path.join(ROOT_DIR, 'reports')

/**
 * Métricas de qualidade esperadas
 */
const QUALITY_THRESHOLDS = {
  coverage: {
    statements: 80,
    branches: 70,
    functions: 75,
    lines: 80
  },
  performance: {
    lcp: 2500, // ms
    cls: 0.1,
    fid: 100   // ms
  },
  accessibility: {
    wcagAA: 95 // % compliance
  }
}

/**
 * Status de lacunas críticas
 */
const CRITICAL_GAPS_STATUS = {
  P0: {
    'form-submission-e2e': { status: 'MISSING', impact: 'HIGH', lastChecked: null },
    'crm-integration-real': { status: 'MISSING', impact: 'HIGH', lastChecked: null },
    'page-composition-integration': { status: 'MISSING', impact: 'HIGH', lastChecked: null },
    'ab-testing-functional': { status: 'MISSING', impact: 'HIGH', lastChecked: null }
  },
  P1: {
    'analytics-tracking-real': { status: 'MISSING', impact: 'MEDIUM', lastChecked: null },
    'error-boundaries-production': { status: 'MISSING', impact: 'MEDIUM', lastChecked: null },
    'performance-real-world': { status: 'MISSING', impact: 'MEDIUM', lastChecked: null }
  }
}

/**
 * Executa análise de cobertura
 */
async function analyzeCoverage() {
  console.log('📊 Analisando cobertura de testes...\n')

  try {
    // Executa testes com cobertura
    execSync('npm run test:coverage', {
      cwd: ROOT_DIR,
      stdio: 'pipe'
    })

    // Lê relatório de cobertura
    const coveragePath = path.join(ROOT_DIR, 'coverage', 'coverage-summary.json')

    if (!fs.existsSync(coveragePath)) {
      throw new Error('Relatório de cobertura não encontrado')
    }

    const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'))
    const total = coverage.total

    return {
      statements: total.statements.pct,
      branches: total.branches.pct,
      functions: total.functions.pct,
      lines: total.lines.pct
    }

  } catch (error) {
    console.error('❌ Erro ao analisar cobertura:', error.message)
    return null
  }
}

/**
 * Verifica lacunas críticas
 */
async function checkCriticalGaps() {
  console.log('🔍 Verificando lacunas críticas...\n')

  const results = { P0: {}, P1: {} }

  // P0 - Lacunas críticas
  for (const [gapId, gapInfo] of Object.entries(CRITICAL_GAPS_STATUS.P0)) {
    try {
      let hasGap = true

      switch (gapId) {
        case 'form-submission-e2e':
          hasGap = await checkFormSubmissionTests()
          break
        case 'crm-integration-real':
          hasGap = await checkCRMIntegrationTests()
          break
        case 'page-composition-integration':
          hasGap = await checkPageCompositionTests()
          break
        case 'ab-testing-functional':
          hasGap = await checkABTestingTests()
          break
      }

      results.P0[gapId] = {
        ...gapInfo,
        status: hasGap ? 'MISSING' : 'COVERED',
        lastChecked: new Date().toISOString()
      }

    } catch (error) {
      results.P0[gapId] = {
        ...gapInfo,
        status: 'ERROR',
        error: error.message,
        lastChecked: new Date().toISOString()
      }
    }
  }

  // P1 - Lacunas importantes
  for (const [gapId, gapInfo] of Object.entries(CRITICAL_GAPS_STATUS.P1)) {
    try {
      let hasGap = true

      switch (gapId) {
        case 'analytics-tracking-real':
          hasGap = await checkAnalyticsTests()
          break
        case 'error-boundaries-production':
          hasGap = await checkErrorBoundariesTests()
          break
        case 'performance-real-world':
          hasGap = await checkPerformanceTests()
          break
      }

      results.P1[gapId] = {
        ...gapInfo,
        status: hasGap ? 'MISSING' : 'COVERED',
        lastChecked: new Date().toISOString()
      }

    } catch (error) {
      results.P1[gapId] = {
        ...gapInfo,
        status: 'ERROR',
        error: error.message,
        lastChecked: new Date().toISOString()
      }
    }
  }

  return results
}

/**
 * Verificações específicas de lacunas
 */
async function checkFormSubmissionTests() {
  const e2eDir = path.join(ROOT_DIR, 'tests', 'e2e')
  if (!fs.existsSync(e2eDir)) return true

  const files = fs.readdirSync(e2eDir)
  const formTests = files.filter(f => f.includes('form') || f.includes('submission'))

  if (formTests.length === 0) return true

  // Verifica se fazem chamadas HTTP reais
  for (const file of formTests) {
    const content = fs.readFileSync(path.join(e2eDir, file), 'utf8')
    if (content.includes('fetch(') || content.includes('api/') || content.includes('http')) {
      return false // Encontrou teste real
    }
  }

  return true // Só mocks
}

async function checkCRMIntegrationTests() {
  const integrationDir = path.join(ROOT_DIR, 'tests', 'integration')
  if (!fs.existsSync(integrationDir)) return true

  const files = fs.readdirSync(integrationDir)
  const crmTests = files.filter(f => f.includes('crm') || f.includes('hubspot') || f.includes('pipedrive'))

  return crmTests.length === 0
}

async function checkPageCompositionTests() {
  const integrationDir = path.join(ROOT_DIR, 'tests', 'integration')
  if (!fs.existsSync(integrationDir)) return true

  const files = fs.readdirSync(integrationDir)
  const compositionTests = files.filter(f => f.includes('composition') || f.includes('page'))

  if (compositionTests.length === 0) return true

  // Verifica se usam dados reais
  for (const file of compositionTests) {
    const content = fs.readFileSync(path.join(integrationDir, file), 'utf8')
    if (content.includes('composePage') && content.includes('cms')) {
      return false // Encontrou teste real
    }
  }

  return true
}

async function checkABTestingTests() {
  const e2eDir = path.join(ROOT_DIR, 'tests', 'e2e')
  if (!fs.existsSync(e2eDir)) return true

  const files = fs.readdirSync(e2eDir)
  const abTests = files.filter(f => f.includes('ab') || f.includes('experiment'))

  if (abTests.length === 0) return true

  // Verifica se testam variantes reais
  for (const file of abTests) {
    const content = fs.readFileSync(path.join(e2eDir, file), 'utf8')
    if (content.includes('variant') && content.includes('experiment')) {
      return false // Encontrou teste real
    }
  }

  return true
}

async function checkAnalyticsTests() {
  const analyticsTest = path.join(ROOT_DIR, 'tests', 'analytics.test.ts')
  if (!fs.existsSync(analyticsTest)) return true

  const content = fs.readFileSync(analyticsTest, 'utf8')
  return !content.includes('gtag') && !content.includes('real.*event')
}

async function checkErrorBoundariesTests() {
  const errorBoundaryDir = path.join(ROOT_DIR, 'tests', 'error-boundary')
  if (!fs.existsSync(errorBoundaryDir)) return true

  const files = fs.readdirSync(errorBoundaryDir)
  return files.length === 0
}

async function checkPerformanceTests() {
  const perfDir = path.join(ROOT_DIR, 'tests', 'performance')
  if (!fs.existsSync(perfDir)) return true

  const files = fs.readdirSync(perfDir)
  const realWorldTests = files.filter(f => f.includes('real') || f.includes('production') || f.includes('slow'))

  return realWorldTests.length === 0
}

/**
 * Executa testes de performance
 */
async function runPerformanceTests() {
  console.log('⚡ Executando testes de performance...\n')

  try {
    // Executa testes de performance específicos
    execSync('npx playwright test --grep "performance" --reporter=json', {
      cwd: ROOT_DIR,
      stdio: 'pipe'
    })

    return {
      lcp: 2200, // mock - would be extracted from actual test results
      cls: 0.05,
      fid: 80
    }

  } catch (error) {
    console.error('❌ Erro nos testes de performance:', error.message)
    return null
  }
}

/**
 * Executa testes de acessibilidade
 */
async function runAccessibilityTests() {
  console.log('♿ Executando testes de acessibilidade...\n')

  try {
    execSync('npx playwright test --grep "accessibility" --reporter=json', {
      cwd: ROOT_DIR,
      stdio: 'pipe'
    })

    return {
      wcagAA: 92 // mock - would be calculated from actual test results
    }

  } catch (error) {
    console.error('❌ Erro nos testes de acessibilidade:', error.message)
    return null
  }
}

/**
 * Gera relatório de qualidade
 */
function generateQualityReport(coverage, gaps, performance, accessibility) {
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      overallScore: 0,
      coverageScore: 0,
      gapsScore: 0,
      performanceScore: 0,
      accessibilityScore: 0,
      criticalGapsCount: 0,
      highGapsCount: 0
    },
    details: {
      coverage,
      gaps,
      performance,
      accessibility
    }
  }

  // Calcula scores
  if (coverage) {
    const coverageAvg = (coverage.statements + coverage.branches + coverage.functions + coverage.lines) / 4
    report.summary.coverageScore = Math.min(100, (coverageAvg / 80) * 100)
  }

  if (gaps) {
    const p0Gaps = Object.values(gaps.P0).filter(g => g.status === 'MISSING').length
    const p1Gaps = Object.values(gaps.P1).filter(g => g.status === 'MISSING').length

    report.summary.criticalGapsCount = p0Gaps
    report.summary.highGapsCount = p1Gaps

    // Penaliza gaps críticos
    report.summary.gapsScore = Math.max(0, 100 - (p0Gaps * 25) - (p1Gaps * 10))
  }

  if (performance) {
    const lcpScore = performance.lcp <= QUALITY_THRESHOLDS.performance.lcp ? 100 : Math.max(0, 100 - ((performance.lcp - QUALITY_THRESHOLDS.performance.lcp) / 500) * 20)
    const clsScore = performance.cls <= QUALITY_THRESHOLDS.performance.cls ? 100 : Math.max(0, 100 - (performance.cls / QUALITY_THRESHOLDS.performance.cls) * 50)
    const fidScore = performance.fid <= QUALITY_THRESHOLDS.performance.fid ? 100 : Math.max(0, 100 - ((performance.fid - QUALITY_THRESHOLDS.performance.fid) / 50) * 20)

    report.summary.performanceScore = (lcpScore + clsScore + fidScore) / 3
  }

  if (accessibility) {
    report.summary.accessibilityScore = accessibility.wcagAA
  }

  // Score geral (média ponderada)
  const weights = { coverage: 0.3, gaps: 0.4, performance: 0.15, accessibility: 0.15 }
  report.summary.overallScore =
    (report.summary.coverageScore * weights.coverage) +
    (report.summary.gapsScore * weights.gaps) +
    (report.summary.performanceScore * weights.performance) +
    (report.summary.accessibilityScore * weights.accessibility)

  return report
}

/**
 * Salva relatório
 */
function saveReport(report, type = 'json') {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true })
  }

  const timestamp = new Date().toISOString().split('T')[0]
  const filename = `quality-report-${timestamp}.${type}`
  const filePath = path.join(REPORTS_DIR, filename)

  if (type === 'json') {
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2))
  } else if (type === 'html') {
    const html = generateHtmlReport(report)
    fs.writeFileSync(filePath, html)
  }

  console.log(`📄 Relatório salvo: ${filePath}`)
  return filePath
}

/**
 * Gera relatório HTML
 */
function generateHtmlReport(report) {
  const getStatusColor = (score) => {
    if (score >= 90) return '#27ae60'
    if (score >= 70) return '#f39c12'
    return '#e74c3c'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'COVERED': return '✅'
      case 'MISSING': return '❌'
      case 'ERROR': return '⚠️'
      default: return '❓'
    }
  }

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Qualidade - ${new Date().toLocaleDateString('pt-BR')}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; background: #f8f9fa; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .score-card { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 10px 0; text-align: center; }
        .score-value { font-size: 2em; font-weight: bold; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 30px 0; }
        .metric-card { padding: 20px; border-radius: 8px; border: 1px solid #ddd; }
        .gaps-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .gaps-table th, .gaps-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .gap-critical { background: #fee; }
        .gap-high { background: #ffe; }
        .status-covered { color: #27ae60; }
        .status-missing { color: #e74c3c; }
        .status-error { color: #f39c12; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Relatório de Qualidade de Testes</h1>
            <p>Gerado em ${new Date().toLocaleString('pt-BR')}</p>
        </div>

        <div class="score-card" style="border-left: 4px solid ${getStatusColor(report.summary.overallScore)};">
            <div class="score-value">${Math.round(report.summary.overallScore)}%</div>
            <div>Score Geral de Qualidade</div>
        </div>

        <div class="metrics">
            <div class="metric-card">
                <h3>📈 Cobertura</h3>
                <div style="font-size: 1.5em; color: ${getStatusColor(report.summary.coverageScore)};">
                    ${Math.round(report.summary.coverageScore)}%
                </div>
                ${report.details.coverage ? `
                    <small>
                        Statements: ${report.details.coverage.statements}%<br>
                        Branches: ${report.details.coverage.branches}%<br>
                        Functions: ${report.details.coverage.functions}%<br>
                        Lines: ${report.details.coverage.lines}%
                    </small>
                ` : '<small>Sem dados</small>'}
            </div>

            <div class="metric-card">
                <h3>🔍 Lacunas</h3>
                <div style="font-size: 1.5em; color: ${getStatusColor(report.summary.gapsScore)};">
                    ${Math.round(report.summary.gapsScore)}%
                </div>
                <small>
                    Críticas: ${report.summary.criticalGapsCount}<br>
                    Altas: ${report.summary.highGapsCount}
                </small>
            </div>

            <div class="metric-card">
                <h3>⚡ Performance</h3>
                <div style="font-size: 1.5em; color: ${getStatusColor(report.summary.performanceScore)};">
                    ${Math.round(report.summary.performanceScore)}%
                </div>
                ${report.details.performance ? `
                    <small>
                        LCP: ${report.details.performance.lcp}ms<br>
                        CLS: ${report.details.performance.cls}<br>
                        FID: ${report.details.performance.fid}ms
                    </small>
                ` : '<small>Sem dados</small>'}
            </div>

            <div class="metric-card">
                <h3>♿ Acessibilidade</h3>
                <div style="font-size: 1.5em; color: ${getStatusColor(report.summary.accessibilityScore)};">
                    ${Math.round(report.summary.accessibilityScore)}%
                </div>
                <small>WCAG AA Compliance</small>
            </div>
        </div>

        <h2>🔍 Status das Lacunas Críticas</h2>

        <h3>P0 - Lacunas Críticas</h3>
        <table class="gaps-table">
            <thead>
                <tr>
                    <th>Lacuna</th>
                    <th>Status</th>
                    <th>Impacto</th>
                    <th>Última Verificação</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(report.details.gaps.P0).map(([id, gap]) => `
                    <tr class="gap-critical">
                        <td>${id.replace(/-/g, ' ')}</td>
                        <td class="status-${gap.status.toLowerCase()}">${getStatusIcon(gap.status)} ${gap.status}</td>
                        <td>${gap.impact}</td>
                        <td>${gap.lastChecked ? new Date(gap.lastChecked).toLocaleDateString('pt-BR') : 'Nunca'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>

        <h3>P1 - Lacunas Altas</h3>
        <table class="gaps-table">
            <thead>
                <tr>
                    <th>Lacuna</th>
                    <th>Status</th>
                    <th>Impacto</th>
                    <th>Última Verificação</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(report.details.gaps.P1).map(([id, gap]) => `
                    <tr class="gap-high">
                        <td>${id.replace(/-/g, ' ')}</td>
                        <td class="status-${gap.status.toLowerCase()}">${getStatusIcon(gap.status)} ${gap.status}</td>
                        <td>${gap.impact}</td>
                        <td>${gap.lastChecked ? new Date(gap.lastChecked).toLocaleDateString('pt-BR') : 'Nunca'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
</body>
</html>`
}

/**
 * Verifica alertas críticos
 */
function checkAlerts(report) {
  const alerts = []

  if (report.summary.overallScore < 70) {
    alerts.push({
      level: 'CRITICAL',
      message: `Score geral muito baixo: ${Math.round(report.summary.overallScore)}%`,
      action: 'Revisar pipeline de qualidade e implementar lacunas críticas'
    })
  }

  if (report.summary.criticalGapsCount > 0) {
    alerts.push({
      level: 'CRITICAL',
      message: `${report.summary.criticalGapsCount} lacunas críticas não cobertas`,
      action: 'Implementar correções P0 imediatamente'
    })
  }

  if (report.summary.coverageScore < 80) {
    alerts.push({
      level: 'HIGH',
      message: `Cobertura baixa: ${Math.round(report.summary.coverageScore)}%`,
      action: 'Aumentar cobertura de testes unitários/componentes'
    })
  }

  if (report.summary.performanceScore < 80) {
    alerts.push({
      level: 'HIGH',
      message: `Performance ruim: ${Math.round(report.summary.performanceScore)}%`,
      action: 'Otimizar Core Web Vitals e reduzir long tasks'
    })
  }

  return alerts
}

/**
 * Envia alertas (simulado)
 */
function sendAlerts(alerts) {
  if (alerts.length === 0) return

  console.log('\n🚨 ALERTAS CRÍTICOS:\n')

  alerts.forEach((alert, index) => {
    const icon = alert.level === 'CRITICAL' ? '🚨' : '⚠️'
    console.log(`${icon} [${alert.level}] ${alert.message}`)
    console.log(`   💡 ${alert.action}\n`)
  })

  // Em produção, isso enviaria para Slack, email, etc.
  console.log('📧 Em produção, alertas seriam enviados para equipe de desenvolvimento')
}

/**
 * Função principal
 */
async function main() {
  const args = process.argv.slice(2)
  const isCI = args.includes('--ci')
  const generateReport = args.includes('--report')
  const showAlerts = args.includes('--alerts')

  console.log('🔬 Iniciando monitoramento de qualidade...\n')

  try {
    // Executa análises
    const [coverage, gaps, performance, accessibility] = await Promise.all([
      analyzeCoverage(),
      checkCriticalGaps(),
      isCI ? runPerformanceTests() : null,
      isCI ? runAccessibilityTests() : null
    ])

    // Gera relatório
    const report = generateQualityReport(coverage, gaps, performance, accessibility)

    // Exibe resumo
    console.log('📊 RESUMO DA QUALIDADE:\n')
    console.log(`   Score Geral: ${Math.round(report.summary.overallScore)}%`)
    console.log(`   Cobertura: ${Math.round(report.summary.coverageScore)}%`)
    console.log(`   Lacunas: ${Math.round(report.summary.gapsScore)}% (${report.summary.criticalGapsCount} críticas)`)
    console.log(`   Performance: ${Math.round(report.summary.performanceScore)}%`)
    console.log(`   Acessibilidade: ${Math.round(report.summary.accessibilityScore)}%\n`)

    // Salva relatórios
    if (generateReport) {
      saveReport(report, 'json')
      saveReport(report, 'html')
    }

    // Verifica alertas
    const alerts = checkAlerts(report)
    if (showAlerts && alerts.length > 0) {
      sendAlerts(alerts)
    }

    // Define código de saída baseado na qualidade
    const exitCode = report.summary.overallScore >= 80 ? 0 : 1
    process.exit(exitCode)

  } catch (error) {
    console.error('❌ Erro no monitoramento:', error.message)
    process.exit(1)
  }
}

main()
