#!/usr/bin/env node

/**
 * @fileoverview Script de análise automática de lacunas de teste
 * Identifica lacunas críticas na cobertura de testes baseado na arquitetura Composition-First
 *
 * Usage: node scripts/analyze-test-gaps.mjs [--fix] [--json] [--html]
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')
const TESTS_DIR = path.join(ROOT_DIR, 'tests')

/**
 * Análise de lacunas críticas identificadas
 */
const CRITICAL_GAPS = {
  // P0 - Lacunas que causam bugs críticos em produção
  P0: [
    {
      id: 'form-submission-e2e',
      name: 'Testes E2E de Submissão Real de Formulários',
      description: 'Testes que fazem submissão real de formulários (lead-gen, trial signup) com APIs reais',
      severity: 'CRITICAL',
      current: '❌ Nenhum teste faz submissão HTTP real',
      impact: 'Formulários podem falhar silenciosamente em produção',
      files: ['tests/components/sections/lead-form.test.tsx'],
      validation: async () => {
        const testFile = path.join(TESTS_DIR, 'components/sections/lead-form.test.tsx')
        const content = fs.readFileSync(testFile, 'utf8')
        return !content.includes('fetch(') && !content.includes('api/') && !content.includes('http')
      }
    },
    {
      id: 'crm-integration-real',
      name: 'Integração Real com CRM',
      description: 'Testes que validam integração completa com sistemas CRM (HubSpot, Pipedrive)',
      severity: 'CRITICAL',
      current: '❌ Apenas mocks, nenhum teste de integração real',
      impact: 'Falhas de sincronização de leads passam despercebidas',
      files: ['tests/api-integration.test.ts', 'tests/integration/api-integration.test.ts'],
      validation: async () => {
        // Verifica se o novo arquivo de teste real foi criado
        const realTestFile = path.join(TESTS_DIR, 'integration/crm-real-integration.test.ts')
        if (!fs.existsSync(realTestFile)) return true

        // Verifica se usa TestContainers ou integração real
        const content = fs.readFileSync(realTestFile, 'utf8')
        return !content.includes('TestContainer') && !content.includes('GenericContainer') && !content.includes('real.*crm')
      }
    },
    {
      id: 'page-composition-integration',
      name: 'Testes de Composição de Página',
      description: 'Testes que validam se as páginas são compostas corretamente com dados reais',
      severity: 'CRITICAL',
      current: '❌ Testes unitários isolados, sem composição real',
      impact: 'Páginas podem não renderizar corretamente com dados reais',
      files: ['tests/unit/page-composition-service.test.ts', 'app/(marketing)/page.tsx'],
      validation: async () => {
        // Verifica se o novo arquivo de teste de composição real foi criado
        const realTestFile = path.join(TESTS_DIR, 'integration/page-composition-real.test.tsx')
        if (!fs.existsSync(realTestFile)) return true

        // Verifica se usa dados reais e CMS
        const content = fs.readFileSync(realTestFile, 'utf8')
        return !content.includes('composePage') && !content.includes('cms') && !content.includes('real.*data')
      }
    },
    {
      id: 'ab-testing-functional',
      name: 'Testes Funcionais de A/B Testing',
      description: 'Testes que validam se variantes A/B são aplicadas corretamente em produção',
      severity: 'CRITICAL',
      current: '❌ Apenas testes unitários de experimentos isolados',
      impact: 'Experimentos podem não funcionar corretamente',
      files: ['tests/ab-testing/feature-flags.test.ts', 'lib/ab-testing/'],
      validation: async () => {
        // Verifica se o novo arquivo de teste E2E de A/B testing foi criado
        const e2eTestFile = path.join(TESTS_DIR, 'e2e/ab-testing-functional.spec.ts')
        if (!fs.existsSync(e2eTestFile)) return true

        // Verifica se testa experimentos funcionais no browser
        const content = fs.readFileSync(e2eTestFile, 'utf8')
        return !content.includes('experiment') && !content.includes('variant') && !content.includes('playwright')
      }
    }
  ],

  // P1 - Lacunas que causam problemas significativos
  P1: [
    {
      id: 'analytics-tracking-real',
      name: 'Tracking Real de Analytics',
      description: 'Testes que validam se eventos são enviados para analytics reais',
      severity: 'HIGH',
      current: '❌ Apenas mocks, sem validação de dados reais',
      impact: 'Dados de conversão podem estar incorretos',
      files: ['tests/analytics.test.ts', 'lib/analytics/'],
      validation: async () => {
        const analyticsTest = path.join(TESTS_DIR, 'analytics.test.ts')
        if (!fs.existsSync(analyticsTest)) return true
        const content = fs.readFileSync(analyticsTest, 'utf8')
        return !content.includes('gtag') && !content.includes('analytics.*send') && !content.includes('real.*event')
      }
    },
    {
      id: 'error-boundaries-production',
      name: 'Error Boundaries em Produção',
      description: 'Testes que validam comportamento de error boundaries com erros reais',
      severity: 'HIGH',
      current: '❌ Testes sintéticos, sem erros reais de produção',
      impact: 'Erros podem causar crashes silenciosos',
      files: ['tests/error-boundary/', 'components/error-boundary.tsx'],
      validation: async () => {
        const errorBoundaryDir = path.join(TESTS_DIR, 'error-boundary')
        return !fs.existsSync(errorBoundaryDir) || fs.readdirSync(errorBoundaryDir).length === 0
      }
    },
    {
      id: 'performance-real-world',
      name: 'Performance em Cenários Reais',
      description: 'Testes de performance com dados reais e conexões lentas',
      severity: 'HIGH',
      current: '❌ Testes sintéticos em localhost rápido',
      impact: 'Performance ruim em produção passa despercebida',
      files: ['tests/performance/', 'lib/performance/'],
      validation: async () => {
        const perfTests = fs.readdirSync(path.join(TESTS_DIR, 'performance'))
        return !perfTests.some(file => file.includes('real') || file.includes('production') || file.includes('slow'))
      }
    },

    // LACUNAS CRÍTICAS ADICIONAIS DESCOBERTAS NA ANÁLISE PROFUNDA
    {
      id: 'ssr-safety-critical',
      name: 'SSR Safety Crítico',
      description: '579 acessos a objetos globais (window, document) sem verificações SSR-safe',
      severity: 'CRITICAL',
      current: '❌ Risco de crashes em SSR/production',
      impact: 'Aplicação pode quebrar completamente no servidor',
      files: ['lib/ (97+ arquivos com typeof window)', 'components/'],
      validation: async () => {
        // Verifica se há padrões perigosos de acesso global
        const dangerousPatterns = [
          'window\\.addEventListener',
          'document\\.addEventListener',
          'navigator\\.userAgent',
          'localStorage\\.getItem',
          'sessionStorage\\.setItem'
        ]

        for (const pattern of dangerousPatterns) {
          try {
            const result = execSync(`grep -r "${pattern}" lib/ --include="*.ts" --include="*.tsx" | wc -l`, {
              encoding: 'utf8',
              stdio: 'pipe'
            }).trim()

            if (parseInt(result) > 10) { // Mais de 10 acessos perigosos
              return true
            }
          } catch (error) {
            // Padrão não encontrado, continua
          }
        }

        return false
      }
    },
    {
      id: 'performance-console-logs',
      name: 'Console Logs em Produção',
      description: '477 console.log/debugger statements que ficam em produção afetando performance',
      severity: 'CRITICAL',
      current: '❌ Logs de desenvolvimento em produção',
      impact: 'Performance degradada e possível vazamento de dados sensíveis',
      files: ['lib/ (110+ arquivos)', 'components/'],
      validation: async () => {
        try {
          const result = execSync(`grep -r "console\." lib/ components/ --include="*.ts" --include="*.tsx" | wc -l`, {
            encoding: 'utf8',
            stdio: 'pipe'
          }).trim()

          return parseInt(result) > 100 // Mais de 100 console statements
        } catch (error) {
          return false
        }
      }
    },
    {
      id: 'security-xss-injection',
      name: 'Vulnerabilidades XSS/Injeção',
      description: 'Falta validação adequada de entrada e sanitização de dados dinâmicos',
      severity: 'CRITICAL',
      current: '❌ Dados não sanitizados podem causar XSS',
      impact: 'Ataques de injeção podem comprometer usuários',
      files: ['components/', 'lib/security/'],
      validation: async () => {
        // Verifica se há sanitização adequada
        const sanitizerFiles = ['lib/security/input-sanitizer.ts', 'lib/security/input-validation.ts']
        let hasSanitizer = false

        for (const file of sanitizerFiles) {
          if (fs.existsSync(path.join(ROOT_DIR, file))) {
            hasSanitizer = true
            break
          }
        }

        // Se tem sanitizer, verifica se está sendo usado
        if (hasSanitizer) {
          try {
            const usage = execSync(`grep -r "sanitize|sanitizer" components/ --include="*.tsx" | wc -l`, {
              encoding: 'utf8',
              stdio: 'pipe'
            }).trim()

            return parseInt(usage) < 5 // Menos de 5 usos de sanitização
          } catch (error) {
            return true
          }
        }

        return true // Não tem sanitizer
      }
    },
    {
      id: 'bundle-size-tree-shaking',
      name: 'Tree Shaking e Bundle Size',
      description: 'Falta otimização adequada de bundle size e tree shaking',
      severity: 'CRITICAL',
      current: '❌ Imports desnecessários aumentam bundle size',
      impact: 'Performance degradada e experiência ruim no mobile',
      files: ['lib/', 'components/', 'package.json'],
      validation: async () => {
        // Verifica se há imports não utilizados
        const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'))
        const deps = Object.keys(packageJson.dependencies || {})

        // Verifica se dependências grandes estão sendo usadas adequadamente
        const largeDeps = ['lodash', 'moment', 'jquery', 'axios']
        let unusedLargeDeps = 0

        for (const dep of largeDeps) {
          if (deps.includes(dep)) {
            try {
              const usage = execSync(`grep -r "${dep}" lib/ components/ --include="*.ts" --include="*.tsx" | wc -l`, {
                encoding: 'utf8',
                stdio: 'pipe'
              }).trim()

              if (parseInt(usage) < 3) { // Menos de 3 usos
                unusedLargeDeps++
              }
            } catch (error) {
              unusedLargeDeps++
            }
          }
        }

        return unusedLargeDeps > 0
      }
    },
    {
      id: 'global-error-boundaries',
      name: 'Error Boundaries Globais',
      description: 'Falta error boundaries globais para capturar erros não tratados',
      severity: 'CRITICAL',
      current: '❌ Apenas error boundaries locais',
      impact: 'Erros não tratados quebram a aplicação inteira',
      files: ['components/', 'lib/error-boundary/'],
      validation: async () => {
        // Verifica se há error boundaries globais
        const boundaryFiles = [
          'lib/global-error-boundary.tsx',
          'lib/section-error-boundary.tsx',
          'components/error-boundary/'
        ]

        let globalBoundaries = 0
        for (const file of boundaryFiles) {
          if (fs.existsSync(path.join(ROOT_DIR, file))) {
            globalBoundaries++
          }
        }

        return globalBoundaries < 2 // Menos de 2 boundaries globais
      }
    },
    {
      id: 'i18n-implementation',
      name: 'Internacionalização Completa',
      description: 'i18n parcialmente implementado mas sem testes E2E ou cobertura completa',
      severity: 'HIGH',
      current: '❌ Apenas menções básicas de tradução',
      impact: 'Experiência inconsistente para usuários internacionais',
      files: ['lib/', 'messages/', 'components/'],
      validation: async () => {
        // Verifica se há sistema de i18n implementado
        const i18nFiles = ['messages/', 'lib/i18n/', 'next-i18next.config.js']
        let i18nImplemented = false

        for (const file of i18nFiles) {
          if (fs.existsSync(path.join(ROOT_DIR, file))) {
            i18nImplemented = true
            break
          }
        }

        if (!i18nImplemented) return true

        // Se implementado, verifica uso
        try {
          const usage = execSync(`grep -r "useTranslation\|t(" components/ --include="*.tsx" | wc -l`, {
            encoding: 'utf8',
            stdio: 'pipe'
          }).trim()

          return parseInt(usage) < 10 // Menos de 10 usos de tradução
        } catch (error) {
          return true
        }
      }
    },
    {
      id: 'seo-rich-snippets',
      name: 'SEO Rich Snippets e Schema',
      description: 'Falta testes de schema markup e rich snippets funcionais',
      severity: 'HIGH',
      current: '❌ Apenas arquivos de schema sem testes',
      impact: 'SEO prejudicado e SERP appearance ruim',
      files: ['lib/seo/', 'app/layout.tsx'],
      validation: async () => {
        // Verifica se há schemas implementados
        const schemaFiles = ['lib/seo/json-ld.tsx', 'lib/seo/rich-snippets.ts']
        let hasSchemas = false

        for (const file of schemaFiles) {
          if (fs.existsSync(path.join(ROOT_DIR, file))) {
            hasSchemas = true
            break
          }
        }

        if (!hasSchemas) return true

        // Verifica se schemas são testados
        try {
          const tests = execSync(`find tests/ -name "*seo*" -o -name "*schema*" | wc -l`, {
            encoding: 'utf8',
            stdio: 'pipe'
          }).trim()

          return parseInt(tests) < 2 // Menos de 2 testes de SEO/schema
        } catch (error) {
          return true
        }
      }
    },
    {
      id: 'pwa-critical-functionality',
      name: 'PWA Funcionalidades Críticas',
      description: 'PWA básico implementado mas sem testes de offline e cache crítico',
      severity: 'HIGH',
      current: '❌ Manifest e SW presentes mas não testados',
      impact: 'Experiência offline não confiável',
      files: ['public/manifest.json', 'public/sw.js', 'lib/pwa/'],
      validation: async () => {
        // Verifica se PWA está implementado
        const pwaFiles = ['public/manifest.json', 'public/sw.js', 'lib/pwa/']
        let pwaImplemented = 0

        for (const file of pwaFiles) {
          if (fs.existsSync(path.join(ROOT_DIR, file))) {
            pwaImplemented++
          }
        }

        if (pwaImplemented < 2) return true // PWA não implementado

        // Verifica testes PWA
        try {
          const pwaTests = execSync(`find tests/ -name "*pwa*" -o -name "*service-worker*" | wc -l`, {
            encoding: 'utf8',
            stdio: 'pipe'
          }).trim()

          return parseInt(pwaTests) < 1 // Menos de 1 teste PWA
        } catch (error) {
          return true
        }
      }
    },
    {
      id: 'analytics-gdpr-compliance',
      name: 'Analytics GDPR Compliance',
      description: 'Analytics implementado mas possível falta de consentimento adequado',
      severity: 'HIGH',
      current: '❌ Muitos arquivos de analytics mas sem testes de privacidade',
      impact: 'Riscos legais de LGPD/GDPR',
      files: ['lib/analytics/', 'components/cookie-banner/'],
      validation: async () => {
        // Verifica se há banner de consentimento
        const consentFiles = ['components/cookie-banner/', 'lib/privacy/', 'lib/consent/']
        let hasConsent = false

        for (const file of consentFiles) {
          if (fs.existsSync(path.join(ROOT_DIR, file))) {
            hasConsent = true
            break
          }
        }

        if (!hasConsent) return true

        // Verifica testes de privacidade
        try {
          const privacyTests = execSync(`find tests/ -name "*privacy*" -o -name "*gdpr*" -o -name "*consent*" | wc -l`, {
            encoding: 'utf8',
            stdio: 'pipe'
          }).trim()

          return parseInt(privacyTests) < 1 // Menos de 1 teste de privacidade
        } catch (error) {
          return true
        }
      }
    },
    {
      id: 'api-rate-limiting-e2e',
      name: 'Rate Limiting E2E',
      description: 'Rate limiting implementado mas sem testes E2E de proteção',
      severity: 'HIGH',
      current: '❌ Lógica de rate limiting presente mas não testada end-to-end',
      impact: 'APIs vulneráveis a abuso e ataques',
      files: ['lib/api/rate-limiting.ts', 'lib/hooks/use-rate-limiting.ts'],
      validation: async () => {
        // Verifica se rate limiting está implementado
        const rateLimitFiles = ['lib/api/rate-limiting.ts', 'lib/hooks/use-rate-limiting.ts']
        let hasRateLimit = false

        for (const file of rateLimitFiles) {
          if (fs.existsSync(path.join(ROOT_DIR, file))) {
            hasRateLimit = true
            break
          }
        }

        if (!hasRateLimit) return true

        // Verifica testes E2E de rate limiting
        try {
          const e2eTests = execSync(`find tests/ -name "*rate-limit*" -o -name "*throttle*" | grep -E "\.(spec|test)\.(ts|tsx)$" | wc -l`, {
            encoding: 'utf8',
            stdio: 'pipe'
          }).trim()

          return parseInt(e2eTests) < 1 // Menos de 1 teste E2E
        } catch (error) {
          return true
        }
      }
    }
  ],

    // P2 - Lacunas que afetam qualidade mas não são críticas
  P2: [
    {
      id: 'mobile-desktop-specific',
      name: 'Testes Específicos Mobile/Desktop',
      description: 'Testes que validam comportamentos específicos de mobile vs desktop',
      severity: 'MEDIUM',
      current: '❌ Testes genéricos, sem validação específica por device',
      impact: 'Experiência inconsistente entre dispositivos',
      files: ['tests/mobile-gestures/', 'tests/responsive/'],
      validation: async () => {
        const mobileDir = path.join(TESTS_DIR, 'mobile-gestures')
        const responsiveDir = path.join(TESTS_DIR, 'responsive')
        return (!fs.existsSync(mobileDir) || fs.readdirSync(mobileDir).length === 0) &&
               (!fs.existsSync(responsiveDir) || fs.readdirSync(responsiveDir).length === 0)
      }
    },
    {
      id: 'internationalization-e2e',
      name: 'Internacionalização E2E',
      description: 'Testes que validam troca de idiomas e localização',
      severity: 'MEDIUM',
      current: '❌ Testes unitários apenas, sem validação E2E',
      impact: 'Problemas de i18n só descobertos em produção',
      files: ['tests/i18n/', 'lib/i18n/'],
      validation: async () => {
        const i18nDir = path.join(TESTS_DIR, 'i18n')
        if (!fs.existsSync(i18nDir)) return true
        const files = fs.readdirSync(i18nDir)
        return !files.some(file => file.includes('e2e') || file.includes('playwright'))
      }
    }
  ]
}

