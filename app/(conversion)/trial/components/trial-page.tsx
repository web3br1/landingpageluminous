"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle,
  Clock,
  Zap,
  Shield,
  ArrowRight,
  Play,
  Star,
  Users,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { Section } from "@/components/ui/section";
import { CTA } from "@/components/ui/cta-button-unified";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FadeUp } from "@/components/ui/fade-up";

interface TrialFormData {
  name: string;
  email: string;
  company: string;
  phone?: string;
}

const trialBenefits = [
  {
    icon: <Zap className="w-5 h-5" />,
    title: "Setup em 5 minutos",
    description: "Configure seu primeiro dashboard automaticamente",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "Dados 100% seguros",
    description: "Criptografia e servidores no Brasil",
  },
  {
    icon: <Users className="w-5 h-5" />,
    title: "Suporte completo",
    description: "Equipe dedicada durante o teste",
  },
  {
    icon: <TrendingUp className="w-5 h-5" />,
    title: "Resultados imediatos",
    description: "Veja insights em tempo real",
  },
];

const testimonials = [
  {
    name: "Carlos Silva",
    role: "CEO",
    company: "TechCommerce Ltda",
    content:
      "Em 3 dias tínhamos dashboards funcionando. Nunca vi uma implementação tão rápida!",
    rating: 5,
  },
  {
    name: "Ana Costa",
    role: "Diretora Financeira",
    company: "Indústria ABC",
    content:
      "O trial nos convenceu completamente. Hoje não conseguimos trabalhar sem o Luminaris.",
    rating: 5,
  },
];

