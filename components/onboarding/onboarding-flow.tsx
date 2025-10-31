"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  User,
  Building,
  Target,
  Zap,
} from "lucide-react";
import { analytics } from "@/lib/analytics-core";
import { usePersonalization } from "@/lib/personalization/personalization-context";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  required?: boolean;
}

interface UserProfile {
  name?: string;
  company?: string;
  role?: string;
  goals?: string[];
  experience_level?: "beginner" | "intermediate" | "advanced";
  preferred_features?: string[];
  timeline?: string;
}

export function OnboardingFlow() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const { updateUserAttribute, trackUserAction } = usePersonalization();

  // Check if user should see onboarding
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem(
      "luminaris_onboarding_completed",
    );
    const hasSeenOnboarding = localStorage.getItem("luminaris_onboarding_seen");

    if (!hasCompletedOnboarding && !hasSeenOnboarding) {
      // Delay to avoid showing immediately on page load
      const timer = setTimeout(() => {
        setIsVisible(true);
        localStorage.setItem("luminaris_onboarding_seen", "true");
        analytics.track("onboarding_started", { trigger: "first_visit" });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, []);

  const steps: OnboardingStep[] = [
    {
      id: "welcome",
      title: "Bem-vindo à Luminaris! 👋",
      description: "Vamos personalizar sua experiência em poucos passos",
      icon: <User className="w-6 h-6" />,
      content: (
        <div className="text-center space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Sou seu assistente pessoal. Vamos configurar tudo para você ter a
            melhor experiência possível.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              ⏱️ Leva apenas 2 minutos e personaliza tudo para suas
              necessidades!
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "profile",
      title: "Conte um pouco sobre você",
      description: "Isso nos ajuda a personalizar suas recomendações",
      icon: <User className="w-6 h-6" />,
      required: true,
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Seu nome</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800"
              placeholder="Digite seu nome"
              value={userProfile.name || ""}
              onChange={(e) =>
                setUserProfile((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Empresa (opcional)
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800"
              placeholder="Nome da empresa"
              value={userProfile.company || ""}
              onChange={(e) =>
                setUserProfile((prev) => ({ ...prev, company: e.target.value }))
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Seu cargo/função
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-gray-800"
              value={userProfile.role || ""}
              onChange={(e) =>
                setUserProfile((prev) => ({ ...prev, role: e.target.value }))
              }
            >
              <option value="">Selecione seu cargo</option>
              <option value="analyst">Analista de Dados</option>
              <option value="manager">Gestor/Manager</option>
              <option value="director">Diretor</option>
              <option value="executive">Executivo/C-Level</option>
              <option value="consultant">Consultor</option>
              <option value="other">Outro</option>
            </select>
          </div>
        </div>
      ),
    },
    {
      id: "goals",
      title: "Quais são seus objetivos?",
      description: "Selecione o que você quer alcançar",
      icon: <Target className="w-6 h-6" />,
      required: true,
      content: (
        <div className="space-y-3">
          {[
            {
              id: "automation",
              label: "Automatizar relatórios manuais",
              icon: "📊",
            },
            {
              id: "insights",
              label: "Obter insights em tempo real",
              icon: "💡",
            },
            {
              id: "efficiency",
              label: "Aumentar eficiência da equipe",
              icon: "⚡",
            },
            {
              id: "compliance",
              label: "Garantir conformidade regulatória",
              icon: "📋",
            },
            {
              id: "growth",
              label: "Apoiar crescimento do negócio",
              icon: "📈",
            },
          ].map((goal) => (
            <label
              key={goal.id}
              className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
            >
              <input
                type="checkbox"
                className="w-4 h-4 text-primary"
                checked={userProfile.goals?.includes(goal.id) || false}
                onChange={(e) => {
                  const goals = userProfile.goals || [];
                  if (e.target.checked) {
                    setUserProfile((prev) => ({
                      ...prev,
                      goals: [...goals, goal.id],
                    }));
                  } else {
                    setUserProfile((prev) => ({
                      ...prev,
                      goals: goals.filter((g) => g !== goal.id),
                    }));
                  }
                }}
              />
              <span className="text-lg">{goal.icon}</span>
              <span className="flex-1">{goal.label}</span>
            </label>
          ))}
        </div>
      ),
    },
    {
      id: "experience",
      title: "Qual seu nível de experiência?",
      description: "Isso nos ajuda a ajustar a complexidade das informações",
      icon: <Zap className="w-6 h-6" />,
      content: (
        <div className="space-y-3">
          {[
            {
              id: "beginner",
              label: "Iniciante - Novo em automação",
              description: "Quero aprender desde o básico",
            },
            {
              id: "intermediate",
              label: "Intermediário - Já uso algumas ferramentas",
              description: "Procuro otimizar processos existentes",
            },
            {
              id: "advanced",
              label: "Avançado - Experiente em dados/automação",
              description: "Busco soluções enterprise complexas",
            },
          ].map((level) => (
            <label
              key={level.id}
              className="block p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
            >
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  name="experience"
                  className="w-4 h-4 text-primary"
                  checked={userProfile.experience_level === level.id}
                  onChange={() =>
                    setUserProfile((prev) => ({
                      ...prev,
                      experience_level: level.id as "beginner" | "intermediate" | "advanced",
                    }))
                  }
                />
                <div>
                  <div className="font-medium">{level.label}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {level.description}
                  </div>
                </div>
              </div>
            </label>
          ))}
        </div>
      ),
    },
    {
      id: "timeline",
      title: "Quando você planeja implementar?",
      description: "Nos ajuda a priorizar recursos importantes",
      icon: <Building className="w-6 h-6" />,
      content: (
        <div className="space-y-3">
          {[
            {
              id: "immediately",
              label: "Imediatamente - Esta semana",
              icon: "🚀",
            },
            { id: "soon", label: "Em breve - Próximos 30 dias", icon: "📅" },
            { id: "quarter", label: "Este trimestre - 3 meses", icon: "🎯" },
            {
              id: "later",
              label: "Mais tarde - Ainda pesquisando",
              icon: "🔍",
            },
          ].map((timeline) => (
            <label
              key={timeline.id}
              className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
            >
              <input
                type="radio"
                name="timeline"
                className="w-4 h-4 text-primary"
                checked={userProfile.timeline === timeline.id}
                onChange={() =>
                  setUserProfile((prev) => ({ ...prev, timeline: timeline.id }))
                }
              />
              <span className="text-lg">{timeline.icon}</span>
              <span className="flex-1">{timeline.label}</span>
            </label>
          ))}
        </div>
      ),
    },
    {
      id: "complete",
      title: "Perfeito! Tudo configurado 🎉",
      description: "Sua experiência está personalizada e pronta",
      icon: <Check className="w-6 h-6" />,
      content: (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-gray-600 dark:text-gray-300">
            Obrigado por compartilhar essas informações! Agora posso oferecer
            uma experiência totalmente personalizada para você.
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 Dica: Você pode acessar o chat inteligente a qualquer momento
              para tirar dúvidas!
            </p>
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const canProceed = () => {
    if (!currentStepData.required) return true;

    switch (currentStepData.id) {
      case "profile":
        return userProfile.name && userProfile.name.length >= 2;
      case "goals":
        return userProfile.goals && userProfile.goals.length > 0;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!canProceed()) return;

    setCompletedSteps((prev) => new Set([...prev, currentStep]));
    setCurrentStep((prev) => prev + 1);

    analytics.track("onboarding_step_completed", {
      step_id: currentStepData.id,
      step_number: currentStep + 1,
      profile_data: userProfile,
    });
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSkip = () => {
    analytics.track("onboarding_skipped", {
      step_id: currentStepData.id,
      step_number: currentStep + 1,
    });
    setIsVisible(false);
  };

  const handleComplete = () => {
    // Save profile to personalization context
    updateUserAttribute("profile", userProfile);

    // Mark onboarding as completed
    localStorage.setItem("luminaris_onboarding_completed", "true");

    analytics.track("onboarding_completed", {
      total_steps: steps.length,
      profile_data: userProfile,
      completion_time: Date.now(),
    });

    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
        onClick={() => handleSkip()}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-primary text-white p-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {currentStepData.icon}
                <div>
                  <h2 className="text-lg font-semibold">
                    {currentStepData.title}
                  </h2>
                  <p className="text-sm opacity-90">
                    {currentStepData.description}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSkip}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                aria-label="Pular onboarding"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-white h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                }}
              />
            </div>
            <div className="text-xs mt-1 opacity-90">
              Passo {currentStep + 1} de {steps.length}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-96 overflow-y-auto">
            {currentStepData.content}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={isFirstStep}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Anterior</span>
            </button>

            <div className="flex space-x-2">
              {!isLastStep && (
                <button
                  onClick={handleSkip}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Pular
                </button>
              )}

              <button
                onClick={isLastStep ? handleComplete : handleNext}
                disabled={!canProceed()}
                className="flex items-center space-x-2 px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>{isLastStep ? "Finalizar" : "Próximo"}</span>
                {!isLastStep && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
