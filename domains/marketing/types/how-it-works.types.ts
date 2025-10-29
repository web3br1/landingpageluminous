// Domain Types - Marketing How It Works Section
// Type definitions for how-it-works section content and configuration

export interface HowItWorksStep {
  step: number;
  icon: string;
  title: string;
  description: string;
  details?: string[];
  order?: number;
}

export interface HowItWorksContent {
  title?: string;
  subtitle?: string;
  steps?: HowItWorksStep[];
  ctaText?: string;
  ctaLink?: string;
}

export interface HowItWorksVariant {
  id: string;
  name: string;
  description: string;
  content: HowItWorksContent;
  weight?: number; // For A/B testing (0-100)
  conditions?: {
    device?: "mobile" | "desktop" | "all";
    userType?: "new" | "returning" | "all";
  };
}

export interface HowItWorksConfiguration {
  variants: HowItWorksVariant[];
  defaultVariant: string;
  experimentId?: string;
}

// Type for how-it-works composer result
export interface ComposedHowItWorksData {
  content: HowItWorksContent;
  variant: HowItWorksVariant;
  experiment?: {
    id: string;
    variant: string;
    isActive: boolean;
  };
}
