"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TOKENS_CHAPTER,
  getChapterHue,
  THEME_MAP,
} from "@/lib/theme/design-tokens";
import {
  useAnimationController,
  CHAPTER_ANIMATIONS,
} from "@/lib/theme/animation-controller";
import { useAnalytics } from "@/lib/analytics/use-analytics";

// ===== DEFINIÇÃO DOS CAPÍTULOS =====
export const STORY_CHAPTERS = {
  hero: {
    id: "hero",
    name: "Hero",
    hue: TOKENS_CHAPTER.hero.hue,
    selector: '[data-chapter="hero"]',
    ctaVariant: "primary" as const,
    backgroundIntensity: 0.8,
  },
  howItWorks: {
    id: "how-it-works",
    name: "How It Works",
    hue: TOKENS_CHAPTER.howItWorks.hue,
    selector: '[data-chapter="how-it-works"]',
    ctaVariant: "secondary" as const,
    backgroundIntensity: 0.6,
  },
  useCases: {
    id: "use-cases",
    name: "Use Cases",
    hue: TOKENS_CHAPTER.useCases.hue,
    selector: '[data-chapter="use-cases"]',
    ctaVariant: "secondary" as const,
    backgroundIntensity: 0.4,
  },
  features: {
    id: "features",
    name: "Features",
    hue: TOKENS_CHAPTER.features.hue,
    selector: '[data-chapter="features"]',
    ctaVariant: "secondary" as const,
    backgroundIntensity: 0.3,
  },
  pricing: {
    id: "pricing",
    name: "Pricing",
    hue: TOKENS_CHAPTER.pricing.hue,
    selector: '[data-chapter="pricing"]',
    ctaVariant: "promo" as const,
    backgroundIntensity: 0.5,
  },
  ctaFinal: {
    id: "cta-final",
    name: "CTA Final",
    hue: 340, // rosa quente
    selector: '[data-chapter="cta-final"]',
    ctaVariant: "primary" as const,
    backgroundIntensity: 0.7,
  },
} as const;

export type ChapterId = keyof typeof STORY_CHAPTERS;

// ===== HOOK PRINCIPAL PARA STORYTELLING =====
export function useChapterStorytelling() {
  const [currentChapter, setCurrentChapter] = useState<ChapterId | null>(null);
  const [chapterProgress, setChapterProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useAnalytics();
  const animationController = useAnimationController();

  // Intersection Observer para detectar capítulo atual
  useEffect(() => {
    // SSR safety: only run on client-side
    if (typeof document === "undefined") return;

    const observers = Object.values(STORY_CHAPTERS)
      .map((chapter) => {
        const element = document.querySelector(chapter.selector);
        if (!element) return null;

        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
                const newChapter = chapter.id as ChapterId;
                if (currentChapter !== newChapter) {
                  setCurrentChapter(newChapter);
                  setIsTransitioning(true);

                  // Track chapter enter (analytics removed)

                  // Reset transition after animation
                  setTimeout(() => setIsTransitioning(false), 300);
                }

                // Update progress within chapter
                setChapterProgress(entry.intersectionRatio);
              }
            });
          },
          {
            threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
            rootMargin: "-10% 0px -10% 0px", // Trigger when 10% visible
          },
        );

        observer.observe(element);
        return observer;
      })
      .filter(Boolean);

    return () => {
      observers.forEach((observer) => observer?.disconnect());
    };
  }, [currentChapter]);

  // Obter configuração do capítulo atual
  const getCurrentChapterConfig = useCallback(() => {
    if (!currentChapter) return null;
    return STORY_CHAPTERS[currentChapter];
  }, [currentChapter]);

  // Calcular cor interpolada para transições suaves
  const getInterpolatedColor = useCallback(
    (fromChapter: ChapterId, toChapter: ChapterId, progress: number) => {
      const fromHue = STORY_CHAPTERS[fromChapter].hue;
      const toHue = STORY_CHAPTERS[toChapter].hue;

      // Interpolação linear de hue
      const interpolatedHue = fromHue + (toHue - fromHue) * progress;

      return {
        hue: interpolatedHue,
        hsl: `hsl(${interpolatedHue}, 70%, 60%)`,
        hsla: (alpha: number) => `hsla(${interpolatedHue}, 70%, 60%, ${alpha})`,
      };
    },
    [],
  );

  // Obter variante de CTA baseada no capítulo
  const getChapterCTAVariant = useCallback((chapterId: ChapterId) => {
    return STORY_CHAPTERS[chapterId].ctaVariant;
  }, []);

  // Hook para aplicar cores do capítulo no background
  const useChapterBackgroundColor = useCallback((chapterId: ChapterId) => {
    const chapter = STORY_CHAPTERS[chapterId];

    return {
      backgroundColor: `hsl(${chapter.hue}, 70%, ${97 - chapter.backgroundIntensity * 20}%)`,
      transition: "background-color 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
    };
  }, []);

  return {
    currentChapter,
    chapterProgress,
    isTransitioning,
    getCurrentChapterConfig,
    getInterpolatedColor,
    getChapterCTAVariant,
    useChapterBackgroundColor,
    chapters: STORY_CHAPTERS,
  };
}

