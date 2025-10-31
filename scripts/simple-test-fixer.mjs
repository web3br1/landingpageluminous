#!/usr/bin/env node

/**
 * Simple Test Fixer - Versão Simplificada
 * Corrige erros comuns de teste automaticamente
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

class SimpleTestFixer {
  constructor() {
    this.projectRoot = path.resolve(process.cwd())
  }

  /**
   * Executa correções automáticas em testes
   */
  async runFixes() {
    console.log('🔧 Executando correções automáticas de teste...\n')

    try {
      const testFiles = this.findTestFiles()
      let fixesApplied = 0

      for (const testFile of testFiles) {
        if (await this.fixCommonIssues(testFile)) {
          fixesApplied++
        }
      }

      console.log(`✅ ${fixesApplied} correções aplicadas`)
      return fixesApplied

    } catch (error) {
      console.error('❌ Erro nas correções:', error.message)
      return 0
    }
  }

  /**
   * Encontra arquivos de teste no projeto
   */
  findTestFiles() {
    const testFiles = []

    function scanDirectory(dir) {
      const items = fs.readdirSync(dir)

      for (const item of items) {
        const fullPath = path.join(dir, item)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          scanDirectory(fullPath)
        } else if (stat.isFile() && item.endsWith('.test.ts') || item.endsWith('.test.tsx')) {
          testFiles.push(fullPath)
        }
      }
    }

    scanDirectory(this.projectRoot)
    return testFiles
  }

  /**
   * Corrige problemas comuns em arquivos de teste
   */
  async fixCommonIssues(testFile) {
    let content = fs.readFileSync(testFile, 'utf8')
    let modified = false

    // Correção 1: Adicionar await em expect().toBeInTheDocument()
    if (content.includes('expect(') && content.includes('toBeInTheDocument()')) {
      const awaitPattern = /expect\(([^)]+)\)\.toBeInTheDocument\(\)/g
      if (awaitPattern.test(content)) {
        content = content.replace(awaitPattern, 'await waitFor(() => expect($1).toBeInTheDocument())')
        modified = true
      }
    }

    // Correção 2: Importar waitFor quando necessário
    if (content.includes('waitFor(') && !content.includes("import { waitFor }")) {
      const importMatch = content.match(/import\s*{\s*([^}]+)\s*}\s*from\s*['"]@testing-library/)
      if (importMatch) {
        const imports = importMatch[1].split(',').map(s => s.trim())
        if (!imports.includes('waitFor')) {
          imports.push('waitFor')
          const newImports = imports.join(', ')
          content = content.replace(
            /import\s*{\s*([^}]+)\s*}\s*from\s*['"]@testing-library/,
            `import { ${newImports} } from '@testing-library'`
          )
          modified = true
        }
      }
    }

    // Correção 3: Remover console.error/warn em testes
    if (content.includes('console.error') || content.includes('console.warn')) {
      content = content.replace(/console\.(error|warn)\([^)]+\);?/g, '')
      modified = true
    }

    if (modified) {
      fs.writeFileSync(testFile, content)
      console.log(`🔧 Corrigido: ${path.relative(this.projectRoot, testFile)}`)
    }

    return modified
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const fixer = new SimpleTestFixer()
  fixer.runFixes().catch(console.error)
}

export default SimpleTestFixer
