"use client";

// Animation Controller - Orquestração Centralizada
// Centraliza controle de timings, easings e estados de animação
// Implementa guard-rails para performance e acessibilidade

import React from "react";
import { TOKENS_MOTION } from "./design-tokens";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";

// ===== ESTADO GLOBAL DE ANIMAÇÃO =====
class AnimationController {
  private static instance: AnimationController;
  private isReducedMotion: boolean = false;
  private activeAnimations: Set<string> = new Set();
  private maxConcurrentAnimations: number = 3;

  private constructor() {}

  static getInstance(): AnimationController {
    if (!AnimationController.instance) {
      AnimationController.instance = new AnimationController();
    }
    return AnimationController.instance;
  }

  // Configurar preferências de movimento reduzido
  setReducedMotion(reduced: boolean): void {
    this.isReducedMotion = reduced;
  }

  // Verificar se animação deve executar
  shouldAnimate(animationId: string): boolean {
    if (this.isReducedMotion) return false;

    // Limitar animações concorrentes
    if (this.activeAnimations.size >= this.maxConcurrentAnimations) {
      return false;
    }

    return true;
  }

  // Registrar animação ativa
  registerAnimation(animationId: string): void {
    this.activeAnimations.add(animationId);
  }

  // Desregistrar animação
  unregisterAnimation(animationId: string): void {
    this.activeAnimations.delete(animationId);
  }

  // Obter contagem de animações ativas
  getActiveAnimationsCount(): number {
    return this.activeAnimations.size;
  }

  // Obter configuração de animação com guard-rails
  getAnimationConfig(type: keyof typeof ANIMATION_CONFIGS): AnimationConfig {
    return ANIMATION_CONFIGS[type];
  }
}

// ===== CONFIGURAÇÕES DE ANIMAÇÃO =====
export const ANIMATION_CONFIGS = {
  // Entrada de elementos
  enter: {
    duration: TOKENS_MOTION.enter,
    easing: TOKENS_MOTION.standard,
    delay: 0,
    transform: `translateY(${TOKENS_MOTION.offset}px)`,
    stagger: TOKENS_MOTION.stagger,
  },

  // Saída de elementos
  exit: {
    duration: TOKENS_MOTION.exit,
    easing: TOKENS_MOTION.entrance,
    delay: 0,
    transform: "translateY(0px)",
    stagger: 0,
  },

  // Hover states
  hover: {
    duration: 150,
    easing: TOKENS_MOTION.standard,
    transform: `translateY(-${TOKENS_MOTION.lift}px)`,
    stagger: 0,
  },

  // Scroll-triggered
  scroll: {
    duration: TOKENS_MOTION.enter,
    easing: TOKENS_MOTION.entrance,
    delay: 0,
    threshold: 0.1,
    rootMargin: "-50px",
  },

  // Micro-interactions
  micro: {
    duration: 100,
    easing: TOKENS_MOTION.standard,
    scale: 1.02,
    stagger: 0,
  },
} as const;

// ===== HOOK PARA USAR ANIMATION CONTROLLER =====
export function useAnimationController() {
  const controller = AnimationController.getInstance();
  const prefersReducedMotion = useReducedMotion();

  // Atualizar controller quando preferência mudar
  React.useEffect(() => {
    controller.setReducedMotion(prefersReducedMotion);
  }, [prefersReducedMotion, controller]);

  return {
    // Verificar se deve animar
    shouldAnimate: (id: string) => controller.shouldAnimate(id),

    // Registrar/desregistrar animações
    registerAnimation: (id: string) => controller.registerAnimation(id),
    unregisterAnimation: (id: string) => controller.unregisterAnimation(id),

    // Obter config com guard-rails
    getConfig: (type: keyof typeof ANIMATION_CONFIGS) =>
      controller.getAnimationConfig(type),

    // Estado atual
    isReducedMotion: prefersReducedMotion,
    activeAnimations: controller.getActiveAnimationsCount(),
  };
}

// ===== COMPONENTES DE ANIMAÇÃO CONTROLADOS =====

// Wrapper para animações de entrada
interface ControlledFadeUpProps {
  children: React.ReactNode;
  id: string;
  delay?: number;
  className?: string;
}

