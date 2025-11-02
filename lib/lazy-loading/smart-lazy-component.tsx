/**
 * Smart Lazy Component - BLOCO 2: Lazy Loading
 *
 * Componente inteligente que integra cache, preload, bundle optimization e monitoring
 * Fornece lazy loading otimizado com analytics completos
 */

"use client";

import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useLazyComponent } from './use-lazy-component';
import { componentCache } from './component-cache-manager';
import { preloadStrategy } from './preload-strategy';
import { bundleOptimizer } from './bundle-optimizer';
import { lazyLoadingMonitor } from './performance-monitor';
import { logger } from '../observability/logger';

interface SmartLazyComponentProps {
  /**
   * Component loader function
   */
  loader: () => Promise<{ default: React.ComponentType<any> }>;

  /**
   * Component name for analytics and caching
   */
  name: string;

  /**
   * Loading priority
   */
  priority?: 'critical' | 'high' | 'medium' | 'low';

  /**
   * Custom loading component
   */
  fallback?: React.ComponentType;

  /**
   * Props to pass to the loaded component
   */
  componentProps?: Record<string, any>;

  /**
   * Intersection Observer options
   */
  intersectionOptions?: {
    rootMargin?: string;
    threshold?: number;
    triggerOnce?: boolean;
  };

  /**
   * Enable preload based on user journey
   */
  enablePreload?: boolean;

  /**
   * Bundle chunk name for optimization
   */
  chunkName?: string;

  /**
   * Custom error boundary
   */
  errorBoundary?: React.ComponentType<{ error: Error; retry: () => void }>;

  /**
   * Analytics tracking options
   */
  analytics?: {
    trackLoadTime?: boolean;
    trackErrors?: boolean;
    trackCacheHits?: boolean;
    customMetadata?: Record<string, any>;
  };

  /**
   * Debug mode
   */
  debug?: boolean;
}

interface LoadingStateProps {
  componentName: string;
  priority: string;
  isPreloading?: boolean;
}

/**
 * Default loading component
 */
