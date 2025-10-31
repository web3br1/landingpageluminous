"use client";

import React, { useState, useEffect, useMemo } from "react";
import { isErr } from "@/shared/core/Result";
import { isHTMLElement } from "@/lib/utils/dom-type-guards";
import { motion } from "framer-motion";
import { Shield, CheckCircle, Lock, AlertCircle, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// Dynamic import to avoid Stripe initialization during build
const getPaymentService = async () => {
  const { paymentService } = await import("@/lib/payments/payment-service");
  return paymentService;
};

interface Plan {
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

const availablePlans: Plan[] = [
  {
    id: "starter",
    name: "Iniciante",
    price: 97,
    originalPrice: 127,
    interval: "monthly",
    description: "Perfeito para pequenos negócios começando",
    features: [
      "Até 3 usuários",
      "5 dashboards personalizados",
      "Integração com 2 fontes de dados",
      "Relatórios automáticos semanais",
      "Suporte por email",
      "Backup diário",
    ],
    discount: 24,
  },
  {
    id: "professional",
    name: "Profissional",
    price: 237, // Annual price / 12
    originalPrice: 297,
    interval: "monthly",
    description: "Para empresas em crescimento",
    features: [
      "Até 15 usuários",
      "Dashboards ilimitados",
      "Integração com APIs ilimitadas",
      "Relatórios em tempo real",
      "Alertas inteligentes automáticos",
      "Suporte prioritário",
      "API para integrações customizadas",
      "Backup em tempo real",
    ],
    popular: true,
    discount: 20,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 0,
    interval: "monthly",
    description: "Soluções personalizadas para grandes empresas",
    features: [
      "Usuários ilimitados",
      "Soluções customizadas",
      "Integrações enterprise",
      "Suporte dedicado 24/7",
      "SLA garantido",
      "Auditoria e compliance",
      "Treinamento da equipe",
      "Implementação assistida",
    ],
  },
];

interface PaymentData {
  paymentMethod: "card" | "pix" | "boleto";
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardName: string;
  installments: number;
  cpf: string;
  acceptTerms: boolean;
}

interface PaymentErrors extends Omit<Partial<PaymentData>, "acceptTerms"> {
  acceptTerms?: string;
  submit?: string;
}

const initialPaymentData: PaymentData = {
  paymentMethod: "card",
  cardNumber: "",
  expiryDate: "",
  cvv: "",
  cardName: "",
  installments: 1,
  cpf: "",
  acceptTerms: false,
};

// Componente CheckoutSuccessScreen simplificado
function CheckoutSuccessScreen({
  selectedPlan,
  calculations,
}: {
  selectedPlan?: { name?: string };
  calculations?: { total?: number };
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center"
        >
          <Card className="p-12">
            <div className="mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold mb-4 text-green-900">
                Pagamento Aprovado! 🎉
              </h1>
              <p className="text-xl text-green-700 mb-6">
                Bem-vindo ao Luminaris! Sua conta foi ativada com sucesso.
              </p>
            </div>

            <div className="bg-green-50 p-6 rounded-lg mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold">Plano:</span>
                <span>{selectedPlan?.name || "Plano Selecionado"}</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold">Valor:</span>
                <span>R$ {calculations?.total?.toFixed(2) || "0.00"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">Status:</span>
                <Badge className="bg-green-100 text-green-800">Ativo</Badge>
              </div>
            </div>

            <div className="space-y-4">
              <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700">
                Acessar Minha Conta
              </button>
              <button className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200">
                Configurar Perfil
              </button>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// Helper functions to reduce complexity
function calculatePricing(plan: Plan, billingCycle: "monthly" | "annual") {
  const planPrice = plan.price;
  const discount = plan.discount || 0;
  const discountAmount = (planPrice * discount) / 100;
  const discountedPrice = planPrice - discountAmount;
  const subtotal = discountedPrice * (billingCycle === "annual" ? 12 : 1);
  const tax = subtotal * 0.12; // 12% tax
  const total = subtotal + tax;

  return {
    planPrice,
    discount,
    discountAmount,
    discountedPrice,
    subtotal,
    tax,
    total,
  };
}

function recommendPlanFromSignup(): Plan | null {
  try {
    const signupData = localStorage.getItem("signup-data");
    if (!signupData) return null;

    const data = JSON.parse(signupData);
    if (data.companySize === "51-200" || data.companySize === "201-500") {
      return availablePlans[2]; // Enterprise
    }
    if (data.budget === "1000-2000" || data.budget === "2000+") {
      return availablePlans[1]; // Professional
    }
  } catch {
    // Use default on error
  }
  return null;
}

// Hook customizado para gerenciar checkout state e lógica
function useCheckoutState() {
  const [selectedPlan, setSelectedPlan] = useState<Plan>(availablePlans[1]);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "annual",
  );
  const [paymentData, setPaymentData] =
    useState<PaymentData>(initialPaymentData);
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

  // Validation function - moved here to access state
  // Helper function to get customer data
  const getCustomerData = () => {
    const signupData = localStorage.getItem("signup-data");
    let customerData = {
      name: "Cliente Teste",
      email: "cliente@teste.com",
      cpf: "12345678900",
      phone: "(11) 99999-9999",
    };

    if (signupData) {
      try {
        const data = JSON.parse(signupData);
        customerData = {
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          cpf: "12345678900",
          phone: data.phone || "(11) 99999-9999",
        };
      } catch {
        // Use default data
      }
    }
    return customerData;
  };

  const validatePayment = (): boolean => {
    const newErrors: PaymentErrors = {};

    if (paymentData.paymentMethod === "card") {
      if (!paymentData.cardNumber.replace(/\s/g, "").match(/^\d{16}$/)) {
        newErrors.cardNumber = "Número do cartão inválido";
      }
      if (!paymentData.expiryDate.match(/^\d{2}\/\d{2}$/)) {
        newErrors.expiryDate = "Data inválida (MM/AA)";
      }
      if (!paymentData.cvv.match(/^\d{3,4}$/)) {
        newErrors.cvv = "CVV inválido";
      }
      if (!paymentData.cardName.trim()) {
        newErrors.cardName = "Nome obrigatório";
      }
    }

    if (!paymentData.cpf.match(/^\d{11}$/)) {
      newErrors.cpf = "CPF inválido";
    }

    if (!paymentData.acceptTerms) {
      newErrors.acceptTerms = "Aceitação dos termos é obrigatória";
    }

    // Update errors state
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePayment()) return;

    setIsProcessing(true);

    try {
      const customerData = getCustomerData();
      const paymentServiceInstance = await getPaymentService();
      const paymentResult = await paymentServiceInstance.createPaymentIntent(
        calculations.total,
        "BRL",
        customerData,
        paymentData.paymentMethod,
        paymentData.paymentMethod === "card" ? paymentData : undefined,
        {
          userId: "user-123",
          planId: selectedPlan.id,
          billingCycle,
          checkoutSessionId: `checkout-${Date.now()}`,
        },
      );

      if (isErr(paymentResult)) {
        console.error("Payment creation failed:", paymentResult.error);
        setErrors({ submit: paymentResult.error.message });
        setIsProcessing(false);
        return;
      }

      // Simulate success for demo
      setTimeout(() => {
        setIsProcessing(false);
        setIsCompleted(true);
      }, 2000);
    } catch (error) {
      console.error("Payment processing error:", error);
      setErrors({ submit: "Erro inesperado no processamento do pagamento" });
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
    validatePayment,
  };
}

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
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-gray-900">Luminaris</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-gray-600 hover:text-gray-900 text-sm">
              Suporte
            </button>
            <button className="text-gray-600 hover:text-gray-900 text-sm">
              Voltar
            </button>
          </div>
        </div>
      </header>

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
              {/* Plan Selection */}
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-6">Escolha seu plano</h2>

                {/* Billing Toggle */}
                <div className="flex items-center justify-center bg-gray-100 rounded-lg p-1 mb-6 w-fit mx-auto">
                  <button
                    onClick={() => checkoutState.setBillingCycle("monthly")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      checkoutState.billingCycle === "monthly"
                        ? "bg-white shadow-sm text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Mensal
                  </button>
                  <button
                    onClick={() => checkoutState.setBillingCycle("annual")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all relative ${
                      checkoutState.billingCycle === "annual"
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

                {/* Plans Grid */}
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  {availablePlans.map((plan) => (
                    <motion.div
                      key={plan.id}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card
                        className={`p-6 cursor-pointer transition-all border-2 ${
                          checkoutState.selectedPlan.id === plan.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        onClick={() => checkoutState.handlePlanChange(plan)}
                      >
                        <div className="text-center">
                          <h3 className="text-lg font-semibold mb-2">
                            {plan.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            {plan.description}
                          </p>
                          <div className="mb-4">
                            <div className="text-3xl font-bold">
                              R${" "}
                              {checkoutState.calculations.discountedPrice.toFixed(
                                2,
                              )}
                              <span className="text-base font-normal text-muted-foreground">
                                /
                                {checkoutState.billingCycle === "annual"
                                  ? "mês"
                                  : "mês"}
                              </span>
                            </div>
                            {checkoutState.calculations.discount > 0 && (
                              <div className="text-sm text-green-600 mt-1">
                                -{checkoutState.calculations.discount}% economia
                              </div>
                            )}
                          </div>
                          <ul className="text-left space-y-2 text-sm">
                            {plan.features.map((feature, index) => (
                              <li
                                key={index}
                                className="flex items-center gap-2"
                              >
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </Card>

              {/* Payment Form - Placeholder */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Formulário de Pagamento
                </h3>
                <p className="text-muted-foreground mb-4">
                  Formulário de pagamento será implementado aqui.
                </p>
                <div className="text-sm text-muted-foreground">
                  Método:{" "}
                  {checkoutState.paymentData?.paymentMethod ||
                    "Não selecionado"}
                </div>
              </Card>

              {/* Help */}
              <Card className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <div className="font-medium text-blue-900 mb-1">
                      Precisa de ajuda?
                    </div>
                    <div className="text-blue-700">
                      Nossa equipe está disponível por chat ou WhatsApp para
                      tirar dúvidas sobre o pagamento.
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column - Order Summary */}
            <div className="space-y-6">
              {/* Order Summary */}
              <Card className="p-6 sticky top-4">
                <h3 className="text-lg font-semibold mb-4">Resumo do Pedido</h3>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">
                      {checkoutState.selectedPlan.name}
                    </span>
                    <span className="text-muted-foreground">
                      {checkoutState.billingCycle === "annual"
                        ? "Anual"
                        : "Mensal"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>
                      R$ {checkoutState.calculations.subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Taxas</span>
                    <span>R$ {checkoutState.calculations.tax.toFixed(2)}</span>
                  </div>
                  {checkoutState.calculations.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>
                        Desconto ({checkoutState.calculations.discount}%)
                      </span>
                      <span>
                        -R${" "}
                        {(
                          (checkoutState.calculations.subtotal *
                            checkoutState.calculations.discount) /
                          100
                        ).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="border-t pt-3 flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>
                      R$ {checkoutState.calculations.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={(e) => {
                      if (isHTMLElement(e.currentTarget)) {
                        checkoutState.handleSubmit(e as React.FormEvent);
                      }
                    }}
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
