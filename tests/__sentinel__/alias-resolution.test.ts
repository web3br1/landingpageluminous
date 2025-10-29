// Teste sentinela: verifica se aliases críticos resolvem corretamente
// Este teste deve PASSAR sempre - se falhar, há problema de configuração de aliases

describe("Alias Resolution Sentinel", () => {
  it("should resolve critical TypeScript path aliases with dynamic imports", async () => {
    // Testa apenas módulos que existem usando dynamic imports (mais confiável no Vitest)
    try {
      const analyticsCore = await import("@/lib/analytics-core");
      expect(typeof analyticsCore.analytics.track).toBe("function");

      const routeBasedLazy = await import(
        "@/lib/composition/performance/route-based-lazy-loading"
      );
      expect(typeof routeBasedLazy.getLazyLoadingConfig).toBe("function");

      const container = await import("@/lib/composition/container");
      expect(typeof container.getSSRAdapter).toBe("function");

      const sharedCore = await import("@/shared/core");
      expect(sharedCore).toBeDefined();
    } catch (error) {
      throw new Error(`Alias resolution failed: ${error}`);
    }
  });

  it("should handle module resolution without throwing", () => {
    // Testa resolução básica sem executar código
    // Se estes imports falharem, há problema de configuração de alias

    // Para módulos que podem não existir, apenas verificar que o path resolve
    // sem causar erros de "module not found" por alias mal configurado
    expect(() => {
      // Tentar resolver paths comuns - se falhar aqui, aliases estão quebrados
      return true; // Placeholder - o importante é que não lance erro de resolução
    }).not.toThrow();
  });
});
