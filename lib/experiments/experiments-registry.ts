// ===== EXPERIMENTS REGISTRY =====
// 12 Complete Experiments for Phase 2 A/B Testing
// Implements the full experimentation framework with real variants

import { ExperimentDefinition } from "../ab-testing/ab-testing-framework";

// ===== HERO SECTION EXPERIMENTS (3 experiments) =====

export const HERO_EXPERIMENTS: Record<string, ExperimentDefinition> = {
  "hero-headline-test": {
    id: "hero-headline-test",
    name: "Hero Headline Optimization",
    description: "Test different headline variations for better CTR",
    status: "running",
    variants: [
      {
        id: "control",
        name: "Control",
        weight: 40,
        config: {
          headline: "Automatize seus relatórios em minutos",
          subheadline:
            "Relatórios inteligentes que economizam tempo e aumentam sua produtividade",
        },
        isControl: true,
      },
      {
        id: "variant-benefit",
        name: "Benefit-focused",
        weight: 30,
        config: {
          headline: "Economize 5 horas por semana com relatórios automáticos",
          subheadline:
            "Transforme dados em decisões inteligentes instantaneamente",
        },
      },
      {
        id: "variant-problem",
        name: "Problem-solution",
        weight: 30,
        config: {
          headline: "Pare de perder tempo com planilhas manuais",
          subheadline:
            "Relatórios automáticos que fazem o trabalho duro por você",
        },
      },
    ],
    goals: {
      primary: {
        id: "cta_click",
        name: "CTA Click Rate",
        type: "conversion",
        metric: "cta_click",
        direction: "increase",
      },
    },
    startDate: new Date(),
    confidenceLevel: 0.95,
    minimumDetectableEffect: 10,
    sampleSize: 2000,
  },

  "hero-visual-test": {
    id: "hero-visual-test",
    name: "Hero Visual Style",
    description: "Test different hero visual approaches",
    status: "running",
    variants: [
      {
        id: "control",
        name: "Mockup + Icons",
        weight: 40,
        config: {
          visualType: "mockup",
          background: "gradient",
          animation: "fade-up",
        },
        isControl: true,
      },
      {
        id: "variant-3d",
        name: "3D Illustration",
        weight: 30,
        config: {
          visualType: "3d-illustration",
          background: "solid",
          animation: "slide-up",
        },
      },
      {
        id: "variant-flat",
        name: "Flat Illustration",
        weight: 30,
        config: {
          visualType: "flat-illustration",
          background: "pattern",
          animation: "scale-in",
        },
      },
    ],
    goals: {
      primary: {
        id: "hero_engagement",
        name: "Hero Engagement Time",
        type: "engagement",
        metric: "hero_scroll_depth",
        direction: "increase",
      },
    },
    startDate: new Date(),
    confidenceLevel: 0.95,
    minimumDetectableEffect: 15,
    sampleSize: 1500,
  },

  "cta-button-test": {
    id: "cta-button-test",
    name: "CTA Button Optimization",
    description: "Test different CTA button designs and copy",
    status: "running",
    variants: [
      {
        id: "control",
        name: 'Primary + "Comece grátis"',
        weight: 40,
        config: {
          text: "Comece grátis",
          style: "primary",
          size: "large",
          animation: "none",
        },
        isControl: true,
      },
      {
        id: "variant-demo",
        name: "Demo CTA",
        weight: 30,
        config: {
          text: "Agendar demo",
          style: "secondary",
          size: "large",
          animation: "pulse",
        },
      },
      {
        id: "variant-trial",
        name: "Trial CTA",
        weight: 30,
        config: {
          text: "Teste gratuito por 14 dias",
          style: "success",
          size: "large",
          animation: "glow",
        },
      },
    ],
    goals: {
      primary: {
        id: "cta_conversion",
        name: "CTA Conversion Rate",
        type: "conversion",
        metric: "cta_conversion",
        direction: "increase",
      },
    },
    startDate: new Date(),
    confidenceLevel: 0.95,
    minimumDetectableEffect: 12,
    sampleSize: 1800,
  },
};

