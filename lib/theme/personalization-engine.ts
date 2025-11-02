// Personalization Engine - Header-based Theme Resolution
// Implements points 9-12: personalization by headers without component logic

import { murmurHash3 } from "@/lib/architecture/crypto-utils";

export interface PersonalizationContext {
  tenant?: string;
  campaign?: string;
  abVariant?: "A" | "B";
  country?: string;
  locale?: string;
  geo?: string;
}

export interface ResolvedTheme {
  themeId: string;
  variant: "A" | "B";
  locale: string;
  currency: string;
  direction: "ltr" | "rtl";
  customTokens: Record<string, unknown>;
}

export interface ExperimentResult {
  variant: string;
  isNewAssignment: boolean;
}

export interface OverrideStep {
  step: "defaults" | "tenant" | "campaign" | "geo" | "ab" | "final";
  themeId: string;
  variant: "A" | "B";
  reason: string;
  priority: number;
  context?: Record<string, unknown>;
}

export { EXPERIMENT_CONFIGS, getExperimentVariant };

// Tenant-specific configurations
const TENANT_CONFIGS: Record<
  string,
  {
    defaultTheme: string;
    brandColors: {
      primary: string;
      secondary: string;
      accent: string;
    };
    logo?: string;
    favicon?: string;
    tone: "professional" | "casual" | "technical";
  }
> = {
  acme: {
    defaultTheme: "liquid-glass",
    brandColors: {
      primary: "210 60% 50%",
      secondary: "160 50% 45%",
      accent: "300 60% 55%",
    },
    tone: "professional",
  },
  techcorp: {
    defaultTheme: "cyber-neon",
    brandColors: {
      primary: "280 70% 60%",
      secondary: "320 60% 55%",
      accent: "200 70% 65%",
    },
    tone: "technical",
  },
  startup: {
    defaultTheme: "soft-ui",
    brandColors: {
      primary: "260 70% 55%",
      secondary: "190 60% 50%",
      accent: "330 65% 60%",
    },
    tone: "casual",
  },
};

// Campaign-specific overrides
const CAMPAIGN_CONFIGS: Record<
  string,
  {
    themeOverride?: string;
    accentColor?: string;
    urgency: "low" | "medium" | "high";
    tone: "promotional" | "educational" | "seasonal";
  }
> = {
  "black-friday": {
    themeOverride: "neo-brutal",
    accentColor: "0 80% 55%",
    urgency: "high",
    tone: "promotional",
  },
  holiday: {
    themeOverride: "nature-organic",
    accentColor: "25 70% 60%",
    urgency: "medium",
    tone: "seasonal",
  },
  launch: {
    themeOverride: "cyber-neon",
    accentColor: "300 75% 65%",
    urgency: "high",
    tone: "promotional",
  },
  education: {
    themeOverride: "editorial-serif",
    accentColor: "210 30% 45%",
    urgency: "low",
    tone: "educational",
  },
};

// Deterministic A/B bucketing with persistence
const EXPERIMENT_CONFIGS: Record<
  string,
  {
    variants: Record<string, unknown>;
    weights?: Record<string, number>; // Optional custom weights
    persistDays: number;
    consentRequired: boolean;
  }
> = {
  "hero-animation": {
    variants: {
      A: { animation: "fade-up", ctaStyle: "filled" },
      B: { animation: "glass-in", ctaStyle: "outline" },
    },
    weights: { A: 70, B: 30 }, // 70/30 split
    persistDays: 30,
    consentRequired: true,
  },
  "theme-experience": {
    variants: {
      A: { theme: "liquid-glass", features: ["glassmorphism"] },
      B: { theme: "tech-blueprint", features: ["blueprint"] },
    },
    persistDays: 14,
    consentRequired: false, // Theme choice can be persisted without explicit consent
  },
  "cta-positioning": {
    variants: {
      A: { position: "hero-centered" },
      B: { position: "hero-bottom" },
    },
    persistDays: 7,
    consentRequired: true,
  },
};

// Removed duplicate murmurHash3 implementation - now using centralized version

