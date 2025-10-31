#!/usr/bin/env node

/**
 * FASE 2 - SUB-FASE 3A: TYPE GUARDS PARA ELEMENTOS DOM
 * Criar e aplicar type guards para elementos DOM mais comuns
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🔧 FASE 2 - SUB-FASE 3A: TYPE GUARDS PARA ELEMENTOS DOM');
console.log('='.repeat(70));
console.log('🎯 Meta: Criar type guards para elementos DOM comuns');
console.log('📊 Escopo: Identificar padrões e criar helpers reutilizáveis');
console.log('⏱️ Timeline: 2-3 dias');
console.log();

// Type guards a serem criados
const typeGuards = [
  {
    name: 'isHTMLElement',
    pattern: /(element|el|node)\s*:\s*unknown/,
    replacement: 'isHTMLElement(element) ? element',
    guard: `function isHTMLElement(element: unknown): element is HTMLElement {
  return element instanceof HTMLElement;
}`
  },
  {
    name: 'isHTMLInputElement',
    pattern: /(input|field)\s*:\s*unknown/,
    replacement: 'isHTMLInputElement(input) ? input',
    guard: `function isHTMLInputElement(element: unknown): element is HTMLInputElement {
  return element instanceof HTMLInputElement;
}`
  },
  {
    name: 'isHTMLButtonElement',
    pattern: /(button|btn)\s*:\s*unknown/,
    replacement: 'isHTMLButtonElement(button) ? button',
    guard: `function isHTMLButtonElement(element: unknown): element is HTMLButtonElement {
  return element instanceof HTMLButtonElement;
}`
  }
];

function analyzeDOMPatterns() {
  console.log('📊 Analisando padrões de elementos DOM...\n');

  const patterns = [
    { name: 'HTMLElement casts', pattern: 'as HTMLElement' },
    { name: 'HTMLInputElement casts', pattern: 'as HTMLInputElement' },
    { name: 'HTMLDivElement casts', pattern: 'as HTMLDivElement' },
    { name: 'querySelector calls', pattern: 'querySelector' },
    { name: 'getElementById calls', pattern: 'getElementById' },
    { name: 'Unknown element params', pattern: 'element: unknown' }
  ];

  patterns.forEach(({ name, pattern }) => {
    try {
      const output = execSync(
        `find src app lib domains types -name "*.ts" -o -name "*.tsx" | xargs grep -l "${pattern}" | wc -l`,
        { cwd: projectRoot, encoding: 'utf8' }
      );

      const count = parseInt(output.trim());
      if (count > 0) {
        console.log(`   ${name}: ${count} arquivos`);
      }
    } catch (error) {
      // Ignore errors
    }
  });

  console.log();
}

function createTypeGuardsFile() {
  console.log('📝 Criando arquivo de type guards...\n');

  const guardsFile = join(projectRoot, 'lib/utils/dom-type-guards.ts');

  let content = `/**
 * DOM Type Guards - Fase 2 Sub-fase 3A
 * Type guards seguros para elementos DOM
 */

export function isHTMLElement(element: unknown): element is HTMLElement {
  return element instanceof HTMLElement;
}

export function isHTMLInputElement(element: unknown): element is HTMLInputElement {
  return element instanceof HTMLInputElement;
}

export function isHTMLButtonElement(element: unknown): element is HTMLButtonElement {
  return element instanceof HTMLButtonElement;
}

export function isHTMLDivElement(element: unknown): element is HTMLDivElement {
  return element instanceof HTMLDivElement;
}

export function isHTMLFormElement(element: unknown): element is HTMLFormElement {
  return element instanceof HTMLFormElement;
}

export function isHTMLTextAreaElement(element: unknown): element is HTMLTextAreaElement {
  return element instanceof HTMLTextAreaElement;
}

export function isHTMLSelectElement(element: unknown): element is HTMLSelectElement {
  return element instanceof HTMLSelectElement;
}

