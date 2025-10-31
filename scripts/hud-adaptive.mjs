#!/usr/bin/env node

/**
 * HUD Adaptive - Reflexo Adaptativo do Sistema TDD
 * Aprende com padrões de execução e ajusta prioridades automaticamente
 */

import fs from 'fs';
import path from 'path';

const HISTORY_FILE = 'tmp/hud-history.json';
const ADAPTIVE_CONFIG = 'tmp/hud-adaptive-config.json';

class HUDAdaptive {
  constructor() {
    this.history = this.loadHistory();
    this.config = this.loadConfig();
    this.sessionStart = Date.now();
  }

  loadHistory() {
    try {
      if (fs.existsSync(HISTORY_FILE)) {
        const data = fs.readFileSync(HISTORY_FILE, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar histórico:', error.message);
    }
    return [];
  }

  saveHistory() {
    try {
      const dir = path.dirname(HISTORY_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(HISTORY_FILE, JSON.stringify(this.history, null, 2));
    } catch (error) {
      console.warn('⚠️ Erro ao salvar histórico:', error.message);
    }
  }

  loadConfig() {
    try {
      if (fs.existsSync(ADAPTIVE_CONFIG)) {
        const data = fs.readFileSync(ADAPTIVE_CONFIG, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('⚠️ Erro ao carregar config adaptativa:', error.message);
    }
    return {
      priorityModules: {},
      failurePatterns: {},
      averageTimes: {},
      lastSession: null
    };
  }

  saveConfig() {
    try {
      const dir = path.dirname(ADAPTIVE_CONFIG);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(ADAPTIVE_CONFIG, JSON.stringify(this.config, null, 2));
    } catch (error) {
      console.warn('⚠️ Erro ao salvar config adaptativa:', error.message);
    }
  }

  recordExecution(execution) {
    const record = {
      timestamp: Date.now(),
      sessionDuration: Date.now() - this.sessionStart,
      ...execution
    };

    this.history.push(record);

    // Manter apenas últimas 100 execuções
    if (this.history.length > 100) {
      this.history = this.history.slice(-100);
    }

    this.updateAdaptiveConfig(record);
    this.saveHistory();
  }

  updateAdaptiveConfig(record) {
    // Atualizar prioridade baseada em falhas
    if (record.tests === 'failed') {
      this.config.priorityModules['tests'] = (this.config.priorityModules['tests'] || 0) + 1;
    }

    if (record.coverage === 'failed') {
      this.config.priorityModules['coverage'] = (this.config.priorityModules['coverage'] || 0) + 1;
    }

    // Registrar padrões de falha
    if (record.overall === 'failed') {
      const patternKey = `${record.build}-${record.tests}-${record.coverage}`;
      this.config.failurePatterns[patternKey] = (this.config.failurePatterns[patternKey] || 0) + 1;
    }

    // Atualizar tempos médios
    if (record.sessionDuration) {
      const key = 'session';
      const current = this.config.averageTimes[key] || { total: 0, count: 0 };
      current.total += record.sessionDuration;
      current.count += 1;
      this.config.averageTimes[key] = current;
    }

    this.config.lastSession = record.timestamp;
    this.saveConfig();
  }

  analyzePatterns() {
    const analysis = {
      frequentFailures: {},
      averageSessionTime: 0,
      priorityRecommendations: [],
      frictionPoints: []
    };

    // Analisar falhas frequentes
    const recentHistory = this.history.slice(-20); // Últimas 20 execuções
    const failureCounts = {};

    recentHistory.forEach(record => {
      if (record.overall === 'failed') {
        ['build', 'tests', 'coverage', 'quality'].forEach(component => {
          if (record[component] === 'failed') {
            failureCounts[component] = (failureCounts[component] || 0) + 1;
          }
        });
      }
    });

    analysis.frequentFailures = failureCounts;

    // Tempo médio da sessão
    const sessionTimes = recentHistory
      .filter(r => r.sessionDuration)
      .map(r => r.sessionDuration);

    if (sessionTimes.length > 0) {
      analysis.averageSessionTime = sessionTimes.reduce((a, b) => a + b, 0) / sessionTimes.length;
    }

    // Recomendações baseadas em padrões
    analysis.priorityRecommendations = this.generateRecommendations(failureCounts);

    // Pontos de atrito
    analysis.frictionPoints = this.detectFrictionPoints(recentHistory);

    return analysis;
  }

  generateRecommendations(failureCounts) {
    const recommendations = [];

    // Priorizar baseado em falhas frequentes
    const sortedFailures = Object.entries(failureCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2);

    sortedFailures.forEach(([component, count]) => {
      if (count >= 3) { // 3+ falhas nas últimas 20 execuções
        switch (component) {
          case 'tests':
            recommendations.push('tests');
            break;
          case 'coverage':
            recommendations.push('coverage');
            break;
          case 'build':
            recommendations.push('build');
            break;
        }
      }
    });

    return recommendations;
  }

  detectFrictionPoints(recentHistory) {
    const frictionPoints = [];

    // Detectar falhas consecutivas no mesmo componente
    const last5 = recentHistory.slice(-5);
    const consecutiveFailures = {};

    last5.forEach(record => {
      ['build', 'tests', 'coverage', 'quality'].forEach(component => {
        if (record[component] === 'failed') {
          consecutiveFailures[component] = (consecutiveFailures[component] || 0) + 1;
        }
      });
    });

    Object.entries(consecutiveFailures).forEach(([component, count]) => {
      if (count >= 3) {
        frictionPoints.push({
          component,
          severity: 'high',
          suggestion: this.getFrictionSuggestion(component, count)
        });
      }
    });

    return frictionPoints;
  }

  getFrictionSuggestion(component, consecutiveFailures) {
    switch (component) {
      case 'tests':
        return consecutiveFailures >= 5
          ? 'Considere refatorar testes para serem mais granulares'
          : 'Verifique se testes estão testando a implementação correta';

      case 'coverage':
        return 'Foco em aumentar cobertura dos módulos críticos primeiro';

      case 'build':
        return 'Verifique dependências ou configurações de build';

      default:
        return 'Investigue a causa raiz das falhas consecutivas';
    }
  }

  getAdaptiveSuggestions(analysis) {
    const suggestions = [];

    // Sugestões baseadas em padrões
    if (analysis.priorityRecommendations.includes('tests')) {
      suggestions.push('🎯 Priorizando testes críticos devido a falhas frequentes');
    }

    if (analysis.priorityRecommendations.includes('coverage')) {
      suggestions.push('📊 Foco em cobertura - módulos críticos precisam de mais testes');
    }

    if (analysis.priorityRecommendations.includes('build')) {
      suggestions.push('🔨 Problemas de build recorrentes - verificar dependências');
    }

    // Sugestões baseadas em pontos de atrito
    analysis.frictionPoints.forEach(point => {
      suggestions.push(`⚠️ ${point.component.toUpperCase()}: ${point.suggestion}`);
    });

    // Sugestões baseadas em tempo
    if (analysis.averageSessionTime > 180000) { // 3 minutos
      suggestions.push('⏱️ Sessões longas detectadas - considere paralelização');
    }

    return suggestions;
  }

  getAdaptiveHUDConfig() {
    const analysis = this.analyzePatterns();
    const suggestions = this.getAdaptiveSuggestions(analysis);

    return {
      analysis,
      suggestions,
      adaptiveMode: suggestions.length > 0,
      priorityOrder: this.determinePriorityOrder(analysis.priorityRecommendations)
    };
  }

  determinePriorityOrder(recommendations) {
    const defaultOrder = ['build', 'tests', 'coverage', 'quality'];

    if (recommendations.length === 0) {
      return defaultOrder;
    }

    // Mover itens recomendados para o início
    const priorityItems = recommendations;
    const remainingItems = defaultOrder.filter(item => !recommendations.includes(item));

    return [...priorityItems, ...remainingItems];
  }

  printAdaptiveInsights() {
    const adaptive = this.getAdaptiveHUDConfig();

    if (!adaptive.adaptiveMode) {
      console.log('🧠 Sistema saudável - usando configuração padrão');
      return;
    }

    console.log('🧠 REFLEXO ADAPTATIVO ATIVADO');
    console.log('');

    if (adaptive.suggestions.length > 0) {
      console.log('💡 Sugestões baseadas no seu padrão de uso:');
      adaptive.suggestions.forEach(suggestion => {
        console.log(`   ${suggestion}`);
      });
      console.log('');
    }

    console.log('📊 Ordem de prioridade adaptada:');
    adaptive.priorityOrder.forEach((item, index) => {
      const priority = index < 2 ? '🔴' : '🟡';
      console.log(`   ${priority} ${index + 1}. ${item.toUpperCase()}`);
    });

    console.log('');
    console.log('🎯 Loop otimizado para o seu contexto atual');
  }
}

// ===== CLI INTERFACE =====
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'analyze';

  const adaptive = new HUDAdaptive();

  switch (command) {
    case 'record':
      // Grava uma execução (usado pelo HUD principal)
      const execution = JSON.parse(args[1] || '{}');
      adaptive.recordExecution(execution);
      console.log('✅ Execução registrada no histórico adaptativo');
      break;

    case 'analyze':
      adaptive.printAdaptiveInsights();
      break;

    case 'insights':
      const insights = adaptive.getAdaptiveHUDConfig();
      console.log(JSON.stringify(insights, null, 2));
      break;

    case 'reset':
      // Reset do histórico para teste
      adaptive.history = [];
      adaptive.config = {
        priorityModules: {},
        failurePatterns: {},
        averageTimes: {},
        lastSession: null
      };
      adaptive.saveHistory();
      adaptive.saveConfig();
      console.log('🔄 Histórico adaptativo resetado');
      break;

    default:
      console.log('Uso: node hud-adaptive.mjs [record|analyze|insights|reset]');
      break;
  }
}

main().catch(error => {
  console.error('💥 Erro no reflexo adaptativo:', error.message);
  process.exit(1);
});
