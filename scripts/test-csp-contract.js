#!/usr/bin/env node

/**
 * CSP Contract Test - Validates CSP and Security Headers in Production Mode
 * Ensures DEV/PROD parity and compliance with security requirements
 */

import { spawn } from "child_process";
import http from "http";

class CSPContractTester {
  constructor() {
    this.serverProcess = null;
    this.testResults = {
      passed: 0,
      failed: 0,
      warnings: 0,
      tests: [],
    };
  }

  log(level, message, details = null) {
    const entry = {
      level,
      message,
      details,
      timestamp: new Date().toISOString(),
    };
    this.testResults.tests.push(entry);

    switch (level) {
      case "PASS":
        this.testResults.passed++;
        console.log(`✅ ${message}`);
        break;
      case "FAIL":
        this.testResults.failed++;
        console.log(`❌ ${message}`);
        break;
      case "WARN":
        this.testResults.warnings++;
        console.log(`⚠️  ${message}`);
        break;
      default:
        console.log(`${level}: ${message}`);
    }

    if (details) {
      console.log(`   ${JSON.stringify(details, null, 2)}`);
    }
  }

  async startProductionServer() {
    console.log(
      "🚀 Starting Next.js in production mode for contract testing...\n",
    );

    return new Promise((resolve, reject) => {
      // Set production environment
      process.env.NODE_ENV = "production";

      // For this test, we'll assume the app is already built and running
      // In CI, you would run: npm run build && npm run start
      console.log(
        "ℹ️  Note: This test assumes Next.js is built and running on port 3001",
      );
      console.log(
        '   In CI: Run "npm run build && PORT=3001 npm run start" before this test\n',
      );

      // Simple connectivity test instead of spawning
      const testConnection = () => {
        const options = {
          hostname: "localhost",
          port: 3001,
          path: "/",
          method: "HEAD",
        };

        const req = http.request(options, (res) => {
          if (res.statusCode === 200) {
            console.log("📡 Production server detected on port 3001\n");
            resolve();
          } else {
            reject(new Error(`Server responded with status ${res.statusCode}`));
          }
        });

        req.on("error", (err) => {
          reject(
            new Error(
              `Cannot connect to production server: ${err.message}. Make sure Next.js is running on port 3001 with NODE_ENV=production`,
            ),
          );
        });

        req.setTimeout(3000, () => {
          reject(
            new Error(
              "Connection timeout - server not responding on port 3001",
            ),
          );
        });

        req.end();
      };

      // Try to connect immediately
      testConnection();
    });
  }

  async stopServer() {
    if (this.serverProcess) {
      this.serverProcess.kill("SIGTERM");
      console.log("🛑 Production server stopped\n");
    }
  }

  async testHeaders() {
    console.log("🔍 Testing CSP and Security Headers...\n");

    return new Promise((resolve) => {
      const options = {
        hostname: "localhost",
        port: 3001,
        path: "/",
        method: "GET",
      };

      const req = http.request(options, (res) => {
        const headers = res.headers;

        // Test CSP Header
        const cspHeader = headers["content-security-policy"];
        if (cspHeader) {
          this.log("PASS", "CSP header present in production");

          // Test critical CSP directives
          const hasNonce = cspHeader.includes("nonce-");
          const hasStrictDynamic = cspHeader.includes("strict-dynamic");
          const hasNoUnsafeEval = !cspHeader.includes("unsafe-eval");
          const hasNoUnsafeInline = !cspHeader.includes("unsafe-inline");
          const hasObjectSrcNone = cspHeader.includes("object-src 'none'");
          const hasBaseUriNone = cspHeader.includes("base-uri 'none'");
          const hasFrameAncestors = cspHeader.includes("frame-ancestors");
          const hasWorkerSrc = cspHeader.includes("worker-src");

          // Required production CSP checks
          if (hasNonce) this.log("PASS", "CSP uses nonces (secure)");
          else this.log("FAIL", "CSP missing nonces");
          if (hasStrictDynamic) this.log("PASS", "CSP uses strict-dynamic");
          else this.log("FAIL", "CSP missing strict-dynamic");
          if (hasNoUnsafeEval) this.log("PASS", "CSP blocks unsafe-eval");
          else this.log("FAIL", "CSP allows unsafe-eval");
          if (hasNoUnsafeInline) this.log("PASS", "CSP blocks unsafe-inline");
          else this.log("FAIL", "CSP allows unsafe-inline");
          if (hasObjectSrcNone)
            this.log("PASS", "CSP blocks object/embed/applet");
          else this.log("FAIL", "CSP missing object-src protection");
          if (hasBaseUriNone) this.log("PASS", "CSP restricts base-uri");
          else this.log("FAIL", "CSP missing base-uri protection");
          if (hasFrameAncestors)
            this.log("PASS", "CSP controls frame ancestors");
          else this.log("FAIL", "CSP missing frame-ancestors");
          if (hasWorkerSrc) this.log("PASS", "CSP controls workers");
          else this.log("FAIL", "CSP missing worker-src");

          // Check for blob: only in worker-src (not script-src)
          const hasBlobInScript =
            cspHeader.includes("script-src") &&
            cspHeader.split("script-src")[1]?.split(";")[0]?.includes("blob:");
          if (!hasBlobInScript)
            this.log("PASS", "blob: not in script-src (security)");
          else this.log("FAIL", "blob: found in script-src");
        } else {
          this.log("FAIL", "CSP header missing in production");
        }

        // Test other security headers
        const securityHeaders = [
          {
            name: "Strict-Transport-Security",
            present: !!headers["strict-transport-security"],
          },
          { name: "X-Frame-Options", present: !!headers["x-frame-options"] },
          {
            name: "X-Content-Type-Options",
            present: !!headers["x-content-type-options"],
          },
          { name: "Referrer-Policy", present: !!headers["referrer-policy"] },
          {
            name: "Permissions-Policy",
            present: !!headers["permissions-policy"],
          },
          {
            name: "Cross-Origin-Opener-Policy",
            present: !!headers["cross-origin-opener-policy"],
          },
          {
            name: "Cross-Origin-Embedder-Policy",
            present: !!headers["cross-origin-embedder-policy"],
          },
          {
            name: "Cross-Origin-Resource-Policy",
            present: !!headers["cross-origin-resource-policy"],
          },
        ];

        securityHeaders.forEach((header) => {
          if (header.present) {
            this.log("PASS", `${header.name} header configured`);
          } else {
            this.log("FAIL", `${header.name} header missing`);
          }
        });

        // Test X-Nonce header (should be present in production)
        if (headers["x-nonce"]) {
          this.log(
            "PASS",
            "X-Nonce header provided for client-side nonce access",
          );
        } else {
          this.log(
            "FAIL",
            "X-Nonce header missing (required for production CSP)",
          );
        }

        resolve();
      });

      req.on("error", (err) => {
        this.log("FAIL", "Request failed", { error: err.message });
        resolve();
      });

      req.setTimeout(10000, () => {
        this.log("FAIL", "Request timeout");
        resolve();
      });

      req.end();
    });
  }

