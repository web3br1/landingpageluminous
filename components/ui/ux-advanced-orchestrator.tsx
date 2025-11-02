"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { z } from "zod";
import { OptimizedAnimatePresence } from "@/lib/animation/optimized-motion";
import { LiveChat } from "./live-chat";
import { OnboardingFlow } from "../onboarding/onboarding-flow";
import { ProductRecommendations } from "../recommendations/product-recommendations";
import { usePersonalization } from "@/lib/personalization/personalization-context";
import { analytics } from "@/lib/analytics-core";
import {
  readLocalStorage,
  writeLocalStorage,
} from "@/lib/utils/browser-storage";
import { createPropValidator } from "../../lib/architecture/component-props";
import { withComponentContext } from "../../lib/architecture/logger-pattern";

// Cache for UX state calculations (performance optimization)
const uxStateCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30 * 1000; // 30 seconds for UX state

interface UXOrchestratorConfig {
  enableChat: boolean;
  enableOnboarding: boolean;
  enableRecommendations: boolean;
  chatDelay: number;
  onboardingDelay: number;
  recommendationsDelay: number;
  autoShowRecommendations: boolean;
}

// Schema for UXOrchestrator props validation
const UXOrchestratorPropsSchema = z.object({
  config: z.object({
    enableChat: z.boolean().default(true),
    enableOnboarding: z.boolean().default(true),
    enableRecommendations: z.boolean().default(true),
    chatDelay: z.number().min(0).default(3000),
    onboardingDelay: z.number().min(0).default(5000),
    recommendationsDelay: z.number().min(0).default(10000),
    autoShowRecommendations: z.boolean().default(false),
  }).optional().default({
    enableChat: true,
    enableOnboarding: true,
    enableRecommendations: true,
    chatDelay: 3000,
    onboardingDelay: 5000,
    recommendationsDelay: 10000,
    autoShowRecommendations: false,
  }),
  debugMode: z.boolean().default(false),
});

export interface UXOrchestratorProps extends z.infer<typeof UXOrchestratorPropsSchema> {}

// Create prop validator for UXOrchestrator component
const uxOrchestratorPropValidator = createPropValidator(UXOrchestratorPropsSchema, "UXAdvancedOrchestrator", {
  logErrors: true,
  throwOnError: false,
  fallbackValues: {
    debugMode: false,
  },
});

