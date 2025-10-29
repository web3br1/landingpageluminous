// Matriz de Cards - Densidade & Hierarquia
// Define padrões visuais para cards por contexto e prioridade
// Garante consistência entre Benefits, Features, Pricing, Product

import { TOKENS_BASE, TOKENS_SURFACE, TOKENS_SPACING } from "./design-tokens";
import { SHADOWS } from "./colors";

// ===== DENSIDADES =====
export const CARD_DENSITIES = {
  compact: {
    padding: `${TOKENS_SPACING.sm}px`, // 8px
    minHeight: "120px",
    borderRadius: "rounded-lg", // 8px
    gap: `${TOKENS_SPACING.sm}px`, // 8px
  },

  regular: {
    padding: `${TOKENS_SPACING.md}px`, // 16px
    minHeight: "160px",
    borderRadius: "rounded-xl", // 12px
    gap: `${TOKENS_SPACING.md}px`, // 16px
  },

  spacious: {
    padding: `${TOKENS_SPACING.lg}px`, // 24px
    minHeight: "200px",
    borderRadius: "rounded-2xl", // 16px
    gap: `${TOKENS_SPACING.lg}px`, // 24px
  },
} as const;

// ===== HIERARQUIAS =====
export const CARD_HIERARCHIES = {
  // Primary - conversão/ação principal
  primary: {
    background: `hsl(${TOKENS_SURFACE.card.default})`,
    border: `1px solid hsl(${TOKENS_BASE.border.base})`,
    shadow: SHADOWS.md,
    hover: {
      shadow: SHADOWS.lg,
      transform: "translateY(-2px)",
    },
  },

  // Secondary - conteúdo estrutural
  secondary: {
    background: `hsl(${TOKENS_SURFACE.card.default})`,
    border: `1px solid hsl(${TOKENS_BASE.border.subtle})`,
    shadow: SHADOWS.sm,
    hover: {
      shadow: SHADOWS.md,
      transform: "translateY(-1px)",
    },
  },

  // Tertiary - informações complementares
  tertiary: {
    background: `hsl(${TOKENS_SURFACE.card.default})`,
    border: "none",
    shadow: "none",
    hover: {
      background: `hsl(${TOKENS_BASE.bg.subtle})`,
      transform: "none",
    },
  },
} as const;

// ===== MATRIZ POR CONTEXTO =====
export const CARD_MATRIX = {
  // Marketing sections
  benefits: {
    density: CARD_DENSITIES.regular,
    hierarchy: CARD_HIERARCHIES.secondary,
    grid: "md:grid-cols-2 lg:grid-cols-3",
    animation:
      "hover:transform hover:-translate-y-1 transition-transform duration-200",
  },

  features: {
    density: CARD_DENSITIES.spacious,
    hierarchy: CARD_HIERARCHIES.secondary,
    grid: "lg:grid-cols-2", // alternado zigue-zague
    animation: "hover:shadow-soft-md transition-shadow duration-200",
  },

  pricing: {
    density: CARD_DENSITIES.spacious,
    hierarchy: CARD_HIERARCHIES.primary, // mais destacado
    grid: "md:grid-cols-3",
    animation:
      "hover:transform hover:-translate-y-2 transition-all duration-300",
    special: {
      popular: {
        ring: "ring-2 ring-primary ring-offset-2",
        badge: "absolute -top-4 left-1/2 transform -translate-x-1/2",
      },
    },
  },

  // Product sections
  demo: {
    density: CARD_DENSITIES.regular,
    hierarchy: CARD_HIERARCHIES.primary,
    grid: "grid-cols-1 md:grid-cols-3",
    animation: "hover:shadow-soft-lg transition-shadow duration-300",
  },

  // Conversion sections
  trial: {
    density: CARD_DENSITIES.spacious,
    hierarchy: CARD_HIERARCHIES.primary,
    grid: "grid-cols-1",
    animation:
      "hover:transform hover:-translate-y-1 transition-transform duration-200",
  },

  signup: {
    density: CARD_DENSITIES.regular,
    hierarchy: CARD_HIERARCHIES.primary,
    grid: "grid-cols-1",
    animation: "hover:shadow-soft-md transition-shadow duration-200",
  },

  checkout: {
    density: CARD_DENSITIES.regular,
    hierarchy: CARD_HIERARCHIES.primary,
    grid: "grid-cols-1",
    special: {
      summary: {
        sticky: "sticky top-6",
        shadow: SHADOWS.lg,
      },
    },
  },

  // Utility cards
  testimonial: {
    density: CARD_DENSITIES.compact,
    hierarchy: CARD_HIERARCHIES.tertiary,
    grid: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    animation: "none", // sem hover para credibilidade
  },

  stats: {
    density: CARD_DENSITIES.compact,
    hierarchy: CARD_HIERARCHIES.tertiary,
    grid: "grid-cols-2 md:grid-cols-4",
    animation: "none",
  },
} as const;