// Get or assign experiment variant deterministically
function getExperimentVariant(
  experimentId: string,
  userId: string,
  context?: PersonalizationContext,
): { variant: string; isNewAssignment: boolean } {
  const config = EXPERIMENT_CONFIGS[experimentId];
  if (!config) {
    console.warn(`Experiment ${experimentId} not configured`);
    return { variant: "A", isNewAssignment: false };
  }

  // Skip if consent required and not granted
  if (config.consentRequired && !hasConsent("analytics")) {
    return { variant: "A", isNewAssignment: false }; // Control group
  }

  const storageKey = `exp_${experimentId}_${userId}`;
  const stored = getExperimentFromStorage(storageKey);

  if (stored) {
    return { variant: stored.variant, isNewAssignment: false };
  }

  // Deterministic assignment based on userId + experimentId
  const hash = murmurHash3(`${userId}:${experimentId}`);
  const variant = selectVariantByWeight(
    hash,
    config.weights || getEqualWeights(config.variants),
  );

  // Store assignment
  setExperimentInStorage(storageKey, {
    variant,
    experimentId,
    assignedAt: Date.now(),
    persistDays: config.persistDays,
  });

  return { variant, isNewAssignment: true };
}

// Helper functions for storage
function getExperimentFromStorage(
  key: string,
): { variant: string; assignedAt: number } | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const data = JSON.parse(stored);
    const config = EXPERIMENT_CONFIGS[data.experimentId];

    // Check if expired
    if (
      config &&
      Date.now() - data.assignedAt > config.persistDays * 24 * 60 * 60 * 1000
    ) {
      localStorage.removeItem(key);
      return null;
    }

    return { variant: data.variant, assignedAt: data.assignedAt };
  } catch {
    return null;
  }
}

function setExperimentInStorage(key: string, data: unknown): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn("Failed to store experiment data:", error);
  }
}

function selectVariantByWeight(
  hash: number,
  weights: Record<string, number>,
): string {
  const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
  let cumulative = 0;

  for (const [variant, weight] of Object.entries(weights)) {
    cumulative += weight / totalWeight;
    if (hash <= cumulative) {
      return variant;
    }
  }

  return Object.keys(weights)[0]; // Fallback to first variant
}

function getEqualWeights(
  variants: Record<string, unknown>,
): Record<string, number> {
  const count = Object.keys(variants).length;
  const weight = 100 / count;
  return Object.keys(variants).reduce(
    (acc, key) => ({ ...acc, [key]: weight }),
    {},
  );
}

function hasConsent(type: string): boolean {
  try {
    // Import dinâmico para evitar dependências circulares
    const { ConsentManager } = require("@/lib/privacy/consent-manager");

    // Mapear tipos de string para as categorias do ConsentManager
    const categoryMap: Record<string, keyof import("@/lib/privacy/consent-manager").ConsentState> = {
      analytics: "analytics",
      marketing: "marketing",
      functional: "functional",
      essential: "essential",
    };

    const category = categoryMap[type];
    if (!category) return false;

    return ConsentManager.hasConsent(category);
  } catch (error) {
    console.warn("Failed to check consent via ConsentManager in personalization, using fallback:", error);
    // Fallback simples para não quebrar funcionalidade
    if (typeof window === "undefined") return false;
    try {
      const consent = localStorage.getItem("consent");
      if (!consent) return false;
      const data = JSON.parse(consent);
      return data[type] === true;
    } catch {
      return false;
    }
  }
}

// Legacy AB_VARIANTS for backward compatibility
const AB_VARIANTS = EXPERIMENT_CONFIGS;

// Geographic configurations
const GEO_CONFIGS: Record<
  string,
  {
    currency: string;
    locale: string;
    direction: "ltr" | "rtl";
    dateFormat: string;
    numberFormat: "comma" | "dot";
  }
> = {
  BR: {
    currency: "BRL",
    locale: "pt-BR",
    direction: "ltr",
    dateFormat: "DD/MM/YYYY",
    numberFormat: "comma",
  },
  US: {
    currency: "USD",
    locale: "en-US",
    direction: "ltr",
    dateFormat: "MM/DD/YYYY",
    numberFormat: "comma",
  },
  DE: {
    currency: "EUR",
    locale: "de-DE",
    direction: "ltr",
    dateFormat: "DD.MM.YYYY",
    numberFormat: "dot",
  },
  AE: {
    currency: "AED",
    locale: "ar-AE",
    direction: "rtl",
    dateFormat: "DD/MM/YYYY",
    numberFormat: "comma",
  },
  JP: {
    currency: "JPY",
    locale: "ja-JP",
    direction: "ltr",
    dateFormat: "YYYY/MM/DD",
    numberFormat: "comma",
  },
};

