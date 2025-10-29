import { defineConfig, devices } from "@playwright/test";

// ===== CONFIGURAÇÃO DE LOTES DE TESTES =====
// Estratégia de execução em lotes para melhor organização e eficiência

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: ["**/*.spec.ts", "**/*.test.ts"],

  // Configurações globais simplificadas para smoke tests
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"]],
  timeout: 30_000,

  // Configurações básicas para smoke tests
  use: {
    baseURL: "http://localhost:3000",
    trace: "retain-on-failure",
  },

  // Servidor web básico
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },

  // Projeto único simplificado para smoke tests
  projects: [
    {
      name: "smoke-tests",
      testMatch: ["**/*.spec.ts", "**/*.test.ts"],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
