#!/usr/bin/env node

/**
 * CSP Blind Spots Audit - Comprehensive Security Analysis
 * Checks for classic CSP implementation gaps and security blind spots
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CSPBlindSpotsAuditor {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.successes = [];
  }

  log(level, message, details = null) {
    const entry = {
      level,
      message,
      details,
      timestamp: new Date().toISOString(),
    };
    switch (level) {
      case "ERROR":
        this.issues.push(entry);
        break;
      case "WARN":
        this.warnings.push(entry);
        break;
      case "SUCCESS":
        this.successes.push(entry);
        break;
    }
    console.log(`[${level}] ${message}`);
    if (details) console.log(`       ${JSON.stringify(details, null, 2)}`);
  }

  // 1. POLÍTICA CSP E EXECUÇÃO
  async auditCSPPolicy() {
    console.log("\n🔍 1. AUDITING CSP POLICY & EXECUTION\n" + "=".repeat(50));

    try {
      // Check next.config.mjs CSP implementation
      const nextConfigPath = path.resolve(__dirname, "../next.config.mjs");
      const nextConfig = fs.readFileSync(nextConfigPath, "utf8");

      // Check for fallback cross-browser support
      if (!nextConfig.includes("'self' https:")) {
        this.log("ERROR", "Missing fallback cross-browser support", {
          issue: "strict-dynamic not supported by all browsers (Safari)",
          fix: "Add minimal fallback: self https: + essential hashes",
        });
      } else {
        this.log("SUCCESS", "Fallback cross-browser support present");
      }

      // Check worker-src vs script-src separation
      // Parse CSP more carefully to check blob: placement
      const devCSP = nextConfig.match(/devCSP\s*=\s*\[(.*?)\]/s)?.[1] || "";
      const prodCSP = nextConfig.match(/prodCSP\s*=\s*\[(.*?)\]/s)?.[1] || "";

      const checkBlobPlacement = (cspString, env) => {
        // Extract directives
        const directives = cspString.split(";").map((d) => d.trim());

        let hasBlobInScript = false;
        let hasBlobInWorker = false;

        directives.forEach((directive) => {
          if (directive.startsWith('"script-src')) {
            hasBlobInScript = directive.includes("blob:");
          }
          if (directive.startsWith('"worker-src')) {
            hasBlobInWorker = directive.includes("blob:");
          }
        });

        if (hasBlobInScript) {
          this.log(
            "ERROR",
            `blob: found in script-src (${env}) - should be in worker-src only`,
            {
              issue: "Reduces surface of most sensitive directive",
              fix: "Move blob: to worker-src directive",
            },
          );
        } else if (hasBlobInWorker) {
          this.log(
            "SUCCESS",
            `blob: properly separated in worker-src (${env})`,
          );
        } else {
          this.log("INFO", `No blob: usage detected in CSP (${env})`);
        }
      };

      if (devCSP) checkBlobPlacement(devCSP, "DEV");
      if (prodCSP) checkBlobPlacement(prodCSP, "PROD");

      // Check style-src safety
      if (nextConfig.includes("style-src 'self' 'unsafe-inline'")) {
        this.log("WARN", "style-src allows unsafe-inline", {
          issue: "Inline styles bypass CSP protection",
          fix: "Use nonces for inline styles or unsafe-hashes for specific attributes",
        });
      }

      // Check SVG security
      if (nextConfig.includes("object-src 'none'")) {
        this.log(
          "SUCCESS",
          "object-src properly blocked (covers SVG via object/embed)",
        );
      } else {
        this.log(
          "ERROR",
          "object-src not blocked - SVG injection risk via object/embed",
        );
      }

      // Check connect-src by environment
      const hasDevConnect =
        nextConfig.includes("ws://localhost") &&
        nextConfig.includes("http://localhost");
      const hasProdConnect = nextConfig.includes(
        "connect-src 'self' https: wss:",
      );

      if (hasDevConnect && hasProdConnect) {
        this.log("SUCCESS", "connect-src properly scoped by environment");
      } else {
        this.log("WARN", "connect-src may be too permissive", {
          dev: hasDevConnect,
          prod: hasProdConnect,
        });
      }
    } catch (error) {
      this.log("ERROR", "Failed to audit CSP policy", { error: error.message });
    }
  }

  // 2. INTEGRAÇÕES E TERCEIROS
  async auditIntegrations() {
    console.log(
      "\n🔍 2. AUDITING INTEGRATIONS & THIRD PARTIES\n" + "=".repeat(50),
    );

    // Check for Stripe/payment integrations (common iframe risk)
    const hasFrameSrc =
      fs.existsSync(path.resolve(__dirname, "../next.config.mjs")) &&
      fs
        .readFileSync(path.resolve(__dirname, "../next.config.mjs"), "utf8")
        .includes("frame-src");

    if (!hasFrameSrc) {
      this.log("WARN", "No frame-src directive found", {
        issue: "Third-party iframes (payments, embeds) not controlled",
        fix: "Add frame-src with exact domains + sandbox attributes",
      });
    }

    // Check for SRI (Subresource Integrity) usage
    const layoutPath = path.resolve(__dirname, "../app/layout.tsx");
    if (fs.existsSync(layoutPath)) {
      const layout = fs.readFileSync(layoutPath, "utf8");
      if (!layout.includes("integrity=")) {
        this.log("WARN", "No SRI (integrity) attributes found", {
          issue: "External scripts not protected against tampering",
          fix: "Add integrity + crossorigin to external script tags",
        });
      } else {
        this.log("SUCCESS", "SRI attributes present for external scripts");
      }
    }
  }

  // 3. CABEÇALHOS DE SEGURANÇA COMPLEMENTARES
  async auditSecurityHeaders() {
    console.log(
      "\n🔍 3. AUDITING COMPLEMENTARY SECURITY HEADERS\n" + "=".repeat(50),
    );

    const nextConfig = fs.readFileSync(
      path.resolve(__dirname, "../next.config.mjs"),
      "utf8",
    );

    const headers = [
      {
        name: "Strict-Transport-Security",
        present: nextConfig.includes("Strict-Transport-Security"),
      },
      {
        name: "Permissions-Policy",
        present: nextConfig.includes("Permissions-Policy"),
      },
      {
        name: "Referrer-Policy",
        present: nextConfig.includes("Referrer-Policy"),
      },
      {
        name: "X-Content-Type-Options",
        present: nextConfig.includes("X-Content-Type-Options"),
      },
      {
        name: "Cross-Origin-Opener-Policy",
        present: nextConfig.includes("Cross-Origin-Opener-Policy"),
      },
      {
        name: "Cross-Origin-Embedder-Policy",
        present: nextConfig.includes("Cross-Origin-Embedder-Policy"),
      },
      {
        name: "Cross-Origin-Resource-Policy",
        present: nextConfig.includes("Cross-Origin-Resource-Policy"),
      },
    ];

    headers.forEach((header) => {
      if (header.present) {
        this.log("SUCCESS", `${header.name} header configured`);
      } else {
        this.log("WARN", `${header.name} header missing`, {
          impact: "Reduces defense-in-depth security",
          priority:
            header.name === "Strict-Transport-Security" ? "HIGH" : "MEDIUM",
        });
      }
    });
  }

  // 4. COOKIES, AUTENTICAÇÃO E ESTADOS
  async auditCookiesAndAuth() {
    console.log(
      "\n🔍 4. AUDITING COOKIES, AUTH & STATE MANAGEMENT\n" + "=".repeat(50),
    );

    // This would need to check actual cookie configuration
    // For now, check if there are any cookie-related security measures
    const middlewarePath = path.resolve(__dirname, "../middleware.ts");
    if (fs.existsSync(middlewarePath)) {
      const middlewareContent = fs.readFileSync(middlewarePath, "utf8");

      if (
        middlewareContent.includes("cookie") ||
        middlewareContent.includes("Cookie")
      ) {
        this.log("SUCCESS", "Cookie handling detected in middleware");
      } else {
        this.log("WARN", "No cookie security measures detected", {
          issue: "CSRF protection, cookie security flags",
          fix: "Implement secure cookie handling with SameSite, HttpOnly, Secure",
        });
      }
    }

    // Check for CSRF protection
    const middlewareContent = fs.existsSync(middlewarePath)
      ? fs.readFileSync(middlewarePath, "utf8")
      : "";
    const hasCSRF =
      middlewareContent.includes("csrf") ||
      middlewareContent.includes("CSRF") ||
      middlewareContent.includes("token") ||
      middlewareContent.includes("xsrf");

    if (!hasCSRF) {
      this.log("WARN", "No CSRF protection detected", {
        issue: "CSP does not cover CSRF attacks",
        fix: "Implement CSRF tokens or double-submit pattern",
      });
    }
  }

  // 5. OBSERVABILIDADE & OPERAÇÃO
  async auditObservability() {
    console.log(
      "\n🔍 5. AUDITING OBSERVABILITY & OPERATIONS\n" + "=".repeat(50),
    );

    const reportRoutePath = path.resolve(
      __dirname,
      "../app/api/csp-report/route.ts",
    );
    if (fs.existsSync(reportRoutePath)) {
      const reportRoute = fs.readFileSync(reportRoutePath, "utf8");

      // Check for rate limiting
      if (reportRoute.includes("rate") || reportRoute.includes("limit")) {
        this.log("SUCCESS", "CSP report endpoint has rate limiting protection");
      } else {
        this.log("WARN", "CSP report endpoint lacks rate limiting", {
          issue: "Vulnerable to DoS via spam reports",
          fix: "Implement rate limiting on /api/csp-report",
        });
      }

      // Check for PII filtering
      if (reportRoute.includes("user-agent") || reportRoute.includes("ip")) {
        this.log("WARN", "CSP reports may contain PII", {
          issue: "IP addresses and user agents logged",
          fix: "Filter or anonymize PII in reports",
        });
      }
    }

    // Check for development/production parity tests
    const packageJson = JSON.parse(
      fs.readFileSync(path.resolve(__dirname, "../package.json"), "utf8"),
    );
    const hasTestScript =
      packageJson.scripts &&
      (packageJson.scripts["test:csp"] ||
        packageJson.scripts["test:security"] ||
        packageJson.scripts["test:headers"]);

    if (!hasTestScript) {
      this.log("WARN", "No CSP/header contract tests in CI", {
        issue: "Cannot guarantee DEV/PROD parity",
        fix: "Add tests that verify CSP/headers in production-like builds",
      });
    }
  }

  // 6. NEXT.JS / RSC / BUNDLER
  async auditNextJS() {
    console.log(
      "\n🔍 6. AUDITING NEXT.JS / RSC / BUNDLER SPECIFICS\n" + "=".repeat(50),
    );

    const nextConfig = fs.readFileSync(
      path.resolve(__dirname, "../next.config.mjs"),
      "utf8",
    );

    // Check RSC/HMR channels
    const hasWebSocketSupport =
      nextConfig.includes("ws://localhost") ||
      nextConfig.includes("wss://localhost");

    if (hasWebSocketSupport) {
      this.log("SUCCESS", "WebSocket support configured for HMR/RSC");
    } else {
      this.log("ERROR", "Missing WebSocket support for development", {
        issue: 'RSC/HMR will fail with "Connection closed"',
        fix: "Add ws://localhost:PORT to connect-src in development",
      });
    }

    // Check for Service Worker considerations
    const hasSW =
      fs.existsSync(path.resolve(__dirname, "../public/sw.js")) ||
      fs.existsSync(path.resolve(__dirname, "../lib/sw/")) ||
      nextConfig.includes("service-worker") ||
      nextConfig.includes("workbox");

    if (hasSW) {
      this.log("WARN", "Service Worker detected - verify CSP compliance", {
        issue: "SW may bypass CSP for cached assets",
        fix: "Ensure SW routes have proper CSP headers",
      });
    }

    // Check for WebAssembly/import maps
    const hasWASM = fs
      .readdirSync(path.resolve(__dirname, "../"))
      .some((file) => file.endsWith(".wasm") || file.includes("webassembly"));

    if (hasWASM) {
      this.log("WARN", "WebAssembly files detected", {
        issue: "WASM execution falls under script-src",
        fix: "Ensure CSP allows WASM execution if needed",
      });
    }
  }

  // 7. INLINE SCRIPTS AUDIT
  async auditInlineScripts() {
    console.log(
      "\n🔍 7. AUDITING INLINE SCRIPTS & DOM INJECTION\n" + "=".repeat(50),
    );

    const layoutPath = path.resolve(__dirname, "../app/layout.tsx");
    if (fs.existsSync(layoutPath)) {
      const layout = fs.readFileSync(layoutPath, "utf8");

      // Check for dangerouslySetInnerHTML
      const dangerMatches = layout.match(/dangerouslySetInnerHTML/g);
      if (dangerMatches && dangerMatches.length > 0) {
        this.log(
          "WARN",
          `${dangerMatches.length} dangerouslySetInnerHTML found`,
          {
            issue: "Inline scripts may not have CSP protection",
            fix: "Add nonce to inline scripts or use hashes",
          },
        );
      }

      // Check for script tags with nonce
      const scriptTags = layout.match(/<script[^>]*>/g) || [];
      const scriptsWithNonce = scriptTags.filter((tag) =>
        tag.includes("nonce="),
      );
      const scriptsWithoutNonce = scriptTags.filter(
        (tag) => !tag.includes("nonce="),
      );

      if (scriptsWithoutNonce.length > 0) {
        this.log(
          "WARN",
          `${scriptsWithoutNonce.length} script tags without nonce`,
          {
            issue: "Inline scripts blocked by CSP",
            fix: "Add nonce attribute or use external scripts",
          },
        );
      }

      if (scriptsWithNonce.length > 0) {
        this.log(
          "SUCCESS",
          `${scriptsWithNonce.length} scripts properly nonced`,
        );
      }
    }
  }

  // 8. VALIDATION TESTS
  async runValidationTests() {
    console.log("\n🔍 8. RUNNING VALIDATION TESTS\n" + "=".repeat(50));

    // Test 1: Contract validation (simulate production build)
    const isProd = process.env.NODE_ENV === "production";
    if (!isProd) {
      this.log(
        "WARN",
        "Contract tests should run against production-like build",
        {
          issue: "Cannot validate production CSP behavior",
          fix: "Run tests with NODE_ENV=production",
        },
      );
    }

    // Test 2: Header presence check
    const nextConfig = fs.readFileSync(
      path.resolve(__dirname, "../next.config.mjs"),
      "utf8",
    );
    const requiredProdDirectives = [
      "object-src 'none'",
      "base-uri 'none'",
      "frame-ancestors",
      "worker-src",
    ];

    requiredProdDirectives.forEach((directive) => {
      if (nextConfig.includes(directive)) {
        this.log("SUCCESS", `Required directive present: ${directive}`);
      } else {
        this.log("ERROR", `Missing required directive: ${directive}`);
      }
    });

    // Test 3: Browser compatibility check
    const hasStrictDynamic = nextConfig.includes("strict-dynamic");
    const hasFallback =
      nextConfig.includes("'self' https:") || nextConfig.includes("sha256-");

    if (hasStrictDynamic && !hasFallback) {
      this.log("ERROR", "strict-dynamic without fallback for Safari/WebKit", {
        issue: "CSP will fail on Safari and older browsers",
        fix: "Add fallback allowlist or hashes",
      });
    } else if (hasStrictDynamic && hasFallback) {
      this.log(
        "SUCCESS",
        "strict-dynamic with proper fallback for cross-browser support",
      );
    }
  }

  async generateReport() {
    console.log("\n📊 AUDIT REPORT SUMMARY\n" + "=".repeat(50));

    console.log(`\n✅ SUCCESSES (${this.successes.length}):`);
    this.successes.forEach((s) => console.log(`   • ${s.message}`));

    console.log(`\n⚠️  WARNINGS (${this.warnings.length}):`);
    this.warnings.forEach((w) => console.log(`   • ${w.message}`));

    console.log(`\n❌ ISSUES (${this.issues.length}):`);
    this.issues.forEach((i) => console.log(`   • ${i.message}`));

    // Risk assessment
    const riskLevel =
      this.issues.length > 2
        ? "HIGH"
        : this.warnings.length > 5
          ? "MEDIUM"
          : "LOW";

    console.log(`\n🎯 RISK ASSESSMENT: ${riskLevel}`);
    console.log(
      `   Issues: ${this.issues.length} | Warnings: ${this.warnings.length} | Successes: ${this.successes.length}`,
    );

    if (riskLevel === "HIGH") {
      console.log(
        "\n🚨 CRITICAL: Multiple security gaps detected. Address issues before production deployment.",
      );
    } else if (riskLevel === "MEDIUM") {
      console.log(
        "\n⚠️  MODERATE: Some improvements needed. Consider addressing warnings for better security posture.",
      );
    } else {
      console.log(
        "\n✅ LOW RISK: Good security posture. Monitor and maintain.",
      );
    }

    return {
      successes: this.successes.length,
      warnings: this.warnings.length,
      issues: this.issues.length,
      riskLevel,
    };
  }

  async runFullAudit() {
    console.log("🔬 COMPREHENSIVE CSP BLIND SPOTS AUDIT\n");
    console.log("Checking for classic CSP implementation gaps...\n");

    await this.auditCSPPolicy();
    await this.auditIntegrations();
    await this.auditSecurityHeaders();
    await this.auditCookiesAndAuth();
    await this.auditObservability();
    await this.auditNextJS();
    await this.auditInlineScripts();
    await this.runValidationTests();

    return await this.generateReport();
  }
}

// Run the audit
const auditor = new CSPBlindSpotsAuditor();
auditor.runFullAudit().then(() => {
  console.log("\n🎯 NEXT STEPS:");
  console.log("1. Review and address CRITICAL issues immediately");
  console.log("2. Implement fixes for warnings where applicable");
  console.log("3. Add contract tests to CI pipeline");
  console.log("4. Run this audit regularly as part of security reviews");
});
