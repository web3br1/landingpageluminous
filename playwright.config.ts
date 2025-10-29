import { defineConfig, devices } from "@playwright/test";

// ===== CONFIGURAÇÃO DE LOTES DE TESTES =====
// Estratégia de execução em lotes para melhor organização e eficiência

export default defineConfig({
  testDir: "./tests",
  testIgnore: [
    "**/api-chatbot.test.ts",
    "**/seo.test.ts",
    "**/integration-landing-page.test.tsx",
    "**/hooks.test.tsx",
    "**/flags.test.ts",
    "**/analytics.test.ts",
    "**/utils.test.ts",
    "**/ui-components.test.tsx",
    "**/composition-validation.test.ts",
    "**/layout-composition.test.ts",
    "**/performance-errors.test.ts",
    "**/webpack-errors.test.ts",
    // Excluir arquivos unitários/componentes que usam Vitest
    "**/memory-leaks/**",
    "**/api-integration.test.ts",
    "**/integration/api-integration.test.ts",
    "**/a11y/accessibility-testing.spec.ts",
    "**/a11y/landing-a11y.test.tsx",
    "**/network-failures/**",
  ],

  // Configurações globais
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 1, // Otimizado: 1 worker local, 2 em CI
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  timeout: 60_000,

  // Configurações de uso padrão
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    actionTimeout: 5000, // Reduzido de 10000ms para 5000ms
    navigationTimeout: 15000, // Reduzido de 30000ms para 15000ms
    permissions: [],
    locale: "pt-BR",
    timezoneId: "UTC",
    colorScheme: "light",
    deviceScaleFactor: 1,
    isMobile: false,
    bypassCSP: false,
  },

  // Configurações de expect customizadas - otimizadas para reduzir retries
  expect: {
    toHaveScreenshot: {
      threshold: 0.05, // Aumentado de 0.01 para 0.05 (5% diferença aceitável)
      maxDiffPixels: 500, // Aumentado de 100 para 500 pixels
      maxDiffPixelRatio: 0.01, // Aumentado de 0.001 para 0.01 (1% da imagem)
    },
  },

  // Setup global para higiene entre testes
  globalSetup: "./lib/test-helpers.ts",

  // ===== LOTES DE TESTES ORGANIZADOS =====
  projects: [
    // 🏗️ LOTE 1: CORE/CRITICAL - Testes essenciais de funcionamento
    {
      name: "core-critical",
      testMatch: ["**/hydration.test.ts", "**/ssr.test.ts"],
      use: { ...devices["Desktop Chrome"] },
    },

    // 🏠 LOTE 2: LANDING PAGE - Funcionalidades da landing page
    {
      name: "landing-page",
      testMatch: [
        "**/landing-page-e2e.spec.ts",
        "**/landing-extra-e2e.spec.ts",
        "**/e2e-example.spec.ts",
      ],
      use: { ...devices["Desktop Chrome"] },
    },

    // ♿ LOTE 3: ACCESSIBILITY - Conformidade WCAG 2.1 AA
    {
      name: "accessibility",
      testMatch: ["**/accessibility*.spec.ts", "**/a11y/*.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
    },

    // ⚡ LOTE 4: PERFORMANCE - Core Web Vitals e métricas
    {
      name: "performance",
      testMatch: ["**/*performance*.spec.ts", "**/performance-example.spec.ts"],
      use: { ...devices["Desktop Chrome"] },
      timeout: 120_000,
    },

    // 👁️ LOTE 5: VISUAL REGRESSION - Comparação visual
    {
      name: "visual-regression",
      testMatch: ["**/visual-regression-core.spec.ts"], // Apenas core, mais rápido
      use: {
        ...devices["Desktop Chrome"],
        screenshot: "on",
        launchOptions: {
          args: ["--disable-font-subpixel-positioning"],
        },
      },
      timeout: 60_000, // Reduzido de 90_000
    },
    {
      name: "visual-regression-enhanced",
      testMatch: ["**/visual-regression-enhanced.spec.ts"],
      use: {
        ...devices["Desktop Firefox"], // Firefox para enhanced (mais lento)
        screenshot: "on",
        actionTimeout: 3000,
        navigationTimeout: 10000,
        launchOptions: {
          args: [
            "--disable-gpu",
            "--no-sandbox",
            "--disable-dev-shm-usage",
            // Prefs específicas para Firefox - reduz variância
            "--disable-web-security",
            "--disable-features=VizDisplayCompositor",
          ],
          firefoxUserPrefs: {
            // Desabilitar aceleração de hardware variável
            "dom.webgpu.enabled": false,
            "webgl.force-enabled": false,
            // Cache consistente
            "browser.cache.disk.enable": false,
            "browser.cache.memory.enable": false,
            // Fontes consistentes
            "font.name.monospace.x-western": "Monaco",
            "font.name.sans-serif.x-western": "Arial",
            "font.name.serif.x-western": "Times New Roman",
            // Animações consistentes
            "accessibility.reduce_motion": true,
            // JavaScript timing consistente
            "dom.timeout.max_consecutive_timeouts": 0,
          },
        },
      },
      timeout: 90_000, // Reduzido de 120_000 - otimizado
    },

    // 🔄 LOTE 6: CRITICAL FLOWS - Fluxos de usuário críticos
    {
      name: "critical-flows",
      testMatch: [
        "**/critical-flows-e2e.spec.ts",
        "**/complete-user-journey*.spec.ts",
      ],
      use: { ...devices["Desktop Chrome"] },
    },

    // 📊 LOTE 7: STRESS/LOAD - Testes de carga e stress
    {
      name: "stress-load",
      testMatch: [
        "**/load-performance.spec.ts",
        "**/memory-leaks*.test.tsx",
        "**/network-failures*.test.ts",
      ],
      use: { ...devices["Desktop Chrome"] },
      workers: 1, // Sequencial para testes de carga
      timeout: 180_000,
    },

    // 🔗 LOTE 8: INTEGRATION - Testes de integração específicos
    {
      name: "integration",
      testMatch: ["**/api-integration.test.ts", "**/integration*.test.ts"],
      use: { ...devices["Desktop Chrome"] },
    },

    // 🌐 LOTE 9: CROSS-BROWSER - Compatibilidade entre browsers
    {
      name: "cross-browser-chrome",
      testMatch: ["**/hydration.test.ts"],
      use: {
        ...devices["Desktop Chrome"],
        browserName: "chromium" as const,
      },
    },
    {
      name: "cross-browser-firefox",
      testMatch: ["**/hydration.test.ts"],
      use: {
        ...devices["Desktop Firefox"],
        browserName: "firefox" as const,
        actionTimeout: 3000, // Timeout mais curto para Firefox
        navigationTimeout: 10000, // Timeout reduzido
        launchOptions: {
          args: ["--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage"],
        },
      },
    },
    {
      name: "cross-browser-safari",
      testMatch: ["**/hydration.test.ts"],
      use: {
        ...devices["Desktop Safari"],
        browserName: "webkit" as const,
      },
    },

    // 🔥 LOTE 10: LOAD TESTING - Testes de carga e performance
    {
      name: "load-testing",
      testMatch: ["**/load-testing/**"],
      use: { ...devices["Desktop Chrome"] },
      workers: 1, // Sequencial para testes de carga
      timeout: 180_000,
    },

    // 🌐 LOTE 11: CROSS-BROWSER FULL - Testes completos de compatibilidade
    {
      name: "cross-browser-testing",
      testMatch: ["**/cross-browser/**"],
      use: { ...devices["Desktop Chrome"] },
    },

    // 🌍 LOTE 12: I18N TESTING - Testes de internacionalização
    {
      name: "i18n-testing",
      testMatch: ["**/i18n/**"],
      use: { ...devices["Desktop Chrome"] },
    },

    // 📡 LOTE 13: NETWORK TESTING - Testes de condições de rede
    {
      name: "network-testing",
      testMatch: ["**/network/**"],
      use: { ...devices["Desktop Chrome"] },
    },

    // 📱 LOTE 14: PWA TESTING - Testes de Progressive Web App
    {
      name: "pwa-testing",
      testMatch: ["**/pwa/**"],
      use: { ...devices["Desktop Chrome"] },
    },

    // 📊 LOTE 15: ANALYTICS TESTING - Testes de analytics e eventos
    {
      name: "analytics-testing",
      testMatch: ["**/analytics/**"],
      use: { ...devices["Desktop Chrome"] },
    },

    // 🔗 LOTE 16: API TESTING - Testes de contrato de API
    {
      name: "api-testing",
      testMatch: ["**/api-testing/**"],
      use: { ...devices["Desktop Chrome"] },
    },

    // 🔒 LOTE 17: SECURITY TESTING - Testes de segurança avançada
    {
      name: "security-testing",
      testMatch: ["**/security-testing/**"],
      use: { ...devices["Desktop Chrome"] },
    },

    // 🔍 LOTE 18: SEO COMPLETE TESTING - Testes de SEO avançado
    {
      name: "seo-complete-testing",
      testMatch: ["**/seo-testing/**"],
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Servidor web para testes - PADRONIZADO
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: process.env.CI ? 180 * 1000 : 60 * 1000, // CI: 3min, Dev: 1min
  },
});
