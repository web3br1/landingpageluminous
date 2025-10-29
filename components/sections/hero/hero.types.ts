// Hero Section Component Types
// Type definitions for the Hero component props and variants

// Temporary local type to avoid circular imports
export interface HeroContent {
  headline: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
  badge?: string;
  metrics?: Array<{
    value: string;
    label: string;
  }>;
}

export interface HeroComponentProps {
  content: HeroContent;
  variant?: HeroVariant;
  tracking?: HeroTracking;
  onPrimaryCta?: () => void;
  onSecondaryCta?: () => void;
  className?: string;
  headingId?: string;
}

export type HeroVariant =
  | "default"
  | "experiment_a"
  | "experiment_b"
  | "enterprise";

export interface HeroTracking {
  experimentId?: string;
  variant?: string;
  section: "hero";
}
