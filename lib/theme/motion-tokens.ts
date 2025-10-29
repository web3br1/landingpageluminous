// ===== MOTION TOKENS EXPANDIDOS =====
// Sistema avançado de tokens de motion com easings, springs e padrões contextuais

import type { AnimationPreset } from "../types/design-system";

// ===== EASE TOKENS =====

/** Easing curve definitions */
export const EASE_TOKENS = {
  // Standard easings
  standard: [0.2, 0.8, 0.2, 1], // Default for most UI
  entrance: [0.2, 0, 0.2, 1], // Smooth entry from outside
  exit: [0.2, 1, 0.2, 1], // Smooth exit
  emphasis: [0.12, 0.8, 0.24, 1], // Attention-grabbing
  bounce: [0.68, -0.55, 0.265, 1.55], // Playful, high energy
  deemphasis: [0.33, 0, 0.2, 1], // Subtle, less attention

  // Advanced easings
  anticipation: [0.16, 1, 0.3, 1], // Builds anticipation
  overshoot: [0.175, 0.885, 0.32, 1.275], // Slight overshoot
  elastic: [0.5, 1.5, 0.75, 1.25], // Elastic feel
  back: [0.6, -0.28, 0.735, 0.045], // Back and forth
  circ: [0.075, 0.82, 0.165, 1], // Circular motion
  expo: [0.19, 1, 0.22, 1], // Exponential

  // Layer-specific defaults
  bg: [0.25, 1, 0.5, 1], // Background: slower, smoother
  mid: [0.2, 0.8, 0.2, 1], // Middle: standard
  fg: [0.15, 0.85, 0.25, 1], // Foreground: snappier
  fx: [0.1, 0.9, 0.2, 1], // Effects: fastest, most responsive
} as const;

// ===== SPRING TOKENS =====

/** Spring physics definitions */
export const SPRING_TOKENS = {
  // Standard springs
  soft: { stiffness: 160, damping: 22, mass: 1 },
  snappy: { stiffness: 260, damping: 20, mass: 1 },
  bouncy: { stiffness: 180, damping: 12, mass: 1 },
  gentle: { stiffness: 120, damping: 28, mass: 1 },

  // Advanced springs
  elastic: { stiffness: 300, damping: 15, mass: 1 },
  slow: { stiffness: 100, damping: 25, mass: 1 },
  fast: { stiffness: 350, damping: 18, mass: 1 },
  heavy: { stiffness: 140, damping: 20, mass: 2 },

  // Context-specific
  cardHover: { stiffness: 200, damping: 18, mass: 1 },
  buttonTap: { stiffness: 400, damping: 25, mass: 1 },
  modalEnter: { stiffness: 250, damping: 30, mass: 1 },
  drawerSlide: { stiffness: 220, damping: 26, mass: 1.2 },
} as const;

// ===== TIMING TOKENS =====

/** Duration tokens in milliseconds */
export const TIMING_TOKENS = {
  // Base durations
  instant: 50, // 50ms - immediate feedback
  fast: 150, // 150ms - quick interactions
  normal: 250, // 250ms - standard transitions
  slow: 400, // 400ms - noticeable changes
  slower: 600, // 600ms - major state changes
  slowest: 1000, // 1000ms - dramatic transitions

  // Context-specific
  hover: 200, // Hover effects
  focus: 150, // Focus transitions
  click: 100, // Button press feedback
  form: 300, // Form transitions
  page: 500, // Page transitions
  modal: 350, // Modal enter/exit
  tooltip: 200, // Tooltip appearance
  drawer: 400, // Drawer slide
  toast: 300, // Toast notifications
} as const;

// ===== DISTANCE TOKENS =====

/** Movement distance tokens in pixels */
export const DISTANCE_TOKENS = {
  // Scale transforms
  subtle: 0.02, // 2% scale
  small: 0.05, // 5% scale
  medium: 0.1, // 10% scale
  large: 0.15, // 15% scale

  // Translate transforms (px)
  micro: 2, // 2px micro-movements
  tiny: 4, // 4px subtle lifts
  lift: 8, // 8px standard lifts
  translate: 16, // 16px noticeable movement
  moveLarge: 24, // 24px dramatic movement
  moveXlarge: 32, // 32px major movement

  // Opacity changes
  fadeSubtle: 0.1,
  fadeMedium: 0.2,
  fadeStrong: 0.4,
  fadeComplete: 1.0,
} as const;

