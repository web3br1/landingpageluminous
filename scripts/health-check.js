#!/usr/bin/env node

/**
 * Health Check Script for Luminaris SaaS
 * Validates system health, performance, and functionality
 */

import https from "https";
import http from "http";

console.log("🏥 Luminaris SaaS - Health Check\n");

// Configuration
const BASE_URL = process.env.HEALTH_CHECK_URL || "http://localhost:3000";
const TIMEOUT = 10000; // 10 seconds

// Health check results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  checks: [],
};

function logCheck(name, status, message, details = null) {
  const check = {
    name,
    status,
    message,
    details,
    timestamp: new Date().toISOString(),
  };
  results.checks.push(check);

  const icon = status === "pass" ? "✅" : status === "fail" ? "❌" : "⚠️";
  console.log(`${icon} ${name}: ${message}`);

  if (status === "pass") results.passed++;
  else if (status === "fail") results.failed++;
  else results.warnings++;
}

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https:") ? https : http;

    const req = protocol.get(
      url,
      {
        timeout: TIMEOUT,
        headers: {
          "User-Agent": "Luminaris-Health-Check/1.0",
        },
        ...options,
      },
      (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data.length > 500 ? data.substring(0, 500) + "..." : data,
          });
        });
      },
    );

    req.on("error", (error) => {
      reject(error);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
  });
}

// Performance measurement
async function measurePerformance(url) {
  const start = Date.now();

  try {
    const response = await makeRequest(url);
    const loadTime = Date.now() - start;

    return {
      loadTime,
      status: response.status,
      size: response.data.length,
      success: response.status === 200,
    };
  } catch (error) {
    return {
      loadTime: Date.now() - start,
      error: error.message,
      success: false,
    };
  }
}

