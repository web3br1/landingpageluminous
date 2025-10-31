/**
 * TDD Quality System - Main Entry Point
 *
 * Coordena cache, classificadores, sinais e relatórios
 */

export { CacheManager } from "./cache/cache-manager";
export { ContentHashers } from "./cache/hashers";
export { StaticCoverageProxy } from "./signals/static-coverage-proxy";
export { TDDTrends } from "./signals/trends";
export { SafeTestsManager } from "./signals/safe-tests-manager";
export { HybridMetricsCalculator } from "./signals/hybrid-metrics";
export { StructuredReporter } from "./reporters/structured-reporter";

export type {
  CacheKey,
  CacheDomain,
  MaturityLevel,
  TDDResults,
  TestHealthReport,
  ContextualScores,
  StaticCoverageProxy as StaticCoverageProxyType,
  SafeTestInfo,
  SafeTestSubset,
  SafeTestResult,
} from "./types";
