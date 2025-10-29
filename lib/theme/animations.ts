// Animation Presets - Centralized Animation System
// This file defines all animation presets used throughout the application
// Provides consistent timing, easing, and accessibility features

import { Variants } from "framer-motion";

// Animation Timing Constants
export const ANIMATION_TIMING = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.6,
  slower: 1.0,
  slowest: 1.5,
} as const;

// Easing Functions
export const EASING = {
  // Standard easing - good for most UI elements
  standard: [0.2, 0.8, 0.2, 1],

  // Entrance easing - smooth entry from outside viewport
  entrance: [0.2, 0, 0.2, 1],

  // Exit easing - smooth exit animation
  exit: [0.2, 1, 0.2, 1],

  // De-emphasis easing - subtle, less attention-grabbing
  deemphasis: [0.33, 0, 0.2, 1],

  // Bounce easing - playful, attention-grabbing
  bounce: [0.68, -0.55, 0.265, 1.55],

  // Spring-like easing - natural, organic feel
  spring: [0.175, 0.885, 0.32, 1.275],
} as const;

// Animation Distance Constants
export const DISTANCE = {
  small: 8,
  medium: 12,
  large: 20,
  xlarge: 32,
} as const;

// Scale Constants
export const SCALE = {
  subtle: 1.02,
  small: 1.05,
  medium: 1.1,
  large: 1.2,
} as const;

// Opacity Constants
export const OPACITY = {
  subtle: 0.8,
  medium: 0.6,
  low: 0.3,
  invisible: 0,
} as const;

// Animation Presets
export const ANIMATION_PRESETS = {
  // Basic Fade Animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: {
      duration: ANIMATION_TIMING.normal,
      ease: EASING.standard,
    },
  },

  fadeOut: {
    initial: { opacity: 1 },
    animate: { opacity: 0 },
    transition: {
      duration: ANIMATION_TIMING.normal,
      ease: EASING.standard,
    },
  },

  // Slide Animations
  slideUp: {
    initial: { opacity: 0, y: DISTANCE.medium },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: ANIMATION_TIMING.normal,
      ease: EASING.entrance,
    },
  },

  slideDown: {
    initial: { opacity: 0, y: -DISTANCE.medium },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: ANIMATION_TIMING.normal,
      ease: EASING.entrance,
    },
  },

  slideLeft: {
    initial: { opacity: 0, x: DISTANCE.medium },
    animate: { opacity: 1, x: 0 },
    transition: {
      duration: ANIMATION_TIMING.normal,
      ease: EASING.entrance,
    },
  },

  slideRight: {
    initial: { opacity: 0, x: -DISTANCE.medium },
    animate: { opacity: 1, x: 0 },
    transition: {
      duration: ANIMATION_TIMING.normal,
      ease: EASING.entrance,
    },
  },

  // Combined Fade + Slide (most common)
  fadeUp: {
    initial: { opacity: 0, y: DISTANCE.medium },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: ANIMATION_TIMING.normal,
      ease: EASING.entrance,
    },
  },

  fadeDown: {
    initial: { opacity: 0, y: -DISTANCE.medium },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: ANIMATION_TIMING.normal,
      ease: EASING.entrance,
    },
  },

  // Scale Animations
  scaleIn: {
    initial: { opacity: 0, scale: SCALE.medium },
    animate: { opacity: 1, scale: 1 },
    transition: {
      duration: ANIMATION_TIMING.normal,
      ease: EASING.spring,
    },
  },

  scaleOut: {
    initial: { opacity: 1, scale: 1 },
    animate: { opacity: 0, scale: SCALE.medium },
    transition: {
      duration: ANIMATION_TIMING.normal,
      ease: EASING.spring,
    },
  },

  // Hover Effects
  hoverLift: {
    initial: { y: 0 },
    animate: { y: 0 },
    whileHover: { y: -DISTANCE.small },
    transition: {
      duration: ANIMATION_TIMING.fast,
      ease: EASING.standard,
    },
  },

  hoverScale: {
    initial: { scale: 1 },
    animate: { scale: 1 },
    whileHover: { scale: SCALE.subtle },
    transition: {
      duration: ANIMATION_TIMING.fast,
      ease: EASING.standard,
    },
  },

  // Button Animations
  buttonTap: {
    whileTap: { scale: 0.98 },
    transition: {
      duration: ANIMATION_TIMING.instant,
      ease: EASING.standard,
    },
  },

  buttonHover: {
    whileHover: { scale: SCALE.subtle },
    transition: {
      duration: ANIMATION_TIMING.fast,
      ease: EASING.standard,
    },
  },

  // Card Animations
  cardHover: {
    whileHover: {
      y: -DISTANCE.small,
      boxShadow: "0 10px 30px rgba(17, 24, 39, 0.08)",
    },
    transition: {
      duration: ANIMATION_TIMING.fast,
      ease: EASING.standard,
    },
  },

  // Floating Animations (continuous) - DISABLED
  float: {
    animate: {
      y: 0,
      transition: {
        duration: 0,
      },
    },
  },

  floatSlow: {
    animate: {
      y: 0,
      transition: {
        duration: 0,
      },
    },
  },

  // Pulse Animations - DISABLED
  pulse: {
    animate: {
      opacity: 1,
      transition: {
        duration: 0,
      },
    },
  },

  pulseGlow: {
    animate: {
      opacity: 1,
      boxShadow: "0 0 0 0 rgba(124, 77, 255, 0)",
      transition: {
        duration: 0,
      },
    },
  },

  // Stagger Animations (for lists)
  staggerContainer: {
    initial: "hidden",
    whileInView: "visible",
    viewport: { once: true, margin: "-50px" },
    variants: {
      hidden: {},
      visible: {
        transition: {
          staggerChildren: 0.1,
          delayChildren: 0.2,
        },
      },
    },
  },

  staggerItem: {
    variants: {
      hidden: {
        opacity: 0,
        y: DISTANCE.medium,
      },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: ANIMATION_TIMING.normal,
          ease: EASING.entrance,
        },
      },
    },
  },

  // Page Transition Animations - DISABLED
  pageEnter: {
    initial: { opacity: 1, scale: 1 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 1, scale: 1 },
    transition: {
      duration: 0,
    },
  },

  // Scroll-triggered Animations
  scrollFadeUp: {
    initial: { opacity: 0, y: DISTANCE.large },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: {
      duration: ANIMATION_TIMING.normal,
      ease: EASING.entrance,
    },
  },

  scrollScaleIn: {
    initial: { opacity: 0, scale: SCALE.medium },
    whileInView: { opacity: 1, scale: 1 },
    viewport: { once: true, margin: "-100px" },
    transition: {
      duration: ANIMATION_TIMING.normal,
      ease: EASING.spring,
    },
  },
} as const;

