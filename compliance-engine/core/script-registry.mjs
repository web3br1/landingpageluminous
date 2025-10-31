#!/usr/bin/env node

/**
 * COMPLIANCE ENGINE - SCRIPT REGISTRY
 * Registro canônico de todos os scripts aprovados
 * Implementa contratos de governança institucional
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enums e Interfaces conforme Manual de Governo
export const ScriptStatus = {
  UNAPPROVED: 'unapproved',
  ACTIVE: 'active',
  QUARANTINED: 'quarantined',
  LEGACY: 'legacy',
  DEPRECATED: 'deprecated'
};

export const ScriptCategory = {
  QUALITY: 'quality',
  DEPLOY: 'deploy',
  PERF: 'perf',
  BUNDLE: 'bundle',
  ANALYTICS: 'analytics'
};

// Interface ScriptEntry conforme contrato
export class ScriptEntry {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.path = data.path;

    // Metadados obrigatórios
    this.purpose = data.purpose;
    this.category = data.category;
    this.owner = data.owner;
    this.created = data.created || new Date().toISOString();
    this.lastUsed = data.lastUsed || null;

    // Estado de governança
    this.status = data.status || ScriptStatus.UNAPPROVED;
    this.strikes = data.strikes || 0;
    this.approvedAt = data.approvedAt || null;
    this.approvedBy = data.approvedBy || null;

    // Quarentena e Segurança (ajuste institucional)
    this.quarantinedAt = data.quarantinedAt || null;
    this.quarantinedBy = data.quarantinedBy || null;
    this.quarantineReason = data.quarantineReason || null;

    // Cadeia de Custódia (ajuste institucional)
    this.lastModifiedBy = data.lastModifiedBy || null;
    this.policyVersion = data.policyVersion || '1.0.0';

    // Metadados opcionais
    this.metadata = data.metadata || {};
  }

  // Métodos de negócio
  isActive() {
    return this.status === ScriptStatus.ACTIVE;
  }

  isQuarantined() {
    return this.status === ScriptStatus.QUARANTINED;
  }

  canExecute() {
    return this.isActive() && !this.isQuarantined();
  }

  addStrike(reason, approvedBy) {
    this.strikes++;
    this.lastModifiedBy = approvedBy;

    // Lógica de transição automática
    if (this.strikes >= 3) {
      this.status = ScriptStatus.DEPRECATED;
    } else if (this.strikes >= 2) {
      this.status = ScriptStatus.LEGACY;
    }
  }

  quarantine(reason, approvedBy) {
    this.status = ScriptStatus.QUARANTINED;
    this.quarantinedAt = new Date().toISOString();
    this.quarantinedBy = approvedBy;
    this.quarantineReason = reason;
    this.lastModifiedBy = approvedBy;
  }

  releaseFromQuarantine(approvedBy) {
    if (this.status === ScriptStatus.QUARANTINED) {
      this.status = this.strikes >= 2 ? ScriptStatus.LEGACY : ScriptStatus.ACTIVE;
      this.quarantinedAt = null;
      this.quarantinedBy = null;
      this.quarantineReason = null;
      this.lastModifiedBy = approvedBy;
    }
  }

  approve(approvedBy) {
    this.status = ScriptStatus.ACTIVE;
    this.approvedAt = new Date().toISOString();
    this.approvedBy = approvedBy;
    this.lastModifiedBy = approvedBy;
  }

  markLegacy(reason, approvedBy) {
    this.status = ScriptStatus.LEGACY;
    this.lastModifiedBy = approvedBy;
    this.metadata.legacyReason = reason;
  }

  deprecate(reason, approvedBy) {
    this.status = ScriptStatus.DEPRECATED;
    this.lastModifiedBy = approvedBy;
    this.metadata.deprecationReason = reason;
  }
}

// Classe principal do Registry
export class ScriptRegistry {
  constructor() {
    this.scripts = new Map();
    this.dataFile = path.resolve(__dirname, '../data/script-registry.json');
    this.backupDir = path.resolve(__dirname, '../data/backups');
    this.events = [];
  }

  // Registro - Interface Obrigatória
  async register(scriptData) {
    const script = new ScriptEntry({
      ...scriptData,
      policyVersion: await this.getCurrentPolicyVersion()
    });

    if (this.scripts.has(script.id)) {
      throw new Error(`Script ${script.id} already exists`);
    }

    this.scripts.set(script.id, script);
    await this.save();

    this.emitEvent('script-registered', {
      scriptId: script.id,
      category: script.category,
      owner: script.owner
    });

    return script;
  }

  async unregister(scriptId) {
    if (!this.scripts.has(scriptId)) {
      throw new Error(`Script ${scriptId} not found`);
    }

    this.scripts.delete(scriptId);
    await this.save();

    this.emitEvent('script-unregistered', { scriptId });
  }

  async update(scriptId, updates) {
    const script = this.scripts.get(scriptId);
    if (!script) {
      throw new Error(`Script ${scriptId} not found`);
    }

    // Aplicar updates
    Object.assign(script, updates);
    script.lastModifiedBy = updates.lastModifiedBy || script.lastModifiedBy;

    await this.save();

    this.emitEvent('script-status-changed', {
      scriptId,
      oldStatus: script.status,
      newStatus: updates.status || script.status
    });

    return script;
  }

  // Consulta - Interface Obrigatória
  async get(scriptId) {
    return this.scripts.get(scriptId) || null;
  }

  async list(filters = {}) {
    let scripts = Array.from(this.scripts.values());

    if (filters.category) {
      scripts = scripts.filter(s => s.category === filters.category);
    }

    if (filters.owner) {
      scripts = scripts.filter(s => s.owner === filters.owner);
    }

    if (filters.status) {
      scripts = scripts.filter(s => s.status === filters.status);
    }

    return scripts;
  }

  async exists(scriptId) {
    return this.scripts.has(scriptId);
  }

  // Governança - Interface Obrigatória
  async getUnownedScripts() {
    return Array.from(this.scripts.values())
      .filter(script => !script.owner || script.owner.trim() === '');
  }

  async getUnapprovedScripts() {
    return Array.from(this.scripts.values())
      .filter(script => script.status === ScriptStatus.UNAPPROVED);
  }

  async getByOwner(owner) {
    return Array.from(this.scripts.values())
      .filter(script => script.owner === owner);
  }

  // Quarentena - Novos Métodos Institucionais
  async quarantineScript(scriptId, reason, approvedBy) {
    const script = this.scripts.get(scriptId);
    if (!script) {
      throw new Error(`Script ${scriptId} not found`);
    }

    script.quarantine(reason, approvedBy);
    await this.save();

    this.emitEvent('script-quarantined', {
      scriptId,
      reason,
      approvedBy
    });

    return script;
  }

  async releaseFromQuarantine(scriptId, approvedBy) {
    const script = this.scripts.get(scriptId);
    if (!script) {
      throw new Error(`Script ${scriptId} not found`);
    }

    script.releaseFromQuarantine(approvedBy);
    await this.save();

    this.emitEvent('script-released', {
      scriptId,
      approvedBy
    });

    return script;
  }

  // Persistência - Interface Obrigatória
  async load() {
    try {
      if (fs.existsSync(this.dataFile)) {
        const data = JSON.parse(fs.readFileSync(this.dataFile, 'utf8'));
        this.scripts = new Map(
          Object.entries(data).map(([id, entry]) => [id, new ScriptEntry(entry)])
        );
      }
    } catch (error) {
      console.warn('Failed to load script registry:', error.message);
      this.scripts = new Map();
    }
  }

  async save() {
    // Criar backup automático
    await this.createBackup();

    const data = Object.fromEntries(
      Array.from(this.scripts.entries()).map(([id, script]) => [id, script])
    );

    // Garantir diretório existe
    const dir = path.dirname(this.dataFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(this.dataFile, JSON.stringify(data, null, 2));
  }

  async backup() {
    return await this.createBackup();
  }

  async createBackup() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupDir, `registry-${timestamp}.json`);

    if (this.scripts.size > 0) {
      const data = Object.fromEntries(this.scripts);
      fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
    }

    return backupFile;
  }

  // Utilitários
  async getCurrentPolicyVersion() {
    // Em produção, isso viria de um config central
    return '1.0.0';
  }

  emitEvent(eventType, data) {
    const event = {
      type: eventType,
      timestamp: new Date().toISOString(),
      data
    };

    this.events.push(event);

    // Em produção, isso seria enviado para um event bus
    console.log(`📢 Registry Event: ${eventType}`, data);
  }

  // Health Check
  async healthCheck() {
    return {
      status: 'healthy',
      scriptsCount: this.scripts.size,
      lastBackup: await this.getLastBackupTime(),
      unownedCount: (await this.getUnownedScripts()).length,
      quarantinedCount: Array.from(this.scripts.values())
        .filter(s => s.isQuarantined()).length
    };
  }

  async getLastBackupTime() {
    try {
      const files = fs.readdirSync(this.backupDir);
      if (files.length === 0) return null;

      const latest = files
        .filter(f => f.startsWith('registry-'))
        .sort()
        .pop();

      return latest ? path.join(this.backupDir, latest) : null;
    } catch {
      return null;
    }
  }

  // Relatórios para Quarterly Report
  async generateMetrics() {
    const scripts = Array.from(this.scripts.values());

    return {
      totalScripts: scripts.length,
      activeScripts: scripts.filter(s => s.isActive()).length,
      legacyScripts: scripts.filter(s => s.status === ScriptStatus.LEGACY).length,
      deprecatedScripts: scripts.filter(s => s.status === ScriptStatus.DEPRECATED).length,
      quarantinedScripts: scripts.filter(s => s.isQuarantined()).length,
      unapprovedScripts: scripts.filter(s => s.status === ScriptStatus.UNAPPROVED).length,
      unownedScripts: (await this.getUnownedScripts()).length,

      averageAge: this.calculateAverageAge(scripts),
      topCategories: this.calculateCategoryDistribution(scripts),
      ownershipCoverage: this.calculateOwnershipCoverage(scripts)
    };
  }

  calculateAverageAge(scripts) {
    if (scripts.length === 0) return 0;

    const now = new Date();
    const totalAge = scripts.reduce((sum, script) => {
      const created = new Date(script.created);
      return sum + (now - created);
    }, 0);

    return Math.round(totalAge / scripts.length / (1000 * 60 * 60 * 24)); // dias
  }

  calculateCategoryDistribution(scripts) {
    const categories = {};
    scripts.forEach(script => {
      categories[script.category] = (categories[script.category] || 0) + 1;
    });

    return Object.entries(categories)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  }

  calculateOwnershipCoverage(scripts) {
    const owned = scripts.filter(s => s.owner && s.owner.trim() !== '').length;
    return scripts.length > 0 ? Math.round((owned / scripts.length) * 100) : 0;
  }
}

// Singleton para uso global
let registryInstance = null;

export function getRegistry() {
  if (!registryInstance) {
    registryInstance = new ScriptRegistry();
  }
  return registryInstance;
}

// Função de inicialização
export async function initializeRegistry() {
  const registry = getRegistry();
  await registry.load();
  return registry;
}

// Export para uso direto
export default ScriptRegistry;
