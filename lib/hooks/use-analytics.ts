"use client";

import { useEffect, useRef } from "react";
import { analytics } from "../analytics-core";
import { flags } from "../flags";
import {
  useDebouncedScroll,
  useThrottledIntersectionObserver,
} from "./use-performance-circuit-breaker";

// Hook para tracking de visualização de seção (SSR safe com circuit breaker)
export function useSectionTracking(sectionName: string) {
  const hasTracked = useRef(false);

  const { ref } = useThrottledIntersectionObserver(
    (entry) => {
      if (entry.isIntersecting && !hasTracked.current) {
        analytics.trackView(sectionName);
        hasTracked.current = true;
      }
    },
    { threshold: 0.5 },
    200, // Throttle 200ms
  );

  useEffect(() => {
    // SSR safety: only run on client-side
    if (typeof window === "undefined" || typeof document === "undefined")
      return;
    if (hasTracked.current) return;

    const element = document.getElementById(
      sectionName.toLowerCase().replace(/\s+/g, "-"),
    );
    if (element) {
      ref(element);
    }
  }, [sectionName, ref]);
}

// Hook para tracking de scroll depth (SSR safe com circuit breaker)
export function useScrollTracking() {
  const maxScrollRef = useRef(0);

  useDebouncedScroll((scrollY) => {
    try {
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollY / docHeight) * 100);

      // Track milestones: 25%, 50%, 75%, 90%
      const milestones = [25, 50, 75, 90];
      milestones.forEach((milestone) => {
        if (scrollPercent >= milestone && maxScrollRef.current < milestone) {
          analytics.trackScroll(milestone);
          maxScrollRef.current = milestone;
        }
      });
    } catch (error) {
      // Silently handle scroll errors (e.g., during navigation)
      console.warn("[Analytics] Scroll tracking error:", error);
    }
  }, 100); // Debounce 100ms
}

// Hook para tracking de tempo na página (SSR safe)
export function useTimeOnPageTracking() {
  useEffect(() => {
    // SSR safety: only run on client-side
    if (typeof window === "undefined") return;

    const startTime = Date.now();
    let hasTracked = false;

    const trackTime = () => {
      if (hasTracked) return;

      const timeSpent = Math.floor((Date.now() - startTime) / 1000);
      // Track após 30 segundos, 1 minuto, 2 minutos, 5 minutos
      const milestones = [30, 60, 120, 300];

      milestones.forEach((milestone) => {
        if (timeSpent >= milestone && !hasTracked) {
          analytics.trackTimeOnPage(milestone);
          hasTracked = true;
        }
      });
    };

    const interval = setInterval(trackTime, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);
}

// Hook para tracking de CTA clicks
export function useCtaTracking(ctaText: string, location: string) {
  const handleClick = () => {
    try {
      analytics.trackCtaClick(ctaText, location);
    } catch (error) {
      // Silently fail in production to not break user experience
      // In tests, we want to know about analytics failures
      if (process.env.NODE_ENV === "test") {
        throw error;
      }
      console.error("Analytics error:", error);
    }
  };

  return handleClick;
}

// Hook para tracking de experimentos A/B (SSR safe)
export function useExperimentTracking(experimentId: string, variant: string) {
  useEffect(() => {
    // SSR safety: only run on client-side
    if (typeof window === "undefined") return;

    analytics.trackExperiment(experimentId, variant, "impression");
  }, [experimentId, variant]);
}

// Hook para tracking de formulários
export function useFormTracking(formName: string) {
  const trackSubmit = (success: boolean, error?: string) => {
    analytics.trackSubmit(formName, success, error);
  };

  return trackSubmit;
}

// Hook principal que combina todos os trackings
export function useAnalytics() {
  useScrollTracking();
  useTimeOnPageTracking();

  // Inicializar analytics se consentimento foi dado
  useEffect(() => {
    analytics.init();
  }, []);
}
