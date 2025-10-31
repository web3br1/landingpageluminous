#!/usr/bin/env node

/**
 * Fix Critical TypeScript Errors - Focused on compilation blockers
 * Addresses the most common unknown type issues preventing builds
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🔧 Fix Critical TypeScript Errors');
console.log('='.repeat(50));

// Get TypeScript errors
let tsOutput;
try {
  tsOutput = execSync('npm run typecheck 2>&1 || true', {
    cwd: projectRoot,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 10
  });
} catch (error) {
  tsOutput = error.stdout?.toString() || error.stderr?.toString() || '';
}

console.log('📊 Analyzing TypeScript errors...');

// Parse errors - focus on critical unknown type issues
const criticalPatterns = [
  // Common unknown type errors
  {
    pattern: /'([^']+)' is of type 'unknown'/,
    replacement: (match, varName) => {
      // Common fixes for unknown types
      if (varName.includes('window.')) {
        return `(${varName} as any)`;
      }
      if (varName.includes('data.') || varName.includes('result.')) {
        return `${varName} as Record<string, unknown>`;
      }
      if (varName.includes('.')) {
        return `${varName} as any`;
      }
      return match; // Don't change if unsure
    }
  },
  // Type not assignable errors with {}
  {
    pattern: /Type '{}' is not assignable to type '([^']+)'/,
    replacement: (match, targetType) => {
      if (targetType.includes('string')) {
        return ' as string';
      }
      if (targetType.includes('Record')) {
        return ' as Record<string, unknown>';
      }
      return ' as any';
    }
  }
];

// Process critical files with most errors
const errorLines = tsOutput.split('\n').filter(line =>
  line.includes('error TS') && (
    line.includes('unknown') ||
    line.includes('not assignable') ||
    line.includes('does not exist')
  )
);

// Group by file and get top 10 files with most errors
const fileErrorCount = {};
errorLines.forEach(line => {
  const match = line.match(/(.+?)\(\d+,\d+\): error TS/);
  if (match) {
    const file = match[1].replace(projectRoot + '/', '');
    fileErrorCount[file] = (fileErrorCount[file] || 0) + 1;
  }
});

const topFiles = Object.entries(fileErrorCount)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 10)
  .map(([file]) => file);

console.log(`🎯 Fixing top ${topFiles.length} files with most errors...`);

let totalFixed = 0;

// Process each file
for (const filePath of topFiles) {
  try {
    const fullPath = join(projectRoot, filePath);
    let content = readFileSync(fullPath, 'utf8');
    let fileChanged = false;

    // Apply critical pattern fixes
    for (const { pattern, replacement } of criticalPatterns) {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        content = newContent;
        fileChanged = true;
        totalFixed++;
      }
    }

    // Additional specific fixes for common issues
    const specificFixes = [
      // Fix window.gtag access
      [/window\.gtag/g, '(window as any).gtag'],
      // Fix window.fbq access
      [/window\.fbq/g, '(window as any).fbq'],
      // Fix generic unknown casting
      [/\.value as unknown/g, '.value'],
      // Fix array access on unknown
      [/\[([^\]]+)\] as unknown/g, '[$1]'],
    ];

    for (const [pattern, replacement] of specificFixes) {
      const newContent = content.replace(pattern, replacement);
      if (newContent !== content) {
        content = newContent;
        fileChanged = true;
        totalFixed++;
      }
    }

    if (fileChanged) {
      writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Fixed ${filePath}`);
    }

  } catch (error) {
    console.log(`❌ Failed to process ${filePath}: ${error.message}`);
  }
}

console.log(`\n🎯 Total fixes applied: ${totalFixed}`);
console.log('✅ Critical TypeScript errors fix completed');

if (totalFixed > 0) {
  console.log('\n🔄 Running TypeScript check again...');
  try {
    const newOutput = execSync('npm run typecheck 2>&1 || true', {
      cwd: projectRoot,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 5
    });

    const newErrorCount = (newOutput.match(/error TS/g) || []).length;
    console.log(`📊 Remaining TypeScript errors: ${newErrorCount}`);
  } catch (error) {
    console.log('❌ Could not verify remaining errors');
  }
}
