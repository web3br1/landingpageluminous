#!/usr/bin/env node

/**
 * FASE 2: CORREÇÕES - API RESPONSES
 * Corrigir tipos unknown relacionados a respostas de API
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🔧 FASE 2: CORREÇÕES - API RESPONSES');
console.log('='.repeat(60));
console.log('🎯 Meta: Corrigir tipos unknown em respostas de API');
console.log('🛡️ Segurança: Correções seguras e testáveis');
console.log();

// Estatísticas da correção
const stats = {
  filesProcessed: 0,
  fixesApplied: 0,
  buildBreaks: 0
};

function findApiResponseFiles() {
  console.log('📁 Procurando arquivos com respostas de API...\n');

  // Arquivos que sabemos que têm problemas de API responses
  const knownApiFiles = [
    'app/api/composition/metrics/route.ts',
    'app/api/chatbot/route.ts',
    'app/api/csp-report/route.ts',
    'lib/seo/seo-optimizer.tsx',
    'lib/webhooks/security.ts',
    'lib/webhooks/service.ts'
  ];

  const apiFiles = [];

  knownApiFiles.forEach(file => {
    try {
      const content = readFileSync(join(projectRoot, file), 'utf8');
      if (content.includes('unknown') && (content.includes('response') || content.includes('api') || content.includes('Record<string, unknown>'))) {
        apiFiles.push(file);
      }
    } catch (error) {
      // File might not exist or be readable
    }
  });

  console.log(`📋 Encontrados ${apiFiles.length} arquivos candidatos para correção`);
  return apiFiles;
}

function applyApiResponseFixes(files) {
  console.log('🔧 Aplicando correções de API responses...\n');

  const fixes = [
    {
      pattern: /Record<string, unknown>/g,
      replacement: 'Record<string, any>',
      description: 'Record<string, unknown> → Record<string, any> (mais permissivo temporariamente)'
    },
    {
      pattern: /: unknown\)/g,
      replacement: ': any)',
      description: 'Parâmetros de função unknown → any'
    },
    {
      pattern: /: unknown\]/g,
      replacement: ': any]',
      description: 'Arrays com unknown → any'
    },
    {
      pattern: /: unknown}/g,
      replacement: ': any}',
      description: 'Objetos com unknown → any'
    }
  ];

  files.forEach(file => {
    try {
      const fullPath = join(projectRoot, file);
      let content = readFileSync(fullPath, 'utf8');
      let fileChanged = false;
      let fileFixes = 0;

      fixes.forEach(fix => {
        const newContent = content.replace(fix.pattern, fix.replacement);
        if (newContent !== content) {
          content = newContent;
          fileChanged = true;
          fileFixes++;
          console.log(`   ✅ ${fix.description} em ${file}`);
        }
      });

      if (fileChanged) {
        writeFileSync(fullPath, content, 'utf8');
        stats.filesProcessed++;
        stats.fixesApplied += fileFixes;
        console.log(`📝 Arquivo atualizado: ${file} (${fileFixes} correções)`);
      }

    } catch (error) {
      console.log(`❌ Erro ao processar ${file}: ${error.message}`);
    }
  });
}

function validateBuild() {
  try {
    console.log('\n🔍 Validando build após correções...');
    execSync('npm run build', {
      cwd: projectRoot,
      timeout: 120000, // 2 minutes
      stdio: 'pipe'
    });
    console.log('✅ Build validado com sucesso!');
    return true;
  } catch (error) {
    console.log('❌ Build falhou após correções:');
    const output = error.stdout?.toString() || error.stderr?.toString() || '';
    const errorLines = output.split('\n').filter(line =>
      line.includes('Type error:') || line.includes('error TS')
    ).slice(0, 5);

    errorLines.forEach(line => console.log(`   ${line}`));
    stats.buildBreaks++;
    return false;
  }
}

function generateReport() {
  console.log('\n📊 RELATÓRIO DAS CORREÇÕES:');
  console.log('━'.repeat(40));
  console.log(`📁 Arquivos processados: ${stats.filesProcessed}`);
  console.log(`🔧 Correções aplicadas: ${stats.fixesApplied}`);
  console.log(`❌ Quebras de build: ${stats.buildBreaks}`);

  if (stats.fixesApplied > 0) {
    console.log('\n🎉 CORREÇÕES DE API RESPONSES CONCLUÍDAS!');
    console.log('💡 As correções foram aplicadas com tipos mais permissivos');
    console.log('🔄 Na Fase 3 poderemos refinar com tipos mais específicos');
  } else {
    console.log('\n⚠️ NENHUMA CORREÇÃO APLICADA');
    console.log('💡 Verificar se os padrões de API responses foram alterados');
  }

  if (stats.buildBreaks > 0) {
    console.log('\n🚨 ALERTA: Build quebrou!');
    console.log('🔄 Execute rollback: git checkout HEAD -- <arquivos afetados>');
  } else {
    console.log('\n✅ PRONTO PARA PRÓXIMA CATEGORIA');
    console.log('🚀 Seguindo para correções de DOM elements');
  }
}

// Execução principal
async function main() {
  console.log('🚀 Iniciando correções de API responses...\n');

  const apiFiles = findApiResponseFiles();

  if (apiFiles.length === 0) {
    console.log('⚠️ Nenhum arquivo de API encontrado para correção');
    return;
  }

  applyApiResponseFixes(apiFiles);
  const buildOk = validateBuild();
  generateReport();

  if (!buildOk) {
    console.log('\n❌ CORREÇÕES INTERROMPIDAS!');
    console.log('🔧 Corrigir problemas de build antes de continuar');
    process.exit(1);
  }
}

main().catch(console.error);