/**
 * Executa validação das lacunas
 */
async function validateGaps() {
  console.log('🔍 Analisando lacunas de teste...\n')

  const results = { P0: [], P1: [], P2: [] }

  for (const [priority, gaps] of Object.entries(CRITICAL_GAPS)) {
    console.log(`\n📊 ${priority} - Lacunas ${priority === 'P0' ? 'CRÍTICAS' : priority === 'P1' ? 'ALTAS' : 'MÉDIAS'}`)

    for (const gap of gaps) {
      try {
        const hasGap = await gap.validation()
        const status = hasGap ? '❌ LACUNA' : '✅ OK'

        console.log(`  ${status} ${gap.name}`)
        console.log(`     ${gap.description}`)
        console.log(`     Impacto: ${gap.impact}`)

        if (hasGap) {
          console.log(`     🔧 Arquivos afetados: ${gap.files.join(', ')}`)
        }

        results[priority].push({
          ...gap,
          hasGap,
          validatedAt: new Date().toISOString()
        })

      } catch (error) {
        console.error(`  ❌ ERRO na validação de ${gap.name}:`, error.message)
        results[priority].push({
          ...gap,
          hasGap: true,
          error: error.message,
          validatedAt: new Date().toISOString()
        })
      }
    }
  }

  return results
}

