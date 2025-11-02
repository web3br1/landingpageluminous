"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Shield, Lock } from "lucide-react";

// Import modular components
import { CheckoutHeader } from "./components/CheckoutHeader";
import { PlanSelector } from "./components/PlanSelector";
import { PaymentForm } from "./components/PaymentForm";
import { CheckoutSuccessScreen } from "./components/CheckoutSuccessScreen";

// Import hooks and utilities
import { useCheckoutState } from "./hooks/useCheckoutState";

// Re-export types for backward compatibility
export type { Plan, PaymentData, PaymentErrors } from "./types/checkout.types";

export function CheckoutPage() {
  const checkoutState = useCheckoutState();

  if (checkoutState.isCompleted) {
    return (
      <CheckoutSuccessScreen
        selectedPlan={checkoutState.selectedPlan}
        calculations={checkoutState.calculations}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <CheckoutHeader />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">✓</span>
                </div>
                <span className="font-medium">Escolher Plano</span>
              </div>
              <div className="h-px bg-gray-300 flex-1"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">2</span>
                </div>
                <span className="font-medium">Pagamento</span>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Plan Selection and Payment */}
            <div className="lg:col-span-2 space-y-6">
              <PlanSelector
                selectedPlan={checkoutState.selectedPlan}
                billingCycle={checkoutState.billingCycle}
                calculations={checkoutState.calculations}
                onPlanChange={checkoutState.handlePlanChange}
                onBillingCycleChange={checkoutState.setBillingCycle}
              />

              <PaymentForm
                paymentData={checkoutState.paymentData}
                errors={checkoutState.errors}
                isProcessing={checkoutState.isProcessing}
                onPaymentChange={checkoutState.handlePaymentChange}
                onSubmit={checkoutState.handleSubmit}
              />
            </div>

            {/* Right Column - Order Summary */}
            <div className="space-y-6">
              <Card className="p-6 sticky top-4">
                <h3 className="text-lg font-semibold mb-4">Resumo do Pedido</h3>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {checkoutState.selectedPlan.name}
                    </span>
                    <span className="text-muted-foreground">
                      {checkoutState.billingCycle === "annual" ? "Anual" : "Mensal"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>R$ {checkoutState.calculations.subtotal.toFixed(2)}</span>
                  </div>
                  {checkoutState.calculations.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Desconto</span>
                      <span>-R$ {checkoutState.calculations.discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>R$ {checkoutState.calculations.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={checkoutState.handleSubmit}
                    disabled={checkoutState.isProcessing}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {checkoutState.isProcessing ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processando...</span>
                      </div>
                    ) : (
                      "Finalizar Compra"
                    )}
                  </button>

                  {checkoutState.errors.submit && (
                    <p className="text-red-500 text-sm text-center">
                      {checkoutState.errors.submit}
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      <span>SSL Seguro</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Dados Protegidos</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
