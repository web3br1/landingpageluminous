// Shared analytics types for type-safe unknown narrowing
// This file provides type guards and interfaces for analytics-related unknown types

export interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
  context?: Record<string, unknown>;
}

export interface PageComposition {
  component: string;
  props?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface TestSignalConfig {
  signals: Array<{
    type: string;
    pattern: string;
    options?: Record<string, unknown>;
  }>;
  timeout?: number;
  retries?: number;
}

// Type guard functions for runtime safety
export function isAnalyticsEvent(data: unknown): data is AnalyticsEvent {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).category === 'string' &&
    typeof (data as any).action === 'string'
  );
}

export function isPageComposition(data: unknown): data is PageComposition {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as any).component === 'string'
  );
}

export function isTestSignalConfig(data: unknown): data is TestSignalConfig {
  return (
    typeof data === 'object' &&
    data !== null &&
    Array.isArray((data as any).signals)
  );
}
