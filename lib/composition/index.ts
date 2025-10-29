// Composition System - Main Exports
// Orchestration layer for page and section composition

import { ComposerGuard } from "./composer-validation";

// Initialize validators once (idempotent)
try {
  ComposerGuard.initializeValidators();
} catch {}

export * from "./page-composer";
export * from "./section-registry";
export * from "./ports";

// Future exports:
// export * from './content-loader'