  async testCSPReportEndpoint() {
    console.log("🔍 Testing CSP Report Endpoint...\n");

    return new Promise((resolve) => {
      // Test rate limiting
      const testReport = {
        "csp-report": {
          "violated-directive": "script-src",
          "blocked-uri": "http://evil.com/malicious.js",
          "document-uri": "http://localhost:3001/",
          "original-policy": "script-src 'self'",
        },
      };

      const options = {
        hostname: "localhost",
        port: 3001,
        path: "/api/csp-report",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "CSP-Test-Agent/1.0",
        },
      };

      const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
          this.log("PASS", "CSP report endpoint accepts reports");
        } else {
          this.log("FAIL", `CSP report endpoint returned ${res.statusCode}`);
        }
        resolve();
      });

      req.on("error", (err) => {
        this.log("FAIL", "CSP report endpoint error", { error: err.message });
        resolve();
      });

      req.write(JSON.stringify(testReport));
      req.end();
    });
  }

  async testInlineScriptsProtection() {
    console.log("🔍 Testing Inline Scripts Protection...\n");

    return new Promise((resolve) => {
      const options = {
        hostname: "localhost",
        port: 3001,
        path: "/",
        method: "GET",
      };

      const req = http.request(options, (res) => {
        let body = "";

        res.on("data", (chunk) => {
          body += chunk;
        });

        res.on("end", () => {
          // Check for inline scripts without nonces
          const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/gi;
          const scripts = [];
          let match;

          while ((match = scriptRegex.exec(body)) !== null) {
            const scriptTag = match[0];
            const hasNonce = scriptTag.includes("nonce=");
            scripts.push({ tag: scriptTag.substring(0, 100), hasNonce });
          }

          const scriptsWithoutNonce = scripts.filter((s) => !s.hasNonce);

          if (scriptsWithoutNonce.length === 0) {
            this.log("PASS", "All inline scripts have CSP nonces");
          } else {
            this.log(
              "FAIL",
              `${scriptsWithoutNonce.length} inline scripts missing nonces`,
              {
                scripts: scriptsWithoutNonce.map((s) => s.tag),
              },
            );
          }

          // Check for dangerouslySetInnerHTML (should use nonces)
          const dangerMatches = body.match(/dangerouslySetInnerHTML/g);
          if (!dangerMatches || dangerMatches.length === 0) {
            this.log("PASS", "No dangerouslySetInnerHTML found");
          } else {
            this.log(
              "WARN",
              `${dangerMatches.length} dangerouslySetInnerHTML found`,
              {
                note: "Ensure they use nonces for CSP compliance",
              },
            );
          }

          resolve();
        });
      });

      req.on("error", (err) => {
        this.log("FAIL", "Inline scripts test failed", { error: err.message });
        resolve();
      });

      req.setTimeout(10000, () => {
        this.log("FAIL", "Inline scripts test timeout");
        resolve();
      });

      req.end();
    });
  }

  async runAllTests() {
    try {
      await this.startProductionServer();
      await this.testHeaders();
      await this.testCSPReportEndpoint();
      await this.testInlineScriptsProtection();
    } finally {
      await this.stopServer();
    }

    // Generate summary
    console.log("\n📊 CSP CONTRACT TEST RESULTS\n" + "=".repeat(40));
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`⚠️  Warnings: ${this.testResults.warnings}`);

    const overallStatus = this.testResults.failed === 0 ? "SUCCESS" : "FAILURE";
    console.log(`\n🎯 OVERALL STATUS: ${overallStatus}`);

    if (this.testResults.failed > 0) {
      console.log("\n🚨 CRITICAL ISSUES FOUND:");
      this.testResults.tests
        .filter((t) => t.level === "FAIL")
        .forEach((test) => {
          console.log(`   • ${test.message}`);
        });
      process.exit(1);
    } else {
      console.log("\n✅ All CSP contract tests passed!");
      console.log("   Production deployment is safe from CSP perspective.");
    }

    return this.testResults;
  }
}

// Run the tests
const tester = new CSPContractTester();
tester.runAllTests().catch((error) => {
  console.error("💥 Test execution failed:", error);
  process.exit(1);
});