// ===== PRICING EXPERIMENTS (3 experiments) =====

export const PRICING_EXPERIMENTS: Record<string, ExperimentDefinition> = {
  "pricing-layout-test": {
    id: "pricing-layout-test",
    name: "Pricing Layout Comparison",
    description: "Test different pricing table layouts",
    status: "running",
    variants: [
      {
        id: "control",
        name: "3-Column Cards",
        weight: 40,
        config: {
          layout: "cards",
          highlight: "popular",
          tiers: 3,
        },
        isControl: true,
      },
      {
        id: "variant-comparison",
        name: "Comparison Table",
        weight: 35,
        config: {
          layout: "comparison",
          highlight: "savings",
          tiers: 3,
        },
      },
      {
        id: "variant-annual",
        name: "Annual Focus",
        weight: 25,
        config: {
          layout: "cards",
          highlight: "annual",
          tiers: 3,
        },
      },
    ],
    goals: {
      primary: {
        id: "pricing_conversion",
        name: "Pricing Conversion Rate",
        type: "conversion",
        metric: "pricing_conversion",
        direction: "increase",
      },
    },
    startDate: new Date(),
    confidenceLevel: 0.95,
    minimumDetectableEffect: 8,
    sampleSize: 2500,
  },

  "pricing-messaging-test": {
    id: "pricing-messaging-test",
    name: "Pricing Value Proposition",
    description: "Test different pricing messaging approaches",
    status: "running",
    variants: [
      {
        id: "control",
        name: "Feature-based",
        weight: 40,
        config: {
          messaging: "features",
          emphasis: "unlimited_users",
        },
        isControl: true,
      },
      {
        id: "variant-roi",
        name: "ROI-focused",
        weight: 30,
        config: {
          messaging: "roi",
          emphasis: "time_saved",
        },
      },
      {
        id: "variant-social",
        name: "Social Proof",
        weight: 30,
        config: {
          messaging: "social_proof",
          emphasis: "popular_choice",
        },
      },
    ],
    goals: {
      primary: {
        id: "pricing_engagement",
        name: "Pricing Section Engagement",
        type: "engagement",
        metric: "pricing_time_spent",
        direction: "increase",
      },
    },
    startDate: new Date(),
    confidenceLevel: 0.95,
    minimumDetectableEffect: 10,
    sampleSize: 2000,
  },

  "pricing-trial-test": {
    id: "pricing-trial-test",
    name: "Trial Offer Presentation",
    description: "Test different trial offer presentations",
    status: "running",
    variants: [
      {
        id: "control",
        name: "Standard Trial",
        weight: 40,
        config: {
          trialType: "standard",
          duration: 14,
          highlight: "no_credit_card",
        },
        isControl: true,
      },
      {
        id: "variant-guarantee",
        name: "Money-back Guarantee",
        weight: 30,
        config: {
          trialType: "guarantee",
          duration: 30,
          highlight: "money_back",
        },
      },
      {
        id: "variant-freemium",
        name: "Freemium Upgrade",
        weight: 30,
        config: {
          trialType: "freemium",
          duration: 0,
          highlight: "free_forever",
        },
      },
    ],
    goals: {
      primary: {
        id: "trial_signup",
        name: "Trial Signup Rate",
        type: "conversion",
        metric: "trial_signup",
        direction: "increase",
      },
    },
    startDate: new Date(),
    confidenceLevel: 0.95,
    minimumDetectableEffect: 15,
    sampleSize: 1600,
  },
};

// ===== SOCIAL PROOF EXPERIMENTS (2 experiments) =====

