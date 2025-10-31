#!/usr/bin/env node

/**
 * Test Generator - Cria testes automaticamente a partir de templates
 * Uso: node scripts/generate-test.mjs <type> <name> <path> [options]
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const TEMPLATES = {
  component: 'component-test.template.tsx',
  unit: 'unit-test.template.ts',
  integration: 'integration-test.template.ts',
  e2e: 'e2e-test.template.spec.ts'
}

const TEMPLATE_VARS = {
  component: {
    COMPONENT_NAME: '',
    COMPONENT_PATH: '',
    COMPONENT_PROPS_TYPE: '',
    DOMAIN_PATH: '',
    'component-id': '',
    'component-section': ''
  },
  unit: {
    FUNCTION_NAME: '',
    FUNCTION_PATH: ''
  },
  integration: {
    SERVICE_NAME: '',
    SERVICE_PATH: ''
  },
  e2e: {
    FEATURE_NAME: ''
  }
}

function showUsage() {
  console.log(`
🎯 Test Generator - TDD Quality Framework

📖 Uso: node scripts/generate-test.mjs <type> <name> <path> [options]

📋 Tipos disponíveis:
  component    - Teste de componente React
  unit         - Teste unitário de função/utilitário
  integration  - Teste de integração
  e2e          - Teste end-to-end (Playwright)

📝 Exemplos:
  # Componente React
  node scripts/generate-test.mjs component Hero sections/hero/hero

  # Função utilitária
  node scripts/generate-test.mjs unit formatDate utils/date

  # Serviço de integração
  node scripts/generate-test.mjs integration UserService services/user

  # Teste E2E
  node scripts/generate-test.mjs e2e landing-page features/

🔧 Opções:
  --dry-run    - Mostra apenas o resultado, não cria arquivo
  --force      - Sobrescreve arquivo existente
  --help       - Mostra esta ajuda
`)
}

function parseArgs() {
  const args = process.argv.slice(2)

  if (args.length === 0 || args.includes('--help')) {
    showUsage()
    process.exit(0)
  }

  const [type, name, targetPath, ...options] = args

  if (!TEMPLATES[type]) {
    console.error(`❌ Tipo de teste inválido: ${type}`)
    console.log(`📋 Tipos disponíveis: ${Object.keys(TEMPLATES).join(', ')}`)
    process.exit(1)
  }

  const dryRun = options.includes('--dry-run')
  const force = options.includes('--force')

  return { type, name, targetPath, dryRun, force }
}

function loadTemplate(type) {
  const templatePath = path.join(__dirname, 'templates', TEMPLATES[type])

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template não encontrado: ${templatePath}`)
  }

  return fs.readFileSync(templatePath, 'utf8')
}

function generateVariables(type, name, targetPath) {
  const vars = { ...TEMPLATE_VARS[type] }

  switch (type) {
    case 'component':
      vars.COMPONENT_NAME = name
      vars.COMPONENT_PATH = targetPath
      vars.COMPONENT_PROPS_TYPE = `${name}Props`
      vars.DOMAIN_PATH = targetPath.split('/')[0] || 'common'
      vars['component-id'] = name.toLowerCase()
      vars['component-section'] = name.toLowerCase()
      break

    case 'unit':
      vars.FUNCTION_NAME = name
      vars.FUNCTION_PATH = targetPath
      break

    case 'integration':
      vars.SERVICE_NAME = name
      vars.SERVICE_PATH = targetPath
      break

    case 'e2e':
      vars.FEATURE_NAME = name
      break
  }

  return vars
}

function replacePlaceholders(template, variables) {
  let result = template

  // Replace {{VAR_NAME}} placeholders
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`
    result = result.replace(new RegExp(placeholder, 'g'), value)
  })

  // Replace {{{VAR_NAME}}} placeholders (for dynamic content)
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{{${key}}}}`
    result = result.replace(new RegExp(placeholder, 'g'), value)
  })

  return result
}

function generateFileName(type, name, targetPath) {
  const baseName = name.toLowerCase().replace(/[^a-z0-9]/g, '-')

  switch (type) {
    case 'component':
      return `${baseName}.test.tsx`
    case 'unit':
      return `${baseName}.test.ts`
    case 'integration':
      return `${baseName}.test.ts`
    case 'e2e':
      return `${baseName}.spec.ts`
    default:
      return `${baseName}.test.ts`
  }
}

function getTargetDirectory(type, targetPath) {
  // Map type to test directory
  const testDirs = {
    component: 'tests/components',
    unit: 'tests/unit',
    integration: 'tests/integration',
    e2e: 'tests/e2e'
  }

  const baseDir = testDirs[type] || 'tests'

  // If targetPath is provided, try to infer subdirectory
  if (targetPath) {
    const inferredSubdir = targetPath.split('/').slice(0, -1).join('/')
    if (inferredSubdir) {
      return path.join(baseDir, inferredSubdir)
    }
  }

  return baseDir
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
    console.log(`📁 Criado diretório: ${dirPath}`)
  }
}

function generateTest(type, name, targetPath, dryRun = false, force = false) {
  try {
    console.log(`🚀 Gerando teste ${type} para ${name}...`)

    // Load template
    const template = loadTemplate(type)
    console.log(`📄 Template carregado: ${TEMPLATES[type]}`)

    // Generate variables
    const variables = generateVariables(type, name, targetPath)
    console.log(`🔧 Variáveis geradas:`, variables)

    // Replace placeholders
    const content = replacePlaceholders(template, variables)
    console.log(`✨ Placeholders substituídos`)

    // Generate file path
    const fileName = generateFileName(type, name, targetPath)
    const targetDir = getTargetDirectory(type, targetPath)
    const fullPath = path.join(targetDir, fileName)

    console.log(`📝 Arquivo destino: ${fullPath}`)

    if (dryRun) {
      console.log(`\n🔍 MODO DRY-RUN - Conteúdo gerado:`)
      console.log(`=` .repeat(60))
      console.log(content)
      console.log(`=` .repeat(60))
      return
    }

    // Check if file exists
    if (fs.existsSync(fullPath) && !force) {
      console.error(`❌ Arquivo já existe: ${fullPath}`)
      console.log(`💡 Use --force para sobrescrever ou --dry-run para visualizar`)
      process.exit(1)
    }

    // Ensure directory exists
    ensureDirectoryExists(targetDir)

    // Write file
    fs.writeFileSync(fullPath, content)
    console.log(`✅ Arquivo criado: ${fullPath}`)

    // Show next steps
    console.log(`\n🎯 Próximos passos:`)
    console.log(`1. 📝 Revise e adapte o teste gerado`)
    console.log(`2. 🧪 Execute o teste: npm test ${path.relative(process.cwd(), fullPath)}`)
    console.log(`3. 🔍 Verifique cobertura: npm run test:coverage`)
    console.log(`4. ✅ Confirme qualidade: node scripts/tdd-quality-verification.mjs`)

  } catch (error) {
    console.error(`❌ Erro ao gerar teste:`, error.message)
    process.exit(1)
  }
}

// Main execution
try {
  const { type, name, targetPath, dryRun, force } = parseArgs()

  if (!name) {
    console.error('❌ Nome é obrigatório')
    showUsage()
    process.exit(1)
  }

  generateTest(type, name, targetPath, dryRun, force)

} catch (error) {
  console.error('❌ Erro inesperado:', error.message)
  showUsage()
  process.exit(1)
}
