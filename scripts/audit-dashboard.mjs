#!/usr/bin/env node

/**
 * Dashboard de Auditoria de Governança
 * Visualiza tendência histórica dos problemas encontrados
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

class AuditDashboard {
  constructor() {
    this.historyDir = path.join(ROOT_DIR, 'quality-history');
  }

  loadHistory() {
    if (!fs.existsSync(this.historyDir)) {
      console.log('📊 No audit history found');
      return [];
    }

    const files = fs.readdirSync(this.historyDir)
      .filter(f => f.includes('integrations-audit.json'))
      .sort();

    return files.map(file => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(this.historyDir, file), 'utf8'));
        return {
          date: file.split('-integrations-audit.json')[0],
          ...data
        };
      } catch (error) {
        console.warn(`⚠️ Could not parse ${file}:`, error.message);
        return null;
      }
    }).filter(Boolean);
  }

  generateDashboard() {
    const history = this.loadHistory();

    if (history.length === 0) {
      console.log('📊 No audit data available');
      return;
    }

    console.log('🔍 GOVERNANCE AUDIT DASHBOARD\n');
    console.log('=' .repeat(60));

    // Mostrar últimas 10 auditorias
    const recent = history.slice(-10);

    console.log('📈 TREND ANALYSIS (Last 10 audits)\n');

    // Headers
    console.log('Date       | Critical | High | Medium | Low | Total | Status');
    console.log('-----------|----------|------|--------|-----|-------|--------');

    recent.forEach(audit => {
      const { summary } = audit;
      const status = summary.critical > 0 ? '🔴 FAIL' :
                    summary.high > 0 ? '🟡 WARN' : '🟢 PASS';

      console.log(`${audit.date.padEnd(10)} | ${summary.critical.toString().padStart(8)} | ${summary.high.toString().padStart(4)} | ${summary.medium.toString().padStart(6)} | ${summary.low.toString().padStart(3)} | ${summary.total.toString().padStart(5)} | ${status}`);
    });

    console.log('\n' + '=' .repeat(60));

    // Análise de tendências
    this.analyzeTrends(history);

    // Top issues atuais
    this.showCurrentIssues(history[history.length - 1]);
  }

  analyzeTrends(history) {
    if (history.length < 2) {
      console.log('📊 Need at least 2 audits for trend analysis');
      return;
    }

    const latest = history[history.length - 1].summary;
    const previous = history[history.length - 2].summary;

    console.log('📊 TREND ANALYSIS\n');

    const changes = {
      critical: latest.critical - previous.critical,
      high: latest.high - previous.high,
      medium: latest.medium - previous.medium,
      low: latest.low - previous.low,
      total: latest.total - previous.total
    };

    Object.entries(changes).forEach(([severity, change]) => {
      const direction = change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
      const color = change > 0 ? '🔴' : change < 0 ? '🟢' : '🟡';
      console.log(`${severity.padEnd(8)}: ${direction} ${change > 0 ? '+' : ''}${change}`);
    });

    // Insights
    console.log('\n💡 INSIGHTS:');
    if (changes.critical > 0) {
      console.log('⚠️  Critical issues are increasing - immediate action required');
    }
    if (changes.total < 0) {
      console.log('✅ Overall quality is improving');
    }
    if (latest.critical === 0 && latest.high === 0) {
      console.log('🎉 No critical or high severity issues - excellent governance!');
    }
  }

  showCurrentIssues(latestAudit) {
    if (!latestAudit) return;

    console.log('\n🔍 CURRENT ISSUES BREAKDOWN\n');

    const issues = latestAudit.findings;

    // Environment issues
    if (issues.env.leaked_to_client.length > 0) {
      console.log('🚨 CRITICAL: Client-side credential leaks');
      issues.env.leaked_to_client.forEach(item => {
        console.log(`   - ${item.variable}`);
      });
    }

    if (issues.env.unused.length > 0) {
      console.log(`⚠️  Unused environment variables: ${issues.env.unused.length}`);
    }

    // Integration issues
    if (issues.integrations.declared_not_used.length > 0) {
      console.log(`💰 Unused integrations: ${issues.integrations.declared_not_used.length}`);
      issues.integrations.declared_not_used.forEach(item => {
        console.log(`   - ${item.name} (${item.severity})`);
      });
    }

    if (issues.integrations.missing_error_handling.length > 0) {
      console.log(`🔧 Missing error handling: ${issues.integrations.missing_error_handling.length}`);
    }

    // Route issues
    if (issues.routes.inactive_endpoints.length > 0) {
      console.log('🌐 Inactive endpoints:');
      issues.routes.inactive_endpoints.forEach(item => {
        console.log(`   - ${item.route}`);
      });
    }

    // Summary
    console.log('\n📊 SUMMARY');
    console.log(`Total issues: ${latestAudit.summary.total}`);
    console.log(`Critical: ${latestAudit.summary.critical}`);
    console.log(`High: ${latestAudit.summary.high}`);
    console.log(`Medium: ${latestAudit.summary.medium}`);
    console.log(`Low: ${latestAudit.summary.low}`);
  }

  generateMarkdownReport() {
    const history = this.loadHistory();
    if (history.length === 0) {
      console.log('📊 No audit history found');
      return;
    }

    const latest = history[history.length - 1];
    if (!latest) {
      console.log('📊 No latest audit found');
      return;
    }

    console.log('📊 Latest audit:', latest.date, 'Summary:', latest.summary);

    const report = `# Governance Audit Dashboard

Generated: ${new Date().toISOString().split('T')[0]}

## Executive Summary

**Latest Audit:** ${latest.date}
**Status:** ${latest.summary?.critical_issues > 0 ? '🔴 FAIL' : latest.summary?.high_issues > 0 ? '🟡 WARN' : '🟢 PASS'}
**Total Issues:** ${latest.summary?.total_findings || 0}

## Current Issues

### Critical (${latest.summary?.critical_issues || 0})
${(latest.findings?.env?.leaked_to_client || []).map(item => `- **${item.variable}** - Client-side credential leak`).join('\n')}
${(latest.findings?.routes?.inactive_endpoints || []).map(item => `- **${item.route}** - Inactive endpoint`).join('\n')}

### High Priority (${latest.summary?.high_issues || 0})
${(latest.findings.integrations?.missing_error_handling || []).slice(0, 10).map(item => `- ${item.file}:${item.line} - Missing error handling`).join('\n')}
${(latest.findings.integrations?.declared_not_used || []).filter(item => item.severity === 'HIGH').map(item => `- **${item.name}** - Unused revenue-impacting integration`).join('\n')}

## Trend Analysis

${history.length >= 2 ? this.generateTrendMarkdown(history) : 'Need more audits for trend analysis'}

## Recommendations

${this.generateRecommendations(latest)}
`;

    const reportPath = path.join(this.historyDir, 'audit-dashboard.md');
    fs.writeFileSync(reportPath, report);
    console.log(`📋 Markdown report saved to ${reportPath}`);
  }

  generateTrendMarkdown(history) {
    const latest = history[history.length - 1];
    const previous = history[history.length - 2];

    const changes = {
      critical: latest.summary.critical - previous.summary.critical,
      high: latest.summary.high - previous.summary.high,
      total: latest.summary.total - previous.summary.total
    };

    return `| Metric | Current | Previous | Change |
|--------|---------|----------|--------|
| Critical | ${latest.summary.critical} | ${previous.summary.critical} | ${changes.critical > 0 ? '+' : ''}${changes.critical} |
| High | ${latest.summary.high} | ${previous.summary.high} | ${changes.high > 0 ? '+' : ''}${changes.high} |
| Total | ${latest.summary.total} | ${previous.summary.total} | ${changes.total > 0 ? '+' : ''}${changes.total} |`;
  }

  generateRecommendations(latest) {
    const recommendations = [];

    if ((latest.summary?.critical_issues || 0) > 0) {
      recommendations.push('- **IMMEDIATE:** Resolve all critical issues before next deployment');
    }

    if ((latest.summary?.high_issues || 0) > 0) {
      recommendations.push('- **HIGH:** Address high priority issues within current sprint');
    }

    if ((latest.findings.integrations?.declared_not_used || []).length > 0) {
      recommendations.push('- **COST:** Review unused integrations for cost optimization');
    }

    if ((latest.findings.env?.unused || []).length > 0) {
      recommendations.push('- **MAINTENANCE:** Clean up unused environment variables');
    }

    return recommendations.length > 0 ? recommendations.join('\n') : '- **EXCELLENT:** No major issues found';
  }
}

// Executar dashboard sempre (compatibilidade Windows)
console.log('📊 Starting audit dashboard...');
const dashboard = new AuditDashboard();

if (process.argv[2] === '--markdown') {
  dashboard.generateMarkdownReport();
} else {
  dashboard.generateDashboard();
}

export { AuditDashboard };
