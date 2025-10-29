#!/usr/bin/env node

/**
 * Help - Comandos de Qualidade Disponíveis
 */

console.log('🎯 SISTEMA DE QUALIDADE TDD - COMANDOS DISPONÍVEIS')
console.log('='.repeat(60))

console.log('\n🚀 ANÁLISES PRINCIPAIS:')
console.log('  node scripts/quick-analysis.mjs          ⚡ Análise rápida (2min)')
console.log('  node scripts/analyze-all-tests.mjs       📊 Análise completa (5-10min)')
console.log('  node scripts/tdd-quality-verification.mjs 🎯 Apenas TDD')
console.log('  node scripts/code-quality-verification.mjs 🔧 Apenas código')

console.log('\n🔧 CORREÇÕES AUTOMÁTICAS:')
console.log('  node scripts/code-quality-fix.mjs        🤖 ESLint + Prettier')

console.log('\n📊 RELATÓRIOS E DASHBOARDS:')
console.log('  tmp/tdd-dashboard/index.html             🌐 Dashboard visual')
console.log('  tmp/complete-analysis-reports/           📄 Relatórios JSON')
console.log('  tmp/code-quality-reports/                🧹 Relatórios código')

console.log('\n🧪 TESTES ESPECÍFICOS:')
console.log('  npm run test:coverage                    📈 Cobertura completa')
console.log('  npm run test:vitest:unit                 🧪 Apenas unitários')
console.log('  npm run test:components                  🧩 Apenas componentes')
console.log('  npm run test:timing                      ⏱️ Com métricas tempo')

console.log('\n📝 GERAÇÃO DE TESTES:')
console.log('  node scripts/generate-test.mjs component Hero sections/')
console.log('  node scripts/generate-test.mjs unit formatDate utils/')
console.log('  node scripts/generate-test.mjs integration UserService services/')

console.log('\n📚 DOCUMENTAÇÃO:')
console.log('  TEST-QUALITY-ANALYSIS-README.md          📖 Guia completo')
console.log('  scripts/templates/README.md              📋 Templates disponíveis')

console.log('\n🎯 WORKFLOW RECOMENDADO:')
console.log('  1. node scripts/quick-analysis.mjs       # Desenvolvimento diário')
console.log('  2. node scripts/analyze-all-tests.mjs    # PRs e releases')
console.log('  3. node scripts/code-quality-fix.mjs     # Correções automáticas')

console.log('\n📊 SCORES ATUAIS (Outubro 2025):')
console.log('  🎯 Geral: 59/100 🔴 (Meta: 75+)')
console.log('  🎯 TDD: 59/100 🔴 (Meta: 80+)')
console.log('  🔧 Código: 60/100 🟠 (Meta: 90+)')
console.log('  📊 Cobertura: 15% 🔴 (Meta: 80%)')

console.log('\n💡 DICAS RÁPIDAS:')
console.log('  • Use análise rápida diariamente')
console.log('  • Análise completa para PRs importantes')
console.log('  • Correções auto antes de commit')
console.log('  • Dashboard para acompanhar progresso')

console.log('\n' + '='.repeat(60))
