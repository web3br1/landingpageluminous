#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🎯 Test Impact Analysis (TIA) - Testes Inteligentes por Diff\n');

// Mapeamento de arquivos para testes afetados
const IMPACT_MAPPING = {
  // Frontend components
  'components/': {
    tests: ['**/visual-regression*.spec.ts'],
    reason: 'Mudanças em componentes afetam testes visuais'
  },
  'app/(marketing)/': {
    tests: ['**/critical-flows-e2e.spec.ts', '**/visual-regression-enhanced.spec.ts'],
    reason: 'Mudanças na landing page afetam fluxos críticos e visual'
  },
  'lib/composition/': {
    tests: ['**/ssr.test.ts', '**/hydration.test.ts'],
    reason: 'Mudanças na composição afetam SSR e hidratação'
  },

  // Backend/API
  'api/': {
    tests: ['**/critical-flows-e2e.spec.ts'],
    reason: 'Mudanças em APIs afetam fluxos E2E'
  },

  // Configuration
  'lib/test-helpers.ts': {
    tests: ['**/*.spec.ts', '**/*.test.ts'],
    reason: 'Mudanças nos helpers afetam todos os testes'
  },
  'playwright.config.ts': {
    tests: ['**/*.spec.ts', '**/*.test.ts'],
    reason: 'Mudanças na configuração afetam todos os testes'
  },

  // Dependencies
  'package.json': {
    tests: ['**/hydration.test.ts', '**/ssr.test.ts'],
    reason: 'Mudanças de dependências podem afetar hidratação/SSR'
  }
};

// Tipos de mudança e seu impacto
const CHANGE_IMPACTS = {
  'added': { level: 'medium', tests: 'selective' },
  'modified': { level: 'high', tests: 'selective' },
  'deleted': { level: 'critical', tests: 'full' },
  'renamed': { level: 'high', tests: 'selective' }
};

// Arquivos críticos que sempre exigem testes completos
const CRITICAL_FILES = [
  'lib/composition/services/page-composition-service.ts',
  'lib/test-helpers.ts',
  'playwright.config.ts',
  'package.json',
  'qa-policy.md'
];

function getGitDiff() {
  try {
    // Comparar com branch principal
    const diff = execSync('git diff --name-status origin/main', {
      encoding: 'utf8',
      cwd: process.cwd()
    });

    return diff.trim().split('\n')
      .filter(line => line.trim())
      .map(line => {
        const [status, file] = line.split('\t');
        return { status, file };
      });
  } catch (error) {
    console.warn('Não foi possível obter diff do git, assumindo mudanças locais');
    return [];
  }
}

function analyzeImpact(changedFiles) {
  const impact = {
    critical: false,
    affectedTests: new Set(),
    reasons: [],
    coverage: {
      unit: false,
      integration: false,
      e2e: false,
      visual: false
    }
  };

  for (const change of changedFiles) {
    const { status, file } = change;
    const changeType = status.trim();

    // Verificar arquivos críticos
    if (CRITICAL_FILES.some(critical => file.includes(critical))) {
      impact.critical = true;
      impact.reasons.push(`Arquivo crítico modificado: ${file}`);
      impact.affectedTests.add('**/*.spec.ts');
      impact.affectedTests.add('**/*.test.ts');
      continue;
    }

    // Analisar impacto baseado no mapeamento
    for (const [pattern, mapping] of Object.entries(IMPACT_MAPPING)) {
      if (file.includes(pattern)) {
        mapping.tests.forEach(test => impact.affectedTests.add(test));
        impact.reasons.push(`${mapping.reason}: ${file}`);

        // Categorizar cobertura
        if (test.includes('hydration') || test.includes('ssr')) {
          impact.coverage.unit = true;
        }
        if (test.includes('critical-flows')) {
          impact.coverage.e2e = true;
        }
        if (test.includes('visual-regression')) {
          impact.coverage.visual = true;
        }
      }
    }

    // Considerar tipo da mudança
    const impactLevel = CHANGE_IMPACTS[changeType]?.level || 'medium';
    if (impactLevel === 'critical') {
      impact.critical = true;
    }
  }

  return impact;
}

function generateTestStrategy(impact, changedFiles) {
  const strategy = {
    recommendation: '',
    requiredTests: [],
    optionalTests: [],
    estimatedTime: 0,
    confidence: 0
  };

  if (impact.critical) {
    strategy.recommendation = 'EXECUTAR TESTES COMPLETOS - Mudanças críticas detectadas';
    strategy.requiredTests = ['**/*.spec.ts', '**/*.test.ts'];
    strategy.estimatedTime = 15; // minutos
    strategy.confidence = 0.95;
  } else if (impact.affectedTests.size > 0) {
    strategy.recommendation = 'EXECUTAR TESTES SELETIVOS - Impacto limitado identificado';
    strategy.requiredTests = Array.from(impact.affectedTests);
    strategy.estimatedTime = Math.min(8, impact.affectedTests.size * 2);
    strategy.confidence = 0.85;

    // Testes opcionais para cobertura adicional
    if (!impact.coverage.e2e && changedFiles.some(c => c.file.includes('app/'))) {
      strategy.optionalTests.push('**/critical-flows-e2e.spec.ts');
    }
  } else {
    strategy.recommendation = 'TESTES MÍNIMOS - Mudanças não impactam testes conhecidos';
    strategy.requiredTests = ['**/hydration.test.ts', '**/ssr.test.ts'];
    strategy.estimatedTime = 3;
    strategy.confidence = 0.7;
  }

  return strategy;
}

