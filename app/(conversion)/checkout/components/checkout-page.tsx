"use client";

import { useState, useEffect, useMemo } from "react";
import { isErr } from "@/shared/core/Result";
import { motion } from "framer-motion";
import {
  CreditCard,
  Shield,
  CheckCircle,
  Lock,
  Truck,
  Headphones,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Smartphone,
  Building,
  Zap,
  Mail,
  Settings,
} from "lucide-react";
import { CTA } from "@/components/ui/cta-button-unified";
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

export function CheckoutPage() {
  const [selectedPlan, setSelectedPlan] = useState<Plan>(availablePlans[1]);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [paymentData, setPaymentData] = useState<PaymentData>(initialPaymentData);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [errors, setErrors] = useState<PaymentErrors>({});

  // Calculate totals with extracted function
  const calculations = useMemo(() =>
    calculatePricing(selectedPlan, billingCycle),
    [selectedPlan, billingCycle]
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

  const handlePaymentChange = (field: keyof PaymentData, value: string | number | boolean) => {
    setPaymentData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePayment()) return;

    setIsProcessing(true);

    try {
      // Buscar dados do signup (simulação - em produção viria do contexto/props)
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
            cpf: "12345678900", // Em produção, coletar CPF no signup
            phone: data.phone || "(11) 99999-9999",
          };
        } catch (e) {
          // Usar dados padrão
        }
      }

      // Criar payment intent
      const paymentServiceInstance = await getPaymentService();
      const paymentResult = await paymentServiceInstance.createPaymentIntent(
        calculations.total,
        "BRL",
        customerData,
        paymentData.paymentMethod,
        paymentData.paymentMethod === "card" ? paymentData : undefined,
        {
          userId: "user-123", // Em produção, viria do contexto de autenticação
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

      const paymentIntent = paymentResult.value;

      // Para cartão e Stripe, redirecionar para confirmação
      if (paymentData.paymentMethod === "card" && paymentIntent.clientSecret) {
        // Em produção, você usaria Stripe Elements ou similar
        console.log(
          "Redirecting to payment confirmation with clientSecret:",
          paymentIntent.clientSecret,
        );
        // await confirmPayment(paymentIntent.clientSecret)
      }

      // Para PIX, mostrar QR Code
      if (paymentData.paymentMethod === "pix" && paymentIntent.qrCode) {
        console.log("PIX QR Code:", paymentIntent.qrCode);
        // Mostrar QR code para o usuário
      }

      // Para boleto, mostrar link
      if (paymentData.paymentMethod === "boleto" && paymentIntent.boletoUrl) {
        console.log("Boleto URL:", paymentIntent.boletoUrl);
        // Abrir link do boleto
      }

      // Simular sucesso para demo
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

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\D/g, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  if (isCompleted) {
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
                  <span>{selectedPlan.name}</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold">Valor:</span>
                  <span>
                    R${" "}
                    {calculations.total.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">ID da transação:</span>
                  <span className="font-mono text-sm">
                    #LUM-{Date.now().toString().slice(-8)}
                  </span>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <div className="font-semibold text-blue-900">
                      Confira seu e-mail
                    </div>
                    <div className="text-sm text-blue-700">
                      Enviamos o recibo e instruções de acesso
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                  <Settings className="w-5 h-5 text-purple-600" />
                  <div className="text-left">
                    <div className="font-semibold text-purple-900">
                      Configure sua conta
                    </div>
                    <div className="text-sm text-purple-700">
                      Siga o passo-a-passo no painel
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <Headphones className="w-5 h-5 text-green-600" />
                  <div className="text-left">
                    <div className="font-semibold text-green-900">
                      Suporte disponível
                    </div>
                    <div className="text-sm text-green-700">
                      Nossa equipe está pronta para ajudar
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <CTA variant="primary" size="lg">
                  Acessar Minha Conta
                </CTA>
                <CTA variant="secondary" size="lg">
                  Baixar Recibo
                </CTA>
              </div>

              <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Garantia de 30 dias:</strong> Se não estiver
                  satisfeito, devolvemos 100% do valor. Entre em contato conosco
                  a qualquer momento.
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">Luminaris</span>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="hidden sm:flex">
              <Lock className="w-3 h-3 mr-1" />
              Checkout Seguro
            </Badge>
            <CTA variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </CTA>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Plans & Payment */}
            <div className="lg:col-span-2 space-y-8">
              {/* Step Indicator */}
              <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">1</span>
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

              {/* Plan Selection */}
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-6">Escolha seu plano</h2>

                {/* Billing Toggle */}
                <div className="flex items-center justify-center bg-gray-100 rounded-lg p-1 mb-6 w-fit mx-auto">
                  <button
                    onClick={() => setBillingCycle("monthly")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      billingCycle === "monthly"
                        ? "bg-white shadow-sm text-gray-900"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Mensal
                  </button>
                  <button
                    onClick={() => setBillingCycle("annual")}
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

                {/* Plans Grid */}
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  {availablePlans.map((plan) => (
                    <motion.div
                      key={plan.id}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Card
                        className={`p-4 cursor-pointer border-2 transition-all ${
                          selectedPlan.id === plan.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        } ${plan.popular ? "relative" : ""}`}
                        onClick={() => handlePlanChange(plan)}
                      >
                        {plan.popular && (
                          <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-2 py-1">
                            Mais Popular
                          </Badge>
                        )}

                        <div className="text-center">
                          <h3 className="font-semibold mb-1">{plan.name}</h3>
                          <div className="text-2xl font-bold mb-1">
                            {plan.id === "enterprise"
                              ? "Personalizado"
                              : `R$ ${plan.price}`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {plan.id === "enterprise"
                              ? ""
                              : `por ${billingCycle === "annual" ? "mês" : "mês"}`}
                          </div>
                          {plan.discount && (
                            <Badge variant="secondary" className="mt-2">
                              {plan.discount}% desconto
                            </Badge>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Plan Details */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-3">{selectedPlan.name}</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {selectedPlan.description}
                  </p>
                  <ul className="space-y-2">
                    {selectedPlan.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-sm"
                      >
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>

              {/* Payment Form */}
              <Card className="p-6">
                <h2 className="text-xl font-bold mb-6">
                  Informações de Pagamento
                </h2>

                {/* Payment Method Selection */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { id: "card", name: "Cartão", icon: CreditCard },
                    { id: "pix", name: "PIX", icon: Smartphone },
                    { id: "boleto", name: "Boleto", icon: Building },
                  ].map((method) => (
                    <button
                      key={method.id}
                      onClick={() =>
                        handlePaymentChange("paymentMethod", method.id as any)
                      }
                      className={`p-4 border-2 rounded-lg text-center transition-all ${
                        paymentData.paymentMethod === method.id
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <method.icon className="w-6 h-6 mx-auto mb-2" />
                      <div className="text-sm font-medium">{method.name}</div>
                    </button>
                  ))}
                </div>

                {/* Card Form */}
                {paymentData.paymentMethod === "card" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Número do cartão
                      </label>
                      <input
                        type="text"
                        value={paymentData.cardNumber}
                        onChange={(e) =>
                          handlePaymentChange(
                            "cardNumber",
                            formatCardNumber(e.target.value),
                          )
                        }
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.cardNumber
                            ? "border-red-300"
                            : "border-gray-300"
                        }`}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                      />
                      {errors.cardNumber && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.cardNumber}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Validade
                        </label>
                        <input
                          type="text"
                          value={paymentData.expiryDate}
                          onChange={(e) =>
                            handlePaymentChange(
                              "expiryDate",
                              formatExpiryDate(e.target.value),
                            )
                          }
                          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.expiryDate
                              ? "border-red-300"
                              : "border-gray-300"
                          }`}
                          placeholder="MM/AA"
                          maxLength={5}
                        />
                        {errors.expiryDate && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.expiryDate}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          CVV
                        </label>
                        <input
                          type="text"
                          value={paymentData.cvv}
                          onChange={(e) =>
                            handlePaymentChange(
                              "cvv",
                              e.target.value.replace(/\D/g, "").slice(0, 4),
                            )
                          }
                          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            errors.cvv ? "border-red-300" : "border-gray-300"
                          }`}
                          placeholder="123"
                          maxLength={4}
                        />
                        {errors.cvv && (
                          <p className="text-red-500 text-sm mt-1">
                            {errors.cvv}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Nome no cartão
                      </label>
                      <input
                        type="text"
                        value={paymentData.cardName}
                        onChange={(e) =>
                          handlePaymentChange("cardName", e.target.value)
                        }
                        className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.cardName ? "border-red-300" : "border-gray-300"
                        }`}
                        placeholder="Nome como aparece no cartão"
                      />
                      {errors.cardName && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.cardName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Parcelas
                      </label>
                      <select
                        value={paymentData.installments}
                        onChange={(e) =>
                          handlePaymentChange(
                            "installments",
                            Number(e.target.value),
                          )
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value={1}>
                          1x de R$ {calculations.total.toFixed(2)}
                        </option>
                        <option value={2}>
                          2x de R$ {(calculations.total / 2).toFixed(2)}
                        </option>
                        <option value={3}>
                          3x de R$ {(calculations.total / 3).toFixed(2)}
                        </option>
                        <option value={6}>
                          6x de R$ {(calculations.total / 6).toFixed(2)}
                        </option>
                        <option value={12}>
                          12x de R$ {(calculations.total / 12).toFixed(2)}
                        </option>
                      </select>
                    </div>
                  </motion.div>
                )}

                {/* PIX */}
                {paymentData.paymentMethod === "pix" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-center p-8"
                  >
                    <Smartphone className="w-12 h-12 text-green-600 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Pagamento via PIX</h3>
                    <p className="text-muted-foreground text-sm">
                      Você receberá um QR Code após confirmar o pedido
                    </p>
                  </motion.div>
                )}

                {/* Boleto */}
                {paymentData.paymentMethod === "boleto" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-center p-8"
                  >
                    <Building className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                    <h3 className="font-semibold mb-2">Pagamento via Boleto</h3>
                    <p className="text-muted-foreground text-sm">
                      O boleto será gerado após a confirmação do pedido
                    </p>
                  </motion.div>
                )}

                {/* CPF */}
                <div className="mt-6">
                  <label className="block text-sm font-medium mb-2">CPF</label>
                  <input
                    type="text"
                    value={paymentData.cpf}
                    onChange={(e) =>
                      handlePaymentChange(
                        "cpf",
                        e.target.value.replace(/\D/g, "").slice(0, 11),
                      )
                    }
                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.cpf ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="000.000.000-00"
                  />
                  {errors.cpf && (
                    <p className="text-red-500 text-sm mt-1">{errors.cpf}</p>
                  )}
                </div>

                {/* Terms */}
                <div className="mt-6">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      checked={paymentData.acceptTerms}
                      onChange={(e) =>
                        handlePaymentChange("acceptTerms", e.target.checked)
                      }
                      className="mt-1 text-blue-600 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="acceptTerms"
                      className="text-sm leading-relaxed"
                    >
                      Aceito os{" "}
                      <a
                        href="/terms"
                        className="text-blue-600 hover:underline"
                      >
                        Termos de Uso
                      </a>{" "}
                      e autorizo o débito conforme a forma de pagamento
                      escolhida
                      {errors.acceptTerms && (
                        <span className="text-red-500 block">
                          {errors.acceptTerms}
                        </span>
                      )}
                    </label>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column - Order Summary */}
            <div className="space-y-6">
              {/* Order Summary */}
              <Card className="p-6 sticky top-6">
                <h3 className="text-lg font-bold mb-4">Resumo do Pedido</h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b">
                    <div>
                      <div className="font-semibold">{selectedPlan.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {billingCycle === "annual"
                          ? "Plano anual"
                          : "Plano mensal"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        R$ {calculations.discountedPrice.toFixed(2)}/
                        {billingCycle === "annual" ? "mês" : "mês"}
                      </div>
                      {calculations.discount > 0 && (
                        <div className="text-sm text-green-600">
                          -{calculations.discount}%
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>
                        Subtotal (
                        {billingCycle === "annual" ? "12 meses" : "1 mês"})
                      </span>
                      <span>R$ {calculations.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Impostos</span>
                      <span>R$ {calculations.tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                      <span>Total</span>
                      <span>R$ {calculations.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleSubmit({} as any)}
                    disabled={isProcessing}
                    className="w-full inline-flex items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold bg-primary text-white shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Processando...
                      </>
                    ) : (
                      <>
                        Finalizar Compra
                        <Lock className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </button>
                </div>

                {/* Security Badges */}
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="w-4 h-4 text-green-600" />
                      <span>SSL Seguro</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Lock className="w-4 h-4 text-green-600" />
                      <span>Pagamento Protegido</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2">
                      <Truck className="w-4 h-4 text-blue-600" />
                      <span>Ativação Imediata</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Headphones className="w-4 h-4 text-purple-600" />
                      <span>Suporte 24/7</span>
                    </div>
                  </div>
                </div>

                {/* Guarantee */}
                <div className="mt-6 p-4 bg-green-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <div className="font-medium text-green-900 mb-1">
                        Garantia de 30 dias
                      </div>
                      <div className="text-green-700">
                        Se não estiver satisfeito, devolvemos 100% do valor. Sem
                        perguntas.
                      </div>
                    </div>
                  </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}
