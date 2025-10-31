"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { isHTMLElement } from "@/lib/utils/dom-type-guards";
import { flags, type Experiment } from "@/lib/flags";
import { DEBUG_CONFIG } from "@/lib/hooks/scroll-config";
import { cn } from "@/lib/utils";

interface ExperimentDebugProps {
  className?: string;
}

export function ExperimentDebugInner({ className }: ExperimentDebugProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Só renderizar se estiver em desenvolvimento
  if (!DEBUG_CONFIG.ENABLE_EXPERIMENT_DEBUG) return null;

  const experiments = Object.entries(flags.experiments).map(
    ([id, experiment]: [string, Experiment]) => ({
      id,
      name: experiment.name,
      active: experiment.active,
      variants: experiment.variants,
      currentVariant: flags.getExperimentVariant(id),
    }),
  );

  const features = Object.entries(flags.features);

  const handleReset = () => {
    // SSR safety: only run on client-side
    if (typeof window === "undefined" || !window.location) return;

    flags.resetCache();
    window.location.reload();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsVisible(false);
    }
  };

  const handleOutsideClick = (e: React.MouseEvent) => {
    if (isHTMLElement(e.target) && isHTMLElement(e.currentTarget) && e.target === e.currentTarget) {
      setIsVisible(false);
    }
  };

  return (
    <>
      {/* Toggle button - fixed position with design system tokens */}
      <motion.button
        onClick={() => setIsVisible(!isVisible)}
        onKeyDown={(e) => e.key === "Enter" && setIsVisible(!isVisible)}
        className={cn(
          // Design system: rounded-2xl, sombra suave, cores primárias/accent
          "fixed bottom-4 left-4 z-50",
          "inline-flex items-center gap-2",
          "rounded-2xl px-4 py-2.5",
          "bg-primary text-primary-foreground",
          "shadow-md hover:shadow-lg",
          "font-medium text-sm",
          "transition-all duration-200 ease-out",
          "hover:bg-primary/90 hover:scale-105",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          "dark:bg-primary dark:text-primary-foreground dark:focus-visible:ring-offset-neutral-900",
          className,
        )}
        title="Toggle Experiment Debug Panel"
        aria-label="Toggle experiment debug panel"
        aria-expanded={isVisible}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-base">🧪</span>
        <span className="hidden sm:inline">Debug</span>
      </motion.button>

      {/* Debug panel - modal-like overlay with design system */}
      <AnimatePresence>
        {isVisible && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-neutral-900/5 dark:bg-neutral-900/10"
              onClick={() => setIsVisible(false)}
              aria-hidden="true"
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={cn(
                "fixed bottom-20 left-4 z-50",
                "w-full max-w-sm sm:max-w-md",
                "max-h-[70vh] overflow-hidden",
                // Design system: cartão com rounded-2xl, sombra, borda sutil
                "bg-card border border-border rounded-2xl shadow-lg",
                "dark:bg-card dark:border-border",
                className,
              )}
              role="dialog"
              aria-modal="true"
              aria-labelledby="debug-title"
              onKeyDown={handleKeyDown}
              onClick={handleOutsideClick}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 pb-4">
                <h2
                  id="debug-title"
                  className={cn(
                    "font-display font-semibold",
                    "text-lg text-foreground",
                    // Tipografia responsiva com clamp
                    "clamp(1.125rem, 1.25rem, 1.375rem)",
                  )}
                >
                  🧪 Experiment Debug
                </h2>
                <button
                  onClick={() => setIsVisible(false)}
                  className={cn(
                    "p-1.5 rounded-lg",
                    "text-muted-foreground hover:text-foreground",
                    "hover:bg-muted transition-colors",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                  )}
                  aria-label="Close debug panel"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="px-6 pb-6 max-h-[calc(70vh-8rem)] overflow-y-auto">
                {/* Experiments Section */}
                <div className="mb-6">
                  <h3 className="font-semibold text-foreground mb-4 text-base">
                    A/B Tests
                  </h3>
                  <div className="space-y-3">
                    {experiments.map((exp) => (
                      <motion.div
                        key={exp.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * experiments.indexOf(exp) }}
                        className={cn(
                          "p-4 rounded-xl",
                          "bg-muted/50 border border-border/50",
                          "dark:bg-muted/50 dark:border-border/50",
                        )}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span className="font-medium text-foreground text-sm leading-tight">
                            {exp.name}
                          </span>
                          <span
                            className={cn(
                              "px-2.5 py-1 rounded-full text-xs font-medium",
                              exp.active
                                ? "bg-accent/10 text-accent border border-accent/20"
                                : "bg-muted text-muted-foreground border border-border",
                            )}
                          >
                            {exp.active ? "Active" : "Inactive"}
                          </span>
                        </div>

                        <div className="mb-3">
                          <div className="text-xs text-muted-foreground mb-2">
                            Current variant:
                          </div>
                          <code
                            className={cn(
                              "px-2.5 py-1 rounded-md text-xs font-mono",
                              "bg-neutral-100 text-neutral-800",
                              "dark:bg-neutral-800 dark:text-neutral-200",
                            )}
                          >
                            {exp.currentVariant}
                          </code>
                        </div>

                        <div>
                          <div className="text-xs text-muted-foreground mb-2">
                            Distribution:
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {exp.variants.map((variant: unknown) => {
                              if (typeof variant !== 'object' || variant === null || !('id' in variant) || !('name' in variant)) {
                                return null;
                              }
                              const v = variant as {
                                id: string;
                                name: string;
                                weight?: number;
                              };
                              return (
                                <span
                                  key={v.id}
                                  className={cn(
                                    "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                                    v.id === exp.currentVariant
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
                                  )}
                                >
                                  {v.name}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Features Section */}
                <div className="mb-6">
                  <h3 className="font-semibold text-foreground mb-4 text-base">
                    Feature Flags
                  </h3>
                  <div className="space-y-2">
                    {features.map(([key, value]) => (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: 0.05 * features.findIndex(([k]) => k === key),
                        }}
                        className={cn(
                          "flex items-center justify-between",
                          "p-3 rounded-lg",
                          "bg-muted/30 border border-border/30",
                          "dark:bg-muted/30 dark:border-border/30",
                        )}
                      >
                        <code className="font-mono text-sm text-foreground">
                          {key}
                        </code>
                        <span
                          className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-medium",
                            value
                              ? "bg-accent/10 text-accent border border-accent/20"
                              : "bg-muted text-muted-foreground border border-border",
                          )}
                        >
                          {value ? "On" : "Off"}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-border">
                  <button
                    onClick={handleReset}
                    className={cn(
                      "w-full inline-flex items-center justify-center gap-2",
                      "px-4 py-2.5 rounded-xl",
                      "bg-muted hover:bg-muted/80 text-foreground",
                      "font-medium text-sm",
                      "transition-all duration-200",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                      "dark:bg-muted dark:hover:bg-muted/80",
                    )}
                  >
                    <span className="text-base">🔄</span>
                    Reset & Reload
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
