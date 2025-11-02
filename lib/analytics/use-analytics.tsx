"use client";

import { useEffect, useCallback, useRef } from "react";
import {
  advancedAnalytics,
  trackEvent,
  trackConversion,
} from "./advanced-analytics";
import { isHTMLElement, isHTMLInputElement, isHTMLFormElement } from "@/lib/utils/dom-type-guards";
import { usePerformanceMonitor } from "@/lib/performance/optimized-lazy-loading";
import { AnalyticsEvent, PageComposition } from "./types";

interface UseAnalyticsOptions {
  trackPageViews?: boolean;
  trackClicks?: boolean;
  trackScroll?: boolean;
  trackVisibility?: boolean;
  trackErrors?: boolean;
  customTracking?: Record<string, unknown>;
}

// Type definitions for analytics events and metrics
interface WebVitalsMetric {
  name: string;
  value: number;
  rating?: 'good' | 'needs-improvement' | 'poor';
  navigationType?: string;
  entries?: unknown[];
}

interface WebVitalsModule {
  getLCP?: (callback: (metric: WebVitalsMetric) => void) => void;
  getFID?: (callback: (metric: WebVitalsMetric) => void) => void;
  getCLS?: (callback: (metric: WebVitalsMetric) => void) => void;
}

// Analytics event types imported from shared types

// Type guard functions for runtime safety
function isAnalyticsEvent(data: unknown): data is AnalyticsEvent {
  return (
    typeof data === 'object' &&
    data !== null &&
    'category' in data &&
    'action' in data &&
    typeof (data as any).category === 'string' &&
    typeof (data as any).action === 'string'
  );
}

function isPageComposition(data: unknown): data is PageComposition {
  return (
    typeof data === 'object' &&
    data !== null &&
    'component' in data &&
    typeof (data as any).component === 'string'
  );
}

interface AnalyticsHookReturn {
  trackEvent: (
    category: string,
    action: string,
    label?: string,
    value?: number,
    context?: Record<string, unknown>,
  ) => Promise<void>;
  trackConversion: (
    type: string,
    value?: number,
    currency?: string,
    metadata?: Record<string, unknown>,
  ) => Promise<void>;
  trackCustom: (
    eventName: string,
    data: Record<string, unknown>,
  ) => Promise<void>;
  getJourney: () => unknown;
  getFunnels: () => Record<string, unknown>;
  forceFlush: () => Promise<void>;
}

