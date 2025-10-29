"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { X, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from "lucide-react";

interface CoachMarkProps {
  targetId: string;
  title: string;
  description: string;
  position?: "top" | "bottom" | "left" | "right";
  isVisible: boolean;
  onClose: () => void;
  onNext?: () => void;
  step?: number;
  totalSteps?: number;
  ctaText?: string;
}

export function CoachMark({
  targetId,
  title,
  description,
  position = "bottom",
  isVisible,
  onClose,
  onNext,
  step,
  totalSteps,
  ctaText = "Entendi",
}: CoachMarkProps) {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // SSR safety: only run on client-side
    if (!isVisible || typeof document === "undefined") return;

    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      setTargetRect(rect);
    }
  }, [targetId, isVisible]);

  if (!isVisible || !targetRect) return null;

  const getTooltipPosition = () => {
    const tooltip = tooltipRef.current;
    if (!tooltip) return { top: 0, left: 0 };

    const tooltipRect = tooltip.getBoundingClientRect();
    const padding = 16;

    switch (position) {
      case "top":
        return {
          top: targetRect.top - tooltipRect.height - padding,
          left: targetRect.left + targetRect.width / 2 - tooltipRect.width / 2,
        };
      case "bottom":
        return {
          top: targetRect.bottom + padding,
          left: targetRect.left + targetRect.width / 2 - tooltipRect.width / 2,
        };
      case "left":
        return {
          top: targetRect.top + targetRect.height / 2 - tooltipRect.height / 2,
          left: targetRect.left - tooltipRect.width - padding,
        };
      case "right":
        return {
          top: targetRect.top + targetRect.height / 2 - tooltipRect.height / 2,
          left: targetRect.right + padding,
        };
      default:
        return { top: 0, left: 0 };
    }
  };

  const getArrowIcon = () => {
    switch (position) {
      case "top":
        return <ArrowDown className="w-4 h-4" />;
      case "bottom":
        return <ArrowUp className="w-4 h-4" />;
      case "left":
        return <ArrowRight className="w-4 h-4" />;
      case "right":
        return <ArrowLeft className="w-4 h-4" />;
    }
  };

  const getArrowPosition = () => {
    switch (position) {
      case "top":
        return {
          bottom: -8,
          left: "50%",
          transform: "translateX(-50%)",
        };
      case "bottom":
        return {
          top: -8,
          left: "50%",
          transform: "translateX(-50%)",
        };
      case "left":
        return {
          right: -8,
          top: "50%",
          transform: "translateY(-50%)",
        };
      case "right":
        return {
          left: -8,
          top: "50%",
          transform: "translateY(-50%)",
        };
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />

          {/* Highlight */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 pointer-events-none"
            style={{
              background: `radial-gradient(circle at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent 0%, rgba(0,0,0,0.4) 100%)`,
            }}
          >
            {/* Highlight border */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute border-2 border-white rounded-lg shadow-lg"
              style={{
                top: targetRect.top - 4,
                left: targetRect.left - 4,
                width: targetRect.width + 8,
                height: targetRect.height + 8,
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.4)",
              }}
            />
          </motion.div>

          {/* Tooltip */}
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="fixed z-50 bg-white rounded-2xl shadow-2xl border p-6 max-w-sm"
            style={getTooltipPosition()}
          >
            {/* Arrow */}
            <div
              className="absolute bg-white border-t border-l"
              style={getArrowPosition()}
            >
              {getArrowIcon()}
            </div>

            {/* Content */}
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div>
                  {step && totalSteps && (
                    <div className="text-sm text-neutral-500 mb-1">
                      Passo {step} de {totalSteps}
                    </div>
                  )}
                  <h3 className="font-semibold text-lg">{title}</h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Description */}
              <p className="text-neutral-600 leading-relaxed">{description}</p>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                {step && step < (totalSteps || 0) ? (
                  <>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-neutral-600 hover:text-neutral-800 transition-colors"
                    >
                      Pular
                    </button>
                    <button
                      onClick={onNext}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Próximo
                    </button>
                  </>
                ) : (
                  <button
                    onClick={onNext || onClose}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    {ctaText}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface CoachMarksProviderProps {
  children: React.ReactNode;
}

export function CoachMarksProvider({ children }: CoachMarksProviderProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const steps = [
    {
      targetId: "hero-headline",
      title: "Seu título principal",
      description:
        "Este é o momento mais importante da página. Ele deve capturar a atenção e comunicar claramente o valor da sua solução.",
      position: "bottom" as const,
    },
    {
      targetId: "hero-cta",
      title: "Chamada para ação principal",
      description:
        "O botão que leva o usuário para a conversão. Deve ser claro, urgente e remover qualquer barreira.",
      position: "top" as const,
    },
    {
      targetId: "hero-mockup",
      title: "Demonstração visual",
      description:
        "Mostra o produto em ação. Deve ser realista e destacar os benefícios principais.",
      position: "left" as const,
    },
  ];

  const startTour = () => {
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

  const closeTour = () => {
    setIsActive(false);
    setCurrentStep(0);
  };

  return (
    <>
      {children}

      {isActive && currentStep < steps.length && (
        <CoachMark
          {...steps[currentStep]}
          isVisible={isActive}
          onClose={closeTour}
          onNext={nextStep}
          step={currentStep + 1}
          totalSteps={steps.length}
        />
      )}
    </>
  );
}
