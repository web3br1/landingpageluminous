// Domain Types - Marketing Pricing Presale Section
// Type definitions for pricing presale section content and configuration

export interface PricingPlan {
  name: string;
  headline: string;
  price: string;
  period?: string;
  originalPrice?: string;
  description: string;
  features: string[];
  benefits: string[];
  ctaText: string;
  popular?: boolean;
  limitedTime?: boolean;
  guarantee?: string;
}

export interface PricingPresaleContent {
  title?: string;
  subtitle?: string;
  plans?: PricingPlan[];
  guarantee?: string;
  urgencyText?: string;
}

export interface PricingPresaleVariant {
  id: string;
  name: string;
  description: string;
  content: PricingPresaleContent;
  weight?: number; // For A/B testing (0-100)
  conditions?: {
    device?: "mobile" | "desktop" | "all";
    userType?: "new" | "returning" | "all";
  };
}

export interface PricingPresaleConfiguration {
  variants: PricingPresaleVariant[];
  defaultVariant: string;
  experimentId?: string;
}

// Type for pricing presale composer result
export interface ComposedPricingPresaleData {
  content: PricingPresaleContent;
  variant: PricingPresaleVariant;
  experiment?: {
    id: string;
    variant: string;
    isActive: boolean;
  };
}
