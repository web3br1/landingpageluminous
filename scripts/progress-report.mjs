#!/usr/bin/env node

/**
 * 📊 PROGRESS REPORT - FASE 1 TDD
 * Relatório semanal de progresso da Fase 1
 * Executar toda sexta-feira para avaliação semanal
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class ProgressReport {
  constructor() {
    this.phase1Start = {
      eslintErrors: 2996,
      overallScore: 60,
      failingTests: 7,
      coverage: 0
    };

    this.targets = {
      eslintErrors: 1000,
      overallScore: 70,
      failingTests: 3,
      coverage: 10
    };

    // Dias da semana para análise histórica
    this.workDays = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
  }

  // Cores para output no terminal
  colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
  };

  colorize(text, color) {
    return `${this.colors[color]}${text}${this.colors.reset}`;
  }

  // Executa comando e retorna resultado seguro
  safeExec(command, fallback = 'N/A') {
    try {
      return execSync(command, { encoding: 'utf8', timeout: 30000 }).trim();
    } catch (error) {
      console.warn(`⚠️  Comando falhou: ${command}`);
      return fallback;
    }
  }

  // Coleta métricas atuais
  collectCurrentMetrics() {
    return {
      eslintErrors: this.getEslintErrors(),
      overallScore: this.getOverallScore(),
      failingTests: this.getFailingTests(),
      buildStatus: this.getBuildStatus(),
      timestamp: new Date()
    };
  }

  // Métodos de coleta de métricas (igual ao daily-status)
  getEslintErrors() {
    try {
      const result = this.safeExec('npx eslint . --format=json 2>/dev/null');
      if (result === 'N/A') return 'N/A';

      const eslintData = JSON.parse(result);
      return eslintData.reduce((total, file) => total + file.errorCount, 0);
    } catch (error) {
      return 'N/A';
    }
  }

  getBuildStatus() {
    const result = this.safeExec('npm run build 2>&1 | grep -c "error\\|Error\\|ERROR"', '0');
    return parseInt(result) === 0 ? '✅' : '❌';
  }

  getFailingTests() {
    try {
      const result = this.safeExec('npm test 2>&1 | grep -o "failed\\|❌" | wc -l', '0');
      return parseInt(result) || 0;
    } catch (error) {
      return 'N/A';
    }
  }

  getOverallScore() {
    try {
      const reportPath = 'tmp/complete-analysis-reports/';
      const files = fs.readdirSync(reportPath)
        .filter(f => f.startsWith('complete-analysis-'))
        .sort()
        .reverse();

      if (files.length > 0) {
        const latestReport = path.join(reportPath, files[0]);
        const report = JSON.parse(fs.readFileSync(latestReport, 'utf8'));
        return report.overallScore || 'N/A';
      }
    } catch (error) {
      // Ignora erro de leitura
    }
    return 'N/A';
  }

  // Calcula progresso semanal
  calculateWeeklyProgress(currentMetrics) {
    const progress = {};

    Object.keys(this.targets).forEach(metric => {
      const current = currentMetrics[metric];
      const start = this.phase1Start[metric];
      const target = this.targets[metric];

      if (current !== 'N/A' && start !== 'N/A') {
        const totalRange = target - start;
        const currentProgress = current - start;
        const percentage = Math.round((currentProgress / totalRange) * 100);

        progress[metric] = {
          current,
          start,
          target,
          progress: Math.max(0, Math.min(100, percentage)),
          remaining: isLowerBetter(metric) ? Math.max(0, current - target) : Math.max(0, target - current)
        };
      } else {
        progress[metric] = { current, start, target, progress: 'N/A', remaining: 'N/A' };
      }
    });

    return progress;
  }

  // Verifica se métrica é "menor é melhor"
  isLowerBetter(metric) {
    return ['eslintErrors', 'failingTests'].includes(metric);
  }

  // Gera status semanal
  generateWeeklyStatus(progress) {
    const status = {
      excellent: [],
      good: [],
      needsAttention: [],
      critical: []
    };

    Object.entries(progress).forEach(([metric, data]) => {
      const { progress: progressPercent } = data;

      if (progressPercent === 'N/A') {
        status.needsAttention.push(`${metric}: Dados insuficientes`);
        return;
      }

      if (progressPercent >= 90) {
        status.excellent.push(`${metric}: ${progressPercent}% completo`);
      } else if (progressPercent >= 70) {
        status.good.push(`${metric}: ${progressPercent}% - bom progresso`);
      } else if (progressPercent >= 40) {
        status.needsAttention.push(`${metric}: ${progressPercent}% - acelerar`);
      } else {
        status.critical.push(`${metric}: ${progressPercent}% - foco urgente`);
      }
    });

    return status;
  }

  // Gera análise da semana
  generateWeeklyAnalysis(progress, status) {
    const analysis = [];

    // Análise geral
    const avgProgress = Object.values(progress)
      .filter(p => p.progress !== 'N/A')
      .reduce((sum, p) => sum + p.progress, 0) /
      Object.values(progress).filter(p => p.progress !== 'N/A').length;

    if (avgProgress >= 80) {
      analysis.push('🎉 Semana EXCELENTE! Progresso acima da meta.');
    } else if (avgProgress >= 60) {
      analysis.push('👍 Semana BOA! Progresso consistente.');
    } else if (avgProgress >= 40) {
      analysis.push('⚠️ Semana REGULAR. Precisa acelerar.');
    } else {
      analysis.push('🚨 Semana CRÍTICA! Foco total necessário.');
    }

    // Análise específica
    if (status.critical.length > 0) {
      analysis.push(`🔴 Prioridades críticas: ${status.critical.length} métricas`);
    }

    if (status.needsAttention.length > 0) {
      analysis.push(`🟡 Atenção necessária: ${status.needsAttention.length} métricas`);
    }

    return analysis;
  }

  // Gera plano para próxima semana
  generateNextWeekPlan(progress, status) {
    const plan = [];

    // Build sempre prioridade
    if (progress.buildStatus?.current !== '✅') {
      plan.push('🔴 PRIORIDADE MÁXIMA: Resolver build quebrado');
      plan.push('   - Identificar e corrigir todos os erros de compilação');
      plan.push('   - Resolver dependências circulares');
      plan.push('   - Validar deploy preview');
    }

    // ESLint baseado no progresso
    const eslintProgress = progress.eslintErrors?.progress;
    if (eslintProgress !== 'N/A') {
      if (eslintProgress < 50) {
        plan.push('🔴 Foco ESLint: Correções massivas necessárias');
        plan.push('   - Executar eslint --fix em lote diário');
        plan.push('   - 10+ arquivos por dia (top impacto)');
        plan.push('   - Configurar automação de correções');
      } else if (eslintProgress < 80) {
        plan.push('🟡 Continuar ESLint: Manter ritmo acelerado');
        plan.push('   - Próximos arquivos da lista priorizada');
        plan.push('   - Correções manuais para casos complexos');
      } else {
        plan.push('🟢 Finalizar ESLint: Correções finais');
        plan.push('   - Validação de não-regressão');
        plan.push('   - Padronização de correções aplicadas');
      }
    }

    // Testes
    const testProgress = progress.failingTests?.progress;
    if (testProgress !== 'N/A' && testProgress < 70) {
      plan.push('🟡 Estabilizar testes: Reduzir falhas');
      plan.push('   - Investigar e corrigir testes quebrados');
      plan.push('   - Melhorar setup/teardown');
      plan.push('   - Adicionar testes de regressão');
    }

    // Score geral
    const scoreProgress = progress.overallScore?.progress;
    if (scoreProgress !== 'N/A' && scoreProgress < 80) {
      plan.push('📈 Elevar score geral: Foco em alto impacto');
      plan.push('   - Priorizar correções que movam múltiplas métricas');
      plan.push('   - Otimizar performance dos testes');
      plan.push('   - Melhorar cobertura se possível');
    }

    // Capacitação e energia
    plan.push('💪 Manter energia do time:');
    plan.push('   - Celebrar vitórias semanais');
    plan.push('   - Rotação de tarefas para evitar burnout');
    plan.push('   - Pair programming em correções complexas');

    return plan;
  }

  // Salva relatório
  saveReport(reportData) {
    const reportsDir = 'tmp/weekly-reports';
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `weekly-report-${timestamp}.json`;
    const filepath = path.join(reportsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(reportData, null, 2));
    return filepath;
  }

  // Executa relatório semanal
  async run() {
    console.log(this.colorize('📊 RELATÓRIO SEMANAL - FASE 1 TDD', 'cyan'));
    console.log(this.colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan'));

    const now = new Date();
    console.log(`📅 Semana: ${this.getWeekInfo(now)}`);
    console.log(`📆 Data: ${now.toLocaleDateString('pt-BR')}`);
    console.log('');

    // Coleta métricas atuais
    console.log(this.colorize('📊 Coletando métricas atuais...', 'yellow'));
    const currentMetrics = this.collectCurrentMetrics();
    console.log(this.colorize('✅ Métricas coletadas', 'green'));
    console.log('');

    // Calcula progresso
    const progress = this.calculateWeeklyProgress(currentMetrics);
    const status = this.generateWeeklyStatus(progress);

    // Header do relatório
    console.log(this.colorize('📈 PROGRESSO SEMANAL', 'magenta'));
    console.log(this.colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'magenta'));

    // Tabela de progresso
    console.log(`${'Métrica'.padEnd(15)} ${'Atual'.padStart(6)} ${'Meta'.padStart(6)} ${'Progresso'.padStart(10)} ${'Status'.padStart(12)}`);
    console.log(this.colorize('─'.repeat(75), 'cyan'));

    Object.entries(progress).forEach(([metric, data]) => {
      const statusIcon = data.progress >= 80 ? '🟢' : data.progress >= 60 ? '🟡' : '🔴';
      const progressStr = data.progress !== 'N/A' ? `${data.progress}%` : 'N/A';
      console.log(`${metric.padEnd(15)} ${String(data.current).padStart(6)} ${String(data.target).padStart(6)} ${progressStr.padStart(10)} ${statusIcon.padStart(12)}`);
    });

    console.log('');
    console.log(this.colorize('🎯 ANÁLISE DA SEMANA', 'blue'));
    console.log(this.colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue'));

    const analysis = this.generateWeeklyAnalysis(progress, status);
    analysis.forEach(line => console.log(line));

    console.log('');
    console.log(this.colorize('📋 STATUS DETALHADO', 'yellow'));
    console.log(this.colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'yellow'));

    if (status.excellent.length > 0) {
      console.log(this.colorize('🟢 Excelente:', 'green'));
      status.excellent.forEach(item => console.log(`   • ${item}`));
    }

    if (status.good.length > 0) {
      console.log(this.colorize('🟡 Bom:', 'yellow'));
      status.good.forEach(item => console.log(`   • ${item}`));
    }

    if (status.needsAttention.length > 0) {
      console.log(this.colorize('🟠 Atenção:', 'yellow'));
      status.needsAttention.forEach(item => console.log(`   • ${item}`));
    }

    if (status.critical.length > 0) {
      console.log(this.colorize('🔴 Crítico:', 'red'));
      status.critical.forEach(item => console.log(`   • ${item}`));
    }

    console.log('');
    console.log(this.colorize('🚀 PLANO PRÓXIMA SEMANA', 'green'));
    console.log(this.colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green'));

    const nextWeekPlan = this.generateNextWeekPlan(progress, status);
    nextWeekPlan.forEach(step => console.log(`• ${step}`));

    // Salva relatório
    const reportData = {
      week: this.getWeekInfo(now),
      date: now.toISOString(),
      metrics: currentMetrics,
      progress,
      status,
      analysis,
      nextWeekPlan
    };

    const filepath = this.saveReport(reportData);
    console.log('');
    console.log(this.colorize(`💾 Relatório salvo: ${filepath}`, 'cyan'));

    // Resumo executivo
    console.log('');
    console.log(this.colorize('📊 RESUMO EXECUTIVO', 'magenta'));
    console.log(this.colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'magenta'));

    const avgProgress = Object.values(progress)
      .filter(p => p.progress !== 'N/A')
      .reduce((sum, p) => sum + p.progress, 0) /
      Object.values(progress).filter(p => p.progress !== 'N/A').length;

    console.log(`🎯 Progresso Médio: ${avgProgress.toFixed(1)}%`);
    console.log(`📈 Métricas no Verde: ${status.excellent.length}`);
    console.log(`⚠️ Requer Atenção: ${status.needsAttention.length + status.critical.length}`);

    if (avgProgress >= 70) {
      console.log(this.colorize('✅ Semana bem-sucedida! Continuar ritmo.', 'green'));
    } else {
      console.log(this.colorize('⚠️ Semana desafiadora. Foco na próxima!', 'yellow'));
    }
  }

  // Informações da semana
  getWeekInfo(date) {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Monday

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 4); // Friday

    return `${startOfWeek.toLocaleDateString('pt-BR')} - ${endOfWeek.toLocaleDateString('pt-BR')}`;
  }
}

// Executa se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const report = new ProgressReport();
  report.run().catch(error => {
    console.error('❌ Erro ao gerar relatório semanal:', error.message);
    process.exit(1);
  });
}

export default ProgressReport;
