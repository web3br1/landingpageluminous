#!/usr/bin/env node

/**
 * COMPLIANCE ENGINE - GITHUB ISSUES INTEGRATION
 * Sistema de alertas via GitHub Issues (desenvolvimento local)
 * Simula PRs/issues para alertas de compliance
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simula GitHub Issues localmente
export class GitHubIssuesChannel {
  constructor(config) {
    this.repo = config.repo || 'luminaris/compliance-alerts';
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
    const severity = alert.severity.toUpperCase();
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

  async getIssue(issueNumber) {
    if (!fs.existsSync(this.issuesFile)) return null;

    try {
      const issues = JSON.parse(fs.readFileSync(this.issuesFile, 'utf8'));
      return issues.find(i => i.number === issueNumber) || null;
    } catch {
      return null;
    }
  }

  async listIssues(filters = {}) {
    if (!fs.existsSync(this.issuesFile)) return [];

    try {
      let issues = JSON.parse(fs.readFileSync(this.issuesFile, 'utf8'));

      if (filters.state) {
        issues = issues.filter(i => i.state === filters.state);
      }

      if (filters.labels) {
        issues = issues.filter(i =>
          filters.labels.some(label => i.labels.includes(label))
        );
      }

      if (filters.assignee) {
        issues = issues.filter(i => i.assignee === filters.assignee);
      }

      return issues;
    } catch {
      return [];
    }
  }

  async closeIssue(issueNumber, comment = '') {
    const issues = await this.listIssues();
    const issue = issues.find(i => i.number === issueNumber);

    if (issue) {
      issue.state = 'closed';
      issue.updatedAt = new Date().toISOString();
      issue.closedAt = new Date().toISOString();
      issue.closeComment = comment;

      fs.writeFileSync(this.issuesFile, JSON.stringify(issues, null, 2));
      return true;
    }

    return false;
  }
}

// Função para listar issues ativas (útil para dashboard)
export async function listComplianceIssues() {
  const channel = new GitHubIssuesChannel({ repo: 'local/compliance' });
  const issues = await channel.listIssues({ state: 'open' });

  console.log('\n📋 Active Compliance Issues:\n');

  if (issues.length === 0) {
    console.log('✅ No active compliance issues!');
    return;
  }

  issues.forEach(issue => {
    const age = Math.floor((new Date() - new Date(issue.createdAt)) / (1000 * 60 * 60));
    const priority = issue.labels.includes('critical') ? '🔴' :
                    issue.labels.includes('high') ? '🟠' :
                    issue.labels.includes('medium') ? '🟡' : '🟢';

    console.log(`${priority} #${issue.number}: ${issue.title}`);
    console.log(`   📅 ${age} hours old • 👤 ${issue.assignee} • 🏷️ ${issue.labels.join(', ')}`);
    console.log(`   🔗 ${issue.alertId}\n`);
  });

  return issues;
}

// CLI para gerenciar issues
export async function cliMain() {
  const args = process.argv.slice(2);
  const command = args[0];

  const channel = new GitHubIssuesChannel({ repo: 'local/compliance' });

  switch (command) {
    case 'list':
      await listComplianceIssues();
      break;

    case 'close':
      const issueNumber = parseInt(args[1]);
      const comment = args.slice(2).join(' ') || 'Resolved via compliance action';
      const closed = await channel.closeIssue(issueNumber, comment);

      if (closed) {
        console.log(`✅ Issue #${issueNumber} closed`);
      } else {
        console.log(`❌ Issue #${issueNumber} not found`);
      }
      break;

    case 'show':
      const showNumber = parseInt(args[1]);
      const issue = await channel.getIssue(showNumber);

      if (issue) {
        console.log(`\n📋 Issue #${issue.number}: ${issue.title}`);
        console.log(`📅 Created: ${issue.createdAt}`);
        console.log(`👤 Assignee: ${issue.assignee}`);
        console.log(`🏷️ Labels: ${issue.labels.join(', ')}`);
        console.log(`📊 State: ${issue.state}`);
        console.log(`\n📝 Body:\n${issue.body}`);
      } else {
        console.log(`❌ Issue #${showNumber} not found`);
      }
      break;

    default:
      console.log(`
🐙 GitHub Issues CLI for Compliance Engine

Usage:
  node github-issues.mjs list                    # List active issues
  node github-issues.mjs show <number>           # Show issue details
  node github-issues.mjs close <number> [comment] # Close issue with comment

Examples:
  node github-issues.mjs list
  node github-issues.mjs show 1
  node github-issues.mjs close 1 "Fixed ownership issue"
      `);
  }
}

// Executar CLI se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  cliMain().catch(console.error);
}

export default GitHubIssuesChannel;