/**
 * Gera relatório em JSON
 */
function generateJsonReport(results) {
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalGaps: 0,
      criticalGaps: 0,
      highGaps: 0,
      mediumGaps: 0
    },
    gaps: results
  }

  // Calcula estatísticas
  for (const [priority, gaps] of Object.entries(results)) {
    const gapsWithIssues = gaps.filter(g => g.hasGap)
    report.summary.totalGaps += gapsWithIssues.length

    if (priority === 'P0') report.summary.criticalGaps = gapsWithIssues.length
    else if (priority === 'P1') report.summary.highGaps = gapsWithIssues.length
    else if (priority === 'P2') report.summary.mediumGaps = gapsWithIssues.length
  }

  return report
}

/**
 * Analisa imports e dependências não utilizadas
 */
async function analyzeUnusedDependencies() {
  console.log('🔍 Analisando dependências não utilizadas...\n')

  const unused = {
    imports: [],
    dependencies: [],
    mentionedButNotUsed: []
  }

  try {
    // Analisar imports não utilizados usando knip ou similar
    const { execSync } = await import('child_process')

    try {
      // Executar knip para detectar código morto
      const knipOutput = execSync('npx knip --reporter json', {
        cwd: ROOT_DIR,
        encoding: 'utf8',
        stdio: 'pipe'
      })

      const knipResults = JSON.parse(knipOutput)

      if (knipResults.files) {
        unused.imports = Object.entries(knipResults.files).map(([file, data]) => ({
          file,
          unusedImports: data.unusedImports || [],
          unusedExports: data.unusedExports || []
        })).filter(item => item.unusedImports.length > 0 || item.unusedExports.length > 0)
      }
    } catch (error) {
      console.warn('⚠️  Knip não disponível ou erro:', error.message)
    }

    // Analisar package.json para dependências não utilizadas
    const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'))
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }

    // Lista de dependências que podem estar não utilizadas
    const potentiallyUnused = [
      'framer-motion', 'lucide-react', 'clsx', 'tailwind-merge',
      '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu',
      'react-hook-form', 'zod', 'axios', 'swr'
    ]

    // Verificar quais são mencionadas mas podem não estar sendo usadas
    for (const dep of potentiallyUnused) {
      if (dependencies[dep]) {
        // Verificar se é usado em algum arquivo
        try {
          const grepResult = execSync(`grep -r "${dep.replace('@', '\\@')}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" . --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=coverage`, {
            cwd: ROOT_DIR,
            encoding: 'utf8',
            stdio: 'pipe'
          })

          if (!grepResult.trim()) {
            unused.dependencies.push({
              name: dep,
              version: dependencies[dep],
              reason: 'Mencionada no package.json mas não encontrada em arquivos'
            })
          }
        } catch (error) {
          unused.dependencies.push({
            name: dep,
            version: dependencies[dep],
            reason: 'Erro ao verificar uso'
          })
        }
      }
    }

    // Analisar aplicações mencionadas em comentários/docs mas não implementadas
    const mentionedApps = await analyzeMentionedApplications()

    return {
      unused,
      mentionedButNotImplemented: mentionedApps
    }

  } catch (error) {
    console.error('❌ Erro na análise de dependências:', error.message)
    return { unused, mentionedButNotImplemented: [] }
  }
}

