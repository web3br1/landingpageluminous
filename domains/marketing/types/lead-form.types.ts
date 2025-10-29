// Domain Types - Marketing Lead Form Section
// Type definitions for lead-form section content and configuration

export interface LeadFormContent {
  title?: string;
  subtitle?: string;
  fields?: Array<{
    name: string;
    type: "text" | "email" | "tel" | "select" | "textarea";
    label: string;
    placeholder?: string;
    required?: boolean;
    options?: string[] | Array<{ value: string; label: string }>;
  }>;
  submitText?: string;
  submitButton?: {
    text: string;
    variant?: string;
  };
  privacyText?: string;
  successMessage?: string;
}

export interface LeadFormVariant {
  id: string;
  name: string;
  description: string;
  content: LeadFormContent;
  weight?: number;
  conditions?: {
    device?: "mobile" | "desktop" | "all";
    userType?: "new" | "returning" | "all";
  };
}

export interface LeadFormConfiguration {
  variants: LeadFormVariant[];
  defaultVariant: string;
  experimentId?: string;
}

export interface ComposedLeadFormData {
  content: LeadFormContent;
  variant: LeadFormVariant;
  experiment?: {
    id: string;
    variant: string;
    isActive: boolean;
  };
}
