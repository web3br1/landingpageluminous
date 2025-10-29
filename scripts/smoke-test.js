#!/usr/bin/env node

/**
 * Smoke Tests para CI/CD
 * Verifica se a aplicação está funcionando corretamente após deploy
 */

const { spawn } = require("child_process");
const http = require("http");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

console.log("🚀 Iniciando smoke tests...");
console.log(`📍 Base URL: ${BASE_URL}`);

async function runSmokeTests() {
  const tests = [
    {
      name: "Homepage loads",
      url: "/",
      check: (res) => res.statusCode === 200,
    },
    {
      name: "Hero section present",
      url: "/",
      check: (res, body) => body.includes("hero") || body.includes("Hero"),
    },
    {
      name: "Features page loads",
      url: "/features",
      check: (res) => res.statusCode === 200,
    },
    {
      name: "Pricing page loads",
      url: "/pricing",
      check: (res) => res.statusCode === 200,
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`🔍 Testing: ${test.name}`);

      const response = await makeRequest(test.url);
      const isValid = test.check(response.res, response.body);

      if (isValid) {
        console.log(`✅ PASS: ${test.name}`);
        passed++;
      } else {
        console.log(`❌ FAIL: ${test.name}`);
        console.log(`   Status: ${response.res.statusCode}`);
        console.log(`   Body length: ${response.body.length}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ERROR: ${test.name} - ${error.message}`);
      failed++;
    }
  }

  console.log("\n📊 Resultado dos smoke tests:");
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${passed + failed}`);

  if (failed > 0) {
    console.log("\n💥 Smoke tests falharam! Verificar aplicação.");
    process.exit(1);
  } else {
    console.log("\n🎉 Todos os smoke tests passaram!");
    process.exit(0);
  }
}

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: "GET",
      headers: {
        "User-Agent": "SmokeTest/1.0",
      },
    };

    const req = http.request(options, (res) => {
      let body = "";

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        resolve({ res, body });
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.end();
  });
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  runSmokeTests().catch((error) => {
    console.error("❌ Erro fatal nos smoke tests:", error);
    process.exit(1);
  });
}

module.exports = { runSmokeTests };
