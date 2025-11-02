import { useState, useEffect, useMemo } from "react";
import { availablePlans, initialPaymentData } from "../constants/plans";
import { calculatePricing } from "../utils/checkoutCalculations";
import { validatePayment } from "../utils/paymentValidation";
import { recommendPlanFromSignup } from "../utils/planRecommendation";
import type { Plan, PaymentData, PaymentErrors } from "../types/checkout.types";

// Hook customizado para gerenciar checkout state e lógica
export function useCheckoutState() {
  const [selectedPlan, setSelectedPlan] = useState<Plan>(availablePlans[1]);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [paymentData, setPaymentData] = useState<PaymentData>(initialPaymentData);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errors, setErrors] = useState<PaymentErrors>({});

  // Calculate totals with extracted function
  const calculations = useMemo(
    () => calculatePricing(selectedPlan, billingCycle),
    [selectedPlan, billingCycle],
  );

  // Auto-select recommended plan
  useEffect(() => {
    const recommendedPlan = recommendPlanFromSignup();
    if (recommendedPlan) {
      setSelectedPlan(recommendedPlan);
    }
  }, []);

  const handlePlanChange = (plan: Plan) => {
    setSelectedPlan(plan);
  };

  const handlePaymentChange = (
    field: keyof PaymentData,
    value: string | number | boolean,
  ) => {
    setPaymentData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async () => {
    if (!validatePayment(paymentData, setErrors)) {
      return;
    }

    setIsProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate success (90% success rate for demo)
      if (Math.random() > 0.1) {
        setIsCompleted(true);
      } else {
        setErrors({ submit: "Erro no processamento do pagamento. Tente novamente." });
      }
    } catch (error) {
      setErrors({ submit: "Erro inesperado. Tente novamente." });
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    selectedPlan,
    billingCycle,
    paymentData,
    isProcessing,
    isCompleted,
    errors,
    calculations,
    handlePlanChange,
    handlePaymentChange,
    handleSubmit,
    setBillingCycle,
    setIsCompleted,
    validatePayment: () => validatePayment(paymentData, setErrors),
  };
}
