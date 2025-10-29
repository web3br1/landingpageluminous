// ===== ANIMATION SYSTEM =====
// Sistema de animações com suporte a reduced motion

import { useState, useEffect, useRef, useCallback } from "react";

/** Animation defaults */
export const ANIMATION_DEFAULTS = {
  duration: 300,
  delay: 0,
  easing: "ease-out",
  reducedMotionDuration: 0,
} as const;

/** Easing functions */
export const EASING_FUNCTIONS = {
  linear: "linear",
  "ease-in": "cubic-bezier(0.4, 0.0, 1, 1)",
  "ease-out": "cubic-bezier(0.0, 0.0, 0.2, 1)",
  "ease-in-out": "cubic-bezier(0.4, 0.0, 0.2, 1)",
} as const;

/** Animation configuration */
export interface AnimationConfig {
  duration?: number;
  delay?: number;
  easing?: string;
  repeat?: number;
  direction?: "normal" | "reverse" | "alternate" | "alternate-reverse";
  transition?: {
    duration?: number;
    delay?: number;
    easing?: string;
    repeat?: number;
    direction?: "normal" | "reverse" | "alternate" | "alternate-reverse";
  };
  // Animation properties
  opacity?: number | [number, number];
  y?: number | [number, number];
  scale?: number | [number, number];
}

/** Reduced motion preference */
export type ReducedMotionPreference = "reduce" | "no-preference";

/** Global reduced motion state for testing */
let globalReducedMotion: boolean | null = null;

/** Get reduced motion preference */
export function getReducedMotion(): boolean {
  // Manual override takes precedence over system preference
  // null means use system preference, false/true means manual override
  if (globalReducedMotion === true) return true;
  if (globalReducedMotion === false) return false;
  return getReducedMotionPreference() === "reduce";
}

/** Set reduced motion preference (for testing) */
export function setReducedMotion(reduce: boolean | null): void {
  globalReducedMotion = reduce;
}

/** Get reduced motion preference */
export function getReducedMotionPreference(): ReducedMotionPreference {
  if (typeof window === "undefined") return "no-preference";

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "reduce"
    : "no-preference";
}

/** Check if animations should be reduced */
export function shouldReduceMotion(): boolean {
  // Respect manual override when present; otherwise follow system preference
  return getReducedMotion();
}

/** Create animation with reduced motion support */
function createAnimationWithReducedMotion(
  animation: AnimationConfig,
  options: AnimationConfig = {},
): AnimationConfig {
  const mergedOptions = { ...animation, ...options };
  const reducedMotion = getReducedMotion();

  if (reducedMotion) {
    return {
      ...mergedOptions,
      duration: 0,
      delay: 0,
      easing: "linear",
      transition: {
        duration: 0,
        delay: 0,
        easing: "linear",
      },
    };
  }

  return {
    ...mergedOptions,
    transition: {
      duration: mergedOptions.duration ?? ANIMATION_DEFAULTS.duration,
      delay: mergedOptions.delay ?? ANIMATION_DEFAULTS.delay,
      easing: mergedOptions.easing ?? ANIMATION_DEFAULTS.easing,
    },
  };
}

/** Fade in animation */
export function fadeIn(options: AnimationConfig = {}): AnimationConfig {
  return createAnimationWithReducedMotion(
    {
      opacity: [0, 1],
      transition: {
        duration: ANIMATION_DEFAULTS.duration,
        easing: EASING_FUNCTIONS["ease-out"],
        delay: 0,
        ...options.transition,
      },
    },
    options,
  );
}

/** Fade out animation */
export function fadeOut(options: AnimationConfig = {}): AnimationConfig {
  return createAnimationWithReducedMotion(
    {
      opacity: [1, 0],
      transition: {
        duration: ANIMATION_DEFAULTS.duration,
        easing: EASING_FUNCTIONS["ease-out"],
        delay: 0,
        ...options.transition,
      },
    },
    options,
  );
}

/** Slide up animation */
export function slideUp(
  options: AnimationConfig & { distance?: number } = {},
): AnimationConfig {
  const { distance: distanceOption, ...otherOptions } = options;
  const distance = distanceOption ?? 20;
  return createAnimationWithReducedMotion(
    {
      y: [distance, 0],
      opacity: [0, 1],
      transition: {
        duration: ANIMATION_DEFAULTS.duration,
        easing: EASING_FUNCTIONS["ease-out"],
        delay: 0,
        ...otherOptions.transition,
      },
    },
    otherOptions,
  );
}

