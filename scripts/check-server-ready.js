#!/usr/bin/env node

/**
 * Verifica se o servidor Next.js está pronto para testes
 * Estratégia: ping no endpoint de saúde antes de iniciar testes
 */

const http = require("http");

const SERVER_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3001";
const MAX_ATTEMPTS = 30;
const DELAY_MS = 1000;

function checkServer(url) {
  return new Promise((resolve) => {
    const req = http.get(url, { timeout: 5000 }, (res) => {
      if (res.statusCode === 200) {
        resolve(true);
      } else {
        resolve(false);
      }
      req.destroy();
    });

    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForServer(
  url,
  maxAttempts = MAX_ATTEMPTS,
  delay = DELAY_MS,
) {
  console.log(`🔍 Verificando se servidor está pronto: ${url}`);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const isReady = await checkServer(url);

    if (isReady) {
      console.log(`✅ Servidor pronto após ${attempt} tentativas`);
      return true;
    }

    if (attempt < maxAttempts) {
      console.log(
        `⏳ Servidor não pronto (tentativa ${attempt}/${maxAttempts}), aguardando ${delay}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  console.log(`❌ Servidor não ficou pronto após ${maxAttempts} tentativas`);
  return false;
}

// Executa verificação se chamado diretamente
if (require.main === module) {
  const url = process.argv[2] || SERVER_URL;
  waitForServer(url).then((success) => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { checkServer, waitForServer };