export function TrialPage() {
  const [formData, setFormData] = useState<TrialFormData>({
    name: "",
    email: "",
    company: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(14 * 24 * 60 * 60); // 14 days in seconds

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const mins = Math.floor((seconds % (60 * 60)) / 60);
    return { days, hours, mins };
  };

  const { days, hours, mins } = formatTime(timeLeft);

  const handleInputChange = (field: keyof TrialFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setIsSuccess(true);

    // Here you would integrate with your CRM/API
    console.log("Trial activation:", formData);
  };

  const isFormValid = formData.name && formData.email && formData.company;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
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
              Teste Grátis - 14 Dias
            </Badge>
            <CTA variant="secondary" size="sm">
              <Play className="w-4 h-4 mr-2" />
              Ver Demo
            </CTA>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="trial-form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="max-w-4xl mx-auto">
                {/* Hero Section */}
                <Section className="text-center mb-12">
                  <FadeUp>
                    <Badge className="mb-4 bg-green-100 text-green-800 border-green-200">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Oferta Limitada - Teste Grátis
                    </Badge>

                    <h1 className="text-4xl md:text-6xl font-bold mb-6">
                      Seu teste grátis
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 block">
                        começa agora
                      </span>
                    </h1>

                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                      Configure seu primeiro dashboard inteligente em 5 minutos.
                      Veja seus dados se transformarem em decisões acionáveis.
                    </p>

                    {/* Countdown Timer */}
                    <Card className="inline-flex items-center gap-6 p-6 mb-8 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {days}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          dias
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {hours}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          horas
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {mins}
                        </div>
                        <div className="text-sm text-muted-foreground">min</div>
                      </div>
                      <div className="text-center ml-4">
                        <Clock className="w-8 h-8 text-blue-600 mx-auto mb-1" />
                        <div className="text-sm font-medium">restam</div>
                      </div>
                    </Card>
                  </FadeUp>
                </Section>

                {/* Two Column Layout */}
                <div className="grid lg:grid-cols-2 gap-12 mb-16">
                  {/* Left Column - Form */}
                  <div>
                    <Card className="p-8">
                      <div className="mb-6">
                        <h2 className="text-2xl font-bold mb-2">
                          Ative seu teste grátis
                        </h2>
                        <p className="text-muted-foreground">
                          Preencha os dados abaixo e começamos imediatamente.
                        </p>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Nome completo *
                          </label>
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) =>
                              handleInputChange("name", e.target.value)
                            }
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Seu nome completo"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            E-mail corporativo *
                          </label>
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) =>
                              handleInputChange("email", e.target.value)
                            }
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="seu@email.com.br"
                            required
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Usamos apenas para ativação e suporte
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Empresa *
                          </label>
                          <input
                            type="text"
                            value={formData.company}
                            onChange={(e) =>
                              handleInputChange("company", e.target.value)
                            }
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Nome da empresa"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2">
                            WhatsApp (opcional)
                          </label>
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) =>
                              handleInputChange("phone", e.target.value)
                            }
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="(11) 99999-9999"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Para suporte prioritário durante o teste
                          </p>
                        </div>

                        <div className="pt-4">
                          <button
                            type="submit"
                            className="w-full inline-flex items-center justify-center rounded-2xl px-6 py-3 text-base font-semibold bg-primary text-white shadow-md hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!isFormValid || isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Ativando seu teste...
                              </>
                            ) : (
                              <>
                                Ativar Teste Grátis
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </>
                            )}
                          </button>
                        </div>

                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">
                            Sem cartão de crédito • Cancele quando quiser •
                            Suporte 24/7
                          </p>
                        </div>
                      </form>
                    </Card>
                  </div>

                  {/* Right Column - Benefits & Social Proof */}
                  <div className="space-y-8">
                    {/* Benefits */}
                    <div>
                      <h3 className="text-xl font-bold mb-6">
                        O que você ganha no teste:
                      </h3>
                      <div className="space-y-4">
                        {trialBenefits.map((benefit, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-200"
                          >
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white flex-shrink-0">
                              {benefit.icon}
                            </div>
                            <div>
                              <h4 className="font-semibold mb-1">
                                {benefit.title}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {benefit.description}
                              </p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Testimonials */}
                    <div>
                      <h3 className="text-xl font-bold mb-6">
                        Empresas que já testaram:
                      </h3>
                      <div className="space-y-4">
                        {testimonials.map((testimonial, index) => (
                          <Card key={index} className="p-6">
                            <div className="flex items-center gap-1 mb-3">
                              {[...Array(testimonial.rating)].map((_, i) => (
                                <Star
                                  key={i}
                                  className="w-4 h-4 text-yellow-400 fill-current"
                                />
                              ))}
                            </div>
                            <p className="text-sm mb-4 italic">
                              &ldquo;{testimonial.content}&rdquo;
                            </p>
                            <div className="text-sm">
                              <div className="font-semibold">
                                {testimonial.name}
                              </div>
                              <div className="text-muted-foreground">
                                {testimonial.role} • {testimonial.company}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Trust Signals */}
                <Section className="text-center">
                  <FadeUp>
                    <div className="grid md:grid-cols-3 gap-8 mb-8">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                          500+
                        </div>
                        <div className="text-muted-foreground">
                          Empresas testaram
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600 mb-2">
                          95%
                        </div>
                        <div className="text-muted-foreground">
                          Taxa de conversão
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600 mb-2">
                          24/7
                        </div>
                        <div className="text-muted-foreground">
                          Suporte durante teste
                        </div>
                      </div>
                    </div>
                  </FadeUp>
                </Section>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl mx-auto text-center"
            >
              <Card className="p-12">
                <div className="mb-8">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                  <h1 className="text-3xl font-bold mb-4">
                    Bem-vindo ao Luminaris! 🎉
                  </h1>
                  <p className="text-xl text-muted-foreground mb-6">
                    Seu teste grátis foi ativado com sucesso. Vamos começar?
                  </p>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">1</span>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">Confira seu e-mail</div>
                      <div className="text-sm text-muted-foreground">
                        Enviamos as instruções de acesso
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">2</span>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">
                        Configure seu primeiro dashboard
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Siga o passo-a-passo no painel
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">3</span>
                    </div>
                    <div className="text-left">
                      <div className="font-semibold">
                        Conecte suas fontes de dados
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Planilhas, APIs ou sistemas existentes
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <CTA variant="primary" size="lg">
                    Acessar Minha Conta
                  </CTA>
                  <CTA variant="secondary" size="lg">
                    Agendar Orientação
                  </CTA>
                </div>

                <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    <strong>Dúvida?</strong> Nossa equipe está disponível por
                    WhatsApp ou chat. Você tem 14 dias completos para testar
                    tudo.
                  </p>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