// ===== CONTEXT-AWARE TOKENS =====

/** Context-specific motion configurations */
export const CONTEXT_TOKENS = {
  // Layer-specific configurations
  layers: {
    bg: {
      easing: EASE_TOKENS.bg,
      duration: TIMING_TOKENS.slow,
      spring: SPRING_TOKENS.gentle,
      distance: DISTANCE_TOKENS.small,
    },
    mid: {
      easing: EASE_TOKENS.mid,
      duration: TIMING_TOKENS.normal,
      spring: SPRING_TOKENS.soft,
      distance: DISTANCE_TOKENS.medium,
    },
    fg: {
      easing: EASE_TOKENS.fg,
      duration: TIMING_TOKENS.fast,
      spring: SPRING_TOKENS.snappy,
      distance: DISTANCE_TOKENS.small,
    },
    fx: {
      easing: EASE_TOKENS.fx,
      duration: TIMING_TOKENS.instant,
      spring: SPRING_TOKENS.fast,
      distance: DISTANCE_TOKENS.tiny,
    },
  },

  // Component-specific configurations
  components: {
    button: {
      hover: {
        easing: EASE_TOKENS.emphasis,
        duration: TIMING_TOKENS.hover,
        scale: DISTANCE_TOKENS.subtle,
      },
      tap: {
        easing: EASE_TOKENS.emphasis,
        duration: TIMING_TOKENS.click,
        scale: -DISTANCE_TOKENS.micro,
        spring: SPRING_TOKENS.buttonTap,
      },
    },

    card: {
      hover: {
        easing: EASE_TOKENS.standard,
        duration: TIMING_TOKENS.hover,
        lift: DISTANCE_TOKENS.tiny,
        spring: SPRING_TOKENS.cardHover,
      },
      enter: {
        easing: EASE_TOKENS.entrance,
        duration: TIMING_TOKENS.normal,
        fade: DISTANCE_TOKENS.fadeComplete,
        lift: DISTANCE_TOKENS.small,
      },
    },

    modal: {
      enter: {
        easing: EASE_TOKENS.entrance,
        duration: TIMING_TOKENS.modal,
        spring: SPRING_TOKENS.modalEnter,
        scale: { from: 0.9, to: 1 },
        opacity: { from: 0, to: 1 },
      },
      exit: {
        easing: EASE_TOKENS.exit,
        duration: TIMING_TOKENS.modal,
        scale: { from: 1, to: 0.9 },
        opacity: { from: 1, to: 0 },
      },
    },

    drawer: {
      slide: {
        easing: EASE_TOKENS.standard,
        duration: TIMING_TOKENS.drawer,
        spring: SPRING_TOKENS.drawerSlide,
        translate: { from: "100%", to: "0%" },
      },
    },

    tooltip: {
      appear: {
        easing: EASE_TOKENS.entrance,
        duration: TIMING_TOKENS.tooltip,
        opacity: { from: 0, to: 1 },
        scale: { from: 0.8, to: 1 },
      },
    },
  },
} as const;

// ===== REDUCED MOTION MAPPINGS =====

/** Reduced motion token mappings */
export const REDUCED_MOTION_MAPPINGS = {
  // Transform mappings
  translate: "opacity",
  translateX: "opacity",
  translateY: "opacity",
  translateZ: "opacity",
  scale: "opacity",
  scaleX: "opacity",
  scaleY: "opacity",
  rotate: "none",
  skew: "none",

  // Filter mappings
  blur: "none",
  brightness: "opacity",
  contrast: "opacity",
  saturate: "opacity",
  hueRotate: "none",
  invert: "opacity",

  // Other mappings
  width: "opacity",
  height: "opacity",
  borderRadius: "none",
  boxShadow: "none",
} as const;

// ===== ANIMATION PRESETS EXPANDIDOS =====

