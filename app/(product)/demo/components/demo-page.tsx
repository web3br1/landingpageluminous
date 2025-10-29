"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  ArrowRight,
  Zap,
} from "lucide-react";
import { Section } from "@/components/ui/section";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FadeUp } from "@/components/ui/fade-up";
import { CtaButton } from "@/components/ui/cta-button";

interface DemoStep {
  id: string;
  title: string;
  description: string;
  action: string;
  duration: number;
  interactive?: boolean;
}

const demoSteps: DemoStep[] = [
  {
    id: "welcome",
    title: "Bem-vindo ao Luminaris",
    description:
      "Vamos mostrar como nossa IA transforma dados em decisões inteligentes em poucos minutos.",
    action: "Clique em 'Iniciar Demo'",
    duration: 3000,
  },
  {
    id: "interview",
    title: "Entrevista Inteligente",
    description:
      "Conte-nos sobre seu negócio. Nossa IA faz perguntas estratégicas para entender seus processos.",
    action: "Responda às perguntas sobre seu negócio",
    duration: 4000,
    interactive: true,
  },
  {
    id: "data-mapping",
    title: "Mapeamento Automático",
    description:
      "A IA identifica e conecta suas fontes de dados: planilhas, NFes, APIs e sistemas existentes.",
    action: "Veja a IA conectando seus dados",
    duration: 3500,
  },
  {
    id: "system-creation",
    title: "Criação do Sistema",
    description:
      "Em segundos, o Luminaris gera tabelas, relacionamentos e KPIs específicos do seu negócio.",
    action: "Assista à criação automática",
    duration: 4000,
  },
  {
    id: "dashboard",
    title: "Dashboard Personalizado",
    description:
      "Seu dashboard é criado com métricas relevantes e visualizações que fazem sentido para você.",
    action: "Explore o dashboard interativo",
    duration: 3500,
    interactive: true,
  },
  {
    id: "insights",
    title: "Insights Automáticos",
    description:
      "Receba recomendações acionáveis baseadas em padrões identificados nos seus dados.",
    action: "Veja insights inteligentes",
    duration: 4000,
  },
  {
    id: "natural-language",
    title: "Consultas em Linguagem Natural",
    description:
      "Pergunte qualquer coisa sobre seus dados em português e receba respostas instantâneas.",
    action: "Faça uma pergunta ao sistema",
    duration: 3500,
    interactive: true,
  },
];

