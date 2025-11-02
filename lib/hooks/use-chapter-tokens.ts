"use client";

import { useMemo } from "react";
import {
  TOKENS_BRAND,
  TOKENS_BASE,
  TOKENS_INTENT,
  THEME_MAP,
} from "@/lib/theme/design-tokens";
import { STORY_CHAPTERS, type ChapterId } from "./use-chapter-storytelling";

// ===== HOOK PARA APLICAR TOKENS POR CAPÍTULO =====
export function useChapterTokens(
  chapterId: ChapterId,
  isDark: boolean = false,
) {
  const chapter = STORY_CHAPTERS[chapterId];
  const theme = isDark ? THEME_MAP.dark : THEME_MAP.light;

  // Cor base do capítulo (para destaques sutis)
  const chapterColor = useMemo(
    () => ({
      hue: chapter.hue,
      hsl: `hsl(${chapter.hue}, 70%, 60%)`,
      hsla: (alpha: number) => `hsla(${chapter.hue}, 70%, 60%, ${alpha})`,
      // Versões mais suaves para backgrounds
      subtle: `hsl(${chapter.hue}, 30%, 95%)`,
      accent: `hsl(${chapter.hue}, 50%, 85%)`,
    }),
    [chapter.hue],
  );

  // Tokens específicos do capítulo
  const chapterTokens = useMemo(
    () => ({
      // Cores do capítulo
      colors: {
        primary: chapterColor.hsl,
        primarySubtle: chapterColor.subtle,
        primaryAccent: chapterColor.accent,
        // Mantém compatibilidade com tokens globais
        brand: theme.brand,
        intent: theme.intent,
      },

      // CTA variant específica do capítulo
      cta: {
        variant: chapter.ctaVariant,
        className: getChapterCTAClass(chapter.ctaVariant, chapterId, isDark),
      },

      // Background com intensidade do capítulo
      background: {
        base: `hsl(${TOKENS_BASE.bg.base})`,
        subtle: `hsl(${TOKENS_BASE.bg.subtle})`,
        chapter: `hsl(${chapter.hue}, ${chapter.backgroundIntensity * 100}%, 98%)`,
      },

      // Bordas e sombras
      borders: {
        subtle: `hsl(${TOKENS_BASE.border.subtle})`,
        chapter: chapterColor.hsla(0.2),
      },

      // Glassmorphism (só quando permitido)
      glass:
        chapterId === "hero"
          ? {
              background: "rgba(255, 255, 255, 0.7)",
              backdropBlur: "blur(12px)",
              border: `1px solid ${chapterColor.hsla(0.2)}`,
            }
          : null,
    }),
    [chapterId, chapter, isDark, theme, chapterColor],
  );

  return chapterTokens;
}

// ===== FUNÇÃO PARA GERAR CLASSES DE CTA POR CAPÍTULO =====
function getChapterCTAClass(
  variant: string,
  chapterId: ChapterId,
  isDark: boolean,
): string {
  const theme = isDark ? THEME_MAP.dark : THEME_MAP.light;
  const chapter = STORY_CHAPTERS[chapterId];

  const baseClasses =
    "inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  switch (variant) {
    case "primary":
      return `${baseClasses} bg-gradient-to-r from-[${theme.brand.primary}] to-[${theme.brand.primary}] text-white hover:shadow-lg px-6 py-3 text-base`;

    case "secondary":
      const bgColor = isDark ? "bg-neutral-800" : "bg-white/90";
      const borderColor = isDark ? "border-neutral-600" : "border-neutral-300";
      return `${baseClasses} ${bgColor} backdrop-blur-sm border-2 ${borderColor} text-[${theme.brand.primary}] hover:bg-white hover:border-[${theme.brand.primary}] px-6 py-3 text-base`;

    case "promo":
      return `${baseClasses} bg-gradient-to-r from-[${theme.brand.accent}] to-[${theme.brand.accent}] text-white hover:shadow-lg hover:shadow-[${theme.brand.accent}]/25 px-6 py-3 text-base`;

    default:
      return `${baseClasses} bg-[${theme.intent.cta}] text-white hover:shadow-lg px-6 py-3 text-base`;
  }
}

