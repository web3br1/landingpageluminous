"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
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

interface UXOrchestratorConfig {
  enableChat: boolean;
  enableOnboarding: boolean;
  enableRecommendations: boolean;
  chatDelay: number;
  onboardingDelay: number;
  recommendationsDelay: number;
  autoShowRecommendations: boolean;
}

interface UXOrchestratorProps {
  config?: Partial<UXOrchestratorConfig>;
  debugMode?: boolean;
}

export function UXAdvancedOrchestrator({
  config: userConfig,
  debugMode = false,
}: UXOrchestratorProps) {
  const [uxState, setUXState] = useState({
    chatVisible: false,
    onboardingVisible: false,
    recommendationsVisible: false,
    onboardingCompleted: false,
    hasInteracted: false,
  });

  const [isHydrated, setIsHydrated] = useState(false);
  const { activeSegments, userProfile, trackUserAction } = usePersonalization();

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

    if (debugMode) {
      console.log("UX Orchestrator: Starting orchestration", {
        config,
        userProfile,
        activeSegments,
      });
    }

    const timers: NodeJS.Timeout[] = [];

    // Onboarding flow (highest priority)
    if (shouldShowOnboarding() && !uxState.onboardingVisible) {
      if (debugMode) console.log("UX Orchestrator: Scheduling onboarding");
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
        console.log("UX Orchestrator: Showing chat immediately (debug mode)");
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
        console.log(
          "UX Orchestrator: Showing recommendations immediately (debug mode)",
        );
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
    (eventType: string, data?: any) => {
      trackUserAction("chat_interaction", {
        event_type: eventType,
        ...data,
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
    (eventType: string, data?: any) => {
      trackUserAction("recommendation_interaction", {
        event_type: eventType,
        ...data,
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
        {config.enableChat && uxState.chatVisible && <LiveChat key="chat" />}

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
