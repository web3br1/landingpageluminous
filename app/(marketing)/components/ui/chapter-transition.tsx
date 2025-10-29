"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDirector } from "@/lib/animation/director-api";
import { AnimationLayer } from "@/lib/animation/layers-model";
import { cn } from "@/lib/utils";

// Hook para detectar preferência de movimento reduzido
function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    // Verificar se há suporte a matchMedia
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

  return prefersReducedMotion;
}

interface ChapterTransitionProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  effect?: "crossfade" | "wipe-liquid" | "slide-up" | "none";
  duration?: number;
  delay?: number;
  trigger?: string; // Elemento que dispara a transição
}

export function ChapterTransition({
  id,
  children,
  className,
  effect = "crossfade",
  duration = 0.6,
  delay = 0,
  trigger,
}: ChapterTransitionProps) {
  const director = useDirector();
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = React.useState(true);
  const transitionRef = React.useRef<HTMLDivElement>(null);

  // Configurar transição baseada no efeito e preferência de movimento
  const getTransitionVariants = () => {
    // Se o usuário prefere movimento reduzido, usar apenas opacity
    if (prefersReducedMotion) {
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
      };
    }

    switch (effect) {
      case "crossfade":
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
        };

      case "wipe-liquid":
        return {
          hidden: {
            opacity: 0,
            scale: 0.95,
            filter: "blur(10px)",
          },
          visible: {
            opacity: 1,
            scale: 1,
            filter: "blur(0px)",
          },
        };

      case "slide-up":
        return {
          hidden: {
            opacity: 0,
            y: 50,
          },
          visible: {
            opacity: 1,
            y: 0,
          },
        };

      default:
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
        };
    }
  };

  React.useEffect(() => {
    if (!trigger) return;

    // Configurar observer para disparar transição quando o elemento trigger entra na viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            director.createTimeline(`chapter-transition-${id}`, {
              layer: AnimationLayer.FG,
              priority: 1,
            });

            // Marcar como visível imediatamente
            setIsVisible(true);
          } else {
            // Opcional: esconder quando sai da viewport
            // setIsVisible(false)
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "-50px 0px",
      },
    );

    // SSR safety: only run on client-side
    if (typeof document === "undefined") return;

    const triggerElement = document.querySelector(trigger);
    if (triggerElement) {
      observer.observe(triggerElement);
    }

    return () => {
      if (triggerElement) {
        observer.unobserve(triggerElement);
      }
    };
  }, [director, id, effect, duration, delay, trigger]);

  const variants = getTransitionVariants();

  return (
    <motion.div
      ref={transitionRef}
      className={cn("chapter-transition", className)}
      data-chapter-transition={id}
      initial="hidden"
      animate={isVisible ? "visible" : "hidden"}
      variants={variants}
      transition={{
        duration: prefersReducedMotion ? Math.min(duration, 0.2) : duration,
        delay: prefersReducedMotion ? 0 : delay,
        ease: prefersReducedMotion
          ? "linear"
          : effect === "wipe-liquid"
            ? [0.23, 1, 0.32, 1]
            : [0.2, 0.8, 0.2, 1],
      }}
    >
      {children}
    </motion.div>
  );
}

// Hook para controlar transições programaticamente
export function useChapterTransitions() {
  const director = useDirector();

  const createTransition = React.useCallback(
    (
      fromChapter: string,
      toChapter: string,
      effect: "crossfade" | "wipe-liquid" | "slide-up" = "crossfade",
    ) => {
      // Criar timeline para transição entre capítulos
      director.createTimeline(`transition-${fromChapter}-to-${toChapter}`, {
        layer: AnimationLayer.FX,
        priority: 2,
      });

      // Adicionar classe de transição ao body (SSR safe)
      if (typeof document !== "undefined" && document.body) {
        document.body.classList.add("chapter-transitioning");
      }

      // Despachar evento customizado (SSR safe)
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("chapterTransitionStart", {
            detail: { fromChapter, toChapter, effect },
          }),
        );
      }

      // Simular onComplete com setTimeout
      setTimeout(() => {
        // Remover classe de transição (SSR safe)
        if (typeof document !== "undefined" && document.body) {
          document.body.classList.remove("chapter-transitioning");
        }

        // Despachar evento de conclusão (SSR safe)
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("chapterTransitionComplete", {
              detail: { fromChapter, toChapter, effect },
            }),
          );
        }
      }, 800); // 0.8s = 800ms
    },
    [director],
  );

  return { createTransition };
}

// Componente wrapper para transições automáticas entre seções
export function ChapterBoundary({
  children,
  chapterId,
  nextChapterId,
  effect = "crossfade",
  className,
}: {
  children: React.ReactNode;
  chapterId: string;
  nextChapterId?: string;
  effect?: "crossfade" | "wipe-liquid" | "slide-up" | "none";
  className?: string;
}) {
  const { createTransition } = useChapterTransitions();
  const prefersReducedMotion = useReducedMotion();

  React.useEffect(() => {
    if (!nextChapterId || prefersReducedMotion) return;

    // Detectar quando o usuário está saindo desta seção (SSR safe)
    const handleScroll = () => {
      if (typeof document === "undefined" || typeof window === "undefined")
        return;

      const currentSection = document.querySelector(
        `[data-chapter="${chapterId}"]`,
      );
      const nextSection = document.querySelector(
        `[data-chapter="${nextChapterId}"]`,
      );

      if (!currentSection || !nextSection) return;

      const currentRect = currentSection.getBoundingClientRect();
      const nextRect = nextSection.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Se a seção atual está saindo e a próxima está entrando
      if (
        currentRect.bottom < windowHeight * 0.5 &&
        nextRect.top < windowHeight * 0.8
      ) {
        // Só criar transição se o efeito for válido e não "none"
        if (effect !== "none") {
          createTransition(chapterId, nextChapterId, effect);
        }
      }
    };

    // SSR safety: only add listeners on client-side
    if (typeof window === "undefined") return;

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [
    chapterId,
    nextChapterId,
    effect,
    createTransition,
    prefersReducedMotion,
  ]);

  return (
    <div
      className={cn("chapter-boundary", className)}
      data-chapter-boundary={chapterId}
    >
      {children}
    </div>
  );
}
