import type { Plan } from "../types/checkout.types";
import { availablePlans } from "../constants/plans";

// Função extraída para recomendar plano baseado no signup
export function recommendPlanFromSignup(): Plan | null {
  try {
    const signupData = localStorage.getItem("signup-data");
    if (!signupData) return null;

    const data = JSON.parse(signupData);

    // Recommend based on budget
    if (data.budget === "under-500") {
      return availablePlans[0]; // Starter
    }
    if (data.budget === "500-1000") {
      return availablePlans[1]; // Professional
    }
    if (data.budget === "1000-2000" || data.budget === "2000+") {
      return availablePlans[1]; // Professional
    }
  } catch {
    // Use default on error
  }
  return null;
}
