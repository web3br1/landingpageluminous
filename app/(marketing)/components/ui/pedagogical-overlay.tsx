"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { X, ArrowRight, CheckCircle, Play } from "lucide-react";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

interface PedagogicalStep {
  id: string;
  title: string;
  description: string;
  visual?: string;
  action?: string;
  duration?: number;
}

interface PedagogicalOverlayProps {
  steps: PedagogicalStep[];
  currentStep: number;
  isVisible: boolean;
  onNext: () => void;
  onClose: () => void;
  onComplete: () => void;
  title?: string;
  autoAdvance?: boolean;
}

export function PedagogicalOverlay({
  steps,
  currentStep,
  isVisible,
  onNext,
  onClose,
  onComplete,
  title = "Entenda como funciona",
  autoAdvance = false,
}: PedagogicalOverlayProps) {
  const [stepStartTime, setStepStartTime] = useState(Date.now());
  const prefersReducedMotion = useReducedMotion();

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  useEffect(() => {
    if (isVisible && currentStepData) {
      setStepStartTime(Date.now());

      if (autoAdvance && currentStepData.duration) {
        const timer = setTimeout(() => {
          if (currentStep < steps.length - 1) {
            onNext();
          } else {
            onComplete();
          }
        }, currentStepData.duration);

        return () => clearTimeout(timer);
      }
    }
  }, [
    currentStep,
    isVisible,
    autoAdvance,
    currentStepData,
    onNext,
    onComplete,
    steps.length,
  ]);

  if (!isVisible || !currentStepData) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop with animated elements */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        {/* Floating particles for mystic effect */}
        {!prefersReducedMotion && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 12 }).map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-primary/30 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.3, 0.8, 0.3],
                  scale: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        )}

        {/* Main overlay */}
        <motion.div
          className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
        >
          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-200">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Play className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{title}</h2>
                <p className="text-sm text-neutral-600">
                  Passo {currentStep + 1} de {steps.length}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-neutral-100 hover:bg-neutral-200 rounded-lg flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Text content */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">
                    {currentStepData.title}
                  </h3>
                  <p className="text-neutral-600 leading-relaxed">
                    {currentStepData.description}
                  </p>
                </div>

                {currentStepData.action && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-primary mb-1">
                          O que acontece agora:
                        </p>
                        <p className="text-sm text-neutral-700">
                          {currentStepData.action}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Auto-advance timer */}
                {autoAdvance && currentStepData.duration && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-neutral-600">
                      <span>Próximo passo em</span>
                      <span>
                        {Math.max(
                          0,
                          Math.ceil(
                            (currentStepData.duration -
                              (Date.now() - stepStartTime)) /
                              1000,
                          ),
                        )}
                        s
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 rounded-full h-1">
                      <motion.div
                        className="bg-primary h-1 rounded-full"
                        initial={{ width: "100%" }}
                        animate={{ width: "0%" }}
                        transition={{
                          duration: currentStepData.duration / 1000,
                          ease: "linear",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Visual representation */}
              <div className="bg-neutral-50 rounded-xl p-6 flex items-center justify-center">
                {currentStepData.visual ? (
                  <div className="text-center">
                    <div className="w-24 h-24 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                      <div className="text-4xl">🎭</div>
                    </div>
                    <p className="text-sm text-neutral-600">
                      {currentStepData.visual}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <motion.div
                      className="w-32 h-32 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center mb-4"
                      animate={
                        !prefersReducedMotion
                          ? {
                              rotate: [0, 5, -5, 0],
                              scale: [1, 1.05, 1],
                            }
                          : {}
                      }
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <div className="text-3xl">
                        {currentStep === 0
                          ? "🎯"
                          : currentStep === 1
                            ? "⚡"
                            : "🎉"}
                      </div>
                    </motion.div>
                    <p className="text-sm text-neutral-600">
                      {currentStep === 0 && "Entrevista personalizada"}
                      {currentStep === 1 && "Sistema gerado automaticamente"}
                      {currentStep === 2 && "Operação em linguagem natural"}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-neutral-100">
              <div className="flex gap-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStep
                        ? "bg-primary"
                        : index < currentStep
                          ? "bg-emerald-500"
                          : "bg-neutral-300"
                    }`}
                  />
                ))}
              </div>

              <div className="flex gap-3">
                {!autoAdvance && currentStep > 0 && (
                  <button
                    onClick={() => setStepStartTime(Date.now())} // Reset timer for demo
                    className="px-4 py-2 text-neutral-600 hover:text-neutral-800 transition-colors"
                  >
                    Repetir
                  </button>
                )}

                {currentStep < steps.length - 1 ? (
                  <motion.button
                    onClick={onNext}
                    className="inline-flex items-center px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Próximo
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={onComplete}
                    className="inline-flex items-center px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Entendi!
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </motion.button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Hook for managing pedagogical flow
export function usePedagogicalFlow(steps: PedagogicalStep[]) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const startFlow = () => {
    setCurrentStep(0);
    setIsActive(true);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsActive(false);
      setCurrentStep(0);
    }
  };

  const closeFlow = () => {
    setIsActive(false);
    setCurrentStep(0);
  };

  const goToStep = (stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
    }
  };

  return {
    currentStep,
    isActive,
    startFlow,
    nextStep,
    closeFlow,
    goToStep,
    progress: ((currentStep + 1) / steps.length) * 100,
    isComplete: currentStep === steps.length - 1,
  };
}
