import { SectionId } from "../registry/section-registry";
import { storageManager, AtomicStorage, PrivacyBehaviorStorage } from "../../lazy-loading/core/storage-manager";

/**
 * Journey Heuristics - Phase 2
 * Simple, deterministic behavior-based loading without ML or user profiling
 *
 * Uses explicit user actions to prioritize loading:
 * - Opened pricing → prioritize CTA blocks
 * - Opened FAQ → preload capture blocks
 * - Scrolled deeply → load social proof
 */

export interface UserBehaviorSignals {
  // Explicit actions (not inferred)
  openedSections: Set<SectionId>;
  scrollDepth: number; // 0-100
  timeSpent: number; // seconds

  // Direct interactions
  clickedPricing: boolean;
  clickedFAQ: boolean;
  hoveredCTA: boolean;
}

export interface LoadingPriorityAdjustment {
  sectionId: SectionId;
  priorityBoost: number; // -1 to +2
  reason: string;
}

/**
 * Journey Heuristics Engine - Phase 2
 * Deterministic rules based on explicit user behavior
 */
export class JourneyHeuristicsEngine {
  /**
   * Calculate loading priority adjustments based on user behavior
   * No ML, no profiling - just explicit actions
   */
  static calculatePriorityAdjustments(
    signals: UserBehaviorSignals,
    availableSections: SectionId[]
  ): LoadingPriorityAdjustment[] {
    const adjustments: LoadingPriorityAdjustment[] = [];

    // Rule 1: If user opened pricing, boost CTA-related sections
    if (signals.openedSections.has("pricing")) {
      // Prioritize founder pass, trial signup, contact
      const ctaSections = availableSections.filter(id =>
        id.includes("cta") || id.includes("founder") || id.includes("contact")
      );

      ctaSections.forEach(sectionId => {
        adjustments.push({
          sectionId,
          priorityBoost: 2,
          reason: "user_opened_pricing"
        });
      });
    }

    // Rule 2: If user opened FAQ, preload capture/conversion sections
    if (signals.openedSections.has("faq")) {
      const captureSections = availableSections.filter(id =>
        id.includes("capture") || id.includes("signup") || id.includes("demo")
      );

      captureSections.forEach(sectionId => {
        adjustments.push({
          sectionId,
          priorityBoost: 1,
          reason: "user_opened_faq"
        });
      });
    }

    // Rule 3: If user scrolled >60%, load social proof earlier
    if (signals.scrollDepth > 60) {
      const socialSections = availableSections.filter(id =>
        id.includes("social") || id.includes("testimonials") || id.includes("logos")
      );

      socialSections.forEach(sectionId => {
        adjustments.push({
          sectionId,
          priorityBoost: 1,
          reason: "deep_scroll_detected"
        });
      });
    }

    // Rule 4: If user spent significant time, load engagement sections
    if (signals.timeSpent > 45) { // 45 seconds
      const engagementSections = availableSections.filter(id =>
        id.includes("features") || id.includes("demo") || id.includes("video")
      );

      engagementSections.forEach(sectionId => {
        adjustments.push({
          sectionId,
          priorityBoost: 1,
          reason: "extended_engagement"
        });
      });
    }

    // Rule 5: If user clicked pricing specifically, boost conversion
    if (signals.clickedPricing) {
      const conversionSections = availableSections.filter(id =>
        id.includes("pricing") || id.includes("comparison") || id.includes("calculator")
      );

      conversionSections.forEach(sectionId => {
        adjustments.push({
          sectionId,
          priorityBoost: 2,
          reason: "pricing_interaction"
        });
      });
    }

    // Rule 6: If user hovered CTA, preload related conversion elements
    if (signals.hoveredCTA) {
      const conversionSections = availableSections.filter(id =>
        id.includes("modal") || id.includes("form") || id.includes("checkout")
      );

      conversionSections.forEach(sectionId => {
        adjustments.push({
          sectionId,
          priorityBoost: 1,
          reason: "cta_hover"
        });
      });
    }

    return adjustments;
  }

  /**
   * Get recommended loading strategy based on current behavior
   */
  static getRecommendedStrategy(
    signals: UserBehaviorSignals
  ): {
    beMoreAggressive: boolean;
    focusSections: SectionId[];
    reason: string;
  } {
    // If user shows clear buying intent, be more aggressive
    if (signals.openedSections.has("pricing") && signals.clickedPricing) {
      return {
        beMoreAggressive: true,
        focusSections: ["cta" as SectionId, "founder-offer" as SectionId, "contact" as SectionId],
        reason: "strong_conversion_signals"
      };
    }

    // If user is exploring deeply, load more content
    if (signals.scrollDepth > 70 && signals.timeSpent > 60) {
      return {
        beMoreAggressive: true,
        focusSections: ["features" as SectionId, "social-proof" as SectionId, "testimonials" as SectionId],
        reason: "deep_engagement_detected"
      };
    }

    // If user just opened FAQ, focus on conversion
    if (signals.openedSections.has("faq")) {
      return {
        beMoreAggressive: false,
        focusSections: ["capture" as SectionId, "demo-request" as SectionId],
        reason: "faq_exploration"
      };
    }

    // Default: balanced approach
    return {
      beMoreAggressive: false,
      focusSections: [],
      reason: "balanced_default"
    };
  }
}

/**
 * Behavior Tracker Hook - Phase 2
 * Tracks explicit user actions without profiling
 */
