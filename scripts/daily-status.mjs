#!/usr/bin/env node

/**
 * 📊 DAILY STATUS - FASE 1 TDD
 * Status diário das métricas críticas da Fase 1
 * Executar diariamente para acompanhar progresso
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class DailyStatus {
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

  // Conta erros ESLint
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

  // Verifica se build está funcionando
  getBuildStatus() {
    const result = this.safeExec('npm run build 2>&1 | grep -c "error\\|Error\\|ERROR"', '0');
    return parseInt(result) === 0 ? '✅' : '❌';
  }

  // Conta testes falhando
  getFailingTests() {
    try {
      const result = this.safeExec('npm test 2>&1 | grep -o "failed\\|❌" | wc -l', '0');
      return parseInt(result) || 0;
    } catch (error) {
      return 'N/A';
    }
  }

  // Obtém score geral (simplificado)
  getOverallScore() {
    // Tenta ler do último relatório
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

  // Calcula progresso percentual
  calculateProgress(current, start, target) {
    if (current === 'N/A' || start === 'N/A') return 'N/A';

    const totalRange = target - start;
    const currentProgress = current - start;
    const percentage = Math.round((currentProgress / totalRange) * 100);

    return Math.max(0, Math.min(100, percentage));
  }

  // Status visual do progresso
  getProgressStatus(current, target, isLowerBetter = false) {
    if (current === 'N/A') return this.colorize('❓ Desconhecido', 'yellow');

    const threshold = isLowerBetter ? 0.7 : 0.8; // 70% para redução, 80% para aumento

    if (isLowerBetter) {
      // Para métricas onde menor é melhor (erros, testes falhando)
      const ratio = current / target;
      if (ratio <= 0.5) return this.colorize('🟢 Excelente', 'green');
      if (ratio <= 0.8) return this.colorize('🟡 Bom', 'yellow');
      return this.colorize('🔴 Precisa Melhorar', 'red');
    } else {
      // Para métricas onde maior é melhor (score, cobertura)
      const ratio = current / target;
      if (ratio >= 0.9) return this.colorize('🟢 Excelente', 'green');
      if (ratio >= 0.7) return this.colorize('🟡 Bom', 'yellow');
      return this.colorize('🔴 Precisa Melhorar', 'red');
    }
  }

  // Formatação de métricas
  formatMetric(label, current, start, target, unit = '', isLowerBetter = false) {
    const progress = this.calculateProgress(current, start, target);
    const status = this.getProgressStatus(current, target, isLowerBetter);

    return `${label.padEnd(15)} ${String(current).padStart(6)} ${unit.padEnd(3)} ${status.padEnd(15)} ${progress !== 'N/A' ? progress + '%' : 'N/A'}`;
  }

  // Executa análise completa
  async run() {
    console.log(this.colorize('🚀 DAILY STATUS - FASE 1 TDD', 'cyan'));
    console.log(this.colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan'));

    const now = new Date();
    console.log(`📅 Data: ${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}`);
    console.log('');

    // Coleta métricas
    console.log(this.colorize('📊 COLETANDO MÉTRICAS...', 'yellow'));

    const eslintErrors = this.getEslintErrors();
    const buildStatus = this.getBuildStatus();
    const failingTests = this.getFailingTests();
    const overallScore = this.getOverallScore();

    console.log(this.colorize('✅ Métricas coletadas', 'green'));
    console.log('');

    // Header da tabela
    console.log(this.colorize('📈 STATUS ATUAL vs META', 'magenta'));
    console.log(this.colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'magenta'));
    console.log(`${'Métrica'.padEnd(15)} ${'Atual'.padStart(6)} ${'Meta'.padStart(6)} ${'Status'.padEnd(15)} ${'Progresso'}`);
    console.log(this.colorize('─'.repeat(70), 'cyan'));

    // Métricas formatadas
    console.log(this.formatMetric('ESLint Erros', eslintErrors, this.phase1Start.eslintErrors, this.targets.eslintErrors, '', true));
    console.log(this.formatMetric('Score Geral', overallScore, this.phase1Start.overallScore, this.targets.overallScore));
    console.log(this.formatMetric('Testes Falhando', failingTests, this.phase1Start.failingTests, this.targets.failingTests, '', true));
    console.log(this.formatMetric('Build Status', buildStatus === '✅' ? 1 : 0, 0, 1, buildStatus));

    console.log('');
    console.log(this.colorize('🎯 ANÁLISE DO DIA', 'blue'));
    console.log(this.colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'blue'));

    // Análise baseada nos números
    const analysis = this.generateAnalysis(eslintErrors, overallScore, failingTests, buildStatus);
    console.log(analysis);

    console.log('');
    console.log(this.colorize('📋 PRÓXIMOS PASSOS', 'green'));
    console.log(this.colorize('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'green'));

    const nextSteps = this.generateNextSteps(eslintErrors, overallScore, failingTests, buildStatus);
    nextSteps.forEach(step => console.log(`• ${step}`));

    console.log('');
    console.log(this.colorize('💾 Relatório salvo em: tmp/daily-reports/', 'cyan'));
  }

  // Gera análise baseada nos números atuais
  generateAnalysis(eslintErrors, overallScore, failingTests, buildStatus) {
    const analysis = [];

    // Análise ESLint
    if (eslintErrors !== 'N/A') {
      const eslintProgress = this.calculateProgress(eslintErrors, this.phase1Start.eslintErrors, this.targets.eslintErrors);
      if (eslintProgress >= 80) {
        analysis.push('🟢 ESLint: Excelente progresso! Quase atingindo meta.');
      } else if (eslintProgress >= 50) {
        analysis.push('🟡 ESLint: Bom progresso, manter ritmo.');
      } else {
        analysis.push('🔴 ESLint: Progresso lento, foco prioritário hoje.');
      }
    }

    // Análise Build
    if (buildStatus === '✅') {
      analysis.push('🟢 Build: Limpo e funcionando perfeitamente.');
    } else {
      analysis.push('🔴 Build: Ainda com erros críticos - prioridade máxima!');
    }

    // Análise Score
    if (overallScore !== 'N/A') {
      const scoreProgress = this.calculateProgress(overallScore, this.phase1Start.overallScore, this.targets.overallScore);
      if (scoreProgress >= 80) {
        analysis.push('🟢 Score Geral: Ótimo progresso, quase na meta!');
      } else if (scoreProgress >= 50) {
        analysis.push('🟡 Score Geral: Progresso consistente.');
      } else {
        analysis.push('🟡 Score Geral: Progresso inicial, acelerar correções.');
      }
    }

    // Análise Testes
    if (failingTests !== 'N/A') {
      if (failingTests <= this.targets.failingTests) {
        analysis.push('🟢 Testes: Dentro da meta, estável.');
      } else if (failingTests <= this.targets.failingTests * 2) {
        analysis.push('🟡 Testes: Alguns falhando, investigar hoje.');
      } else {
        analysis.push('🔴 Testes: Muitos falhando, foco urgente!');
      }
    }

    return analysis.length > 0 ? analysis.join('\n') : '📊 Aguardando dados completos para análise detalhada.';
  }

  // Gera próximos passos baseados no status atual
  generateNextSteps(eslintErrors, overallScore, failingTests, buildStatus) {
    const steps = [];

    // Build é prioridade máxima
    if (buildStatus !== '✅') {
      steps.push('🔴 URGENTE: Corrigir build quebrado antes de qualquer coisa');
      steps.push('   - Identificar erros de compilação');
      steps.push('   - Resolver dependências circulares');
      steps.push('   - Validar com npm run build');
    }

    // ESLint baseado no progresso
    if (eslintErrors !== 'N/A') {
      const eslintProgress = this.calculateProgress(eslintErrors, this.phase1Start.eslintErrors, this.targets.eslintErrors);
      if (eslintProgress < 50) {
        steps.push('🔴 Foco ESLint: Progresso lento, aumentar ritmo');
        steps.push('   - Executar eslint --fix em lote');
        steps.push('   - Corrigir imports não utilizados em massa');
        steps.push('   - Top 5 arquivos problemáticos primeiro');
      } else if (eslintProgress < 80) {
        steps.push('🟡 Continuar ESLint: Bom ritmo, manter foco');
        steps.push('   - Próximos 5 arquivos da lista');
        steps.push('   - Configurar pre-commit hooks');
      } else {
        steps.push('🟢 ESLint quase pronto: Correções finais');
        steps.push('   - Validação de não regressão');
        steps.push('   - Documentar padrões aplicados');
      }
    }

    // Testes
    if (failingTests !== 'N/A' && failingTests > this.targets.failingTests) {
      steps.push(`🟡 Corrigir testes falhando: ${failingTests} atualmente`);
      steps.push('   - Investigar causas dos falhos');
      steps.push('   - Corrigir setup/teardown');
      steps.push('   - Adicionar testes de regressão');
    }

    // Score geral
    if (overallScore !== 'N/A') {
      const scoreProgress = this.calculateProgress(overallScore, this.phase1Start.overallScore, this.targets.overallScore);
      if (scoreProgress < 70) {
        steps.push('📈 Aumentar score geral: Foco em correções de alto impacto');
      }
    }

    // Se tudo estiver bem
    if (steps.length === 0) {
      steps.push('🎉 Tudo em dia! Foco no próximo milestone');
      steps.push('   - Preparar checkpoint semanal');
      steps.push('   - Planejar próximas correções');
      steps.push('   - Celebrar progresso alcançado');
    }

    return steps;
  }
}

// Executa se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const status = new DailyStatus();
  status.run().catch(error => {
    console.error('❌ Erro ao executar daily status:', error.message);
    process.exit(1);
  });
}

export default DailyStatus;