// Priority-based theme resolution with audit trail
export function resolveTheme(
  context: PersonalizationContext,
): ResolvedTheme & { overrideChain: OverrideStep[] } {
  // Priority: defaults → tenant → campaign → geo → A/B → overrides
  const overrideChain: OverrideStep[] = [];

  // Start with defaults
  let themeId = "liquid-glass"; // default theme
  let variant: "A" | "B" = "A";
  let customTokens: Record<string, unknown> = {};

  overrideChain.push({
    step: "defaults",
    themeId,
    variant,
    reason: "Default fallback theme",
    priority: 0,
  });

  // 1. Apply tenant configuration
  if (context.tenant && TENANT_CONFIGS[context.tenant]) {
    const tenantConfig = TENANT_CONFIGS[context.tenant];
    const oldThemeId = themeId;
    themeId = tenantConfig.defaultTheme;
    customTokens = {
      ...customTokens,
      brand: tenantConfig.brandColors,
      tone: tenantConfig.tone,
    };

    overrideChain.push({
      step: "tenant",
      themeId,
      variant,
      reason: `Tenant "${context.tenant}" override`,
      priority: 1,
      context: { tenant: context.tenant, oldThemeId },
    });
  }

  // 2. Apply campaign overrides
  if (context.campaign && CAMPAIGN_CONFIGS[context.campaign]) {
    const campaignConfig = CAMPAIGN_CONFIGS[context.campaign];
    const oldThemeId = themeId;
    if (campaignConfig.themeOverride) {
      themeId = campaignConfig.themeOverride;
    }
    if (campaignConfig.accentColor) {
      customTokens.accent = campaignConfig.accentColor;
    }
    customTokens = {
      ...customTokens,
      urgency: campaignConfig.urgency,
      campaignTone: campaignConfig.tone,
    };

    overrideChain.push({
      step: "campaign",
      themeId,
      variant,
      reason: `Campaign "${context.campaign}" override`,
      priority: 2,
      context: {
        campaign: context.campaign,
        oldThemeId,
        urgency: campaignConfig.urgency,
      },
    });
  }

  // 3. Apply A/B variants
  if (context.abVariant) {
    const oldVariant = variant;
    variant = context.abVariant;
    // Apply variant-specific customizations
    customTokens = {
      ...customTokens,
      abVariant: context.abVariant,
      variantOverrides: AB_VARIANTS,
    };

    overrideChain.push({
      step: "ab",
      themeId,
      variant,
      reason: `A/B variant "${context.abVariant}" assignment`,
      priority: 3,
      context: { abVariant: context.abVariant, oldVariant },
    });
  }

  // 4. Apply geographic configuration
  let geoConfig = GEO_CONFIGS.US; // default
  let geoSource = "default";
  if (context.country && GEO_CONFIGS[context.country]) {
    geoConfig = GEO_CONFIGS[context.country];
    geoSource = "country";
  } else if (context.geo && GEO_CONFIGS[context.geo]) {
    geoConfig = GEO_CONFIGS[context.geo];
    geoSource = "geo";
  }

  customTokens = {
    ...customTokens,
    geo: geoConfig,
  };

  // Add final step to chain
  overrideChain.push({
    step: "final",
    themeId,
    variant,
    reason: `Final theme resolution: ${themeId} (${variant})`,
    priority: 4,
    context: {
      geoSource,
      locale: geoConfig.locale,
      direction: geoConfig.direction,
    },
  });

  const result = {
    themeId,
    variant,
    locale: geoConfig.locale,
    currency: geoConfig.currency,
    direction: geoConfig.direction,
    customTokens,
    overrideChain,
  };

  // Log override chain for observability
  if (typeof window !== "undefined") {
    console.log("🎭 Theme Resolution Chain:", result.overrideChain);
  }

  return result;
}

// Extract personalization context from headers/cookies
export function extractContextFromHeaders(
  headers: Record<string, string>,
): PersonalizationContext {
  return {
    tenant: headers["x-tenant"],
    campaign: headers["x-campaign"],
    abVariant: (headers["x-ab-variant"] as "A" | "B") || undefined,
    country: headers["x-country"] || headers["cf-ipcountry"],
    locale: headers["accept-language"]?.split(",")[0]?.split("-")[0] || "en",
    geo: headers["x-geo"],
  };
}

import { THEME_REGISTRY } from "./theme-registry";

