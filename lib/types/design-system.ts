// ===== DESIGN SYSTEM TYPES =====
// Sistema de tipos robusto para type safety e DX

import type { Variants } from "framer-motion";

// ===== BASE TYPES =====

/** HSL Color representation */
export interface HSLColor {
  h: number; // 0-360
  s: number; // 0-100
  l: number; // 0-100
}

/** HSL String representation */
export type HSLString = `hsl(${number}, ${number}%, ${number}%)`;

/** HSLA String with alpha */
export type HSLAString = `hsla(${number}, ${number}%, ${number}%, ${number})`;

// ===== TOKEN TYPES =====

/** Design token structure */
export interface DesignToken<T = string> {
  value: T;
  description?: string;
  category: "color" | "spacing" | "typography" | "motion" | "effect";
  platform: "css" | "react" | "both";
}

/** Color palette token */
export interface ColorToken extends DesignToken<HSLString> {
  category: "color";
  variants?: {
    subtle?: HSLString;
    accent?: HSLString;
    inverse?: HSLString;
  };
  accessibility?: {
    contrastRatio: number; // Against white
    wcag: "AA" | "AAA";
  };
}

/** Spacing token */
export interface SpacingToken extends DesignToken<string> {
  category: "spacing";
  value: `${number}px` | `${number}rem`;
  scale: number; // Multiplier from base
}

/** Typography token */
export interface TypographyToken extends DesignToken {
  category: "typography";
  fontSize: string;
  lineHeight: number;
  fontWeight: number;
  letterSpacing?: string;
}

/** Motion token */
export interface MotionToken extends DesignToken {
  category: "motion";
  duration: number; // ms
  easing: [number, number, number, number]; // cubic-bezier
  direction?: "up" | "down" | "left" | "right" | "fade";
}

// ===== CHAPTER SYSTEM TYPES =====

/** Chapter identifiers */
export type ChapterId =
  | "hero"
  | "howItWorks"
  | "useCases"
  | "features"
  | "pricing"
  | "ctaFinal";

/** Chapter configuration */
export interface ChapterConfig {
  id: ChapterId;
  name: string;
  hue: number;
  selector: string;
  ctaVariant: CTAVariant;
  backgroundIntensity: number;
  order: number;
  requiresAuth?: boolean;
  tracking?: {
    enterEvent: string;
    exitEvent?: string;
    conversionGoal?: string;
  };
}

/** Chapter transition state */
export interface ChapterTransition {
  from: ChapterId | null;
  to: ChapterId;
  progress: number; // 0-1
  direction: "forward" | "backward";
  duration: number; // ms
}

// ===== COMPONENT VARIANTS =====

/** CTA Variants */
export type CTAVariant = "primary" | "secondary" | "ghost" | "promo";

/** CTA Sizes */
export type CTASize = "sm" | "md" | "lg";

/** CTA States */
export type CTAState = "default" | "loading" | "success" | "error";

/** Card Density */
export type CardDensity = "compact" | "regular" | "spacious";

/** Card Hierarchy */
export type CardHierarchy = "primary" | "secondary" | "tertiary";

/** Glassmorphism Intensity */
export type GlassmorphismIntensity = "none" | "subtle" | "medium" | "strong";

/** Animation Preset */
export type AnimationPreset =
  | "fadeIn"
  | "fadeOut"
  | "slideUp"
  | "slideDown"
  | "slideLeft"
  | "slideRight"
  | "scaleIn"
  | "scaleOut"
  | "hoverLift"
  | "hoverScale"
  | "buttonTap"
  | "buttonHover"
  | "cardHover";

// ===== ANIMATION SYSTEM TYPES =====

/** Animation configuration */
export interface AnimationConfig {
  duration: number;
  easing: [number, number, number, number];
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "scale";
  distance?: number;
}

/** Animation performance metrics */
export interface AnimationMetrics {
  activeAnimations: number;
  droppedFrames: number;
  averageDuration: number;
  memoryUsage?: number;
}

/** Reduced motion preferences */
export type ReducedMotionPreference = "no-preference" | "reduce" | "auto";

// ===== HOOK RETURN TYPES =====

/** Chapter storytelling hook return */
export interface UseChapterStorytellingReturn {
  currentChapter: ChapterId | null;
  chapterProgress: number;
  isTransitioning: boolean;
  getCurrentChapterConfig: () => ChapterConfig | null;
  getInterpolatedColor: (
    from: ChapterId,
    to: ChapterId,
    progress: number,
  ) => {
    hue: number;
    hsl: HSLString;
    hsla: (alpha: number) => HSLAString;
  };
  getChapterCTAVariant: (chapterId: ChapterId) => CTAVariant;
  useChapterBackgroundColor: (chapterId: ChapterId) => React.CSSProperties;
}

/** Component tokens hook return */
export interface UseComponentTokensReturn {
  colors: {
    primary: HSLString;
    primarySubtle: HSLString;
    primaryAccent: HSLString;
    brand: Record<string, HSLString>;
    intent: Record<string, HSLString>;
  };
  cta: {
    variant: CTAVariant;
    className: string;
  };
  background: {
    base: HSLString;
    subtle: HSLString;
    chapter: HSLString;
  };
  borders: {
    subtle: HSLString;
    chapter: HSLAString;
  };
  glass?: {
    background: HSLAString;
    backdropBlur: string;
    border: HSLAString;
  };
  spacing: Record<string, string>;
  typography: Record<string, string>;
}