/** Slide down animation */
export function slideDown(options: AnimationConfig = {}): AnimationConfig {
  return createAnimationWithReducedMotion(
    {
      y: [-20, 0],
      opacity: [0, 1],
      transition: {
        duration: ANIMATION_DEFAULTS.duration,
        easing: EASING_FUNCTIONS["ease-out"],
        delay: 0,
        ...options.transition,
      },
    },
    options,
  );
}

/** Scale in animation */
export function scaleIn(
  options: AnimationConfig & { scale?: number } = {},
): AnimationConfig {
  const { scale: scaleOption, ...otherOptions } = options;
  const scale = scaleOption ?? 0.9;
  return createAnimationWithReducedMotion(
    {
      scale: [scale, 1],
      opacity: [0, 1],
      transition: {
        duration: ANIMATION_DEFAULTS.duration,
        easing: EASING_FUNCTIONS["ease-out"],
        delay: 0,
        ...otherOptions.transition,
      },
    },
    otherOptions,
  );
}

/** Scale out animation */
export function scaleOut(options: AnimationConfig = {}): AnimationConfig {
  return createAnimationWithReducedMotion(
    {
      scale: [1, 0.9],
      opacity: [1, 0],
      transition: {
        duration: ANIMATION_DEFAULTS.duration,
        easing: EASING_FUNCTIONS["ease-out"],
        delay: 0,
        ...options.transition,
      },
    },
    options,
  );
}

/** Stagger animation */
export function stagger(delay: number = 0.1, baseDelay: number = 0) {
  return {
    delay: (index: number): number => baseDelay + index * delay,
  };
}

/** Scroll trigger options */
export interface ScrollTriggerOptions {
  trigger?: string | Element;
  start?: string;
  end?: string;
  scrub?: boolean;
  markers?: boolean;
}

/** Create scroll trigger */
export function createScrollTrigger(options: ScrollTriggerOptions = {}) {
  // SSR-safe default trigger
  const defaultTrigger =
    typeof document !== "undefined"
      ? document.querySelector(".trigger-element") || document.body
      : null;

  return {
    trigger: options.trigger || defaultTrigger,
    start: options.start || "top 80%",
    end: options.end || "bottom 20%",
    scrub: options.scrub || false,
    markers: options.markers || false,
  };
}

/** Create intersection observer */
export function createIntersectionObserver(
  options?: IntersectionObserverInit & { triggerOnce?: boolean },
) {
  // Return configuration object for tests, not the actual observer
  return {
    threshold: options?.threshold || 0.1,
    rootMargin: options?.rootMargin || "0px 0px -100px 0px",
    triggerOnce:
      options?.triggerOnce !== undefined ? options.triggerOnce : true,
  };
}

/** Hook for reduced motion preference */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] =
    useState<boolean>(shouldReduceMotion());

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return reducedMotion;
}

/** Create animation config with motion preferences */
export function createAnimationConfig(
  baseConfig: AnimationConfig = {},
  respectReducedMotion: boolean = true,
): AnimationConfig {
  const reducedMotion = respectReducedMotion && getReducedMotion();

  if (reducedMotion) {
    return {
      ...baseConfig,
      duration: 0,
      delay: 0,
      easing: "linear",
    };
  }

  return {
    duration: 300,
    delay: 0,
    easing: "ease-out",
    ...baseConfig,
  };
}

/** Animation presets */
export const animationPresets = {
  fadeIn: {
    opacity: [0, 1],
    duration: 300,
    easing: "ease-out",
  },
  fadeOut: {
    opacity: [1, 0],
    duration: 300,
    easing: "ease-out",
  },
  slideUp: {
    transform: ["translateY(20px)", "translateY(0)"],
    opacity: [0, 1],
    duration: 300,
    easing: "ease-out",
  },
  slideDown: {
    transform: ["translateY(-20px)", "translateY(0)"],
    opacity: [0, 1],
    duration: 300,
    easing: "ease-out",
  },
  slideLeft: {
    transform: ["translateX(20px)", "translateX(0)"],
    opacity: [0, 1],
    duration: 300,
    easing: "ease-out",
  },
  slideRight: {
    transform: ["translateX(-20px)", "translateX(0)"],
    opacity: [0, 1],
    duration: 300,
    easing: "ease-out",
  },
  scaleIn: {
    transform: ["scale(0.9)", "scale(1)"],
    opacity: [0, 1],
    duration: 300,
    easing: "ease-out",
  },
  scaleOut: {
    transform: ["scale(1)", "scale(0.9)"],
    opacity: [0, 1],
    duration: 300,
    easing: "ease-out",
  },
  bounce: {
    transform: ["scale(1)", "scale(1.1)", "scale(1)"],
    duration: 500,
    easing: "ease-in-out",
  },
  pulse: {
    opacity: [1, 0.5, 1],
    duration: 1000,
    repeat: Infinity,
    easing: "ease-in-out",
  },
} as const;

