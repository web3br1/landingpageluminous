#!/usr/bin/env node

/**
 * 📅 Phase 1 Daily - Acompanhamento Diário Completo da Fase 1
 *
 * Executa diariamente para acompanhar progresso da Fase 1:
 * - Verifica alertas críticos (build, ESLint, testes)
 * - Coleta métricas atuais vs baseline
 * - Fornece orientações específicas para o dia
 * - Gera relatórios diários
 *
 * Uso: node scripts/phase1-daily.mjs [--day=N] [--week=N] [--force]
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const DAY = process.argv.find(arg => arg.startsWith('--day='))?.split('=')[1] || new Date().getDay();
const WEEK = process.argv.find(arg => arg.startsWith('--week='))?.split('=')[1] || 'current';
const FORCE = process.argv.includes('--force');
const VERBOSE = process.argv.includes('--verbose');

class Phase1Daily {
  constructor() {
    this.rootDir = path.resolve(process.cwd());
    this.colors = {
      reset: '\x1b[0m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m'
    };

    this.status = {
      alerts: [],
      metrics: {
        eslint: { current: 0, target: 1000, status: 'unknown' },
        tests: { failing: 0, total: 0, status: 'unknown' },
        coverage: { percentage: 0, status: 'unknown' },
        build: { status: 'unknown' },
        score: { current: 0, status: 'unknown' }
      },
      priorities: [],
      nextSteps: [],
      daySchedule: []
    };
  }

  colorize(text, color) {
    return `${this.colors[color]}${text}${this.colors.reset}`;
  }

  log(message, verbose = false) {
    if (verbose && !VERBOSE) return;
    console.log(`📊 ${message}`);
  }

  safeExec(command, fallback = 'N/A') {
    try {
      return execSync(command, {
        encoding: 'utf8',
        cwd: this.rootDir,
        timeout: 30000
      }).trim();
    } catch (error) {
      return fallback;
    }
  }

  // Verifica se setup foi executado
  checkSetup() {
    const requiredFiles = [
      'scripts/daily-status.mjs',
      'scripts/progress-report.mjs',
      'tmp/phase1-baseline.json',
      'tmp/phase1-schedule.json'
    ];

    const missing = requiredFiles.filter(file => !fs.existsSync(file));

    if (missing.length > 0) {
      console.log(this.colorize('⚠️ Setup da Fase 1 não foi executado!', 'yellow'));
      console.log('Arquivos faltando:', missing.join(', '));
      console.log('');
      console.log('Execute primeiro:');
      console.log(this.colorize('node scripts/phase1-setup.mjs', 'cyan'));
      console.log('');
      return false;
    }

    return true;
  }

  // Carrega dados do baseline
  loadBaseline() {
    try {
      const baselinePath = 'tmp/phase1-baseline.json';
      return JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    } catch (error) {
      this.log('Erro ao carregar baseline');
      return null;
    }
  }

  // Executa verificações de alertas
  async checkAlerts() {
    this.log('🚨 VERIFICANDO ALERTAS CRÍTICOS...');

    // Build status - prioridade máxima
    const buildResult = this.safeExec('npm run build 2>&1 | grep -c "error\\|Error\\|ERROR"', '0');
    if (parseInt(buildResult) > 0) {
      this.status.alerts.push({
        level: 'CRITICAL',
        icon: '🔴',
        message: 'Build quebrado - TODOS PAREM!',
        action: 'Corrigir erros de compilação IMEDIATAMENTE',
        impact: 'Bloqueia deploy e desenvolvimento'
      });
    }

    // ESLint crítico
    const eslintOutput = this.safeExec('pnpm lint 2>&1 || true', '[]');
    const eslintErrors = eslintOutput.split('\n').filter(line =>
      line.includes('error') && !line.includes('warning')
    ).length;

    if (eslintErrors > 2500) {
      this.status.alerts.push({
        level: 'HIGH',
        icon: '🟡',
        message: `ESLint crítico: ${eslintErrors} erros (>2500)`,
        action: 'Foco total em correções ESLint hoje',
        impact: 'Atrasa produtividade da equipe'
      });
    }

    // Testes falhando
    try {
      const testOutput = this.safeExec('pnpm test:unit --reporter=json 2>&1 || true', '[]');
      const testResults = JSON.parse(testOutput);
      const failingTests = testResults.numFailed || 0;

      if (failingTests > 5) {
        this.status.alerts.push({
          level: 'MEDIUM',
          icon: '🟡',
          message: `${failingTests} testes falhando (>5)`,
          action: 'Investigar e corrigir testes críticos',
          impact: 'Pode mascarar regressões'
        });
      }
    } catch (error) {
      // Ignora erro de parsing
    }

    if (this.status.alerts.length === 0) {
      console.log(this.colorize('✅ Nenhum alerta crítico detectado', 'green'));
    } else {
      console.log('');
      this.status.alerts.forEach(alert => {
        console.log(`${alert.icon} ${alert.level}: ${alert.message}`);
        console.log(`   → ${alert.action}`);
        console.log(`   💡 ${alert.impact}`);
        console.log('');
      });
    }
  }

  // Coleta métricas atuais
  async collectMetrics() {
    this.log('📊 COLETANDO MÉTRICAS ATUAIS...');

    // ESLint
    const eslintOutput = this.safeExec('pnpm lint 2>&1 || true', '[]');
    this.status.metrics.eslint.current = eslintOutput.split('\n').filter(line =>
      line.includes('error') && !line.includes('warning')
    ).length;

    // Testes
    try {
      const testOutput = this.safeExec('pnpm test:unit --reporter=json 2>&1 || true', '[]');
      const testResults = JSON.parse(testOutput);
      this.status.metrics.tests.failing = testResults.numFailed || 0;
      this.status.metrics.tests.total = testResults.numTotalTests || 0;
    } catch (error) {
      this.status.metrics.tests.status = 'error';
    }

    // Cobertura
    try {
      const coveragePath = path.join(this.rootDir, 'coverage', 'coverage-summary.json');
      if (fs.existsSync(coveragePath)) {
        const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        this.status.metrics.coverage.percentage = coverage.total?.lines?.pct || 0;
      }
    } catch (error) {
      this.status.metrics.coverage.status = 'error';
    }

    // Build
    try {
      execSync('pnpm build', { stdio: 'pipe', cwd: this.rootDir });
      this.status.metrics.build.status = 'passing';
    } catch {
      this.status.metrics.build.status = 'failing';
    }

    console.log(this.colorize('✅ Métricas coletadas', 'green'));
  }

  // Calcula prioridades baseadas no status atual
  calculatePriorities() {
    this.status.priorities = [];

    // Prioridade 1: Alertas críticos
    if (this.status.alerts.some(a => a.level === 'CRITICAL')) {
      this.status.priorities.push({
        level: 1,
        icon: '🔴',
        title: 'RESOLVER ALERTAS CRÍTICOS',
        description: 'Build quebrado ou bloqueadores maiores'
      });
    }

    // Prioridade 2: ESLint crítico
    if (this.status.metrics.eslint.current > 1500) {
      this.status.priorities.push({
        level: 2,
        icon: '🟡',
        title: 'REDUZIR ERROS ESLINT',
        description: `Meta diária: reduzir ${Math.min(500, this.status.metrics.eslint.current - 1000)} erros`
      });
    }

    // Prioridade 3: Testes falhando
    if (this.status.metrics.tests.failing > 3) {
      this.status.priorities.push({
        level: 3,
        icon: '🟡',
        title: 'CORRIGIR TESTES FALHANDO',
        description: `${this.status.metrics.tests.failing} testes atualmente falhando`
      });
    }

    // Se tudo OK, foco na cobertura
    if (this.status.priorities.length === 0) {
      if (this.status.metrics.coverage.percentage < 10) {
        this.status.priorities.push({
          level: 4,
          icon: '🟢',
          title: 'ATIVAR COBERTURA',
          description: 'Configurar medição de cobertura de testes'
        });
      } else {
        this.status.priorities.push({
          level: 5,
          icon: '✅',
          title: 'MANTER RITMO',
          description: 'Continuar correções e melhorias incrementais'
        });
      }
    }
  }

  // Carrega cronograma do dia
  loadDaySchedule() {
    try {
      const schedulePath = 'tmp/phase1-schedule.json';
      const schedule = JSON.parse(fs.readFileSync(schedulePath, 'utf8'));

      const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      const dayName = dayNames[parseInt(DAY)];

      this.status.daySchedule = schedule[dayName] || [];

    } catch (error) {
      this.status.daySchedule = [];
    }
  }

  // Gera próximos passos específicos
  generateNextSteps() {
    const baseline = this.loadBaseline();
    if (!baseline) return;

    const dayIndex = parseInt(DAY) - 1; // 0=domingo, 1=segunda, etc.
    const milestone = baseline.milestones[dayIndex];

    if (milestone) {
      this.status.nextSteps.push(`🎯 FOCO DO DIA: ${milestone.focus}`);
      this.status.nextSteps.push(`📋 Deliverables: ${milestone.deliverables.join(', ')}`);

      if (milestone.metrics) {
        this.status.nextSteps.push('📊 Metas:');
        Object.entries(milestone.metrics).forEach(([key, value]) => {
          this.status.nextSteps.push(`   • ${key}: ${value}`);
        });
      }
    }

    // Adiciona orientações gerais baseadas no status
    if (this.status.alerts.length > 0) {
      this.status.nextSteps.push('');
      this.status.nextSteps.push('⚠️ ALERTAS ATIVOS - Resolver antes de continuar');
    } else {
      this.status.nextSteps.push('');
      this.status.nextSteps.push('✅ SEM ALERTAS - Foco nos deliverables do dia');
    }

    // Orientação baseada em métricas
    const eslintGap = this.status.metrics.eslint.current - this.status.metrics.eslint.target;
    if (eslintGap > 0) {
      this.status.nextSteps.push(`🔧 ESLint: Faltam ${eslintGap} erros para atingir meta`);
    }
  }

  // Exibe relatório final
  displayReport() {
    console.log(this.colorize('📊 RELATÓRIO DIÁRIO - FASE 1', 'cyan'));
    console.log(this.colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan'));

    const now = new Date();
    console.log(`📅 Data: ${now.toLocaleDateString('pt-BR')}`);
    console.log(`📊 Dia da Semana: ${this.getDayName(parseInt(DAY))}`);
    console.log('');

    // Status das métricas
    console.log(this.colorize('📈 STATUS ATUAL vs META', 'magenta'));
    console.log(`${'Métrica'.padEnd(15)} ${'Atual'.padStart(6)} ${'Meta'.padStart(6)} ${'Status'.padStart(8)}`);
    console.log(this.colorize('─'.repeat(50), 'cyan'));

    console.log(`${'ESLint'.padEnd(15)} ${String(this.status.metrics.eslint.current).padStart(6)} ${String(this.status.metrics.eslint.target).padStart(6)} ${this.getStatusIcon('eslint').padStart(8)}`);
    console.log(`${'Testes OK'.padEnd(15)} ${(this.status.metrics.tests.total - this.status.metrics.tests.failing).toString().padStart(6)} ${'95%'.padStart(6)} ${this.getStatusIcon('tests').padStart(8)}`);
    console.log(`${'Build'.padEnd(15)} ${'--'.padStart(6)} ${'✅'.padStart(6)} ${this.getStatusIcon('build').padStart(8)}`);
    console.log(`${'Cobertura'.padEnd(15)} ${this.status.metrics.coverage.percentage.toFixed(1).padStart(6)} ${'10'.padStart(6)} ${this.getStatusIcon('coverage').padStart(8)}`);

    console.log('');

    // Prioridades
    if (this.status.priorities.length > 0) {
      console.log(this.colorize('🎯 PRIORIDADES DO DIA', 'blue'));
      this.status.priorities.forEach((priority, index) => {
        console.log(`${index + 1}. ${priority.icon} ${priority.title}`);
        console.log(`   ${priority.description}`);
      });
      console.log('');
    }

    // Próximos passos
    if (this.status.nextSteps.length > 0) {
      console.log(this.colorize('🚀 PRÓXIMOS PASSOS', 'green'));
      this.status.nextSteps.forEach(step => console.log(`• ${step}`));
      console.log('');
    }

    // Cronograma do dia
    if (this.status.daySchedule.length > 0) {
      console.log(this.colorize('📅 CRONOGRAMA SUGERIDO', 'yellow'));
      Object.entries(this.status.daySchedule).forEach(([time, activity]) => {
        console.log(`${time.padEnd(5)} ${activity}`);
      });
      console.log('');
    }

    // Salva relatório
    this.saveDailyReport();

    console.log(this.colorize('✅ Daily concluído! Continue o excelente trabalho! 🚀', 'green'));
  }

  getStatusIcon(metric) {
    const statusMap = {
      eslint: this.status.metrics.eslint.current <= this.status.metrics.eslint.target ? '🟢' : '🔴',
      tests: this.status.metrics.tests.failing <= 3 ? '🟢' : '🟡',
      build: this.status.metrics.build.status === 'passing' ? '🟢' : '🔴',
      coverage: this.status.metrics.coverage.percentage >= 10 ? '🟢' : '🟡'
    };

    return statusMap[metric] || '❓';
  }

  getDayName(dayIndex) {
    const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return days[dayIndex];
  }

  saveDailyReport() {
    const reportDir = 'tmp/daily-reports';
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `daily-report-${timestamp}.json`;
    const filepath = path.join(reportDir, filename);

    const report = {
      date: new Date().toISOString(),
      dayOfWeek: parseInt(DAY),
      metrics: this.status.metrics,
      alerts: this.status.alerts,
      priorities: this.status.priorities,
      nextSteps: this.status.nextSteps
    };

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));

    this.log(`Relatório salvo: tmp/daily-reports/${filename}`, true);
  }

  async run() {
    console.log(this.colorize('📅 PHASE 1 DAILY - Acompanhamento Diário', 'cyan'));
    console.log(this.colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan'));

    // Verifica setup
    if (!this.checkSetup()) {
      return;
    }

    // Executa verificações
    await this.checkAlerts();
    await this.collectMetrics();

    // Processa dados
    this.calculatePriorities();
    this.loadDaySchedule();
    this.generateNextSteps();

    // Exibe relatório
    this.displayReport();
  }
}

// Executa se chamado diretamente
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const daily = new Phase1Daily();
  daily.run().catch(error => {
    console.error('❌ Erro no daily:', error.message);
    process.exit(1);
  });
}

export default Phase1Daily;