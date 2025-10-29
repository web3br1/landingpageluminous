"use client";

import {
  motion,
  MotionProps,
  AnimatePresence,
  AnimatePresenceProps,
  m,
  AnimatePresence as LazyAnimatePresence,
} from "framer-motion";
import { LazyMotionProvider } from "./lazy-motion-provider";
import { ReactNode, ComponentType } from "react";

// Wrapper que funciona tanto com LazyMotion quanto sem
interface OptimizedMotionProps extends MotionProps {
  children: ReactNode;
  as?: ComponentType<any>;
  lazy?: boolean;
  className?: string;
}

/**
 * ✅ IMPLEMENTAÇÃO CORRIGIDA: Optimized Motion Component
 *
 * - Quando lazy=true: usa componentes 'm.*' que funcionam dentro de LazyMotion
 * - Quando lazy=false: usa motion.* normais (Framer Motion completo)
 * - Assume que LazyMotionProvider já está no contexto quando lazy=true
 */
export function OptimizedMotion({
  children,
  as,
  lazy = true,
  ...props
}: OptimizedMotionProps) {
  // Escolhe o componente baseado no modo lazy
  const MotionComponent = lazy
    ? getLazyMotionComponent(as)
    : getMotionComponent(as);

  return <MotionComponent {...props}>{children}</MotionComponent>;
}

// Função auxiliar para escolher componente lazy
function getLazyMotionComponent(as?: ComponentType<any>) {
  if (!as) return m.div;

  // Mapeamento de componentes LazyMotion (m.*)
  const lazyComponents: Record<string, any> = {
    div: m.div,
    span: m.span,
    p: m.p,
    h1: m.h1,
    h2: m.h2,
    h3: m.h3,
    h4: m.h4,
    h5: m.h5,
    h6: m.h6,
    button: m.button,
    a: m.a,
    img: m.img,
    section: m.section,
    article: m.article,
    header: m.header,
    footer: m.footer,
    nav: m.nav,
    ul: m.ul,
    li: m.li,
  };

  // Se for um componente customizado, assume que é motion.*
  if (typeof as === "string") {
    return lazyComponents[as] || m.div;
  }

  return as; // Componente customizado
}

// Função auxiliar para escolher componente motion normal
function getMotionComponent(as?: ComponentType<any>) {
  if (!as) return motion.div;

  // Mapeamento de componentes motion.*
  const motionComponents: Record<string, any> = {
    div: motion.div,
    span: motion.span,
    p: motion.p,
    h1: motion.h1,
    h2: motion.h2,
    h3: motion.h3,
    h4: motion.h4,
    h5: motion.h5,
    h6: motion.h6,
    button: motion.button,
    a: motion.a,
    img: motion.img,
    section: motion.section,
    article: motion.article,
    header: motion.header,
    footer: motion.footer,
    nav: motion.nav,
    ul: motion.ul,
    li: motion.li,
  };

  // Se for um componente customizado, assume que é motion.*
  if (typeof as === "string") {
    return motionComponents[as] || motion.div;
  }

  return as; // Componente customizado
}

// Wrapper otimizado para AnimatePresence
interface OptimizedAnimatePresenceProps extends AnimatePresenceProps {
  children: ReactNode;
  lazy?: boolean;
}

export function OptimizedAnimatePresence({
  children,
  lazy = true,
  ...props
}: OptimizedAnimatePresenceProps) {
  // Escolhe AnimatePresence baseado no modo
  const AnimatePresenceComponent = lazy ? LazyAnimatePresence : AnimatePresence;

  return (
    <AnimatePresenceComponent {...props}>{children}</AnimatePresenceComponent>
  );
}

// Hook para detectar se deve usar lazy loading
export function useMotionOptimization() {
  return {
    shouldUseLazy: typeof window !== "undefined",
    LazyMotionProvider,
  };
}