// Animation Groups for Common Use Cases
export const ANIMATION_GROUPS = {
  // Hero Section Animations
  hero: {
    container: {
      initial: "hidden",
      animate: "visible",
      variants: {
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.2,
            delayChildren: 0.1,
          },
        },
      },
    },
    title: {
      variants: {
        hidden: {
          opacity: 0,
          y: DISTANCE.large,
        },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: ANIMATION_TIMING.slow,
            ease: EASING.entrance,
          },
        },
      },
    },
    subtitle: {
      variants: {
        hidden: {
          opacity: 0,
          y: DISTANCE.medium,
        },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: ANIMATION_TIMING.normal,
            ease: EASING.entrance,
            delay: 0.1,
          },
        },
      },
    },
    buttons: {
      variants: {
        hidden: {
          opacity: 0,
          y: DISTANCE.small,
        },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: ANIMATION_TIMING.normal,
            ease: EASING.spring,
          },
        },
      },
    },
  },

  // Card Grid Animations
  cardGrid: {
    container: {
      initial: "hidden",
      whileInView: "visible",
      viewport: { once: true, margin: "-100px" },
      variants: {
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2,
          },
        },
      },
    },
    card: {
      variants: {
        hidden: {
          opacity: 0,
          y: DISTANCE.medium,
          scale: SCALE.medium,
        },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            duration: ANIMATION_TIMING.normal,
            ease: EASING.spring,
          },
        },
      },
    },
  },

  // Navigation Animations - DISABLED
  navigation: {
    dropdown: {
      initial: { opacity: 1, y: 0, scale: 1 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 1, y: 0, scale: 1 },
      transition: {
        duration: 0,
      },
    },
    mobileMenu: {
      initial: { opacity: 1, x: 0 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 1, x: 0 },
      transition: {
        duration: 0,
      },
    },
  },

  // Form Animations - DISABLED
  form: {
    inputFocus: {
      scale: 1,
      transition: { duration: 0 },
    },
    errorShake: {
      x: 0,
      transition: { duration: 0 },
    },
    successCheck: {
      scale: 1,
      opacity: 1,
      transition: { duration: 0 },
    },
  },

  // Loading States - DISABLED
  loading: {
    spinner: {
      rotate: 0,
      transition: {
        duration: 0,
      },
    },
    skeleton: {
      animate: {
        opacity: 1,
        transition: {
          duration: 0,
        },
      },
    },
  },
} as const;

// Type exports for TypeScript
export type AnimationPresetKey = keyof typeof ANIMATION_PRESETS;
export type AnimationGroupKey = keyof typeof ANIMATION_GROUPS;
export type AnimationTimingKey = keyof typeof ANIMATION_TIMING;
export type EasingKey = keyof typeof EASING;

// Utility function to get animation with reduced motion support
export function getAnimationWithReducedMotion(
  animation: Variants,
  prefersReducedMotion: boolean,
): Variants {
  if (prefersReducedMotion) {
    // Return simplified animation for reduced motion
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
    } as Variants;
  }
  return animation;
}

// Utility function to create custom animation from preset
export function createCustomAnimation(
  basePreset: AnimationPresetKey,
  overrides: Partial<Variants>,
): Variants {
  const base = ANIMATION_PRESETS[basePreset];
  return {
    ...base,
    ...overrides,
  } as Variants;
}

// Utility function to get viewport animation props
export function getViewportProps(
  animation: Variants,
  options: { once?: boolean; margin?: string } = {},
): Variants & { viewport: { once: boolean; margin: string } } {
  const { once = true, margin = "-100px" } = options;

  return {
    ...animation,
    viewport: { once, margin },
  } as Variants & { viewport: { once: boolean; margin: string } };
}
