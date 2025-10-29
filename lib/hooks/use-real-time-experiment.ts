// React Hook for Real-Time A/B Testing
// Provides theme assignment and event tracking for components

import { useState, useEffect, useCallback } from "react";
import {
  assignRealTimeExperiment,
  trackExperimentEvent,
  getExperimentAnalytics,
  checkAutoRollout,
  type ExperimentConfig,
} from "@/lib/ab-testing/real-time-experiments";

interface ExperimentState {
  variant: string;
  themeId: string;
  experimentId: string;
  customTokens?: Record<string, any>;
  shouldTrack: boolean;
  isLoading: boolean;
}

interface ExperimentActions {
  trackEvent: (eventName: string, value?: number | boolean) => void;
  trackConversion: (value?: number) => void;
  trackEngagement: (metric?: string) => void;
}

export function useRealTimeExperiment(
  experimentId: string,
  userId?: string,
  context: {
    userAgent?: string;
    country?: string;
    device?: "mobile" | "tablet" | "desktop";
    userType?: "new" | "returning" | "premium";
    referrer?: string;
  } = {},
): ExperimentState & ExperimentActions {
  const [state, setState] = useState<ExperimentState>({
    variant: "control",
    themeId: "liquid-glass",
    experimentId,
    shouldTrack: false,
    isLoading: true,
  });

  const [sessionId] = useState(() => crypto.randomUUID());

  // Generate user ID if not provided
  const finalUserId = userId || `anon_${crypto.randomUUID().slice(0, 8)}`;

  // Initialize experiment assignment
  useEffect(() => {
    const assignment = assignRealTimeExperiment(
      experimentId,
      finalUserId,
      context,
    );

    setState({
      variant: assignment.variant,
      themeId: assignment.themeId,
      experimentId: assignment.experimentId,
      customTokens: assignment.customTokens,
      shouldTrack: assignment.shouldTrack,
      isLoading: false,
    });

    // Track experiment exposure
    if (assignment.shouldTrack) {
      trackExperimentEvent(
        experimentId,
        assignment.variant,
        finalUserId,
        sessionId,
        "experiment_exposure",
        true,
        {
          ...context,
          userAgent: context.userAgent || "",
        },
      );
    }
  }, [experimentId, finalUserId, sessionId]);

  // Track events (async with error handling)
  const trackEvent = useCallback(
    async (eventName: string, value: number | boolean = 1) => {
      if (!state.shouldTrack) return;

      try {
        await trackExperimentEvent(
          experimentId,
          state.variant,
          finalUserId,
          sessionId,
          eventName,
          value,
          {
            ...context,
            userAgent: context.userAgent || "",
          },
        );
      } catch (error) {
        // Silently handle tracking errors to avoid breaking user experience
        console.warn("[Experiment Tracking] Failed to track event:", error);
      }
    },
    [
      experimentId,
      state.variant,
      state.shouldTrack,
      finalUserId,
      sessionId,
      context,
    ],
  );

  // Track conversions (primary metric)
  const trackConversion = useCallback(
    (value: number = 1) => {
      trackEvent("conversion", value);
    },
    [trackEvent],
  );

  // Track feature engagement
  const trackEngagement = useCallback(
    (metric: string = "feature_click") => {
      trackEvent(metric, 1);
    },
    [trackEvent],
  );

  // Auto-track scroll depth (SSR safe with memory leak prevention)
  useEffect(() => {
    // Only run on client-side and when tracking is enabled
    if (
      !state.shouldTrack ||
      typeof window === "undefined" ||
      typeof document === "undefined"
    )
      return;

    let maxScrollDepth = 0;
    let isMounted = true; // Prevent memory leaks if component unmounts during async operations

    const handleScroll = () => {
      if (!isMounted) return;

      try {
        const scrollTop = window.scrollY;
        const documentHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent =
          documentHeight > 0 ? (scrollTop / documentHeight) * 100 : 0;

        if (scrollPercent > maxScrollDepth) {
          maxScrollDepth = scrollPercent;

          // Track significant scroll milestones
          if (maxScrollDepth >= 25 && maxScrollDepth < 50) {
            trackEvent("scroll_25");
          } else if (maxScrollDepth >= 50 && maxScrollDepth < 75) {
            trackEvent("scroll_50");
          } else if (maxScrollDepth >= 75) {
            trackEvent("scroll_75");
          }
        }
      } catch (error) {
        // Silently handle scroll errors (e.g., during navigation)
        console.warn("[A/B Tracking] Scroll tracking error:", error);
      }
    };

    const handleTimeOnPage = () => {
      if (!isMounted) return;
      trackEvent("time_on_page", Date.now());
    };

    try {
      window.addEventListener("scroll", handleScroll, { passive: true });

      // Track time on page every 30 seconds
      const timeInterval = setInterval(handleTimeOnPage, 30000);

      return () => {
        isMounted = false;
        window.removeEventListener("scroll", handleScroll);
        clearInterval(timeInterval);
      };
    } catch (error) {
      // Handle cases where event listeners fail (e.g., during SSR hydration issues)
      console.warn("[A/B Tracking] Failed to setup scroll tracking:", error);
      return () => {
        isMounted = false;
      };
    }
  }, [state.shouldTrack, trackEvent]);

  // Auto-track page visibility changes (SSR safe with memory leak prevention)
  useEffect(() => {
    // Only run on client-side and when tracking is enabled
    if (!state.shouldTrack || typeof document === "undefined") return;

    let isMounted = true; // Prevent memory leaks if component unmounts during async operations

    const handleVisibilityChange = () => {
      if (!isMounted) return;

      try {
        if (document.hidden) {
          trackEvent("page_hidden");
        } else {
          trackEvent("page_visible");
        }
      } catch (error) {
        // Silently handle visibility errors
        console.warn("[A/B Tracking] Visibility tracking error:", error);
      }
    };

    try {
      document.addEventListener("visibilitychange", handleVisibilityChange);

      return () => {
        isMounted = false;
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange,
        );
      };
    } catch (error) {
      // Handle cases where event listeners fail
      console.warn(
        "[A/B Tracking] Failed to setup visibility tracking:",
        error,
      );
      return () => {
        isMounted = false;
      };
    }
  }, [state.shouldTrack, trackEvent]);

  return {
    ...state,
    trackEvent,
    trackConversion,
    trackEngagement,
  };
}

