#!/usr/bin/env node

/**
 * FASE 2: ANÁLISE DE TIPOS UNKNOWN
 * Categoriza e analisa todos os usos de 'unknown' no projeto
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🔍 FASE 2: ANÁLISE DE TIPOS UNKNOWN');
console.log('='.repeat(60));

// Estatísticas da análise
const stats = {
  totalFiles: 0,
  filesWithUnknown: 0,
  totalUnknownUsages: 0,
  categories: {
    apiResponses: 0,
    domElements: 0,
    functionParams: 0,
    objectProps: 0,
    typeAssertions: 0,
    other: 0
  },
  patterns: []
};

function analyzeUnknownPatterns() {
  console.log('📊 Analisando padrões de unknown...\n');

  // Usar PowerShell para encontrar todos os usos de 'unknown' (Windows compatible)
  const psCmd = `Get-ChildItem -Path app,lib,domains,types -Include *.ts,*.tsx -Recurse | Select-String -Pattern "unknown" -CaseSensitive | Select-Object -First 200`;

  try {
    const output = execSync(psCmd, {
      cwd: projectRoot,
      encoding: 'utf8',
      shell: 'powershell.exe',
      stdio: 'pipe'
    });

    const lines = output.split('\n').filter(line => line.trim());

    for (const line of lines) {
      // PowerShell output format: file:line:content
      const match = line.match(/^(.+?):(\d+):\s*(.+)$/);
      if (!match) continue;

      const [, filePath, lineNum, content] = match;

      stats.totalUnknownUsages++;

      // Categorizar o padrão
      const category = categorizeUnknownUsage(content);
      stats.categories[category]++;

      // Registrar padrão para análise
      stats.patterns.push({
        file: filePath.replace(projectRoot + '\\', '').replace(/\\/g, '/'),
        line: parseInt(lineNum),
        content: content.trim(),
        category: category
      });
    }

    console.log(`✅ Processadas ${lines.length} linhas com 'unknown'`);

  } catch (error) {
    console.log('❌ Erro na análise:', error.message);
    console.log('Tentando método alternativo...');

    // Fallback: usar Node.js para análise direta
    analyzeWithNode();
  }
}

function analyzeWithNode() {
  console.log('🔄 Usando análise alternativa com Node.js...');

  // Analisar diretamente os arquivos conhecidos (sem glob para evitar dependências)
  const dirs = ['app', 'lib', 'domains', 'types'];
  let processedFiles = 0;

  function processDirectory(dir) {
    try {
      const fullDir = join(projectRoot, dir);
      const files = require('fs').readdirSync(fullDir, { withFileTypes: true });

      for (const file of files) {
        const fullPath = join(fullDir, file.name);

        if (file.isDirectory()) {
          // Recursão para subdiretórios
          processDirectory(join(dir, file.name));
        } else if (file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
          processedFiles++;
          const content = readFileSync(fullPath, 'utf8');
          const lines = content.split('\n');

          lines.forEach((line, index) => {
            if (line.includes('unknown')) {
              stats.totalUnknownUsages++;

              const category = categorizeUnknownUsage(line);
              stats.categories[category]++;

              stats.patterns.push({
                file: join(dir, file.name),
                line: index + 1,
                content: line.trim(),
                category: category
              });
            }
          });
        }
      }
    } catch (error) {
      // Ignore directory errors
    }
  }

  dirs.forEach(dir => processDirectory(dir));

  stats.totalFiles = processedFiles;
  console.log(`📁 Analisados ${processedFiles} arquivos`);
}

function categorizeUnknownUsage(content) {
  // API Responses
  if (content.includes('response') ||
      content.includes('fetch') ||
      content.includes('api') ||
      content.includes('http')) {
    return 'apiResponses';
  }

  // DOM Elements
  if (content.includes('Element') ||
      content.includes('HTMLElement') ||
      content.includes('HTML') ||
      content.includes('document.') ||
      content.includes('window.')) {
    return 'domElements';
  }

  // Function Parameters
  if (content.includes('=>') ||
      content.includes('function') ||
      content.includes('(unknown') ||
      content.match(/:\s*unknown[,)]/)) {
    return 'functionParams';
  }

  // Object Properties
  if (content.includes('.unknown') ||
      content.includes('as unknown') ||
      content.includes('unknown.') ||
      content.includes('Record<string, unknown>')) {
    return 'objectProps';
  }

  // Type Assertions
  if (content.includes(' as unknown') ||
      content.includes('unknown as ')) {
    return 'typeAssertions';
  }

  return 'other';
}

function generateReport() {
  console.log('📈 RELATÓRIO DE ANÁLISE:');
  console.log('━'.repeat(40));

  console.log(`📁 Total de arquivos analisados: ${stats.totalFiles}`);
  console.log(`🔍 Arquivos com unknown: ${stats.filesWithUnknown}`);
  console.log(`🎯 Total de usos de unknown: ${stats.totalUnknownUsages}`);
  console.log();

  console.log('📊 DISTRIBUIÇÃO POR CATEGORIA:');
  Object.entries(stats.categories).forEach(([category, count]) => {
    const percentage = ((count / stats.totalUnknownUsages) * 100).toFixed(1);
    console.log(`   ${category}: ${count} (${percentage}%)`);
  });
  console.log();

  console.log('🔍 TOP 10 PADRÕES MAIS FREQUENTES:');
  const patternCounts = {};
  stats.patterns.forEach(pattern => {
    const key = `${pattern.category}:${pattern.content.substring(0, 50)}`;
    patternCounts[key] = (patternCounts[key] || 0) + 1;
  });

  Object.entries(patternCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([pattern, count]) => {
      console.log(`   ${count}x: ${pattern}`);
    });

  console.log();
  console.log('🎯 PRÓXIMOS PASSOS BASEADOS NA ANÁLISE:');
  console.log('━'.repeat(40));

  // Recomendações baseadas nos dados
  const topCategory = Object.entries(stats.categories)
    .sort(([,a], [,b]) => b - a)[0][0];

  console.log(`1. Priorizar categoria: ${topCategory} (${stats.categories[topCategory]} ocorrências)`);

  if (stats.categories.apiResponses > 0) {
    console.log('2. Criar tipos específicos para respostas de API');
  }

  if (stats.categories.domElements > 0) {
    console.log('3. Usar tipos específicos do DOM em vez de unknown');
  }

  if (stats.categories.functionParams > 0) {
    console.log('4. Implementar type guards para parâmetros de função');
  }

  if (stats.categories.objectProps > 0) {
    console.log('5. Criar interfaces específicas para objetos');
  }

  console.log('6. Reabilitar opções strict gradualmente');
  console.log('7. Validar correções com build e testes');

  // Salvar relatório detalhado
  const reportPath = join(projectRoot, 'phase-2-analysis-report.json');
  writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    stats,
    patterns: stats.patterns.slice(0, 50) // Top 50 para análise
  }, null, 2));

  console.log(`\n💾 Relatório salvo em: phase-2-analysis-report.json`);
}

function showActionPlan() {
  console.log('\n🎯 PLANO DE AÇÃO PARA FASE 2:');
  console.log('━'.repeat(40));

  const priorityOrder = Object.entries(stats.categories)
    .sort(([,a], [,b]) => b - a)
    .map(([category]) => category);

  console.log('📅 SEMANA 1: CORREÇÕES POR CATEGORIA');
  priorityOrder.slice(0, 2).forEach((category, index) => {
    console.log(`   Dia ${index + 1}: ${category} (${stats.categories[category]} ocorrências)`);
  });

  console.log('📅 SEMANA 2: STRICT OPTIONS + VALIDAÇÃO');
  priorityOrder.slice(2).forEach((category, index) => {
    console.log(`   Dia ${index + 3}: ${category} + opções strict`);
  });

  console.log('\n⏱️ TIMELINE ESTIMADO: 10 dias úteis');
  console.log('🎯 Meta: 60% dos tipos unknown corrigidos');
}

// Execução principal
analyzeUnknownPatterns();
generateReport();
showActionPlan();

console.log('\n✅ ANÁLISE CONCLUÍDA!');
console.log('🚀 Pronto para iniciar correções por categoria.');
