"use client";

import React, { useEffect, useState, useRef, ReactNode } from "react";
import {
  usePositionBasedLazyLoading,
  ConversionOptimizer,
} from "./seo-optimizer";
import { metrics } from "../observability/metrics";
import { logger } from "../observability/logger";

/**
 * Position-Based Lazy Loading Component
 * Intelligently loads content based on viewport position and user behavior
 */

interface PositionBasedLazyProps {
  children: ReactNode;
  fallback?: ReactNode;
  priority?: "critical" | "high" | "normal" | "low";
  rootMargin?: string;
  threshold?: number;
  trackConversion?: boolean;
  conversionEvent?: string;
  className?: string;
  id?: string;
}

/**
 * Critical content (above the fold) - loads immediately
 */
export function CriticalSection({
  children,
  className,
  id,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  useEffect(() => {
    // Track critical content load time
    metrics.recordHistogram(
      "critical_content_load_time",
      performance.now() / 1000,
      {
        component_id: id || "unknown",
      },
    );
  }, [id]);

  return (
    <section className={className} id={id}>
      {children}
    </section>
  );
}

/**
 * High priority content - loads after critical content but before user interaction
 */
export function HighPrioritySection({
  children,
  fallback,
  rootMargin = "100px",
  className,
  id,
}: Omit<PositionBasedLazyProps, "priority">) {
  const ref = useRef<HTMLDivElement>(null);
  const { isVisible, isAboveFold } = usePositionBasedLazyLoading(
    ref as React.RefObject<Element>,
    {
      rootMargin,
      threshold: 0.1,
      priority: "high",
    },
  );

  useEffect(() => {
    if (isVisible && id) {
      metrics.incrementCounter("high_priority_section_loaded", 1, {
        section_id: id,
      });
    }
  }, [isVisible, id]);

  // High priority content loads immediately if above fold
  if (isAboveFold) {
    return (
      <section ref={ref} className={className} id={id}>
        {children}
      </section>
    );
  }

  return (
    <section ref={ref} className={className} id={id}>
      {isVisible ? children : fallback || <LoadingPlaceholder />}
    </section>
  );
}

/**
 * Normal priority content - loads when near viewport
 */
export function NormalPrioritySection({
  children,
  fallback,
  rootMargin = "200px",
  threshold = 0.1,
  className,
  id,
}: Omit<PositionBasedLazyProps, "priority">) {
  const ref = useRef<HTMLDivElement>(null);
  const { isVisible } = usePositionBasedLazyLoading(
    ref as React.RefObject<Element>,
    {
      rootMargin,
      threshold,
      priority: "auto",
    },
  );

  useEffect(() => {
    if (isVisible && id) {
      metrics.incrementCounter("normal_priority_section_loaded", 1, {
        section_id: id,
      });
    }
  }, [isVisible, id]);

  return (
    <section ref={ref} className={className} id={id}>
      {isVisible ? children : fallback || <LoadingPlaceholder />}
    </section>
  );
}

/**
 * Low priority content - loads only when user is likely to see it
 */
export function LowPrioritySection({
  children,
  fallback,
  rootMargin = "400px",
  threshold = 0.05,
  className,
  id,
  trackConversion = false,
  conversionEvent,
}: PositionBasedLazyProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasConverted, setHasConverted] = useState(false);
  const { isVisible } = usePositionBasedLazyLoading(
    ref as React.RefObject<Element>,
    {
      rootMargin,
      threshold,
      priority: "low",
    },
  );

  useEffect(() => {
    if (isVisible && id) {
      metrics.incrementCounter("low_priority_section_loaded", 1, {
        section_id: id,
      });

      // Track conversion if enabled
      if (trackConversion && conversionEvent && !hasConverted) {
        ConversionOptimizer.trackConversion(conversionEvent, undefined, {
          section_id: id,
          load_trigger: "viewport_intersection",
        });
        setHasConverted(true);
      }
    }
  }, [isVisible, id, trackConversion, conversionEvent, hasConverted]);

  return (
    <section ref={ref} className={className} id={id}>
      {isVisible ? children : fallback || <DeferredPlaceholder />}
    </section>
  );
}

/**
 * Main lazy loading component with intelligent prioritization
 */
