#!/usr/bin/env node

/**
 * SSR Code Safety Checker
 *
 * Simple script to check for common SSR safety issues in the codebase.
 * This serves as a temporary solution until full ESLint plugin is implemented.
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 SSR Code Safety Checker\n");

// Configuration
const FORBIDDEN_PATTERNS = [
  // Direct browser API access (not in safe contexts)
  {
    pattern:
      /\bwindow\b|\bdocument\b|\bnavigator\b|\blocalStorage\b|\bsessionStorage\b/g,
    excludeContexts: [
      "safeBrowserAPI",
      "useEffect",
      "useLayoutEffect",
      "isClient",
      "isServer",
      "typeof window",
      "window === undefined",
      "window !== undefined",
    ],
    message:
      "Direct browser API access detected. Use safeBrowserAPI() or wrap in useEffect.",
  },

  // Unsafe singleton initialization
  {
    pattern: /export const \w+ = new \w+\(\)/g,
    excludeContexts: [],
    message: "Direct singleton export may break SSR. Use lazy initialization.",
  },

  // Unsafe hook state initialization
  {
    pattern:
      /useState\(\s*window\.|useState\(\s*document\.|useState\(\s*navigator\./g,
    excludeContexts: [],
    message:
      "Unsafe hook state initialization. Move browser API access to useEffect.",
  },
];

// Files to check
const INCLUDE_PATTERNS = [
  "lib/**/*.ts",
  "lib/**/*.tsx",
  "components/**/*.ts",
  "components/**/*.tsx",
  "app/**/*.ts",
  "app/**/*.tsx",
];

const EXCLUDE_PATTERNS = [
  "**/node_modules/**",
  "**/dist/**",
  "**/build/**",
  "**/*.test.ts",
  "**/*.test.tsx",
  "**/*.spec.ts",
  "**/*.spec.tsx",
  "**/api/**", // API routes run on server anyway
  "scripts/**",
];

// Results
const results = {
  checked: 0,
  violations: 0,
  files: [],
};

/**
 * Check if line is in a safe context
 */
function isInSafeContext(line, excludeContexts) {
  return excludeContexts.some((context) => line.includes(context));
}

/**
 * Check a single file
 */
function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split("\n");
    const fileViolations = [];

    lines.forEach((line, index) => {
      FORBIDDEN_PATTERNS.forEach(({ pattern, excludeContexts, message }) => {
        const matches = line.match(pattern);
        if (matches && !isInSafeContext(line, excludeContexts)) {
          fileViolations.push({
            line: index + 1,
            content: line.trim(),
            message,
            pattern: pattern.source,
          });
        }
      });
    });

    if (fileViolations.length > 0) {
      results.violations += fileViolations.length;
      results.files.push({
        path: filePath,
        violations: fileViolations,
      });
    }

    results.checked++;
  } catch (error) {
    console.warn(`⚠️  Could not check ${filePath}: ${error.message}`);
  }
}

/**
 * Recursively find TypeScript files
 */
function findTypeScriptFiles(dir, files = []) {
  try {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip excluded directories
        const shouldSkip = EXCLUDE_PATTERNS.some((pattern) =>
          fullPath.includes(pattern.replace("**/", "").replace("/**", "")),
        );
        if (!shouldSkip) {
          findTypeScriptFiles(fullPath, files);
        }
      } else if (
        stat.isFile() &&
        (item.endsWith(".ts") || item.endsWith(".tsx"))
      ) {
        // Check if matches include patterns
        const relativePath = path.relative(process.cwd(), fullPath);
        const shouldInclude = INCLUDE_PATTERNS.some((pattern) => {
          const basePattern = pattern
            .replace("/**", "")
            .replace("**/", "")
            .replace("*", "");
          return relativePath.includes(basePattern);
        });

        if (shouldInclude) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    // Skip directories we can't read
  }

  return files;
}

/**
 * Find files to check
 */
function findFiles() {
  const dirs = ["lib", "components", "app"];
  let allFiles = [];

  for (const dir of dirs) {
    if (fs.existsSync(dir)) {
      allFiles = allFiles.concat(findTypeScriptFiles(dir));
    }
  }

  return allFiles;
}

/**
 * Main execution
 */
function main() {
  console.log("🔍 Scanning codebase for SSR safety issues...\n");

  const files = findFiles();
  console.log(`📁 Found ${files.length} files to check`);
  if (files.length > 0) {
    console.log("Files found:");
    files.slice(0, 5).forEach((file) => console.log(`  - ${file}`));
    if (files.length > 5) console.log(`  ... and ${files.length - 5} more`);
  }
  console.log("");

  files.forEach(checkFile);

  // Report results
  console.log("📊 Results:\n");

  if (results.violations === 0) {
    console.log("✅ No SSR safety violations found!");
    console.log("🎉 Codebase is SSR safe.");
  } else {
    console.log(
      `❌ Found ${results.violations} SSR safety violations in ${results.files.length} files:\n`,
    );

    results.files.forEach((file) => {
      console.log(`📄 ${file.path}:`);
      file.violations.forEach((violation) => {
        console.log(`  ${violation.line}: ${violation.content}`);
        console.log(`    💡 ${violation.message}`);
      });
      console.log("");
    });

    console.log("💡 Quick fixes:");
    console.log("• Use safeBrowserAPI() for browser API access");
    console.log("• Move browser API calls to useEffect");
    console.log("• Use lazy initialization for singletons");
    console.log("• Check docs/ssr-patterns.md for examples");
  }

  console.log(
    `\n📋 Summary: ${results.checked} files checked, ${results.violations} violations`,
  );

  // Exit with appropriate code
  if (results.violations > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main();