function DefaultLoading({ componentName, priority, isPreloading }: LoadingStateProps) {
  return (
    <div
      className="lazy-loading-placeholder"
      style={{
        minHeight: '100px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        border: '1px dashed #ccc',
        borderRadius: '4px',
        padding: '20px',
        textAlign: 'center',
      }}
      data-priority={priority}
      data-component={componentName}
    >
      <div>
        <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
          Loading {componentName}...
        </div>
        {isPreloading && (
          <div style={{ fontSize: '12px', color: '#888' }}>
            Preloading for better performance
          </div>
        )}
        <div
          style={{
            width: '40px',
            height: '4px',
            backgroundColor: '#e0e0e0',
            borderRadius: '2px',
            margin: '8px auto',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#007acc',
              animation: 'loading-bar 1.5s ease-in-out infinite',
            }}
          />
        </div>
      </div>
      <style jsx>{`
        @keyframes loading-bar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}

/**
 * Default error boundary
 */
function DefaultErrorBoundary({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div
      className="lazy-loading-error"
      style={{
        padding: '20px',
        border: '1px solid #ff6b6b',
        borderRadius: '4px',
        backgroundColor: '#fff5f5',
        textAlign: 'center',
      }}
    >
      <div style={{ color: '#d63031', marginBottom: '12px' }}>
        Failed to load component
      </div>
      <div style={{ fontSize: '14px', color: '#636e72', marginBottom: '16px' }}>
        {error.message}
      </div>
      <button
        onClick={retry}
        style={{
          padding: '8px 16px',
          backgroundColor: '#0984e3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Try Again
      </button>
    </div>
  );
}

/**
 * Smart Lazy Component - Main export
 */
export function SmartLazyComponent({
  loader,
  name,
  priority = 'medium',
  fallback: Fallback,
  componentProps = {},
  intersectionOptions = {},
  enablePreload = true,
  chunkName,
  errorBoundary: ErrorBoundary,
  analytics = {},
  debug = false,
}: SmartLazyComponentProps) {
  const [loadStartTime, setLoadStartTime] = useState<number | null>(null);
  const [isPreloading, setIsPreloading] = useState(false);
  const componentRef = useRef<HTMLDivElement>(null);

  const {
    trackLoadTime = true,
    trackErrors = true,
    trackCacheHits = true,
    customMetadata = {},
  } = analytics;

  // Generate cache key
  const cacheKey = `smart-lazy-${name}-${priority}`;

  // Use the lazy component hook
  const {
    Component,
    isLoading,
    error,
    isCached,
    loadTime,
    retry,
    ref: lazyRef,
  } = useLazyComponent(loader, {
    priority,
    preload: enablePreload,
    cacheKey,
    rootMargin: intersectionOptions.rootMargin,
    threshold: intersectionOptions.threshold,
  });

  // Start performance monitoring
  useEffect(() => {
    lazyLoadingMonitor.startMonitoring();
    return () => lazyLoadingMonitor.stopMonitoring();
  }, []);

  // Track component visibility for preload strategy
  useEffect(() => {
    if (!enablePreload || !lazyRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          // Component became visible, track for preload strategy
          preloadStrategy.trackJourney({
            currentPath: window.location.pathname,
            timeOnPage: Date.now() - (window as any)._pageStartTime || 0,
            scrollDepth: Math.round((window.scrollY / document.documentElement.scrollHeight) * 100),
            interactions: (window as any)._pageInteractions || 0,
          });
        }
      },
      {
        rootMargin: '100px', // Preload when component is 100px from viewport
        threshold: 0,
      }
    );

    if (lazyRef.current) {
      observer.observe(lazyRef.current);
    }

    return () => observer.disconnect();
  }, [enablePreload]);

  // Handle component load events
  useEffect(() => {
    if (Component && loadStartTime) {
      const actualLoadTime = Date.now() - loadStartTime;

      // Record performance metric
      if (trackLoadTime) {
        lazyLoadingMonitor.recordMetric({
          component: name,
          cacheKey,
          loadTime: actualLoadTime,
          size: 0, // Would be calculated in a real implementation
          strategy: priority === 'critical' ? 'critical' : 'viewport',
          cached: isCached,
          priority,
          success: true,
          intersectionDelay: 0, // Would be tracked in intersection observer
        });
      }

      // Log performance
      logger.debug("Component loaded", {
        component: name,
        loadTime: actualLoadTime,
        cached: isCached,
        priority,
        cacheKey,
      });

      setLoadStartTime(null);
    }
  }, [Component, loadStartTime, name, cacheKey, isCached, priority, trackLoadTime]);

  // Handle load start
  useEffect(() => {
    if (isLoading && !loadStartTime) {
      setLoadStartTime(Date.now());

      if (debug) {
        logger.debug("Component load started", { component: name, priority });
      }
    }
  }, [isLoading, loadStartTime, name, priority, debug]);

  // Handle errors
  useEffect(() => {
    if (error && trackErrors) {
      lazyLoadingMonitor.recordMetric({
        component: name,
        cacheKey,
        loadTime: 0,
        size: 0,
        strategy: 'viewport',
        cached: false,
        priority,
        success: false,
        error: error.message,
      });

      logger.error("Component load failed", {
        component: name,
        error: error.message,
        priority,
      });
    }
  }, [error, name, priority, trackErrors]);

  // Handle cache hits
  useEffect(() => {
    if (isCached && trackCacheHits) {
      logger.debug("Component loaded from cache", {
        component: name,
        cacheKey,
        priority,
      });
    }
  }, [isCached, name, cacheKey, priority, trackCacheHits]);

  // Preload related components
  useEffect(() => {
    if (enablePreload && Component) {
      // Queue preload of related components based on current component
      const relatedComponents = getRelatedComponents(name);

      relatedComponents.forEach(relatedComponent => {
        preloadStrategy.queuePreload({
          component: relatedComponent.name,
          priority: relatedComponent.priority,
          estimatedBenefit: relatedComponent.estimatedBenefit,
          cacheKey: `related-${relatedComponent.name}`,
          loader: relatedComponent.loader,
        });
      });

      // Execute preload queue
      preloadStrategy.executePreload();
    }
  }, [enablePreload, Component, name]);

  // Debug information
  useEffect(() => {
    if (debug) {
      const cacheStats = componentCache.getStats();
      const preloadStats = preloadStrategy.getStats();
      const bundleStats = bundleOptimizer.analyzeBundleEfficiency();

      console.group(`🚀 Smart Lazy Component: ${name}`);
      console.log('Priority:', priority);
      console.log('Cache Key:', cacheKey);
      console.log('Is Loading:', isLoading);
      console.log('Is Cached:', isCached);
      console.log('Load Time:', loadTime, 'ms');
      console.log('Cache Stats:', cacheStats);
      console.log('Preload Stats:', preloadStats);
      console.log('Bundle Efficiency:', bundleStats.efficiency);
      console.groupEnd();
    }
  }, [debug, name, priority, cacheKey, isLoading, isCached, loadTime]);

  // Render component
  if (error) {
    const ErrorComponent = ErrorBoundary || DefaultErrorBoundary;
    return <ErrorComponent error={error} retry={retry} />;
  }

  if (!Component) {
    const LoadingComponent = Fallback || DefaultLoading;
    return (
      <div ref={lazyRef}>
        <LoadingComponent
          componentName={name}
          priority={priority}
          isPreloading={isPreloading}
        />
      </div>
    );
  }

  return (
    <div ref={componentRef} data-component={name} data-priority={priority}>
      <Suspense
        fallback={
          <DefaultLoading
            componentName={name}
            priority={priority}
            isPreloading={false}
          />
        }
      >
        <Component {...componentProps} />
      </Suspense>
    </div>
  );
}

/**
 * Hook for using smart lazy components programmatically
 */
export function useSmartLazyComponent(
  loader: () => Promise<{ default: React.ComponentType<any> }>,
  name: string,
  options: Omit<SmartLazyComponentProps, 'loader' | 'name'> = {}
) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: options.intersectionOptions?.rootMargin || '50px',
        threshold: options.intersectionOptions?.threshold || 0.1,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [options.intersectionOptions]);

  if (!isVisible) {
    return {
      Component: null,
      ref,
      isLoading: false,
      error: null,
    };
  }

  return {
    Component: (props: any) => (
      <SmartLazyComponent
        loader={loader}
        name={name}
        {...options}
        componentProps={props}
      />
    ),
    ref,
    isLoading: false,
    error: null,
  };
}

/**
 * Get related components for preloading
 */
function getRelatedComponents(currentComponent: string): Array<{
  name: string;
  priority: number;
  estimatedBenefit: number;
  loader: () => Promise<any>;
}> {
  // This would be configurable based on component relationships
  const componentRelationships: Record<string, Array<{
    name: string;
    priority: number;
    estimatedBenefit: number;
    loader: () => Promise<any>;
  }>> = {
    'hero': [
      {
        name: 'features',
        priority: 0.8,
        estimatedBenefit: 300,
        loader: () => import('@/components/sections/features/features'),
      },
    ],
    'features': [
      {
        name: 'pricing',
        priority: 0.7,
        estimatedBenefit: 250,
        loader: () => import('@/components/sections/pricing/pricing'),
      },
      {
        name: 'demo',
        priority: 0.6,
        estimatedBenefit: 400,
        loader: () => import('@/components/sections/demo/demo'),
      },
    ],
    'pricing': [
      {
        name: 'faq',
        priority: 0.6,
        estimatedBenefit: 150,
        loader: () => import('@/components/sections/faq/faq'),
      },
    ],
  };

  return componentRelationships[currentComponent] || [];
}

// Export utilities for external use
export { componentCache, preloadStrategy, bundleOptimizer, lazyLoadingMonitor };
