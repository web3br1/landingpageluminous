#!/usr/bin/env node

/**
 * COMPLIANCE ENGINE CORE
 * Orquestrador principal do sistema de governança
 * Coordenada registry, monitor e alert manager
 */

import { ScriptRegistry, getRegistry } from './script-registry.mjs';
import { UsageMonitor, getUsageMonitor } from './usage-monitor.mjs';
import { AlertManager, getAlertManager } from '../alerts/alert-manager.mjs';

// Classe principal do Compliance Core
export class ComplianceCore {
  constructor() {
    this.registry = null;
    this.monitor = null;
    this.alerts = null;
    this.isInitialized = false;

    // Estado do sistema
    this.systemStatus = 'stopped';
    this.lastHealthCheck = null;

    // Políticas de compliance
    this.policies = {
      currentVersion: '1.0.0',
      ownership: {
        maxUnownedDays: 7,
        requireApproval: true
      },
      usage: {
        maxUnusedDays: 30,
        requireTracking: true
      },
      quarantine: {
        requireReason: true,
        autoEscalationDays: 3
      }
    };
  }

  // Inicialização - Interface Obrigatória
  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('🚀 Initializing Compliance Engine Core...');

      // Inicializar componentes
      this.registry = getRegistry();
      await this.registry.load();

      this.monitor = getUsageMonitor();
      await this.monitor.start();

      this.alerts = getAlertManager();
      await this.alerts.loadData();

      // Configurar canais padrão (se não configurados)
      await this.configureDefaultChannels();

      // Registrar event listeners
      this.setupEventListeners();

      // Executar primeira verificação
      await this.runComplianceCheck();

      this.isInitialized = true;
      this.systemStatus = 'running';