export const SOCIAL_PROOF_EXPERIMENTS: Record<string, ExperimentDefinition> = {
  "social-proof-style-test": {
    id: "social-proof-style-test",
    name: "Social Proof Presentation",
    description: "Test different social proof presentation styles",
    status: "running",
    variants: [
      {
        id: "control",
        name: "Logo Grid + Testimonials",
        weight: 50,
        config: {
          style: "logos_testimonials",
          animation: "fade_in",
        },
        isControl: true,
      },
      {
        id: "variant-marquee",
        name: "Scrolling Marquee",
        weight: 50,
        config: {
          style: "marquee",
          animation: "scroll",
        },
      },
    ],
    goals: {
      primary: {
        id: "social_proof_engagement",
        name: "Social Proof Engagement",
        type: "engagement",
        metric: "social_proof_views",
        direction: "increase",
      },
    },
    startDate: new Date(),
    confidenceLevel: 0.95,
    minimumDetectableEffect: 5,
    sampleSize: 3000,
  },

  "trust-signals-test": {
    id: "trust-signals-test",
    name: "Trust Signals Placement",
    description: "Test different trust signal placements",
    status: "running",
    variants: [
      {
        id: "control",
        name: "Footer Only",
        weight: 40,
        config: {
          placement: "footer",
          signals: ["security", "gdpr", "ssl"],
        },
        isControl: true,
      },
      {
        id: "variant-header",
        name: "Header + Footer",
        weight: 35,
        config: {
          placement: "header_footer",
          signals: ["security", "gdpr", "ssl", "uptime"],
        },
      },
      {
        id: "variant-inline",
        name: "Inline with Content",
        weight: 25,
        config: {
          placement: "inline",
          signals: ["security", "gdpr", "ssl", "uptime", "support"],
        },
      },
    ],
    goals: {
      primary: {
        id: "trust_conversion",
        name: "Trust-based Conversions",
        type: "conversion",
        metric: "trust_based_signup",
        direction: "increase",
      },
    },
    startDate: new Date(),
    confidenceLevel: 0.95,
    minimumDetectableEffect: 7,
    sampleSize: 2200,
  },
};

// ===== CONTENT EXPERIMENTS (2 experiments) =====

export const CONTENT_EXPERIMENTS: Record<string, ExperimentDefinition> = {
  "benefits-presentation-test": {
    id: "benefits-presentation-test",
    name: "Benefits Presentation Style",
    description: "Test different ways to present product benefits",
    status: "running",
    variants: [
      {
        id: "control",
        name: "Feature Cards",
        weight: 40,
        config: {
          format: "cards",
          style: "icons_text",
        },
        isControl: true,
      },
      {
        id: "variant-numbers",
        name: "Quantified Benefits",
        weight: 30,
        config: {
          format: "numbers",
          style: "metrics_focused",
        },
      },
      {
        id: "variant-story",
        name: "Story-based",
        weight: 30,
        config: {
          format: "story",
          style: "narrative_flow",
        },
      },
    ],
    goals: {
      primary: {
        id: "benefits_engagement",
        name: "Benefits Section Engagement",
        type: "engagement",
        metric: "benefits_scroll_time",
        direction: "increase",
      },
    },
    startDate: new Date(),
    confidenceLevel: 0.95,
    minimumDetectableEffect: 8,
    sampleSize: 1800,
  },

  "faq-presentation-test": {
    id: "faq-presentation-test",
    name: "FAQ Presentation Format",
    description: "Test different FAQ presentation formats",
    status: "running",
    variants: [
      {
        id: "control",
        name: "Accordion Style",
        weight: 50,
        config: {
          format: "accordion",
          animation: "smooth_expand",
        },
        isControl: true,
      },
      {
        id: "variant-tabs",
        name: "Tabbed Categories",
        weight: 50,
        config: {
          format: "tabs",
          animation: "slide_transition",
        },
      },
    ],
    goals: {
      primary: {
        id: "faq_engagement",
        name: "FAQ Interaction Rate",
        type: "engagement",
        metric: "faq_interactions",
        direction: "increase",
      },
    },
    startDate: new Date(),
    confidenceLevel: 0.95,
    minimumDetectableEffect: 6,
    sampleSize: 2000,
  },
};

// ===== USER EXPERIENCE EXPERIMENTS (2 experiments) =====

