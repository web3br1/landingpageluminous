import type { Plan, CheckoutCalculations } from "../types/checkout.types";

// Função extraída para calcular preços
export function calculatePricing(selectedPlan: Plan, billingCycle: "monthly" | "annual"): CheckoutCalculations {
  const basePrice = selectedPlan.price;
  const annualPrice = basePrice * 12;
  const discount = billingCycle === "annual" ? annualPrice * 0.2 : 0; // 20% discount for annual

  const subtotal = billingCycle === "annual" ? annualPrice : basePrice;
  const total = subtotal - discount;
  const savings = discount;

  return {
    subtotal,
    discount,
    total,
    savings,
  };
}
