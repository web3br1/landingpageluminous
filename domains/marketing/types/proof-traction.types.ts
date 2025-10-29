// Domain Types - Marketing Proof Traction Section
// Type definitions for proof-traction section content and configuration

export interface Metric {
  value: string;
  label: string;
  icon?: string;
  description?: string;
  trend?: "up" | "down" | "neutral";
}

export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  avatar?: string;
  rating?: number;
}

export interface ProofTractionContent {
  title?: string;
  subtitle?: string;
  metrics?: Metric[];
  testimonials?: Testimonial[];
  logos?: string[];
  achievements?: Array<{
    title: string;
    description: string;
    icon?: string;
  }>;
}

export interface ProofTractionVariant {
  id: string;
  name: string;
  description: string;
  content: ProofTractionContent;
  weight?: number; // For A/B testing (0-100)
  conditions?: {
    device?: "mobile" | "desktop" | "all";
    userType?: "new" | "returning" | "all";
  };
}

export interface ProofTractionConfiguration {
  variants: ProofTractionVariant[];
  defaultVariant: string;
  experimentId?: string;
}

// Type for proof-traction composer result
export interface ComposedProofTractionData {
  content: ProofTractionContent;
  variant: ProofTractionVariant;
  experiment?: {
    id: string;
    variant: string;
    isActive: boolean;
  };
}
