import type { ValidationErrors } from "@/types/canonical";

export interface Plan {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  interval: "monthly" | "annual";
  description: string;
  features: string[];
  popular?: boolean;
  discount?: number;
}

export interface PaymentData {
  paymentMethod: "card" | "pix" | "boleto";
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardName: string;
  installments: number;
  cpf: string;
  acceptTerms: boolean;
}

export interface PaymentErrors extends ValidationErrors {
  acceptTerms?: string;
  submit?: string;
}

export interface CheckoutCalculations {
  subtotal: number;
  discount: number;
  total: number;
  savings: number;
}
