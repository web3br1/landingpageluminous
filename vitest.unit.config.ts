/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import * as path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Ambiente de teste otimizado para testes unitários
    environment: "node", // Mais rápido que jsdom para lógica pura

    // Padrões específicos para testes unitários (mais rápidos)
    include: ["tests/unit/**/*.{test,spec}.{ts,tsx}"],

    // Setup básico (sem mocks complexos)
    setupFiles: ["./vitest.setup.ts"],

    // Globais para reduzir imports
    globals: true,

    // Timeouts reduzidos para testes unitários
    testTimeout: 5000,
    hookTimeout: 2000,

    // Paralelização máxima para testes unitários
    // pool: 'threads', // Removido para compatibilidade

    // Mapeamento de módulos otimizado
    alias: {
      "@": path.resolve(__dirname),
      "@/*": path.resolve(__dirname, "./*"),
      "@shared/*": path.resolve(__dirname, "./shared/*"),
    },

    // Configuração de coverage específica
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
      include: ["lib/**/*.ts", "shared/**/*.ts", "domains/**/*.ts"],
      thresholds: {
        global: {
          statements: 80,
          branches: 70,
          functions: 75,
          lines: 80,
        },
      },
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      "@/*": path.resolve(__dirname, "./*"),
      "@shared/*": path.resolve(__dirname, "./shared/*"),
    },
  },
});
