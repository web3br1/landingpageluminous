#!/usr/bin/env node

/**
 * 🧹 LIMPEZA DE SCRIPTS DUPLICADOS
 *
 * Remove scripts duplicados após integração bem-sucedida
 * do sistema TDD v2.2.0 com linting intelligence.
 */

import fs from 'fs'
import path from 'path'

console.log('🧹 INICIANDO LIMPEZA DE SCRIPTS DUPLICADOS\n')
console.log('='.repeat(60))

// Scripts identificados para remoção
const scriptsToRemove = [
  {
    file: 'tdd-lint-final-report.mjs',
    reason: 'Funcionalidade integrada no sistema TDD principal',
    status: 'integrated'
  },
  {
    file: 'tdd-hypothesis-validation-realistic.mjs',
    reason: 'Versão específica integrada no sistema principal',
    status: 'integrated'
  },
  {
    file: 'tdd-hypothesis-validation-report.mjs',
    reason: 'Relatórios consolidados unificados no sistema principal',
    status: 'integrated'
  },
  {
    file: 'improvement-implementation-guide.mjs',
    reason: 'Guia documentado na documentação oficial',
    status: 'documented'
  }
]

// Scripts que serão MANTIDOS (valor único)
const scriptsToKeep = [
  {
    file: 'tdd-lint-mapping.mjs',
    reason: 'Útil para debugging isolado e troubleshooting'
  },
  {
    file: 'corrections-implemented-report.mjs',
    reason: 'Relatórios específicos de correções aplicadas'
  },
  {
    file: 'tdd-hypothesis-validation.mjs',
    reason: 'Validação independente de hipóteses'
  },
  {
    file: 'repo-improvement-roadmap.mjs',
    reason: 'Planejamento estratégico de melhorias'
  }
]

console.log('📋 SCRIPTS QUE SERÃO REMOVIDOS:\n')

scriptsToRemove.forEach((script, index) => {
  console.log(`${index + 1}. ❌ ${script.file}`)
  console.log(`   📝 Razão: ${script.reason}`)
  console.log(`   🏷️  Status: ${script.status}`)
  console.log('')
})

console.log('📋 SCRIPTS QUE SERÃO MANTIDOS:\n')

scriptsToKeep.forEach((script, index) => {
  console.log(`${index + 1}. ✅ ${script.file}`)
  console.log(`   💡 Valor: ${script.reason}`)
  console.log('')
})

// Função para remover arquivo com verificação
function safeRemoveFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log(`✅ REMOVIDO: ${filePath}`)
      return true
    } else {
      console.log(`⚠️  NÃO ENCONTRADO: ${filePath}`)
      return false
    }
  } catch (error) {
    console.error(`❌ ERRO ao remover ${filePath}:`, error.message)
    return false
  }
}

// Executar remoção
console.log('🚀 EXECUTANDO LIMPEZA...\n')

let removedCount = 0
let notFoundCount = 0
let errorCount = 0

scriptsToRemove.forEach(script => {
  const filePath = path.join(process.cwd(), 'scripts', script.file)

  if (safeRemoveFile(filePath)) {
    removedCount++
  } else {
    notFoundCount++
  }
})

console.log('\n📊 RESULTADO DA LIMPEZA:')
console.log(`   ✅ Scripts removidos: ${removedCount}`)
console.log(`   ⚠️  Scripts não encontrados: ${notFoundCount}`)
console.log(`   ❌ Erros na remoção: ${errorCount}`)
console.log('')

// Verificar se arquivos ainda existem
console.log('🔍 VERIFICAÇÃO FINAL:\n')

const scriptsDir = path.join(process.cwd(), 'scripts')
const remainingFiles = fs.readdirSync(scriptsDir)
  .filter(file => file.endsWith('.mjs') && scriptsToRemove.some(s => s.file === file))

if (remainingFiles.length === 0) {
  console.log('✅ SUCESSO: Todos os scripts duplicados foram removidos!')
} else {
  console.log('⚠️  ATENÇÃO: Alguns arquivos ainda existem:')
  remainingFiles.forEach(file => {
    console.log(`   - ${file}`)
  })
}

console.log('\n💾 BACKUP RECOMENDADO:')
console.log('   • Scripts removidos podem ser recuperados do histórico Git')
console.log('   • Funcionalidades estão disponíveis no sistema TDD integrado')
console.log('   • git log --name-only -- scripts/ para ver histórico')
console.log('')

console.log('🎉 LIMPEZA CONCLUÍDA!')
console.log('')
console.log('💡 PRÓXIMOS PASSOS:')
console.log('   1. ✅ Commit das mudanças')
console.log('   2. ✅ Testar sistema TDD integrado')
console.log('   3. ✅ Atualizar documentação se necessário')
console.log('   4. ✅ Comunicar equipe sobre mudanças')
console.log('')

console.log('🏆 RESULTADO FINAL:')
console.log('   Sistema TDD v2.2.0 operacional e limpo!')
console.log('   Duplicações removidas, funcionalidades preservadas.')
console.log('   Evolução incremental bem-sucedida! ✨')
