/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import * as path from "path";

export default defineConfig({
  plugins: [react()],
  // Cache usando Vite cacheDir (substitui cache.dir deprecated)
  cacheDir: ".vite",
  test: {
    // Ambiente de teste otimizado para Next.js
    environment: "jsdom",
    environmentOptions: {
      // Simular ambiente Next.js
      url: "http://localhost:3000",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      // Configuração adicional para axe-core
      resources: "usable",
      runScripts: "dangerously",
    },

    // Setup files
    setupFiles: ["./vitest.setup.ts"],

    // Globais para reduzir imports
    globals: true,

    // Configuração SSR-safe
    server: {
      deps: {
        inline: [/node_modules/],
      },
    },

    // ===== LOTES DE TESTES VITEST ORGANIZADOS =====
    // Estratégia: dividir por tipo e prioridade para execução otimizada
    include: [
      // Lote 1: UNIT - Testes unitários básicos (mais rápidos)
      "tests/unit/**/*.{test,spec}.{ts,tsx}",

      // Lote 2: COMPONENTS - Testes de componentes React
      "tests/components/**/*.{test,spec}.{ts,tsx}",

      // Lote 3: LIB - Testes de utilitários e bibliotecas
      "tests/lib/**/*.{test,spec}.{ts,tsx}",

      // Lote 4: DOM - Testes de manipulação DOM
      "tests/dom/**/*.{test,spec}.{ts,tsx}",

      // Lote 5: INTEGRATION - Testes de integração (Vitest only)
      "tests/integration/**/*.{test,spec}.{ts,tsx}",

      // Lote 6: UTILS - Testes de utilitários avançados
      "tests/utils/**/*.{test,spec}.{ts,tsx}",

      // Lote 7: BROWSER - Testes específicos de browser
      "tests/browser-compatibility/**/*.{test,spec}.{ts,tsx}",

      // Lote 8: SSR - Testes server-side (mais lentos)
      "tests/ssr/**/*.{test,spec}.{ts,tsx}",

      // Lote 9: A11Y - Testes de acessibilidade (mais lentos)
      "tests/a11y/**/*.{test,spec}.{ts,tsx}",

      // Lote 10: HYDRATION - Testes de hidratação (críticos)
      "tests/hydration*.{test,spec}.{ts,tsx}",

      // Arquivos específicos Vitest
      "tests/theme-system.test.ts",
      "tests/animation-system.test.ts",
      "tests/css-integration.test.tsx",
      "tests/utils-advanced.test.ts",
      "tests/ui-components.test.tsx",

      // Fallback para arquivos não organizados (excluindo Playwright)
      "tests/**/*.{test,spec}.{ts,tsx}",
      "tests/**/*.test.{ts,tsx}",
      "tests/**/*.spec.{ts,tsx}",
    ],

    // Timeout otimizado para testes mais rápidos
    testTimeout: 15000, // Reduzido de 30s para 15s

    // Timeouts específicos otimizados
    hookTimeout: 10000, // Reduzido para hooks mais rápidos
    slowTestThreshold: 5000, // Threshold menor para identificar testes lentos
    bail: 5, // Para após 5 falhas para CI mais rápido

    // Testes específicos podem sobrescrever o timeout global
    // Performance e acessibilidade têm timeouts maiores por padrão

    // ===== ESTRATÉGIA DE EXCLUSÃO POR LOTE =====
    // Exclusões específicas para evitar conflitos entre frameworks e otimizar performance
    exclude: [
      // ===== PLAYWRIGHT/E2E TESTS - ISOLAMENTO COMPLETO =====
      "**/*.e2e.{ts,tsx}",
      "**/*e2e*.{ts,tsx}",
      "**/e2e/**",
      "**/*.spec.ts",  // Playwright usa .spec.ts
      "**/*.spec.tsx", // Playwright usa .spec.tsx
      "**/load-performance.spec.ts",
      "**/performance-errors.spec.ts",
      "**/seo-playwright.spec.ts",
      "**/visual-regression-enhanced.spec.ts",
      "**/visual-regression.spec.ts",
      "**/webpack-errors.spec.ts",
      "**/visual-regression-simple.spec.ts",
      "**/visual-regression-example.spec.ts",
      "**/performance-example.spec.ts",
      "**/e2e-example.spec.ts",
      "**/smoke.spec.ts",
      "**/smoke-resilience.spec.ts",
      "**/smoke-journey.test.ts",
      "**/resilience-journey.spec.ts",
      "**/happy-path-journey.spec.ts",
      "**/perf.budget.spec.ts",
      "**/critical-paths.spec.ts",
      "**/complete-user-journey-advanced.spec.ts",
      "**/ab-testing-functional.spec.ts",
      "**/unknown-tenant.spec.ts",
      "**/tenant-routing.spec.ts",
      "**/rewrite-query-tenant.spec.ts",
      "**/conflicting-headers.spec.ts",
      "tests/complete-user-journey-e2e.test.ts",
      "tests/critical-flows-e2e.test.ts",
      "tests/landing-page-e2e.test.ts",
      "tests/landing-page-e2e.spec.ts",
      "tests/landing-extra-e2e.test.ts",
      "tests/landing-extra-e2e.spec.ts",
      "tests/load-performance.spec.ts",
      "tests/performance-errors.spec.ts",
      "tests/seo-playwright.spec.ts",
      "tests/visual-regression-enhanced.spec.ts",
      "tests/visual-regression.spec.ts",
      "tests/webpack-errors.spec.ts",
      "tests/performance/performance-monitoring.spec.ts",
      "tests/accessibility-e2e.spec.ts",
      "tests/smoke-e2e.spec.ts",
      "tests/complete-user-journey-e2e.spec.ts",
      "tests/critical-flows-e2e.spec.ts",

      // ===== PERFORMANCE & MONITORING TESTS =====
      "tests/performance/**/*.test.{ts,tsx}",
      "tests/performance/**/*.spec.{ts,tsx}",
      "tests/performance-example.spec.ts",
      "tests/favicon.test.ts",

      // ===== LEGACY/CONFLICTING TESTS =====
      "tests/hydration.test.ts",
      "tests/ssr.test.ts",
      "tests/a11y/accessibility-testing.spec.ts",
      "tests/a11y/landing-a11y.test.tsx",

      // ===== COMPLEX/SLOW TESTS (executar apenas em CI) =====
      "tests/browser-compatibility/**", // Muito lentos para desenvolvimento
      "tests/memory-leaks/**", // Requerem setup especial
      "tests/lazy-loading-validation.test.tsx",
      "tests/integration/critical-flows.integration.test.tsx",
      "tests/integration/lazy-loading-deterministic-flows.test.tsx",

      // ===== MISSING DEPENDENCIES =====
      "tests/integration/crm-real-integration.test.ts", // testcontainers dependency
      "tests/__sentinel__/alias-verification.test.ts", // broken imports
      "tests/lib/whatsapp.integration.test.ts", // external dependencies

      // ===== CROSS-BROWSER TESTS =====
      "tests/cross-browser/**",
      "tests/cross-browser-compatibility.spec.ts",

      // ===== NETWORK TESTS =====
      "tests/network/**",
      "tests/network-conditions.spec.ts",
      "tests/network-failures/**",

      // ===== I18N TESTS =====
      "tests/i18n/**",
      "tests/internationalization.spec.ts",

      // ===== SECURITY TESTS =====
      "tests/security-testing/**",
      "tests/security-validation.test.tsx",
      "tests/security/**",

      // ===== PWA TESTS =====
      "tests/pwa/**",
      "tests/pwa-functionality.spec.ts",
      "tests/pwa-functionality.test.ts",

      // ===== MOBILE TESTS =====
      "tests/mobile-gestures/**",

      // ===== MEMORY LEAK TESTS =====
      "tests/memory-leaks/**",

      // ===== LOAD TESTING =====
      "tests/load-testing/**",
      "tests/load-basics.spec.ts",
    ],

    // Mapeamento de módulos - aliases para resolver imports @/
    alias: {
      // Aliases compatíveis com tsconfig.json
      "@": path.resolve(__dirname),
      "@/*": path.resolve(__dirname, "./*"),
      "@shared": path.resolve(__dirname, "./shared"),
      "@/components/*": path.resolve(__dirname, "./components/*"),
      "@/ui/*": path.resolve(__dirname, "./components/ui/*"),
      "@/onboarding/*": path.resolve(__dirname, "./components/onboarding/*"),
      "@/recommendations/*": path.resolve(
        __dirname,
        "./components/recommendations/*",
      ),
      "@/app/*": path.resolve(__dirname, "./app/*"),
      "@/lib/*": path.resolve(__dirname, "./lib/*"),
      "@/styles/*": path.resolve(__dirname, "./styles/*"),
      "@/public/*": path.resolve(__dirname, "./public/*"),
      "@/domains/*": path.resolve(__dirname, "./domains/*"),
      // Mocks específicos mantidos apenas quando necessários para testes
      "@/lib/hooks/use-intersection-observer": path.resolve(
        __dirname,
        "tests/__mocks__/lib/hooks/use-intersection-observer.ts",
      ),
      // Analytics mock (mantido por compatibilidade)
      "lib/analytics": path.resolve(__dirname, "tests/__mocks__/analytics.ts"),
      "./analytics": path.resolve(__dirname, "tests/__mocks__/analytics.ts"),
    },

    // Configuração de coverage - REABILITADA
    coverage: {
      provider: "istanbul", // Usando istanbul ao invés de v8 para melhor compatibilidade
      reporter: ["text", "lcov", "html", "json"],
      exclude: [
        "node_modules/**",
        "tests/**",
        "**/*.d.ts",
        "**/*.config.*",
        "coverage/**",
        "dist/**",
        "build/**",
        "tmp/**",
        ".next/**",
        "lib/testing/**",
      ],
      thresholds: {
        global: {
          statements: 80, // Meta do Sprint 2: 80%+
          branches: 70, // Meta do Sprint 2: 70%+
          functions: 75, // Meta do Sprint 2: 75%+
          lines: 80, // Meta do Sprint 2: 80%+
        },
      },
      include: [
        "app/**/*.tsx",
        "app/**/*.ts",
        "lib/**/*.ts",
        "lib/**/*.tsx",
        "domains/**/*.ts",
        "domains/**/*.tsx",
        "components/**/*.tsx",
        "components/**/*.ts",
      ],
    },

    // Configuração de performance otimizada
    pool: "threads", // Melhor isolamento para testes paralelos
    poolOptions: {
      threads: {
        singleThread: false, // Permitir threads múltiplos
        useAtomics: true, // Melhor performance em threads
      },
    },

    // Otimizações para SSR/hydration tests
    // Cache inteligente usando Vite cacheDir

    // Sequencial para testes críticos, paralelos para unitários
    sequence: {
      setupFiles: "list", // Executar setup files em ordem
    },
  },

  // Resolução de aliases compatível com tsconfig.json
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      "@/*": path.resolve(__dirname, "./*"),
      "@shared": path.resolve(__dirname, "./shared"),
      "@/components/*": path.resolve(__dirname, "./components/*"),
      "@/ui/*": path.resolve(__dirname, "./components/ui/*"),
      "@/onboarding/*": path.resolve(__dirname, "./components/onboarding/*"),
      "@/recommendations/*": path.resolve(
        __dirname,
        "./components/recommendations/*",
      ),
      "@/app/*": path.resolve(__dirname, "./app/*"),
      "@/lib/*": path.resolve(__dirname, "./lib/*"),
      "@/styles/*": path.resolve(__dirname, "./styles/*"),
      "@/public/*": path.resolve(__dirname, "./public/*"),
      "@/domains/*": path.resolve(__dirname, "./domains/*"),
    },
  },
});
