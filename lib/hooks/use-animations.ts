"use client";

import { Variants } from "framer-motion";
import { useReducedMotion } from "./use-reduced-motion";
import {
  ANIMATION_PRESETS,
  ANIMATION_GROUPS,
  type AnimationPresetKey,
  type AnimationGroupKey,
} from "@/lib/theme/animations";

// Simplified animation hook for production use
export function useAnimations() {
  const prefersReducedMotion = useReducedMotion();

  // Get animation with reduced motion support
  const getAnimation = (preset: AnimationPresetKey): Variants => {
    const animation = ANIMATION_PRESETS[preset];

    if (prefersReducedMotion) {
      // Return simplified animation for reduced motion
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
      } as Variants;
    }

    return animation as Variants;
  };

  // Get animation group
  const getAnimationGroup = (group: AnimationGroupKey) => {
    const groupAnimations = ANIMATION_GROUPS[group];
    const processedGroup: Record<string, Variants> = {};

    for (const [key, animation] of Object.entries(groupAnimations)) {
      processedGroup[key] = prefersReducedMotion
        ? ({ initial: { opacity: 0 }, animate: { opacity: 1 } } as Variants)
        : (animation as Variants);
    }

    return processedGroup;
  };

  // Common animation shortcuts
  const animations = {
    // Basic animations
    fadeIn: getAnimation("fadeIn"),
    fadeUp: getAnimation("fadeUp"),
    slideUp: getAnimation("slideUp"),
    slideDown: getAnimation("slideDown"),
    slideLeft: getAnimation("slideLeft"),
    slideRight: getAnimation("slideRight"),

    // Interactive animations
    hoverLift: getAnimation("hoverLift"),
    buttonTap: getAnimation("buttonTap"),
    buttonHover: getAnimation("buttonHover"),
    cardHover: getAnimation("cardHover"),

    // Continuous animations
    float: getAnimation("float"),
    floatSlow: getAnimation("floatSlow"),
    pulse: getAnimation("pulse"),
    pulseGlow: getAnimation("pulseGlow"),

    // Scroll animations
    scrollFadeUp: getAnimation("scrollFadeUp"),
    scrollScaleIn: getAnimation("scrollScaleIn"),

    // Stagger animations
    staggerContainer: getAnimation("staggerContainer"),
    staggerItem: getAnimation("staggerItem"),

    // Groups
    hero: getAnimationGroup("hero"),
    cardGrid: getAnimationGroup("cardGrid"),
    navigation: getAnimationGroup("navigation"),
    form: getAnimationGroup("form"),
    loading: getAnimationGroup("loading"),
  };

  return {
    animations,
    prefersReducedMotion,
    getAnimation,
    getAnimationGroup,
  };
}

// Type exports
export type { AnimationPresetKey, AnimationGroupKey };
