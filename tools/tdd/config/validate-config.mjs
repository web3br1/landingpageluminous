#!/usr/bin/env node

/**
 * Valida configuração do TDD Quality System
 * Executa verificações de sintaxe, consistência e regras de negócio
 */

import fs from 'fs'
import path from 'path'
import { projectConfig, validateProjectConfig } from './project.js'

const __dirname = path.dirname(new URL(import.meta.url).pathname)

console.log('🔧 Validando configuração do TDD Quality System...\n')

const errors = []
const warnings = []

// 1. Valida configuração do projeto
try {
  validateProjectConfig(projectConfig)
  console.log('✅ Configuração do projeto válida')
} catch (error) {
  errors.push(`Configuração do projeto: ${error.message}`)
}

// 2. Verifica arquivos obrigatórios
const requiredFiles = [
  'scripts/tdd-orchestrator.mjs',
  'scripts/test-health-classifier.mjs',
  'scripts/tdd-analysis-engine.mjs',
  'scripts/tdd-pr-gate.mjs',
  'tools/tdd/config/project.js'
]

console.log('\n📁 Verificando arquivos obrigatórios...')
for (const file of requiredFiles) {
  const filePath = path.join(process.cwd(), file)
  if (!fs.existsSync(filePath)) {
    errors.push(`Arquivo obrigatório não encontrado: ${file}`)
  } else {
    console.log(`✅ ${file}`)
  }
}

// 3. Valida estrutura de diretórios
const requiredDirs = [
  'tmp/tdd-reports',
  'tmp/tdd-cache',
  'tools/tdd',
  'docs/tdd-quality-system'
]

console.log('\n📂 Verificando diretórios obrigatórios...')
for (const dir of requiredDirs) {
  const dirPath = path.join(process.cwd(), dir)
  if (!fs.existsSync(dirPath)) {
    warnings.push(`Diretório recomendado não encontrado: ${dir}`)
  } else {
    console.log(`✅ ${dir}`)
  }
}

// 4. Valida maturidades
console.log('\n🎯 Validando configurações de maturidade...')
const maturities = ['M0', 'M1', 'M2', 'M3']
for (const level of maturities) {
  const maturity = projectConfig.maturity[level]
  if (!maturity) {
    errors.push(`Maturidade ${level} não configurada`)
    continue
  }

  // Valida score mínimo
  if (maturity.score?.minMerge === undefined) {
    errors.push(`Maturidade ${level}: score.minMerge obrigatório`)
  }

  // Valida pesos das métricas
  const totalWeight = Object.values(maturity.metrics || {}).reduce((sum, metric) => {
    return sum + (metric.weight || 0)
  }, 0)

  if (Math.abs(totalWeight - 1.0) > 0.01) {
    warnings.push(`Maturidade ${level}: pesos das métricas somam ${totalWeight.toFixed(2)} (deve ser 1.0)`)
  }

  console.log(`✅ ${level} - Score mínimo: ${maturity.score?.minMerge || 'N/A'}`)
}

// 5. Valida thresholds contextuais
console.log('\n⚖️ Validando thresholds contextuais...')
if (projectConfig.characteristics?.marketingDriven) {
  console.log('📈 Projeto marketing-driven detectado - thresholds ajustados')
}
if (projectConfig.characteristics?.performanceCritical) {
  console.log('⚡ Projeto performance-critical detectado - penalidades aplicadas')
}

// 6. Verifica experimentos
if (projectConfig.experiments) {
  console.log('\n🧪 Verificando experimentos...')
  for (const [experimentId, experiment] of Object.entries(projectConfig.experiments)) {
    if (experiment.enabled) {
      console.log(`✅ Experimento ativo: ${experimentId}`)
      if (!experiment.variants || experiment.variants.length === 0) {
        warnings.push(`Experimento ${experimentId}: sem variantes definidas`)
      }
    }
  }
}

// 7. Valida sintaxe JSON de arquivos de configuração
const jsonFiles = [
  'tmp/tdd-safe-tests.json',
  'tmp/tdd-history.json'
]

console.log('\n📄 Verificando arquivos JSON...')
for (const jsonFile of jsonFiles) {
  const filePath = path.join(process.cwd(), jsonFile)
  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      JSON.parse(content)
      console.log(`✅ ${jsonFile}`)
    } catch (error) {
      warnings.push(`${jsonFile}: JSON inválido - ${error.message}`)
    }
  }
}

// Resultado final
console.log('\n' + '='.repeat(50))

if (errors.length > 0) {
  console.log('❌ ERROS CRÍTICOS ENCONTRADOS:')
  errors.forEach(error => console.log(`  - ${error}`))
  console.log('\n🔧 Corrija os erros antes de prosseguir.')
  process.exit(1)
}

if (warnings.length > 0) {
  console.log('⚠️ AVISOS (não bloqueantes):')
  warnings.forEach(warning => console.log(`  - ${warning}`))
  console.log('')
}

console.log('✅ Validação concluída com sucesso!')
console.log(`📊 Configuração válida para projeto: ${projectConfig.name}`)
console.log(`🎯 Domínio: ${projectConfig.domain}`)

if (warnings.length === 0) {
  console.log('✨ Zero avisos - configuração perfeita!')
}
