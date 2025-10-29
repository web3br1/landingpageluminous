#!/usr/bin/env node

/**
 * 🧹 Sistema TDD para Mapeamento de Erros de Lint
 *
 * Mapeia automaticamente erros de ESLint para correções específicas
 * seguindo princípios TDD: identificar → diagnosticar → corrigir
 */

import fs from 'fs'
import path from 'path'

class TDDLinterMapper {
  constructor() {
    this.lintRules = {
      // Variáveis não utilizadas
      'no-unused-vars': {
        description: 'Variável importada/declarada mas nunca usada',
        category: 'cleanup',
        priority: 'high',
        autoFix: true,
        examples: [
          'import { unusedFunction } from "./utils"',
          'const unusedVar = "never used"'
        ],
        corrections: [
          '✅ Remover import/variável não utilizada',
          '✅ Prefixar com _ se for intencional (parâmetros)',
          '✅ Verificar se é realmente necessário'
        ]
      },

      '@typescript-eslint/no-unused-vars': {
        description: 'Variável TypeScript não utilizada',
        category: 'cleanup',
        priority: 'high',
        autoFix: true,
        examples: [
          'import type { UnusedType } from "./types"',
          'interface Props { unusedProp: string }'
        ],
        corrections: [
          '✅ Remover import de tipo não utilizado',
          '✅ Usar _ prefixo para parâmetros intencionais',
          '✅ Verificar se propriedade da interface é necessária'
        ]
      },

      // Complexidade alta
      'complexity': {
        description: 'Função com complexidade ciclomática > 10',
        category: 'refactor',
        priority: 'medium',
        autoFix: false,
        examples: [
          'function complexFunction(a, b, c) { if(a) { if(b) { if(c) { return true } } } }'
        ],
        corrections: [
          '🔧 Extrair função menor com responsabilidade única',
          '🔧 Usar early returns para reduzir aninhamento',
          '🔧 Criar objetos de configuração para múltiplas condições',
          '🔧 Separar lógica em funções helper'
        ]
      },

      // Uso de 'any'
      '@typescript-eslint/no-explicit-any': {
        description: 'Uso do tipo any em vez de tipo específico',
        category: 'types',
        priority: 'high',
        autoFix: false,
        examples: [
          'function process(data: any)',
          'const result: any = apiCall()'
        ],
        corrections: [
          '🎯 Definir interface/type específico',
          '🎯 Usar union types (string | number)',
          '🎯 Criar generic types parametrizáveis',
          '🎯 Usar unknown para dados externos validados'
        ]
      },

      // Variáveis não definidas
      'no-undef': {
        description: 'Variável usada sem ser declarada ou importada',
        category: 'imports',
        priority: 'critical',
        autoFix: false,
        examples: [
          'console.log(React)', // React não importado
          'const data = fetchData()' // fetchData não definida
        ],
        corrections: [
          '📦 Importar dependência necessária',
          '📦 Declarar variável localmente',
          '📦 Verificar se função existe no escopo',
          '📦 Adicionar tipo global se necessário'
        ]
      },

      // Prefer const
      'prefer-const': {
        description: 'Variável let que nunca é reatribuída',
        category: 'style',
        priority: 'low',
        autoFix: true,
        examples: [
          'let constantValue = "never changes"'
        ],
        corrections: [
          '✅ Alterar let para const',
          '✅ ESLint --fix resolve automaticamente'
        ]
      },

      // Uso de var
      'no-var': {
        description: 'Uso de var em vez de let/const',
        category: 'style',
        priority: 'medium',
        autoFix: true,
        examples: [
          'var oldStyle = "deprecated"'
        ],
        corrections: [
          '✅ Substituir var por let ou const',
          '✅ Considerar escopo de bloco vs função'
        ]
      }
    }

    this.stats = {
      totalErrors: 0,
      byCategory: {},
      byPriority: {},
      autoFixable: 0,
      manualFix: 0
    }
  }

  async analyzeLintErrors() {
    console.log('🔍 Analisando erros de lint com sistema TDD...\n')

    try {
      // Carregar relatório de qualidade
      const reportPath = path.join(process.cwd(), 'tmp', 'code-quality-reports', 'report-2025-10-28.json')

      if (!fs.existsSync(reportPath)) {
        console.log('❌ Relatório de qualidade não encontrado. Execute primeiro:')
        console.log('   node scripts/code-quality-verification.mjs')
        return
      }

      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
      const errors = report.errors || []

      console.log(`📊 Analisando ${errors.length} erros de lint...\n`)

      // Categorizar erros
      this.categorizeErrors(errors)

      // Gerar relatório TDD
      this.generateTDDReport()

      // Mostrar correções prioritárias
      this.showPriorityFixes(errors)

    } catch (error) {
      console.error('❌ Erro na análise:', error.message)
    }
  }