// Core functionality checks
async function runChecks() {
  console.log("🔍 Running health checks...\n");

  // 1. Landing page accessibility
  try {
    const response = await makeRequest(`${BASE_URL}/`);
    if (response.status === 200) {
      logCheck(
        "Landing Page",
        "pass",
        `HTTP ${response.status}`,
        `Size: ${response.data.length} chars`,
      );

      // Check for critical content
      if (response.data.includes("Sistema de Automação Empresarial")) {
        logCheck("Landing Content", "pass", "Hero headline found");
      } else {
        logCheck("Landing Content", "fail", "Hero headline missing");
      }

      // Check bundle size (should be very small)
      const bundleMatch = response.data.match(
        /\/_next\/static\/chunks\/[^"]*\.js/g,
      );
      if (bundleMatch && bundleMatch.length > 0) {
        logCheck(
          "Bundle Loading",
          "pass",
          `${bundleMatch.length} JS bundles found`,
        );
      }
    } else {
      logCheck("Landing Page", "fail", `HTTP ${response.status}`);
    }
  } catch (error) {
    logCheck("Landing Page", "fail", `Connection failed: ${error.message}`);
  }

  // 2. Performance checks
  console.log("\n⚡ Performance Checks:");

  const perfResults = await measurePerformance(`${BASE_URL}/`);
  if (perfResults.success && perfResults.loadTime < 3000) {
    logCheck(
      "Page Load Time",
      "pass",
      `${perfResults.loadTime}ms`,
      `Status: ${perfResults.status}`,
    );
  } else if (perfResults.success && perfResults.loadTime < 5000) {
    logCheck(
      "Page Load Time",
      "warn",
      `${perfResults.loadTime}ms (slow)`,
      `Status: ${perfResults.status}`,
    );
  } else {
    logCheck(
      "Page Load Time",
      "fail",
      perfResults.error || `${perfResults.loadTime}ms (too slow)`,
    );
  }

  // 3. Route accessibility
  console.log("\n🛣️  Route Checks:");

  const routes = [
    { path: "/", name: "Landing Page" },
    { path: "/features", name: "Features Page" },
    { path: "/pricing", name: "Pricing Page" },
    { path: "/demo", name: "Demo Page" },
    { path: "/signup", name: "Signup Page" },
    { path: "/trial", name: "Trial Page" },
  ];

  for (const route of routes) {
    try {
      const response = await makeRequest(`${BASE_URL}${route.path}`);
      if (response.status === 200) {
        logCheck(
          `${route.name} (${route.path})`,
          "pass",
          `HTTP ${response.status}`,
        );
      } else {
        logCheck(
          `${route.name} (${route.path})`,
          "fail",
          `HTTP ${response.status}`,
        );
      }
    } catch (error) {
      logCheck(`${route.name} (${route.path})`, "fail", `Connection failed`);
    }
  }

  // 4. Admin routes (if accessible)
  console.log("\n🔧 Admin Checks:");

  const adminRoutes = [
    { path: "/admin/experiments", name: "Experiments Dashboard" },
    { path: "/admin/performance", name: "Performance Dashboard" },
    { path: "/admin/ml", name: "ML Dashboard" },
  ];

  for (const route of adminRoutes) {
    try {
      const response = await makeRequest(`${BASE_URL}${route.path}`);
      if (response.status === 200) {
        logCheck(`${route.name}`, "pass", `HTTP ${response.status}`);
      } else {
        logCheck(
          `${route.name}`,
          "warn",
          `HTTP ${response.status} (may require auth)`,
        );
      }
    } catch (error) {
      logCheck(
        `${route.name}`,
        "warn",
        "Not accessible (expected if protected)",
      );
    }
  }

  // 5. API endpoints
  console.log("\n🔌 API Checks:");

  const apiEndpoints = [
    { path: "/api/edge/personalize", name: "Edge Personalization API" },
  ];

  for (const endpoint of apiEndpoints) {
    try {
      const response = await makeRequest(`${BASE_URL}${endpoint.path}`);
      if (response.status === 200) {
        logCheck(`${endpoint.name}`, "pass", `HTTP ${response.status}`);
      } else {
        logCheck(`${endpoint.name}`, "warn", `HTTP ${response.status}`);
      }
    } catch (error) {
      logCheck(`${endpoint.name}`, "warn", "API not accessible or protected");
    }
  }

  // 6. Security headers
  console.log("\n🔒 Security Checks:");

  try {
    const response = await makeRequest(`${BASE_URL}/`);
    const headers = response.headers;

    const securityChecks = [
      {
        name: "X-Frame-Options",
        header: "x-frame-options",
        expected: "DENY",
        required: true,
      },
      {
        name: "X-Content-Type-Options",
        header: "x-content-type-options",
        expected: "nosniff",
        required: true,
      },
      {
        name: "Referrer-Policy",
        header: "referrer-policy",
        expected: (val) => val && val.includes("origin"),
        required: false,
      },
    ];

    securityChecks.forEach((check) => {
      const value = headers[check.header];
      if (value) {
        if (typeof check.expected === "function") {
          if (check.expected(value)) {
            logCheck(`Security: ${check.name}`, "pass", value);
          } else {
            logCheck(
              `Security: ${check.name}`,
              "warn",
              `Unexpected value: ${value}`,
            );
          }
        } else if (value === check.expected) {
          logCheck(`Security: ${check.name}`, "pass", value);
        } else {
          logCheck(
            `Security: ${check.name}`,
            check.required ? "fail" : "warn",
            `Expected ${check.expected}, got ${value}`,
          );
        }
      } else {
        logCheck(
          `Security: ${check.name}`,
          check.required ? "fail" : "warn",
          "Header missing",
        );
      }
    });
  } catch (error) {
    logCheck("Security Headers", "fail", "Could not check headers");
  }

  // 7. SEO checks
  console.log("\n🔍 SEO Checks:");

  try {
    const response = await makeRequest(`${BASE_URL}/`);
    const html = response.data;

    const seoChecks = [
      {
        name: "Title Tag",
        check: () =>
          html.includes("<title>") &&
          html.includes("Sistema de Automação Empresarial"),
        message: "Title contains brand name",
      },
      {
        name: "Meta Description",
        check: () =>
          html.includes('name="description"') && html.includes("automação"),
        message: "Meta description present",
      },
      {
        name: "Open Graph",
        check: () => html.includes('property="og:'),
        message: "Open Graph tags present",
      },
      {
        name: "JSON-LD",
        check: () => html.includes("application/ld+json"),
        message: "Structured data present",
      },
    ];

    seoChecks.forEach((seoCheck) => {
      if (seoCheck.check()) {
        logCheck(`SEO: ${seoCheck.name}`, "pass", seoCheck.message);
      } else {
        logCheck(`SEO: ${seoCheck.name}`, "fail", "Missing or incorrect");
      }
    });
  } catch (error) {
    logCheck("SEO Checks", "fail", "Could not analyze HTML");
  }
}

// Generate summary report
function generateSummary() {
  console.log("\n📊 Health Check Summary");
  console.log("=".repeat(50));

  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);
  console.log(`📋 Total Checks: ${results.checks.length}`);

  const successRate = ((results.passed / results.checks.length) * 100).toFixed(
    1,
  );
  console.log(`🎯 Success Rate: ${successRate}%`);

  // Overall status
  if (results.failed === 0 && results.warnings <= 2) {
    console.log("\n🎉 Overall Status: HEALTHY");
    console.log("Your Luminaris SaaS system is running optimally!");
  } else if (results.failed <= 2) {
    console.log("\n⚠️  Overall Status: MOSTLY HEALTHY");
    console.log("Minor issues detected. Check warnings above.");
  } else {
    console.log("\n❌ Overall Status: NEEDS ATTENTION");
    console.log("Critical issues detected. Please review failures above.");
  }

  // Recommendations
  console.log("\n💡 Recommendations:");
  if (results.failed > 0) {
    console.log("• Address failed checks immediately");
  }
  if (results.warnings > 0) {
    console.log("• Review warning items for potential improvements");
  }
  console.log("• Run this check regularly to monitor system health");
  console.log("• Check Vercel dashboard for additional metrics");

  return results;
}

// Main execution
async function main() {
  try {
    await runChecks();
    const summary = generateSummary();

    // Exit with appropriate code
    if (results.failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error("❌ Health check failed:", error.message);
    process.exit(1);
  }
}

main();
