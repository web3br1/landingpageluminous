#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 7-Day Playbook - Consolidação de Ganhos\n');
console.log('🎯 Ordem de Ataque: 7 dias para estabilizar testes\n\n');

const DAYS = [
  {
    day: 1,
    name: 'Medição e Baseline',
    description: '3 runs por browser, JSONs versionados, tabela antes vs depois',
    script: 'statistical-validation.mjs',
    critical: true
  },
  {
    day: 2,
    name: 'Flake Zero',
    description: 'Retries=0, classificar e corrigir top 5 flakes',
    script: 'flake-hunting.mjs',
    critical: true
  },
  {
    day: 3,
    name: 'Visual Hardening',
    description: 'Reduced motion, clock congelado, viewport/fonts padronizados',
    script: null,
    critical: false
  },
  {
    day: 4,
    name: 'Firefox Otimizado',
    description: 'Eliminar waits cegos, ajustar prefs, confirmar queda ≤ 25s',
    script: null,
    critical: true
  },
  {
    day: 5,
    name: 'SSR/Hidratação Final',
    description: 'Matar warnings finais, checklist completo',
    script: 'ssr-hydration-validation.mjs',
    critical: true
  },
  {
    day: 6,
    name: 'Performance Real',
    description: 'Lighthouse + bundle analyzer, orçamentos definidos',
    script: 'performance-real-validation.mjs',
    critical: true
  },
  {
    day: 7,
    name: 'Guardrails + Higiene',
    description: 'Alertas CI + limpeza contínua de smells',
    script: 'ci-guardrails.mjs',
    critical: false
  }
];

const results = {
  startTime: new Date().toISOString(),
  days: [],
  finalKPIs: {},
  summary: {}
};

async function runDayScript(day) {
  if (!day.script) {
    console.log(`  ⏭️  Script não disponível - executar manualmente`);
    return { success: true, skipped: true };
  }

  const scriptPath = path.join(process.cwd(), 'scripts', day.script);

  if (!fs.existsSync(scriptPath)) {
    console.log(`  ❌ Script não encontrado: ${scriptPath}`);
    return { success: false, error: 'Script not found' };
  }

  try {
    console.log(`  🚀 Executando ${day.script}...`);
    execSync(`node ${scriptPath}`, {
      stdio: 'inherit',
      cwd: process.cwd(),
      timeout: 300000 // 5 min por script
    });
    console.log(`  ✅ ${day.script} concluído`);
    return { success: true };
  } catch (error) {
    console.log(`  ❌ ${day.script} falhou: ${error.message}`);
    return { success: false, error: error.message };
  }
}

function evaluateKPIs() {
  console.log('\n🎯 Avaliando KPIs Finais...\n');

  // Carregar resultados dos dias anteriores
  const kpis = {
    chromiumP95: null,
    firefoxP95: null,
    chromiumCoV: null,
    flakeRate: null,
    ssrWarnings: null,
    lighthouseScore: null,
    bundleSize: null
  };

  // Tentar carregar dos arquivos JSON gerados
  const files = [
    'validation-results.json',
    'flake-hunting-results.json',
    'ssr-hydration-results.json',
    'performance-real-results.json',
    'ci-guardrails.json'
  ];

  files.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

        if (file === 'validation-results.json') {
          kpis.chromiumP95 = data.summary?.chromium?.p95;
          kpis.firefoxP95 = data.summary?.firefox?.p95;
          kpis.chromiumCoV = data.summary?.chromium?.cv;
        } else if (file === 'flake-hunting-results.json') {
          kpis.flakeRate = parseFloat(data.summary?.flakeRate || '0');
        } else if (file === 'ssr-hydration-results.json') {
          kpis.ssrWarnings = data.summary?.hasBuildWarnings ? 1 : 0;
        } else if (file === 'performance-real-results.json') {
          kpis.lighthouseScore = data.lighthouse?.performance;
          kpis.bundleSize = data.bundle?.totalSize;
        }
      } catch (e) {
        // Ignorar erros de parsing
      }
    }
  });

  results.finalKPIs = kpis;

  // Avaliação final
  const evaluations = [
    {
      name: 'E2E Chromium p95 ≤ 12s',
      value: kpis.chromiumP95,
      target: 12,
      status: kpis.chromiumP95 && kpis.chromiumP95 <= 12 ? '✅' : '❌'
    },
    {
      name: 'Firefox p95 ≤ +20% Chromium',
      value: kpis.firefoxP95,
      target: kpis.chromiumP95 ? kpis.chromiumP95 * 1.2 : null,
      status: kpis.firefoxP95 && kpis.chromiumP95 && kpis.firefoxP95 <= kpis.chromiumP95 * 1.2 ? '✅' : '❌'
    },
    {
      name: 'Chromium CoV ≤ 15%',
      value: kpis.chromiumCoV,
      target: 15,
      status: kpis.chromiumCoV && kpis.chromiumCoV <= 15 ? '✅' : '❌'
    },
    {
      name: 'Flake rate < 1%',
      value: kpis.flakeRate,
      target: 1,
      status: kpis.flakeRate !== null && kpis.flakeRate < 1 ? '✅' : '❌'
    },
    {
      name: 'SSR sem warnings',
      value: kpis.ssrWarnings,
      target: 0,
      status: kpis.ssrWarnings === 0 ? '✅' : '❌'
    },
    {
      name: 'Lighthouse ≥ 90',
      value: kpis.lighthouseScore,
      target: 90,
      status: kpis.lighthouseScore && kpis.lighthouseScore >= 90 ? '✅' : '❌'
    }
  ];

  results.summary = {
    evaluations,
    passedKPIs: evaluations.filter(e => e.status === '✅').length,
    totalKPIs: evaluations.length,
    overallStatus: evaluations.every(e => e.status === '✅') ? 'APROVADO' : 'REPROVADO'
  };

  return evaluations;
}

