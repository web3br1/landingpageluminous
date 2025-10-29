// Domain Types - Features Section
// Type definitions for features section content and configuration

export interface FeatureContent {
  icon: string; // Icon identifier (e.g., "Code", "Database")
  title: string;
  description: string;
  highlight?: string; // Optional highlight/badge (e.g., "Novo", "Premium")
}

export interface FeaturesContent {
  title: string;
  subtitle: string;
  features: FeatureContent[];
  layout?: "grid" | "zigzag" | "list";
}

export interface FeaturesVariant {
  id: string;
  name: string;
  description: string;
  content: FeaturesContent;
  weight?: number; // For A/B testing (0-100)
  conditions?: {
    userType?: "startup" | "enterprise" | "smb" | "all";
    industry?: string[];
  };
}

export interface FeaturesConfiguration {
  variants: FeaturesVariant[];
  defaultVariant: string;
}

// Type for features composer result
export interface ComposedFeaturesData {
  content: FeaturesContent;
  variant: FeaturesVariant;
  experiment?: {
    id: string;
    variant: string;
    isActive: boolean;
  };
}
