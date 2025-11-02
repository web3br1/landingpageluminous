// ===== ADVANCED UTILITIES =====
// Utilitários técnicos avançados para design system
// Refatorado em módulos menores para reduzir complexidade

// Re-export from specialized modules
export * from "./brand-utils";
export * from "./hooks-utils";
export * from "./async-utils";
export * from "./performance-utils";
export * from "./storage-utils";
export * from "./formatting-utils";

// Legacy exports for backward compatibility
export { Brand, isChapterId, isHSLString, isAnimationId, isTokenName } from "./brand-utils";