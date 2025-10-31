#!/usr/bin/env node

/**
 * Bulk Quality Fixes Automation
 * Automatically applies common code quality fixes
 * Safe for CI/CD pipelines
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔧 Bulk Quality Fixes - Starting...\n');

const fixCategories = [
  {
    name: 'ESLint Auto-fix',
    command: 'npx eslint . --fix --quiet',
    description: 'Auto-fix ESLint violations'
  },
  {
    name: 'Prettier Formatting',
    command: 'npx prettier --write "**/*.{ts,tsx,js,jsx,json,md}" --loglevel silent',
    description: 'Apply code formatting'
  },
  {
    name: 'Unused Variables (Safe)',
    command: 'node scripts/fix-unused-vars.mjs',
    description: 'Prefix unused variables with underscore',
    skipOnCI: true // Only run locally due to potential side effects
  }
];

async function runBulkFixes() {
  console.log('🎯 Applying bulk quality fixes...\n');

  const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
  let totalFixed = 0;
  let errors = [];

  for (const fix of fixCategories) {
    if (fix.skipOnCI && isCI) {
      console.log(`⏭️  Skipping ${fix.name} (not safe for CI)`);
      continue;
    }

    console.log(`🔧 ${fix.name} - ${fix.description}`);

    try {
      const result = execSync(fix.command, {
        encoding: 'utf8',
        timeout: 300000, // 5 minutes
        maxBuffer: 1024 * 1024 * 10 // 10MB
      });

      // Count changes (rough estimate)
      const linesChanged = result.split('\n').filter(line =>
        line.includes('fixed') ||
        line.includes('changed') ||
        line.includes('modified') ||
        line.includes('_')
      ).length;

      console.log(`  ✅ Applied - ${linesChanged} changes detected`);
      totalFixed += linesChanged;

    } catch (error) {
      console.log(`  ❌ Failed - ${error.message}`);
      errors.push(`${fix.name}: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 BULK FIXES SUMMARY');
  console.log('='.repeat(50));

  if (errors.length === 0) {
    console.log(`✅ All fixes applied successfully (${totalFixed} changes)`);
  } else {
    console.log(`⚠️  Some fixes failed (${errors.length} errors)`);
    errors.forEach(error => console.log(`  • ${error}`));
  }

  // Check git status for changes
  try {
    const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
    const changedFiles = gitStatus.split('\n').filter(line => line.trim()).length;

    if (changedFiles > 0) {
      console.log(`\n📝 ${changedFiles} files changed by bulk fixes`);
      console.log('\n💡 Next steps:');
      console.log('  • Review changes: git diff');
      console.log('  • Stage changes: git add .');
      console.log('  • Commit: git commit -m "🤖 Bulk quality fixes"');
      console.log('  • Push: git push');

      // Save changed files list for CI
      if (!fs.existsSync('tmp')) {
        fs.mkdirSync('tmp');
      }

      fs.writeFileSync('tmp/bulk-fix-changes.txt', gitStatus);
      console.log('\n💾 Changed files saved to: tmp/bulk-fix-changes.txt');

    } else {
      console.log('\n✨ No files changed - all fixes already applied');
    }

  } catch (error) {
    console.log('\n⚠️  Could not check git status');
  }

  // Run final quality check
  console.log('\n🔍 Running final quality check...');

  try {
    const qualityResult = execSync('node scripts/ci-quality-gate-check.mjs', {
      encoding: 'utf8',
      timeout: 60000
    });

    console.log('✅ Quality gates checked successfully');

  } catch (error) {
    console.log('⚠️  Quality check failed - manual review recommended');
  }

  console.log('\n🎉 Bulk fixes completed!');
}

// Safety check - ensure we're in a git repository
try {
  execSync('git rev-parse --git-dir', { stdio: 'ignore' });
} catch {
  console.error('❌ Not in a git repository - bulk fixes require git for safety');
  process.exit(1);
}

// Confirm execution in interactive mode
if (process.argv.includes('--yes') || process.argv.includes('-y')) {
  runBulkFixes();
} else {
  console.log('⚠️  Bulk fixes will modify files automatically.');
  console.log('   Make sure to commit/stash any important changes first.');
  console.log('');
  console.log('   Run with --yes to proceed, or --help for options');
  console.log('');
  console.log('   Options:');
  console.log('     --yes, -y    : Run fixes without confirmation');
  console.log('     --help, -h   : Show this help');
  console.log('     --dry-run    : Show what would be fixed without applying');

  if (process.argv.includes('--help') || process.argv.includes('-h')) {
    process.exit(0);
  }

  if (process.argv.includes('--dry-run')) {
    console.log('\n🔍 Dry run mode - would apply these fixes:');
    fixCategories.forEach(fix => {
      console.log(`  • ${fix.name}: ${fix.description}`);
    });
    process.exit(0);
  }

  process.exit(0); // Exit without running unless --yes is provided
}