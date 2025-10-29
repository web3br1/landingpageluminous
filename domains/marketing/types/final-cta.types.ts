// Domain Types - Final CTA Section Types
// Type-safe definitions for final CTA content and behavior

export interface FinalCtaContent {
  headline: string;
  subheadline: string;
  primaryButton: {
    text: string;
    link: string;
  };
  secondaryButton?: {
    text: string;
    link: string;
  };
  backgroundImage?: string;
  urgencyText?: string;
  envelope?: {
    id: string;
    type: string;
    version: string;
    timestamp: number;
  };
}

export interface FinalCtaSectionProps {
  content: FinalCtaContent;
  variant?: "default" | "enterprise";
  tracking?: {
    experimentId?: string;
    variant?: string;
    section: "final-cta";
  };
  onPrimaryClick?: () => void;
  onSecondaryClick?: () => void;
  headingId?: string;
}
