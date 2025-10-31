#!/usr/bin/env node

/**
 * Build Status Checker - Verifica status atual e identifica próximos passos
 */

import { execSync } from 'child_process';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🔍 Build Status Checker');
console.log('='.repeat(50));

async function checkBuildStatus() {
  try {
    console.log('📦 Testing build...');
    const buildResult = execSync('npm run build', {
      cwd: projectRoot,
      timeout: 60000, // 60 seconds
      stdio: 'pipe'
    });

    console.log('✅ Build successful!');
    return { success: true, errors: [] };

  } catch (error) {
    console.log('❌ Build failed. Analyzing errors...');

    const output = error.stdout?.toString() || error.stderr?.toString() || '';
    const errors = output.split('\n').filter(line =>
      line.includes('Type error:') ||
      line.includes('error TS') ||
      line.includes('Failed to compile')
    );

    console.log(`📊 Found ${errors.length} build errors`);

    // Categorizar erros
    const errorCategories = {
      typeScript: errors.filter(e => e.includes('error TS')).length,
      typeErrors: errors.filter(e => e.includes('Type error:')).length,
      other: errors.filter(e => !e.includes('error TS') && !e.includes('Type error:')).length
    };

    console.log('📈 Error breakdown:');
    console.log(`   TypeScript: ${errorCategories.typeScript}`);
    console.log(`   Type errors: ${errorCategories.typeErrors}`);
    console.log(`   Other: ${errorCategories.other}`);

    // Identificar arquivos mais problemáticos
    const fileErrors = {};
    errors.forEach(error => {
      const match = error.match(/(\.\/[^:]+):/);
      if (match) {
        const file = match[1];
        fileErrors[file] = (fileErrors[file] || 0) + 1;
      }
    });

    const topFiles = Object.entries(fileErrors)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    console.log('\n🎯 Top problematic files:');
    topFiles.forEach(([file, count]) => {
      console.log(`   ${file}: ${count} errors`);
    });

    return {
      success: false,
      errors,
      categories: errorCategories,
      topFiles
    };
  }
}

async function checkLintStatus() {
  try {
    console.log('\n🔍 Checking lint status...');
    const lintResult = execSync('npm run lint', {
      cwd: projectRoot,
      timeout: 30000,
      stdio: 'pipe'
    });

    console.log('✅ Lint successful!');
    return { success: true, errors: 0 };

  } catch (error) {
    const output = error.stdout?.toString() || error.stderr?.toString() || '';
    const lintErrors = output.split('\n').filter(line => line.includes('error')).length;

    console.log(`❌ Lint failed: ${lintErrors} errors`);
    return { success: false, errors: lintErrors };
  }
}

async function generateActionPlan(buildStatus, lintStatus) {
  console.log('\n🎯 Action Plan for Next Steps');

  if (!buildStatus.success) {
    console.log('\n🔴 PHASE 1: Fix Critical Build Errors');

    if (buildStatus.categories.typeScript > 0) {
      console.log(`   1. Fix ${buildStatus.categories.typeScript} TypeScript compilation errors`);
      console.log('      - Focus on type definitions and imports');
      console.log('      - Use "as any" for complex types temporarily');
    }

    if (buildStatus.categories.typeErrors > 0) {
      console.log(`   2. Fix ${buildStatus.categories.typeErrors} type assignment errors`);
      console.log('      - Check unknown type usages');
      console.log('      - Add proper type guards');
    }

    if (buildStatus.topFiles.length > 0) {
      console.log('   3. Priority files to fix:');
      buildStatus.topFiles.forEach(([file, count]) => {
        console.log(`      - ${file} (${count} errors)`);
      });
    }
  }

  if (!lintStatus.success) {
    console.log('\n🟡 PHASE 2: Fix Lint Errors');
    console.log(`   1. Address ${lintStatus.errors} lint violations`);
    console.log('      - Run automated fixes: npm run lint:fix');
    console.log('      - Focus on unused variables and complexity');
  }

  console.log('\n🟢 PHASE 3: Re-enable Strict Mode');
  console.log('   1. Gradually re-enable TypeScript strict options');
  console.log('   2. Fix null checks and undefined accesses');
  console.log('   3. Add proper error handling');

  console.log('\n🔵 PHASE 4: Quality Assurance');
  console.log('   1. Run full test suite');
  console.log('   2. Performance testing');
  console.log('   3. Bundle size optimization');
}

// Main execution
checkBuildStatus()
  .then(buildStatus => checkLintStatus().then(lintStatus => {
    generateActionPlan(buildStatus, lintStatus);
    console.log('\n✅ Status check completed');
  }))
  .catch(console.error);