// ===== UTILITÁRIOS =====

// Tipos TypeScript
export type CardDensity = keyof typeof CARD_DENSITIES;
export type CardHierarchy = keyof typeof CARD_HIERARCHIES;
export type CardContext = keyof typeof CARD_MATRIX;

// Função para obter configuração completa de card
export function getCardConfig(context: CardContext) {
  const config = CARD_MATRIX[context];

  return {
    ...config.density,
    ...config.hierarchy,
    grid: config.grid,
  };
}

// Função para gerar classes Tailwind
export function getCardClasses(
  context: CardContext,
  overrides: Partial<{
    density: CardDensity;
    hierarchy: CardHierarchy;
    customClasses: string;
  }> = {},
) {
  const {
    density = "regular",
    hierarchy = "secondary",
    customClasses,
  } = overrides;

  const finalDensity = CARD_DENSITIES[density];
  const finalHierarchy = CARD_HIERARCHIES[hierarchy];

  return [
    // Estrutura base
    `relative min-h-[${finalDensity.minHeight}]`,
    finalDensity.borderRadius,

    // Espaçamento
    `p-4`, // Tailwind units
    `gap-4`,

    // Visual
    `bg-[${finalHierarchy.background}]`,
    `border-[${finalHierarchy.border}]`,
    `shadow-[${finalHierarchy.shadow}]`,

    // Hover states
    "shadow" in finalHierarchy.hover
      ? `hover:shadow-[${finalHierarchy.hover.shadow}]`
      : "",
    "transform" in finalHierarchy.hover
      ? `hover:transform ${finalHierarchy.hover.transform}`
      : "",

    // Custom overrides
    customClasses,
  ]
    .filter(Boolean)
    .join(" ");
}

// Hook para usar configuração de card
export function useCardConfig(context: CardContext) {
  return {
    config: getCardConfig(context),
    classes: getCardClasses(context),
  };
}

// ===== EXEMPLO DE USO =====
/*
import { getCardConfig, CARD_MATRIX } from '@/lib/theme/card-matrix'

function BenefitsSection() {
  const cardConfig = getCardConfig('benefits')

  return (
    <div className={`grid ${cardConfig.grid} gap-6 md:gap-8`}>
      {benefits.map((benefit) => (
        <Card
          key={benefit.id}
          className={cardConfig.animation}
          style={{
            background: cardConfig.background,
            border: cardConfig.border,
            boxShadow: cardConfig.shadow,
            padding: cardConfig.padding,
            minHeight: cardConfig.minHeight,
            borderRadius: cardConfig.borderRadius ? '12px' : undefined
          }}
        >
          {benefit.content}
        </Card>
      ))}
    </div>
  )
}
*/

// ===== MIGRATION CHECKLIST =====
export const CARD_MATRIX_CHECKLIST = [
  "✅ Densidade apropriada ao contexto",
  "✅ Hierarquia visual clara",
  "✅ Espaçamento consistente (8px grid)",
  "✅ Hover states acessíveis",
  "✅ Responsividade mantida",
  "✅ Performance: transforms otimizados",
] as const;
