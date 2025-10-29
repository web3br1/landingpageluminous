// Experiment Configuration Constants
// Centralizes all experiment keys and configuration

export const EXPERIMENT_KEYS = {
  HERO_HEADLINE: "hero-headline-test",
  HERO_VISUAL: "hero-visual-test",
  CTA_BUTTON: "cta-button-test",
  PRICING_LAYOUT: "pricing-layout-test",
  PRICING_MESSAGING: "pricing-messaging-test",
  PRICING_TRIAL: "pricing-trial-test",
  SOCIAL_PROOF_STYLE: "social-proof-style-test",
  TRUST_SIGNALS: "trust-signals-test",
  BENEFITS_PRESENTATION: "benefits-presentation-test",
  FAQ_PRESENTATION: "faq-presentation-test",
  NAVIGATION_STYLE: "navigation-style-test",
  MOBILE_OPTIMIZATION: "mobile-optimization-test",
} as const;

// Default experiment variants (control versions)
export const DEFAULT_VARIANTS = {
  [EXPERIMENT_KEYS.HERO_HEADLINE]: "control",
  [EXPERIMENT_KEYS.HERO_VISUAL]: "control",
  [EXPERIMENT_KEYS.CTA_BUTTON]: "control",
  [EXPERIMENT_KEYS.PRICING_LAYOUT]: "control",
  [EXPERIMENT_KEYS.PRICING_MESSAGING]: "control",
  [EXPERIMENT_KEYS.PRICING_TRIAL]: "control",
  [EXPERIMENT_KEYS.SOCIAL_PROOF_STYLE]: "control",
  [EXPERIMENT_KEYS.TRUST_SIGNALS]: "control",
  [EXPERIMENT_KEYS.BENEFITS_PRESENTATION]: "control",
  [EXPERIMENT_KEYS.FAQ_PRESENTATION]: "control",
  [EXPERIMENT_KEYS.NAVIGATION_STYLE]: "control",
  [EXPERIMENT_KEYS.MOBILE_OPTIMIZATION]: "control",
} as const;

// Experiment rollout percentages (for gradual rollouts)
export const EXPERIMENT_ROLLOUTS = {
  [EXPERIMENT_KEYS.HERO_HEADLINE]: 100,
  [EXPERIMENT_KEYS.HERO_VISUAL]: 100,
  [EXPERIMENT_KEYS.CTA_BUTTON]: 100,
  [EXPERIMENT_KEYS.PRICING_LAYOUT]: 100,
  [EXPERIMENT_KEYS.PRICING_MESSAGING]: 100,
  [EXPERIMENT_KEYS.PRICING_TRIAL]: 100,
  [EXPERIMENT_KEYS.SOCIAL_PROOF_STYLE]: 100,
  [EXPERIMENT_KEYS.TRUST_SIGNALS]: 100,
  [EXPERIMENT_KEYS.BENEFITS_PRESENTATION]: 100,
  [EXPERIMENT_KEYS.FAQ_PRESENTATION]: 100,
  [EXPERIMENT_KEYS.NAVIGATION_STYLE]: 100,
  [EXPERIMENT_KEYS.MOBILE_OPTIMIZATION]: 100,
} as const;
