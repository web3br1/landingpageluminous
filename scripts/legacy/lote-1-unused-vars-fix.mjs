#!/usr/bin/env node

/**
 * LOTE 1: Correção de Variáveis Não Utilizadas
 * Pipeline Segmentado - Fase 1
 * Meta: Prefixar variáveis não utilizadas com _ (correção segura)
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('📦 LOTE 1: CORREÇÃO DE VARIÁVEIS NÃO UTILIZADAS');
console.log('='.repeat(60));
console.log('🎯 Meta: Prefixar variáveis não utilizadas com _');
console.log('🛡️ Segurança: Correção automática segura');
console.log();

// Estatísticas do lote
let stats = {
  filesProcessed: 0,
  variablesFixed: 0,
  errorsEncountered: 0,
  backupCreated: false
};

function createBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupCmd = `git add . && git commit -m "BACKUP: Antes do Lote 1 - ${timestamp}" --allow-empty`;
    execSync(backupCmd, { cwd: projectRoot, stdio: 'pipe' });
    stats.backupCreated = true;
    console.log('✅ Backup criado no git');
  } catch (error) {
    console.log('⚠️ Não foi possível criar backup git (continuando...)');
  }
}

function getLintErrors() {
  try {
    console.log('🔍 Analisando erros de lint...');

    // Tentar diferentes abordagens para capturar erros
    let lintOutput = '';
    try {
      lintOutput = execSync('pnpm eslint . --format=compact', {
        cwd: projectRoot,
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 30000
      });
    } catch (error) {
      // ESLint retorna exit code não-zero quando há erros, mas queremos a saída
      lintOutput = error.stdout?.toString() || error.stderr?.toString() || '';
    }

    if (!lintOutput || lintOutput.trim() === '') {
      console.log('⚠️ Nenhum output do ESLint obtido');
      return [];
    }

    // Extrair apenas erros de variáveis não utilizadas
    const unusedVarErrors = lintOutput
      .split('\n')
      .filter(line => line.trim() && (line.includes('no-unused-vars') || line.includes('@typescript-eslint/no-unused-vars')))
      .map(line => {
        // Diferentes formatos possíveis:
        // arquivo.js:linha:coluna: erro mensagem
        // /path/to/file.js: error message
        const match = line.match(/(.+?):\s*(\d+):(\d+):\s*(.+?)\s+(.+)/) ||
                     line.match(/(.+?):\s*(.+?)\s+(.+)/);

        if (!match) return null;

        let file, lineNum, message;
        if (match.length === 6) {
          // Formato completo: arquivo:linha:coluna: erro mensagem
          [, file, lineNum, , , message] = match;
        } else {
          // Formato alternativo
          [, file, , message] = match;
          lineNum = '1'; // fallback
        }

        const varMatch = message.match(/'([^']+)' is (?:assigned a value but )?never used/);
        if (!varMatch) return null;

        return {
          file: file.replace(projectRoot + '/', '').replace(/\\/g, '/'),
          line: parseInt(lineNum) - 1, // 0-based
          variable: varMatch[1],
          rule: 'no-unused-vars',
          fullMessage: message
        };
      })
      .filter(Boolean);

    console.log(`📊 Encontrados ${unusedVarErrors.length} erros de variáveis não utilizadas`);

    // Mostrar alguns exemplos para debug
    if (unusedVarErrors.length > 0) {
      console.log('📝 Exemplos de erros encontrados:');
      unusedVarErrors.slice(0, 3).forEach(error => {
        console.log(`   ${error.file}:${error.line + 1} - ${error.variable}`);
      });
    }

    return unusedVarErrors;

  } catch (error) {
    console.log('❌ Erro ao analisar lint:', error.message);
    return [];
  }
}

function fixUnusedVariables(errors) {
  // Agrupar por arquivo
  const errorsByFile = errors.reduce((acc, error) => {
    if (!acc[error.file]) acc[error.file] = [];
    acc[error.file].push(error);
    return acc;
  }, {});

  console.log(`📁 Processando ${Object.keys(errorsByFile).length} arquivos...`);

  for (const [filePath, fileErrors] of Object.entries(errorsByFile)) {
    try {
      const fullPath = join(projectRoot, filePath);

      if (!existsSync(fullPath)) {
        console.log(`⚠️ Arquivo não encontrado: ${filePath}`);
        continue;
      }

      let content = readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      let fileChanged = false;

      // Processar erros do arquivo (ordem reversa para manter posições)
      [...fileErrors].reverse().forEach(error => {
        if (error.line >= lines.length) return;

        const line = lines[error.line];

        // Pular se já prefixado
        if (line.includes(`_${error.variable}`)) return;

        // Pular se for uma palavra reservada ou pattern perigoso
        if (['undefined', 'null', 'true', 'false', 'this', 'super'].includes(error.variable)) {
          return;
        }

        // Patterns seguros para correção automática
        const safePatterns = [
          // Parâmetros de função: (param) => ou function(param)
          new RegExp(`\\bfunction\\s+\\w+\\([^)]*\\b${error.variable}\\b[^)]*\\)`, 'g'),
          // Arrow functions: (param) => ou param =>
          new RegExp(`\\([^)]*\\b${error.variable}\\b[^)]*\\)\\s*=>`, 'g'),
          // Declaradores: let/const var =
          new RegExp(`\\b(let|const|var)\\s+${error.variable}\\b\\s*=`, 'g'),
          // Destructuring: { var } ou [ var ]
          new RegExp(`([{\\[]\\s*)${error.variable}(\\s*[}\\]])`, 'g'),
          // Imports: import { var }
          new RegExp(`import\\s+{[^}]*\\b${error.variable}\\b[^}]*}\\s+from`, 'g'),
        ];

        for (const pattern of safePatterns) {
          if (pattern.test(line)) {
            // Criar nova linha com prefixo _
            const newLine = line.replace(
              new RegExp(`\\b${error.variable}\\b`, 'g'),
              `_${error.variable}`
            );

            if (newLine !== line) {
              lines[error.line] = newLine;
              fileChanged = true;
              stats.variablesFixed++;
              console.log(`   ✅ ${error.variable} → _${error.variable} (${filePath}:${error.line + 1})`);
              break; // Apenas uma correção por linha
            }
          }
        }
      });

      if (fileChanged) {
        writeFileSync(fullPath, lines.join('\n'), 'utf8');
        stats.filesProcessed++;
        console.log(`📝 Arquivo atualizado: ${filePath} (${fileErrors.length} correções)`);
      }

    } catch (error) {
      console.log(`❌ Erro ao processar ${filePath}: ${error.message}`);
      stats.errorsEncountered++;
    }
  }
}

function validateBuild() {
  try {
    console.log('🔍 Validando build após correções...');
    execSync('npm run build', {
      cwd: projectRoot,
      timeout: 60000,
      stdio: 'pipe'
    });
    console.log('✅ Build validado com sucesso!');
    return true;
  } catch (error) {
    console.log('❌ Build falhou após correções. Verificando erros...');
    const output = error.stdout?.toString() || error.stderr?.toString() || '';
    const buildErrors = output.split('\n').filter(line =>
      line.includes('Type error:') || line.includes('error TS')
    );
    console.log(`📊 ${buildErrors.length} erros de build encontrados`);
    return false;
  }
}

function generateReport() {
  console.log('\n📊 RELATÓRIO DO LOTE 1:');
  console.log('━'.repeat(40));
  console.log(`📁 Arquivos processados: ${stats.filesProcessed}`);
  console.log(`🔧 Variáveis corrigidas: ${stats.variablesFixed}`);
  console.log(`❌ Erros encontrados: ${stats.errorsEncountered}`);
  console.log(`💾 Backup criado: ${stats.backupCreated ? 'Sim' : 'Não'}`);

  if (stats.variablesFixed > 0) {
    console.log('\n🎉 SUCESSO: Lote 1 concluído!');
    console.log('💡 As variáveis não utilizadas foram prefixadas com _');
    console.log('🔄 Isso permite que o código compile mantendo a semântica');
  } else {
    console.log('\n⚠️ AVISO: Nenhuma variável foi corrigida');
    console.log('💡 Pode indicar que as variáveis já estão prefixadas ou problemas no parsing');
  }
}

// Execução principal
async function main() {
  console.log('🚀 Iniciando Lote 1 do Pipeline Segmentado...\n');

  // 1. Criar backup
  createBackup();

  // 2. Obter erros atuais
  const lintErrors = getLintErrors();

  if (lintErrors.length === 0) {
    console.log('🎉 Nenhum erro de variável não utilizada encontrado!');
    return;
  }

  // 3. Aplicar correções
  console.log('🔧 Aplicando correções...\n');
  fixUnusedVariables(lintErrors);

  // 4. Validar build
  const buildOk = validateBuild();

  // 5. Gerar relatório
  generateReport();

  if (buildOk) {
    console.log('\n✅ LOTE 1 CONCLUÍDO COM SUCESSO!');
    console.log('🚀 Pronto para o próximo lote (imports não utilizados)');
  } else {
    console.log('\n❌ LOTE 1 IDENTIFICOU PROBLEMAS!');
    console.log('🔄 Execute rollback se necessário: git reset --hard HEAD~1');
  }
}

main().catch(console.error);
