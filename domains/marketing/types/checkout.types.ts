// Domain Types - Marketing Checkout Section
// Type definitions for checkout section content and configuration

export interface CheckoutContent {
  title?: string;
  subtitle?: string;
  plan?: {
    name: string;
    price: string;
    period: string;
    features: string[];
  };
  paymentMethods?: Array<{
    id: string;
    name: string;
    icon: string;
    description?: string;
  }>;
  billing?: {
    showAddress: boolean;
    showCompanyInfo: boolean;
    requiredFields: string[];
  };
  security?: {
    ssl: boolean;
    pciCompliant: boolean;
    guarantees: string[];
  };
  ctaText?: string;
  termsText?: string;
}

export interface CheckoutVariant {
  id: string;
  name: string;
  description: string;
  content: CheckoutContent;
  weight?: number;
  conditions?: {
    device?: "mobile" | "desktop" | "all";
    userType?: "new" | "returning" | "all";
  };
}

export interface CheckoutConfiguration {
  variants: CheckoutVariant[];
  defaultVariant: string;
  experimentId?: string;
}

export interface ComposedCheckoutData {
  content: CheckoutContent;
  variant: CheckoutVariant;
  experiment?: {
    id: string;
    variant: string;
    isActive: boolean;
  };
}