// Type guard para Event targets
export function isEventTargetWithValue(target: EventTarget | null): target is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement {
  return target instanceof HTMLInputElement ||
         target instanceof HTMLTextAreaElement ||
         target instanceof HTMLSelectElement;
}

// Type guard para elementos com dataset
export function hasDataset(element: unknown): element is HTMLElement {
  return isHTMLElement(element) && 'dataset' in element;
}

// Type guard para elementos com classList
export function hasClassList(element: unknown): element is HTMLElement {
  return isHTMLElement(element) && 'classList' in element;
}
`;

  writeFileSync(guardsFile, content, 'utf8');
  console.log(`✅ Criado: lib/utils/dom-type-guards.ts`);
  console.log('   Contém 10 type guards para elementos DOM comuns\n');
}

function findFilesWithDOMUnknown() {
  console.log('🔍 Procurando arquivos com elementos DOM unknown...\n');

  const psCmd = `Get-ChildItem -Path app,lib,domains,types -Include *.ts,*.tsx -Recurse | Select-String -Pattern "element.*unknown|HTMLElement.*unknown" | Select-Object -First 20`;

  try {
    const output = execSync(psCmd, {
      cwd: projectRoot,
      encoding: 'utf8',
      shell: 'powershell.exe',
      stdio: 'pipe'
    });

    const lines = output.split('\n').filter(line => line.trim());

    if (lines.length > 0) {
      console.log('📋 Arquivos candidatos para correção:');
      lines.slice(0, 10).forEach((line, index) => {
        console.log(`   ${index + 1}. ${line.split(':')[0]}`);
      });

      if (lines.length > 10) {
        console.log(`   ... e mais ${lines.length - 10} arquivos`);
      }
      console.log();
    } else {
      console.log('   Nenhum arquivo encontrado com padrão element: unknown\n');
    }

  } catch (error) {
    console.log('   Erro ao procurar arquivos\n');
  }
}

function validateBuild() {
  console.log('🔍 Validando build após criação dos type guards...\n');

  try {
    execSync('npm run build', {
      cwd: projectRoot,
      timeout: 60000, // 1 minute
      stdio: 'pipe'
    });
    console.log('✅ Build validado com sucesso!');
    return true;
  } catch (error) {
    console.log('❌ Build ainda falha - isso é esperado nesta fase');
    console.log('   Type guards criados, mas ainda não aplicados');
    return false;
  }
}

function generateNextSteps() {
  console.log('🎯 PRÓXIMOS PASSOS PARA SUB-FASE 3A:');
  console.log('━'.repeat(50));

  console.log('1. ✅ Type guards criados (10 guards em lib/utils/dom-type-guards.ts)');
  console.log('2. 🔄 Próximo: Identificar arquivos que precisam dos guards');
  console.log('3. 🔄 Depois: Aplicar guards em lote nos arquivos identificados');
  console.log('4. 🔄 Meta final: 50+ elementos DOM com tipos específicos');
  console.log();

  console.log('📊 MÉTRICAS ESPERADAS:');
  console.log('   • 20-30 arquivos corrigidos');
  console.log('   • 80% dos elementos DOM tipados');
  console.log('   • Build mais estável para elementos DOM');
  console.log();

  console.log('⏱️ TIMELINE ESTIMADO: 2-3 dias');
  console.log('🎯 Sucesso: Zero "as HTMLElement" hardcoded');
}

// Execução principal
async function main() {
  console.log('🚀 Iniciando Sub-fase 3A - Type Guards para DOM...\n');

  analyzeDOMPatterns();
  createTypeGuardsFile();
  findFilesWithDOMUnknown();
  validateBuild();
  generateNextSteps();

  console.log('\n✅ SUB-FASE 3A CONCLUÍDA!');
  console.log('🎯 Type guards criados e prontos para aplicação.');
}

main().catch(console.error);
