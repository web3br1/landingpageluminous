// Design Tokens Semânticos - Single Source of Truth
// Este arquivo define tokens semânticos organizados por intenção e uso
// Substitui a abordagem de cores puras por significados contextuais

import { COLORS, GRADIENTS, SHADOWS } from "./colors";

// ===== TOKENS DE BASE (HSL) =====
export const TOKENS_BASE = {
  // Backgrounds
  bg: {
    base: COLORS.neutral[50], // fundo principal
    subtle: COLORS.neutral[100], // fundo secundário
    surface: "0 0% 100%", // superfície de cards
    inverse: COLORS.neutral[900], // fundo invertido
  },

  // Borders
  border: {
    base: COLORS.neutral[200], // borda padrão
    subtle: COLORS.neutral[300], // borda sutil
    strong: COLORS.neutral[400], // borda forte
  },

  // Text
  text: {
    primary: COLORS.neutral[900], // texto principal
    secondary: COLORS.neutral[600], // texto secundário
    inverse: "0 0% 100%", // texto em fundo escuro
  },
} as const;

// ===== TOKENS DE MARCA =====
export const TOKENS_BRAND = {
  primary: COLORS.primary[500], // violeta confiável (CTA, links)
  secondary: COLORS.secondary[500], // ciano suave para destaques
  accent: COLORS.accent[500], // rosa/soft gold para promoções
} as const;

// ===== TOKENS DE INTENÇÃO =====
export const TOKENS_INTENT = {
  cta: TOKENS_BRAND.primary, // call-to-action principal
  info: COLORS.info.DEFAULT, // informações neutras
  success: COLORS.success.DEFAULT, // estados positivos
  warning: COLORS.warning.DEFAULT, // alertas de atenção
  error: COLORS.destructive.DEFAULT, // estados de erro
} as const;

// ===== TOKENS DE SUPERFÍCIE =====
export const TOKENS_SURFACE = {
  card: {
    default: TOKENS_BASE.bg.surface, // card sólido padrão
    elevated: TOKENS_BASE.bg.surface, // card com sombra
    glass: {
      subtle: "rgba(255, 255, 255, 0.7)", // vidro sutil (apenas quando necessário)
      // medium/strong removidos - política restrita
    },
  },

  overlay: {
    modal: "rgba(17, 24, 39, 0.6)", // overlay para modais
    tooltip: "rgba(17, 24, 39, 0.9)", // fundo de tooltips
  },
} as const;

// ===== TOKENS DE CAPÍTULOS (STORYTELLING) =====
export const TOKENS_CHAPTER = {
  // Matiz varia sutilmente por capítulo - apenas para halos/orbes
  hero: { hue: 280 }, // lavanda suave
  howItWorks: { hue: 200 }, // ciano-lavanda
  useCases: { hue: 190 }, // ciano
  features: { hue: 180 }, // teal
  pricing: { hue: 40 }, // ouro-pastel
} as const;

// ===== TOKENS DE MOTION =====
export const TOKENS_MOTION = {
  // Timing (ms)
  enter: 250, // entrada de elementos
  exit: 200, // saída de elementos
  stagger: 100, // delay entre elementos em lista

  // Easing (cubic-bezier)
  standard: [0.2, 0.8, 0.2, 1], // padrão para UI
  entrance: [0.2, 0, 0.2, 1], // entrada suave
  emphasis: [0.68, -0.55, 0.265, 1.55], // bounce para atenção

  // Distâncias (px)
  lift: 4, // elevação sutil no hover
  offset: 12, // deslocamento de entrada
} as const;

// ===== TOKENS DE SPACING =====
export const TOKENS_SPACING = {
  // Grid base (8px)
  xs: 4, // 0.5rem
  sm: 8, // 1rem
  md: 16, // 2rem
  lg: 24, // 3rem
  xl: 32, // 4rem
  xxl: 48, // 6rem

  // Section padding (responsive)
  section: {
    y: { mobile: 48, desktop: 96 }, // py-12 md:py-24
  },

  // Container max-widths
  container: {
    sm: 768, // max-w-4xl
    md: 896, // max-w-5xl
    lg: 1024, // max-w-6xl
    xl: 1280, // max-w-7xl
  },
} as const;

