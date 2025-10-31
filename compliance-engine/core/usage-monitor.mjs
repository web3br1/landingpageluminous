#!/usr/bin/env node

/**
 * COMPLIANCE ENGINE - USAGE MONITOR
 * Monitora execução de scripts em tempo real
 * Implementa rastreabilidade jurídica e auditoria
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Interfaces conforme contrato
export class ExecutionMetadata {
  constructor(data) {
    this.timestamp = data.timestamp || new Date().toISOString();
    this.user = data.user || null;
    this.context = data.context || 'local';
    this.success = data.success !== undefined ? data.success : true;
    this.duration = data.duration || null;
    this.triggeredBy = data.triggeredBy || null;

    // ⚠️ Rastreabilidade jurídica (ajuste institucional)
    this.runAuthority = data.runAuthority || 'unknown';
    this.reasonForBypass = data.reasonForBypass || null;
    this.policyVersion = data.policyVersion || '1.0.0';

    // Ambiente
    this.environment = data.environment || {
      nodeVersion: process.version,
      platform: process.platform,
      cwd: process.cwd()
    };
  }
}

export class BypassEvent {
  constructor(data) {
    this.scriptId = data.scriptId;
    this.timestamp = data.timestamp || new Date().toISOString();
    this.authorizedBy = data.authorizedBy;
    this.reason = data.reason;
    this.expiresAt = data.expiresAt;
    this.used = data.used || false;
    this.metadata = data.metadata || {};
  }
}

export class UsageStats {
  constructor(scriptId) {
    this.scriptId = scriptId;
    this.totalExecutions = 0;
    this.lastExecution = null;
    this.averageDuration = 0;
    this.successRate = 0;
    this.contexts = {};
    this.authorities = {};
    this.bypasses = 0;
  }

  addExecution(metadata) {
    this.totalExecutions++;
    this.lastExecution = metadata.timestamp;

    // Calcular duração média
    if (metadata.duration) {
      const totalDuration = this.averageDuration * (this.totalExecutions - 1) + metadata.duration;
      this.averageDuration = totalDuration / this.totalExecutions;
    }

    // Taxa de sucesso
    const successCount = metadata.success ? 1 : 0;
    const totalSuccess = this.successRate * (this.totalExecutions - 1) + successCount;
    this.successRate = totalSuccess / this.totalExecutions;

    // Distribuição por contexto
    this.contexts[metadata.context] = (this.contexts[metadata.context] || 0) + 1;

    // Distribuição por autoridade
    this.authorities[metadata.runAuthority] = (this.authorities[metadata.runAuthority] || 0) + 1;

    // Contar bypasses
    if (metadata.runAuthority === 'force-bypass') {
      this.bypasses++;
    }
  }
}

// Classe principal do Usage Monitor
export class UsageMonitor {
  constructor() {
    this.isRunning = false;
    this.events = [];
    this.usageStats = new Map();
    this.bypassHistory = [];
    this.hooks = new Map();

    // Arquivos de dados
    this.usageFile = path.resolve(__dirname, '../data/usage-history.json');
    this.bypassFile = path.resolve(__dirname, '../data/bypass-history.json');
    this.eventsFile = path.resolve(__dirname, '../data/usage-events.json');

    // Watcher para filesystem
    this.watcher = null;
  }

  // Controle de ciclo de vida - Interface Obrigatória
  async start() {
    if (this.isRunning) return;

    console.log('🔍 Usage Monitor: Starting...');

    // Carregar dados históricos
    await this.loadHistoricalData();

    // Instalar hooks em scripts existentes
    await this.installScriptHooks();

    // Iniciar monitoramento de filesystem
    this.startFilesystemWatcher();

    this.isRunning = true;
    console.log('✅ Usage Monitor: Active');
  }

  async stop() {
    if (!this.isRunning) return;

    console.log('🛑 Usage Monitor: Stopping...');

    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    await this.saveData();
    this.isRunning = false;
    console.log('✅ Usage Monitor: Stopped');
  }

  // Monitoramento - Interface Obrigatória
  async trackExecution(scriptId, metadata = {}) {
    const executionMetadata = new ExecutionMetadata(metadata);

    // Atualizar estatísticas
    if (!this.usageStats.has(scriptId)) {
      this.usageStats.set(scriptId, new UsageStats(scriptId));
    }

    const stats = this.usageStats.get(scriptId);
    stats.addExecution(executionMetadata);

    // Registrar bypass se aplicável
    if (executionMetadata.runAuthority === 'force-bypass') {
      const bypass = new BypassEvent({
        scriptId,
        timestamp: executionMetadata.timestamp,
        authorizedBy: executionMetadata.user,
        reason: executionMetadata.reasonForBypass,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
        metadata: { context: executionMetadata.context }
      });
      this.bypassHistory.push(bypass);

      this.emitEvent('bypass-used', {
        scriptId,
        authorizedBy: bypass.authorizedBy,
        reason: bypass.reason
      });
    }

    // Salvar periodicamente
    await this.saveData();

    // Emitir evento
    this.emitEvent('script-executed', {
      scriptId,
      metadata: executionMetadata,
      stats: {
        totalExecutions: stats.totalExecutions,
        successRate: stats.successRate
      }
    });

    return executionMetadata;
  }

  async getUsageStats(scriptId, period = { days: 30 }) {
    const stats = this.usageStats.get(scriptId);
    if (!stats) return null;

    // Filtrar por período se necessário
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - (period.days || 30));

    // Para implementação completa, seria necessário armazenar histórico detalhado
    // Por enquanto, retornamos estatísticas agregadas
    return stats;
  }

  async getUnusedScripts(thresholdDays = 30) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - thresholdDays);

    const unused = [];

    for (const [scriptId, stats] of this.usageStats) {
      if (!stats.lastExecution || new Date(stats.lastExecution) < cutoff) {
        unused.push(scriptId);
      }
    }

    return unused;
  }

  // Análise - Interface Obrigatória
  async detectNewScripts() {
    // Verificar scripts que existem no filesystem mas não no registry
    const scriptDir = path.resolve(__dirname, '../../scripts');
    const existingScripts = new Set();

    if (fs.existsSync(scriptDir)) {
      const files = fs.readdirSync(scriptDir);
      files.forEach(file => {
        if (file.endsWith('.mjs') || file.endsWith('.js')) {
          existingScripts.add(file.replace(/\.(mjs|js)$/, ''));
        }
      });
    }

    // Em produção, isso seria comparado com o registry
    // Por enquanto, retornamos todos os scripts encontrados
    return Array.from(existingScripts);
  }

  async detectModifiedScripts() {
    // Implementação simplificada - em produção usaria file watchers avançados
    // ou comparações de hash
    return [];
  }

  async detectDeletedScripts() {
    // Scripts que existem no histórico mas não no filesystem
    const existing = await this.detectNewScripts();
    const existingSet = new Set(existing);

    const deleted = [];
    for (const scriptId of this.usageStats.keys()) {
      if (!existingSet.has(scriptId)) {
        deleted.push(scriptId);
      }
    }

    return deleted;
  }

  // Novos Métodos para Auditoria (ajuste institucional)
  async getBypassHistory(scriptId = null) {
    let history = this.bypassHistory;

    if (scriptId) {
      history = history.filter(b => b.scriptId === scriptId);
    }

    return history;
  }

  async getAuthorityDistribution(period = { days: 30 }) {
    const distribution = {};
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - period.days);

    // Agregação simplificada - em produção seria mais sofisticada
    for (const stats of this.usageStats.values()) {
      Object.entries(stats.authorities).forEach(([authority, count]) => {
        distribution[authority] = (distribution[authority] || 0) + count;
      });
    }

    return distribution;
  }

  async validateRunAuthority(metadata) {
    const { runAuthority, reasonForBypass } = metadata;

    // Validações básicas de autoridade
    if (runAuthority === 'force-bypass' && !reasonForBypass) {
      return false; // Bypass requer justificativa
    }

    if (!['system', 'owner', 'force-bypass', 'unknown'].includes(runAuthority)) {
      return false; // Autoridade inválida
    }

    return true;
  }

  // Relatórios - Interface Obrigatória
  async generateUsageReport(period = { days: 30 }) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - period.days);

    const scripts = Array.from(this.usageStats.values());
    const totalExecutions = scripts.reduce((sum, s) => sum + s.totalExecutions, 0);

    // Scripts mais/menos usados
    const sortedByUsage = scripts.sort((a, b) => b.totalExecutions - a.totalExecutions);
    const mostUsedScripts = sortedByUsage.slice(0, 5).map(s => ({
      scriptId: s.scriptId,
      executions: s.totalExecutions,
      successRate: s.successRate
    }));

    const leastUsedScripts = sortedByUsage.slice(-5).map(s => ({
      scriptId: s.scriptId,
      executions: s.totalExecutions,
      lastExecution: s.lastExecution
    }));

    // Distribuição por contexto
    const contextDistribution = {};
    scripts.forEach(stats => {
      Object.entries(stats.contexts).forEach(([context, count]) => {
        contextDistribution[context] = (contextDistribution[context] || 0) + count;
      });
    });

    return {
      period: {
        start: cutoff.toISOString(),
        end: new Date().toISOString(),
        days: period.days
      },
      summary: {
        totalScripts: scripts.length,
        totalExecutions,
        averageExecutionsPerScript: scripts.length > 0 ? totalExecutions / scripts.length : 0
      },
      mostUsedScripts,
      leastUsedScripts,
      contextDistribution: Object.entries(contextDistribution).map(([context, count]) => ({
        context,
        executions: count,
        percentage: totalExecutions > 0 ? (count / totalExecutions * 100).toFixed(1) : 0
      })),
      trends: await this.calculateTrends(period)
    };
  }

  async calculateTrends(period) {
    // Implementação simplificada - em produção analisaria dados históricos
    return [{
      metric: 'total-executions',
      direction: 'stable',
      changePercent: 0,
      period: `${period.days} days`
    }];
  }

  // Implementação interna
  async installScriptHooks() {
    const scripts = await this.detectNewScripts();

    for (const scriptId of scripts) {
      await this.installHook(scriptId);
    }
  }

  async installHook(scriptId) {
    const scriptPath = path.resolve(__dirname, `../../scripts/${scriptId}.mjs`);
    const hookPath = path.resolve(__dirname, `../hooks/${scriptId}.hook.mjs`);

    // Criar hook que intercepta execução
    const hookContent = `
// AUTO-GENERATED HOOK - DO NOT EDIT
import { UsageMonitor } from '../core/usage-monitor.mjs';

const monitor = new UsageMonitor();
const startTime = Date.now();

try {
  // Importar e executar script original
  await import('${scriptPath}');

  // Registrar execução bem-sucedida
  await monitor.trackExecution('${scriptId}', {
    context: process.env.CI ? 'ci' : 'local',
    success: true,
    duration: Date.now() - startTime,
    user: process.env.USER || process.env.USERNAME || 'system',
    runAuthority: 'system',
    policyVersion: '1.0.0'
  });

} catch (error) {
  // Registrar execução com falha
  await monitor.trackExecution('${scriptId}', {
    context: process.env.CI ? 'ci' : 'local',
    success: false,
    duration: Date.now() - startTime,
    user: process.env.USER || process.env.USERNAME || 'system',
    runAuthority: 'system',
    policyVersion: '1.0.0'
  });

  throw error; // Re-throw para não interferir na execução
}
`;

    // Criar diretório se não existir
    const hookDir = path.dirname(hookPath);
    if (!fs.existsSync(hookDir)) {
      fs.mkdirSync(hookDir, { recursive: true });
    }

    fs.writeFileSync(hookPath, hookContent);
  }

  startFilesystemWatcher() {
    const scriptDir = path.resolve(__dirname, '../../scripts');

    // Usar polling simples por enquanto
    // Em produção, usaria chokidar ou similar
    this.checkFilesystem = setInterval(async () => {
      try {
        const newScripts = await this.detectNewScripts();
        const modifiedScripts = await this.detectModifiedScripts();
        const deletedScripts = await this.detectDeletedScripts();

        if (newScripts.length > 0) {
          this.emitEvent('new-script-detected', { scripts: newScripts });
        }

        if (modifiedScripts.length > 0) {
          this.emitEvent('script-modified', { scripts: modifiedScripts });
        }

        if (deletedScripts.length > 0) {
          this.emitEvent('script-deleted', { scripts: deletedScripts });
        }
      } catch (error) {
        console.error('Filesystem watcher error:', error);
      }
    }, 30000); // Check a cada 30 segundos
  }

  // Persistência
  async loadHistoricalData() {
    // Carregar usage stats
    try {
      if (fs.existsSync(this.usageFile)) {
        const data = JSON.parse(fs.readFileSync(this.usageFile, 'utf8'));
        this.usageStats = new Map(
          Object.entries(data).map(([id, stats]) => [id, Object.assign(new UsageStats(id), stats)])
        );
      }
    } catch (error) {
      console.warn('Failed to load usage history:', error.message);
      this.usageStats = new Map();
    }

    // Carregar bypass history
    try {
      if (fs.existsSync(this.bypassFile)) {
        this.bypassHistory = JSON.parse(fs.readFileSync(this.bypassFile, 'utf8'))
          .map(b => new BypassEvent(b));
      }
    } catch (error) {
      console.warn('Failed to load bypass history:', error.message);
      this.bypassHistory = [];
    }
  }

  async saveData() {
    // Salvar usage stats
    const usageData = Object.fromEntries(
      Array.from(this.usageStats.entries()).map(([id, stats]) => [id, stats])
    );

    fs.writeFileSync(this.usageFile, JSON.stringify(usageData, null, 2));

    // Salvar bypass history
    fs.writeFileSync(this.bypassFile, JSON.stringify(this.bypassHistory, null, 2));

    // Salvar events (últimas 24h)
    const recentEvents = this.events.filter(e => {
      const eventTime = new Date(e.timestamp);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return eventTime > oneDayAgo;
    });

    fs.writeFileSync(this.eventsFile, JSON.stringify(recentEvents, null, 2));
  }

  // Sistema de eventos
  emitEvent(eventType, data) {
    const event = {
      type: eventType,
      timestamp: new Date().toISOString(),
      data
    };

    this.events.push(event);

    // Em produção, isso seria enviado para um event bus/alert manager
    console.log(`📊 Usage Event: ${eventType}`, data);
  }

  // Health check
  async healthCheck() {
    return {
      status: this.isRunning ? 'healthy' : 'stopped',
      scriptsTracked: this.usageStats.size,
      totalExecutions: Array.from(this.usageStats.values())
        .reduce((sum, s) => sum + s.totalExecutions, 0),
      bypassesThisMonth: this.bypassHistory.filter(b => {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return new Date(b.timestamp) > monthAgo;
      }).length,
      watcherActive: !!this.checkFilesystem
    };
  }
}

// Singleton
let monitorInstance = null;

export function getUsageMonitor() {
  if (!monitorInstance) {
    monitorInstance = new UsageMonitor();
  }
  return monitorInstance;
}

export async function initializeUsageMonitor() {
  const monitor = getUsageMonitor();
  await monitor.start();
  return monitor;
}

export default UsageMonitor;