/**
 * Analisa aplicações mencionadas em documentação mas não implementadas
 */
async function analyzeMentionedApplications() {
  const mentioned = []

  try {
    // Buscar por menções em documentação
    const docsDir = path.join(ROOT_DIR, 'docs')
    const docFiles = fs.readdirSync(docsDir).filter(f => f.endsWith('.md'))

    const appPatterns = [
      /CRM|HubSpot|Pipedrive/gi,
      /Analytics|Google Analytics|Plausible/gi,
      /Email|Resend|Postmark|SendGrid/gi,
      /Database|PostgreSQL|MongoDB|Redis/gi,
      /CDN|CloudFlare|AWS S3/gi,
      /Monitoring|Sentry|DataDog/gi,
      /Cache|Redis|Memcached/gi,
      /Queue|BullMQ|SQS/gi
    ]

    for (const docFile of docFiles) {
      const content = fs.readFileSync(path.join(docsDir, docFile), 'utf8')

      for (const pattern of appPatterns) {
        const matches = content.match(pattern)
        if (matches) {
          matches.forEach(match => {
            // Verificar se está realmente implementado
            const isImplemented = checkIfAppIsImplemented(match)
            if (!isImplemented) {
              mentioned.push({
                application: match,
                mentionedIn: docFile,
                status: 'MENTIONED_NOT_IMPLEMENTED',
                impact: 'Documentação menciona mas não está implementado'
              })
            }
          })
        }
      }
    }

  } catch (error) {
    console.warn('⚠️  Erro ao analisar aplicações mencionadas:', error.message)
  }

  return mentioned
}

