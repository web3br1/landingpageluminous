#!/usr/bin/env node

/**
 * Quick Unused Variables Fix - Minimal script for critical lint errors
 * Focuses ONLY on prefixing unused variables with _ (no complexity reduction)
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

console.log('🔧 Quick Unused Variables Fix');
console.log('='.repeat(50));

// Get ESLint output
let eslintOutput;
try {
  eslintOutput = execSync('pnpm eslint . --format=compact', {
    cwd: projectRoot,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 10,
    stdio: 'pipe'
  });
} catch (error) {
  // ESLint returns non-zero exit code when there are errors, but we want the output
  eslintOutput = error.stdout?.toString() || error.stderr?.toString() || '';
  if (!eslintOutput) {
    console.log('❌ Failed to get ESLint output');
    process.exit(1);
  }
}

// Parse only no-unused-vars errors
const unusedVarErrors = eslintOutput
  .split('\n')
  .filter(line => line.includes('no-unused-vars') || line.includes('@typescript-eslint/no-unused-vars'))
  .map(line => {
    const match = line.match(/(.+?):(\d+):(\d+):\s*(.+?)\s+(.+)/);
    if (!match) return null;

    const [, file, lineNum, col, rule, message] = match;
    const varMatch = message.match(/'([^']+)' is (?:assigned a value but )?never used/);
    if (!varMatch) return null;

    return {
      file: file.replace(projectRoot + '/', ''),
      line: parseInt(lineNum),
      variable: varMatch[1],
      rule
    };
  })
  .filter(Boolean);

console.log(`📊 Found ${unusedVarErrors.length} unused variable errors`);

// Group by file
const errorsByFile = unusedVarErrors.reduce((acc, error) => {
  if (!acc[error.file]) acc[error.file] = [];
  acc[error.file].push(error);
  return acc;
}, {});

let totalFixed = 0;

// Process each file
for (const [filePath, errors] of Object.entries(errorsByFile)) {
  try {
    const fullPath = join(projectRoot, filePath);
    let content = readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');

    let fileChanged = false;

    // Process errors for this file (in reverse order to maintain line numbers)
    [...errors].reverse().forEach(error => {
      const lineIndex = error.line - 1;
      if (lineIndex >= lines.length) return;

      const line = lines[lineIndex];

      // Skip if already prefixed with _
      if (line.includes(`_${error.variable}`)) return;

      // Simple pattern matching for variable declarations
      const patterns = [
        // Function parameters: (param1, param2) =>
        new RegExp(`\\b${error.variable}\\b(?=\\s*,|\\s*\\)|\\s*=\\s*[^=])`, 'g'),
        // Variable declarations: let/const var =, var,
        new RegExp(`\\b(let|const|var)\\s+${error.variable}\\b`, 'g'),
        // Destructuring: { var } or [ var ]
        new RegExp(`([{\\[]\\s*)${error.variable}(\\s*[}\\]])`, 'g'),
        // Import: import { var } from
        new RegExp(`import\\s+{[^}]*\\b${error.variable}\\b[^}]*}\\s+from`, 'g'),
      ];

      for (const pattern of patterns) {
        if (pattern.test(line)) {
          const newLine = line.replace(
            new RegExp(`\\b${error.variable}\\b`, 'g'),
            `_${error.variable}`
          );

          if (newLine !== line) {
            lines[lineIndex] = newLine;
            fileChanged = true;
            totalFixed++;
            break; // Only fix first match per line
          }
        }
      }
    });

    if (fileChanged) {
      writeFileSync(fullPath, lines.join('\n'), 'utf8');
      console.log(`✅ Fixed ${errors.length} variables in ${filePath}`);
    }

  } catch (error) {
    console.log(`❌ Failed to process ${filePath}: ${error.message}`);
  }
}

console.log(`\n🎯 Total variables prefixed: ${totalFixed}`);
console.log('✅ Quick unused variables fix completed');

if (totalFixed > 0) {
  console.log('\n🔄 Running ESLint again to verify...');
  try {
    const newOutput = execSync('pnpm eslint . --format=compact 2>&1 || true', {
      cwd: projectRoot,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 10
    });

    const remainingErrors = newOutput.split('\n').filter(line =>
      line.includes('no-unused-vars') || line.includes('@typescript-eslint/no-unused-vars')
    ).length;

    console.log(`📊 Remaining unused variable errors: ${remainingErrors}`);
  } catch (error) {
    console.log('❌ Could not verify remaining errors');
  }
}
