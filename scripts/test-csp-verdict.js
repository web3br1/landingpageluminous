#!/usr/bin/env node

/**
 * CSP Verdict Test - Validates the fixes based on expert feedback
 * Tests the corrected CSP implementation
 */

import http from "http";

function testCSPVerdict() {
  console.log("🔬 CSP VERDICT TEST - Expert Corrections Applied\n");
  console.log("Testing corrections from expert feedback...\n");

  return new Promise((resolve) => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: "/",
      method: "HEAD",
    };

    const req = http.request(options, (res) => {
      console.log(`✅ Server Response: ${res.statusCode}`);

      // Check CSP header type
      const cspHeader = res.headers["content-security-policy"];
      const cspReportOnly = res.headers["content-security-policy-report-only"];
      const nonceHeader = res.headers["x-nonce"];

      console.log("\n🔍 CSP ANALYSIS:");
      console.log("=".repeat(50));

      // Check Report-Only vs Enforcement
      if (cspReportOnly && !cspHeader) {
        console.log("✅ DEVELOPMENT MODE: Content-Security-Policy-Report-Only");
        console.log("   → No blocking, only logging violations");
      } else if (cspHeader) {
        console.log("🔒 PRODUCTION MODE: Content-Security-Policy (Enforced)");
        console.log("   → Active blocking of violations");
      }

      // Check CSP content
      const csp = cspReportOnly || cspHeader;
      if (csp) {
        console.log(`\n📋 CSP Policy (${csp.length} chars):`);

        // Test key directives
        const hasUnsafeEval = csp.includes("unsafe-eval");
        const hasUnsafeInline = csp.includes("unsafe-inline");
        const hasBlobInWorker =
          csp.includes("worker-src") && csp.includes("blob:");
        const hasBlobInScript =
          csp.includes("script-src") && csp.includes("blob:");
        const hasDefaultNone = csp.includes("default-src 'none'");
        const hasReportUri = csp.includes("report-uri");
        const hasConnectSrc = csp.includes("connect-src");
        const hasWebSocket = csp.includes("ws://localhost:3000");

        console.log(
          `   unsafe-eval: ${hasUnsafeEval ? "✅" : "❌"} (should be ${cspReportOnly ? "✅" : "❌"})`,
        );
        console.log(
          `   unsafe-inline: ${hasUnsafeInline ? "✅" : "❌"} (should be ${cspReportOnly ? "✅" : "❌"})`,
        );
        console.log(
          `   blob: in worker-src: ${hasBlobInWorker ? "✅" : "❌"} (should be ✅)`,
        );
        console.log(
          `   blob: in script-src: ${hasBlobInScript ? "❌ BLOCKED" : "✅ OK"} (should be ❌)`,
        );
        console.log(
          `   default-src 'none': ${hasDefaultNone ? "✅" : "❌"} (should be ${cspReportOnly ? "✅" : "❌"})`,
        );
        console.log(
          `   report-uri: ${hasReportUri ? "✅" : "❌"} (should be ✅)`,
        );
        console.log(
          `   connect-src ws://: ${hasWebSocket ? "✅" : "❌"} (should be ${cspReportOnly ? "✅" : "❌"})`,
        );

        // Check for nonces
        if (nonceHeader) {
          console.log(
            `   Nonce present: ✅ (${nonceHeader.substring(0, 16)}...)`,
          );
          console.log("   → Dynamic scripts can use nonce for security");
        } else {
          console.log("   Nonce absent: ℹ️  (Report-Only mode or dev)");
        }

        console.log("\n🎯 EXPECTED BEHAVIORS:");
        console.log("=".repeat(30));

        if (cspReportOnly) {
          console.log(
            '✅ TypeError "push/call" should disappear (runtime not blocked)',
          );
          console.log(
            '✅ "Connection closed" should be resolved (WebSocket allowed)',
          );
          console.log("✅ HMR/React Fast Refresh should work normally");
          console.log("✅ CSP violations logged but not blocked");
          console.log("✅ Development experience preserved");
        } else {
          console.log("🔒 Scripts must have nonce or be in allowlist");
          console.log("🔒 External connections restricted");
          console.log("🔒 Maximum security for production");
        }

        console.log("\n📊 VERDICT:");
        console.log("=".repeat(10));

        const issues = [];
        if (hasBlobInScript)
          issues.push("blob: should be in worker-src, not script-src");
        if (cspReportOnly && !hasUnsafeEval)
          issues.push("Report-Only should allow unsafe-eval");
        if (cspReportOnly && !hasUnsafeInline)
          issues.push("Report-Only should allow unsafe-inline");
        if (!hasBlobInWorker)
          issues.push("blob: should be allowed in worker-src");

        if (issues.length === 0) {
          console.log(
            "🎉 SUCCESS: CSP configuration matches expert recommendations!",
          );
          console.log("   → Errors should be resolved");
        } else {
          console.log("⚠️  ISSUES FOUND:");
          issues.forEach((issue) => console.log(`   • ${issue}`));
        }
      }

      resolve();
    });

    req.on("error", (err) => {
      console.error("❌ Connection failed:", err.message);
      console.log("💡 Make sure Next.js dev server is running\n");
      resolve();
    });

    req.setTimeout(5000, () => {
      console.log("⏰ Request timeout - server may be starting up\n");
      resolve();
    });

    req.end();
  });
}

testCSPVerdict().then(() => {
  console.log("\n📋 NEXT STEPS:");
  console.log("1. Open http://localhost:3000 in your browser");
  console.log(
    "2. Check browser console - CSP violations should be gone or logged only",
  );
  console.log("3. Verify HMR works (hot reload without full refresh)");
  console.log("4. Test React Fast Refresh functionality");
  console.log(
    '5. Confirm no more "TypeError: Cannot read properties of undefined"',
  );
  console.log(
    '6. Confirm WebSocket connections work (no more "Connection closed")',
  );
  console.log(
    "\n🎯 If all issues are resolved, the CSP corrections are successful!",
  );
});