function generateCIConfig(strategy, impact) {
  const ciConfig = {
    jobs: []
  };

  // Job principal
  ciConfig.jobs.push({
    name: 'test-impact-analysis',
    'runs-on': 'ubuntu-latest',
    steps: [
      { uses: 'actions/checkout@v3' },
      {
        name: 'Install dependencies',
        run: 'npm ci'
      },
      {
        name: 'Run TIA Analysis',
        run: 'node scripts/test-impact-analysis.mjs'
      }
    ]
  });

  // Job de testes baseado na estratégia
  if (strategy.requiredTests.length > 0) {
    ciConfig.jobs.push({
      name: 'run-impacted-tests',
      needs: 'test-impact-analysis',
      'runs-on': 'ubuntu-latest',
      steps: [
        { uses: 'actions/checkout@v3' },
        {
          name: 'Install dependencies',
          run: 'npm ci'
        },
        {
          name: 'Run Required Tests',
          run: `npx playwright test ${strategy.requiredTests.map(t => \`--grep="${t}"\`).join(' ')} --workers=2`
        }
      ]
    });
  }

  // Job opcional se houver testes opcionais
  if (strategy.optionalTests.length > 0) {
    ciConfig.jobs.push({
      name: 'run-optional-tests',
      needs: 'run-impacted-tests',
      'runs-on': 'ubuntu-latest',
      'if': 'success()', // Só roda se os obrigatórios passarem
      steps: [
        { uses: 'actions/checkout@v3' },
        {
          name: 'Install dependencies',
          run: 'npm ci'
        },
        {
          name: 'Run Optional Tests',
          run: `npx playwright test ${strategy.optionalTests.map(t => \`--grep="${t}"\`).join(' ')} --workers=1`
        }
      ]
    });
  }

  return ciConfig;
}

async function main() {
  console.log('🎯 Executando Test Impact Analysis...\n');

  // 1. Obter mudanças do git
  const changedFiles = getGitDiff();
  console.log(`📝 Arquivos modificados: ${changedFiles.length}`);
  changedFiles.forEach(change => {
    console.log(`   ${change.status} ${change.file}`);
  });
  console.log();

  // 2. Analisar impacto
  const impact = analyzeImpact(changedFiles);

  console.log('🔍 ANÁLISE DE IMPACTO:');
  console.log(`   • Crítico: ${impact.critical ? 'SIM' : 'NÃO'}`);
  console.log(`   • Testes afetados: ${impact.affectedTests.size}`);
  console.log(`   • Razões: ${impact.reasons.length}`);
  impact.reasons.forEach(reason => console.log(`     - ${reason}`));
  console.log();

  // 3. Gerar estratégia de teste
  const strategy = generateTestStrategy(impact, changedFiles);

  console.log('🎯 ESTRATÉGIA RECOMENDADA:');
  console.log(`   ${strategy.recommendation}`);
  console.log(`   • Tempo estimado: ${strategy.estimatedTime}min`);
  console.log(`   • Confiança: ${(strategy.confidence * 100).toFixed(0)}%`);
  console.log(`   • Testes obrigatórios: ${strategy.requiredTests.length}`);
  strategy.requiredTests.forEach(test => console.log(`     - ${test}`));

  if (strategy.optionalTests.length > 0) {
    console.log(`   • Testes opcionais: ${strategy.optionalTests.length}`);
    strategy.optionalTests.forEach(test => console.log(`     - ${test}`));
  }
  console.log();

  // 4. Benefícios estimados
  const fullTestTime = 15; // minutos para suíte completa
  const speedup = ((fullTestTime - strategy.estimatedTime) / fullTestTime * 100).toFixed(1);

  console.log('🚀 BENEFÍCIOS ESTIMADOS:');
  console.log(`   • Redução de tempo: ${speedup}%`);
  console.log(`   • Tempo economizado: ${fullTestTime - strategy.estimatedTime}min`);
  console.log(`   • Cobertura mantida: ${(strategy.confidence * 100).toFixed(0)}%`);
  console.log();

  // 5. Gerar configuração CI
  const ciConfig = generateCIConfig(strategy, impact);
  const ciPath = path.join(process.cwd(), '.github', 'workflows', 'tia-ci.yml');
  const ciContent = `# Test Impact Analysis CI
# Gerado automaticamente por test-impact-analysis.mjs

${Object.entries(ciConfig).map(([key, value]) =>
  `${key}:\n${JSON.stringify(value, null, 2)}`
).join('\n')}`;

  // Criar diretório se não existir
  const ciDir = path.dirname(ciPath);
  if (!fs.existsSync(ciDir)) {
    fs.mkdirSync(ciDir, { recursive: true });
  }

  fs.writeFileSync(ciPath, ciContent);
  console.log(`📝 Configuração CI gerada: ${ciPath}`);

  // 6. Salvar análise completa
  const analysisPath = path.join(process.cwd(), 'tia-analysis.json');
  fs.writeFileSync(analysisPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    changes: changedFiles,
    impact,
    strategy,
    ciConfig
  }, null, 2));

  console.log(`📄 Análise completa salva: ${analysisPath}`);

  console.log('\n✅ Test Impact Analysis concluído!');
  console.log('\n💡 Como usar:');
  console.log('   1. O CI agora executará apenas os testes necessários');
  console.log('   2. Para desenvolvimento local: execute os testes sugeridos');
  console.log('   3. Monitore a cobertura para ajustar o mapeamento se necessário');
}

main().catch(console.error);
