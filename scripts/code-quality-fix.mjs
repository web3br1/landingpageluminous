#!/usr/bin/env node

/**
 * Code Quality Auto-fix - Automatically fix common ESLint and TypeScript issues
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

class CodeQualityFixer {
  constructor() {
    this.fixedFiles = []
    this.errors = []
  }

  async applyAutoFixes() {
    console.log('🔧 Aplicando correções automáticas de qualidade de código...')

    try {
      // 1. Run ESLint auto-fix
      await this.runESLintAutoFix()

      // 2. Run Prettier for formatting
      await this.runPrettier()

      // 3. Run TypeScript strict checks and fix what we can
      await this.runTypeScriptFixes()

      // 4. Report results
      this.reportResults()

    } catch (error) {
      console.error('❌ Erro ao aplicar correções:', error.message)
      throw error
    }
  }

  async runESLintAutoFix() {
    console.log('🧹 Executando ESLint --fix...')

    try {
      const output = execSync('npx eslint . --fix --quiet', {
        encoding: 'utf8',
        stdio: 'pipe'
      })

      console.log('✅ ESLint auto-fix concluído')

      if (output.trim()) {
        console.log('📄 Arquivos corrigidos pelo ESLint:')
        console.log(output)
      }

    } catch (error) {
      console.warn('⚠️ Alguns erros do ESLint não puderam ser corrigidos automaticamente')
      console.warn('💡 Execute manualmente: npx eslint . --fix')
    }
  }

  async runPrettier() {
    console.log('💅 Executando Prettier para formatação...')

    try {
      const output = execSync('npx prettier --write "**/*.{ts,tsx,js,jsx,json,md}" --loglevel silent', {
        encoding: 'utf8',
        stdio: 'pipe'
      })

      console.log('✅ Prettier formatação concluída')

    } catch (error) {
      console.warn('⚠️ Erro ao executar Prettier:', error.message)
    }
  }

  async runTypeScriptFixes() {
    console.log('🔧 Verificando correções TypeScript...')

    try {
      // Run TypeScript check to see remaining issues
      execSync('npx tsc --noEmit --skipLibCheck', {
        encoding: 'utf8',
        stdio: 'pipe'
      })

      console.log('✅ TypeScript: Sem erros encontrados')

    } catch (error) {
      console.log('⚠️ TypeScript: Alguns erros permanecem')
      console.log('💡 Para correções manuais, execute: npx tsc --noEmit')
    }
  }

  reportResults() {
    console.log('\n📊 RELATÓRIO DE CORREÇÕES APLICADAS')
    console.log('='.repeat(40))

    console.log('✅ Correções aplicadas:')
    console.log('   • ESLint auto-fix executado')
    console.log('   • Prettier formatação aplicada')
    console.log('   • TypeScript verificado')

    console.log('\n💡 PRÓXIMOS PASSOS:')
    console.log('   1. Execute os testes: npm test')
    console.log('   2. Verifique qualidade: node scripts/code-quality-verification.mjs')
    console.log('   3. Faça commit das correções: git add -A && git commit -m "🤖 Auto-fix: ESLint and formatting"')

    console.log('\n🔍 PARA CORREÇÕES MANUAIS RESTANTES:')
    console.log('   • Execute: npx eslint . para ver erros restantes')
    console.log('   • Execute: npx tsc --noEmit para ver erros TypeScript')
    console.log('   • Corrija imports não utilizados, tipos any, etc.')
  }
}

// CLI execution
const fixer = new CodeQualityFixer()
fixer.applyAutoFixes()
  .then(() => {
    console.log('\n✅ Correções automáticas concluídas!')
  })
  .catch(error => {
    console.error('❌ Erro fatal:', error.message)
    process.exit(1)
  })