/** Apply animation with reduced motion support */
export function applyAnimation(
  element: HTMLElement,
  animation: keyof typeof animationPresets,
  config?: AnimationConfig,
  respectReducedMotion: boolean = true,
): void {
  if (typeof window === "undefined") return;

  const reducedMotion = respectReducedMotion && getReducedMotion();

  if (reducedMotion) {
    // Apply instant transition
    element.style.transition = "none";
    element.style.opacity = "1";
    element.style.transform = "none";
    return;
  }

  const preset = animationPresets[animation];
  const finalConfig = { ...preset, ...config };

  // Apply CSS transitions
  element.style.transition = `all ${finalConfig.duration}ms ${finalConfig.easing} ${finalConfig.delay}ms`;

  // Apply final state
  if (finalConfig.opacity !== undefined) {
    const opacityValue = Array.isArray(finalConfig.opacity)
      ? finalConfig.opacity[finalConfig.opacity.length - 1]
      : finalConfig.opacity;
    element.style.opacity = String(opacityValue);
  }

  if (finalConfig.y !== undefined) {
    const yValue = Array.isArray(finalConfig.y)
      ? finalConfig.y[finalConfig.y.length - 1]
      : finalConfig.y;
    element.style.transform = `translateY(${yValue}px)`;
  }

  if (finalConfig.scale !== undefined) {
    const scaleValue = Array.isArray(finalConfig.scale)
      ? finalConfig.scale[finalConfig.scale.length - 1]
      : finalConfig.scale;
    element.style.transform += ` scale(${scaleValue})`;
  }
}

/** Hook for element animation */
export function useElementAnimation(
  animation: keyof typeof animationPresets,
  config?: AnimationConfig,
  respectReducedMotion: boolean = true,
) {
  const elementRef = useRef<HTMLElement>(null);

  const animate = useCallback(() => {
    if (elementRef.current) {
      applyAnimation(
        elementRef.current,
        animation,
        config,
        respectReducedMotion,
      );
    }
  }, [animation, config, respectReducedMotion]);

  return { ref: elementRef, animate };
}

/** Animation sequence utility */
export class AnimationSequence {
  private animations: Array<{
    element: HTMLElement;
    animation: keyof typeof animationPresets;
    config?: AnimationConfig;
    delay: number;
  }> = [];

  add(
    element: HTMLElement,
    animation: keyof typeof animationPresets,
    config?: AnimationConfig,
    delay: number = 0,
  ): this {
    this.animations.push({ element, animation, config, delay });
    return this;
  }

  play(respectReducedMotion: boolean = true): void {
    const reducedMotion = respectReducedMotion && shouldReduceMotion();

    this.animations.forEach(({ element, animation, config, delay }) => {
      const actualDelay = reducedMotion ? 0 : delay;

      setTimeout(() => {
        applyAnimation(element, animation, config, respectReducedMotion);
      }, actualDelay);
    });
  }

  clear(): void {
    this.animations = [];
  }
}

/** Create animation sequence */
export function createAnimationSequence(): AnimationSequence {
  return new AnimationSequence();
}

/** Animation utilities for testing */
export const animationUtils = {
  getReducedMotionPreference,
  shouldReduceMotion,
  createAnimationConfig,
  applyAnimation,
  createAnimationSequence,
};

/** Animation constants */
export const ANIMATION_CONSTANTS = {
  DEFAULT_DURATION: 300,
  DEFAULT_EASING: "ease-out",
  REDUCED_MOTION_MEDIA_QUERY: "(prefers-reduced-motion: reduce)",
} as const;
