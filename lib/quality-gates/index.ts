/**
 * Quality Gates Framework
 * Main exports for quality gate system
 */

export { QualityGateRunner } from "./runner";
export type {
  PRData,
  GateResult,
  QualityReport,
  QualityScore,
  QualityGate,
  GateConfig,
} from "./types";

// Export individual gates for custom configurations
export { staticAnalysisGate } from "./gates/static-analysis-gate";
export { bundleBudgetGate } from "./gates/bundle-budget-gate";
export { coverageGate } from "./gates/coverage-gate";
export { performanceGate } from "./gates/performance-gate";
export { accessibilityGate } from "./gates/accessibility-gate";
export { securityGate } from "./gates/security-gate";

// Utility functions will be added later
