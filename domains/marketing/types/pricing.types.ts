// Domain Types - Pricing Section
// Type definitions for pricing section content and configuration

export interface PricingFeature {
  name: string;
  included: boolean;
  highlight?: boolean; // For premium features
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    annual: number;
    currency: string;
  };
  features: PricingFeature[];
  popular?: boolean;
  cta: string;
  badge?: string; // e.g., "Mais Popular", "Recomendado"
  limits?: {
    users?: number | "unlimited";
    projects?: number | "unlimited";
    storage?: string;
  };
}

export interface PricingContent {
  title: string;
  subtitle: string;
  plans: PricingPlan[];
  billingToggle?: {
    enabled: boolean;
    defaultPeriod: "monthly" | "annual";
  };
  highlightPopular?: boolean;
  disclaimer?: string;
}

export interface PricingVariant {
  id: string;
  name: string;
  description: string;
  content: PricingContent;
  weight?: number; // For A/B testing (0-100)
  conditions?: {
    userType?: "startup" | "smb" | "enterprise" | "all";
    region?: string[];
  };
}

export interface PricingConfiguration {
  variants: PricingVariant[];
  defaultVariant: string;
}

// Type for pricing composer result
export interface ComposedPricingData {
  content: PricingContent;
  variant: PricingVariant;
  experiment?: {
    id: string;
    variant: string;
    isActive: boolean;
  };
}
