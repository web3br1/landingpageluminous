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

      // Lote 5: INTEGRATION - Testes de integração
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

      // Fallback para arquivos não organizados
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
      // Excluir todos os testes E2E/Playwright (executados separadamente)
      "tests/**/e2e/**",
      "tests/**/*e2e*.spec.ts",
      "tests/**/visual-regression*.spec.ts",
      "tests/favicon.test.ts",
      "tests/landing-extra-e2e.spec.ts",
      "tests/landing-page-e2e.spec.ts",
      "tests/load-performance.spec.ts",
      "tests/webpack-errors.test.ts",
      "tests/performance/core-web-vitals.test.ts",
      "tests/performance/performance-monitoring.spec.ts",
      "tests/performance-example.spec.ts",

      // Excluir testes Playwright que usam sintaxe diferente (test.describe)
      "tests/hydration.test.ts",
      "tests/ssr.test.ts",
      "tests/a11y/accessibility-testing.spec.ts",
      "tests/a11y/landing-a11y.test.tsx",

      // Otimização: excluir testes muito lentos ou complexos durante desenvolvimento
      // Estes podem ser executados em CI ou quando necessário
      "tests/browser-compatibility/**", // Muito lentos para desenvolvimento
      "tests/memory-leaks/**", // Requerem setup especial
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