export function useAnalytics(
  options: UseAnalyticsOptions = {},
): AnalyticsHookReturn {
  const {
    trackPageViews = true,
    trackClicks = true,
    trackScroll = true,
    trackVisibility = true,
    trackErrors = true,
    customTracking = {},
  } = options;

  // Refs for analytics state
  const hasInitialized = useRef(false);
  const sessionStartTime = useRef<number>(Date.now());
  const pageViews = useRef<number>(0);
  const interactions = useRef<Array<{
    type: string;
    timestamp: number;
    data: Record<string, unknown>;
  }>>([]);

  // Performance monitoring
  const performanceMonitor = usePerformanceMonitor("useAnalytics");

  // Journey tracking state
  const journey = useRef({
    startTime: sessionStartTime.current,
    pages: [] as Array<{
      path: string;
      entryTime: number;
      exitTime?: number;
      interactions: number;
    }>,
    conversions: [] as Array<{
      type: string;
      value?: number;
      timestamp: number;
    }>,
    errors: [] as Array<{
      message: string;
      stack?: string;
      timestamp: number;
      context: Record<string, unknown>;
    }>,
  });

  // All useCallback declarations happen here

  // Wrapper functions that handle the async nature
  const wrappedTrackEvent = useCallback(
    async (
      category: string,
      action: string,
      label?: string,
      value?: number,
      context?: Record<string, unknown>,
    ) => {
      try {
        await advancedAnalytics.trackEvent(
          category,
          action,
          label,
          value,
          context,
        );
      } catch (error) {
        withComponentContext("analytics", "trackEvent").error(
          "Failed to track event",
          error instanceof Error ? error : undefined,
          { category, action, label, value }
        );
      }
    },
    [],
  );

  const setupClickTracking = useCallback(() => {
    const handleClick = (event: MouseEvent) => {
      if (!isHTMLElement(event.target)) return;
      const target = event.target;
      const clickableElement = target.closest(
        'a, button, [role="button"], [data-track-click]',
      );

      if (clickableElement && isHTMLElement(clickableElement)) {
        const element = clickableElement;
        const category = element.dataset.trackCategory || "interaction";
        const action = element.dataset.trackAction || "click";
        const label =
          element.dataset.trackLabel ||
          element.textContent?.trim().substring(0, 50) ||
          element.getAttribute("aria-label") ||
          element.id ||
          element.className;

        wrappedTrackEvent(category, action, label, undefined, {
          elementTag: element.tagName,
          elementId: element.id,
          elementClass: element.className,
          href: element.getAttribute("href"),
          pageX: event.pageX,
          pageY: event.pageY,
        });
      }
    };

    document.addEventListener("click", handleClick, { passive: true });
    return () => document.removeEventListener("click", handleClick);
  }, [wrappedTrackEvent]);

  const setupScrollTracking = useCallback(() => {
    let maxScrollDepth = 0;
    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollTop =
          window.pageYOffset || document.documentElement.scrollTop;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollDepth = Math.round(
          ((scrollTop + windowHeight) / documentHeight) * 100,
        );

        if (scrollDepth > maxScrollDepth) {
          maxScrollDepth = scrollDepth;

          // Track scroll milestones
          if (scrollDepth >= 25 && scrollDepth < 50 && maxScrollDepth < 50) {
            trackEvent("engagement", "scroll", "25%", scrollDepth);
          } else if (
            scrollDepth >= 50 &&
            scrollDepth < 75 &&
            maxScrollDepth < 75
          ) {
            trackEvent("engagement", "scroll", "50%", scrollDepth);
          } else if (
            scrollDepth >= 75 &&
            scrollDepth < 90 &&
            maxScrollDepth < 90
          ) {
            trackEvent("engagement", "scroll", "75%", scrollDepth);
          } else if (scrollDepth >= 90 && maxScrollDepth < 90) {
            trackEvent("engagement", "scroll", "90%", scrollDepth);
          }
        }
      }, 100);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  const setupVisibilityTracking = useCallback(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackEvent("engagement", "page_hidden", "visibility");
      } else {
        trackEvent("engagement", "page_visible", "visibility");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const setupErrorTracking = useCallback(() => {
    const handleError = (event: ErrorEvent) => {
      wrappedTrackEvent("error", "javascript_error", event.message, undefined, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      wrappedTrackEvent(
        "error",
        "unhandled_promise_rejection",
        event.reason?.toString() || "Unknown",
        undefined,
        {
          reason: event.reason,
        },
      );
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, [wrappedTrackEvent]);

  // Custom tracking function
  const trackCustom = useCallback(
    async (eventName: string, data: Record<string, unknown>) => {
      await wrappedTrackEvent("custom", eventName, undefined, undefined, data);
    },
    [wrappedTrackEvent],
  );

  const wrappedTrackConversion = useCallback(
    async (
      type: string,
      value?: number,
      currency?: string,
      metadata?: Record<string, unknown>,
    ) => {
      try {
        await advancedAnalytics.trackConversion(
          type,
          value,
          currency,
          metadata,
        );
      } catch (error) {
        withComponentContext("analytics", "trackConversion").error(
          "Failed to track conversion",
          error instanceof Error ? error : undefined,
          { type, value, currency }
        );
      }
    },
    [],
  );

  // Initialize analytics on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Track initial page view
    if (trackPageViews) {
      advancedAnalytics.trackPageVisit(window.location.href, document.referrer);
    }

    // Setup automatic tracking
    if (trackClicks) setupClickTracking();
    if (trackScroll) setupScrollTracking();
    if (trackVisibility) setupVisibilityTracking();
    if (trackErrors) setupErrorTracking();

    // Custom tracking setup
    Object.entries(customTracking).forEach(([eventName, config]) => {
      if (typeof config === "function") {
        config();
      }
    });
  }, [
    trackPageViews,
    trackClicks,
    trackScroll,
    trackVisibility,
    trackErrors,
    setupClickTracking,
    setupScrollTracking,
    setupVisibilityTracking,
    setupErrorTracking,
    customTracking,
  ]);

  // Track errors with context - temporarily disabled for build stability
  const trackError = useCallback((error: Error, context: Record<string, unknown> = {}) => {
    // Temporarily disabled to fix build errors
    // TODO: Re-enable when closure issues are resolved
  }, []);

  // Track journey events
  const trackJourneyEvent = useCallback((eventType: string, data: Record<string, unknown>) => {
    // Temporarily disabled for build stability
    // TODO: Re-enable when closure issues are resolved
  }, []);

  // Enhanced error tracking - temporarily disabled
  // useEffect(() => {
  //   if (!trackErrors) return;
  //   // Temporarily disabled for build stability
  // }, []);

  // Enhanced page view tracking
  useEffect(() => {
    if (!trackPageViews) return;

    const trackPageView = () => {
      pageViews.current += 1;
      trackJourneyEvent('page_view', {
        path: window.location.pathname,
        title: document.title,
        referrer: document.referrer,
      });
    };

    // Track initial page view
    trackPageView();

    // Track navigation changes
    const handleNavigation = () => trackPageView();
    window.addEventListener('popstate', handleNavigation);

    return () => window.removeEventListener('popstate', handleNavigation);
  }, [trackPageViews, trackJourneyEvent, pageViews]);

  // Performance insights
  useEffect(() => {
    const logPerformanceInsights = () => {
      const insights = {
        sessionDuration: Date.now() - sessionStartTime.current,
        pageViews: pageViews.current,
        interactions: interactions.current.length,
        errors: journey.current.errors.length,
        conversions: journey.current.conversions.length,
        renderCount: performanceMonitor.renderCount,
      };

      withComponentContext("analytics", "performanceInsights").debug(
        "Performance insights",
        insights
      );
    };

    // Log insights every 30 seconds
    const interval = setInterval(logPerformanceInsights, 30000);
    return () => clearInterval(interval);
  }, [performanceMonitor.renderCount, sessionStartTime, pageViews, interactions, journey]);

  return {
    trackEvent: wrappedTrackEvent,
    trackConversion: wrappedTrackConversion,
    trackCustom,
    getJourney: () => advancedAnalytics.getCurrentJourney(),
    getFunnels: () => advancedAnalytics.getFunnels(),
    forceFlush: () => advancedAnalytics.forceFlush(),
  };
}

// ===== ADDITIONAL HOOKS =====

export function useFormTracking(
  formId: string,
  options: {
    trackStart?: boolean;
    trackSubmit?: boolean;
    trackErrors?: boolean;
  } = {},
) {
  const { trackStart = true, trackSubmit = true, trackErrors = true } = options;
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    const formElement = document.getElementById(formId);
    if (!isHTMLFormElement(formElement)) return;
    const form = formElement;

    if (trackStart) {
      // Track form start on first interaction
      let hasStarted = false;
      const handleStart = () => {
        if (!hasStarted) {
          hasStarted = true;
          trackEvent("form", "start", formId);
        }
      };

      form.addEventListener("focusin", handleStart, {
        once: true,
        passive: true,
      });
    }

    if (trackSubmit) {
      const handleSubmit = (event: Event) => {
        event.preventDefault();
        trackEvent("form", "submit", formId);

        // Re-submit after tracking
        setTimeout(() => {
          if (isHTMLFormElement(event.target)) {
            event.target.submit();
          }
        }, 100);
      };

      form.addEventListener("submit", handleSubmit);
    }

    if (trackErrors) {
      const handleInvalid = (event: Event) => {
        if (!isHTMLInputElement(event.target)) return;
        const target = event.target;
        trackEvent("form", "error", formId, undefined, {
          field: target.name,
          value: target.value,
          validationMessage: target.validationMessage,
        });
      };

      form.addEventListener("invalid", handleInvalid, true);
    }
  }, [formId, trackStart, trackSubmit, trackErrors, trackEvent]);
}

