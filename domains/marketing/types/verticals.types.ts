// Domain Types - Marketing Verticals Section
// Type definitions for verticals section content and configuration

export interface Vertical {
  id: string;
  name: string;
  icon: string;
  description: string;
  features: string[];
  useCase?: string;
  order?: number;
}

export interface VerticalsContent {
  title?: string;
  subtitle?: string;
  verticals?: Vertical[];
  ctaText?: string;
  ctaLink?: string;
}

export interface VerticalsVariant {
  id: string;
  name: string;
  description: string;
  content: VerticalsContent;
  weight?: number; // For A/B testing (0-100)
  conditions?: {
    device?: "mobile" | "desktop" | "all";
    userType?: "new" | "returning" | "all";
  };
}

export interface VerticalsConfiguration {
  variants: VerticalsVariant[];
  defaultVariant: string;
  experimentId?: string;
}

// Type for verticals composer result
export interface ComposedVerticalsData {
  content: VerticalsContent;
  variant: VerticalsVariant;
  experiment?: {
    id: string;
    variant: string;
    isActive: boolean;
  };
}
