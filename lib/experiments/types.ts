// Core types for A/B testing and feature flags

export interface ExperimentVariant {
  id: string;
  name: string;
  weight: number; // Percentage 0-100
  config?: Record<string, any>;
}

export interface Experiment {
  id: string;
  name: string;
  description: string;
  status: "draft" | "running" | "paused" | "completed";
  variants: ExperimentVariant[];
  targetAudience?: {
    userSegment?: "smb" | "enterprise" | "startup";
    trafficPercentage?: number;
    countries?: string[];
  };
  metrics: {
    primary: string; // e.g., 'cta_click_rate'
    secondary?: string[];
  };
  startDate?: Date;
  endDate?: Date;
  winner?: string; // variant id
}

export interface ExperimentResult {
  experimentId: string;
  variantId: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
  confidence?: number;
  statisticalSignificance?: boolean;
  metrics?: Record<string, ExperimentMetrics>;
}

export interface ExperimentMetrics {
  experimentId: string;
  totalEvents: number;
  sampleSize: number;
  improvement?: number;
  statisticalSignificance?: StatisticalSignificance;
  powerAnalysis?: {
    requiredSampleSize: number;
    statisticalPower?: number;
    sampleSize: number;
  };
}

export interface StatisticalSignificance {
  isSignificant: boolean;
  pValue: number;
  confidenceInterval?: [number, number];
  level?: number;
  effectSize?: number;
}

export interface UserExperiment {
  experimentId: string;
  variantId: string;
  assignedAt: Date;
  sessionId: string;
  userId?: string;
}

export interface ExperimentEvent {
  experimentId: string;
  variantId: string;
  eventType: "view" | "click" | "convert" | "custom";
  eventName?: string;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number; // 0-100
  conditions?: {
    userSegment?: string[];
    countries?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
}

// Built-in experiments for landing page sections
export const BUILT_IN_EXPERIMENTS: Record<
  string,
  Omit<Experiment, "status" | "startDate" | "endDate" | "winner">
> = {
  hero_headline: {
    id: "hero_headline",
    name: "Hero Headline Variants",
    description: "Test different hero headlines for better conversion",
    variants: [
      { id: "control", name: "Control", weight: 50 },
      { id: "variant_a", name: "Variant A", weight: 25 },
      { id: "variant_b", name: "Variant B", weight: 25 },
    ],
    metrics: {
      primary: "cta_click_rate",
    },
  },
  cta_button_color: {
    id: "cta_button_color",
    name: "CTA Button Color",
    description: "Test different CTA button colors",
    variants: [
      { id: "primary", name: "Primary Blue", weight: 50 },
      { id: "success", name: "Success Green", weight: 25 },
      { id: "warning", name: "Warning Orange", weight: 25 },
    ],
    metrics: {
      primary: "cta_click_rate",
    },
  },
  pricing_layout: {
    id: "pricing_layout",
    name: "Pricing Layout",
    description: "Test different pricing table layouts",
    variants: [
      { id: "cards", name: "Card Layout", weight: 50 },
      { id: "comparison", name: "Comparison Table", weight: 50 },
    ],
    metrics: {
      primary: "pricing_conversion_rate",
    },
  },
} as const;
