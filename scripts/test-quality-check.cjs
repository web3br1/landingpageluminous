#!/usr/bin/env node

/**
 * Test Quality Checker - Detecta Falsos Positivos
 *
 * Executa: node scripts/test-quality-check.js
 */

const fs = require('fs')
const path = require('path')

const TEST_DIR = 'tests'

class TestQualityChecker {
  constructor() {
    this.issues = []
    this.warnings = []
  }

  scanTestFiles() {
    console.log('🔍 Scanning test files for false positive risks...\n')

    const testFiles = this.findTestFiles(TEST_DIR)

    testFiles.forEach(file => {
      this.analyzeTestFile(file)
    })

    this.printReport()
  }

  findTestFiles(dir) {
    const files = []

    const items = fs.readdirSync(dir)

    items.forEach(item => {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files.push(...this.findTestFiles(fullPath))
      } else if (item.endsWith('.test.tsx') || item.endsWith('.test.ts')) {
        files.push(fullPath)
      }
    })

    return files
  }

  analyzeTestFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')
    const fileName = path.basename(filePath)

    console.log(`📄 Analyzing: ${fileName}`)

    // Problemas críticos que causam falsos positivos
    const criticalIssues = [
      {
        pattern: /: any\)|: any\[|as any/g,
        message: '❌ Uso de "any" - permite falsos positivos',
        severity: 'high'
      },
      {
        pattern: /fireEvent\./g,
        message: '⚠️  Usa fireEvent - prefira userEvent para interações realistas',
        severity: 'medium'
      },
      {
        pattern: /jest\.fn\(\)\s*$/gm,
        message: '⚠️  Mock sem implementação - pode ocultar bugs reais',
        severity: 'medium'
      },
      {
        pattern: /toBeInTheDocument\(\)\s*$/gm,
        message: '⚠️  Asserção fraca - apenas verifica presença, não funcionalidade',
        severity: 'low'
      }
    ]

    // Problemas de qualidade
    const qualityIssues = [
      {
        pattern: /it\(.*only|describe\(.*only/g,
        message: '🔍 Teste focado (.only) - remover antes do commit',
        severity: 'info'
      },
      {
        pattern: /console\.(log|error|warn)/g,
        message: '📝 Console statements - remover ou mockar',
        severity: 'low'
      },
      {
        pattern: /expect\(.*\)\.toBeTruthy\(\)/g,
        message: '🎯 Asserção vaga - especifique valor esperado',
        severity: 'low'
      }
    ]

    // Verifica problemas críticos
    criticalIssues.forEach(issue => {
      const matches = content.match(issue.pattern)
      if (matches) {
        const lineNumbers = this.findLineNumbers(content, issue.pattern)
        this.addIssue(fileName, issue.message, issue.severity, lineNumbers)
      }
    })

    // Verifica problemas de qualidade
    qualityIssues.forEach(issue => {
      const matches = content.match(issue.pattern)
      if (matches) {
        const lineNumbers = this.findLineNumbers(content, issue.pattern)
        this.addIssue(fileName, issue.message, issue.severity, lineNumbers)
      }
    })

    // Verificações específicas
    this.checkMockQuality(content, fileName)
    this.checkAssertionQuality(content, fileName)
    this.checkTestIsolation(content, fileName)
  }

  findLineNumbers(content, pattern) {
    const lines = content.split('\n')
    const lineNumbers = []

    lines.forEach((line, index) => {
      if (pattern.test(line)) {
        lineNumbers.push(index + 1)
      }
    })

    return lineNumbers
  }

  checkMockQuality(content, fileName) {
    // Verifica se mocks têm implementações realistas
    const mockDeclarations = content.match(/jest\.mock\([^,]+,\s*\(\)\s*=>\s*\{/g)

    if (mockDeclarations) {
      const hasEmptyMocks = content.match(/jest\.fn\(\)\s*$/gm)
      if (hasEmptyMocks && hasEmptyMocks.length > mockDeclarations.length * 0.5) {
        this.addIssue(fileName, '⚠️  Muitos mocks vazios - pode ocultar bugs reais', 'medium')
      }
    }
  }

  checkAssertionQuality(content, fileName) {
    // Conta tipos de asserções
    const assertions = {
      presence: (content.match(/toBeInTheDocument/g) || []).length,
      content: (content.match(/toHaveTextContent|toContainHTML/g) || []).length,
      interaction: (content.match(/toHaveBeenCalled|toHaveBeenCalledWith/g) || []).length,
      state: (content.match(/toBeVisible|toBeDisabled|toHaveAttribute/g) || []).length
    }

    const totalAssertions = Object.values(assertions).reduce((a, b) => a + b, 0)

    // Se mais de 70% das asserções são apenas de presença, é sinal de teste fraco
    if (totalAssertions > 0 && (assertions.presence / totalAssertions) > 0.7) {
      this.addIssue(fileName, '📊 Muitas asserções de presença - adicionar testes funcionais', 'low')
    }
  }

  checkTestIsolation(content, fileName) {
    // Verifica se há beforeEach para isolamento
    const hasBeforeEach = content.includes('beforeEach')
    const hasAfterEach = content.includes('afterEach')

    if (!hasBeforeEach) {
      this.addIssue(fileName, '🔄 Falta beforeEach - testes podem não estar isolados', 'medium')
    }

    if (!hasAfterEach && content.includes('mount|render')) {
      this.addIssue(fileName, '🧹 Falta afterEach para cleanup - possível vazamento', 'low')
    }
  }

  addIssue(fileName, message, severity, lineNumbers = []) {
    const issue = {
      file: fileName,
      message,
      severity,
      lines: lineNumbers
    }

    if (severity === 'high') {
      this.issues.push(issue)
    } else {
      this.warnings.push(issue)
    }
  }

  printReport() {
    console.log('\n' + '='.repeat(60))
    console.log('📋 RELATÓRIO DE QUALIDADE DOS TESTES')
    console.log('='.repeat(60))

    if (this.issues.length > 0) {
      console.log('\n🚨 PROBLEMAS CRÍTICOS (FALSOS POSITIVOS):')
      this.issues.forEach(issue => {
        console.log(`  ${issue.message}`)
        console.log(`    📁 ${issue.file}${issue.lines.length ? ` (linhas: ${issue.lines.join(', ')})` : ''}`)
      })
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  AVISOS (MELHORIAS RECOMENDADAS):')
      this.warnings.forEach(warning => {
        console.log(`  ${warning.message}`)
        console.log(`    📁 ${warning.file}${warning.lines.length ? ` (linhas: ${warning.lines.join(', ')})` : ''}`)
      })
    }

    console.log('\n' + '='.repeat(60))
    console.log(`📊 RESUMO: ${this.issues.length} problemas críticos, ${this.warnings.length} avisos`)
    console.log('='.repeat(60))

    if (this.issues.length > 0) {
      console.log('\n❌ CORREÇÕES RECOMENDADAS:')
      console.log('  1. Substitua "any" por tipos específicos')
      console.log('  2. Use userEvent ao invés de fireEvent')
      console.log('  3. Implemente mocks realistas')
      console.log('  4. Adicione asserções funcionais')
      console.log('  5. Garanta isolamento entre testes')
      process.exit(1)
    } else {
      console.log('\n✅ Nenhum problema crítico encontrado!')
    }
  }
}

// Executa verificação
const checker = new TestQualityChecker()
checker.scanTestFiles()
