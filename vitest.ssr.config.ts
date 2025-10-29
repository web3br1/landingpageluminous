/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import * as path from "path";

// Configuração específica para testes SSR - RODA SEQUENCIAL
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node", // SSR real
    include: ["tests/ssr/**/*.test.ts"], // só testes SSR
    setupFiles: ["tests/ssr/setup.ts"],

    // Globais para reduzir imports
    globals: true,

    // SSR é crítico - executar sequencial
    // pool: 'threads', // Removido para compatibilidade

    // Timeouts maiores para SSR
    testTimeout: 15000,
    hookTimeout: 8000,
    slowTestThreshold: 5000,
  },
  resolve: {
    conditions: ["node"],
    alias: {
      "@": path.resolve(__dirname),
      "@/shared": path.resolve(__dirname, "shared"),
      "@/lib": path.resolve(__dirname, "lib"),
      "@/components": path.resolve(__dirname, "components"),
      "@/app": path.resolve(__dirname, "app"),
      "@/styles": path.resolve(__dirname, "styles"),
      "@/public": path.resolve(__dirname, "public"),
      "@/domains": path.resolve(__dirname, "domains"),
    },
  },
});
