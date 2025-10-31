"use client";

import * as React from "react";
import { z } from "zod";
import { OptimizedMotion } from "@/lib/animation/optimized-motion";
import { useAnimations } from "@/lib/hooks/use-animations";
import { createPropValidator } from "../../lib/architecture/component-props";
import { withComponentContext } from "../../lib/architecture/logger-pattern";

// Define the props interface first
export interface FadeUpOptimizedProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: "fast" | "normal" | "slow";
  lazy?: boolean;
}

// Schema for FadeUp props validation (more lenient for backward compatibility)
const FadeUpPropsSchema = z.object({
  children: z.custom<React.ReactNode>((val) => val !== null && val !== undefined),
  className: z.string().optional(),
  delay: z.number().min(0).optional(),
  duration: z.enum(["fast", "normal", "slow"]).optional(),
  lazy: z.boolean().optional(),
});

// Create prop validator for FadeUp component
const fadeUpPropValidator = createPropValidator(FadeUpPropsSchema, "FadeUpOptimized", {
  logErrors: true,
  throwOnError: false,
  fallbackValues: {
    duration: "normal",
    lazy: true,
  },
});

/**
 * FadeUp Otimizado - Usa LazyMotion para reduzir bundle inicial
 * Substitui o componente original mantendo a mesma API
 * Inclui validação de props e logging estruturado
 */
export function FadeUpOptimized(props: FadeUpOptimizedProps) {
  // Create component-specific logger
  const componentLogger = withComponentContext("FadeUpOptimized");

  // Validate props using the component-props pattern
  const validatedProps = fadeUpPropValidator.validateWithFallback(props, {
    duration: "normal",
    lazy: true,
    children: null,
  });

  // Apply defaults for optional props
  const finalProps = {
    ...validatedProps,
    duration: validatedProps.duration ?? "normal",
    lazy: validatedProps.lazy ?? true,
  };

  // Log prop validation if there were issues
  const validationResult = fadeUpPropValidator.validate(props);
  if (!validationResult.success && validationResult.errors.length > 0) {
    componentLogger.warn("FadeUp props validation failed, using fallbacks", {
      errors: validationResult.errors.length,
      duration: finalProps.duration,
      lazy: finalProps.lazy,
    });
  }

  const { animations } = useAnimations();

  // Animação básica - usa Variants do Framer Motion
  const animationVariants = animations.fadeUp;

  // Estilos adicionais (não fazem parte dos Variants)
  const additionalStyles = finalProps.delay ? { transitionDelay: `${finalProps.delay}s` } : {};

  // Log animation start for performance monitoring
  componentLogger.debug("FadeUp animation initialized", {
    duration: finalProps.duration,
    delay: finalProps.delay,
    lazy: finalProps.lazy,
    hasClassName: !!finalProps.className,
  });

  return (
    <OptimizedMotion
      {...animationVariants}
      lazy={finalProps.lazy}
      style={additionalStyles}
      className={finalProps.className}
    >
      {finalProps.children}
    </OptimizedMotion>
  );
}

// Alias para compatibilidade
export const FadeUp = FadeUpOptimized;
