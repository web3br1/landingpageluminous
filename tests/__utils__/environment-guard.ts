// Environment Guard - Previne imports cruzados entre SSR e JSDOM
// Teste de sanidade que acusa uso incorreto de módulos

import { vi } from "vitest";

// ===== DETECTOR DE IMPORTS CRUZADOS =====

// Módulos que SÓ podem ser importados em server-side
const SERVER_ONLY_MODULES = [
  "@/lib/seo", // SEO utilities usam fs, path
  "@/lib/analytics-core", // Pode ter dependências server-side
  "@/lib/environment", // Configurações server-side
  "@/lib/security", // Utilitários de segurança server-side
  "@/lib/webhooks", // Webhooks são server-side
  "@/lib/email", // Email service server-side
  "@/lib/payments", // Stripe/PagSeguro server-side
  "@/lib/cache", // Redis/KV server-side
];

// Módulos que SÓ podem ser importados em client-side
const CLIENT_ONLY_MODULES = [
  "@/lib/hooks/use-intersection-observer", // IntersectionObserver client-only
  "@/lib/hooks/use-local-storage", // localStorage client-only
  "@/lib/hooks/use-on-click-outside", // DOM events client-only
  "@/lib/hooks/use-event-listener", // DOM events client-only
  "@/lib/animation", // Framer Motion client-only
  "@/lib/theme", // Theme provider client-only
  "@/lib/notifications", // Browser notifications client-only
];

// ===== DETECTOR DE SSR SAFETY =====
export function detectUnsafeImports() {
  const violations: string[] = [];

  // Mock require para detectar tentativas de import
  const originalRequire = global.require;
  global.require = vi.fn((moduleId: string) => {
    // Detecta imports server-only em ambiente JSDOM
    if (typeof window !== "undefined") {
      const serverOnlyImport = SERVER_ONLY_MODULES.find((mod) =>
        moduleId.includes(mod.replace("@/", "")),
      );
      if (serverOnlyImport) {
        violations.push(
          `SERVER-ONLY module "${serverOnlyImport}" imported in JSDOM environment: ${moduleId}`,
        );
      }
    }

    // Detecta imports client-only em ambiente SSR (não-JSDOM)
    if (typeof window === "undefined") {
      const clientOnlyImport = CLIENT_ONLY_MODULES.find((mod) =>
        moduleId.includes(mod.replace("@/", "")),
      );
      if (clientOnlyImport) {
        violations.push(
          `CLIENT-ONLY module "${clientOnlyImport}" imported in SSR environment: ${moduleId}`,
        );
      }
    }

    // Chama require original se existir
    try {
      return originalRequire?.(moduleId);
    } catch {
      // Ignore - estamos apenas detectando
      return {};
    }
  });

  return violations;
}

// ===== VALIDATOR DE AMBIENTE =====
export function validateEnvironmentIsolation() {
  const violations = detectUnsafeImports();

  if (violations.length > 0) {
    throw new Error(
      "ENVIRONMENT ISOLATION VIOLATION:\n" +
        violations.map((v) => `  ❌ ${v}`).join("\n") +
        "\n\nSoluções:\n" +
        "  - Mova imports server-only para componentes server\n" +
        "  - Use dynamic imports para client-only modules\n" +
        '  - Crie wrappers "use client" para client-only logic',
    );
  }

  return true;
}

// ===== HOOK PARA TESTES =====
export function withEnvironmentGuard(testFn: () => void | Promise<void>) {
  return async () => {
    // Setup guard
    const violations: string[] = [];
    const originalRequire = global.require;

    global.require = vi.fn((moduleId: string) => {
      // Lógica de detecção igual acima
      if (typeof window !== "undefined") {
        const serverOnlyImport = SERVER_ONLY_MODULES.find((mod) =>
          moduleId.includes(mod.replace("@/", "")),
        );
        if (serverOnlyImport) {
          violations.push(
            `SERVER-ONLY module "${serverOnlyImport}" imported in JSDOM environment: ${moduleId}`,
          );
        }
      }

      if (typeof window === "undefined") {
        const clientOnlyImport = CLIENT_ONLY_MODULES.find((mod) =>
          moduleId.includes(mod.replace("@/", "")),
        );
        if (clientOnlyImport) {
          violations.push(
            `CLIENT-ONLY module "${clientOnlyImport}" imported in SSR environment: ${moduleId}`,
          );
        }
      }

      try {
        return originalRequire?.(moduleId);
      } catch {
        return {};
      }
    });

    try {
      // Run test
      await testFn();

      // Check violations
      if (violations.length > 0) {
        throw new Error(
          "ENVIRONMENT ISOLATION VIOLATION in test:\n" +
            violations.map((v) => `  ❌ ${v}`).join("\n"),
        );
      }
    } finally {
      // Cleanup
      global.require = originalRequire;
    }
  };
}

// ===== EXPORTS =====
export { SERVER_ONLY_MODULES, CLIENT_ONLY_MODULES };
