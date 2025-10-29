// Domain Types - Marketing Trial Section
// Type definitions for trial section content and configuration

export interface TrialContent {
  title?: string;
  subtitle?: string;
  duration?: string;
  features?: string[];
  limitations?: string[];
  form?: {
    fields: Array<{
      name: string;
      type: "text" | "email" | "tel";
      label: string;
      placeholder?: string;
      required?: boolean;
    }>;
    submitText: string;
    successMessage: string;
  };
  ctaText?: string;
  termsText?: string;
}

export interface TrialVariant {
  id: string;
  name: string;
  description: string;
  content: TrialContent;
  weight?: number;
  conditions?: {
    device?: "mobile" | "desktop" | "all";
    userType?: "new" | "returning" | "all";
  };
}

export interface TrialConfiguration {
  variants: TrialVariant[];
  defaultVariant: string;
  experimentId?: string;
}

export interface ComposedTrialData {
  content: TrialContent;
  variant: TrialVariant;
  experiment?: {
    id: string;
    variant: string;
    isActive: boolean;
  };
}