export function useBehaviorTracker() {
  // Track opened sections with atomic operations and LRU cache
  const trackSectionOpened = async (sectionId: SectionId) => {
    await AtomicStorage.atomicUpdate(
      "openedSections",
      (current: Set<SectionId> | null) => {
        const opened = current || new Set<SectionId>();
        opened.add(sectionId);
        return opened;
      },
      new Set<SectionId>()
    );
  };

  // Track scroll depth with atomic max operation
  const trackScrollDepth = async (depth: number) => {
    await AtomicStorage.atomicUpdate(
      "ll_max_scroll_depth",
      (current: number | null) => Math.max(current || 0, depth),
      depth
    );
  };

  // Track time spent
  const trackTimeSpent = async (seconds: number) => {
    await storageManager.setItem("timeSpent", seconds);
  };

  // Track pricing clicks (sensitive - use encrypted storage)
  const trackPricingClick = async () => {
    await PrivacyBehaviorStorage.storeBehavior("ll_clicked_pricing", true);
  };

  // Track FAQ clicks (sensitive - use encrypted storage)
  const trackFAQClick = async () => {
    await PrivacyBehaviorStorage.storeBehavior("ll_clicked_faq", true);
  };

  // Track CTA hovers (sensitive - use encrypted storage)
  const trackCTAHover = async () => {
    await PrivacyBehaviorStorage.storeBehavior("ll_hovered_cta", true);
  };

  // Get current signals (ll_ prefix for unified logging)
  const getCurrentSignals = (): UserBehaviorSignals => {
    // Note: PrivacyBehaviorStorage.retrieveBehavior is async, but we need sync for this context
    // For now, use direct access to storageManager for sensitive data retrieval
    return {
      openedSections: storageManager.getItem("openedSections") || new Set<SectionId>(),
      scrollDepth: storageManager.getItem("ll_max_scroll_depth") || 0,
      timeSpent: storageManager.getItem("timeSpent") || 0,
      clickedPricing: storageManager.getItem("ll_clicked_pricing") || false,
      clickedFAQ: storageManager.getItem("ll_clicked_faq") || false,
      hoveredCTA: storageManager.getItem("ll_hovered_cta") || false,
    };
  };

  return {
    trackSectionOpened,
    trackScrollDepth,
    trackTimeSpent,
    trackPricingClick,
    trackFAQClick,
    trackCTAHover,
    getCurrentSignals,
  };
}

/**
 * Async version of behavior tracker with encrypted data access
 */
export function useEncryptedBehaviorTracker() {
  const { trackPricingClick, trackFAQClick, trackCTAHover } = useBehaviorTracker();

  // Async version that can retrieve encrypted data
  const getEncryptedSignals = async (): Promise<UserBehaviorSignals> => {
    const [clickedPricing, clickedFAQ, hoveredCTA] = await Promise.all([
      PrivacyBehaviorStorage.retrieveBehavior("ll_clicked_pricing"),
      PrivacyBehaviorStorage.retrieveBehavior("ll_clicked_faq"),
      PrivacyBehaviorStorage.retrieveBehavior("ll_hovered_cta"),
    ]);

    return {
      openedSections: storageManager.getItem("openedSections") || new Set<SectionId>(),
      scrollDepth: storageManager.getItem("ll_max_scroll_depth") || 0,
      timeSpent: storageManager.getItem("timeSpent") || 0,
      clickedPricing: clickedPricing || false,
      clickedFAQ: clickedFAQ || false,
      hoveredCTA: hoveredCTA || false,
    };
  };

  return {
    trackPricingClick,
    trackFAQClick,
    trackCTAHover,
    getEncryptedSignals,
  };
}

/**
 * Integration with Scaffold B - Section Composer Enhancement
 */
export interface BehaviorAwareComposerResponse {
  sectionId: SectionId;
  content: React.ComponentType;
  basePriority: "hero" | "early" | "deferred";

  // Behavior-based adjustments
  behaviorRules?: {
    boostOnPricingOpen?: number;
    boostOnDeepScroll?: number;
    boostOnFAQOpen?: number;
  };
}

// Hook for behavior-aware loading decisions
export function useBehaviorAwareLoading(
  composerResponse: BehaviorAwareComposerResponse,
  signals: UserBehaviorSignals
) {
  const basePriority = composerResponse.basePriority;

  // Calculate behavior-based priority boost
  const getPriorityBoost = (): number => {
    let boost = 0;

    if (composerResponse.behaviorRules) {
      const rules = composerResponse.behaviorRules;

      if (rules.boostOnPricingOpen && signals.openedSections.has("pricing")) {
        boost += rules.boostOnPricingOpen;
      }

      if (rules.boostOnDeepScroll && signals.scrollDepth > 60) {
        boost += rules.boostOnDeepScroll;
      }

      if (rules.boostOnFAQOpen && signals.openedSections.has("faq")) {
        boost += rules.boostOnFAQOpen;
      }
    }

    return Math.min(boost, 2); // Cap at +2
  };

  const priorityBoost = getPriorityBoost();

  // Map to loading strategy
  const getStrategy = (): "eager" | "progressive" | "deferred" => {
    if (basePriority === "hero") return "eager";
    if (basePriority === "early") return priorityBoost > 0 ? "eager" : "progressive";
    return priorityBoost > 1 ? "progressive" : "deferred";
  };

  return {
    effectivePriority: basePriority,
    strategy: getStrategy(),
    priorityBoost,
    reason: priorityBoost > 0 ? "behavior_boost" : "base_priority"
  };
}

// Example usage in a Section Composer
export function createCTASectionComposer(): BehaviorAwareComposerResponse {
  return {
    sectionId: "cta-final" as SectionId,
    content: React.lazy(() => import("@/components/sections/final-cta")),
    basePriority: "early",

    // Behavior rules - boost loading when user shows buying intent
    behaviorRules: {
      boostOnPricingOpen: 2, // Max boost when pricing is opened
      boostOnDeepScroll: 1, // Moderate boost on deep scroll
      boostOnFAQOpen: 1, // Moderate boost when FAQ is opened
    },
  };
}

