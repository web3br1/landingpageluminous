/**
 * Security Quality Gate
 * Ensures security best practices and vulnerability checks
 */

import { execSync } from "child_process";
import { join } from "path";
import { existsSync, readFileSync } from "fs";
import { PRData, GateResult, QualityGate } from "../types";

export const securityGate: QualityGate = {
  id: "security",
  name: "Security & Vulnerability Analysis",
  description: "Checks for security vulnerabilities and best practices",
  required: true,
  timeout: 300000, // 5 minutes
  category: "security",

  async run(prData: PRData): Promise<GateResult> {
    const startTime = Date.now();

    try {
      const securityChecks = await runSecurityChecks();

      // Determine if security gate passes
      const hasCriticalVulnerabilities =
        securityChecks.vulnerabilities.critical > 0;
      const hasHighVulnerabilities = securityChecks.vulnerabilities.high > 2;

      const passed = !hasCriticalVulnerabilities && !hasHighVulnerabilities;

      return {
        gate: "security",
        name: "Security & Vulnerability Analysis",
        success: passed,
        duration: Date.now() - startTime,
        required: true,
        score: securityChecks.score,
        threshold: 90,
        error: passed
          ? undefined
          : generateSecurityError(securityChecks.vulnerabilities),
        details: {
          ...securityChecks,
          passed,
        },
      };
    } catch (error) {
      return {
        gate: "security",
        name: "Security & Vulnerability Analysis",
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : "Unknown error",
        required: true,
        score: 0,
        threshold: 90,
      };
    }
  },
};

async function runSecurityChecks() {
  const results = {
    vulnerabilities: {
      critical: 0,
      high: 0,
      moderate: 0,
      low: 0,
      total: 0,
    },
    codeIssues: [] as string[],
    configIssues: [] as string[],
    score: 100,
    recommendations: [] as string[],
  };

  try {
    // Check for npm audit
    console.log("🔒 Running dependency vulnerability scan...");
    try {
      const auditOutput = execSync("npm audit --json", {
        cwd: process.cwd(),
        stdio: "pipe",
        timeout: 120000,
      });

      const auditData = JSON.parse(auditOutput.toString());
      results.vulnerabilities = extractVulnerabilityCounts(auditData);
    } catch (error: any) {
      // npm audit returns non-zero exit code when vulnerabilities found
      if (error.stdout) {
        try {
          const auditData = JSON.parse(error.stdout.toString());
          results.vulnerabilities = extractVulnerabilityCounts(auditData);
        } catch {
          results.codeIssues.push("Failed to parse npm audit output");
        }
      }
    }

    // Check for security-related dependencies
    console.log("🔒 Analyzing security dependencies...");
    const packageJson = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), "utf8"),
    );

    const securityDeps = [
      "helmet",
      "express-rate-limit",
      "joi",
      "zod",
      "helmet-csp",
      "hpp",
      "xss-clean",
      "sanitize-html",
    ];

    const installedSecurityDeps = securityDeps.filter(
      (dep) =>
        packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep],
    );

    if (installedSecurityDeps.length < 3) {
      results.configIssues.push("Limited security middleware detected");
      results.score -= 10;
    }

    // Check for environment variable exposure
    console.log("🔒 Checking for security misconfigurations...");
    const envIssues = await checkEnvironmentSecurity();
    results.configIssues.push(...envIssues.issues);
    results.score -= envIssues.penalty;

    // Check code for security anti-patterns
    console.log("🔒 Analyzing code for security patterns...");
    const codeSecurity = await analyzeCodeSecurity();
    results.codeIssues.push(...codeSecurity.issues);
    results.score -= codeSecurity.penalty;

    // Generate recommendations
    results.recommendations = generateSecurityRecommendations(
      results.vulnerabilities,
      results.codeIssues.length,
      results.configIssues.length,
    );

    // Ensure score doesn't go below 0
    results.score = Math.max(0, results.score);

    return results;
  } catch (error) {
    console.warn("Security checks failed:", error);
    results.codeIssues.push("Security analysis failed");
    results.score = 50;
    results.recommendations.push("Manual security review required");
    return results;
  }
}