export function UXAdvancedOrchestrator(props: UXOrchestratorProps) {
  // Component-specific logger
  const logger = withComponentContext("UXAdvancedOrchestrator");

  // Validate props using the component-props pattern
  const validatedProps = uxOrchestratorPropValidator.validateWithFallback(props, {
    debugMode: false,
  });

  // Log prop validation if there were issues
  const validationResult = uxOrchestratorPropValidator.validate(props);
  if (!validationResult.success && validationResult.errors.length > 0) {
    logger.warn("UXOrchestrator props validation failed, using fallbacks", {
      errors: validationResult.errors.length,
      debugMode: validatedProps.debugMode,
      hasCustomConfig: !!props.config,
    });
  }

  const { config: userConfig, debugMode } = validatedProps;

  const [uxState, setUXState] = useState({
    chatVisible: false,
    onboardingVisible: false,
    recommendationsVisible: false,
    onboardingCompleted: false,
    hasInteracted: false,
  });

  const [isHydrated, setIsHydrated] = useState(false);
  const { activeSegments, userProfile, trackUserAction } = usePersonalization();

  // Generate cache key for UX state calculations
  const cacheKey = React.useMemo(() => {
    const segmentsKey = activeSegments.map(s => s.id).sort().join(",");
    const configKey = JSON.stringify(userConfig);
    return `ux_${segmentsKey}_${configKey}`;
  }, [activeSegments, userConfig]);

  // Log component initialization
  React.useEffect(() => {
    logger.info("UXAdvancedOrchestrator initialized", {
      segmentsCount: activeSegments.length,
      debugMode,
      hasUserProfile: !!userProfile,
      config: userConfig,
    });
  }, [activeSegments.length, debugMode, userProfile, userConfig, logger]);

  // Only run browser-dependent logic after hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Default configuration - memoized to prevent re-renders
  const config: UXOrchestratorConfig = useMemo(
    () => ({
      enableChat: true,
      enableOnboarding: true,
      enableRecommendations: true,
      chatDelay: 10000, // 10 seconds
      onboardingDelay: 3000, // 3 seconds
      recommendationsDelay: 15000, // 15 seconds
      autoShowRecommendations: true,
      ...userConfig,
    }),
    [userConfig],
  );

  // Check if user should see onboarding
  const shouldShowOnboarding = useCallback(() => {
    if (!config.enableOnboarding || !isHydrated) return false;

    // In debug mode, always show onboarding for testing
    if (debugMode) return true;

    const hasCompletedOnboarding = readLocalStorage(
      "luminaris_onboarding_completed",
    );
    const hasSeenOnboarding = readLocalStorage("luminaris_onboarding_seen");
    const hasProfile = userProfile && Object.keys(userProfile).length > 2;

    return !hasCompletedOnboarding && !hasSeenOnboarding && !hasProfile;
  }, [config.enableOnboarding, userProfile, isHydrated, debugMode]);

  // Check if user should see recommendations
  const shouldShowRecommendations = useCallback(() => {
    if (!config.enableRecommendations || !isHydrated) return false;

    // In debug mode, show recommendations immediately for testing
    if (debugMode) return true;

    // Show recommendations if user has profile and has been on site for a while
    const hasProfile = userProfile && Object.keys(userProfile).length > 2;
    const timeOnSite =
      Date.now() -
      (Number(readLocalStorage("luminaris_first_visit")) || Date.now());
    const hasBeenOnSite = timeOnSite > 60000; // 1 minute

    return hasProfile && hasBeenOnSite && config.autoShowRecommendations;
  }, [
    config.enableRecommendations,
    userProfile,
    config.autoShowRecommendations,
    isHydrated,
    debugMode,
  ]);

  // Separate effect for user interaction tracking (SSR safe)
  useEffect(() => {
    // SSR safety: only run on client-side
    if (typeof document === "undefined") return;

    const handleUserInteraction = () => {
      setUXState((prev) => ({ ...prev, hasInteracted: true }));
    };

    const events = ["click", "scroll", "keydown", "touchstart"];
    events.forEach((event) => {
      document.addEventListener(event, handleUserInteraction, {
        passive: true,
      });
    });

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, []); // Empty dependency array - only run once

  // Separate effect for UX orchestration (stable dependencies)
  useEffect(() => {
    if (!isHydrated) return; // Wait for hydration

    logger.info("UX orchestration started", {
      config,
      hasUserProfile: !!userProfile,
      segmentsCount: activeSegments.length,
      debugMode,
    });

    const timers: NodeJS.Timeout[] = [];

    // Onboarding flow (highest priority)
    if (shouldShowOnboarding() && !uxState.onboardingVisible) {
      logger.debug("Onboarding scheduled", { delay: config.onboardingDelay });
      const onboardingTimer = setTimeout(() => {
        setUXState((prev) => ({ ...prev, onboardingVisible: true }));
        analytics.track("ux_onboarding_triggered", {
          trigger: "auto_delay",
          delay: config.onboardingDelay,
          segments: activeSegments,
        });
      }, config.onboardingDelay);
      timers.push(onboardingTimer);
    }

    // Chat flow (medium priority)
    if ((config.enableChat || debugMode) && !uxState.chatVisible) {
      if (debugMode) {
        logger.info("Chat triggered immediately (debug mode)", {
          segments: activeSegments.map(s => s.name),
        });
        setUXState((prev) => ({ ...prev, chatVisible: true }));
        analytics.track("ux_chat_triggered", {
          trigger: "debug_mode",
          segments: activeSegments,
        });
      } else {
        const chatTimer = setTimeout(() => {
          setUXState((prev) => ({ ...prev, chatVisible: true }));
          analytics.track("ux_chat_triggered", {
            trigger: "auto_delay",
            delay: config.chatDelay,
            segments: activeSegments,
          });
        }, config.chatDelay);
        timers.push(chatTimer);
      }
    }

    // Recommendations flow (lowest priority, after other UX elements)
    if (shouldShowRecommendations() && !uxState.recommendationsVisible) {
      if (debugMode) {
        logger.info("Recommendations triggered immediately (debug mode)", {
          segments: activeSegments.map(s => s.name),
          profileFields: Object.keys(userProfile || {}),
        });
        setUXState((prev) => ({ ...prev, recommendationsVisible: true }));
        analytics.track("ux_recommendations_triggered", {
          trigger: "debug_mode",
          segments: activeSegments,
          profile_fields: Object.keys(userProfile || {}),
        });
      } else {
        const recommendationsTimer = setTimeout(() => {
          setUXState((prev) => ({ ...prev, recommendationsVisible: true }));
          analytics.track("ux_recommendations_triggered", {
            trigger: "auto_delay",
            delay: config.recommendationsDelay,
            segments: activeSegments,
            profile_fields: Object.keys(userProfile || {}),
          });
        }, config.recommendationsDelay);
        timers.push(recommendationsTimer);
      }
    }

    // Cleanup timers
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [
    isHydrated,
    config,
    uxState.onboardingVisible,
    uxState.chatVisible,
    uxState.recommendationsVisible,
    activeSegments,
    debugMode,
    // Note: shouldShowOnboarding and shouldShowRecommendations are not dependencies
    // because they are stable functions that only change when their inputs change
  ]);

  // Handle onboarding completion
  const handleOnboardingComplete = useCallback(() => {
    setUXState((prev) => ({
      ...prev,
      onboardingVisible: false,
      onboardingCompleted: true,
    }));

    analytics.track("ux_onboarding_completed", {
      segments: activeSegments,
      profile_fields: Object.keys(userProfile || {}),
    });

    // After onboarding, show recommendations sooner (memory leak safe)
    let postOnboardingTimer: NodeJS.Timeout | null = null;
    if (config.enableRecommendations && config.autoShowRecommendations) {
      postOnboardingTimer = setTimeout(() => {
        setUXState((prev) => ({ ...prev, recommendationsVisible: true }));
        analytics.track("ux_recommendations_triggered", {
          trigger: "post_onboarding",
          delay: 5000,
          segments: activeSegments,
        });
      }, 5000); // 5 seconds after onboarding
    }

    return () => {
      if (postOnboardingTimer) clearTimeout(postOnboardingTimer);
    };
  }, [activeSegments, userProfile, config]);

  // Handle chat interactions
  const handleChatInteraction = useCallback(
    (eventType: string, data?: unknown) => {
      trackUserAction("chat_interaction", {
        event_type: eventType,
        ...(data && typeof data === 'object' ? data as Record<string, unknown> : {}),
      });

      // If user starts chatting, delay recommendations
      if (eventType === "message_sent") {
        setUXState((prev) => ({ ...prev, recommendationsVisible: false }));
      }
    },
    [trackUserAction],
  );

  // Handle recommendation interactions
  const handleRecommendationInteraction = useCallback(
    (eventType: string, data?: unknown) => {
      trackUserAction("recommendation_interaction", {
        event_type: eventType,
        ...(data && typeof data === 'object' ? data : {}),
      });

      // If user engages with recommendations, show chat sooner (memory leak safe)
      let recommendationChatTimer: NodeJS.Timeout | null = null;
      if (
        eventType === "clicked" &&
        config.enableChat &&
        !uxState.chatVisible
      ) {
        recommendationChatTimer = setTimeout(() => {
          setUXState((prev) => ({ ...prev, chatVisible: true }));
          analytics.track("ux_chat_triggered", {
            trigger: "recommendation_click",
            delay: 3000,
            segments: activeSegments,
          });
        }, 3000);

        // Cleanup timer after it runs
        setTimeout(() => {
          if (recommendationChatTimer) {
            clearTimeout(recommendationChatTimer);
            recommendationChatTimer = null;
          }
        }, 3000);
      }

      return () => {
        if (recommendationChatTimer) clearTimeout(recommendationChatTimer);
      };
    },
    [trackUserAction, config.enableChat, uxState.chatVisible],
  );

  // Smart prioritization based on user behavior
  const getUXPriority = useCallback(() => {
    if (!isHydrated) return null;

    // In debug mode, show current active component as priority
    if (debugMode) {
      if (uxState.onboardingVisible) return "onboarding";
      if (uxState.chatVisible) return "chat";
      if (uxState.recommendationsVisible) return "recommendations";
      return "waiting";
    }

    const hasInteracted = uxState.hasInteracted;
    const isNewUser = !userProfile || Object.keys(userProfile).length < 3;
    const timeOnSite =
      Date.now() -
      (Number(readLocalStorage("luminaris_first_visit")) || Date.now());

    // Priority order: New users get onboarding first, then recommendations, then chat
    // Returning users get recommendations first, then chat
    if (isNewUser && !uxState.onboardingCompleted) {
      return "onboarding";
    } else if (timeOnSite > 120000 && hasInteracted) {
      // 2 minutes + interaction
      return "recommendations";
    } else if (timeOnSite > 30000) {
      // 30 seconds
      return "chat";
    }

    return null;
  }, [
    uxState.hasInteracted,
    uxState.onboardingCompleted,
    uxState.onboardingVisible,
    uxState.chatVisible,
    uxState.recommendationsVisible,
    userProfile,
    isHydrated,
    debugMode,
  ]);

  // Debug component - only render on client after hydration to prevent hydration mismatch
  if (debugMode && isHydrated) {
    return (
      <div className="fixed bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg text-xs z-50 max-w-xs">
        <h4 className="font-bold mb-2">UX Orchestrator Debug</h4>
        <div className="space-y-1">
          <div>Chat: {uxState.chatVisible ? "✅" : "❌"}</div>
          <div>Onboarding: {uxState.onboardingVisible ? "✅" : "❌"}</div>
          <div>
            Recommendations: {uxState.recommendationsVisible ? "✅" : "❌"}
          </div>
          <div>Priority: {getUXPriority()}</div>
          <div>Segments: {activeSegments.length}</div>
          <div>
            Profile: {userProfile ? Object.keys(userProfile).length : 0} fields
          </div>
        </div>
      </div>
    );
  }

  return (
    <OptimizedAnimatePresence mode="wait">
      <>
        {/* Onboarding (highest priority) */}
        {config.enableOnboarding && uxState.onboardingVisible && (
          <OnboardingFlow key="onboarding" />
        )}

        {/* Chat (medium priority) */}
        {config.enableChat && uxState.chatVisible && <LiveChat />}

        {/* Recommendations (lowest priority) */}
        {config.enableRecommendations && uxState.recommendationsVisible && (
          <ProductRecommendations
            key="recommendations"
            position="floating"
            maxItems={3}
            autoShow={false}
            showDelay={0}
          />
        )}
      </>
    </OptimizedAnimatePresence>
  );
}

// Hook for easier usage
export function useUXOrchestrator(config?: Partial<UXOrchestratorConfig>) {
  const [isActive, setIsActive] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    // Initialize UX orchestration
    setIsActive(true);

    // Track first visit (only in browser)
    if (!readLocalStorage("luminaris_first_visit")) {
      writeLocalStorage("luminaris_first_visit", Date.now().toString());
    }

    return () => setIsActive(false);
  }, [isHydrated]);

  const triggerUXElement = useCallback(
    (element: "chat" | "onboarding" | "recommendations") => {
      analytics.track(`ux_manual_trigger_${element}`, {
        triggered_by: "hook",
      });
    },
    [],
  );

  return {
    isActive,
    triggerUXElement,
    config: {
      enableChat: true,
      enableOnboarding: true,
      enableRecommendations: true,
      ...config,
    },
  };
}

