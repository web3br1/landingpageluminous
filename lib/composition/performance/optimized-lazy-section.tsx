"use client";

import React, { Suspense, useEffect, useState } from "react";
import {
  getComponentForSection,
  shouldUseLazyLoading,
  getLazyLoadingConfig,
} from "./route-based-lazy-loading";
import {
  isFeatureEnabled,
  FeatureFlag,
} from "../../environment/environment-manager";
import type { SectionId } from "../ports";

interface OptimizedLazySectionProps {
  section: {
    id: string;
    component: string;
    content: unknown;
    order: number;
    tracking?: {
      section: string;
      experimentId?: string;
      variant?: string;
    };
  };
  index?: number;
  onSectionLoad?: (sectionId: string, loadTime: number) => void;
}

// Loading fallback component
function SectionLoadingFallback({ sectionId }: { sectionId: string }) {
  return (
    <section id={sectionId} className="section-wrapper py-20 md:py-28">
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-12"></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Error fallback component
function SectionErrorFallback({
  sectionId,
  error,
}: {
  sectionId: string;
  error: Error;
}) {
  return (
    <section id={sectionId} className="section-wrapper py-20 md:py-28">
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-red-600">⚠️</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Erro ao carregar seção
          </h3>
          <p className="text-gray-600 text-sm">{error.message}</p>
        </div>
      </div>
    </section>
  );
}

// Intersection Observer hook for lazy loading (local implementation)
function useLazyIntersectionObserver(
  ref: React.RefObject<HTMLElement | null>,
  options: IntersectionObserverInit,
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsIntersecting(true);
        observer.disconnect(); // Stop observing once visible
      }
    }, options);

    observer.observe(element);

    return () => observer.disconnect();
  }, [ref, options]);

  return isIntersecting;
}

export function OptimizedLazySection({
  section,
  onSectionLoad,
}: OptimizedLazySectionProps) {
  const [error, setError] = useState<Error | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const sectionRef = React.useRef<HTMLElement | null>(null);

  // [HIPÓTESE 3] Logs extensivos para resolução de módulos
  console.log("[OptimizedLazySection] Component called", {
    sectionId: section.id,
    component: section.component,
    hasContent: !!section.content,
    contentType: typeof section.content,
    contentKeys: section.content ? Object.keys(section.content as any) : [],
    timestamp: Date.now(),
    environment: {
      isServer: typeof window === "undefined",
      hasWindow: typeof window !== "undefined",
      hasDocument: typeof document !== "undefined",
      navigator: typeof navigator !== "undefined",
    },
  });

  // DEBUG: Log section data
  console.log(`[OptimizedLazySection] Rendering section:`, {
    id: section.id,
    hasContent: !!section.content,
    contentKeys: section.content ? Object.keys(section.content) : [],
    component: section.component,
  });

  try {
    // [HIPÓTESE 3] Verificar resolução de módulos
    console.log("[OptimizedLazySection] About to resolve component", {
      sectionId: section.id,
      sectionIdType: typeof section.id,
      availableFunctions: {
        getComponentForSection: typeof getComponentForSection,
        shouldUseLazyLoading: typeof shouldUseLazyLoading,
        getLazyLoadingConfig: typeof getLazyLoadingConfig,
        isFeatureEnabled: typeof isFeatureEnabled,
      },
    });

    const ComponentClass = getComponentForSection(section.id as SectionId);
    const shouldLazyLoad = shouldUseLazyLoading(section.id as SectionId);
    const lazyConfig = getLazyLoadingConfig(section.id as SectionId);

    // DEBUG: Log component resolution
    console.log(
      `[OptimizedLazySection] Component resolution for ${section.id}:`,
      {
        ComponentClass: ComponentClass ? "FOUND" : "NOT_FOUND",
        ComponentName: ComponentClass?.name || "undefined",
        ComponentType: typeof ComponentClass,
        ComponentPrototype: ComponentClass?.prototype
          ? "HAS_PROTOTYPE"
          : "NO_PROTOTYPE",
        shouldLazyLoad,
        lazyConfig,
        lazyLoadingEnabled: isFeatureEnabled(FeatureFlag.LAZY_LOADING),
        featureFlagCheck: {
          FeatureFlag: typeof FeatureFlag,
          LAZY_LOADING: FeatureFlag?.LAZY_LOADING,
        },
      },
    );

    // Check if lazy loading is enabled globally
    const lazyLoadingEnabled = isFeatureEnabled(FeatureFlag.LAZY_LOADING);

    // For critical sections or when lazy loading is disabled, load immediately
    const shouldLoadImmediately =
      !shouldLazyLoad || !lazyLoadingEnabled || lazyConfig.priority === "high";

    // Use intersection observer for lazy sections
    const isIntersecting = useLazyIntersectionObserver(sectionRef, {
      rootMargin: lazyConfig.rootMargin,
      threshold: lazyConfig.threshold,
    });

    // TEMPORÁRIO: Forçar renderização imediata para debug
    console.log(`[OptimizedLazySection] FORCE RENDERING section ${section.id}`);

    useEffect(() => {
      const renderTime = performance.now();
      onSectionLoad?.(section.id, renderTime);
      console.log(
        `[OptimizedLazySection] Section ${section.id} rendered at ${renderTime}`,
      );
    }, [section.id, onSectionLoad]);

    if (!ComponentClass) {
      console.error(`Component not found for section: ${section.id}`);
      return (
        <section
          id={section.id}
          className="section-wrapper py-20"
          data-debug="component-not-found"
        >
          <div className="text-center">
            <p>Seção não encontrada: {section.id}</p>
          </div>
        </section>
      );
    }

    console.log(
      `[OptimizedLazySection] Rendering component ${section.id} with ComponentClass:`,
      ComponentClass?.name,
    );

    return (
      <section
        id={section.id}
        className="section-wrapper"
        data-section={section.id}
        data-debug="rendering-component"
      >
        <ComponentClass
          content={section.content}
          variant="default"
          id={section.id}
          tracking={section.tracking}
        />
      </section>
    );
  } catch (err) {
    const error = err as Error;
    console.error(`Error rendering section ${section.id}:`, error);
    setError(error);
    return <SectionErrorFallback sectionId={section.id} error={error} />;
  }
}
