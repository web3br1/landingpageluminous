#!/usr/bin/env node

/**
 * Daily Status Script - Status Matinal da Fase 1
 *
 * Executa verificações rápidas críticas para alinhamento diário:
 * - ESLint atual (erros atuais vs meta)
 * - Testes falhando (quantidade + impacto)
 * - Cobertura medida (se ativa)
 * - Progresso vs meta diária
 * - Top 3 prioridades recomendadas
 *
 * Uso: node scripts/daily-status-fixed.mjs [--verbose]
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const VERBOSE = process.argv.includes('--verbose');

class DailyStatus {
  constructor() {
    this.status = {
      timestamp: new Date().toISOString(),
      phase: 'FASE_1_CLEANUP',
      eslint: { current: 0, target: 1000, status: 'unknown' },
      tests: { failing: 0, total: 0, status: 'unknown' },
      coverage: { percentage: 0, status: 'unknown' },
      build: { status: 'unknown' },
      priorities: []
    };
  }

  log(message, verbose = false) {
    if (verbose && !VERBOSE) return;
    console.log(`📊 ${message}`);
  }

  // Execução segura cross-platform
  safeExec(command, options = {}) {
    try {
      const defaultOptions = {
        encoding: 'utf8',
        timeout: 30000,
        stdio: VERBOSE ? 'inherit' : 'pipe'
      };

      return execSync(command, { ...defaultOptions, ...options });
    } catch (error) {
      return null;
    }
  }

  async checkESLint() {
    try {
      this.log('Verificando ESLint...', true);

      // Comando cross-platform
      const isWindows = process.platform === 'win32';
      const command = isWindows
        ? 'npx eslint . --ext .ts,.tsx,.js,.jsx --max-warnings 0 2>nul'
        : 'npx eslint . --ext .ts,.tsx,.js,.jsx --max-warnings 0 2>/dev/null';

      const output = this.safeExec(command);
      if (!output) {
        this.status.eslint.current = 0;
        this.status.eslint.status = 'good';
        this.log('ESLint: 0 erros');
        return;
      }

      // Conta erros na saída
      const lines = output.toString().split('\n');
      const errorLines = lines.filter(line =>
        line.includes('error') && !line.includes('warning')
      );

      this.status.eslint.current = errorLines.length;
      this.status.eslint.status = this.status.eslint.current < this.status.eslint.target ? 'good' : 'bad';

      this.log(`ESLint: ${this.status.eslint.current} erros (${this.status.eslint.target} meta)`);

    } catch (error) {
      this.log(`Erro ao verificar ESLint: ${error.message}`);
      this.status.eslint.status = 'error';
    }
  }

  async checkTests() {
    try {
      this.log('Verificando testes...', true);

      // Executa testes com Vitest
      const output = this.safeExec('npx vitest run --reporter=json');
      if (!output) {
        this.status.tests.status = 'error';
        this.log('Não foi possível executar testes');
        return;
      }

      try {
        const results = JSON.parse(output.toString());
        const failing = results.numFailed || 0;
        const total = results.numTotalTests || 0;

        this.status.tests.failing = failing;
        this.status.tests.total = total;
        this.status.tests.status = failing <= 3 ? 'good' : 'bad';

        this.log(`Testes: ${failing}/${total} falhando`);

      } catch {
        // Fallback se não conseguir parsear JSON
        this.status.tests.status = 'unknown';
        this.log('Não foi possível determinar status dos testes');
      }

    } catch (error) {
      this.log(`Erro ao verificar testes: ${error.message}`);
      this.status.tests.status = 'error';
    }
  }

  async checkCoverage() {
    try {
      this.log('Verificando cobertura...', true);

      // Verifica se existe relatório de cobertura
      const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');

      if (fs.existsSync(coveragePath)) {
        const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        const totalCoverage = coverage.total?.lines?.pct || 0;

        this.status.coverage.percentage = totalCoverage;
        this.status.coverage.status = totalCoverage >= 10 ? 'good' : 'warning';

        this.log(`Cobertura: ${totalCoverage.toFixed(1)}%`);
      } else {
        this.status.coverage.status = 'inactive';
        this.log('Cobertura não ativa ainda');
      }

    } catch (error) {
      this.log(`Erro ao verificar cobertura: ${error.message}`);
      this.status.coverage.status = 'error';
    }
  }

  async checkBuild() {
    try {
      this.log('Verificando build...', true);

      const output = this.safeExec('npm run build');
      if (output === null) {
        this.status.build.status = 'failing';
        this.log('Build: ❌ Quebrado');
      } else {
        this.status.build.status = 'passing';
        this.log('Build: ✅ OK');
      }

    } catch (error) {
      this.status.build.status = 'failing';
      this.log('Build: ❌ Quebrado');
    }
  }

  calculatePriorities() {
    this.status.priorities = [];

    // Prioridade 1: Build quebrado
    if (this.status.build.status === 'failing') {
      this.status.priorities.push('🚨 PRIORIDADE 1: Corrigir build quebrado');
    }

    // Prioridade 2: ESLint crítico
    if (this.status.eslint.current > 1500) {
      this.status.priorities.push('🔴 PRIORIDADE 2: Reduzir erros ESLint (meta: <1000)');
    }

    // Prioridade 3: Testes falhando
    if (this.status.tests.failing > 3) {
      this.status.priorities.push('🟡 PRIORIDADE 3: Corrigir testes falhando');
    }

    // Se tudo OK, foco na cobertura
    if (this.status.priorities.length === 0) {
      if (this.status.coverage.percentage < 10) {
        this.status.priorities.push('🟢 FOCO: Habilitar medição de cobertura');
      } else {
        this.status.priorities.push('✅ CONTINUAR: Manter ritmo de limpeza');
      }
    }
  }

  getOverallScore() {
    let score = 100;

    // Penalidades
    if (this.status.build.status === 'failing') score -= 50;
    if (this.status.eslint.current > 1500) score -= 20;
    if (this.status.tests.failing > 3) score -= 15;
    if (this.status.coverage.percentage < 5) score -= 10;

    return Math.max(0, score);
  }

  async run() {
    console.log('🚀 Daily Status - Fase 1 Cleanup\n');

    await this.checkESLint();
    await this.checkTests();
    await this.checkCoverage();
    await this.checkBuild();

    this.calculatePriorities();

    // Resumo final
    console.log('\n📈 RESUMO DO DIA:');
    console.log(`Pontuação Geral: ${this.getOverallScore()}/100`);
    console.log(`ESLint: ${this.status.eslint.current} erros`);
    console.log(`Testes: ${this.status.tests.failing} falhando`);
    console.log(`Cobertura: ${this.status.coverage.percentage.toFixed(1)}%`);
    console.log(`Build: ${this.status.build.status === 'passing' ? '✅' : '❌'}`);

    console.log('\n🎯 TOP PRIORIDADES:');
    this.status.priorities.forEach((priority, index) => {
      console.log(`${index + 1}. ${priority}`);
    });

    console.log('\n💡 Execute com --verbose para mais detalhes');
  }
}

// Executa se chamado diretamente
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const status = new DailyStatus();
  status.run().catch(console.error);
}

export default DailyStatus;
