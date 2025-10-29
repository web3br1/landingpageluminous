#!/usr/bin/env node

/**
 * Fix Next.js Lock File Issues
 * Removes stale lock files that prevent Next.js from starting
 */

const fs = require("fs");
const path = require("path");

const LOCK_FILES = [".next/dev/lock", ".next/lock"];

function removeLockFiles() {
  console.log("🔧 Fixing Next.js lock file issues...");

  let removed = 0;

  LOCK_FILES.forEach((lockFile) => {
    const fullPath = path.join(process.cwd(), lockFile);

    try {
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log(`✅ Removed: ${lockFile}`);
        removed++;
      } else {
        console.log(`ℹ️  Not found: ${lockFile}`);
      }
    } catch (error) {
      console.error(`❌ Failed to remove ${lockFile}:`, error.message);
    }
  });

  if (removed > 0) {
    console.log(
      `🎉 Removed ${removed} lock file(s). Next.js should start now!`,
    );
    console.log("💡 Run: npm run dev");
  } else {
    console.log("ℹ️  No lock files found. If Next.js still won't start, try:");
    console.log(
      "   1. Kill all Node.js processes: taskkill /f /im node.exe /t",
    );
    console.log("   2. Clear Next.js cache: rm -rf .next");
    console.log("   3. Restart your terminal");
  }
}

// Also kill any hanging Next.js processes
function killNextProcesses() {
  console.log("🔪 Killing any hanging Next.js processes...");

  try {
    const { execSync } = require("child_process");

    // Try to kill Next.js processes on Windows
    if (process.platform === "win32") {
      try {
        execSync("taskkill /f /im node.exe /t 2>nul", { stdio: "pipe" });
        console.log("✅ Killed Node.js processes");
      } catch (e) {
        // Ignore errors
      }
    } else {
      // Unix-like systems
      try {
        execSync('pkill -f "next dev" || true', { stdio: "pipe" });
        execSync('pkill -f "next start" || true', { stdio: "pipe" });
        console.log("✅ Killed Next.js processes");
      } catch (e) {
        // Ignore errors
      }
    }
  } catch (error) {
    console.log("ℹ️  Could not kill processes (this is normal)");
  }
}

// Main execution
if (require.main === module) {
  killNextProcesses();
  removeLockFiles();
}

module.exports = { removeLockFiles, killNextProcesses };
