"use client";

/**
 * Wrapper Centralizado para Framer Motion
 *
 * Resolve lacuna #4: Imports diretos anulando lazy loading
 *
 * Todos os componentes devem importar daqui ao invés de 'framer-motion' diretamente.
 * Isso permite controle centralizado sobre qual feature pack é carregado.
 */

// LazyMotion e contexto
export { LazyMotion, domAnimation } from "framer-motion";

// Componentes básicos (sempre disponíveis com domAnimation)
export { motion, m, AnimatePresence, AnimateSharedLayout } from "framer-motion";

// Layout components
export { LayoutGroup } from "framer-motion";

// Hooks básicos (disponíveis com domAnimation)
export { useReducedMotion, useInView, usePresence } from "framer-motion";

// ⚠️ Hooks avançados - só funcionam com feature pack 'full'
// Verificar contexto antes de usar!
export {
  useMotionValue,
  useTransform,
  useSpring,
  useScroll,
  useVelocity,
  useAnimationControls,
  useAnimation,
  animationControls,
} from "framer-motion";

// Utilitários
export { transform, clamp, mix, pipe } from "framer-motion";

// Tipos
export type {
  MotionProps,
  MotionValue,
  Variants,
  Transition,
  PanInfo,
  TapInfo,
} from "framer-motion";