/**
 * Verifica se uma aplicação está realmente implementada
 */
function checkIfAppIsImplemented(appName) {
  try {
    const { execSync } = require('child_process')

    // Mapeamento de aplicações para padrões de busca
    const appPatterns = {
      'HubSpot': ['hubspot', 'crm.*hubspot'],
      'Pipedrive': ['pipedrive', 'crm.*pipedrive'],
      'Google Analytics': ['gtag', 'google.*analytics', 'GA4'],
      'Plausible': ['plausible', 'plausible.*analytics'],
      'Resend': ['resend', 'email.*resend'],
      'Postmark': ['postmark', 'email.*postmark'],
      'PostgreSQL': ['postgresql', 'pg', 'postgres'],
      'MongoDB': ['mongodb', 'mongoose'],
      'Redis': ['redis', 'ioredis'],
      'Sentry': ['sentry', '@sentry'],
      'DataDog': ['datadog', 'dd-trace']
    }

    const patterns = appPatterns[appName] || [appName.toLowerCase()]

    for (const pattern of patterns) {
      try {
        execSync(`grep -r "${pattern}" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" . --exclude-dir=node_modules --exclude-dir=.next`, {
          cwd: ROOT_DIR,
          stdio: 'pipe'
        })
        return true // Encontrou implementação
      } catch (error) {
        // Padrão não encontrado, continua
      }
    }

    return false // Não encontrou implementação

  } catch (error) {
    return false
  }
}

