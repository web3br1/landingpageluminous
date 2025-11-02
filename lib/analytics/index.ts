// Analytics module index - Re-exports for clean imports

export { analytics, consent, type ConsentState } from "../analytics-core";
export { PlausibleProvider } from "../analytics-provider.client";

// Types
export * from "./types";

// Advanced analytics
export * from "./advanced-analytics";
export * from "./experiment-analytics";

// Hooks
export {
  useAnalytics,
  useFormTracking,
  useCTATracking,
  usePerformanceTracking,
} from "./use-analytics";