export function DemoPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});

  const currentDemoStep = demoSteps[currentStep];

  const handleStartDemo = () => {
    setIsPlaying(true);
    setCurrentStep(0);
  };

  const handleNextStep = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setIsCompleted(true);
      setIsPlaying(false);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setIsPlaying(false);
    setIsCompleted(false);
    setUserAnswers({});
  };

  const handleStepAction = () => {
    if (currentDemoStep.interactive) {
      // Simular interação do usuário
      handleNextStep();
    } else {
      handleNextStep();
    }
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
            <a href="/demo" className="text-blue-600 font-medium">
              Demo Interativa
            </a>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Demonstração Interativa</h1>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {currentStep + 1} de {demoSteps.length}
              </span>
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-600 to-purple-600"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((currentStep + 1) / demoSteps.length) * 100}%`,
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Demo Content */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Left Side - Interactive Demo */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {/* Step Card */}
                <Card className="p-8">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-lg">
                        {currentStep + 1}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold mb-2">
                        {currentDemoStep.title}
                      </h2>
                      <p className="text-muted-foreground text-lg leading-relaxed">
                        {currentDemoStep.description}
                      </p>
                    </div>
                  </div>

                  {/* Action Button */}
                  {!isCompleted && (
                    <div className="flex gap-3">
                      <Button
                        onClick={handleStepAction}
                        className="flex-1"
                        size="lg"
                      >
                        {currentDemoStep.action}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                      {currentDemoStep.interactive && (
                        <Button variant="outline" size="lg">
                          Pular
                        </Button>
                      )}
                    </div>
                  )}
                </Card>

                {/* Interactive Elements */}
                {currentDemoStep.id === "interview" && (
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4">
                      Simulação: Entrevista
                    </h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-2">
                          🤖 Luminaris: Qual o segmento da sua empresa?
                        </p>
                        <div className="flex gap-2">
                          {[
                            "Varejo",
                            "Serviços",
                            "Indústria",
                            "Tecnologia",
                          ].map((option) => (
                            <Button
                              key={option}
                              variant={
                                userAnswers.segment === option
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              onClick={() =>
                                setUserAnswers((prev) => ({
                                  ...prev,
                                  segment: option,
                                }))
                              }
                            >
                              {option}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                )}

                {currentDemoStep.id === "natural-language" && (
                  <Card className="p-6">
                    <h3 className="font-semibold mb-4">
                      Experimente perguntar:
                    </h3>
                    <div className="space-y-2">
                      {[
                        "Qual foi meu faturamento no último mês?",
                        "Quais produtos mais vendem?",
                        "Como está meu fluxo de caixa?",
                        "Quais clientes mais compram?",
                      ].map((question, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="w-full justify-start text-left"
                          onClick={() =>
                            setUserAnswers((prev) => ({ ...prev, question }))
                          }
                        >
                          {question}
                        </Button>
                      ))}
                    </div>
                  </Card>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Side - Visual Demo */}
          <div className="space-y-6">
            <Card className="p-6 h-fit">
              <div className="aspect-video bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg flex items-center justify-center mb-4">
                {/* Mock Dashboard */}
                <div className="w-full h-full bg-white rounded border p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-600 rounded"></div>
                      <span className="font-semibold">Dashboard Luminaris</span>
                    </div>
                    <Badge>Demo</Badge>
                  </div>

                  {/* Mock Charts */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="h-24 bg-gradient-to-r from-blue-100 to-blue-200 rounded flex items-center justify-center">
                      <span className="text-sm font-medium">Faturamento</span>
                    </div>
                    <div className="h-24 bg-gradient-to-r from-green-100 to-green-200 rounded flex items-center justify-center">
                      <span className="text-sm font-medium">Clientes</span>
                    </div>
                  </div>

                  {/* Mock Table */}
                  <div className="h-32 bg-gray-50 rounded p-2">
                    <div className="text-xs text-muted-foreground mb-2">
                      Dados recentes
                    </div>
                    <div className="space-y-1">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="h-3 bg-gray-200 rounded animate-pulse"
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Demo Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleRestart}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reiniciar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <div className="text-sm text-muted-foreground">
                  {currentStep + 1} / {demoSteps.length}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Completion Section */}
        <AnimatePresence>
          {isCompleted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-6"
            >
              <div className="flex items-center justify-center gap-2 mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <h2 className="text-2xl font-bold">Demo Concluída!</h2>
              </div>

              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Você viu como o Luminaris pode transformar seus dados em
                decisões inteligentes. Agora imagine isso funcionando 24/7 para
                seu negócio.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <CtaButton>Começar Trial Grátis</CtaButton>
                <Button variant="outline" size="lg">
                  Agendar Demonstração
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Benefits Section */}
        <Section className="mt-16">
          <FadeUp>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                Por que escolher o Luminaris?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Tecnologia de ponta que realmente funciona para seu negócio
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: "🤖",
                  title: "IA Especializada",
                  description:
                    "Tecnologia de GraphRAG e processamento de linguagem natural treinada para dados empresariais",
                },
                {
                  icon: "⚡",
                  title: "Implementação Rápida",
                  description:
                    "De horas para dias, não meses. Sem necessidade de equipe técnica especializada",
                },
                {
                  icon: "🔒",
                  description:
                    "Seus dados ficam seguros com criptografia de ponta e conformidade com LGPD",
                },
              ].map((benefit, index) => (
                <Card key={index} className="p-6 text-center">
                  <div className="text-4xl mb-4">{benefit.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </Card>
              ))}
            </div>
          </FadeUp>
        </Section>
      </div>
    </div>
  );
}
