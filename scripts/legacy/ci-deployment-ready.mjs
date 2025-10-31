#!/usr/bin/env node

/**
 * STATUS: LEGACY
 * NÃO USAR EM PRODUÇÃO
 * SUBSTITUÍDO POR ../official/deploy.mjs
 * OWNER: Quality Team
 * DATA DE QUARENTENA: 2025-10-31
 *
 * Original:
 * CI Deployment Ready Checker
 * Validates essential quality gates for deployment
 * More conservative than full quality gates
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🚀 CI Deployment Ready Checker - Starting...\n');

const essentialGates = [
  {
    name: 'TypeScript Compilation',
    command: 'npx tsc --noEmit',
    required: true,
    timeout: 60000
  },
  {
    name: 'Production Build',
    command: 'pnpm run build',
    required: true,
    timeout: 300000
  }
];

async function checkDeploymentReadiness() {
  console.log('🎯 Checking deployment readiness...\n');

  let allEssentialPassed = true;
  const results = [];

  for (const gate of essentialGates) {
    console.log(`🔍 ${gate.name}...`);

    try {
      const result = execSync(gate.command, {
        encoding: 'utf8',
        timeout: gate.timeout,
        maxBuffer: 1024 * 1024 * 10,
        stdio: ['pipe', 'pipe', 'ignore'] // Suppress stderr
      });

      // Check for errors in output - be more specific
      const hasBuildError = result.includes('Failed to compile') ||
                           result.includes('Build failed') ||
                           result.includes('Command failed') ||
                           (result.includes('error') && !result.includes('experiments') && !result.includes('webpackBuildWorker'));

      if (!hasBuildError) {
        console.log(`  ✅ PASSED`);
        results.push({ name: gate.name, passed: true, required: gate.required });
      } else {
        console.log(`  ❌ FAILED`);
        results.push({ name: gate.name, passed: false, required: gate.required });
        if (gate.required) {
          allEssentialPassed = false;
        }
      }

    } catch (error) {
      console.log(`  ❌ FAILED - ${error.message.split('\n')[0]}`);
      results.push({ name: gate.name, passed: false, required: gate.required });
      if (gate.required) {
        allEssentialPassed = false;
      }
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🚀 DEPLOYMENT READINESS SUMMARY');
  console.log('='.repeat(60));

  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    const required = result.required ? '(Required)' : '(Optional)';
    console.log(`${status} ${result.name} ${required}`);
  });

  if (allEssentialPassed) {
    console.log('\n🎉 DEPLOYMENT READY!');
    console.log('   All essential quality gates passed.');
    console.log('   The application can be safely deployed.');
  } else {
    console.log('\n❌ DEPLOYMENT BLOCKED!');
    console.log('   Essential quality gates failed.');
    console.log('   Please fix the issues above before deploying.');
  }

  // Save results
  const reportData = {
    timestamp: new Date().toISOString(),
    deploymentReady: allEssentialPassed,
    essentialGates: results,
    version: process.env.npm_package_version || 'unknown'
  };

  if (!fs.existsSync('tmp')) {
    fs.mkdirSync('tmp');
  }

  fs.writeFileSync('tmp/ci-deployment-ready.json', JSON.stringify(reportData, null, 2));

  console.log('\n💾 Results saved to: tmp/ci-deployment-ready.json');

  // Create deployment badge
  const badgeColor = allEssentialPassed ? 'brightgreen' : 'red';
  const badgeText = allEssentialPassed ? 'Ready' : 'Blocked';

  console.log(`\n🏷️  Deployment Badge: https://img.shields.io/badge/Deploy-${badgeText}-${badgeColor}`);

  // Exit with appropriate code
  process.exit(allEssentialPassed ? 0 : 1);
}

// Run deployment readiness check
checkDeploymentReadiness().catch(error => {
  console.error('❌ Deployment readiness check failed:', error.message);
  process.exit(1);
});
