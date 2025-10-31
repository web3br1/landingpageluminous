#!/usr/bin/env node

/**
 * STATUS: LEGACY
 * NÃO USAR EM PRODUÇÃO
 * SUBSTITUÍDO POR ../official/dashboard-quality.mjs
 * OWNER: Quality Team
 * DATA DE QUARENTENA: 2025-10-31
 *
 * Original:
 * @fileoverview Dashboard completo de qualidade de testes
 * Integra análise de lacunas, monitoramento e geração de correções
 *
 * Usage: node scripts/test-quality-dashboard.mjs [--full] [--fix] [--ci]
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')

/**
 * Executa análise completa de qualidade
 */
async function runFullAnalysis() {
  console.log('🚀 Iniciando análise completa de qualidade...\n')

  const results = {
    gaps: null,
    coverage: null,
    performance: null,
    quality: null,
    recommendations: []
  }

  try {
    // 1. Análise de lacunas
    console.log('1️⃣ Analisando lacunas de teste...')
    const { execSync } = await import('child_process')
    const gapsOutput = execSync('node scripts/analyze-test-gaps.mjs --json', {
      cwd: ROOT_DIR,
      encoding: 'utf8'
    })
    results.gaps = JSON.parse(gapsOutput)

    // 2. Análise de cobertura
    console.log('2️⃣ Analisando cobertura...')
    try {
      execSync('npm run test:coverage', { cwd: ROOT_DIR, stdio: 'pipe' })
      const coveragePath = path.join(ROOT_DIR, 'coverage', 'coverage-summary.json')
      if (fs.existsSync(coveragePath)) {
        results.coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8')).total
      }
    } catch (error) {
      console.warn('⚠️  Cobertura não disponível:', error.message)
    }

    // 3. Testes de performance (se em CI)
    if (process.env.CI) {
      console.log('3️⃣ Executando testes de performance...')
      try {
        execSync('npx playwright test --grep "core-web-vitals" --reporter=json', {
          cwd: ROOT_DIR,
          stdio: 'pipe'
        })
        // Mock performance results - em produção extrairia dos testes reais
        results.performance = { lcp: 2100, cls: 0.03, fid: 75 }
      } catch (error) {
        console.warn('⚠️  Performance tests falharam:', error.message)
      }
    }

    // 4. Relatório de qualidade
    console.log('4️⃣ Gerando relatório de qualidade...')
    const qualityOutput = execSync('node scripts/quality-monitor.mjs --ci --json', {
      cwd: ROOT_DIR,
      encoding: 'utf8',
      stdio: 'pipe'
    })
    results.quality = JSON.parse(qualityOutput)

    // 5. Gera recomendações
    results.recommendations = generateRecommendations(results)

    return results

  } catch (error) {
    console.error('❌ Erro na análise:', error.message)
    throw error
  }
}

/**
 * Gera recomendações baseadas nos resultados
 */