/** Expanded animation presets with motion tokens */
export const EXPANDED_ANIMATION_PRESETS = {
  // Basic transitions
  fadeIn: {
    opacity: { from: 0, to: 1 },
    easing: EASE_TOKENS.entrance,
    duration: TIMING_TOKENS.normal,
  },

  fadeOut: {
    opacity: { from: 1, to: 0 },
    easing: EASE_TOKENS.exit,
    duration: TIMING_TOKENS.normal,
  },

  slideUp: {
    opacity: { from: 0, to: 1 },
    transform: {
      from: `translateY(${DISTANCE_TOKENS.medium}px)`,
      to: "translateY(0px)",
    },
    easing: EASE_TOKENS.entrance,
    duration: TIMING_TOKENS.normal,
  },

  slideDown: {
    opacity: { from: 0, to: 1 },
    transform: {
      from: `translateY(-${DISTANCE_TOKENS.medium}px)`,
      to: "translateY(0px)",
    },
    easing: EASE_TOKENS.entrance,
    duration: TIMING_TOKENS.normal,
  },

  slideLeft: {
    opacity: { from: 0, to: 1 },
    transform: {
      from: `translateX(${DISTANCE_TOKENS.medium}px)`,
      to: "translateX(0px)",
    },
    easing: EASE_TOKENS.entrance,
    duration: TIMING_TOKENS.normal,
  },

  slideRight: {
    opacity: { from: 0, to: 1 },
    transform: {
      from: `translateX(-${DISTANCE_TOKENS.medium}px)`,
      to: "translateX(0px)",
    },
    easing: EASE_TOKENS.entrance,
    duration: TIMING_TOKENS.normal,
  },

  // Scale animations
  scaleIn: {
    opacity: { from: 0, to: 1 },
    transform: {
      from: `scale(${1 - DISTANCE_TOKENS.small})`,
      to: "scale(1)",
    },
    easing: EASE_TOKENS.entrance,
    duration: TIMING_TOKENS.normal,
  },

  scaleOut: {
    opacity: { from: 1, to: 0 },
    transform: {
      from: "scale(1)",
      to: `scale(${1 - DISTANCE_TOKENS.small})`,
    },
    easing: EASE_TOKENS.exit,
    duration: TIMING_TOKENS.normal,
  },

  // Complex animations
  bounceIn: {
    opacity: { from: 0, to: 1 },
    transform: {
      from: `scale(0.3)`,
      to: "scale(1)",
    },
    easing: EASE_TOKENS.bounce,
    duration: TIMING_TOKENS.slow,
  },

  elasticIn: {
    opacity: { from: 0, to: 1 },
    transform: {
      from: `scale(0)`,
      to: "scale(1)",
    },
    easing: EASE_TOKENS.elastic,
    duration: TIMING_TOKENS.slower,
  },

  // Hover effects
  hoverLift: {
    transform: {
      from: "translateY(0px)",
      to: `translateY(-${DISTANCE_TOKENS.tiny}px)`,
    },
    easing: EASE_TOKENS.standard,
    duration: TIMING_TOKENS.hover,
  },

  hoverGlow: {
    boxShadow: {
      from: "0 0 0 0 rgba(59, 130, 246, 0)",
      to: "0 0 0 8px rgba(59, 130, 246, 0.1)",
    },
    easing: EASE_TOKENS.standard,
    duration: TIMING_TOKENS.hover,
  },

  // Button interactions
  buttonTap: {
    transform: {
      from: "scale(1)",
      to: `scale(${1 - DISTANCE_TOKENS.micro})`,
    },
    easing: EASE_TOKENS.emphasis,
    duration: TIMING_TOKENS.click,
  },

  // Card interactions
  cardHover: {
    transform: {
      from: "translateY(0px)",
      to: `translateY(-${DISTANCE_TOKENS.tiny}px)`,
    },
    boxShadow: {
      from: "0 1px 3px rgba(0, 0, 0, 0.1)",
      to: "0 10px 25px rgba(0, 0, 0, 0.15)",
    },
    easing: EASE_TOKENS.standard,
    duration: TIMING_TOKENS.hover,
  },

  // Page transitions
  pageEnter: {
    opacity: { from: 0, to: 1 },
    transform: {
      from: `translateY(${DISTANCE_TOKENS.large}px)`,
      to: "translateY(0px)",
    },
    easing: EASE_TOKENS.entrance,
    duration: TIMING_TOKENS.page,
  },

  pageExit: {
    opacity: { from: 1, to: 0 },
    transform: {
      from: "translateY(0px)",
      to: `translateY(-${DISTANCE_TOKENS.large}px)`,
    },
    easing: EASE_TOKENS.exit,
    duration: TIMING_TOKENS.page,
  },

  // Modal transitions
  modalEnter: {
    opacity: { from: 0, to: 1 },
    transform: {
      from: `scale(${1 - DISTANCE_TOKENS.medium}) translateY(${DISTANCE_TOKENS.small}px)`,
      to: "scale(1) translateY(0px)",
    },
    easing: EASE_TOKENS.entrance,
    duration: TIMING_TOKENS.modal,
  },

  modalExit: {
    opacity: { from: 1, to: 0 },
    transform: {
      from: "scale(1) translateY(0px)",
      to: `scale(${1 - DISTANCE_TOKENS.medium}) translateY(${DISTANCE_TOKENS.small}px)`,
    },
    easing: EASE_TOKENS.exit,
    duration: TIMING_TOKENS.modal,
  },

  // Drawer transitions
  drawerSlideIn: {
    transform: {
      from: "translateX(100%)",
      to: "translateX(0%)",
    },
    easing: EASE_TOKENS.standard,
    duration: TIMING_TOKENS.drawer,
  },

  drawerSlideOut: {
    transform: {
      from: "translateX(0%)",
      to: "translateX(100%)",
    },
    easing: EASE_TOKENS.exit,
    duration: TIMING_TOKENS.drawer,
  },

  // Stagger animations
  staggerContainer: {
    staggerChildren: TIMING_TOKENS.fast,
    delayChildren: 0,
  },

  staggerItem: {
    opacity: { from: 0, to: 1 },
    transform: {
      from: `translateY(${DISTANCE_TOKENS.small}px)`,
      to: "translateY(0px)",
    },
    easing: EASE_TOKENS.entrance,
    duration: TIMING_TOKENS.normal,
  },
} as const;

