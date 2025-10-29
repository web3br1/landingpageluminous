// Domain Types - Marketing Signup Section
// Type definitions for signup section content and configuration

export interface SignupContent {
  title?: string;
  subtitle?: string;
  plans?: Array<{
    id: string;
    name: string;
    price: string;
    period: string;
    popular?: boolean;
    features: string[];
    ctaText: string;
  }>;
  form?: {
    fields: Array<{
      name: string;
      type: "text" | "email" | "tel" | "select";
      label: string;
      placeholder?: string;
      required?: boolean;
      options?: string[];
    }>;
    submitText: string;
    successMessage: string;
  };
  benefits?: string[];
  ctaText?: string;
  termsText?: string;
}

export interface SignupVariant {
  id: string;
  name: string;
  description: string;
  content: SignupContent;
  weight?: number;
  conditions?: {
    device?: "mobile" | "desktop" | "all";
    userType?: "new" | "returning" | "all";
  };
}

export interface SignupConfiguration {
  variants: SignupVariant[];
  defaultVariant: string;
  experimentId?: string;
}

export interface ComposedSignupData {
  content: SignupContent;
  variant: SignupVariant;
  experiment?: {
    id: string;
    variant: string;
    isActive: boolean;
  };
}
