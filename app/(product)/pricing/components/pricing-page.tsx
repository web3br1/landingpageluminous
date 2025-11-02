"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Calculator,
  Check,
  Star,
  Zap,
  TrendingUp,
  Users,
  BarChart3,
} from "lucide-react";
import { Section } from "@/components/ui/section";
import { CTA } from "@/components/ui/cta-button-unified";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FadeUp } from "@/components/ui/fade-up-optimized";

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  features: string[];
  popular?: boolean;
  cta: string;
  color: string;
}

const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Iniciante",
    price: 97,
    description:
      "Perfeito para pequenos negócios começando sua transformação digital",
    features: [
      "Até 3 usuários",
      "5 dashboards personalizados",
      "Integração com 2 fontes de dados",
      "Relatórios automáticos semanais",
      "Suporte por email",
      "Backup diário dos dados",
    ],
    cta: "Começar Grátis",
    color: "blue",
  },
  {
    id: "professional",
    name: "Profissional",
    price: 297,
    originalPrice: 397,
    description:
      "Para empresas em crescimento que precisam de insights avançados",
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
    cta: "Experimentar 14 Dias Grátis",
    color: "purple",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 0, // Custom pricing
    description: "Soluções personalizadas para grandes empresas e corporações",
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
    cta: "Falar com Especialista",
    color: "gold",
  },
];

interface ROICalculation {
  currentMonthlyCost: number;
  luminarisMonthlyCost: number;
  timeSavedHours: number;
  hourlyRate: number;
  monthlySavings: number;
  annualSavings: number;
  paybackMonths: number;
  roiPercentage: number;
}

