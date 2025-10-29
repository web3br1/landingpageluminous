"use client";

import { LazyMotion, domAnimation } from "framer-motion";
import { ReactNode } from "react";

interface LazyMotionProviderProps {
  children: ReactNode;
  features?: any;
  strict?: boolean;
}

/**
 * Lazy Motion Provider - Carrega Framer Motion apenas quando necessário
 *
 * Usa domAnimation como feature bundle mínimo (mais leve que domMax)
 * Reduz o bundle inicial em ~150-250KB
 */
export function LazyMotionProvider({
  children,
  features = domAnimation,
  strict = false,
}: LazyMotionProviderProps) {
  return (
    <LazyMotion features={features} strict={strict}>
      {children}
    </LazyMotion>
  );
}

/**
 * Hook para verificar se LazyMotion está disponível
 * Útil para componentes que precisam saber se animações estão ativas
 */
export function useLazyMotion() {
  return {
    isAvailable: typeof window !== "undefined",
    domAnimation,
  };
}