/**
 * Sugere correções automáticas para lacunas
 */
function suggestFixes(results) {
  console.log('\n🛠️  SUGESTÕES DE CORREÇÃO AUTOMÁTICA:\n')

  const suggestions = {
    'form-submission-e2e': [
      'Criar teste E2E que faz submissão real usando MSW ou servidor de staging',
      'Adicionar testes de integração com APIs de CRM usando TestContainers',
      'Implementar testes de contrato para validação de payloads'
    ],
    'crm-integration-real': [
      'Configurar TestContainers para CRM real em ambiente de teste',
      'Criar testes de integração que sincronizam leads reais (com cleanup)',
      'Implementar testes de rate limiting e circuit breaker'
    ],
    'page-composition-integration': [
      'Criar testes que renderizam páginas completas com dados reais',
      'Adicionar testes de composição usando dados do CMS',
      'Implementar testes de fallback quando dados estão indisponíveis'
    ],
    'ab-testing-functional': [
      'Criar testes E2E que alternam entre variantes A/B',
      'Adicionar testes de persistência de experimentos na sessão',
      'Implementar testes de analytics por variante'
    ]
  }

  for (const [priority, gaps] of Object.entries(results)) {
    const priorityGaps = gaps.filter(g => g.hasGap)

    if (priorityGaps.length > 0) {
      console.log(`\n${priority} - Correções sugeridas:`)

      priorityGaps.forEach(gap => {
        if (suggestions[gap.id]) {
          console.log(`  📋 ${gap.name}:`)
          suggestions[gap.id].forEach(suggestion => {
            console.log(`     • ${suggestion}`)
          })
        }
      })
    }
  }
}

