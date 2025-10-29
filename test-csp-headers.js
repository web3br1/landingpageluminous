// Test CSP Headers
const http = require("http");

function testCSPHeaders() {
  console.log("🔍 Testing CSP Headers...\n");

  for (let i = 1; i <= 3; i++) {
    console.log(`Request ${i}:`);

    const options = {
      hostname: "localhost",
      port: 3000,
      path: "/",
      method: "HEAD",
    };

    const req = http.request(options, (res) => {
      const csp = res.headers["content-security-policy"];
      const nonce = res.headers["x-nonce"];

      console.log(`  Status: ${res.statusCode}`);
      console.log(`  CSP Length: ${csp ? csp.length : "N/A"} chars`);
      console.log(`  Nonce: ${nonce ? nonce.substring(0, 16) + "..." : "N/A"}`);

      if (csp) {
        // Extract script-src directive
        const scriptSrcMatch = csp.match(/script-src ([^;]+)/);
        if (scriptSrcMatch) {
          const scriptSrc = scriptSrcMatch[1];
          console.log(`  Script-Src: ${scriptSrc.substring(0, 80)}...`);

          // Check for nonces vs hashes
          const hasNonces = scriptSrc.includes("nonce-");
          const hashCount = (scriptSrc.match(/sha256-/g) || []).length;

          console.log(`  Has Nonces: ${hasNonces}`);
          console.log(`  Hash Count: ${hashCount}`);
        }
      }

      console.log("");
    });

    req.on("error", (err) => {
      console.error(`  Error: ${err.message}\n`);
    });

    req.end();
  }
}

testCSPHeaders();