// ===== HOOK PARA APLICAÇÃO DE TOKENS EM COMPONENTES =====
export function useComponentTokens(
  componentType: string,
  chapterId: ChapterId,
) {
  const chapterTokens = useChapterTokens(chapterId);

  // Tokens específicos por tipo de componente
  const componentTokens = useMemo(() => {
    switch (componentType) {
      case "hero":
        return {
          ...chapterTokens,
          colors: chapterTokens.colors, // Explicitamente preserva colors
          spacing: { container: "py-20 md:py-32", content: "max-w-4xl" },
          typography: {
            headline: "text-4xl md:text-6xl lg:text-7xl font-bold",
            subheadline: "text-xl md:text-2xl",
          },
        } as const;

      case "section":
        return {
          ...chapterTokens,
          spacing: { container: "py-16 md:py-24", content: "max-w-6xl" },
          typography: {
            title: "text-3xl md:text-4xl font-bold",
            subtitle: "text-lg md:text-xl",
          },
        };

      case "card":
        return {
          ...chapterTokens,
          spacing: { padding: "p-6 md:p-8", gap: "gap-4" },
          effects: {
            shadow: "shadow-md hover:shadow-lg",
            border: `border border-[${chapterTokens.borders.subtle}]`,
          },
        };

      case "badge":
        return {
          ...chapterTokens,
          spacing: { padding: "px-3 py-1", text: "text-sm" },
          colors: {
            background: chapterTokens.colors.primarySubtle,
            text: chapterTokens.colors.primary,
          },
        };

      default:
        return chapterTokens;
    }
  }, [componentType, chapterTokens]);

  return componentTokens;
}

// ===== UTILITÁRIOS PARA APLICAÇÃO RÁPIDA =====

// Hook para gerar CSS custom properties por capítulo
export function useChapterCSSVariables(
  chapterId: ChapterId,
  isDark: boolean = false,
): Record<string, string> {
  const tokens = useChapterTokens(chapterId, isDark);

  return {
    "--chapter-primary": tokens.colors.primary,
    "--chapter-primary-subtle": tokens.colors.primarySubtle,
    "--chapter-primary-accent": tokens.colors.primaryAccent,
    "--chapter-bg-base": tokens.background.base,
    "--chapter-bg-subtle": tokens.background.subtle,
    "--chapter-bg-chapter": tokens.background.chapter,
    "--chapter-border-subtle": tokens.borders.subtle,
    "--chapter-border-chapter": tokens.borders.chapter,
  };
}

// Função para aplicar tokens em elementos via data attributes
export function applyChapterTokens(
  element: HTMLElement,
  cssVars: Record<string, string>,
  chapterId: ChapterId,
) {
  Object.entries(cssVars).forEach(([property, value]) => {
    element.style.setProperty(property, value);
  });

  // Adicionar data attribute para seletores CSS
  element.setAttribute("data-chapter", chapterId);
}

// ===== EXEMPLO DE USO EM COMPONENTE =====
/*
import { useComponentTokens, useChapterTokens } from '@/lib/hooks/use-chapter-tokens'

function HeroSection() {
  const heroTokens = useComponentTokens('hero', 'hero')
  const chapterTokens = useChapterTokens('hero')

  return (
    <section
      className={`${heroTokens.spacing.container} bg-gradient-to-br ${heroTokens.background.chapter}`}
      style={{
        '--chapter-primary': chapterTokens.colors.primary
      } as React.CSSProperties}
    >
      <div className={`container mx-auto px-4 ${heroTokens.spacing.content}`}>
        <h1 className={`${heroTokens.typography.headline} text-[var(--chapter-primary)]`}>
          Headline com cor do capítulo
        </h1>

        <CtaButton
          variant={chapterTokens.cta.variant}
          className={chapterTokens.cta.className}
        >
          CTA com variant do capítulo
        </CtaButton>
      </div>
    </section>
  )
}
*/

// ===== COMPATIBILIDADE COM SISTEMA EXISTENTE =====

// Hook para migrar componentes gradualmente
export function useMigratedChapterTokens(
  componentType: string,
  chapterId: ChapterId,
  existingProps: Record<string, unknown>,
) {
  const newTokens = useComponentTokens(componentType, chapterId);
  const cssVars = useChapterCSSVariables(chapterId);

  // Merge com props existentes, dando prioridade aos novos tokens
  return {
    ...existingProps,
    style: {
      ...existingProps.style,
      ...cssVars,
    },
  };
}