// Generate CSS custom properties for resolved theme
export function generateThemeCSS(resolvedTheme: ResolvedTheme): string {
  const themePack = THEME_REGISTRY[resolvedTheme.themeId];

  if (!themePack) {
    console.warn(
      `Theme pack "${resolvedTheme.themeId}" not found, falling back to liquid-glass`,
    );
    return generateThemeCSS({ ...resolvedTheme, themeId: "liquid-glass" });
  }

  const tokens = themePack.tokens;
  const customTokens = resolvedTheme.customTokens;

  let css = `
    :root[data-theme="${resolvedTheme.themeId}"] {
      /* Base colors */
      --color-base: ${tokens.colors.base};
      --color-contrast: ${tokens.colors.contrast};
      --color-primary: ${tokens.colors.primary};
      --color-secondary: ${tokens.colors.secondary};
      --color-accent: ${tokens.colors.accent};
      --color-warning: ${tokens.colors.warning};
      --color-success: ${tokens.colors.success};
      --color-error: ${tokens.colors.error};
      --color-border: ${tokens.colors.border};
      --color-surface: ${tokens.colors.surface};
      --color-elevated: ${tokens.colors.elevated};

      /* Typography */
      --font-display: ${tokens.typography.family.display};
      --font-body: ${tokens.typography.family.body};
      --font-size-h1: ${tokens.typography.scale.h1};
      --font-size-h2: ${tokens.typography.scale.h2};
      --font-size-h3: ${tokens.typography.scale.h3};
      --font-size-body: ${tokens.typography.scale.body};
      --font-size-caption: ${tokens.typography.scale.caption};
      --font-size-overline: ${tokens.typography.scale.overline};

      /* Spacing */
      --space-xs: ${tokens.spacing.xs};
      --space-sm: ${tokens.spacing.sm};
      --space-md: ${tokens.spacing.md};
      --space-lg: ${tokens.spacing.lg};
      --space-xl: ${tokens.spacing.xl};
      --space-xxl: ${tokens.spacing.xxl};
      --space-section-mobile: ${tokens.spacing.section.mobile};
      --space-section-desktop: ${tokens.spacing.section.desktop};

      /* Border radius */
      --radius-xs: ${tokens.radius.xs};
      --radius-sm: ${tokens.radius.sm};
      --radius-md: ${tokens.radius.md};
      --radius-lg: ${tokens.radius.lg};
      --radius-xl: ${tokens.radius.xl};

      /* Shadows */
      --shadow-sm: ${tokens.shadows.sm};
      --shadow-md: ${tokens.shadows.md};
      --shadow-lg: ${tokens.shadows.lg};
      --shadow-xl: ${tokens.shadows.xl};

      /* Motion */
      --duration-instant: ${tokens.motion.duration.instant};
      --duration-fast: ${tokens.motion.duration.fast};
      --duration-normal: ${tokens.motion.duration.normal};
      --duration-slow: ${tokens.motion.duration.slow};
      --easing-standard: ${tokens.motion.easing.standard};
      --easing-entrance: ${tokens.motion.easing.entrance};
      --easing-emphasis: ${tokens.motion.easing.emphasis};
      --motion-distance: ${tokens.motion.distance};

      /* Direction */
      --direction: ${resolvedTheme.direction};
    }
  `;

  // Add custom tokens from personalization
  if (customTokens.brand && typeof customTokens.brand === 'object') {
    const brand = customTokens.brand as { primary?: string; secondary?: string; accent?: string };
    css += `
      --color-brand-primary: ${brand.primary || ''};
      --color-brand-secondary: ${brand.secondary || ''};
      --color-brand-accent: ${brand.accent || ''};
    `;
  }

  if (customTokens.accent) {
    css += `--color-accent-override: ${customTokens.accent};`;
  }

  return css;
}

// Performance budgets by theme
export function getPerformanceBudget(themeId: string) {
  const { THEME_REGISTRY } = require("./theme-registry");
  const theme = THEME_REGISTRY[themeId];
  return (
    theme?.performance || {
      lcp: 2500,
      inp: 200,
      cls: 0.1,
    }
  );
}

// Analytics tracking for personalization
export function trackPersonalizationEvent(
  event: "theme_resolved" | "ab_impression" | "geo_detected",
  data: Record<string, unknown>,
) {
  // Implementation would integrate with analytics system
  if (typeof window !== "undefined") {
    // Send to analytics
    console.log("Personalization event:", event, data);
  }
}
