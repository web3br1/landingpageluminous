"use client";

import { motion } from "framer-motion";
import { Check, Circle, Play } from "lucide-react";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

interface Step {
  id: string;
  title: string;
  description?: string;
  duration?: number;
}

interface ChapterStepperProps {
  steps: Step[];
  currentStep: number;
  progress: number; // 0-1 overall progress
  title?: string;
  className?: string;
  variant?: "horizontal" | "vertical";
}

export function ChapterStepper({
  steps,
  currentStep,
  progress,
  title = "Progresso",
  className = "",
  variant = "horizontal",
}: ChapterStepperProps) {
  const prefersReducedMotion = useReducedMotion();

  // Mobile optimization: reduce complexity on small screens
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
  const effectiveVariant = isMobile ? "horizontal" : variant;

  const progressWidth = `${progress * 100}%`;

  if (effectiveVariant === "vertical") {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className={`fixed right-8 top-1/2 -translate-y-1/2 z-30 ${className}`}
      >
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-soft-lg border border-neutral-200/50">
          {/* Title */}
          <h3 className="text-xs font-semibold text-neutral-900 mb-3 text-center">
            {title}
          </h3>

          {/* Progress indicators only - bolinhas alinhadas à direita */}
          <div className="flex flex-col items-end space-y-3">
            {steps.map((step, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              const isUpcoming = index > currentStep;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 300,
                  }}
                  className="relative flex items-center justify-end"
                >
                  {/* Step indicator - bolinha */}
                  <div className="relative">
                    {isCompleted ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          delay: index * 0.1,
                        }}
                        className="w-3 h-3 rounded-full bg-primary flex items-center justify-center"
                      >
                        <Check className="w-2 h-2 text-white" />
                      </motion.div>
                    ) : isCurrent ? (
                      <motion.div
                        animate={{
                          scale: [1, 1.2, 1],
                          boxShadow: [
                            "0 0 0 0 rgba(124, 77, 255, 0.4)",
                            "0 0 0 4px rgba(124, 77, 255, 0)",
                            "0 0 0 0 rgba(124, 77, 255, 0.4)",
                          ],
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-3 h-3 rounded-full border-2 border-primary bg-white flex items-center justify-center"
                      >
                        <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                      </motion.div>
                    ) : (
                      <motion.div
                        className="w-3 h-3 rounded-full border border-neutral-300 bg-white"
                        whileHover={{ scale: 1.1 }}
                        transition={{ type: "spring", stiffness: 400 }}
                      />
                    )}
                  </div>

                  {/* Step number label */}
                  <span
                    className={`text-xs ml-2 font-medium ${
                      isCompleted
                        ? "text-primary"
                        : isCurrent
                          ? "text-neutral-900"
                          : "text-neutral-400"
                    }`}
                  >
                    {index + 1}
                  </span>
                </motion.div>
              );
            })}
          </div>

          {/* Progress percentage */}
          <div className="mt-4 text-center">
            <span className="text-xs font-medium text-neutral-600">
              {Math.round(progress * 100)}%
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  // Horizontal variant (default)
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-30 ${className}`}
    >
      <div className="bg-white/95 backdrop-blur-sm rounded-full px-6 py-3 shadow-soft-lg border border-neutral-200/50">
        {/* Progress bar background */}
        <div className="relative mb-3">
          <div className="h-1 bg-neutral-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: progressWidth }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </div>

          {/* Step indicators */}
          <div className="absolute -top-2 left-0 right-0 flex justify-between">
            {steps.map((step, index) => {
              const stepProgress = (index + 1) / steps.length;
              const isActive = progress >= stepProgress;
              const isCurrent = index === currentStep;

              return (
                <motion.div
                  key={step.id}
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    isActive
                      ? "bg-primary border-primary"
                      : "bg-white border-neutral-300"
                  }`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      {isCurrent ? (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="w-1.5 h-1.5 bg-white rounded-full"
                        />
                      ) : (
                        <Check className="w-2.5 h-2.5 text-white" />
                      )}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Current step info */}
        <div className="text-center">
          <motion.h4
            key={currentStep}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-medium text-neutral-900"
          >
            {steps[currentStep]?.title}
          </motion.h4>
          {steps[currentStep]?.description && (
            <motion.p
              key={`desc-${currentStep}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-xs text-neutral-600 mt-1 max-w-xs mx-auto line-clamp-2"
            >
              {steps[currentStep].description}
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Hook for managing stepper state
export function useChapterStepper(steps: Step[], chapterProgress: number = 0) {
  const totalSteps = steps.length;
  const currentStepIndex = Math.min(
    Math.floor(chapterProgress * totalSteps),
    totalSteps - 1,
  );

  const stepProgress = chapterProgress * totalSteps - currentStepIndex;
  const overallProgress = chapterProgress;

  return {
    currentStep: currentStepIndex,
    stepProgress,
    overallProgress,
    totalSteps,
    currentStepData: steps[currentStepIndex],
    isFirstStep: currentStepIndex === 0,
    isLastStep: currentStepIndex === totalSteps - 1,
  };
}
