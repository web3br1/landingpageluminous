import { useMemo } from "react";
import {
  SCROLL_CONFIG,
  DEFAULT_CHAPTERS,
  TRANSITION_TYPES,
  CHAPTER_TYPES,
  NAVIGATION_VARIANTS,
  STEPPER_VARIANTS,
  DEBUG_CONFIG,
  ANALYTICS_EVENTS,
  SCROLL_FEATURES,
} from "./scroll-config";

/**
 * Hook for accessing scroll configuration
 * Provides memoized access to all scroll-related constants and configurations
 */
export function useScrollConfig() {
  return useMemo(
    () => ({
      // Performance constants
      scrollThrottle: SCROLL_CONFIG.SCROLL_THROTTLE_MS,
      chapterChangeDebounce: SCROLL_CONFIG.CHAPTER_CHANGE_DEBOUNCE_MS,
      transitionDuration: SCROLL_CONFIG.TRANSITION_DURATION_MS,
      transitionEase: SCROLL_CONFIG.TRANSITION_EASE,

      // Pinning configuration
      pinOffsetMultiplier: SCROLL_CONFIG.PIN_OFFSET_MULTIPLIER,
      pinStartMultiplier: SCROLL_CONFIG.PIN_START_MULTIPLIER,
      pinEndMultiplier: SCROLL_CONFIG.PIN_END_MULTIPLIER,

      // Navigation
      keyboardNavigationDebounce: SCROLL_CONFIG.KEYBOARD_NAVIGATION_DEBOUNCE_MS,

      // Breakpoints
      mobileBreakpoint: SCROLL_CONFIG.MOBILE_BREAKPOINT,
      tabletBreakpoint: SCROLL_CONFIG.TABLET_BREAKPOINT,

      // Accessibility
      touchTargetSize: SCROLL_CONFIG.TOUCH_TARGET_SIZE,
      focusRingSize: SCROLL_CONFIG.FOCUS_RING_SIZE,

      // Default chapters
      defaultChapters: DEFAULT_CHAPTERS,

      // Types and variants
      transitionTypes: TRANSITION_TYPES,
      chapterTypes: CHAPTER_TYPES,
      navigationVariants: NAVIGATION_VARIANTS,
      stepperVariants: STEPPER_VARIANTS,

      // Debug configuration
      debug: DEBUG_CONFIG,

      // Analytics events
      analyticsEvents: ANALYTICS_EVENTS,

      // Feature flags
      features: SCROLL_FEATURES,
    }),
    [],
  );
}

export type ScrollConfig = ReturnType<typeof useScrollConfig>;
