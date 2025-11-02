"use client";

import React, { useState, useRef, useEffect, ReactNode } from "react";
import { SectionRenderer } from "@/lib/composition/section-renderer";
import type { SectionConfig } from "@/lib/composition/page-composer";
import { getLazyLoadConfig } from "@/lib/performance/lazy-loading-config";
import {
  trackLazyLoadStart,
  trackLazyLoadComplete,
  trackLazyLoadError,
} from "@/lib/performance/lazy-loading-metrics";

interface LazySectionProps {
  section: SectionConfig;
  index: number;
  onSectionError?: (sectionId: string, error: Error) => void;
  onSectionLoad?: (sectionId: string, loadTime: number) => void;
  priority?: boolean; // Load immediately if true
  rootMargin?: string; // Intersection Observer margin
  threshold?: number; // Intersection Observer threshold
  fallback?: ReactNode; // Loading placeholder
}

/**
 * LazySection - Loads section content only when it enters the viewport
 * Improves initial page load performance by deferring non-critical content
 */
export function LazySection({
  section,
  index,
  onSectionError,
  onSectionLoad,
  priority = false,
  rootMargin = "50px",
  threshold = 0.1,
  fallback,
}: LazySectionProps) {
  // Check component config for priority override
  const componentConfig = getLazyLoadConfig(section.component);
  const effectivePriority =
    priority || componentConfig?.priority === "critical";

  const [isVisible, setIsVisible] = useState(effectivePriority);
  const [hasLoaded, setHasLoaded] = useState(effectivePriority);
  const sectionRef = useRef<HTMLDivElement>(null);
  const loadStartTime = useRef<number>(0);

  useEffect(() => {
    if (effectivePriority || hasLoaded) return;

    // Start tracking lazy load
    trackLazyLoadStart(
      section.component,
      componentConfig?.priority || "medium",
    );

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          loadStartTime.current = performance.now();

          // Track intersection delay
          const intersectionDelay =
            loadStartTime.current - (sectionRef.current ? 0 : 0);
          trackLazyLoadComplete(
            section.component,
            intersectionDelay,
            entry.boundingClientRect.top,
            undefined, // bundle size will be estimated later
          );

          observer.disconnect();
        }
      },
      { rootMargin, threshold },
    );

    const currentRef = sectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    // Fallback timeout - load after 5 seconds if IntersectionObserver fails
    const fallbackTimeout = setTimeout(() => {
      if (!isVisible) {
        setIsVisible(true);
        trackLazyLoadComplete(section.component, 5000, 0);
        observer.disconnect();
      }
    }, 5000);

    return () => {
      clearTimeout(fallbackTimeout);
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [
    effectivePriority,
    hasLoaded,
    rootMargin,
    threshold,
    section.id,
    isVisible,
    componentConfig?.priority,
  ]);

  const handleLoad = (sectionId: string, loadTime: number) => {
    setHasLoaded(true);

    // Calculate actual load time including intersection delay
    if (loadStartTime.current > 0) {
      const totalLoadTime = performance.now() - loadStartTime.current;
      // Log only in development
      if (process.env.NODE_ENV === "development") {
        console.log(
          `LazySection ${sectionId} loaded in ${totalLoadTime.toFixed(2)}ms (including intersection delay)`,
        );
      }
    }

    onSectionLoad?.(sectionId, loadTime);
  };

  const handleError = (sectionId: string, error: Error) => {
    console.error(`LazySection error for ${sectionId}:`, error);

    // Track lazy load error
    trackLazyLoadError(section.component, error.message);

    onSectionError?.(sectionId, error);
  };

  return (
    <div
      ref={sectionRef}
      data-section-id={section.id}
      style={{ minHeight: effectivePriority ? "auto" : "300px" }}
    >
      {isVisible ? (
        <SectionRenderer
          sectionId={section.id}
          data={(section.content as unknown as Record<string, unknown>) || {}}
          className=""
        />
      ) : (
        fallback || (
          <div
            className="min-h-[300px] flex items-center justify-center bg-linear-to-br from-neutral-50 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800"
            aria-label={`Loading ${section.id} section`}
          >
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-neutral-600 dark:text-neutral-400">
                Carregando {section.component}...
              </p>
            </div>
          </div>
        )
      )}
    </div>
  );
}

/**
 * CriticalSection - Always loads immediately (for hero, above-the-fold content)
 */
export function CriticalSection({
  section,
  index,
  onSectionError,
  onSectionLoad,
}: Omit<
  LazySectionProps,
  "priority" | "rootMargin" | "threshold" | "fallback"
>) {
  return (
    <LazySection
      section={section}
      index={index}
      onSectionError={onSectionError}
      onSectionLoad={onSectionLoad}
      priority={true}
    />
  );
}

/**
 * DeferredSection - Loads with custom intersection settings
 */
export function DeferredSection({
  section,
  index,
  onSectionError,
  onSectionLoad,
  rootMargin = "100px",
  threshold = 0.05,
  fallback,
}: Omit<LazySectionProps, "priority">) {
  return (
    <LazySection
      section={section}
      index={index}
      onSectionError={onSectionError}
      onSectionLoad={onSectionLoad}
      priority={false}
      rootMargin={rootMargin}
      threshold={threshold}
      fallback={fallback}
    />
  );
}
