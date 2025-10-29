#!/usr/bin/env node

/**
 * Quality Report Generator
 * Generates detailed HTML reports from quality gate results
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { QualityGateRunner } from '../lib/quality-gates/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  console.log('📊 Generating Quality Report...\n');

  try {
    // Get PR data
    const prData = getPRData();

    // Run quality gates
    const runner = new QualityGateRunner();
    const results = await runner.runAllGates(prData);
    const report = await runner.generateReport(prData, results);

    // Generate HTML report
    const htmlReport = generateHTMLReport(report);
    const reportPath = join(process.cwd(), 'reports', 'quality-gate-report.html');

    // Ensure reports directory exists
    mkdirSync(dirname(reportPath), { recursive: true });

    // Write report
    writeFileSync(reportPath, htmlReport, 'utf8');

    console.log(`✅ Quality report generated: ${reportPath}`);
    console.log(`📈 Overall Score: ${report.overall.score}/100`);
    console.log(`📊 Status: ${report.overall.passed ? 'PASSED' : 'FAILED'}`);

    // Print summary to console
    console.log('\n📋 SUMMARY:');
    report.gates.forEach(gate => {
      const status = gate.success ? '✅' : '❌';
      console.log(`${status} ${gate.name}: ${gate.score || 'N/A'}`);
    });

  } catch (error) {
    console.error('💥 Report generation failed:', error.message);
    process.exit(1);
  }
}

function getPRData() {
  return {
    id: process.env.PR_NUMBER || 'local',
    title: `Quality Check - ${new Date().toISOString().split('T')[0]}`,
    author: process.env.GITHUB_ACTOR || 'system',
    branch: process.env.GITHUB_HEAD_REF || 'main',
    baseBranch: process.env.GITHUB_BASE_REF || 'main',
    files: ['package.json'],
    changedLines: 0,
    commitSha: process.env.GITHUB_SHA || 'local',
    repository: process.env.GITHUB_REPOSITORY || 'landing-page',
  };
}

function generateHTMLReport(report) {
  const statusColor = report.overall.passed ? '#10b981' : '#ef4444';
  const statusText = report.overall.passed ? 'PASSED' : 'FAILED';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quality Gates Report - ${report.pr.title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8fafc;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 30px;
            text-align: center;
        }
        .status {
            font-size: 24px;
            font-weight: bold;
            color: ${statusColor};
            margin: 10px 0;
        }
        .score {
            font-size: 48px;
            font-weight: bold;
            color: ${statusColor};
            margin: 20px 0;
        }
        .gates {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        .gate {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .gate-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .gate-status {
            font-size: 18px;
            font-weight: bold;
        }
        .gate-score {
            font-size: 24px;
            font-weight: bold;
        }
        .recommendations {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin: 30px 0;
        }
        .recommendations ul {
            list-style: none;
            padding: 0;
        }
        .recommendations li {
            padding: 8px 0;
            border-bottom: 1px solid #eee;
        }
        .recommendations li:before {
            content: "💡";
            margin-right: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Quality Gates Report</h1>
            <div class="status">${statusText}</div>
            <div class="score">${report.overall.score}/100</div>
            <p><strong>PR:</strong> ${report.pr.title}</p>
            <p><strong>Branch:</strong> ${report.pr.branch}</p>
            <p><strong>Duration:</strong> ${report.overall.duration}ms</p>
            <p><strong>Generated:</strong> ${report.timestamp.toISOString()}</p>
        </div>

        <div class="gates">
            ${report.gates.map(gate => `
                <div class="gate">
                    <div class="gate-header">
                        <div class="gate-status" style="color: ${gate.success ? '#10b981' : '#ef4444'}">
                            ${gate.success ? '✅' : '❌'} ${gate.name}
                        </div>
                        <div class="gate-score" style="color: ${gate.success ? '#10b981' : '#ef4444'}">
                            ${gate.score || 'N/A'}
                        </div>
                    </div>
                    <div><strong>Duration:</strong> ${gate.duration}ms</div>
                    <div><strong>Required:</strong> ${gate.required ? 'Yes' : 'No'}</div>
                    ${gate.error ? `<div><strong>Error:</strong> ${gate.error}</div>` : ''}
                </div>
            `).join('')}
        </div>

        ${report.recommendations.length > 0 ? `
            <div class="recommendations">
                <h2>💡 Recommendations</h2>
                <ul>
                    ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        ` : ''}

        ${report.criticalIssues.length > 0 ? `
            <div class="recommendations" style="border-left: 4px solid #ef4444;">
                <h2>🚨 Critical Issues</h2>
                <ul>
                    ${report.criticalIssues.map(issue => `<li style="color: #ef4444;">${issue}</li>`).join('')}
                </ul>
            </div>
        ` : ''}
    </div>
</body>
</html>`;
}

main().catch(error => {
  console.error('Script execution failed:', error);
  process.exit(1);
});
