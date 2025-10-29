// Design System Tokens - Animations & Transitions
// Single source of truth for all animation-related tokens

export const animationTokens = {
  // Duration Scale
  duration: {
    instant: "100ms", // immediate feedback
    fast: "150ms", // quick interactions
    normal: "250ms", // standard transitions
    slow: "350ms", // smooth state changes
    slower: "500ms", // page transitions
    slowest: "700ms", // entrance animations
  },

  // Easing Functions
  easing: {
    linear: "linear",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    inOut: "cubic-bezier(0.4, 0, 0.2, 1)",

    // Custom easings for specific use cases
    bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    smooth: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    sharp: "cubic-bezier(0.4, 0, 0.6, 1)",
  },

  // Keyframe Definitions
  keyframes: {
    // Entrance animations
    fadeIn: {
      "0%": { opacity: "0" },
      "100%": { opacity: "1" },
    },
    slideUp: {
      "0%": { opacity: "0", transform: "translateY(20px)" },
      "100%": { opacity: "1", transform: "translateY(0)" },
    },
    slideDown: {
      "0%": { opacity: "0", transform: "translateY(-20px)" },
      "100%": { opacity: "1", transform: "translateY(0)" },
    },
    slideLeft: {
      "0%": { opacity: "0", transform: "translateX(20px)" },
      "100%": { opacity: "1", transform: "translateX(0)" },
    },
    slideRight: {
      "0%": { opacity: "0", transform: "translateX(-20px)" },
      "100%": { opacity: "1", transform: "translateX(0)" },
    },

    // Attention animations
    pulse: {
      "0%, 100%": { opacity: "1" },
      "50%": { opacity: "0.5" },
    },
    bounce: {
      "0%, 20%, 53%, 80%, 100%": { transform: "translate3d(0, 0, 0)" },
      "40%, 43%": { transform: "translate3d(0, -8px, 0)" },
      "70%": { transform: "translate3d(0, -4px, 0)" },
      "90%": { transform: "translate3d(0, -2px, 0)" },
    },

    // Scale animations
    scaleIn: {
      "0%": { opacity: "0", transform: "scale(0.95)" },
      "100%": { opacity: "1", transform: "scale(1)" },
    },
    scaleOut: {
      "0%": { opacity: "1", transform: "scale(1)" },
      "100%": { opacity: "0", transform: "scale(0.95)" },
    },

    // Special effects
    shimmer: {
      "0%": { transform: "translateX(-100%)" },
      "100%": { transform: "translateX(100%)" },
    },
    glow: {
      "0%, 100%": { opacity: "0.4" },
      "50%": { opacity: "0.8" },
    },
  },

  // Animation Presets (combining duration + easing)
  preset: {
    // Page transitions
    pageEnter: {
      duration: "500ms",
      easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    },
    pageExit: {
      duration: "300ms",
      easing: "cubic-bezier(0.4, 0, 0.6, 1)",
    },

    // Component interactions
    buttonHover: {
      duration: "150ms",
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
    cardHover: {
      duration: "200ms",
      easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    },

    // Micro-interactions
    micro: {
      duration: "100ms",
      easing: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },

  // Reduced motion preferences
  reducedMotion: {
    duration: "50ms", // minimal duration for reduced motion
    easing: "linear", // no easing for reduced motion
  },
} as const;

// Type exports
export type AnimationTokens = typeof animationTokens;