/** Animation controller return */
export interface UseAnimationControllerReturn {
  shouldAnimate: (id: string) => boolean;
  registerAnimation: (id: string) => void;
  unregisterAnimation: (id: string) => void;
  getConfig: (type: string) => AnimationConfig;
  isReducedMotion: boolean;
  activeAnimations: number;
}

// ===== ERROR TYPES =====

/** Design system errors */
export class DesignSystemError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "DesignSystemError";
  }
}

/** Token resolution error */
export class TokenResolutionError extends DesignSystemError {
  constructor(tokenName: string, context?: Record<string, unknown>) {
    super(
      `Token '${tokenName}' could not be resolved`,
      "TOKEN_RESOLUTION_ERROR",
      context,
    );
  }
}

/** Chapter transition error */
export class ChapterTransitionError extends DesignSystemError {
  constructor(
    from: ChapterId | null,
    to: ChapterId,
    context?: Record<string, unknown>,
  ) {
    super(
      `Invalid chapter transition from ${from} to ${to}`,
      "CHAPTER_TRANSITION_ERROR",
      { from, to, ...context },
    );
  }
}

/** Animation performance error */
export class AnimationPerformanceError extends DesignSystemError {
  constructor(metrics: AnimationMetrics, context?: Record<string, unknown>) {
    super(
      "Animation performance threshold exceeded",
      "ANIMATION_PERFORMANCE_ERROR",
      { metrics, ...context },
    );
  }
}

// ===== UTILITY TYPES =====

/** Branded types for type safety */
export type Brand<T, Brand> = T & { __brand: Brand };

/** Chapter ID branded type */
export type ChapterID = Brand<string, "ChapterID">;

/** Token name branded type */
export type TokenName = Brand<string, "TokenName">;

/** Animation ID branded type */
export type AnimationID = Brand<string, "AnimationID">;

/** Deep partial for configuration overrides */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/** Configuration merger utility */
export type ConfigMerge<T> = T & DeepPartial<T>;

// ===== VALIDATION TYPES =====

/** Validation result */
export interface ValidationResult<T = unknown> {
  isValid: boolean;
  value: T;
  errors: ValidationError[];
}

/** Validation error */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}

/** Token validation */
export interface TokenValidation extends ValidationResult<DesignToken> {
  accessibility?: {
    contrastRatio: number;
    wcagCompliant: boolean;
  };
}

// ===== CONFIGURATION TYPES =====

/** Design system configuration */
export interface DesignSystemConfig {
  /** Color system */
  colors: {
    primary: ColorToken;
    secondary: ColorToken;
    accent: ColorToken;
    neutral: ColorToken;
  };

  /** Typography system */
  typography: {
    fontFamily: string[];
    scale: Record<string, TypographyToken>;
  };

  /** Spacing system */
  spacing: {
    base: number;
    scale: Record<string, SpacingToken>;
  };

  /** Motion system */
  motion: {
    reducedMotion: ReducedMotionPreference;
    presets: Record<AnimationPreset, MotionToken>;
  };

  /** Chapter system */
  chapters: Record<ChapterId, ChapterConfig>;

  /** Feature flags */
  features: {
    glassmorphism: boolean;
    chapterTransitions: boolean;
    advancedAnimations: boolean;
  };
}

// ===== RUNTIME TYPES =====

/** Runtime context */
export interface RuntimeContext {
  /** Current viewport */
  viewport: {
    width: number;
    height: number;
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
  };

  /** User preferences */
  preferences: {
    reducedMotion: boolean;
    highContrast: boolean;
    theme: "light" | "dark";
  };

  /** Performance metrics */
  performance: {
    fps: number;
    memoryUsage: number;
    connectionSpeed: "slow" | "fast";
  };
}

// ===== TYPE GUARDS =====

/** Type guard for ChapterId */
export function isChapterId(value: unknown): value is ChapterId {
  return (
    typeof value === "string" &&
    [
      "hero",
      "howItWorks",
      "useCases",
      "features",
      "pricing",
      "ctaFinal",
    ].includes(value)
  );
}

/** Type guard for CTAVariant */
export function isCTAVariant(value: unknown): value is CTAVariant {
  return (
    typeof value === "string" &&
    ["primary", "secondary", "ghost", "promo"].includes(value)
  );
}

/** Type guard for HSLString */
export function isHSLString(value: unknown): value is HSLString {
  return typeof value === "string" && /^hsl\(\d+, \d+%?, \d+%?\)$/.test(value);
}

// ===== TYPE EXPORTS =====
export type {
  // Re-export framer-motion types we use
  Variants,
};

// Forward declarations for circular dependencies
// These will be resolved at runtime
export interface AnimationPresetsInterface {
  fadeIn: AnimationConfig;
  fadeOut: AnimationConfig;
  slideUp: AnimationConfig;
  slideDown: AnimationConfig;
  slideLeft: AnimationConfig;
  slideRight: AnimationConfig;
  scaleIn: AnimationConfig;
  scaleOut: AnimationConfig;
  hoverLift: AnimationConfig;
  hoverScale: AnimationConfig;
  buttonTap: AnimationConfig;
  buttonHover: AnimationConfig;
  cardHover: AnimationConfig;
}
