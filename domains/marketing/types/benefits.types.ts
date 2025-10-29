// Domain Types - Benefits Section
// Type definitions for benefits section content and configuration

export interface BenefitContent {
  icon: string; // Icon identifier (e.g., "Zap", "TrendingUp")
  title: string;
  description: string;
  metric?: string; // Optional metric/badge (e.g., "75% faster", "+25% revenue")
}

export interface BenefitsContent {
  title: string;
  subtitle: string;
  benefits: BenefitContent[];
  bottomCta?: string; // Optional bottom call-to-action text
}

export interface BenefitsVariant {
  id: string;
  name: string;
  description: string;
  content: BenefitsContent;
  weight?: number; // For A/B testing (0-100)
  conditions?: {
    userType?: "startup" | "enterprise" | "smb" | "all";
    industry?: string[];
  };
}

export interface BenefitsConfiguration {
  variants: BenefitsVariant[];
  defaultVariant: string;
}

// Type for benefits composer result
export interface ComposedBenefitsData {
  content: BenefitsContent;
  variant: BenefitsVariant;
  experiment?: {
    id: string;
    variant: string;
    isActive: boolean;
  };
}
