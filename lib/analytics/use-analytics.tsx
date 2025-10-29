"use client";

import { useEffect, useCallback, useRef } from "react";
import {
  advancedAnalytics,
  trackEvent,
  trackConversion,
} from "./advanced-analytics";

interface UseAnalyticsOptions {
  trackPageViews?: boolean;
  trackClicks?: boolean;
  trackScroll?: boolean;
  trackVisibility?: boolean;
  trackErrors?: boolean;
  customTracking?: Record<string, any>;
}

interface AnalyticsHookReturn {
  trackEvent: (
    category: string,
    action: string,
    label?: string,
    value?: number,
    context?: Record<string, any>,
  ) => Promise<void>;
  trackConversion: (
    type: string,
    value?: number,
    currency?: string,
    metadata?: Record<string, any>,
  ) => Promise<void>;
  trackCustom: (eventName: string, data: Record<string, any>) => Promise<void>;
  getJourney: () => any;
  getFunnels: () => Record<string, any>;
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

  const hasInitialized = useRef(false);

  // All useCallback declarations happen here

  // Wrapper functions that handle the async nature
  const wrappedTrackEvent = useCallback(
    async (
      category: string,
      action: string,
      label?: string,
      value?: number,
      context?: Record<string, any>,
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
        console.warn("[Analytics] Failed to track event:", error);
      }
    },
    [],
  );

  const setupClickTracking = useCallback(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const clickableElement = target.closest(
        'a, button, [role="button"], [data-track-click]',
      );

      if (clickableElement) {
        const element = clickableElement as HTMLElement;
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
    async (eventName: string, data: Record<string, any>) => {
      await wrappedTrackEvent("custom", eventName, undefined, undefined, data);
    },
    [wrappedTrackEvent],
  );

  const wrappedTrackConversion = useCallback(
    async (
      type: string,
      value?: number,
      currency?: string,
      metadata?: Record<string, any>,
    ) => {
      try {
        await advancedAnalytics.trackConversion(
          type,
          value,
          currency,
          metadata,
        );
      } catch (error) {
        console.warn("[Analytics] Failed to track conversion:", error);
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

  return {
    trackEvent: wrappedTrackEvent,
    trackConversion: wrappedTrackConversion,
    trackCustom,
    getJourney: () => advancedAnalytics.getCurrentJourney(),
    getFunnels: () => advancedAnalytics.getFunnels(),
    forceFlush: () => advancedAnalytics.forceFlush(),
  };
}

// Hook for form tracking
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
    const form = document.getElementById(formId) as HTMLFormElement;
    if (!form) return;

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
          (event.target as HTMLFormElement).submit();
        }, 100);
      };

      form.addEventListener("submit", handleSubmit);
    }

    if (trackErrors) {
      const handleInvalid = (event: Event) => {
        const target = event.target as HTMLInputElement;
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
              const element = entry.target as HTMLElement;
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
      const target = event.target as HTMLElement;
      const ctaElement = target.closest(ctaSelector) as HTMLElement;

      if (ctaElement) {
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
      }
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
      .then((webVitals: any) => {
        if (trackLCP && webVitals.getLCP) {
          webVitals.getLCP((metric: any) => {
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

        if (trackFID && webVitals.getFID) {
          webVitals.getFID((metric: any) => {
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

        if (trackCLS && webVitals.getCLS) {
          webVitals.getCLS((metric: any) => {
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
        console.warn("[PerformanceTracking] Failed to load web-vitals:", error);
      });
  }, [trackLCP, trackFID, trackCLS]);
}