export function PositionBasedLazy({
  children,
  fallback,
  priority = "normal",
  rootMargin,
  threshold,
  trackConversion,
  conversionEvent,
  className,
  id,
}: PositionBasedLazyProps) {
  const [scrollDepth, setScrollDepth] = useState(0);

  // Track scroll depth for conversion optimization
  useEffect(() => {
    const handleScroll = () => {
      const scrolled =
        (window.scrollY /
          (document.documentElement.scrollHeight - window.innerHeight)) *
        100;
      setScrollDepth(scrolled);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Optimize CTA based on scroll depth
  const ctaOptimizations =
    ConversionOptimizer.optimizeCTAPlacement(scrollDepth);

  const commonProps = {
    children,
    fallback,
    rootMargin,
    threshold,
    trackConversion,
    conversionEvent,
    className,
    id,
  };

  switch (priority) {
    case "critical":
      return <CriticalSection {...commonProps} />;

    case "high":
      return <HighPrioritySection {...commonProps} />;

    case "low":
      return (
        <LowPrioritySection
          {...commonProps}
          trackConversion={trackConversion || ctaOptimizations.showExitIntent}
          conversionEvent={conversionEvent || "scroll_depth_conversion"}
        />
      );

    case "normal":
    default:
      return <NormalPrioritySection {...commonProps} />;
  }
}

// ===== LOADING PLACEHOLDERS =====

function LoadingPlaceholder() {
  return (
    <div className="loading-placeholder animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="h-32 bg-gray-200 rounded mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
    </div>
  );
}

function DeferredPlaceholder() {
  return (
    <div className="deferred-placeholder">
      <div className="text-center py-8 text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mx-auto mb-4"></div>
        <p className="text-sm">Carregando conteúdo...</p>
      </div>
    </div>
  );
}

// ===== CONVERSION-TRACKING SECTIONS =====

interface ConversionTrackingSectionProps
  extends Omit<PositionBasedLazyProps, "trackConversion" | "conversionEvent"> {
  conversionEvents?: {
    view: string;
    interact: string;
    convert: string;
  };
  ctaSelector?: string;
}

export function ConversionTrackingSection({
  children,
  conversionEvents = {
    view: "section_view",
    interact: "section_interaction",
    convert: "cta_click",
  },
  ctaSelector = 'button, a[role="button"]',
  id,
  ...props
}: ConversionTrackingSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    // Track section view when it becomes visible
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            ConversionOptimizer.trackConversion(
              conversionEvents.view,
              undefined,
              {
                section_id: id,
                time_to_view: performance.now() / 1000,
              },
            );
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 },
    );

    observer.observe(section);

    // Track interactions
    const handleInteraction = (event: Event) => {
      const target = event.target as Element;
      if (section.contains(target)) {
        ConversionOptimizer.trackConversion(
          conversionEvents.interact,
          undefined,
          {
            section_id: id,
            element_type: target.tagName.toLowerCase(),
            interaction_type: event.type,
          },
        );
      }
    };

    section.addEventListener("click", handleInteraction);
    section.addEventListener("focus", handleInteraction, true);

    // Track CTA clicks
    const ctaElements = section.querySelectorAll(ctaSelector);
    const handleCTAClick = (event: Event) => {
      ConversionOptimizer.trackConversion(conversionEvents.convert, undefined, {
        section_id: id,
        cta_element: (event.target as Element).textContent?.trim(),
      });
    };

    ctaElements.forEach((cta) => {
      cta.addEventListener("click", handleCTAClick);
    });

    return () => {
      observer.disconnect();
      section.removeEventListener("click", handleInteraction);
      section.removeEventListener("focus", handleInteraction);
      ctaElements.forEach((cta) => {
        cta.removeEventListener("click", handleCTAClick);
      });
    };
  }, [id, conversionEvents, ctaSelector]);

  return (
    <PositionBasedLazy id={id} {...props}>
      <section ref={sectionRef}>{children}</section>
    </PositionBasedLazy>
  );
}

// ===== PERFORMANCE MONITORING HOOK =====

export function useSectionPerformance(sectionId: string) {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    interactionTime: 0,
    conversionRate: 0,
  });

  const trackLoadTime = (time: number) => {
    setMetrics((prev) => ({ ...prev, loadTime: time }));
  };

  const trackRenderTime = (time: number) => {
    setMetrics((prev) => ({ ...prev, renderTime: time }));
  };

  const trackInteraction = () => {
    setMetrics((prev) => ({
      ...prev,
      interactionTime: performance.now() / 1000,
    }));
  };

  const trackConversion = (converted: boolean) => {
    setMetrics((prev) => ({
      ...prev,
      conversionRate: converted ? 1 : 0,
    }));

    // Send to analytics
    logger.info("Section conversion tracked", {
      sectionId,
      converted,
      metrics,
    });
  };

  return {
    metrics,
    trackLoadTime,
    trackRenderTime,
    trackInteraction,
    trackConversion,
  };
}

// ===== SCROLL-BASED CONTENT LOADING =====

export function useScrollBasedLoading(
  thresholds: number[] = [0.25, 0.5, 0.75, 1.0],
) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [crossedThresholds, setCrossedThresholds] = useState<Set<number>>(
    new Set(),
  );

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(scrolled / maxScroll, 1);

      setScrollProgress(progress);

      // Track threshold crossings
      thresholds.forEach((threshold) => {
        if (progress >= threshold && !crossedThresholds.has(threshold)) {
          setCrossedThresholds((prev) => new Set([...prev, threshold]));

          // Track scroll depth conversion
          ConversionOptimizer.trackConversion("scroll_depth", threshold * 100, {
            scroll_percentage: threshold * 100,
          });

          logger.info("Scroll threshold crossed", {
            threshold: threshold * 100,
            progress: progress * 100,
          });
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [thresholds, crossedThresholds]);

  return {
    scrollProgress,
    crossedThresholds: Array.from(crossedThresholds),
  };
}

// ===== A/B TESTING INTEGRATION =====

interface ABTestSectionProps extends PositionBasedLazyProps {
  experimentId: string;
  variants: Record<string, ReactNode>;
  fallbackVariant?: string;
}

export function ABTestSection({
  experimentId,
  variants,
  fallbackVariant = "control",
  ...props
}: ABTestSectionProps) {
  const [assignedVariant, setAssignedVariant] = useState<string | null>(null);

  useEffect(() => {
    // In a real implementation, this would get the variant from your experiment service
    const variant =
      typeof localStorage !== "undefined"
        ? localStorage.getItem(`exp_${experimentId}`)
        : fallbackVariant;
    setAssignedVariant(variant);

    // Track variant assignment
    if (variant) {
      metrics.incrementCounter("experiment_variant_assigned", 1, {
        experiment_id: experimentId,
        variant,
      });
    }
  }, [experimentId, fallbackVariant]);

  if (!assignedVariant) {
    return <LoadingPlaceholder />;
  }

  const variantContent = variants[assignedVariant] || variants[fallbackVariant];

  return <PositionBasedLazy {...props}>{variantContent}</PositionBasedLazy>;
}