/**
 * Função principal
 */
async function main() {
  const args = process.argv.slice(2)
  const shouldFix = args.includes('--fix')
  const jsonOutput = args.includes('--json')
  const includeDeps = args.includes('--deps')

  try {
    // Executar análise de lacunas
    const gapResults = await validateGaps()

    // Executar análise de dependências se solicitado
    let depsResults = null
    if (includeDeps) {
      depsResults = await analyzeUnusedDependencies()
    }

    // Combinar resultados
    const combinedResults = {
      ...gapResults,
      ...(depsResults && {
        dependencies: {
          unused: depsResults.unused,
          mentionedButNotImplemented: depsResults.mentionedButNotImplemented
        }
      }),
      metadata: {
        generatedAt: new Date().toISOString(),
        includeDependencies: includeDeps,
        totalGaps: gapResults.P0.filter(g => g.hasGap).length +
                  gapResults.P1.filter(g => g.hasGap).length +
                  gapResults.P2.filter(g => g.hasGap).length,
        criticalGaps: gapResults.P0.filter(g => g.hasGap).length
      }
    }

    if (jsonOutput) {
      // Output JSON enriquecido
      console.log(JSON.stringify(combinedResults, null, 2))
    } else {
      // Output padrão com console
      displayConsoleResults(combinedResults)

      if (depsResults) {
        displayDependencyResults(depsResults)
      }

      suggestFixes(combinedResults)
    }

    // Verifica se há lacunas críticas
    const criticalGaps = gapResults.P0.filter(g => g.hasGap).length
    if (criticalGaps > 0) {
      console.log(`\n🚨 ALERTA: ${criticalGaps} lacunas críticas encontradas!`)
      if (!jsonOutput) {
        console.log('   Execute: node scripts/analyze-test-gaps.mjs --fix')
        console.log('   Para análise completa: node scripts/analyze-test-gaps.mjs --deps --json')
      }
      process.exit(1)
    }

  } catch (error) {
    console.error('❌ Erro na análise:', error.message)
    process.exit(1)
  }
}

