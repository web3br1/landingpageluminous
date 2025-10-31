/**
 * useLazyComponent Hook - BLOCO 2: Lazy Loading
 *
 * Hook inteligente para lazy loading de componentes com cache integrado
 * Otimiza performance através de cache, prefetch e loading strategies
 */

import { useState, useEffect, useCallback, useRef, ComponentType } from 'react';
import { componentCache } from './component-cache-manager';
import { logger } from '../observability/logger';

interface LazyComponentOptions {
  priority?: 'critical' | 'high' | 'medium' | 'low';
  fallback?: ComponentType;
  preload?: boolean;
  cacheKey?: string;
  rootMargin?: string;
  threshold?: number;
  timeout?: number; // max load time in ms
}

interface LazyComponentResult<T = any> {
  Component: ComponentType<T> | null;
  isLoading: boolean;
  error: Error | null;
  isCached: boolean;
  loadTime: number;
  retry: () => void;
}

/**
 * Hook for intelligent lazy loading with caching
 */
export function useLazyComponent<T = any>(
  loader: () => Promise<{ default: ComponentType<T> }>,
  options: LazyComponentOptions = {}
): LazyComponentResult<T> {
  const {
    priority = 'medium',
    fallback: Fallback,
    preload = false,
    cacheKey,
    rootMargin = '50px',
    threshold = 0.1,
    timeout = 10000,
  } = options;

  const [Component, setComponent] = useState<ComponentType<T> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [loadTime, setLoadTime] = useState(0);

  const elementRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Generate cache key if not provided
  const computedCacheKey = cacheKey || `lazy-${loader.toString().slice(0, 50)}`;

  /**
   * Load component with caching
   */
  const loadComponent = useCallback(async () => {
    startTimeRef.current = Date.now();
    setIsLoading(true);
    setError(null);

    try {
      // Check cache first
      const cachedComponent = componentCache.get(computedCacheKey);
      if (cachedComponent) {
        setComponent(cachedComponent);
        setIsCached(true);
        setLoadTime(Date.now() - startTimeRef.current);
        setIsLoading(false);
        return;
      }

      // Set timeout
      timeoutRef.current = setTimeout(() => {
        setError(new Error(`Component load timeout after ${timeout}ms`));
        setIsLoading(false);
      }, timeout);

      // Load component
      const module = await loader();
      const LoadedComponent = module.default;

      // Cache the component
      componentCache.set(computedCacheKey, LoadedComponent, priority);

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      setComponent(() => LoadedComponent);
      setIsCached(false);
      setLoadTime(Date.now() - startTimeRef.current);
      setIsLoading(false);

      logger.debug("Component loaded", {
        cacheKey: computedCacheKey,
        loadTime: Date.now() - startTimeRef.current,
        priority,
      });

    } catch (err) {
      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      const loadError = err instanceof Error ? err : new Error(String(err));
      setError(loadError);
      setIsLoading(false);

      logger.warn("Component load failed", {
        cacheKey: computedCacheKey,
        error: loadError.message,
      });
    }
  }, [loader, computedCacheKey, priority, timeout]);

  /**
   * Retry loading component
   */
  const retry = useCallback(() => {
    loadComponent();
  }, [loadComponent]);

  /**
   * Setup intersection observer for viewport-based loading
   */
  useEffect(() => {
    if (priority === 'critical' || preload) {
      // Load immediately for critical components or preload
      loadComponent();
      return;
    }

    if (!elementRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !Component && !isLoading) {
          loadComponent();
          observer.disconnect(); // Load only once
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(elementRef.current);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loadComponent, priority, preload, Component, isLoading, rootMargin, threshold]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  /**
   * Prefetch component if enabled
   */
  useEffect(() => {
    if (preload && priority !== 'critical') {
      componentCache.prefetch(computedCacheKey, loader);
    }
  }, [preload, priority, computedCacheKey, loader]);

  return {
    Component,
    isLoading,
    error,
    isCached,
    loadTime,
    retry,
    // Expose ref for intersection observer
    ref: elementRef,
  };
}

/**
 * Hook for manual component loading (no viewport detection)
 */
export function useLazyComponentManual<T = any>(
  loader: () => Promise<{ default: ComponentType<T> }>,
  options: Omit<LazyComponentOptions, 'rootMargin' | 'threshold'> = {}
): LazyComponentResult<T> & { load: () => void } {
  const {
    priority = 'medium',
    fallback: Fallback,
    preload = false,
    cacheKey,
    timeout = 10000,
  } = options;

  const [Component, setComponent] = useState<ComponentType<T> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [loadTime, setLoadTime] = useState(0);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const computedCacheKey = cacheKey || `lazy-${loader.toString().slice(0, 50)}`;

  const loadComponent = useCallback(async () => {
    startTimeRef.current = Date.now();
    setIsLoading(true);
    setError(null);

    try {
      const cachedComponent = componentCache.get(computedCacheKey);
      if (cachedComponent) {
        setComponent(cachedComponent);
        setIsCached(true);
        setLoadTime(Date.now() - startTimeRef.current);
        setIsLoading(false);
        return;
      }

      timeoutRef.current = setTimeout(() => {
        setError(new Error(`Component load timeout after ${timeout}ms`));
        setIsLoading(false);
      }, timeout);

      const module = await loader();
      const LoadedComponent = module.default;

      componentCache.set(computedCacheKey, LoadedComponent, priority);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      setComponent(() => LoadedComponent);
      setIsCached(false);
      setLoadTime(Date.now() - startTimeRef.current);
      setIsLoading(false);

    } catch (err) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      const loadError = err instanceof Error ? err : new Error(String(err));
      setError(loadError);
      setIsLoading(false);
    }
  }, [loader, computedCacheKey, priority, timeout]);

  const retry = useCallback(() => {
    loadComponent();
  }, [loadComponent]);

  useEffect(() => {
    if (preload) {
      componentCache.prefetch(computedCacheKey, loader);
    }
  }, [preload, computedCacheKey, loader]);

  return {
    Component,
    isLoading,
    error,
    isCached,
    loadTime,
    retry,
    load: loadComponent,
  };
}
