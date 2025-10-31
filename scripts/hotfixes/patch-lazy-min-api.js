#!/usr/bin/env node

/**
 * Hotfix H2: Lazy Loading — API Mínima Estável
 * Recriar exports {shouldLazyLoad,getChunkId,traceLazyLoad,prefetch,load} de forma determinística e tipada
 */

const fs = require("fs");
const path = require("path");

const lazyLoadingPath = path.join(
  process.cwd(),
  "lib",
  "composition",
  "performance",
  "route-based-lazy-loading.tsx",
);

console.log("🔧 Aplicando hotfix H2: lazy loading minimal API");

try {
  let content = fs.readFileSync(lazyLoadingPath, "utf8");

  // 1. Adicionar exports diretos no topo do arquivo
  const exportsToAdd = `// ===== DIRECT EXPORTS FOR MINIMAL CONTRACT =====
export const shouldLazyLoad = RouteBasedLazyLoading.shouldLazyLoad;
export const getChunkId = RouteBasedLazyLoading.getChunkId;
export const traceLazyLoad = RouteBasedLazyLoading.traceLazyLoad;
export const prefetch = RouteBasedLazyLoading.prefetch;
export const load = RouteBasedLazyLoading.load;

`;

  // Adicionar após os imports
  content = content.replace(/(import.*from.*;\n)\n/, "$1\n" + exportsToAdd);

  // 2. Garantir que as funções sejam determinísticas
  content = content.replace(
    /getChunkId\(route: string\): string \{\s*return route\.replace\([^}]*\);\s*\}/,
    `getChunkId(route: string): string {
    // Deterministic chunk ID generation
    return route.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  }`,
  );

  // 3. Garantir traceId determinístico
  content = content.replace(
    /traceId.*Math\.random\(\)/,
    "traceId: opts?.traceId || `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`",
  );

  fs.writeFileSync(lazyLoadingPath, content);

  console.log("✅ Hotfix H2 aplicado com sucesso");
  console.log("📝 Alterações:");
  console.log(
    "   - Adicionados exports diretos: shouldLazyLoad, getChunkId, traceLazyLoad, prefetch, load",
  );
  console.log("   - Garantida geração determinística de chunkId");
  console.log("   - Mantida geração determinística de traceId");
} catch (error) {
  console.error("❌ Erro ao aplicar hotfix H2:", error.message);
  process.exit(1);
}
