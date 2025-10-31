/**
 * Dynamic Imports for Performance Optimization
 * Lazy load heavy libraries and components on demand
 */

// Dynamic import for analytics libraries
export const loadAnalytics = () =>
  import('@/lib/analytics/advanced-analytics').then(m => m.advancedAnalytics);

// Dynamic import for performance monitoring
export const loadPerformanceMonitor = () =>
  import('@/lib/performance/optimized-lazy-loading').then(m => m.usePerformanceMonitor);

// Dynamic import for experiment engine
export const loadExperimentEngine = () =>
  import('@/lib/theme/experimentation-engine').then(m => ({
    ExperimentationEngine: m.ExperimentationEngine,
    useExperimentationEngine: m.useExperimentationEngine,
  }));

// Dynamic import for personalization engine
export const loadPersonalizationEngine = () =>
  import('@/lib/theme/personalization-engine').then(m => ({
    PersonalizationEngine: m.PersonalizationEngine,
    usePersonalizationEngine: m.usePersonalizationEngine,
  }));

// Dynamic import for admin components
export const loadAdminComponents = () =>
  import('@/components/admin/lazy-admin-components').then(m => m.LazyAdminComponents);

// Dynamic import for demo components
export const loadDemoComponents = () =>
  import('@/components/demo/lazy-demo-components').then(m => m.LazyDemoComponents);

// Dynamic import for onboarding components
export const loadOnboardingComponents = () =>
  import('@/components/onboarding/lazy-onboarding-components').then(m => m.LazyOnboardingComponents);

// Dynamic import for heavy chart libraries (if used)
export const loadCharts = () =>
  import('recharts').then(m => m);

// Dynamic import for complex forms
export const loadAdvancedForms = () =>
  import('@/components/ui/advanced-form').then(m => m.AdvancedForm);

// Utility function to preload critical dynamic imports
export function preloadCriticalDynamicImports() {
  // Preload high-priority dynamic imports
  loadAnalytics();
  loadPerformanceMonitor();
}

// Hook to manage dynamic imports with loading states
export function useDynamicImport<T>(
  importFn: () => Promise<T>,
  options: {
    onLoad?: (module: T) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const [module, setModule] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const load = React.useCallback(async () => {
    if (module || loading) return;

    setLoading(true);
    setError(null);

    try {
      const importedModule = await importFn();
      setModule(importedModule);
      options.onLoad?.(importedModule);
    } catch (err) {
      const error = err as Error;
      setError(error);
      options.onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [importFn, module, loading, options]);

  return { module, loading, error, load };
}

// Import React for the hook
import React from 'react';