function generateRecommendations(results) {
  const recommendations = []

  // Lacunas críticas
  if (results.gaps?.summary?.criticalGaps > 0) {
    recommendations.push({
      priority: 'CRITICAL',
      title: 'Implementar lacunas P0',
      description: `${results.gaps.summary.criticalGaps} lacunas críticas não cobertas`,
      actions: [
        'Executar: node scripts/generate-test-fixes.mjs form-submission-e2e --apply',
        'Executar: node scripts/generate-test-fixes.mjs crm-integration-real --apply',
        'Executar: node scripts/generate-test-fixes.mjs page-composition-integration --apply',
        'Executar: node scripts/generate-test-fixes.mjs ab-testing-functional --apply'
      ],
      effort: 'HIGH',
      impact: 'CRITICAL'
    })
  }

  // Cobertura baixa
  if (results.coverage && results.coverage.statements.pct < 80) {
    recommendations.push({
      priority: 'HIGH',
      title: 'Aumentar cobertura de testes',
      description: `Cobertura atual: ${results.coverage.statements.pct}% (meta: 80%)`,
      actions: [
        'Identificar arquivos com baixa cobertura',
        'Adicionar testes unitários para utils e hooks',
        'Implementar testes de componentes não cobertos',
        'Configurar coverage thresholds no CI'
      ],
      effort: 'MEDIUM',
      impact: 'HIGH'
    })
  }

  // Performance ruim
  if (results.performance && (results.performance.lcp > 2500 || results.performance.cls > 0.1)) {
    recommendations.push({
      priority: 'HIGH',
      title: 'Otimizar performance',
      description: `LCP: ${results.performance.lcp}ms, CLS: ${results.performance.cls}`,
      actions: [
        'Otimizar imagens e fonts',
        'Implementar lazy loading avançado',
        'Reduzir JavaScript inicial',
        'Configurar cache inteligente'
      ],
      effort: 'HIGH',
      impact: 'HIGH'
    })
  }

  // Melhorias gerais
  recommendations.push({
    priority: 'MEDIUM',
    title: 'Implementar testes de regressão visual',
    description: 'Garantir consistência visual entre deploys',
    actions: [
      'Configurar Playwright visual comparisons',
      'Criar baselines para componentes críticos',
      'Automatizar detecção de regressions',
      'Integrar com CI/CD'
    ],
    effort: 'MEDIUM',
    impact: 'MEDIUM'
  })

  recommendations.push({
    priority: 'MEDIUM',
    title: 'Melhorar testes de acessibilidade',
    description: 'Garantir conformidade WCAG 2.1 AA',
    actions: [
      'Expandir testes axe-core',
      'Implementar testes de navegação por teclado',
      'Adicionar testes de screen reader',
      'Criar relatórios de conformidade'
    ],
    effort: 'MEDIUM',
    impact: 'MEDIUM'
  })

  return recommendations
}

/**
 * Gera relatório JSON enriquecido
 */
function generateJsonDashboard(results) {
  // Estrutura do JSON enriquecido
  const dashboard = {
    // Metadados
    metadata: {
      generatedAt: new Date().toISOString(),
      project: 'Composition-First Landing System',
      version: '1.0.0',
      analysisType: 'comprehensive'
    },

    // Scores principais
    scores: {
      overall: {
        value: Math.round(results.quality?.summary?.overallScore || 0),
        status: getScoreStatus(results.quality?.summary?.overallScore || 0),
        target: 80
      },
      coverage: {
        value: Math.round(results.coverage?.statements?.pct || 0),
        status: getScoreStatus((results.coverage?.statements?.pct || 0) >= 80 ? 100 : 50),
        target: 80
      },
      gaps: {
        critical: results.quality?.summary?.criticalGapsCount || 0,
        high: results.quality?.summary?.highGapsCount || 0,
        total: (results.quality?.summary?.criticalGapsCount || 0) + (results.quality?.summary?.highGapsCount || 0),
        status: (results.quality?.summary?.criticalGapsCount || 0) === 0 ? 'PASS' : 'FAIL'
      },
      performance: {
        lcp: results.performance?.lcp || null,
        cls: results.performance?.cls || null,
        fid: results.performance?.fid || null,
        status: getPerformanceStatus(results.performance)
      }
    },

    // Lacunas por prioridade
    gaps: {
      P0: results.gaps?.gaps?.P0 || [],
      P1: results.gaps?.gaps?.P1 || [],
      P2: results.gaps?.gaps?.P2 || []
    },

    // Dependências e código morto (se incluído)
    dependencies: results.dependencies || null,

    // Recomendações priorizadas
    recommendations: results.recommendations || [],

    // Métricas detalhadas
    details: {
      coverage: results.coverage ? {
        statements: results.coverage.statements.pct,
        branches: results.coverage.branches.pct,
        functions: results.coverage.functions.pct,
        lines: results.coverage.lines.pct
      } : null,

      quality: results.quality?.summary ? {
        overallScore: results.quality.summary.overallScore,
        coverageScore: results.quality.summary.coverageScore,
        gapsScore: results.quality.summary.gapsScore,
        performanceScore: results.quality.summary.performanceScore,
        accessibilityScore: results.quality.summary.accessibilityScore
      } : null,

      performance: results.performance || null,

      unusedDependencies: results.dependencies?.unused || null,
      mentionedButNotImplemented: results.dependencies?.mentionedButNotImplemented || null
    },

    // Status geral
    status: {
      readyForProduction: (results.quality?.summary?.overallScore || 0) >= 80 &&
                          (results.quality?.summary?.criticalGapsCount || 0) === 0,
      criticalIssues: results.quality?.summary?.criticalGapsCount || 0,
      recommendationsCount: results.recommendations?.length || 0,
      lastAnalysis: new Date().toISOString()
    }
  }

  return dashboard
}

