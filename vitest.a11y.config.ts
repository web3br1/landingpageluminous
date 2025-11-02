/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import * as path from "path";

// Configuração específica para testes de acessibilidade - RODA SERIAL
export default defineConfig({
  plugins: [react()],
  test: {
    // Ambiente de teste para acessibilidade
    environment: "jsdom",

    // Padrões de teste - apenas acessibilidade
    include: ["tests/a11y/**/*.test.{ts,tsx}"],
    exclude: [
      "tests/a11y/accessibility-testing.spec.ts",
      "tests/a11y/landing-a11y.test.tsx",
    ],

    // Setup específico para a11y
    setupFiles: ["./vitest.setup.ts"],

    // Globais para reduzir imports
    globals: true,

    // Timeouts maiores para testes de a11y (mas não 10s infinitos)
    testTimeout: 30000, // 30s máximo por teste
    hookTimeout: 15000,

    // Acessibilidade precisa ser sequencial para confiabilidade
    // pool: 'threads', // Removido para compatibilidade

    // Mapeamento de módulos - aliases para resolver imports @/
    alias: {
      // Aliases compatíveis com tsconfig.json
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

    // Configuração de coverage específica para a11y
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
