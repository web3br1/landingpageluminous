/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import * as path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Ambiente de teste para componentes React
    environment: "jsdom",
    environmentOptions: {
      url: "http://localhost:3000",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },

    // Padrões específicos para testes de componentes
    include: ["tests/components/**/*.{test,spec}.{ts,tsx}"],

    // Setup com mocks para componentes
    setupFiles: ["./vitest.setup.ts"],

    // Globais para reduzir imports
    globals: true,

    // Timeouts para renderização e interações
    testTimeout: 10000,
    hookTimeout: 5000,

    // Paralelização moderada para componentes
    // pool: 'threads', // Removido para compatibilidade

    // Mapeamento de módulos completo
    alias: {
      "@": path.resolve(__dirname),
      "@/*": path.resolve(__dirname, "./*"),
      "@shared/*": path.resolve(__dirname, "./shared/*"),
      "@/components/*": path.resolve(__dirname, "./components/*"),
      "@/ui/*": path.resolve(__dirname, "./components/ui/*"),
      "@/lib/*": path.resolve(__dirname, "./lib/*"),
      "@/styles/*": path.resolve(__dirname, "./styles/*"),
      "@/domains/*": path.resolve(__dirname, "./domains/*"),

      // Mocks específicos para componentes
      "@/lib/hooks/use-intersection-observer": path.resolve(
        __dirname,
        "tests/__mocks__/lib/hooks/use-intersection-observer.ts",
      ),
      "lib/analytics": path.resolve(__dirname, "tests/__mocks__/analytics.ts"),
      "./analytics": path.resolve(__dirname, "tests/__mocks__/analytics.ts"),
    },

    // Configuração de coverage para componentes
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
      include: ["components/**/*.tsx", "components/**/*.ts"],
      thresholds: {
        global: {
          statements: 60,
          branches: 50,
          functions: 55,
          lines: 60,
        },
      },
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      "@/*": path.resolve(__dirname, "./*"),
      "@shared/*": path.resolve(__dirname, "./shared/*"),
      "@/components/*": path.resolve(__dirname, "./components/*"),
      "@/ui/*": path.resolve(__dirname, "./components/ui/*"),
      "@/lib/*": path.resolve(__dirname, "./lib/*"),
      "@/styles/*": path.resolve(__dirname, "./styles/*"),
      "@/domains/*": path.resolve(__dirname, "./domains/*"),
    },
  },
});
