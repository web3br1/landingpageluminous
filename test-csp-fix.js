// Quick test to check if CSP errors are resolved
const http = require("http");

async function testCSPFix() {
  console.log("🧪 Testing CSP Fix...\n");

  return new Promise((resolve) => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: "/",
      method: "GET",
    };

    const req = http.request(options, (res) => {
      const csp = res.headers["content-security-policy"];

      console.log(`✅ Server Response: ${res.statusCode}`);
      console.log(`📋 CSP Length: ${csp ? csp.length : "N/A"} chars`);

      if (
        csp &&
        csp.includes("sha256-Fd8HDSo5DTW76vYB1UEBweel/r6nR85XAFcSX3hRHyU=")
      ) {
        console.log("✅ Missing hash added to CSP");
        console.log("✅ CSP should now allow the previously blocked script\n");
        console.log("🎉 CSP VIOLATION SHOULD BE RESOLVED!");
        console.log(
          "   Check your browser console - the CSP error should be gone.\n",
        );
      } else {
        console.log("❌ Hash not found in CSP - issue may persist\n");
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

testCSPFix().then(() => {
  console.log("📋 NEXT STEPS:");
  console.log("1. Open http://localhost:3000 in your browser");
  console.log("2. Check browser console for CSP errors");
  console.log("3. If errors persist, they may be from different scripts");
  console.log("4. Use /api/script-audit to monitor script usage");
  console.log("5. Use /api/csp-report to see violation reports\n");
});
