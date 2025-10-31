// Lazy Loading Wrapper HOC
// Provides a consistent interface for lazy loading components throughout the app

"use client";

import React, { ComponentType, Suspense, lazy } from "react";
import { getLazyLoadConfig } from "./lazy-loading-config";

interface LazyWrapperOptions {
  fallback?: React.ComponentType;
  ssr?: boolean;
  chunkName?: string;
}

// Default loading fallback
const DefaultFallback = ({ componentName }: { componentName?: string }) => (
  <div className="animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded h-10 flex items-center justify-center">
    <span className="text-sm text-neutral-500">
      {componentName ? `Carregando ${componentName}...` : "Carregando..."}
    </span>
  </div>
);

// HOC for lazy loading components
export function withLazyLoading<P extends object>(
  importFunc: () => Promise<{ default: ComponentType<P> }>,
  componentName?: string,
  options: LazyWrapperOptions = {},
) {
  const config = componentName ? getLazyLoadConfig(componentName) : null;

  const LazyComponent = lazy(importFunc);

  const finalOptions = {
    ssr: config?.ssr ?? options.ssr ?? true,
    ...options,
  };

  const Fallback =
    options.fallback ||
    config?.fallback ||
    (() => <DefaultFallback componentName={componentName} />);

  return React.forwardRef<unknown, P>((props, ref) => (
    <Suspense fallback={<Fallback />}>
      <LazyComponent {...props} ref={ref} />
    </Suspense>
  ));
}

// Dynamic lazy loader with configuration lookup
export function createLazyComponent<P extends object>(
  componentName: string,
  importFunc: () => Promise<{ default: ComponentType<P> }>,
) {
  const config = getLazyLoadConfig(componentName);

  if (!config) {
    // If no config found, still lazy load but with defaults
    return withLazyLoading(importFunc, componentName, { ssr: false });
  }

  const LazyComponent = lazy(() =>
    importFunc().then((module) => ({
      default: module.default,
    })),
  );

  const Fallback =
    config.fallback ||
    (() => <DefaultFallback componentName={componentName} />);

  return React.forwardRef<unknown, P>((props, ref) => (
    <Suspense fallback={<Fallback />}>
      <LazyComponent {...props} ref={ref} />
    </Suspense>
  ));
}

// Factory function for creating lazy components with proper typing
export function createLazyComponentWithType<P = unknown>(
  componentName: string,
  importFunc: () => Promise<{ default: React.ComponentType<P> }>,
) {
  return createLazyComponent(componentName, importFunc as unknown);
}

// Utility hook for conditional lazy loading
export function useLazyComponent<P extends object>(
  componentName: string,
  importFunc: () => Promise<{ default: ComponentType<P> }>,
) {
  const [Component, setComponent] = React.useState<ComponentType<P> | null>(
    null,
  );
  const [loading, setLoading] = React.useState(false);

  const loadComponent = React.useCallback(async () => {
    if (Component || loading) return;

    setLoading(true);
    try {
      const module = await importFunc();
      setComponent(() => module.default);
    } catch (error) {
      console.error(`Failed to load component ${componentName}:`, error);
    } finally {
      setLoading(false);
    }
  }, [componentName, importFunc, Component, loading]);

  return {
    Component,
    loading,
    loadComponent,
    isLoaded: !!Component,
  };
}
