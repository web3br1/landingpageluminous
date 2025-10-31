import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export class AnyTypeMigrator {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  async migrateAll() {
    console.log('🔄 Starting safe any → unknown migration...');

    // Get ESLint errors to identify any types
    const allErrors = await this.getAllEslintErrors();
    const anyTypeErrors = allErrors.filter(error =>
      error.ruleId === '@typescript-eslint/no-explicit-any'
    );

    console.log(`🎯 Found ${anyTypeErrors.length} any type errors to migrate`);

    // Group by file
    const errorsByFile = {};
    anyTypeErrors.forEach(error => {
      if (!errorsByFile[error.filePath]) {
        errorsByFile[error.filePath] = [];
      }
      errorsByFile[error.filePath].push(error);
    });

    console.log(`📁 Errors span ${Object.keys(errorsByFile).length} files`);

    let totalMigrated = 0;
    let filesProcessed = 0;

    for (const [filePath, errors] of Object.entries(errorsByFile)) {
      const migrated = await this.migrateFile(filePath, errors);
      if (migrated > 0) {
        console.log(`  ✅ ${path.relative(this.projectRoot, filePath)}: ${migrated} any → unknown`);
        totalMigrated += migrated;
        filesProcessed++;
      }

      // Progress indicator
      if (filesProcessed % 5 === 0) {
        console.log(`  📊 Progress: ${filesProcessed}/${Object.keys(errorsByFile).length} files processed`);
      }
    }

    console.log(`\n🎯 **COMPLETED**: ${totalMigrated} any types migrated to unknown in ${filesProcessed} files`);
    console.log('💡 Note: Review and add proper type guards where unknown is used');
    return totalMigrated;
  }

  async getAllEslintErrors() {
    try {
      let output;
      try {
        output = execSync('pnpm eslint . --format=json', {
          cwd: this.projectRoot,
          encoding: 'utf8',
          timeout: 60000,
          maxBuffer: 1024 * 1024 * 50 // 50MB buffer
        });
      } catch (execError) {
        // Capture stderr even on error
        output = execError.stdout || execError.stderr || '';
        if (!output && execError.stderr) {
          output = execError.stderr;
        }
      }

      try {
        const results = JSON.parse(output);
        const allMessages = [];

        results.forEach(fileResult => {
          if (fileResult.messages) {
            fileResult.messages.forEach(message => {
              allMessages.push({
                filePath: fileResult.filePath,
                ruleId: message.ruleId,
                line: message.line,
                column: message.column,
                message: message.message
              });
            });
          }
        });

        return allMessages;
      } catch (parseError) {
        return [];
      }
    } catch (error) {
      return [];
    }
  }

  async migrateFile(filePath, errors) {
    try {
      // filePath já vem como caminho absoluto do ESLint
      const fullPath = filePath;
      let content = fs.readFileSync(fullPath, 'utf8');
      let migrated = 0;

      // Process errors in reverse order to maintain line numbers
      errors.sort((a, b) => b.line - a.line);

      for (const error of errors) {
        const lines = content.split('\n');
        const lineIndex = error.line - 1;

        if (lineIndex >= 0 && lineIndex < lines.length) {
          const line = lines[lineIndex];
          const newLine = this.replaceAnyWithUnknown(line);

          if (newLine !== line) {
            lines[lineIndex] = newLine;
            content = lines.join('\n');
            migrated++;
          }
        }
      }

      if (migrated > 0) {
        fs.writeFileSync(fullPath, content);
      }

      return migrated;
    } catch (error) {
      console.warn(`Error migrating ${filePath}:`, error.message);
      return 0;
    }
  }

  replaceAnyWithUnknown(line) {
    // Safe replacements of any → unknown
    // These are generally safe because unknown is more restrictive

    let newLine = line;

    // Replace standalone 'any' with 'unknown'
    newLine = newLine.replace(/\bany\b/g, 'unknown');

    // Replace ': any' with ': unknown'
    newLine = newLine.replace(/:\s*any\b/g, ': unknown');

    // Replace 'any[]' with 'unknown[]'
    newLine = newLine.replace(/\bany\[\]/g, 'unknown[]');

    // Replace 'Promise<any>' with 'Promise<unknown>'
    newLine = newLine.replace(/Promise<any>/g, 'Promise<unknown>');

    return newLine;
  }
}

// CLI
console.log('🚀 Starting AnyTypeMigrator...');
console.log('import.meta.url:', import.meta.url);
console.log('process.argv[1]:', process.argv[1]);

const isMainModule = import.meta.url.includes('migrate-any-to-unknown.mjs') ||
                    process.argv[1]?.includes('migrate-any-to-unknown.mjs');

if (isMainModule) {
  console.log('✅ Running as main module');
  const migrator = new AnyTypeMigrator();
  migrator.migrateAll().catch(error => {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  });
} else {
  console.log('❌ Not running as main module');
}