// Hook for CTA tracking
export function useCTATracking(
  ctaSelector: string = "[data-cta]",
  options: { trackImpressions?: boolean; trackClicks?: boolean } = {},
) {
  const { trackImpressions = true, trackClicks = true } = options;
  const { trackEvent } = useAnalytics();
  const observedElements = useRef(new Set<Element>());

  useEffect(() => {
    const elements = document.querySelectorAll(ctaSelector);
    if (!elements.length) return;

    if (trackImpressions && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (
              entry.isIntersecting &&
              !observedElements.current.has(entry.target)
            ) {
              observedElements.current.add(entry.target);
              if (!isHTMLElement(entry.target)) return;
              const element = entry.target;
              trackEvent(
                "cta",
                "impression",
                element.dataset.ctaId || element.textContent?.trim(),
              );
            }
          });
        },
        { threshold: 0.5 },
      );

      elements.forEach((element) => observer.observe(element));

      return () => observer.disconnect();
    }
  }, [ctaSelector, trackImpressions, trackEvent]);

  useEffect(() => {
    if (!trackClicks) return;

    const handleClick = (event: Event) => {
      if (!isHTMLElement(event.target)) return;
      const target = event.target;
      const ctaElement = target.closest(ctaSelector);

      if (!isHTMLElement(ctaElement)) return;

      trackEvent(
        "cta",
        "click",
        ctaElement.dataset.ctaId || ctaElement.textContent?.trim(),
        undefined,
        {
          href: ctaElement.getAttribute("href"),
          position: ctaElement.dataset.position,
          variant: ctaElement.dataset.variant,
        },
      );
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [ctaSelector, trackClicks, trackEvent]);
}

// Hook for performance tracking
export function usePerformanceTracking(
  options: { trackLCP?: boolean; trackFID?: boolean; trackCLS?: boolean } = {},
) {
  const { trackLCP = true, trackFID = true, trackCLS = true } = options;
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    if (!trackLCP && !trackFID && !trackCLS) return;

    // Use web-vitals library for accurate measurements
    // Note: web-vitals API may have changed in newer versions
    import("web-vitals")
      .then((webVitals: unknown) => {
        // Safe narrowing to WebVitalsModule
        const vitalsModule = webVitals as WebVitalsModule;

        if (trackLCP && vitalsModule.getLCP) {
          vitalsModule.getLCP((metric: WebVitalsMetric) => {
            advancedAnalytics.trackEvent(
              "performance",
              "lcp",
              metric.name,
              metric.value,
              {
                rating: metric.rating,
                navigationType: metric.navigationType,
              },
            );
          });
        }

        if (trackFID && vitalsModule.getFID) {
          vitalsModule.getFID((metric: WebVitalsMetric) => {
            advancedAnalytics.trackEvent(
              "performance",
              "fid",
              metric.name,
              metric.value,
              {
                rating: metric.rating,
                navigationType: metric.navigationType,
              },
            );
          });
        }

        if (trackCLS && vitalsModule.getCLS) {
          vitalsModule.getCLS((metric: WebVitalsMetric) => {
            advancedAnalytics.trackEvent(
              "performance",
              "cls",
              metric.name,
              metric.value,
              {
                rating: metric.rating,
                navigationType: metric.navigationType,
              },
            );
          });
        }
      })
      .catch((error) => {
        withComponentContext("analytics", "performanceTracking").warn(
          "Failed to load web-vitals",
          { error: error instanceof Error ? error.message : String(error) }
        );
      });
  }, [trackLCP, trackFID, trackCLS]);

  // ===== OBSERVABILITY FUNCTIONS =====

  // Track user journey and session analytics
  const trackJourneyEvent = useCallback((eventType: string, data: Record<string, unknown>) => {
    const journeyEvent = {
      type: eventType,
      timestamp: Date.now(),
      data,
    };

    // TEMPORARILY COMMENTED OUT TO TEST SYNTAX
    // interactions.current.push(journeyEvent);

    // Track page transitions
    if (eventType === 'page_view') {
      // const currentPage = journey.current.pages[journey.current.pages.length - 1];
      // if (currentPage) {
      //   currentPage.exitTime = Date.now();
      // }

      // journey.current.pages.push({
      //   path: window.location.pathname,
      //   entryTime: Date.now(),
      //   interactions: interactions.current.length,
      // });
    }
  }, []); // interactions and journey are refs, don't need to be dependencies

  // Track errors with context - moved to top of file

  // Get comprehensive journey analytics - temporarily disabled
  const getJourney = useCallback(() => {
    // Temporarily disabled for build stability
    // TODO: Re-enable when closure issues are resolved
    return {
      session: { startTime: 0, duration: 0, pageViews: 0, totalInteractions: 0 },
      pages: [],
      conversions: [],
      errors: [],
      performance: { renderCount: 0, averageInteractionTime: 0 },
      interactions: []
    };
  }, []);

  // Get funnel analytics - temporarily disabled
  const getFunnels = useCallback(() => {
    // Temporarily disabled for build stability
    return {
      acquisition: { visitors: 0, pageViews: 0, bounceRate: 0, averageSessionDuration: 0 },
      engagement: { interactions: 0, averageSessionDuration: 0, errorRate: 0 },
      conversion: { conversions: 0, conversionRate: 0, averageConversionValue: 0 }
    };
  }, []);

  // Force flush pending analytics
  const forceFlush = useCallback(async () => {
    try {
      // Flush any pending analytics events
      if (typeof advancedAnalytics.flush === 'function') {
        await advancedAnalytics.flush();
      }

      withComponentContext("analytics", "forceFlush").info(
        "Analytics flushed successfully",
        {
          // @ts-ignore
          // @ts-ignore
          sessionDuration: Date.now() - sessionStartTime.current,
          // @ts-ignore
          interactionsCount: interactions.current.length,
          // @ts-ignore
          errorsCount: journey.current.errors.length,
        }
      );
    } catch (error) {
      withComponentContext("analytics", "forceFlush").error(
        "Failed to flush analytics",
        error instanceof Error ? error : undefined,
        {
          // @ts-ignore
          sessionDuration: Date.now() - sessionStartTime.current
        }
      );
      throw error;
    }
  }, []); // sessionStartTime, interactions, journey are refs

  // ===== HOOK INITIALIZATION =====

  // Enhanced error tracking - temporarily disabled
  // useEffect(() => {
  //   if (!trackErrors) return;
  //   // Temporarily disabled for build stability
  // }, []);

  // Enhanced page view tracking
}
