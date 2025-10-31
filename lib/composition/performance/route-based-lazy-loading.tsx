/**
 * Route-Based Lazy Loading with Intersection Observer
 * Optimized lazy loading for sections with performance monitoring
 */

import React, { lazy, ComponentType, Suspense, useEffect, useState } from "react";
import { SectionId } from "../registry/section-registry";

interface LazyLoadProps {
  sectionId: SectionId;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Simple lazy loading wrapper for sections
 */
export function LazySection({
  sectionId,
  fallback = <div>Loading...</div>,
  children
}: LazyLoadProps) {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
}

/**
 * Create a lazy-loaded component for a section
 */
export function createLazySection(sectionId: SectionId): ComponentType<unknown> {
  return lazy(() =>
    import(`@/components/sections/${sectionId}/${sectionId}`)
      .catch(() => {
        // Fallback to a generic error component
        return import("@/components/ui/error-boundary");
      })
  );
}

/**
 * Hook for lazy loading sections based on route
 */
export function useRouteBasedLazyLoading() {
  const loadSection = async (sectionId: SectionId) => {
    try {
      const Component = await createLazySection(sectionId);
      return Component;
    } catch (error) {
      console.error(`Failed to load section ${sectionId}:`, error);
      return null;
    }
  };

  return { loadSection };
}

/**
 * Get component for section - maps section ID to component
 */
export function getComponentForSection(sectionId: SectionId): ComponentType<unknown> | null {
  try {
    return createLazySection(sectionId);
  } catch (error) {
    console.error(`Failed to get component for section ${sectionId}:`, error);
    return null;
  }
}

/**
 * Should use lazy loading for this section
 */
export function shouldUseLazyLoading(sectionId: SectionId): boolean {
  // For now, always use lazy loading for all sections
  // In the future, this could be based on section size, priority, etc.
  return true;
}

/**
 * Get lazy loading configuration for a section
 */
export function getLazyLoadingConfig(sectionId: SectionId) {
  // Define priority and thresholds based on section importance
  const configs = {
    hero: {
      priority: 'high' as const,
      rootMargin: '50px',
      threshold: 0.1,
    },
    'social-proof': {
      priority: 'high' as const,
      rootMargin: '100px',
      threshold: 0.2,
    },
    benefits: {
      priority: 'normal' as const,
      rootMargin: '200px',
      threshold: 0.1,
    },
    features: {
      priority: 'normal' as const,
      rootMargin: '300px',
      threshold: 0.1,
    },
    demo: {
      priority: 'normal' as const,
      rootMargin: '400px',
      threshold: 0.1,
    },
    pricing: {
      priority: 'normal' as const,
      rootMargin: '200px',
      threshold: 0.2,
    },
    faq: {
      priority: 'low' as const,
      rootMargin: '500px',
      threshold: 0.1,
    },
    'final-cta': {
      priority: 'normal' as const,
      rootMargin: '300px',
      threshold: 0.1,
    },
    footer: {
      priority: 'low' as const,
      rootMargin: '600px',
      threshold: 0.1,
    },
  };

  return configs[sectionId] || {
    enabled: shouldUseLazyLoading(sectionId),
    preload: false,
    priority: 'normal' as const,
    rootMargin: '300px',
    threshold: 0.1,
  };
}

/**
 * Hook for lazy loading based on intersection observer
 */
export function useLazyIntersectionObserver(
  elementRef: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observer.disconnect(); // Stop observing once intersected
        }
      },
      {
        rootMargin: '300px', // Load 300px before entering viewport
        threshold: 0.1,
        ...options,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [elementRef, options]);

  return isIntersecting;
}

/**
 * Preload critical sections on page load
 */
export function preloadCriticalSections() {
  const criticalSections = ['hero', 'social-proof'];

  criticalSections.forEach(sectionId => {
    try {
      // Preload critical sections
      import(`@/components/sections/${sectionId}/${sectionId}`);
    } catch (error) {
      console.warn(`Failed to preload critical section: ${sectionId}`, error);
    }
  });
}
