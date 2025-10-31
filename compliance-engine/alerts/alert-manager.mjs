#!/usr/bin/env node

/**
 * COMPLIANCE ENGINE - ALERT MANAGER
 * Gerenciador central de alertas com SLA institucional
 * Implementa matriz de severidade e escalação automática
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ⚠️ MATRIZ SLA INSTITUCIONAL (contrato obrigatório)
export const SEVERITY_MATRIX = {
  low: {
    level: 'low',
    acknowledgmentSLA: 120,    // 5 dias úteis em horas
    resolutionSLA: null,       // sem SLA de resolução
    responsibleRoles: ['owner'],
    escalationPath: ['owner']
  },
  medium: {
    level: 'medium',
    acknowledgmentSLA: 48,     // 48 horas
    resolutionSLA: 168,        // 7 dias úteis em horas
    responsibleRoles: ['owner'],
    escalationPath: ['owner', 'tech-lead']
  },
  high: {
    level: 'high',
    acknowledgmentSLA: 4,      // 4 horas
    resolutionSLA: 24,         // 24 horas
    responsibleRoles: ['owner', 'tech-lead'],
    escalationPath: ['owner', 'tech-lead', 'director']
  },
  critical: {
    level: 'critical',
    acknowledgmentSLA: 0.25,   // 15 minutos
    resolutionSLA: 2,          // 2 horas
    responsibleRoles: ['owner', 'director'],
    escalationPath: ['owner', 'director', 'executive']
  }
};

// Interfaces conforme contrato
export class AlertData {
  constructor(data) {
    // Identificação
    this.id = data.id || this.generateId();
    this.type = data.type;
    this.severity = data.severity || 'medium';

    // Contexto
    this.timestamp = data.timestamp || new Date().toISOString();
    this.source = data.source || 'compliance-engine';
    this.scriptId = data.scriptId || null;
    this.owner = data.owner || null;

    // Conteúdo
    this.title = data.title;
    this.message = data.message;
    this.actionRequired = data.actionRequired || null;
    this.deadline = data.deadline || null;

    // ⚠️ SLA Tracking (ajuste institucional)
    this.severityMatrix = SEVERITY_MATRIX[this.severity];
    this.acknowledgedAt = data.acknowledgedAt || null;
    this.acknowledgedBy = data.acknowledgedBy || null;
    this.resolvedAt = data.resolvedAt || null;
    this.resolvedBy = data.resolvedBy || null;
    this.slaBreach = data.slaBreach || false;
    this.escalatedAt = data.escalatedAt || null;

    // Metadados
    this.metadata = data.metadata || {};
  }

  generateId() {
    return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  isSLABreached() {
    if (!this.severityMatrix) return false;

    const now = new Date();

    // Verificar SLA de acknowledgment
    if (this.severityMatrix.acknowledgmentSLA && !this.acknowledgedAt) {
      const acknowledgmentDeadline = new Date(this.timestamp);
      acknowledgmentDeadline.setHours(acknowledgmentDeadline.getHours() + this.severityMatrix.acknowledgmentSLA);

      if (now > acknowledgmentDeadline) {
        return true;
      }
    }

    // Verificar SLA de resolution
    if (this.severityMatrix.resolutionSLA && !this.resolvedAt) {
      const resolutionDeadline = new Date(this.timestamp);
      resolutionDeadline.setHours(resolutionDeadline.getHours() + this.severityMatrix.resolutionSLA);

      if (now > resolutionDeadline) {
        return true;
      }
    }

    return false;
  }

  acknowledge(user) {
    this.acknowledgedAt = new Date().toISOString();
    this.acknowledgedBy = user;
  }

  resolve(user) {
    this.resolvedAt = new Date().toISOString();
    this.resolvedBy = user;
  }

  escalate(reason) {
    this.escalatedAt = new Date().toISOString();
    this.metadata.escalationReason = reason;
    this.metadata.escalationLevel = this.getNextEscalationLevel();
  }

  getNextEscalationLevel() {
    const currentLevel = this.metadata.escalationLevel || 0;
    const escalationPath = this.severityMatrix.escalationPath;

    if (currentLevel < escalationPath.length - 1) {
      return currentLevel + 1;
    }

    return currentLevel;
  }

  getCurrentResponsible() {
    const escalationLevel = this.metadata.escalationLevel || 0;
    const escalationPath = this.severityMatrix.escalationPath;

    return escalationPath[Math.min(escalationLevel, escalationPath.length - 1)];
  }
}

export class BulkAlert {
  constructor(data) {
    this.alerts = data.alerts || [];
    this.groupId = data.groupId || this.generateGroupId();
    this.groupTitle = data.groupTitle || 'Bulk Alert Group';
    this.priority = data.priority || 'normal';
  }

  generateGroupId() {
    return `bulk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Templates de alertas obrigatórios
export const ALERT_TEMPLATES = {
  'script-unowned': {
    title: '🚨 Script sem proprietário',
    template: 'Script {{scriptId}} não tem dono atribuído. Deve ser atribuído em até 7 dias.',
    severity: 'medium',
    actionRequired: 'Atribuir dono via compliance registry'
  },
  'new-script-unapproved': {
    title: '🆕 Novo script detectado',
    template: 'Script {{scriptId}} foi criado mas ainda não foi aprovado. Deve ser registrado.',
    severity: 'high',
    actionRequired: 'Registrar script no compliance registry'
  },
  'script-unused': {
    title: '⚠️ Script não utilizado',
    template: 'Script {{scriptId}} não foi executado nos últimos 30 dias.',
    severity: 'low',
    actionRequired: 'Revisar necessidade do script'
  },
  'script-quarantined': {
    title: '🚫 Script em quarentena',
    template: 'Script {{scriptId}} foi colocado em quarentena: {{quarantineReason}}',
    severity: 'critical',
    actionRequired: 'Revisar script em quarentena'
  },
  'compliance-violation': {
    title: '⚠️ Violação de conformidade',
    template: 'Script {{scriptId}} violou {{violations}} regras de compliance.',
    severity: 'high',
    actionRequired: 'Corrigir violações ou depreciar script'
  },
  'strike-added': {
    title: '⚡ Strike adicionado',
    template: 'Script {{scriptId}} recebeu strike por violação. Total: {{strikes}}/3',
    severity: 'medium',
    actionRequired: 'Revisar script ou aceitar depreciação'
  },
  'bypass-used': {
    title: '🔓 Bypass autorizado usado',
    template: 'Bypass de {{authorizedBy}} usado em {{scriptId}}: {{reason}}',
    severity: 'medium',
    actionRequired: 'Auditar uso apropriado do bypass'
  }
};

// Canais de notificação
export class SlackChannel {
  constructor(config) {
    this.webhookUrl = config.webhookUrl;
    this.channel = config.channel;
    this.username = config.username || 'Compliance Engine';
  }

  async send(message) {
    // Implementação simplificada - em produção usaria axios/fetch
    console.log(`📢 Slack [${this.channel}]: ${message.title}`);

    // Simular envio
    return { success: true, messageId: this.generateId() };
  }

  generateId() {
    return `slack-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class EmailChannel {
  constructor(config) {
    this.smtpConfig = config.smtp;
    this.from = config.from;
    this.templates = config.templates || {};
  }

  async send(message) {
    console.log(`📧 Email to ${message.recipient}: ${message.title}`);

    // Simular envio
    return { success: true, messageId: this.generateId() };
  }

  generateId() {
    return `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export class GitHubIssuesChannel {
  constructor(config) {
    this.repo = config.repo || 'local/compliance-alerts';
    this.token = config.token || 'local-dev-token';
    this.issuesFile = path.resolve(__dirname, '../data/github-issues.json');
    this.labels = {
      'script-unowned': 'ownership',
      'new-script-unapproved': 'registration',
      'script-unused': 'cleanup',
      'script-quarantined': 'security',
      'compliance-violation': 'compliance',
      'strike-added': 'warning',
      'bypass-used': 'audit'
    };
  }

  async send(alert) {
    console.log(`🐙 GitHub Issue [${this.repo}]: Creating issue for alert ${alert.id}`);

    const issue = {
      id: `issue-${Date.now()}`,
      number: this.getNextIssueNumber(),
      title: alert.title,
      body: this.formatIssueBody(alert),
      labels: [this.labels[alert.type] || 'compliance', alert.severity],
      state: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      alertId: alert.id,
      assignee: this.getAssigneeForAlert(alert),
      milestone: this.getMilestoneForSeverity(alert.severity)
    };

    // Salvar issue localmente
    await this.saveIssue(issue);

    return {
      success: true,
      issueNumber: issue.number,
      issueUrl: `https://github.com/${this.repo}/issues/${issue.number}`,
      issueId: issue.id
    };
  }

  formatIssueBody(alert) {
    const severity = (alert.severity || 'medium').toUpperCase();
    const slaInfo = this.getSLAInfo(alert);

    return `## 🚨 Compliance Alert - ${severity}

**Alert ID:** ${alert.id}
**Type:** ${alert.type}
**Severity:** ${alert.severity}
**Timestamp:** ${alert.timestamp}

### Description
${alert.message}

### Required Action
${alert.actionRequired || 'Review and resolve compliance issue'}

### SLA Information
${slaInfo}

### Context
- **Script:** ${alert.scriptId || 'N/A'}
- **Owner:** ${alert.owner || 'Unassigned'}
- **Source:** ${alert.source}

### Technical Details
\`\`\`json
${JSON.stringify(alert.metadata || {}, null, 2)}
\`\`\`

### Resolution Steps
1. Acknowledge this alert within ${this.getAcknowledgmentSLA(alert.severity)} hours
2. Investigate the root cause
3. Implement corrective action
4. Close this issue with resolution details

---
*This issue was automatically created by the Compliance Engine*
*Policy Version: ${alert.metadata?.policyVersion || '1.0.0'}*`;
  }

  getSLAInfo(alert) {
    const acknowledgment = this.getAcknowledgmentSLA(alert.severity);
    const resolution = this.getResolutionSLA(alert.severity);

    return `**Acknowledgment SLA:** ${acknowledgment} hours
**Resolution SLA:** ${resolution} hours
**Escalation Path:** ${this.getEscalationPath(alert.severity)}`;
  }

  getAcknowledgmentSLA(severity) {
    const slas = {
      low: 120,      // 5 days
      medium: 48,    // 48 hours
      high: 4,       // 4 hours
      critical: 0.25 // 15 minutes
    };
    return slas[severity] || 24;
  }

  getResolutionSLA(severity) {
    const slas = {
      low: null,     // No resolution SLA
      medium: 168,   // 7 days
      high: 24,      // 24 hours
      critical: 2    // 2 hours
    };
    return slas[severity] || 72;
  }

  getEscalationPath(severity) {
    const paths = {
      low: 'Owner',
      medium: 'Owner → Tech Lead',
      high: 'Owner → Tech Lead → Director',
      critical: 'Owner → Director → Executive'
    };
    return paths[severity] || 'Owner → Tech Lead';
  }

  getAssigneeForAlert(alert) {
    // Lógica para determinar responsável baseado no tipo de alerta
    if (alert.type === 'script-unowned' || alert.type === 'new-script-unapproved') {
      return 'compliance-manager';
    }

    if (alert.type === 'script-quarantined' || alert.type === 'compliance-violation') {
      return alert.owner || 'security-team';
    }

    if (alert.type === 'bypass-used') {
      return 'audit-team';
    }

    return alert.owner || 'engineering-team';
  }

  getMilestoneForSeverity(severity) {
    const milestones = {
      low: 'Backlog',
      medium: 'Sprint +1',
      high: 'Current Sprint',
      critical: 'Emergency'
    };
    return milestones[severity] || 'Backlog';
  }

  async saveIssue(issue) {
    let issues = [];

    // Carregar issues existentes
    if (fs.existsSync(this.issuesFile)) {
      try {
        issues = JSON.parse(fs.readFileSync(this.issuesFile, 'utf8'));
      } catch (error) {
        console.warn('Failed to load existing issues:', error.message);
      }
    }

    // Adicionar nova issue
    issues.push(issue);

    // Salvar
    fs.writeFileSync(this.issuesFile, JSON.stringify(issues, null, 2));
  }

  getNextIssueNumber() {
    if (!fs.existsSync(this.issuesFile)) return 1;

    try {
      const issues = JSON.parse(fs.readFileSync(this.issuesFile, 'utf8'));
      const numbers = issues.map(i => i.number || 0);
      return Math.max(...numbers, 0) + 1;
    } catch {
      return 1;
    }
  }
}

// Classe principal do Alert Manager
export class AlertManager {
  constructor() {
    this.channels = new Map();
    this.activeAlerts = new Map();
    this.alertHistory = [];

    // Arquivos de dados
    this.alertsFile = path.resolve(__dirname, '../data/alerts-history.json');
    this.channelsFile = path.resolve(__dirname, '../data/channels-config.json');

    // SLA Monitor
    this.slaMonitor = setInterval(() => this.checkSLABreaches(), 60000); // check a cada minuto
  }

  // Configuração - Interface Obrigatória
  async configureChannel(channelId, type, config) {
    let channel;

    switch (type) {
      case 'slack':
        channel = new SlackChannel(config);
        break;
      case 'email':
        channel = new EmailChannel(config);
        break;
      case 'github-issues':
        channel = new GitHubIssuesChannel(config);
        break;
      default:
        throw new Error(`Unsupported channel type: ${type}`);
    }

    this.channels.set(channelId, { type, instance: channel, config });

    // Testar canal
    const testResult = await this.testChannel(channelId);
    if (!testResult) {
      console.warn(`⚠️ Channel ${channelId} failed test`);
    }

    await this.saveChannelsConfig();
    return channel;
  }

  async testChannel(channelId) {
    const channel = this.channels.get(channelId);
    if (!channel) return false;

    try {
      const testAlert = {
        id: `test-${Date.now()}`,
        type: 'test-alert',
        severity: 'low',
        title: 'Test Alert - Compliance Engine',
        message: 'This is a test message from Compliance Engine',
        timestamp: new Date().toISOString(),
        source: 'compliance-engine',
        metadata: { test: true }
      };

      await channel.instance.send(testAlert);
      return true;
    } catch (error) {
      console.error(`Channel test failed for ${channelId}:`, error);
      return false;
    }
  }

  // Envio - Interface Obrigatória
  async send(alertType, data) {
    const template = ALERT_TEMPLATES[alertType];
    if (!template) {
      throw new Error(`Unknown alert type: ${alertType}`);
    }

    // Criar alerta
    const alertData = {
      type: alertType,
      severity: template.severity,
      title: this.renderTemplate(template.title, data),
      message: this.renderTemplate(template.template, data),
      actionRequired: template.actionRequired,
      ...data
    };

    const alert = new AlertData(alertData);
    this.activeAlerts.set(alert.id, alert);

    // Enviar para canais apropriados
    await this.sendToChannels(alert);

    // Salvar
    await this.saveAlerts();

    this.emitEvent('alert-sent', { alertId: alert.id, type: alertType });
    return alert;
  }

  async sendBulk(bulkAlert) {
    const results = [];

    for (const alertData of bulkAlert.alerts) {
      try {
        const alert = await this.send(alertData.type, alertData);
        results.push({ success: true, alertId: alert.id });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }

    return results;
  }

  // Gerenciamento - Interface Obrigatória
  async getActiveAlerts() {
    return Array.from(this.activeAlerts.values());
  }

  async acknowledgeAlert(alertId, user) {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.acknowledge(user);
    await this.saveAlerts();

    this.emitEvent('alert-acknowledged', { alertId, acknowledgedBy: user });
  }

  async escalateAlert(alertId, reason) {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert ${alertId} not found`);
    }

    alert.escalate(reason);
    await this.saveAlerts();

    // Re-enviar para novo responsável
    await this.sendToChannels(alert, true);

    this.emitEvent('alert-escalated', { alertId, reason });
  }

  // Relatórios - Interface Obrigatória
  async getAlertStats(period = { days: 30 }) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - period.days);

    const alerts = this.alertHistory.filter(a => new Date(a.timestamp) > cutoff);

    // Calcular métricas de SLA
    const slaMetrics = this.calculateSLAMetrics(alerts);

    return {
      totalAlerts: alerts.length,
      alertsByType: this.groupBy(alerts, 'type'),
      alertsBySeverity: this.groupBy(alerts, 'severity'),
      responseTime: this.calculateResponseTimeStats(alerts),
      escalationRate: alerts.filter(a => a.escalatedAt).length / alerts.length,
      breachRate: alerts.filter(a => a.slaBreach).length / alerts.length,
      ...slaMetrics
    };
  }

  calculateSLAMetrics(alerts) {
    const metrics = {};

    Object.keys(SEVERITY_MATRIX).forEach(severity => {
      const severityAlerts = alerts.filter(a => a.severity === severity);
      const acknowledged = severityAlerts.filter(a => a.acknowledgedAt);
      const resolved = severityAlerts.filter(a => a.resolvedAt);
      const breaches = severityAlerts.filter(a => a.slaBreach);

      metrics[severity] = {
        total: severityAlerts.length,
        acknowledgedWithinSLA: acknowledged.filter(a => {
          const acknowledgedTime = new Date(a.acknowledgedAt);
          const deadline = new Date(a.timestamp);
          deadline.setHours(deadline.getHours() + a.severityMatrix.acknowledgmentSLA);
          return acknowledgedTime <= deadline;
        }).length,
        resolvedWithinSLA: resolved.filter(a => {
          const resolvedTime = new Date(a.resolvedAt);
          const deadline = new Date(a.timestamp);
          deadline.setHours(deadline.getHours() + a.severityMatrix.resolutionSLA);
          return resolvedTime <= deadline;
        }).length,
        breaches: breaches.length
      };
    });

    return { slaComplianceBySeverity: metrics };
  }

  calculateResponseTimeStats(alerts) {
    const responseTimes = alerts
      .filter(a => a.acknowledgedAt)
      .map(a => {
        const created = new Date(a.timestamp);
        const acknowledged = new Date(a.acknowledgedAt);
        return (acknowledged - created) / (1000 * 60 * 60); // horas
      });

    if (responseTimes.length === 0) return { average: 0, median: 0, p95: 0 };

    const sorted = responseTimes.sort((a, b) => a - b);

    return {
      average: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)]
    };
  }

  // Implementação interna
  async sendToChannels(alert, isEscalation = false) {
    const responsible = alert.getCurrentResponsible();
    const channelKey = isEscalation ? `escalation-${responsible}` : responsible;

    const channel = this.channels.get(channelKey);
    if (!channel) {
      console.warn(`No channel configured for ${channelKey}`);
      return;
    }

    const message = {
      title: alert.title,
      message: alert.message,
      recipient: this.getRecipientForRole(responsible),
      severity: alert.severity,
      actionRequired: alert.actionRequired,
      deadline: alert.deadline
    };

    try {
      await channel.instance.send(message);
    } catch (error) {
      console.error(`Failed to send alert to ${channelKey}:`, error);
    }
  }

  getRecipientForRole(role) {
    // Em produção, isso seria um mapeamento dinâmico
    const roleMapping = {
      owner: 'script-owner@company.com',
      'tech-lead': 'tech-leads@company.com',
      director: 'engineering-director@company.com',
      executive: 'ceo@company.com'
    };

    return roleMapping[role] || 'compliance@company.com';
  }

  renderTemplate(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => data[key] || '');
  }

  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const value = item[key];
      groups[value] = (groups[value] || 0) + 1;
      return groups;
    }, {});
  }

  async checkSLABreaches() {
    const now = new Date();

    for (const [alertId, alert] of this.activeAlerts) {
      if (alert.isSLABreached() && !alert.slaBreach) {
        alert.slaBreach = true;

        // Escalar automaticamente
        await this.escalateAlert(alertId, 'SLA breach detected');

        this.emitEvent('sla-breached', { alertId, severity: alert.severity });
      }
    }
  }

  // Persistência
  async loadData() {
    // Carregar histórico de alertas
    try {
      if (fs.existsSync(this.alertsFile)) {
        const data = JSON.parse(fs.readFileSync(this.alertsFile, 'utf8'));
        this.alertHistory = data.map(a => new AlertData(a));
      }
    } catch (error) {
      console.warn('Failed to load alerts history:', error.message);
      this.alertHistory = [];
    }

    // Carregar configuração de canais
    try {
      if (fs.existsSync(this.channelsFile)) {
        const data = JSON.parse(fs.readFileSync(this.channelsFile, 'utf8'));
        for (const [channelId, channelData] of Object.entries(data)) {
          await this.configureChannel(channelId, channelData.type, channelData.config);
        }
      }
    } catch (error) {
      console.warn('Failed to load channels config:', error.message);
    }
  }

  async saveAlerts() {
    // Mover alertas resolvidos para histórico
    const resolvedAlerts = [];
    for (const [alertId, alert] of this.activeAlerts) {
      if (alert.resolvedAt) {
        resolvedAlerts.push(alert);
        this.activeAlerts.delete(alertId);
      }
    }

    this.alertHistory.push(...resolvedAlerts);

    // Salvar dados
    const activeData = Array.from(this.activeAlerts.values());
    const historyData = this.alertHistory.slice(-1000); // manter últimas 1000

    fs.writeFileSync(this.alertsFile, JSON.stringify([...activeData, ...historyData], null, 2));
  }

  async saveChannelsConfig() {
    const config = {};
    for (const [channelId, channelData] of this.channels) {
      config[channelId] = {
        type: channelData.type,
        config: channelData.config
      };
    }

    fs.writeFileSync(this.channelsFile, JSON.stringify(config, null, 2));
  }

  // Sistema de eventos
  emitEvent(eventType, data) {
    const event = {
      type: eventType,
      timestamp: new Date().toISOString(),
      data
    };

    // Em produção, isso seria enviado para um event bus
    console.log(`🚨 Alert Event: ${eventType}`, data);
  }

  // Health check
  async healthCheck() {
    const activeCount = this.activeAlerts.size;
    const historyCount = this.alertHistory.size;
    const channelsCount = this.channels.size;

    const recentBreaches = Array.from(this.activeAlerts.values())
      .filter(a => a.slaBreach).length;

    return {
      status: 'healthy',
      activeAlerts: activeCount,
      historicalAlerts: historyCount,
      configuredChannels: channelsCount,
      recentSLABreaches: recentBreaches,
      slaMonitorActive: !!this.slaMonitor
    };
  }

  // Cleanup
  destroy() {
    if (this.slaMonitor) {
      clearInterval(this.slaMonitor);
    }
  }
}

// Singleton
let alertManagerInstance = null;

export function getAlertManager() {
  if (!alertManagerInstance) {
    alertManagerInstance = new AlertManager();
  }
  return alertManagerInstance;
}

export async function initializeAlertManager() {
  const manager = getAlertManager();
  await manager.loadData();
  return manager;
}

export default AlertManager;
