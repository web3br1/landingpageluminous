// Domain Types - Marketing Hero Section
// Type definitions for hero section content and configuration

export interface HeroContent {
  // Core content
  headline: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta?: string;

  // Optional enhancements
  badge?: string;
  metrics?: Array<{
    value: string;
    label: string;
  }>;

  // Visual elements
  backgroundImage?: string;
  mockupImage?: string;

  // Tracking data for analytics
  tracking?: {
    experimentId?: string;
    variant?: string;
    section: "hero";
    sectionId?: string;
    eventCategory?: string;
    eventAction?: string;
  };
}

export interface HeroVariant {
  id: string;
  name: string;
  description: string; // Required for composition validation
  content: HeroContent;
  weight?: number; // For A/B testing (0-100)
  conditions?: {
    device?: "mobile" | "desktop" | "all";
    userType?: "new" | "returning" | "all";
  };
}

export interface HeroConfiguration {
  variants: HeroVariant[];
  defaultVariant: string;
  experimentId?: string;
}

// Type for hero composer result
export interface ComposedHeroData {
  content: HeroContent;
  variant: HeroVariant;
  envelope?: {
    id: string;
    type: string;
    version: string;
    timestamp: number;
  };
  experiment?: {
    id: string;
    variant: string;
    isActive: boolean;
  };
}
