"use client";

import { OptimizedMotion } from "@/lib/animation/optimized-motion";
import { useAnimations } from "@/lib/hooks/use-animations";

interface FadeUpOptimizedProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: "fast" | "normal" | "slow";
  lazy?: boolean;
}

/**
 * FadeUp Otimizado - Usa LazyMotion para reduzir bundle inicial
 * Substitui o componente original mantendo a mesma API
 */
export function FadeUpOptimized({
  children,
  className,
  delay,
  duration = "normal",
  lazy = true,
}: FadeUpOptimizedProps) {
  const { animations } = useAnimations();

  // Animação básica - usa Variants do Framer Motion
  const animationVariants = animations.fadeUp;

  // Estilos adicionais (não fazem parte dos Variants)
  const additionalStyles = delay ? { transitionDelay: `${delay}s` } : {};

  return (
    <OptimizedMotion
      {...animationVariants}
      lazy={lazy}
      style={additionalStyles}
      className={className}
    >
      {children}
    </OptimizedMotion>
  );
}

// Alias para compatibilidade
export const FadeUp = FadeUpOptimized;
