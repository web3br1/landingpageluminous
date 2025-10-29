"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useRef, useEffect, useState } from "react";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { ChapterTransition } from "@/lib/hooks/use-scroll-storytelling";
import { SCROLL_CONFIG } from "@/lib/hooks/scroll-config";

interface ChapterTransitionOverlayProps {
  transition: ChapterTransition;
  className?: string;
}

// Wipe líquido: filme translúcido varrendo a tela (220–320ms)
function WipeTransition({
  progress,
  direction,
}: {
  progress: number;
  direction: "up" | "down" | null;
}) {
  const wipeVariants = {
    initial: {
      x: direction === "down" ? "-100%" : "100%",
      scaleX: 0.3,
      opacity: 0,
    },
    animate: {
      x: "0%",
      scaleX: 1,
      opacity: 1,
    },
    exit: {
      x: direction === "down" ? "100%" : "-100%",
      scaleX: 0.3,
      opacity: 0,
    },
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 pointer-events-none"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={wipeVariants}
      transition={{
        duration: SCROLL_CONFIG.TRANSITION_DURATION_MS / 1000,
        ease: SCROLL_CONFIG.TRANSITION_EASE,
        opacity: { duration: 0.2 },
      }}
    >
      {/* Liquid gradient wipe */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

      {/* Subtle liquid effect */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 30% 40%, rgba(124, 77, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 70% 60%, rgba(255, 179, 198, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 50% 80%, rgba(0, 212, 255, 0.1) 0%, transparent 50%)
          `,
        }}
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "linear",
        }}
      />

      {/* Ripple effect */}
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.3 }}
        transition={{ duration: 0.32, ease: "easeOut" }}
      >
        <div className="absolute inset-0 border-2 border-primary/30 rounded-full scale-75" />
        <div className="absolute inset-0 border border-primary/20 rounded-full scale-50" />
      </motion.div>
    </motion.div>
  );
}

// Crossfade em camadas: conteúdo antigo opacita + blur; novo entra nítido
function CrossfadeTransition({ progress }: { progress: number }) {
  return (
    <motion.div
      className="fixed inset-0 z-40 pointer-events-none"
      style={{
        backdropFilter: `blur(${progress * 4}px)`,
        backgroundColor: `rgba(255, 255, 255, ${progress * 0.1})`,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.26,
        ease: SCROLL_CONFIG.TRANSITION_EASE,
      }}
    >
      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/5" />
    </motion.div>
  );
}

export function ChapterTransitionOverlay({
  transition,
  className = "",
}: ChapterTransitionOverlayProps) {
  const prefersReducedMotion = useReducedMotion();

  // Skip transitions if reduced motion is preferred
  if (prefersReducedMotion || transition.type === "none") {
    return null;
  }

  return (
    <div className={`fixed inset-0 pointer-events-none ${className}`}>
      <AnimatePresence mode="wait">
        {transition.from && transition.to && (
          <div key={`${transition.from}-to-${transition.to}`}>
            {transition.type === "wipe" && (
              <WipeTransition
                progress={transition.progress}
                direction={transition.direction}
              />
            )}

            {transition.type === "crossfade" && (
              <CrossfadeTransition progress={transition.progress} />
            )}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Componente para elementos persistentes durante transições
interface PersistentElementsProps {
  children: React.ReactNode;
  className?: string;
}

export function PersistentElements({
  children,
  className = "",
}: PersistentElementsProps) {
  return (
    <motion.div
      className={`fixed top-0 left-0 right-0 z-50 pointer-events-auto ${className}`}
      layout
      transition={{
        layout: {
          duration: SCROLL_CONFIG.TRANSITION_DURATION_MS / 1000,
          ease: SCROLL_CONFIG.TRANSITION_EASE,
        },
      }}
    >
      {children}
    </motion.div>
  );
}

// Hook para gerenciar elementos sticky durante pinning
export function useStickyElements() {
  const [stickyElements, setStickyElements] = useState<
    Map<string, HTMLElement>
  >(new Map());

  const registerStickyElement = useCallback(
    (id: string, element: HTMLElement) => {
      setStickyElements((prev) => new Map(prev.set(id, element)));
    },
    [],
  );

  const unregisterStickyElement = useCallback((id: string) => {
    setStickyElements((prev) => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  const updateStickyPositions = useCallback(
    (scrollY: number) => {
      stickyElements.forEach((element, id) => {
        if (element) {
          const rect = element.getBoundingClientRect();
          const shouldStick = rect.top <= 0;

          element.style.position = shouldStick ? "fixed" : "relative";
          element.style.top = shouldStick ? "0" : "auto";
          element.style.zIndex = shouldStick ? "40" : "auto";
        }
      });
    },
    [stickyElements],
  );

  return {
    registerStickyElement,
    unregisterStickyElement,
    updateStickyPositions,
    stickyElements,
  };
}

// Componente para elementos que ficam sticky durante pinning
interface StickyElementProps {
  id: string;
  children: React.ReactNode;
  onRegister: (id: string, element: HTMLElement) => void;
  onUnregister: (id: string) => void;
  className?: string;
}

export function StickyElement({
  id,
  children,
  onRegister,
  onUnregister,
  className = "",
}: StickyElementProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (elementRef.current) {
      onRegister(id, elementRef.current);
    }

    return () => {
      onUnregister(id);
    };
  }, [id, onRegister, onUnregister]);

  return (
    <div
      ref={elementRef}
      className={className}
      style={{
        willChange: "transform",
        backfaceVisibility: "hidden",
      }}
    >
      {children}
    </div>
  );
}
