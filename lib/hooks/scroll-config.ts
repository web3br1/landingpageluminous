import { Chapter } from "./use-scroll-storytelling";

// Performance constants
export const SCROLL_CONFIG = {
  // Throttling
  SCROLL_THROTTLE_MS: 16, // ~60fps
  CHAPTER_CHANGE_DEBOUNCE_MS: 150,

  // Transitions
  TRANSITION_DURATION_MS: 320,
  TRANSITION_EASE: [0.2, 0.8, 0.2, 1] as const,

  // Pinning
  PIN_OFFSET_MULTIPLIER: 0.1, // 10% of viewport
  PIN_START_MULTIPLIER: 0.1,
  PIN_END_MULTIPLIER: 0.2,

  // Navigation
  KEYBOARD_NAVIGATION_DEBOUNCE_MS: 200,

  // Mobile breakpoints
  MOBILE_BREAKPOINT: 768,
  TABLET_BREAKPOINT: 1024,

  // Accessibility
  TOUCH_TARGET_SIZE: 44, // Minimum touch target
  FOCUS_RING_SIZE: 2,
} as const;

// Default chapter configuration
export const DEFAULT_CHAPTERS: Chapter[] = [
  {
    id: "hero",
    title: "Hero",
    anchor: "#hero",
    type: "hero",
    height: { min: 100, max: 100 },
    zIndex: 10,
  },
  {
    id: "social-proof",
    title: "Prova Social",
    anchor: "#social-proof",
    type: "scroll",
    height: { min: 60, max: 80 },
    zIndex: 10,
  },
  {
    id: "pillars",
    title: "Pilares",
    anchor: "#pillars",
    type: "scroll",
    height: { min: 80, max: 100 },
    zIndex: 10,
  },
  {
    id: "how-it-works",
    title: "Como Funciona",
    anchor: "#how-it-works",
    type: "pinned",
    height: { min: 220, max: 260 },
    subScenes: 3,
    zIndex: 20,
  },
  {
    id: "proof-traction",
    title: "Prova de Tração",
    anchor: "#proof-traction",
    type: "scroll",
    height: { min: 80, max: 100 },
    zIndex: 10,
  },
  {
    id: "features",
    title: "Recursos",
    anchor: "#features",
    type: "scroll",
    height: { min: 120, max: 160 },
    zIndex: 10,
  },
  {
    id: "demo",
    title: "Demonstração",
    anchor: "#demo",
    type: "scroll",
    height: { min: 100, max: 140 },
    zIndex: 10,
  },
  {
    id: "benefits",
    title: "Benefícios",
    anchor: "#benefits",
    type: "scroll",
    height: { min: 100, max: 140 },
    zIndex: 10,
  },
  {
    id: "pricing",
    title: "Preços",
    anchor: "#pricing",
    type: "scroll",
    height: { min: 160, max: 200 },
    zIndex: 10,
  },
  {
    id: "faq",
    title: "FAQ",
    anchor: "#faq",
    type: "scroll",
    height: { min: 120, max: 160 },
    zIndex: 10,
  },
  {
    id: "trial",
    title: "Teste Grátis",
    anchor: "#trial",
    type: "cta",
    height: { min: 100, max: 140 },
    zIndex: 10,
  },
];

// Transition types
export const TRANSITION_TYPES = {
  CROSSFADE: "crossfade",
  WIPE: "wipe",
  NONE: "none",
} as const;

export type TransitionType =
  (typeof TRANSITION_TYPES)[keyof typeof TRANSITION_TYPES];

// Chapter types
export const CHAPTER_TYPES = {
  HERO: "hero",
  PINNED: "pinned",
  SCROLL: "scroll",
  CTA: "cta",
} as const;

export type ChapterType = (typeof CHAPTER_TYPES)[keyof typeof CHAPTER_TYPES];

// Navigation variants
export const NAVIGATION_VARIANTS = {
  SIDEBAR: "sidebar",
  FLOATING: "floating",
  FIXED_BOTTOM: "fixed-bottom",
} as const;

export type NavigationVariant =
  (typeof NAVIGATION_VARIANTS)[keyof typeof NAVIGATION_VARIANTS];

// Stepper variants
export const STEPPER_VARIANTS = {
  HORIZONTAL: "horizontal",
  VERTICAL: "vertical",
} as const;

export type StepperVariant =
  (typeof STEPPER_VARIANTS)[keyof typeof STEPPER_VARIANTS];

// Debug configuration
export const DEBUG_CONFIG = {
  ENABLE_SCROLL_DEBUG: process.env.NODE_ENV === "development",
  ENABLE_EXPERIMENT_DEBUG: process.env.NODE_ENV === "development",
  LOG_TRANSITIONS: false,
  LOG_NAVIGATION: false,
  LOG_PERFORMANCE: false,
} as const;

// Analytics events
export const ANALYTICS_EVENTS = {
  CHAPTER_ENTER: "chapter_enter",
  CHAPTER_NAVIGATE: "chapter_navigate",
  STEP_CHANGE: "step_change",
  SCROLL_PROGRESS: "scroll_progress",
} as const;

// Feature flags for scroll behavior
export const SCROLL_FEATURES = {
  ENABLE_PINNING: true,
  ENABLE_TRANSITIONS: true,
  ENABLE_ANALYTICS: true,
  ENABLE_KEYBOARD_NAV: true,
  ENABLE_DEBUG: process.env.NODE_ENV === "development",
} as const;