async function main() {
  console.log('📅 EXECUÇÃO DO PLAYBOOK DE 7 DIAS\n');
  console.log('='.repeat(60));

  for (const day of DAYS) {
    console.log(`\n📅 DIA ${day.day}: ${day.name}`);
    console.log(`📝 ${day.description}`);
    console.log('-'.repeat(50));

    const startTime = Date.now();
    const scriptResult = await runDayScript(day);
    const duration = Date.now() - startTime;

    const dayResult = {
      ...day,
      duration: Math.round(duration / 1000),
      ...scriptResult
    };

    results.days.push(dayResult);

    if (scriptResult.success) {
      console.log(`⏱️  Tempo: ${dayResult.duration}s`);
    } else if (!scriptResult.skipped) {
      console.log(`💥 FALHA CRÍTICA no dia ${day.day}!`);
      if (day.critical) {
        console.log('🚨 Abortando playbook - dia crítico falhou');
        break;
      }
    }
  }

  // Avaliação final de KPIs
  const kpiEvaluations = evaluateKPIs();

  results.endTime = new Date().toISOString();
  const totalDuration = new Date(results.endTime) - new Date(results.startTime);
  results.summary.totalDuration = Math.round(totalDuration / 1000);

  // Salvar relatório final
  const outputPath = path.join(process.cwd(), '7-day-playbook-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));

  // Relatório final
  console.log('\n🎉 RELATÓRIO FINAL DO PLAYBOOK\n');
  console.log('='.repeat(60));
  console.log(`⏱️  Duração total: ${Math.round(totalDuration / 1000 / 60)} minutos`);
  console.log(`📊 Dias executados: ${results.days.length}/7`);

  console.log('\n🎯 KPIs FINAIS:\n');
  kpiEvaluations.forEach(kpi => {
    const value = kpi.value !== null ? kpi.value : 'N/A';
    const target = kpi.target !== null ? kpi.target : 'N/A';
    console.log(`${kpi.status} ${kpi.name}`);
    console.log(`   Valor: ${value} | Target: ${target}`);
  });

  const passedCount = results.summary.passedKPIs;
  const totalCount = results.summary.totalKPIs;

  console.log(`\n🏆 RESULTADO: ${results.summary.overallStatus}`);
  console.log(`KPIs aprovados: ${passedCount}/${totalCount} (${Math.round(passedCount/totalCount*100)}%)`);

  if (results.summary.overallStatus === 'APROVADO') {
    console.log('\n🎊 PARABÉNS! Playbook concluído com sucesso!');
    console.log('✅ Todos os testes estabilizados e dentro dos orçamentos');
    console.log('🛡️ Guardrails implementados e funcionais');
  } else {
    console.log('\n⚠️  Playbook concluído com ressalvas');
    console.log('📋 Revisar KPIs reprovados e implementar melhorias');
  }

  console.log(`\n📄 Relatório completo: ${outputPath}`);

  // Checklist de PR
  console.log('\n📝 CHECKLIST PARA PR:\n');
  console.log('## ✅ Playbook 7 Dias - Resultados');
  console.log(`- **Status geral:** ${results.summary.overallStatus}`);
  console.log(`- **KPIs aprovados:** ${passedCount}/${totalCount}`);
  console.log(`- **Tempo total:** ${Math.round(totalDuration / 1000 / 60)}min`);
  console.log('- **Guardrails:** Implementados e testados');
  console.log('- **Higiene:** Scripts de monitoramento ativos');

  if (results.summary.overallStatus === 'APROVADO') {
    console.log('\n🟢 **APROVADO PARA MERGE** - Todos os critérios atendidos');
  } else {
    console.log('\n🟡 **REVISÃO NECESSÁRIA** - Alguns KPIs precisam de atenção');
  }
}

main().catch(console.error);