/**
 * Exibe resultados no console
 */
function displayConsoleResults(results) {
  console.log('\n📊 RESULTADO DA ANÁLISE DE LACUNAS:\n')

  const totalGaps = results.metadata.totalGaps
  const criticalGaps = results.metadata.criticalGaps

  console.log(`🔴 Lacunas Críticas (P0): ${results.P0.filter(g => g.hasGap).length}`)
  console.log(`🟠 Lacunas Altas (P1): ${results.P1.filter(g => g.hasGap).length}`)
  console.log(`🟢 Lacunas Médias (P2): ${results.P2.filter(g => g.hasGap).length}`)
  console.log(`📈 Total de Lacunas: ${totalGaps}\n`)

  if (criticalGaps > 0) {
    console.log('🚨 LACUNAS CRÍTICAS ENCONTRADAS:')
    results.P0.filter(g => g.hasGap).forEach(gap => {
      console.log(`   ❌ ${gap.name}`)
      console.log(`      ${gap.description}`)
      console.log(`      Impacto: ${gap.impact}`)
      console.log(`      Arquivos: ${gap.files.join(', ')}\n`)
    })
  }
}

/**
 * Exibe resultados de dependências
 */
function displayDependencyResults(depsResults) {
  console.log('\n📦 ANÁLISE DE DEPENDÊNCIAS:\n')

  if (depsResults.unused.imports.length > 0) {
    console.log(`📄 Imports não utilizados: ${depsResults.unused.imports.length}`)
    depsResults.unused.imports.slice(0, 5).forEach(item => {
      console.log(`   📁 ${item.file}: ${item.unusedImports.length} imports`)
    })
    if (depsResults.unused.imports.length > 5) {
      console.log(`   ... e mais ${depsResults.unused.imports.length - 5} arquivos`)
    }
  }

  if (depsResults.unused.dependencies.length > 0) {
    console.log(`\n📦 Dependências potencialmente não utilizadas: ${depsResults.unused.dependencies.length}`)
    depsResults.unused.dependencies.forEach(dep => {
      console.log(`   📦 ${dep.name}@${dep.version} - ${dep.reason}`)
    })
  }

  if (depsResults.mentionedButNotImplemented.length > 0) {
    console.log(`\n🚫 Aplicações mencionadas mas não implementadas: ${depsResults.mentionedButNotImplemented.length}`)
    depsResults.mentionedButNotImplemented.forEach(app => {
      console.log(`   🚫 ${app.application} (mencionado em ${app.mentionedIn})`)
    })
  }
}

main()
