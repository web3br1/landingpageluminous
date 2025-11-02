/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import * as path from "path";

// Configuração específica para testes de hidratação - CRÍTICO PARA SSR
export default defineConfig({
  plugins: [react()],
  test: {
    // Ambiente de teste para hidratação (DOM necessário)
    environment: "jsdom",
    environmentOptions: {
      url: "http://localhost:3000",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      pretendToBeVisual: true,
      resources: "usable",
      runScripts: "dangerously",
    },

    // Padrões específicos para testes de hidratação
    include: [
      "tests/hydration*.{test,spec}.{ts,tsx}",
      "tests/hydration/**/*.test.{ts,tsx}",
    ],

    // Excluir arquivos que usam sintaxe Playwright
    exclude: [
      "tests/hydration.test.ts", // Este usa test.describe do Playwright
    ],

    // Setup com mocks para hidratação
    setupFiles: ["./vitest.setup.ts"],

    // Globais para reduzir imports
    globals: true,

    // Timeouts específicos para hidratação (crítico)
    testTimeout: 20000, // 20s para hidratação complexa
    hookTimeout: 10000,

    // Hidratação é crítica - executar sequencial para confiabilidade
    // pool: 'threads', // Mantém sequencial para hidratação

    // Mapeamento de módulos completo
    alias: {
      "@": path.resolve(__dirname),
      "@/*": path.resolve(__dirname, "./*"),
      "@/components/*": path.resolve(__dirname, "./components/*"),
      "@/ui/*": path.resolve(__dirname, "./components/ui/*"),
      "@/lib/*": path.resolve(__dirname, "./lib/*"),
      "@/styles/*": path.resolve(__dirname, "./styles/*"),
      "@/domains/*": path.resolve(__dirname, "./domains/*"),

      // Mocks específicos para hidratação
      "@/lib/hooks/use-intersection-observer": path.resolve(
        __dirname,
        "tests/__mocks__/lib/hooks/use-intersection-observer.ts",
      ),
      "lib/analytics": path.resolve(__dirname, "tests/__mocks__/analytics.ts"),
      "./analytics": path.resolve(__dirname, "tests/__mocks__/analytics.ts"),
    },

    // Configuração de coverage para hidratação
    coverage: {
      provider: "istanbul",
      reporter: ["text", "lcov", "html"],
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
      include: [
        "lib/**/*.ts",
        "lib/**/*.tsx",
        "components/**/*.tsx",
        "app/**/*.tsx",
      ],
      thresholds: {
        global: {
          statements: 70,
          branches: 60,
          functions: 65,
          lines: 70,
        },
      },
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      "@/*": path.resolve(__dirname, "./*"),
      "@/components/*": path.resolve(__dirname, "./components/*"),
      "@/ui/*": path.resolve(__dirname, "./components/ui/*"),
      "@/lib/*": path.resolve(__dirname, "./lib/*"),
      "@/styles/*": path.resolve(__dirname, "./styles/*"),
      "@/domains/*": path.resolve(__dirname, "./domains/*"),
    },
  },
});
