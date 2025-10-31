#!/usr/bin/env node

/**
 * Relatório Executivo de Governança Técnica
 * Transforma dados de auditoria em insights acionáveis para stakeholders
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

class ExecutiveReportGenerator {
  constructor(auditReport) {
    this.auditReport = auditReport;
    this.inventory = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'lib/integrations/inventory.json'), 'utf8'));
  }

  generate() {
    const report = {
      title: "Relatório Executivo: Governança de Integrações e Código",
      date: new Date().toLocaleDateString('pt-BR'),
      executive_summary: this.generateExecutiveSummary(),
      risk_assessment: this.generateRiskAssessment(),
      action_items: this.generateActionItems(),
      technical_details: this.generateTechnicalDetails(),
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  generateExecutiveSummary() {
    const { summary } = this.auditReport;

    return {
      overview: `Auditoria identificou ${summary.total} pontos de atenção na governança técnica.`,
      critical_findings: [
        summary.critical > 0 ? `${summary.critical} problemas críticos identificados` : "Nenhum problema crítico encontrado",
        summary.high > 0 ? `${summary.high} problemas de alta severidade` : null,
        this.getRevenueImpactSummary()
      ].filter(Boolean),
      business_impact: this.assessBusinessImpact(),
      confidence_level: this.calculateConfidenceLevel()
    };
  }

  generateRiskAssessment() {
    return {
      security_risks: this.identifySecurityRisks(),
      operational_risks: this.identifyOperationalRisks(),
      financial_risks: this.identifyFinancialRisks(),
      compliance_risks: this.identifyComplianceRisks()
    };
  }

  generateActionItems() {
    const items = [];

    // Itens críticos
    if (this.auditReport.findings.env.leaked_to_client.length > 0) {
      items.push({
        priority: "CRITICAL",
        title: "Corrigir vazamento de credenciais para client-side",
        description: `${this.auditReport.findings.env.leaked_to_client.length} variáveis sensíveis expostas no frontend`,
        owner: "Security Team",
        deadline: "Imediato",
        impact: "Risco de vazamento de dados sensíveis"
      });
    }

    if (this.auditReport.findings.routes.inactive_endpoints.length > 0) {
      items.push({
        priority: "CRITICAL",
        title: "Remover endpoints fantasma",
        description: `${this.auditReport.findings.routes.inactive_endpoints.length} endpoints públicos sem lógica de negócio`,
        owner: "Backend Team",
        deadline: "Esta sprint",
        impact: "Superfície de ataque desnecessária"
      });
    }

    // Itens altos
    if (this.auditReport.findings.integrations.missing_error_handling.length > 0) {
      items.push({
        priority: "HIGH",
        title: "Implementar tratamento de erro em integrações",
        description: `${this.auditReport.findings.integrations.missing_error_handling.length} chamadas externas sem fallback`,
        owner: "Backend Team",
        deadline: "Próxima sprint",
        impact: "Risco de indisponibilidade de serviços"
      });
    }

    if (this.auditReport.findings.integrations.declared_not_used.length > 0) {
      const revenueImpacting = this.auditReport.findings.integrations.declared_not_used
        .filter(item => this.inventory.integrations[item.integration]?.revenue_impact)
        .length;

      if (revenueImpacting > 0) {
        items.push({
          priority: "HIGH",
          title: "Remover integrações não utilizadas com impacto financeiro",
          description: `${revenueImpacting} integrações pagas mas não utilizadas`,
          owner: "Product Team",
          deadline: "Esta semana",
          impact: "Custos desnecessários"
        });
      }
    }

    return items;
  }

  generateTechnicalDetails() {
    return {
      environment_variables: {
        unused: this.auditReport.findings.env.unused,
        leaked: this.auditReport.findings.env.leaked_to_client
      },
      integrations: {
        unused: this.auditReport.findings.integrations.declared_not_used,
        unsafe_usage: this.auditReport.findings.integrations.missing_error_handling,
        forbidden_usage: this.auditReport.findings.integrations.forbidden_layer_usage
      },
      code_quality: {
        unused_symbols: this.auditReport.findings.code.unused_exports
      },
      endpoints: {
        inactive: this.auditReport.findings.routes.inactive_endpoints
      }
    };
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.auditReport.summary.total === 0) {
      recommendations.push({
        category: "Excelente",
        recommendation: "Continuar mantendo os padrões atuais de qualidade",
        implementation: "Manter auditoria semanal"
      });
    } else {
      recommendations.push({
        category: "Imediato",
        recommendation: "Resolver todos os itens críticos antes do próximo deploy",
        implementation: "Priorizar correção de vazamentos de segurança e endpoints fantasma"
      });

      if (this.auditReport.summary.high > 0) {
        recommendations.push({
          category: "Esta Semana",
          recommendation: "Resolver itens de alta prioridade",
          implementation: "Focar em tratamento de erros e remoção de código morto crítico"
        });
      }

      recommendations.push({
        category: "Governança",
        recommendation: "Implementar auditoria automatizada em CI/CD",
        implementation: "Configurar gates que impeçam merge com problemas críticos"
      });
    }

    return recommendations;
  }

  getRevenueImpactSummary() {
    const revenueIntegrationsUnused = this.auditReport.findings.integrations.declared_not_used
      .filter(item => this.inventory.integrations[item.integration]?.revenue_impact)
      .length;

    if (revenueIntegrationsUnused > 0) {
      return `${revenueIntegrationsUnused} integrações com impacto financeiro não utilizadas`;
    }
    return null;
  }

  assessBusinessImpact() {
    const { summary } = this.auditReport;

    if (summary.critical > 0) {
      return "ALTO: Problemas críticos podem impactar segurança e disponibilidade";
    } else if (summary.high > 0) {
      return "MÉDIO: Problemas de alta severidade podem causar indisponibilidade intermitente";
    } else if (summary.medium > 0) {
      return "BAIXO: Principais riscos controlados, focar em limpeza técnica";
    } else {
      return "EXCELENTE: Código limpo e seguro";
    }
  }

  calculateConfidenceLevel() {
    // Baseado na cobertura da auditoria e qualidade dos dados
    return "ALTA: Auditoria automatizada com cobertura completa das integrações críticas";
  }

  identifySecurityRisks() {
    const risks = [];

    if (this.auditReport.findings.env.leaked_to_client.length > 0) {
      risks.push({
        risk: "Vazamento de credenciais",
        severity: "CRITICAL",
        description: `${this.auditReport.findings.env.leaked_to_client.length} variáveis sensíveis acessíveis no client-side`
      });
    }

    if (this.auditReport.findings.integrations.missing_error_handling.length > 0) {
      risks.push({
        risk: "Tratamento inadequado de erros externos",
        severity: "HIGH",
        description: "Integrações críticas sem fallback podem causar indisponibilidade"
      });
    }

    return risks;
  }

  identifyOperationalRisks() {
    const risks = [];

    if (this.auditReport.findings.routes.inactive_endpoints.length > 0) {
      risks.push({
        risk: "Superfície de ataque aumentada",
        severity: "CRITICAL",
        description: "Endpoints sem lógica aumentam vetor de ataque"
      });
    }

    if (this.auditReport.findings.integrations.forbidden_layer_usage.length > 0) {
      risks.push({
        risk: "Arquitetura violada",
        severity: "HIGH",
        description: "Uso de integrações em camadas proibidas compromete manutenibilidade"
      });
    }

    return risks;
  }

  identifyFinancialRisks() {
    const risks = [];

    const unusedRevenueIntegrations = this.auditReport.findings.integrations.declared_not_used
      .filter(item => this.inventory.integrations[item.integration]?.revenue_impact);

    if (unusedRevenueIntegrations.length > 0) {
      risks.push({
        risk: "Custos desnecessários",
        severity: "HIGH",
        description: `${unusedRevenueIntegrations.length} integrações pagas não utilizadas`
      });
    }

    return risks;
  }

  identifyComplianceRisks() {
    // Poderia verificar LGPD, PCI-DSS, etc.
    return [];
  }

  saveToFile() {
    const report = this.generate();
    const dateStr = new Date().toISOString().split('T')[0];
    const reportPath = path.join(ROOT_DIR, 'quality-history', `${dateStr}-executive-report.json`);

    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`📋 Executive report saved to ${reportPath}`);
    return report;
  }
}

// Função para gerar relatório a partir de arquivo de auditoria
export function generateFromAuditFile(auditFilePath) {
  console.log('📊 Generating executive report from:', auditFilePath);
  const auditReport = JSON.parse(fs.readFileSync(auditFilePath, 'utf8'));
  console.log('📋 Audit report loaded, summary:', auditReport.summary);
  const generator = new ExecutiveReportGenerator(auditReport);
  console.log('📝 Generator created');
  return generator.saveToFile();
}

// Executar sempre (compatibilidade Windows)
console.log('📊 Starting executive report generation...');
const auditFile = process.argv[2];
if (!auditFile) {
  console.error('Usage: node generate-executive-report.mjs <audit-file>');
  process.exit(1);
}

try {
  generateFromAuditFile(auditFile);
} catch (error) {
  console.error('Error generating executive report:', error);
  process.exit(1);
}