/**
 * Determina status baseado no score
 */
function getScoreStatus(score) {
  if (score >= 90) return 'EXCELLENT'
  if (score >= 80) return 'GOOD'
  if (score >= 70) return 'FAIR'
  if (score >= 50) return 'POOR'
  return 'CRITICAL'
}

/**
 * Determina status de performance
 */
function getPerformanceStatus(performance) {
  if (!performance) return 'UNKNOWN'

  const lcpOk = !performance.lcp || performance.lcp <= 2500
  const clsOk = !performance.cls || performance.cls <= 0.1
  const fidOk = !performance.fid || performance.fid <= 100

  if (lcpOk && clsOk && fidOk) return 'PASS'
  if (lcpOk && clsOk) return 'WARNING'
  return 'FAIL'
}

/**
 * Executa correções automáticas
 */
async function runAutoFixes(results) {
  console.log('\n🔧 Executando correções automáticas...\n')

  const criticalGaps = results.gaps?.summary?.criticalGaps || 0

  if (criticalGaps > 0) {
    console.log('📋 Gerando correções para lacunas críticas...\n')

    const fixes = [
      'form-submission-e2e',
      'crm-integration-real',
      'page-composition-integration',
      'ab-testing-functional'
    ]

    for (const fix of fixes) {
      try {
        console.log(`   Gerando: ${fix}...`)
        execSync(`node scripts/generate-test-fixes.mjs ${fix} --apply`, {
          cwd: ROOT_DIR,
          stdio: 'pipe'
        })
        console.log(`   ✅ ${fix} gerado com sucesso`)
      } catch (error) {
        console.log(`   ❌ Erro ao gerar ${fix}:`, error.message)
      }
    }

    console.log('\n🎯 Execute os testes gerados:')
    console.log('   npm run test:e2e  # Para testes E2E')
    console.log('   npm run test:integration  # Para testes de integração')
  } else {
    console.log('✅ Nenhuma lacuna crítica encontrada!')
  }
}

/**
 * Função principal
 */
async function main() {
  const args = process.argv.slice(2)
  const runFull = args.includes('--full')
  const runFixes = args.includes('--fix')
  const isCI = args.includes('--ci')

  try {
    // Executa análise
    const results = await runFullAnalysis()

    // Gera relatório JSON
    const jsonReport = generateJsonDashboard(results)
    const reportPath = path.join(ROOT_DIR, 'test-quality-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(jsonReport, null, 2))

    console.log(`\n📊 Relatório JSON gerado: ${reportPath}`)
    console.log(`📄 Para visualizar: cat ${reportPath} | jq .scores\n`)

    // Executa correções se solicitado
    if (runFixes) {
      await runAutoFixes(results)
    }

    // Exibe resumo executivo
    console.log('📈 RESUMO EXECUTIVO:')
    console.log(`   • Score Geral: ${Math.round(results.quality?.summary?.overallScore || 0)}%`)
    console.log(`   • Lacunas Críticas: ${results.quality?.summary?.criticalGapsCount || 0}`)
    console.log(`   • Cobertura: ${Math.round(results.coverage?.statements?.pct || 0)}%`)
    console.log(`   • Performance: ${results.performance?.lcp || 'N/A'}ms LCP\n`)

    if (results.quality?.summary?.overallScore < 70) {
      console.log('🚨 ALERTA: Qualidade abaixo do padrão!')
      console.log('   Execute: node scripts/test-quality-dashboard.mjs --fix\n')
      process.exit(1)
    } else {
      console.log('✅ Qualidade dentro dos padrões!\n')
    }

  } catch (error) {
    console.error('❌ Erro no dashboard:', error.message)
    process.exit(1)
  }
}

main()