// Export the component with error boundary protection
const UXAdvancedOrchestratorWithErrorBoundary = withErrorBoundary(UXAdvancedOrchestrator, {
  componentName: "UXAdvancedOrchestrator",
  fallback: (error, retry) => (
    <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg max-w-sm">
      <div className="flex">
        <div className="py-1">
          <svg className="fill-current h-6 w-6 text-red-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M2.93 17.07A10 10 0 1 1 17.07 2.93 10 10 0 0 1 2.93 17.07zm12.73-1.41A8 8 0 1 0 4.34 4.34a8 8 0 0 0 11.32 11.32zM9 11V9h2v6H9v-4zm0-6h2v2H9V5z"/>
          </svg>
        </div>
        <div>
          <p className="font-bold">UX System Error</p>
          <p className="text-sm">
            Something went wrong with the user experience orchestration.{" "}
            <button
              onClick={retry}
              className="underline hover:no-underline"
            >
              Try again
            </button>
          </p>
        </div>
      </div>
    </div>
  ),
  maxRetries: 3,
  onError: (error) => {
    // Log error with component context
    const logger = withComponentContext("UXAdvancedOrchestrator");
    logger.error("UXAdvancedOrchestrator crashed", error, {
      component: "UXAdvancedOrchestrator",
      hasErrorBoundary: true,
      severity: "critical",
    });
  },
});

export { UXAdvancedOrchestratorWithErrorBoundary };
export default UXAdvancedOrchestratorWithErrorBoundary;