export function ControlledFadeUp({
  children,
  id,
  delay = 0,
  className,
}: ControlledFadeUpProps) {
  const { shouldAnimate, registerAnimation, unregisterAnimation, getConfig } =
    useAnimationController();

  React.useEffect(() => {
    registerAnimation(id);
    return () => unregisterAnimation(id);
  }, [id, registerAnimation, unregisterAnimation]);

  if (!shouldAnimate(id)) {
    return <div className={className}>{children}</div>;
  }

  const config = getConfig("enter");

  return <div className={className}>{children}</div>;
}

// Wrapper para animações de hover
interface ControlledHoverProps {
  children: React.ReactNode;
  id: string;
  className?: string;
}

export function ControlledHover({
  children,
  id,
  className,
}: ControlledHoverProps) {
  const { shouldAnimate, getConfig } = useAnimationController();

  if (!shouldAnimate(id)) {
    return <div className={className}>{children}</div>;
  }

  const config = getConfig("hover");

  return <div className={className}>{children}</div>;
}

// ===== CHAPTER TRANSITIONS =====

// Configurações específicas por capítulo
export const CHAPTER_ANIMATIONS = {
  hero: {
    background: {
      duration: 2000,
      easing: TOKENS_MOTION.entrance,
      parallax: 0.3, // limite: < 16px desktop
    },
    content: {
      stagger: TOKENS_MOTION.stagger,
      direction: "up",
    },
  },

  howItWorks: {
    background: {
      duration: 1500,
      easing: TOKENS_MOTION.standard,
      parallax: 0.2,
    },
    content: {
      stagger: TOKENS_MOTION.stagger * 2,
      direction: "left",
    },
  },

  useCases: {
    background: {
      duration: 1200,
      easing: TOKENS_MOTION.standard,
      parallax: 0.1,
    },
    content: {
      stagger: TOKENS_MOTION.stagger,
      direction: "right",
    },
  },

  pricing: {
    background: {
      duration: 1000,
      easing: TOKENS_MOTION.entrance,
      parallax: 0, // sem parallax no pricing
    },
    content: {
      stagger: TOKENS_MOTION.stagger,
      direction: "up",
    },
  },
} as const;

// Hook para animações de capítulo
export function useChapterAnimation(
  chapterId: keyof typeof CHAPTER_ANIMATIONS,
) {
  const { shouldAnimate } = useAnimationController();
  const config = CHAPTER_ANIMATIONS[chapterId];

  return {
    shouldAnimate,
    backgroundConfig: config.background,
    contentConfig: config.content,
    isActive: shouldAnimate(chapterId),
  };
}

// ===== ANIMATED BACKGROUND CONTROLLER =====

// Centralizar controle de backgrounds animados
export function useAnimatedBackgroundController() {
  const { shouldAnimate, getConfig } = useAnimationController();

  // Background animations com guard-rails
  const backgroundAnimations = {
    floating: shouldAnimate("background-floating")
      ? {
          animate: {
            y: [0, -10, 0],
            transition: {
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            },
          },
        }
      : {},

    gradient: shouldAnimate("background-gradient")
      ? {
          animate: {
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            transition: {
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            },
          },
        }
      : {},

    particles: shouldAnimate("background-particles")
      ? {
          // Configuração limitada para particles
          maxParticles: 20,
          speed: 0.5,
        }
      : { maxParticles: 0 },
  };

  return {
    animations: backgroundAnimations,
    shouldAnimate,
    getConfig,
  };
}

// ===== PERFORMANCE MONITORING =====

// Monitor de performance de animações
export function useAnimationPerformance() {
  const [metrics, setMetrics] = React.useState({
    activeAnimations: 0,
    droppedFrames: 0,
    averageDuration: 0,
  });

  React.useEffect(() => {
    const controller = AnimationController.getInstance();

    // Monitorar estado das animações
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        activeAnimations: controller.getActiveAnimationsCount(),
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return metrics;
}

// ===== TYPES =====
export interface AnimationConfig {
  duration: number;
  easing: readonly number[];
  delay?: number;
  transform?: string;
  stagger?: number;
  threshold?: number;
  rootMargin?: string;
}

// Export the AnimationController class
export { AnimationController };

// Components using motion should import it directly where needed