// ===== UTILITY FUNCTIONS =====

/** Get motion tokens for specific context */
export function getMotionTokens(
  context: "layer" | "component",
  target: string,
  property?: string,
) {
  if (context === "layer") {
    return CONTEXT_TOKENS.layers[target as keyof typeof CONTEXT_TOKENS.layers];
  }

  if (context === "component") {
    const componentTokens =
      CONTEXT_TOKENS.components[
        target as keyof typeof CONTEXT_TOKENS.components
      ];
    if (property && componentTokens) {
      return componentTokens[property as keyof typeof componentTokens];
    }
    return componentTokens;
  }

  return null;
}

/** Apply reduced motion mappings */
export function applyReducedMotion(
  animation: Record<string, unknown>,
): Record<string, unknown> {
  const reduced = { ...animation };

  Object.entries(REDUCED_MOTION_MAPPINGS).forEach(([from, to]) => {
    if (from in reduced) {
      if (to === "none") {
        delete reduced[from];
      } else if (to === "opacity") {
        reduced.opacity = reduced[from];
        delete reduced[from];
      } else {
        reduced[to] = reduced[from];
        delete reduced[from];
      }
    }
  });

  return reduced;
}

/** Create custom easing from base */
export function createCustomEasing(
  base: keyof typeof EASE_TOKENS,
  intensity: number = 1,
): number[] {
  const baseEasing = EASE_TOKENS[base];
  const factor = Math.max(0.1, Math.min(2, intensity));

  return baseEasing.map((value) => {
    if (value > 0 && value < 1) {
      return Math.max(0, Math.min(1, value * factor));
    }
    return value;
  }) as [number, number, number, number];
}

/** Calculate spring config for specific feel */
export function createSpringConfig(
  feel: "gentle" | "snappy" | "bouncy" | "elastic",
  overrides: Partial<typeof SPRING_TOKENS.soft> = {},
) {
  const base = SPRING_TOKENS[feel];
  return { ...base, ...overrides };
}

// ===== CSS CUSTOM PROPERTIES =====

/** Generate CSS custom properties for motion tokens */
export function generateMotionCSS(): Record<string, string> {
  const cssVars: Record<string, string> = {};

  // Easing variables
  Object.entries(EASE_TOKENS).forEach(([name, values]) => {
    cssVars[`--motion-ease-${name}`] = `cubic-bezier(${values.join(", ")})`;
  });

  // Timing variables
  Object.entries(TIMING_TOKENS).forEach(([name, value]) => {
    cssVars[`--motion-duration-${name}`] = `${value}ms`;
  });

  // Distance variables
  Object.entries(DISTANCE_TOKENS).forEach(([name, value]) => {
    if (typeof value === "number") {
      cssVars[`--motion-distance-${name}`] = `${value}px`;
    } else {
      cssVars[`--motion-distance-${name}`] = `${value}`;
    }
  });

  return cssVars;
}

// ===== TYPE EXPORTS =====
export type { AnimationPreset };

// Export expanded presets as main presets
export { EXPANDED_ANIMATION_PRESETS as ANIMATION_PRESETS };