export function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly",
  );
  const [roiInputs, setRoiInputs] = useState({
    employees: 2,
    hoursPerWeek: 20,
    hourlyRate: 50,
    currentToolsCost: 200,
  });

  const roiCalculation = useMemo((): ROICalculation => {
    const { employees, hoursPerWeek, hourlyRate, currentToolsCost } = roiInputs;

    // Cálculos baseados em dados reais do mercado
    const monthlyTimeCost = employees * (hoursPerWeek * 4) * hourlyRate;
    const luminarisMonthlyCost = 297; // Plano profissional
    const timeSavedHours = hoursPerWeek * 4 * 0.75; // 75% economia de tempo
    const monthlySavings =
      timeSavedHours * hourlyRate + currentToolsCost - luminarisMonthlyCost;
    const annualSavings = monthlySavings * 12;
    const paybackMonths = Math.ceil(luminarisMonthlyCost / monthlySavings);
    const roiPercentage =
      ((annualSavings - luminarisMonthlyCost) / luminarisMonthlyCost) * 100;

    return {
      currentMonthlyCost: monthlyTimeCost + currentToolsCost,
      luminarisMonthlyCost,
      timeSavedHours,
      hourlyRate,
      monthlySavings,
      annualSavings,
      paybackMonths,
      roiPercentage,
    };
  }, [roiInputs]);

  const discountedPrice = (price: number) => {
    return billingCycle === "annual" ? Math.round(price * 0.8) : price;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm">
            <a
              href="/"
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Home
            </a>
            <span className="text-gray-400">/</span>
            <span className="text-blue-600 font-medium">Preços</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <Section className="text-center mb-16">
          <FadeUp>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Preços{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                  Transparentes
                </span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Escolha o plano ideal para seu negócio. Todos incluem 30 dias de
                garantia e suporte completo.
              </p>

              {/* Billing Toggle */}
              <div className="inline-flex items-center bg-white rounded-full p-1 border shadow-sm mb-8">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    billingCycle === "monthly"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setBillingCycle("annual")}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all relative ${
                    billingCycle === "annual"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Anual
                  <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1 py-0">
                    -20%
                  </Badge>
                </button>
              </div>
            </motion.div>
          </FadeUp>
        </Section>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {pricingPlans.map((plan, index) => (
            <FadeUp key={plan.id}>
              <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
                <Card
                  className={`relative p-8 h-full ${
                    plan.popular
                      ? "border-2 border-purple-300 shadow-lg shadow-purple-100"
                      : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1">
                        <Star className="w-3 h-3 mr-1" />
                        Mais Popular
                      </Badge>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      {plan.description}
                    </p>

                    {plan.id === "enterprise" ? (
                      <div className="text-3xl font-bold text-gray-900 mb-1">
                        Personalizado
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <span className="text-3xl font-bold">
                            R$ {discountedPrice(plan.price)}
                          </span>
                          <span className="text-muted-foreground">
                            /{billingCycle === "annual" ? "ano" : "mês"}
                          </span>
                        </div>
                        {plan.originalPrice && (
                          <div className="text-sm text-muted-foreground line-through">
                            R$ {plan.originalPrice}/
                            {billingCycle === "annual" ? "ano" : "mês"}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    className={`w-full inline-flex items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold transition ${
                      plan.popular
                        ? "bg-primary text-white shadow-md hover:shadow-lg"
                        : "bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-white"
                    }`}
                  >
                    {plan.cta}
                  </button>
                </Card>
              </motion.div>
            </FadeUp>
          ))}
        </div>

        {/* ROI Calculator */}
        <Section className="mb-16">
          <FadeUp>
            <div className="text-center mb-12">
              <Calculator className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold mb-4">Calcule seu ROI</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Veja quanto o Luminaris economiza para seu negócio em tempo e
                dinheiro
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* Calculator Inputs */}
              <Card className="p-8">
                <h3 className="text-xl font-semibold mb-6">
                  Dados da sua empresa
                </h3>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Quantos funcionários fazem relatórios?
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={roiInputs.employees}
                      onChange={(e) =>
                        setRoiInputs((prev) => ({
                          ...prev,
                          employees: Number(e.target.value),
                        }))
                      }
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>1</span>
                      <span className="font-medium">
                        {roiInputs.employees} funcionários
                      </span>
                      <span>10+</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Horas por semana em relatórios?
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="40"
                      step="5"
                      value={roiInputs.hoursPerWeek}
                      onChange={(e) =>
                        setRoiInputs((prev) => ({
                          ...prev,
                          hoursPerWeek: Number(e.target.value),
                        }))
                      }
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>5h</span>
                      <span className="font-medium">
                        {roiInputs.hoursPerWeek} horas
                      </span>
                      <span>40h</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Custo médio por hora (R$)
                    </label>
                    <input
                      type="range"
                      min="30"
                      max="150"
                      step="10"
                      value={roiInputs.hourlyRate}
                      onChange={(e) =>
                        setRoiInputs((prev) => ({
                          ...prev,
                          hourlyRate: Number(e.target.value),
                        }))
                      }
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>R$ 30</span>
                      <span className="font-medium">
                        R$ {roiInputs.hourlyRate}
                      </span>
                      <span>R$ 150</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Custo mensal com ferramentas atuais (R$)
                    </label>
                    <input
                      type="number"
                      value={roiInputs.currentToolsCost}
                      onChange={(e) =>
                        setRoiInputs((prev) => ({
                          ...prev,
                          currentToolsCost: Number(e.target.value),
                        }))
                      }
                      className="w-full p-3 border rounded-lg"
                      placeholder="200"
                    />
                  </div>
                </div>
              </Card>

              {/* Calculator Results */}
              <Card className="p-8">
                <h3 className="text-xl font-semibold mb-6">Seu Resultado</h3>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        R$ {roiCalculation.currentMonthlyCost.toLocaleString()}
                      </div>
                      <div className="text-sm text-red-700">
                        Custo Atual/Mês
                      </div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        R$ {roiCalculation.luminarisMonthlyCost}
                      </div>
                      <div className="text-sm text-green-700">
                        Com Luminaris
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {roiCalculation.timeSavedHours}h
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Tempo economizado/mês
                        </div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          R$ {roiCalculation.monthlySavings.toLocaleString()}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Economia mensal
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">
                          {roiCalculation.paybackMonths} meses
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Retorno do investimento
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          R$ {roiCalculation.annualSavings.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Economia anual
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {roiCalculation.roiPercentage.toFixed(0)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ROI Anual
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-800">
                        Resultado
                      </span>
                    </div>
                    <p className="text-sm text-green-700">
                      Você economizaria{" "}
                      <strong>
                        R$ {roiCalculation.annualSavings.toLocaleString()}
                      </strong>{" "}
                      por ano e recuperaria o investimento em apenas{" "}
                      <strong>{roiCalculation.paybackMonths} meses</strong>.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </FadeUp>
        </Section>

        {/* FAQ Section */}
        <Section className="mb-16">
          <FadeUp>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Perguntas Frequentes</h2>
            </div>

            <div className="max-w-3xl mx-auto space-y-6">
              {[
                {
                  question: "Posso cancelar a qualquer momento?",
                  answer:
                    "Sim! Oferecemos garantia de 30 dias. Se não estiver satisfeito, cancelamos sem burocracia e você leva seus dados.",
                },
                {
                  question: "Como funciona a migração dos meus dados?",
                  answer:
                    "Nossa equipe ajuda na migração gratuita. Conectamos suas fontes atuais e garantimos que tudo funcione perfeitamente.",
                },
                {
                  question: "Preciso de conhecimento técnico?",
                  answer:
                    "Não! O Luminaris foi desenvolvido para gestores, não para técnicos. A interface é intuitiva e oferecemos treinamento completo.",
                },
                {
                  question: "Meus dados ficam seguros?",
                  answer:
                    "Utilizamos criptografia de ponta a ponta, servidores na AWS Brasil e estamos 100% em conformidade com a LGPD.",
                },
              ].map((faq, index) => (
                <Card key={index} className="p-6">
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </Card>
              ))}
            </div>
          </FadeUp>
        </Section>

        {/* CTA Section */}
        <Section className="text-center">
          <FadeUp>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-3xl font-bold mb-4">
                Pronto para transformar seus dados?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Comece seu teste gratuito hoje mesmo e veja resultados em
                minutos.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <CTA variant="primary" size="lg">
                  Experimentar 14 Dias Grátis
                </CTA>
                <CTA variant="secondary" size="lg">
                  Falar com Especialista
                </CTA>
              </div>

              <p className="text-sm text-muted-foreground mt-4">
                Sem cartão de crédito • Cancele quando quiser • Suporte 24/7
              </p>
            </motion.div>
          </FadeUp>
        </Section>
      </div>
    </div>
  );
}