      console.log('✅ Compliance Engine Core initialized successfully');

    } catch (error) {
      console.error('❌ Failed to initialize Compliance Engine:', error);
      this.systemStatus = 'error';
      throw error;
    }
  }

  async shutdown() {
    if (!this.isInitialized) return;

    try {
      console.log('🛑 Shutting down Compliance Engine Core...');

      if (this.monitor) {
        await this.monitor.stop();
      }

      this.systemStatus = 'stopped';
      this.isInitialized = false;

      console.log('✅ Compliance Engine Core shut down');

    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      throw error;
    }
  }

  // Verificações de Compliance - Interface Principal
  async checkCompliance(scriptId) {
    this.ensureInitialized();

    const script = await this.registry.get(scriptId);
    if (!script) {
      await this.alerts.send('unknown-script', { scriptId });
      return false;
    }

    const violations = await this.runComplianceChecks(script);

    if (violations.length > 0) {
      await this.alerts.send('compliance-violation', {
        scriptId,
        violations: violations.length,
        details: violations
      });
      return false;
    }

    return true;
  }

  async runComplianceAudit() {
    this.ensureInitialized();

    console.log('🔍 Running full compliance audit...');

    const results = {
      timestamp: new Date().toISOString(),
      policyVersion: this.policies.currentVersion,
      scripts: {
        total: 0,
        compliant: 0,
        violations: []
      },
      summary: {
        score: 0,
        criticalIssues: 0,
        warnings: 0
      }
    };

    // Obter todos os scripts
    const scripts = await this.registry.list();

    results.scripts.total = scripts.length;
    let compliantCount = 0;

    // Verificar cada script
    for (const script of scripts) {
      const violations = await this.runComplianceChecks(script);

      if (violations.length === 0) {
        compliantCount++;
      } else {
        results.scripts.violations.push({
          scriptId: script.id,
          violations: violations
        });

        // Contar severidade
        const criticalCount = violations.filter(v => v.severity === 'error').length;
        const warningCount = violations.filter(v => v.severity === 'warning').length;

        results.summary.criticalIssues += criticalCount;
        results.summary.warnings += warningCount;
      }
    }

    results.scripts.compliant = compliantCount;
    results.summary.score = results.scripts.total > 0 ?
      Math.round((compliantCount / results.scripts.total) * 100) : 0;

    console.log(`📊 Compliance Audit Complete: ${results.summary.score}% compliant`);

    return results;
  }

  // Verificações Individuais de Compliance
  async runComplianceChecks(script) {
    const violations = [];

    // 1. Verificação de propriedade
    const ownershipViolation = await this.checkOwnershipCompliance(script);
    if (ownershipViolation) violations.push(ownershipViolation);

    // 2. Verificação de aprovação
    const approvalViolation = await this.checkApprovalCompliance(script);
    if (approvalViolation) violations.push(approvalViolation);

    // 3. Verificação de quarentena
    const quarantineViolation = await this.checkQuarantineCompliance(script);
    if (quarantineViolation) violations.push(quarantineViolation);

    // 4. Verificação de uso
    const usageViolation = await this.checkUsageCompliance(script);
    if (usageViolation) violations.push(usageViolation);

    // 5. Verificação de strikes
    const strikeViolation = await this.checkStrikeCompliance(script);
    if (strikeViolation) violations.push(strikeViolation);

    return violations;
  }

  async checkOwnershipCompliance(script) {
    if (!script.owner || script.owner.trim() === '') {
      // Calcular dias sem owner
      const created = new Date(script.created);
      const now = new Date();
      const daysUnowned = Math.floor((now - created) / (1000 * 60 * 60 * 24));

      if (daysUnowned > this.policies.ownership.maxUnownedDays) {
        return {
          rule: 'ownership-missing',
          severity: 'error',
          message: `Script sem proprietário há ${daysUnowned} dias (limite: ${this.policies.ownership.maxUnownedDays})`,
          daysUnowned
        };
      }

      return {
        rule: 'ownership-missing',
        severity: 'warning',
        message: `Script sem proprietário atribuído`,
        daysUnowned
      };
    }

    return null;
  }

  async checkApprovalCompliance(script) {
    if (script.status === 'unapproved') {
      return {
        rule: 'approval-pending',
        severity: 'error',
        message: 'Script aguardando aprovação inicial'
      };
    }

    return null;
  }

  async checkQuarantineCompliance(script) {
    if (script.status === 'quarantined') {
      // Verificar se quarentena está expirando
      const quarantinedAt = new Date(script.quarantinedAt);
      const now = new Date();
      const daysInQuarantine = Math.floor((now - quarantinedAt) / (1000 * 60 * 60 * 24));

      if (daysInQuarantine > this.policies.quarantine.autoEscalationDays) {
        return {
          rule: 'quarantine-expired',
          severity: 'error',
          message: `Script em quarentena há ${daysInQuarantine} dias, requer revisão`,
          daysInQuarantine
        };
      }
    }

    return null;
  }

  async checkUsageCompliance(script) {
    if (script.status === 'active') {
      const stats = await this.monitor.getUsageStats(script.id);

      if (!stats || !stats.lastExecution) {
        // Script nunca foi executado - verificar idade
        const created = new Date(script.created);
        const now = new Date();
        const daysOld = Math.floor((now - created) / (1000 * 60 * 60 * 24));

        if (daysOld > this.policies.usage.maxUnusedDays) {
          return {
            rule: 'never-executed',
            severity: 'warning',
            message: `Script criado há ${daysOld} dias mas nunca executado`,
            daysOld
          };
        }
      } else {
        // Verificar uso recente
        const lastExecution = new Date(stats.lastExecution);
        const now = new Date();
        const daysSinceLastUse = Math.floor((now - lastExecution) / (1000 * 60 * 60 * 24));

        if (daysSinceLastUse > this.policies.usage.maxUnusedDays) {
          return {
            rule: 'usage-threshold-exceeded',
            severity: 'warning',
            message: `Script não executado há ${daysSinceLastUse} dias`,
            daysSinceLastUse
          };
        }
      }
    }

    return null;
  }

  async checkStrikeCompliance(script) {
    if (script.strikes >= 3) {
      return {
        rule: 'strike-limit-exceeded',
        severity: 'error',
        message: `Script atingiu limite de strikes (${script.strikes}/3)`,
        strikes: script.strikes
      };
    } else if (script.strikes >= 2) {
      return {
        rule: 'strike-warning',
        severity: 'warning',
        message: `Script com ${script.strikes} strikes, próximo será depreciação`,
        strikes: script.strikes
      };
    }

    return null;
  }

  // Relatórios Trimestrais
  async runQuarterlyAudit() {
    this.ensureInitialized();

    console.log('📊 Generating Quarterly Compliance Report...');

    const [registryMetrics, usageMetrics, alertMetrics] = await Promise.all([
      this.registry.generateMetrics(),
      this.monitor.generateUsageReport({ days: 90 }),
      this.alerts.getAlertStats({ days: 90 })
    ]);

    const report = {
      period: this.getCurrentQuarter(),
      generatedAt: new Date().toISOString(),
      policyVersion: this.policies.currentVersion,

      executiveSummary: {
        complianceRate: this.calculateOverallCompliance(registryMetrics, usageMetrics),
        scriptsActive: registryMetrics.activeScripts,
        scriptsLegacy: registryMetrics.legacyScripts,
        scriptsDeprecated: registryMetrics.deprecatedScripts,
        keyAchievements: await this.identifyKeyAchievements(),
        criticalIssues: await this.identifyCriticalIssues()
      },

      metrics: {
        registry: registryMetrics,
        usage: usageMetrics,
        alerts: alertMetrics
      },

      analysis: {
        trends: await this.calculateTrends(),
        risks: await this.assessRisks(),
        recommendations: await this.generateRecommendations()
      }
    };

    // Enviar relatório
    await this.alerts.send('quarterly-report', {
      compliance: report.executiveSummary.complianceRate,
      deprecated: registryMetrics.deprecatedScripts
    });

    return report;
  }

  // Utilitários
  ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('Compliance Engine not initialized. Call initialize() first.');
    }
  }

  async configureDefaultChannels() {
    // Configurações mínimas para desenvolvimento
    // Em produção, isso seria feito via configuração externa
    try {
      // Configurar canal de console como fallback
      await this.alerts.configureChannel('console', 'slack', {
        webhookUrl: 'console://localhost',
        channel: 'console',
        testRecipient: 'console'
      });
    } catch (error) {
      console.warn('Failed to configure default channels:', error.message);
    }
  }

  setupEventListeners() {
    // Escutar eventos dos componentes e reagir
    this.monitor.on('script-executed', async (event) => {
      await this.handleScriptExecuted(event);
    });

    this.registry.on('script-registered', async (event) => {
      await this.handleScriptRegistered(event);
    });

    this.alerts.on('alert-acknowledged', async (event) => {
      await this.handleAlertAcknowledged(event);
    });
  }

  async handleScriptExecuted(event) {
    // Atualizar métricas quando script é executado
    const script = await this.registry.get(event.scriptId);
    if (script) {
      script.lastUsed = event.metadata.timestamp;
      await this.registry.save();
    }
  }

  async handleScriptRegistered(event) {
    // Verificar compliance do novo script
    setTimeout(async () => {
      await this.checkCompliance(event.scriptId);
    }, 1000); // Dar tempo para o registro completar
  }

  async handleAlertAcknowledged(event) {
    // Log de acknowledgment para auditoria
    console.log(`✅ Alert ${event.alertId} acknowledged by ${event.acknowledgedBy}`);
  }

  // Cálculos para relatórios
  calculateOverallCompliance(registry, usage) {
    // Lógica simplificada - em produção seria mais sofisticada
    const registryScore = registry.ownershipCoverage;
    const usageScore = usage.summary ? usage.summary.averageExecutionsPerScript * 10 : 0; // normalizar

    return Math.min(100, Math.round((registryScore + usageScore) / 2));
  }

  async identifyKeyAchievements() {
    // Lógica simplificada
    const metrics = await this.registry.generateMetrics();
    const achievements = [];

    if (metrics.ownershipCoverage > 80) {
      achievements.push('Taxa de propriedade > 80%');
    }

    if (metrics.quarantinedScripts === 0) {
      achievements.push('Zero scripts em quarentena');
    }

    return achievements;
  }

  async identifyCriticalIssues() {
    const metrics = await this.registry.generateMetrics();
    const issues = [];

    if (metrics.unownedScripts > 0) {
      issues.push(`${metrics.unownedScripts} scripts sem proprietário`);
    }

    if (metrics.quarantinedScripts > 0) {
      issues.push(`${metrics.quarantinedScripts} scripts em quarentena`);
    }

    return issues;
  }

  async calculateTrends() {
    // Implementação simplificada
    return [{
      metric: 'compliance-rate',
      direction: 'stable',
      changePercent: 0,
      period: '3 months'
    }];
  }

  async assessRisks() {
    const metrics = await this.registry.generateMetrics();
    const risks = [];

    if (metrics.unownedScripts > 2) {
      risks.push({
        id: 'unowned-scripts-risk',
        description: `${metrics.unownedScripts} scripts sem proprietário atribuído`,
        severity: 'high',
        area: 'compliance',
        owner: 'engineering-manager',
        deadline: this.addDays(new Date(), 7).toISOString(),
        status: 'open'
      });
    }

    return risks;
  }

  async generateRecommendations() {
    const recommendations = [];
    const metrics = await this.registry.generateMetrics();

    if (metrics.legacyScripts > 5) {
      recommendations.push({
        priority: 'medium',
        action: 'Revisar scripts legacy para depreciação',
        impact: `${metrics.legacyScripts} scripts candidatos`
      });
    }

    return recommendations;
  }

  getCurrentQuarter() {
    const now = new Date();
    const quarter = Math.floor(now.getMonth() / 3) + 1;
    const year = now.getFullYear();
    return `Q${quarter}-${year}`;
  }

  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  // Health Check
  async healthCheck() {
    const components = await Promise.allSettled([
      this.registry.healthCheck(),
      this.monitor.healthCheck(),
      this.alerts.healthCheck()
    ]);

    const health = {
      status: this.systemStatus,
      timestamp: new Date().toISOString(),
      components: {
        registry: components[0].status === 'fulfilled' ? components[0].value : { status: 'error' },
        monitor: components[1].status === 'fulfilled' ? components[1].value : { status: 'error' },
        alerts: components[2].status === 'fulfilled' ? components[2].value : { status: 'error' }
      },
      overallHealth: this.calculateOverallHealth(components)
    };

    this.lastHealthCheck = health;
    return health;
  }

  calculateOverallHealth(components) {
    const healthy = components.filter(c => c.status === 'fulfilled' && c.value.status === 'healthy').length;
    const total = components.length;

    if (healthy === total) return 'healthy';
    if (healthy >= total / 2) return 'degraded';
    return 'unhealthy';
  }
}

// Singleton
let coreInstance = null;

export function getComplianceCore() {
  if (!coreInstance) {
    coreInstance = new ComplianceCore();
  }
  return coreInstance;
}

export async function initializeComplianceEngine() {
  const core = getComplianceCore();
  await core.initialize();
  return core;
}

export default ComplianceCore;
