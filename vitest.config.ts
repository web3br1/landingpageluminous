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

    // Limitar escopo apenas ao projeto atual
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    exclude: ["**/node_modules/**", "**/Downloads/**"],

    // Globais para reduzir imports
    globals: true,

    // Configuração SSR-safe
    server: {
      deps: {
        inline: [/node_modules/],
      },
    },

    // Estrutura organizada de testes
    include: [
      "tests/unit/**/*.test.{ts,tsx}",
      "tests/integration/**/*.test.{ts,tsx}",
      "tests/utils/**/*.test.{ts,tsx}",
      "tests/components/**/*.test.{ts,tsx}",
    ],


    // Timeout otimizado para testes mais rápidos
    testTimeout: 15000, // Reduzido de 30s para 15s

    // Timeouts específicos otimizados
    hookTimeout: 10000, // Reduzido para hooks mais rápidos
    slowTestThreshold: 5000, // Threshold menor para identificar testes lentos
    bail: 5, // Para após 5 falhas para CI mais rápido

    // Testes específicos podem sobrescrever o timeout global
    // Performance e acessibilidade têm timeouts maiores por padrão

    // Exclusões para isolamento por tipo de teste
    exclude: [
      // E2E tests (Playwright)
      "**/*.e2e.{ts,tsx}",
      "**/e2e/**",
      "**/*.spec.ts",  // Playwright usa .spec.ts
      "**/*.spec.tsx", // Playwright usa .spec.tsx

      // Arquivos de configuração e build
      "**/*.config.*",
      "**/*.d.ts",
      "coverage/**",
      "dist/**",
      ".next/**",
      "node_modules/**",
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
