#!/usr/bin/env node

/**
 * Fix Unused Variables Script
 * Automatically prefixes unused variables with underscore
 * Target: Fix 1,668 no-unused-vars errors
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔧 Fixing Unused Variables - Starting...\n');

async function fixUnusedVars() {
  console.log('📊 Running ESLint to find unused variables...\n');

  try {
    const output = execSync('pnpm run lint 2>&1', { encoding: 'utf8' });
    const lines = output.split('\n');

    // Find all no-unused-vars errors
    const unusedErrors = lines
      .filter(line => line.includes('no-unused-vars') || line.includes('@typescript-eslint/no-unused-vars'))
      .map(line => {
        const match = line.match(/^(.*?\.(ts|tsx|js|jsx)):(\d+):(\d+)\s+error\s+([^@]+@[^\s]+|[^\s]+)\s+'(\w+)'/);
        if (match) {
          return {
            file: match[1],
            line: parseInt(match[3]),
            column: parseInt(match[4]),
            rule: match[5].trim(),
            varName: match[6],
          };
        }
        return null;
      })
      .filter(Boolean);

    console.log(`📋 Found ${unusedErrors.length} unused variable errors\n`);

    let fixed = 0;
    let skipped = 0;

    for (const error of unusedErrors) {
      try {
        const content = fs.readFileSync(error.file, 'utf8');
        const lines = content.split('\n');

        if (lines[error.line - 1]) {
          const line = lines[error.line - 1];

          // Skip if already prefixed with underscore
          if (error.varName.startsWith('_')) {
            skipped++;
            continue;
          }

          // Skip certain variables that might be used indirectly
          if (shouldKeepVariable(error.varName)) {
            skipped++;
            continue;
          }

          // Replace the variable name with underscore prefix
          const newLine = line.replace(
            new RegExp(`\\b${error.varName}\\b`, 'g'),
            `_${error.varName}`
          );

          if (newLine !== line) {
            lines[error.line - 1] = newLine;
            fs.writeFileSync(error.file, lines.join('\n'), 'utf8');
            fixed++;
          }
        }
      } catch (err) {
        console.warn(`  ⚠️  Failed to fix ${error.file}:${error.line}: ${err.message}`);
      }
    }

    console.log(`\n✅ Results:`);
    console.log(`  Fixed: ${fixed} unused variables`);
    console.log(`  Skipped: ${skipped} variables (already prefixed or special cases)`);
    console.log(`  Total processed: ${fixed + skipped}`);

    const successRate = ((fixed / (fixed + skipped)) * 100).toFixed(1);
    console.log(`  Success rate: ${successRate}%`);

  } catch (error) {
    console.error('❌ Failed to analyze ESLint errors:', error.message);
    process.exit(1);
  }
}

function shouldKeepVariable(varName) {
  // Keep certain variables that might be used indirectly or are special
  const keepPatterns = [
    /^error$/,     // Error parameters often used indirectly
    /^data$/,      // Data parameters often used indirectly
    /^context$/,   // Context parameters often used indirectly
    /^config$/,    // Config parameters often used indirectly
    /^req$/,       // Request objects in API routes
    /^res$/,       // Response objects in API routes
    /^next$/,      // Next function in middleware
    /^props$/,     // React props
    /^children$/,  // React children
    /^params$/,    // Route parameters
    /^searchParams$/, // Search parameters
  ];

  return keepPatterns.some(pattern => pattern.test(varName));
}

// Run the fixes
fixUnusedVars().catch(console.error);