// ===== TOKENS DE TYPOGRAPHY =====
export const TOKENS_TYPOGRAPHY = {
  // Font families
  fontFamily: {
    display: ["Inter Tight", "system-ui", "sans-serif"],
    body: ["Inter", "system-ui", "sans-serif"],
  },

  // Font sizes (responsive clamp)
  fontSize: {
    xs: "clamp(0.75rem, 2vw, 0.875rem)", // 12px → 14px
    sm: "clamp(0.875rem, 2vw, 1rem)", // 14px → 16px
    base: "clamp(1rem, 2vw, 1.125rem)", // 16px → 18px
    lg: "clamp(1.125rem, 3vw, 1.25rem)", // 18px → 20px
    xl: "clamp(1.25rem, 4vw, 1.5rem)", // 20px → 24px
    "2xl": "clamp(1.5rem, 5vw, 2rem)", // 24px → 32px
    "3xl": "clamp(2rem, 6vw, 2.5rem)", // 32px → 40px
    "4xl": "clamp(2.5rem, 8vw, 3rem)", // 40px → 48px
    "5xl": "clamp(3rem, 10vw, 3.5rem)", // 48px → 56px
    "6xl": "clamp(3.5rem, 12vw, 4rem)", // 56px → 64px
  },

  // Line heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.625,
  },

  // Font weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
} as const;

// ===== MAPA LIGHT/DARK THEME =====
export const THEME_MAP = {
  light: {
    bg: {
      base: TOKENS_BASE.bg.base,
      subtle: TOKENS_BASE.bg.subtle,
      surface: TOKENS_BASE.bg.surface,
      inverse: TOKENS_BASE.bg.inverse,
    },
    text: {
      primary: TOKENS_BASE.text.primary,
      secondary: TOKENS_BASE.text.secondary,
      inverse: TOKENS_BASE.text.inverse,
    },
    border: {
      base: TOKENS_BASE.border.base,
      subtle: TOKENS_BASE.border.subtle,
      strong: TOKENS_BASE.border.strong,
    },
    brand: TOKENS_BRAND,
    intent: TOKENS_INTENT,
    surface: TOKENS_SURFACE,
  },

  dark: {
    bg: {
      base: COLORS.neutral[900], // fundo escuro principal
      subtle: COLORS.neutral[800], // fundo escuro secundário
      surface: COLORS.neutral[800], // superfície escura
      inverse: "0 0% 100%", // texto claro
    },
    text: {
      primary: "0 0% 100%", // texto claro principal
      secondary: COLORS.neutral[300], // texto claro secundário
      inverse: COLORS.neutral[900], // texto escuro em superfície clara
    },
    border: {
      base: COLORS.neutral[700], // borda escura
      subtle: COLORS.neutral[600], // borda escura sutil
      strong: COLORS.neutral[500], // borda escura forte
    },
    brand: {
      primary: COLORS.primary[400], // violeta mais claro para dark
      secondary: COLORS.secondary[400], // ciano mais claro para dark
      accent: COLORS.accent[400], // rosa mais claro para dark
    },
    intent: {
      cta: COLORS.primary[400], // CTA mais claro em dark
      info: COLORS.info.DEFAULT, // mantém igual
      success: COLORS.success.DEFAULT, // mantém igual
      warning: COLORS.warning.DEFAULT, // mantém igual
      error: COLORS.destructive.DEFAULT, // mantém igual
    },
    surface: {
      card: {
        default: COLORS.neutral[800], // card escuro sólido
        elevated: COLORS.neutral[800], // card escuro elevado
        glass: {
          subtle: "rgba(17, 24, 39, 0.4)", // vidro escuro sutil
        },
      },
      overlay: {
        modal: "rgba(0, 0, 0, 0.6)", // overlay escuro
        tooltip: "rgba(0, 0, 0, 0.9)", // tooltip escuro
      },
    },
  },
} as const;

// ===== UTILITIES =====
export type ThemeMode = keyof typeof THEME_MAP;
export type ChapterKey = keyof typeof TOKENS_CHAPTER;
export type IntentKey = keyof typeof TOKENS_INTENT;
export type SurfaceKey = keyof typeof TOKENS_SURFACE.card;

// Função helper para obter tokens por tema
export function getThemeTokens(mode: ThemeMode) {
  return THEME_MAP[mode];
}

// Função helper para obter cor de capítulo
export function getChapterHue(chapter: ChapterKey): number {
  return TOKENS_CHAPTER[chapter].hue;
}

// Função helper para criar HSL string
export function hsl(hslString: string): string {
  return `hsl(${hslString})`;
}

// Função helper para criar HSLA string
export function hsla(hslString: string, alpha: number): string {
  return `hsla(${hslString}, ${alpha})`;
}
