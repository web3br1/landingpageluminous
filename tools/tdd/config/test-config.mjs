#!/usr/bin/env node

/**
 * Testa configuração do TDD Quality System
 * Simula cenários reais e valida comportamento
 */

import fs from 'fs'
import path from 'path'
import { projectConfig } from './project.js'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

console.log('🧪 Testando configuração do TDD Quality System...\n')

const tests = []
let passed = 0
let failed = 0

// Test helper
function test(name, fn) {
  try {
    const result = fn()
    if (result !== false) {
      console.log(`✅ ${name}`)
      passed++
      return true
    } else {
      console.log(`❌ ${name}`)
      failed++
      return false
    }
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`)
    failed++
    return false
  }
}

// 1. Testa maturidade M0
test('Maturidade M0 tem score permissivo', () => {
  const m0 = projectConfig.maturity.M0
  return m0.score.minMerge <= 30 && m0.score.minMerge >= 0
})

// 2. Testa progressão de maturidade
test('Scores mínimos aumentam com maturidade', () => {
  const scores = ['M0', 'M1', 'M2', 'M3'].map(level => projectConfig.maturity[level].score.minMerge)
  for (let i = 1; i < scores.length; i++) {
    if (scores[i] < scores[i-1]) return false
  }
  return true
})

// 3. Testa pesos das métricas somam 1
test('Pesos das métricas somam 1.0 em todas maturidades', () => {
  for (const level of ['M0', 'M1', 'M2', 'M3']) {
    const maturity = projectConfig.maturity[level]
    const totalWeight = Object.values(maturity.metrics).reduce((sum, metric) => sum + metric.weight, 0)
    if (Math.abs(totalWeight - 1.0) > 0.01) return false
  }
  return true
})

// 4. Testa características do projeto
test('Características do projeto estão definidas', () => {
  const chars = projectConfig.characteristics
  return chars.performanceCritical && chars.uiFocused && chars.marketingDriven
})

// 5. Testa expectations realistas
test('Expectations são realistas para landing page', () => {
  const exp = projectConfig.expectations
  return exp.minCoverage >= 50 && exp.minCoverage <= 80 &&
         exp.targetCoverage >= 75 && exp.targetCoverage <= 95
})

// 6. Testa configuração de performance crítica
test('Performance crítica tem penalidades definidas', () => {
  const penalties = projectConfig.policies.performancePenalty
  return penalties.lcpViolation > 0 && penalties.clsViolation > 0 && penalties.inpViolation > 0
})

// 7. Testa experimentos têm variantes
test('Experimentos ativos têm variantes definidas', () => {
  for (const [id, exp] of Object.entries(projectConfig.experiments)) {
    if (exp.enabled && (!exp.variants || exp.variants.length === 0)) {
      return false
    }
  }
  return true
})

// 8. Testa política de modular requirements
test('Arquitetura modular tem requirements definidos', () => {
  const modular = projectConfig.policies.modularRequirements
  return modular.requireDomainSeparation &&
         modular.enforceCompositionRoot &&
         modular.validateImports
})

// 9. Testa notificações têm canais
test('Notificações têm canais definidos', () => {
  const notifications = projectConfig.notifications
  return notifications.channels.slack &&
         notifications.alerts.performanceRegression
})

// 10. Testa cache tem políticas específicas
test('Cache tem políticas específicas do projeto', () => {
  const cache = projectConfig.cache
  return cache.policies['src/components/'] &&
         cache.policies['tailwind.config.js'] &&
         cache.strategies.dependencyBased
})

// Simula cenários de maturidade
console.log('\n🎭 Simulando cenários de maturidade...')

// Simula M0 (caos)
const simulateM0 = () => {
  const m0 = projectConfig.maturity.M0
  const mockResults = {
    classifier: { overall: { score: 20 } },
    engine: null, // Engine falha
    coverageProxy: { aggregate: { proxyCoverage: 15 } }
  }

  // Calcula score híbrido simulado
  const classifierWeight = m0.execution.allowEngineFailure ? 0.8 : 0.6
  const engineWeight = 0.05
  const coverageWeight = 0.15

  const score = (mockResults.classifier.overall.score * classifierWeight) +
                (mockResults.coverageProxy.aggregate.proxyCoverage * coverageWeight)

  return score >= m0.score.minMerge
}

test('Cenário M0 (caos) passa com score mínimo', simulateM0)

// Simula M2 (estável)
const simulateM2 = () => {
  const m2 = projectConfig.maturity.M2
  const mockResults = {
    classifier: { overall: { score: 75 } },
    engine: { coverage: 80, performance: 90 },
    coverageProxy: { aggregate: { proxyCoverage: 85 } }
  }

  // Calcula score híbrido simulado
  const classifierWeight = 0.6
  const engineWeight = 0.25
  const coverageWeight = 0.15

  const engineScore = (mockResults.engine.coverage + mockResults.engine.performance) / 2
  const score = (mockResults.classifier.overall.score * classifierWeight) +
                (engineScore * engineWeight) +
                (mockResults.coverageProxy.aggregate.proxyCoverage * coverageWeight)

  return score >= m2.score.minMerge
}

test('Cenário M2 (estável) passa com score mínimo', simulateM2)

// Resultado final
console.log('\n' + '='.repeat(50))
console.log(`📊 Resultado dos testes: ${passed} passaram, ${failed} falharam`)

if (failed > 0) {
  console.log('\n❌ Alguns testes falharam. Verifique a configuração.')
  process.exit(1)
}

console.log('\n✅ Todos os testes passaram!')
console.log('🎉 Configuração validada e testada com sucesso.')

console.log('\n📈 Cenários simulados:')
console.log('  - M0 (caos): Sistema permanece funcional mesmo com baixa qualidade')
console.log('  - M2 (estável): Métricas reais são incorporadas ao score')
console.log('  - Todos os thresholds respeitam progressão natural')
