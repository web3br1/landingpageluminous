#!/usr/bin/env node

/**
 * CSP Violation Diagnostic Tool
 * Identifies scripts causing CSP violations and generates required hashes
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function calculateHash(content) {
  return crypto.createHash("sha256").update(content).digest("base64");
}

function findInlineScripts(content, filePath) {
  const scripts = [];
  const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = scriptRegex.exec(content)) !== null) {
    const fullScript = match[0];
    const scriptContent = match[1].trim();

    if (
      scriptContent &&
      !fullScript.includes("src=") &&
      !fullScript.includes("dangerouslySetInnerHTML")
    ) {
      const hash = calculateHash(scriptContent);
      scripts.push({
        content:
          scriptContent.substring(0, 100) +
          (scriptContent.length > 100 ? "..." : ""),
        fullContent: scriptContent,
        hash: `sha256-${hash}`,
        file: filePath,
        line: content.substring(0, match.index).split("\n").length,
      });
    }
  }

  return scripts;
}

function findDangerouslySetInnerHTML(content, filePath) {
  const scripts = [];
  const regex = /dangerouslySetInnerHTML=\{[\s\S]*?__html:\s*`([^`]*)`/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const scriptContent = match[1];
    if (scriptContent.trim()) {
      const hash = calculateHash(scriptContent);
      scripts.push({
        content:
          scriptContent.substring(0, 100) +
          (scriptContent.length > 100 ? "..." : ""),
        fullContent: scriptContent,
        hash: `sha256-${hash}`,
        file: filePath,
        line: content.substring(0, match.index).split("\n").length,
      });
    }
  }

  return scripts;
}

function scanDirectory(dirPath, results = []) {
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (
      stat.isDirectory() &&
      !item.startsWith(".") &&
      item !== "node_modules"
    ) {
      scanDirectory(fullPath, results);
    } else if (
      stat.isFile() &&
      (item.endsWith(".tsx") ||
        item.endsWith(".ts") ||
        item.endsWith(".js") ||
        item.endsWith(".jsx"))
    ) {
      try {
        const content = fs.readFileSync(fullPath, "utf8");

        // Find inline scripts
        const inlineScripts = findInlineScripts(content, fullPath);
        results.push(...inlineScripts);

        // Find dangerouslySetInnerHTML scripts
        const dangerScripts = findDangerouslySetInnerHTML(content, fullPath);
        results.push(...dangerScripts);
      } catch (error) {
        console.warn(`Could not read ${fullPath}:`, error.message);
      }
    }
  }

  return results;
}

function generateCSPHashList(scripts) {
  const uniqueHashes = [...new Set(scripts.map((s) => s.hash))];
  return uniqueHashes.map((hash) => `'${hash}'`).join(" ");
}

function main() {
  console.log("🔍 CSP Violation Diagnostic Tool\n");
  console.log("Scanning for inline scripts in the codebase...\n");

  const scripts = scanDirectory(path.resolve(__dirname, ".."));

  if (scripts.length === 0) {
    console.log("✅ No inline scripts found in the codebase.");
    return;
  }

  console.log(`📊 Found ${scripts.length} inline scripts:\n`);

  scripts.forEach((script, index) => {
    console.log(`${index + 1}. ${script.file}:${script.line}`);
    console.log(`   Hash: ${script.hash}`);
    console.log(`   Content: ${script.content}\n`);
  });

  const hashList = generateCSPHashList(scripts);
  console.log("🔧 Generated CSP Hash List:");
  console.log(`script-src 'self' blob: 'unsafe-eval' ${hashList}\n`);

  console.log("📋 Copy this hash list to your CSP configuration.\n");
  console.log("⚠️  Note: This includes all current inline scripts.");
  console.log(
    "   In production, consider using nonces instead of hashes for better security.\n",
  );

  // Check for the specific hash mentioned in the error
  const targetHash = "sha256-Fd8HDSo5DTW76vYB1UEBweel/r6nR85XAFcSX3hRHyU=";
  const foundScript = scripts.find((s) => s.hash === targetHash);

  if (foundScript) {
    console.log(`🎯 Found the violating script (${targetHash}):`);
    console.log(`   File: ${foundScript.file}:${foundScript.line}`);
    console.log(`   Content: ${foundScript.fullContent}\n`);
  } else {
    console.log(
      `❌ Could not find the violating script (${targetHash}) in the codebase.`,
    );
    console.log(
      "   This might be dynamically generated content or from a library.\n",
    );

    console.log("🔍 ANALYZING DYNAMIC SCRIPT SOURCES...\n");

    console.log("1. 🚀 Next.js/React Fast Refresh:");
    console.log(
      "   Next.js injects scripts for hot reloading during development.",
    );
    console.log(
      "   These scripts change with each build and cannot be predicted.",
    );
    console.log(
      "   Solution: Use 'unsafe-eval' in development or switch to nonces.\n",
    );

    console.log("2. ⚛️ React Development Scripts:");
    console.log(
      "   React injects scripts for error boundaries and development tools.",
    );
    console.log(
      "   These are generated dynamically and vary by React version.\n",
    );

    console.log("3. 📦 Third-party Libraries:");
    console.log("   Libraries like analytics, monitoring, or UI components");
    console.log("   may inject scripts dynamically.\n");

    console.log("4. 🛠️ Build Tools:");
    console.log("   Webpack, Turbopack, or other bundlers inject scripts for");
    console.log("   module loading, chunk management, etc.\n");

    console.log("💡 RECOMMENDED SOLUTIONS:\n");

    console.log("A) For Development (Current):");
    console.log(
      "   Keep 'unsafe-eval' to allow dynamic scripts from Next.js/React\n",
    );

    console.log("B) For Production:");
    console.log("   Use nonces instead of hashes for complete flexibility");
    console.log(
      "   Nonces allow any script with the correct nonce to execute\n",
    );

    console.log("C) Hybrid Approach (Recommended):");
    console.log("   - Development: 'unsafe-eval' for DX");
    console.log("   - Production: nonces + strict-dynamic for security\n");

    console.log("D) Monitor and Update:");
    console.log("   Use CSP reporting to catch new scripts and update hashes");
    console.log("   Implement automated hash generation in CI/CD\n");

    console.log("🔧 IMMEDIATE FIX: Add the missing hash to CSP temporarily\n");
    console.log(`Add: 'sha256-Fd8HDSo5DTW76vYB1UEBweel/r6nR85XAFcSX3hRHyU='\n`);
  }
}

main();