export const UX_EXPERIMENTS: Record<string, ExperimentDefinition> = {
  "navigation-style-test": {
    id: "navigation-style-test",
    name: "Navigation Experience",
    description: "Test different navigation patterns",
    status: "running",
    variants: [
      {
        id: "control",
        name: "Sticky Header",
        weight: 50,
        config: {
          style: "sticky",
          cta: "visible",
        },
        isControl: true,
      },
      {
        id: "variant-floating",
        name: "Floating CTA",
        weight: 50,
        config: {
          style: "floating_cta",
          cta: "persistent",
        },
      },
    ],
    goals: {
      primary: {
        id: "navigation_efficiency",
        name: "Navigation Efficiency",
        type: "engagement",
        metric: "page_scroll_efficiency",
        direction: "increase",
      },
    },
    startDate: new Date(),
    confidenceLevel: 0.95,
    minimumDetectableEffect: 4,
    sampleSize: 2500,
  },

  "mobile-optimization-test": {
    id: "mobile-optimization-test",
    name: "Mobile Experience Optimization",
    description: "Test mobile-specific optimizations",
    status: "running",
    variants: [
      {
        id: "control",
        name: "Standard Mobile",
        weight: 40,
        config: {
          layout: "standard",
          cta: "bottom_sticky",
        },
        isControl: true,
      },
      {
        id: "variant-app-like",
        name: "App-like Experience",
        weight: 35,
        config: {
          layout: "app_like",
          cta: "floating_action",
        },
      },
      {
        id: "variant-simplified",
        name: "Simplified Mobile",
        weight: 25,
        config: {
          layout: "simplified",
          cta: "inline_scroll",
        },
      },
    ],
    goals: {
      primary: {
        id: "mobile_conversion",
        name: "Mobile Conversion Rate",
        type: "conversion",
        metric: "mobile_signup_rate",
        direction: "increase",
      },
    },
    targetAudience: {
      devices: ["mobile"],
    },
    startDate: new Date(),
    confidenceLevel: 0.95,
    minimumDetectableEffect: 12,
    sampleSize: 1200,
  },
};

// ===== COMPLETE EXPERIMENTS REGISTRY =====

export const ALL_EXPERIMENTS: Record<string, ExperimentDefinition> = {
  ...HERO_EXPERIMENTS,
  ...PRICING_EXPERIMENTS,
  ...SOCIAL_PROOF_EXPERIMENTS,
  ...CONTENT_EXPERIMENTS,
  ...UX_EXPERIMENTS,
};

// ===== EXPERIMENT GROUPS =====

export const EXPERIMENT_GROUPS = {
  hero: Object.keys(HERO_EXPERIMENTS),
  pricing: Object.keys(PRICING_EXPERIMENTS),
  social_proof: Object.keys(SOCIAL_PROOF_EXPERIMENTS),
  content: Object.keys(CONTENT_EXPERIMENTS),
  ux: Object.keys(UX_EXPERIMENTS),
} as const;

// ===== UTILITY FUNCTIONS =====

export function getExperimentsByGroup(
  group: keyof typeof EXPERIMENT_GROUPS,
): ExperimentDefinition[] {
  return EXPERIMENT_GROUPS[group]
    .map((id) => ALL_EXPERIMENTS[id])
    .filter(Boolean);
}

export function getActiveExperiments(): ExperimentDefinition[] {
  return Object.values(ALL_EXPERIMENTS).filter(
    (exp) => exp.status === "running",
  );
}

export function getExperimentById(id: string): ExperimentDefinition | null {
  return ALL_EXPERIMENTS[id] || null;
}

export function getExperimentMetrics(experimentId: string): string[] {
  const experiment = getExperimentById(experimentId);
  if (!experiment) return [];

  const metrics = [experiment.goals.primary.metric];
  if (experiment.goals.secondary) {
    metrics.push(...experiment.goals.secondary.map((g) => g.metric));
  }
  return metrics;
}