  categorizeErrors(errors) {
    errors.forEach(error => {
      const ruleKey = error.rule || error.message.split(' ').pop()

      // Identificar tipo de erro
      let matchedRule = null
      for (const [key, rule] of Object.entries(this.lintRules)) {
        if (error.message.includes(key) ||
            error.rule === key ||
            error.message.includes(rule.description)) {
          matchedRule = rule
          matchedRule.key = key
          break
        }
      }

      if (matchedRule) {
        // Estatísticas
        this.stats.totalErrors++

        // Por categoria
        this.stats.byCategory[matchedRule.category] =
          (this.stats.byCategory[matchedRule.category] || 0) + 1

        // Por prioridade
        this.stats.byPriority[matchedRule.priority] =
          (this.stats.byPriority[matchedRule.priority] || 0) + 1

        // Auto-fixable
        if (matchedRule.autoFix) {
          this.stats.autoFixable++
        } else {
          this.stats.manualFix++
        }
      }
    })
  }

  generateTDDReport() {
    console.log('📋 RELATÓRIO TDD - MAPEAMENTO DE ERROS DE LINT\n')
    console.log('=' .repeat(60))

    console.log(`📊 ESTATÍSTICAS GERAIS:`)
    console.log(`   • Total de erros: ${this.stats.totalErrors}`)
    console.log(`   • Corrigíveis automaticamente: ${this.stats.autoFixable}`)
    console.log(`   • Requerem correção manual: ${this.stats.manualFix}`)
    console.log('')

    console.log(`📁 POR CATEGORIA:`)
    Object.entries(this.stats.byCategory).forEach(([category, count]) => {
      console.log(`   • ${category}: ${count} erros`)
    })
    console.log('')

    console.log(`🚨 POR PRIORIDADE:`)
    Object.entries(this.stats.byPriority).forEach(([priority, count]) => {
      const icon = priority === 'critical' ? '🔴' :
                   priority === 'high' ? '🟡' :
                   priority === 'medium' ? '🟢' : '🔵'
      console.log(`   ${icon} ${priority}: ${count} erros`)
    })
    console.log('')
  }

  showPriorityFixes(errors) {
    console.log('🎯 CORREÇÕES PRIORITÁRIAS POR TIPO DE ERRO\n')
    console.log('=' .repeat(60))

    // Agrupar erros por tipo
    const errorsByType = {}

    errors.forEach(error => {
      const ruleKey = this.identifyErrorType(error)
      if (!errorsByType[ruleKey]) {
        errorsByType[ruleKey] = []
      }
      errorsByType[ruleKey].push(error)
    })

    // Mostrar correções para cada tipo
    Object.entries(errorsByType).forEach(([ruleKey, typeErrors]) => {
      const rule = this.lintRules[ruleKey]
      if (!rule) return

      console.log(`\n${ruleKey.toUpperCase()} (${typeErrors.length} ocorrências)`)
      console.log(`📝 ${rule.description}`)
      console.log(`🏷️ Categoria: ${rule.category} | Prioridade: ${rule.priority}`)
      console.log(`🔧 Auto-fix: ${rule.autoFix ? '✅ Sim' : '❌ Não'}`)

      console.log(`💡 CORREÇÕES:`)
      rule.corrections.forEach(correction => {
        console.log(`   ${correction}`)
      })

      if (rule.examples.length > 0) {
        console.log(`📌 EXEMPLOS:`)
        rule.examples.forEach(example => {
          console.log(`   • ${example}`)
        })
      }

      // Mostrar alguns arquivos afetados
      console.log(`📁 ARQUIVOS AFETADOS (amostra):`)
      typeErrors.slice(0, 3).forEach(error => {
        console.log(`   • ${error.file}:${error.line}:${error.column}`)
      })

      if (typeErrors.length > 3) {
        console.log(`   ... e mais ${typeErrors.length - 3} arquivos`)
      }
    })

    console.log('\n🚀 PRÓXIMOS PASSOS RECOMENDADOS:')
    console.log('1. 🔧 Executar correções automáticas: npx eslint . --fix')
    console.log('2. 🎯 Corrigir erros críticos primeiro (imports, types)')
    console.log('3. 🧹 Limpar variáveis não utilizadas')
    console.log('4. 🔄 Refatorar funções complexas')
    console.log('5. ✅ Validar correções: npm run test:quality')

    console.log('\n📊 DASHBOARD DE PROGRESSO:')
    console.log(`   • Corrigir ${this.stats.autoFixable} erros automaticamente`)
    console.log(`   • Resolver ${this.stats.manualFix} erros manualmente`)
    console.log(`   • Meta: Score ESLint > 80 pontos`)
  }

  identifyErrorType(error) {
    // Identificar tipo baseado na mensagem ou rule
    if (error.message.includes('is defined but never used')) {
      return error.message.includes('@typescript-eslint') ?
        '@typescript-eslint/no-unused-vars' : 'no-unused-vars'
    }

    if (error.message.includes('complexity')) {
      return 'complexity'
    }

    if (error.message.includes('any. Specify a different type')) {
      return '@typescript-eslint/no-explicit-any'
    }

    if (error.message.includes('is not defined')) {
      return 'no-undef'
    }

    if (error.message.includes('prefer-const')) {
      return 'prefer-const'
    }

    if (error.message.includes('no-var')) {
      return 'no-var'
    }

    return 'unknown'
  }
}

// Executar análise
const mapper = new TDDLinterMapper()
mapper.analyzeLintErrors()