// ===== HOOK PARA ANIMAÇÕES DE CAPÍTULO =====
export function useChapterAnimations(chapterId: ChapterId) {
  const { shouldAnimate, getConfig } = useAnimationController();
  const chapterConfig =
    CHAPTER_ANIMATIONS[chapterId as keyof typeof CHAPTER_ANIMATIONS];

  const shouldAnimateChapter = shouldAnimate(`chapter-${chapterId}`);
  const baseConfig = getConfig("enter");

  return {
    shouldAnimate: shouldAnimateChapter,
    config: shouldAnimateChapter ? chapterConfig : null,
    baseConfig,
    staggerDelay: (index: number) =>
      index * ((baseConfig.stagger || 100) / 1000),
  };
}

// ===== HOOK PARA CTA POR CAPÍTULO =====
export function useChapterCTA(chapterId: ChapterId) {
  const { getChapterCTAVariant } = useChapterStorytelling();
  const variant = getChapterCTAVariant(chapterId);

  return {
    variant,
    className: getCTAClassName(variant, chapterId),
  };
}

// Função utilitária para classes de CTA por capítulo
function getCTAClassName(variant: string, chapterId: ChapterId): string {
  const baseClasses = "font-semibold transition-all duration-300";

  switch (variant) {
    case "primary":
      return `${baseClasses} bg-gradient-to-r from-primary to-primary hover:shadow-lg`;

    case "secondary":
      return `${baseClasses} bg-white/90 backdrop-blur-sm border-2 border-primary/30 hover:bg-white hover:border-primary`;

    case "promo":
      return `${baseClasses} bg-gradient-to-r from-accent to-accent hover:shadow-lg hover:shadow-accent/25`;

    default:
      return baseClasses;
  }
}

// ===== UTILITÁRIOS PARA SCROLL STORYTELLING =====

// Hook para detectar direção do scroll
export function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState<"up" | "down" | null>(
    null,
  );
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    // SSR safety: only run on client-side
    if (typeof window === "undefined") return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (Math.abs(currentScrollY - lastScrollY) > 10) {
        // Threshold para evitar flickering
        setScrollDirection(currentScrollY > lastScrollY ? "down" : "up");
        setLastScrollY(currentScrollY);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return scrollDirection;
}

// Hook para parallax limitado (máximo 16px)
export function useLimitedParallax(
  chapterId: ChapterId,
  maxOffset: number = 16,
) {
  const [offset, setOffset] = useState(0);
  const { shouldAnimate } = useAnimationController();

  useEffect(() => {
    if (!shouldAnimate(`parallax-${chapterId}`)) return;

    // SSR safety: only run on client-side
    if (typeof window === "undefined" || typeof document === "undefined")
      return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const chapterElement = document.querySelector(
        STORY_CHAPTERS[chapterId].selector,
      );

      if (chapterElement) {
        const rect = chapterElement.getBoundingClientRect();
        const elementTop = rect.top + scrollY;
        const windowHeight = window.innerHeight;

        // Calcular offset baseado na posição relativa
        const relativePosition =
          (scrollY - elementTop + windowHeight) / (windowHeight * 2);
        const newOffset = Math.max(
          -maxOffset,
          Math.min(maxOffset, relativePosition * maxOffset),
        );

        setOffset(newOffset);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [chapterId, shouldAnimate, maxOffset]);

  return offset;
}

// Hook para morphing de elementos entre capítulos
export function useChapterMorph(chapterId: ChapterId) {
  const { isTransitioning } = useChapterStorytelling();
  const { shouldAnimate } = useAnimationController();

  const morphConfig = {
    scale: isTransitioning ? 1.05 : 1,
    opacity: isTransitioning ? 0.8 : 1,
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  };

  return shouldAnimate(`morph-${chapterId}`)
    ? morphConfig
    : { scale: 1, opacity: 1 };
}

// ===== TRACKING E ANALYTICS =====

// Hook para tracking de engajamento por capítulo
export function useChapterEngagement(chapterId: ChapterId) {
  useAnalytics();
  const [timeSpent, setTimeSpent] = useState(0);
  const [hasViewedCTA, setHasViewedCTA] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      setTimeSpent(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const trackCTAView = useCallback(() => {
    if (!hasViewedCTA) {
      setHasViewedCTA(true);
      // CTA view tracking removed
    }
  }, [hasViewedCTA]);

  const trackCTAClick = useCallback((ctaText: string) => {
    // CTA click tracking removed
  }, []);

  return {
    timeSpent,
    trackCTAView,
    trackCTAClick,
  };
}