// Hook for experiment analytics (admin dashboard)
export function useExperimentAnalytics(experimentId: string) {
  const [analytics, setAnalytics] =
    useState<ReturnType<typeof getExperimentAnalytics>>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAnalytics = useCallback(() => {
    const data = getExperimentAnalytics(experimentId);
    setAnalytics(data);
    setIsLoading(false);
  }, [experimentId]);

  useEffect(() => {
    refreshAnalytics();

    // Refresh analytics every 30 seconds
    const interval = setInterval(refreshAnalytics, 30000);

    return () => clearInterval(interval);
  }, []); // refreshAnalytics is memoized, no need to include it

  const checkRollout = useCallback(() => {
    const rolledOut = checkAutoRollout(experimentId);
    if (rolledOut) {
      refreshAnalytics(); // Refresh data after rollout
    }
    return rolledOut;
  }, [experimentId, refreshAnalytics]);

  return {
    analytics,
    isLoading,
    refreshAnalytics,
    checkRollout,
  };
}

// Hook for multiple experiments
export function useMultipleExperiments(
  experiments: Array<{
    id: string;
    userId?: string;
    context?: Parameters<typeof useRealTimeExperiment>[2];
  }>,
) {
  const [results, setResults] = useState<
    Record<string, ExperimentState & ExperimentActions>
  >({});

  experiments.forEach(({ id, userId, context }) => {
    const experiment = useRealTimeExperiment(id, userId, context);

    if (!results[id]) {
      results[id] = experiment;
    }
  });

  return results;
}

// Utility hook for CTA tracking
export function useExperimentCTA(experimentId: string, userId?: string) {
  const experiment = useRealTimeExperiment(experimentId, userId);

  const handleCTAClick = useCallback(
    (ctaType: string = "primary") => {
      experiment.trackEvent(`cta_click_${ctaType}`);
      experiment.trackConversion(1);
    },
    [experiment],
  );

  const handleCTAView = useCallback(
    (ctaType: string = "primary") => {
      experiment.trackEvent(`cta_view_${ctaType}`);
    },
    [experiment],
  );

  return {
    ...experiment,
    handleCTAClick,
    handleCTAView,
  };
}
