import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const SRC_DIR = path.join(process.cwd());
const INVENTORY_PATH = path.join(SRC_DIR, 'quality-audit/integrations-inventory.json');
const inventory = JSON.parse(fs.readFileSync(INVENTORY_PATH, 'utf8'));

// Simular a função de coleta de sinais (versão simplificada para debug)
function collectSignals(filePath, itemType, itemName) {
  const signals = {
    lastModified: null,
    ageInDays: null,
    hasTodoWip: false,
    hasFeatureFlag: false,
    intendedForRelease: false,
    hasTests: false,
    hasTestMentions: false,
    isInRegistry: false,
    isExposedExternally: false,
    generatesCost: false,
    generatesRisk: false,
    isDevOnly: false,
    hasRealLogic: false,
    hasSecurityCheck: false,
    hasLogging: false,
    fileSize: 0,
    lineCount: 0
  };

  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      signals.lastModified = stats.mtime;
      signals.fileSize = stats.size;

      const ageMs = Date.now() - stats.mtime.getTime();
      signals.ageInDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));

      const content = fs.readFileSync(filePath, 'utf8');
      signals.lineCount = content.split('\n').length;

      // Sinais de intenção
      signals.hasTodoWip = /TODO|WIP|FIXME|HACK|@todo|@hack/i.test(content);
      signals.hasFeatureFlag = /feature-flag|FEATURE_FLAG|experimental|EXPERIMENTAL/i.test(content);
      signals.intendedForRelease = /@intent release|@production|@live/i.test(content);

      // Análise semântica
      signals.isDevOnly = /mock|test|debug|playground|stub|dummy/i.test(content);
      signals.hasRealLogic = /import.*from|\.create\(|\.find\(|\.update\(|\.delete\(|\.query\(|await|async|function|class/i.test(content);
      signals.hasSecurityCheck = /auth|token|session|admin|role|permission|authorize|authenticate/i.test(content);
      signals.hasLogging = /console\.|log\(|logger\.|winston|bunyan/i.test(content);

      console.log('Conteúdo do arquivo (primeiras 20 linhas):');
      console.log('='.repeat(50));
      console.log(content.split('\n').slice(0, 20).join('\n'));
      console.log('='.repeat(50));
    }
  } catch (error) {
    console.error('Erro:', error.message);
  }

  return signals;
}

// Analisar um endpoint específico
const endpointPath = 'app/api/admin/composition-metrics/route.ts';
console.log(`🔍 Analisando endpoint: ${endpointPath}`);
console.log('='.repeat(60));

const signals = collectSignals(endpointPath, 'route', '/admin/composition-metrics');

console.log('\n📊 SINAIS COLETADOS:');
console.log('='.repeat(30));
Object.entries(signals).forEach(([key, value]) => {
  console.log(`${key}: ${value}`);
});

console.log('\n🎯 CLASSIFICAÇÃO ESPERADA:');
console.log('='.repeat(30));

// Simular a lógica de classificação
const {
  ageInDays,
  hasTodoWip,
  hasFeatureFlag,
  intendedForRelease,
  hasTests,
  hasTestMentions,
  isInRegistry,
  isExposedExternally,
  generatesCost,
  generatesRisk,
  isDevOnly,
  hasRealLogic,
  hasSecurityCheck,
  hasLogging
} = signals;

// Lógica simplificada
let classification = 'CONGELADO'; // default

if (ageInDays !== null && ageInDays <= 14) {
  classification = 'EM_ANDAMENTO';
  console.log('✅ Regra 1: Última modificação ≤ 14 dias');
} else if (hasTodoWip || hasFeatureFlag) {
  classification = 'EM_ANDAMENTO';
  console.log('✅ Regra 2: Intenção explícita (TODO/WIP/feature-flag)');
} else if (intendedForRelease) {
  classification = 'EM_ANDAMENTO';
  console.log('✅ Regra 2.1: Autorização explícita para release');
} else if (hasTests || hasTestMentions) {
  classification = 'EM_ANDAMENTO';
  console.log('✅ Regra 3: Existe teste específico ou menção');
} else if (isInRegistry) {
  classification = 'EM_ANDAMENTO';
  console.log('✅ Regra 4: Registrado em arquitetura');
} else if (isExposedExternally) {
  classification = 'EM_ANDAMENTO';
  console.log('✅ Regra 5: Exposto externamente');
} else if (hasRealLogic && !isDevOnly) {
  classification = 'EM_ANDAMENTO';
  console.log('✅ Regra 6: Possui lógica real (não é placeholder)');
} else {
  console.log('❌ Nenhuma regra de EM_ANDAMENTO ativada');
}

// Verificar regras de OBSOLETO
if (ageInDays !== null && ageInDays > 45 &&
    !hasTodoWip && !hasFeatureFlag && !hasTests && !hasTestMentions &&
    !isExposedExternally && !isInRegistry) {
  classification = 'OBSOLETO';
  console.log('🗑️ Regra OBSOLETO: Muito antigo sem sinais');
}

console.log(`\n🏷️ CLASSIFICAÇÃO FINAL: ${classification}`);
