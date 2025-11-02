import React from "react";
import { motion } from "framer-motion";
import { Check, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Plan, CheckoutCalculations } from "../types/checkout.types";

interface PlanSelectorProps {
  selectedPlan: Plan;
  billingCycle: "monthly" | "annual";
  calculations: CheckoutCalculations;
  onPlanChange: (plan: Plan) => void;
  onBillingCycleChange: (cycle: "monthly" | "annual") => void;
}

export function PlanSelector({
  selectedPlan,
  billingCycle,
  calculations,
  onPlanChange,
  onBillingCycleChange,
}: PlanSelectorProps) {
  return (
    <div className="space-y-6">
      {/* Billing Toggle */}
      <div className="flex items-center justify-center bg-gray-100 rounded-lg p-1 w-fit mx-auto">
        <button
          onClick={() => onBillingCycleChange("monthly")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            billingCycle === "monthly"
              ? "bg-white shadow-sm text-gray-900"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Mensal
        </button>
        <button
          onClick={() => onBillingCycleChange("annual")}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all relative ${
            billingCycle === "annual"
              ? "bg-white shadow-sm text-gray-900"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Anual
          <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1 py-0">
            -20%
          </Badge>
        </button>
      </div>

      {/* Plan Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          {
            id: "starter",
            name: "Iniciante",
            price: 97,
            originalPrice: 127,
            description: "Perfeito para pequenos negócios",
            features: ["Até 3 usuários", "5 dashboards", "Suporte email"],
            popular: false,
          },
          {
            id: "professional",
            name: "Profissional",
            price: 237,
            originalPrice: 297,
            description: "Para empresas em crescimento",
            features: ["Até 15 usuários", "Dashboards ilimitados", "Suporte prioritário"],
            popular: true,
          },
          {
            id: "enterprise",
            name: "Enterprise",
            price: 0,
            description: "Soluções personalizadas",
            features: ["Usuários ilimitados", "Suporte 24/7", "SLA garantido"],
            popular: false,
          },
        ].map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={`p-6 cursor-pointer transition-all hover:shadow-lg relative ${
                selectedPlan.id === plan.id
                  ? "ring-2 ring-blue-500 shadow-lg"
                  : "hover:shadow-md"
              } ${plan.popular ? "border-blue-500" : ""}`}
              onClick={() => onPlanChange(plan as Plan)}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-3 py-1">
                    <Star className="w-3 h-3 mr-1" />
                    Mais Popular
                  </Badge>
                </div>
              )}

              <div className="text-center mb-4">
                <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-2">
                  {plan.price > 0 ? (
                    <>
                      <span className="text-3xl font-bold">
                        R$ {billingCycle === "annual" ? Math.round(plan.price * 12 * 0.8) : plan.price}
                      </span>
                      <span className="text-gray-500 text-sm">/{billingCycle === "annual" ? "ano" : "mês"}</span>
                      {billingCycle === "annual" && plan.originalPrice && (
                        <div className="text-sm text-gray-500 line-through">
                          R$ {plan.originalPrice * 12}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className="text-lg text-gray-600">Personalizado</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">{plan.description}</p>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-sm">
                    <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                  selectedPlan.id === plan.id
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {selectedPlan.id === plan.id ? "Selecionado" : "Selecionar"}
              </button>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Order Summary */}
      <Card className="p-6 bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Resumo do Pedido</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>{selectedPlan.name}</span>
            <span>R$ {calculations.subtotal.toFixed(2)}</span>
          </div>
          {calculations.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span>Desconto anual</span>
              <span>-R$ {calculations.discount.toFixed(2)}</span>
            </div>
          )}
          <hr className="my-2" />
          <div className="flex justify-between font-bold text-lg">
            <span>Total</span>
            <span>R$ {calculations.total.toFixed(2)}</span>
          </div>
          {calculations.savings > 0 && (
            <p className="text-sm text-green-600 text-right">
              Você economiza R$ {calculations.savings.toFixed(2)} por ano
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