function extractVulnerabilityCounts(auditData: any) {
  const vulnerabilities = auditData.vulnerabilities || {};

  return {
    critical: Object.values(vulnerabilities).filter(
      (v: any) => v.severity === "critical",
    ).length,
    high: Object.values(vulnerabilities).filter(
      (v: any) => v.severity === "high",
    ).length,
    moderate: Object.values(vulnerabilities).filter(
      (v: any) => v.severity === "moderate",
    ).length,
    low: Object.values(vulnerabilities).filter((v: any) => v.severity === "low")
      .length,
    total: Object.keys(vulnerabilities).length,
  };
}

async function checkEnvironmentSecurity() {
  const issues: string[] = [];
  let penalty = 0;

  try {
    // Check for .env files that might be committed
    const envFiles = [
      ".env",
      ".env.local",
      ".env.development",
      ".env.production",
    ];
    for (const envFile of envFiles) {
      const envPath = join(process.cwd(), envFile);
      if (existsSync(envPath)) {
        const content = readFileSync(envPath, "utf8");

        // Check for secrets patterns
        if (
          content.includes("SECRET=") ||
          content.includes("KEY=") ||
          content.includes("PASSWORD=") ||
          content.includes("TOKEN=")
        ) {
          issues.push(`Potential secrets in ${envFile}`);
          penalty += 15;
        }
      }
    }

    // Check Next.js config for security headers
    const nextConfigPath = join(process.cwd(), "next.config.mjs");
    if (existsSync(nextConfigPath)) {
      const config = readFileSync(nextConfigPath, "utf8");

      if (
        !config.includes("Content-Security-Policy") &&
        !config.includes("headers")
      ) {
        issues.push("Missing security headers configuration");
        penalty += 10;
      }
    }

    // Check for middleware.ts
    const middlewarePath = join(process.cwd(), "middleware.ts");
    if (!existsSync(middlewarePath)) {
      issues.push("Missing middleware.ts for request processing");
      penalty += 5;
    }
  } catch (error) {
    issues.push("Environment security check failed");
    penalty += 5;
  }

  return { issues, penalty };
}

async function analyzeCodeSecurity() {
  const issues: string[] = [];
  let penalty = 0;

  try {
    // Check for dangerous patterns in key files
    const criticalFiles = [
      "lib/auth.ts",
      "lib/api/",
      "pages/api/",
      "app/api/",
      "middleware.ts",
    ];

    for (const filePattern of criticalFiles) {
      // This is a simplified check - in real implementation, use AST parsing
      const files = await findFiles(filePattern);
      for (const file of files) {
        if (existsSync(file)) {
          const content = readFileSync(file, "utf8");

          // Check for dangerous patterns
          if (content.includes("eval(")) {
            issues.push(`Dangerous eval() usage in ${file}`);
            penalty += 20;
          }

          if (content.includes("innerHTML")) {
            issues.push(`Potential XSS via innerHTML in ${file}`);
            penalty += 10;
          }

          if (
            content.includes("process.env") &&
            !content.includes("server-only")
          ) {
            issues.push(`Client-side environment variable access in ${file}`);
            penalty += 15;
          }
        }
      }
    }
  } catch (error) {
    issues.push("Code security analysis failed");
    penalty += 5;
  }

  return { issues, penalty };
}

async function findFiles(pattern: string): Promise<string[]> {
  // Simplified file finding - in real implementation, use glob
  try {
    const { glob } = await import("glob");
    return glob(pattern, { cwd: process.cwd() });
  } catch {
    return [];
  }
}

function generateSecurityError(vulnerabilities: {
  critical: number;
  high: number;
  moderate: number;
  low: number;
  total: number;
}): string {
  const parts: string[] = [];

  if (vulnerabilities.critical > 0) {
    parts.push(`${vulnerabilities.critical} critical`);
  }

  if (vulnerabilities.high > 0) {
    parts.push(`${vulnerabilities.high} high`);
  }

  return `Security issues found: ${parts.join(", ")} vulnerabilities`;
}

function generateSecurityRecommendations(
  vulnerabilities: {
    critical: number;
    high: number;
    moderate: number;
    low: number;
    total: number;
  },
  codeIssues: number,
  configIssues: number,
): string[] {
  const recommendations: string[] = [];

  if (vulnerabilities.total > 0) {
    recommendations.push(
      `Address ${vulnerabilities.total} dependency vulnerabilities`,
    );
  }

  if (codeIssues > 0) {
    recommendations.push(`Fix ${codeIssues} code security issues`);
  }

  if (configIssues > 0) {
    recommendations.push(
      `Resolve ${configIssues} security configuration issues`,
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("Security posture looks good");
  }

  return recommendations;
}
