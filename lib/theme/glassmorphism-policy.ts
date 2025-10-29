// Política de Glassmorphism - Do/Don't Guide
// Define quando e como usar vidro no design system
// Mantém consistência visual e performance

import { TOKENS_SURFACE } from "./design-tokens";

// ===== POLÍTICA DE USO =====

// ✅ QUANDO USAR VIDRO (restrito)
export const GLASSMORPHISM_ALLOWED_USES = {
  // Hero badges - foco pedagógico
  heroBadge: {
    reason: "Destacar elementos pedagógicos no hero sem quebrar hierarquia",
    example: "Badge '14 dias grátis' no hero",
  },

  // Pedagogical overlays - explicações contextuais
  pedagogicalOverlay: {
    reason: "Explicar funcionalidades sem interromper fluxo",
    example: "Coach marks, tooltips educacionais",
  },

  // Mockup frames - ilustrações técnicas
  mockupFrame: {
    reason: "Emular transparência de software/interface",
    example: "Frames de dashboard no demo",
  },

  // Spotlight panels - destaques temporários
  spotlightPanel: {
    reason: "Chamar atenção para conteúdo promocional",
    example: "Painel de oferta limitada",
  },
} as const;

// ❌ QUANDO NÃO USAR VIDRO
export const GLASSMORPHISM_FORBIDDEN_USES = {
  // Cards estruturais
  structuralCards: {
    reason: "Quebra hierarquia visual, reduz legibilidade",
    instead: "Use TOKENS_SURFACE.card.default (sólido)",
  },

  // Navigation elements
  navigation: {
    reason: "Interfere com acessibilidade e foco",
    instead: "Background sólido com blur opcional mínimo",
  },

  // Form elements
  forms: {
    reason: "Reduz contraste necessário para acessibilidade",
    instead: "Background sólido sempre",
  },

  // Dark mode default
  darkModeDefault: {
    reason: "Vidro escuro tem baixo contraste",
    instead: "Use TOKENS_SURFACE.card.default para dark",
  },

  // Mobile first
  mobileFirst: {
    reason: "Performance impact e legibilidade reduzida",
    instead: "Vidro apenas em desktop/tablet",
  },
} as const;

// ===== VARIANTE PERMITIDA =====
export const GLASSMORPHISM_VARIANT = {
  subtle: {
    background: TOKENS_SURFACE.card.glass.subtle,
    backdropBlur: "blur(12px)",
    border: `1px solid rgba(255, 255, 255, 0.2)`,
    boxShadow: "0 8px 32px rgba(17, 24, 39, 0.1)",

    // Dark mode
    dark: {
      background: "rgba(17, 24, 39, 0.4)",
      border: `1px solid rgba(255, 255, 255, 0.1)`,
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
    },
  },

  // medium/strong removidos - política restrita
} as const;

// ===== UTILITÁRIOS =====

// Função para verificar se uso é permitido
export function isGlassmorphismAllowed(
  useCase: keyof typeof GLASSMORPHISM_ALLOWED_USES,
): boolean {
  return useCase in GLASSMORPHISM_ALLOWED_USES;
}

// Função para obter configuração de vidro
export function getGlassmorphismConfig(
  variant: keyof typeof GLASSMORPHISM_VARIANT = "subtle",
  isDark: boolean = false,
) {
  const config = GLASSMORPHISM_VARIANT[variant];

  if (isDark && "dark" in config) {
    return config.dark;
  }

  return config;
}

// Hook para usar vidro com validação
export function useGlassmorphism(
  useCase: keyof typeof GLASSMORPHISM_ALLOWED_USES,
  variant: keyof typeof GLASSMORPHISM_VARIANT = "subtle",
) {
  const isAllowed = isGlassmorphismAllowed(useCase);

  if (!isAllowed) {
    console.warn(`Glassmorphism não permitido para: ${useCase}. Use sólido.`);
    return null;
  }

  return getGlassmorphismConfig(variant);
}

// ===== EXEMPLO DE IMPLEMENTAÇÃO =====
/*
import { useGlassmorphism, GLASSMORPHISM_ALLOWED_USES } from '@/lib/theme/glassmorphism-policy'

function HeroBadge() {
  const glassConfig = useGlassmorphism('heroBadge')

  return (
    <div
      className="rounded-lg px-3 py-1 text-sm font-medium"
      style={glassConfig || undefined} // Fallback para sólido se não permitido
    >
      14 dias grátis
    </div>
  )
}
*/

// ===== CHECKLIST DE IMPLEMENTAÇÃO =====
export const GLASSMORPHISM_CHECKLIST = [
  "✅ Uso justificado por caso permitido",
  "✅ Fallback para sólido quando não aplicável",
  "✅ Testado em dark mode (contraste AA)",
  "✅ Performance: backdrop-filter não excessivo",
  "✅ Acessibilidade: contraste mínimo mantido",
  "✅ Mobile: desabilitado em telas pequenas",
] as const;

// ===== MIGRATION GUIDE =====
// 1. Auditar componentes usando glassmorphism atual
// 2. Migrar medium/strong para subtle ou sólido
// 3. Adicionar validação com useGlassmorphism
// 4. Testar performance e acessibilidade
// 5. Documentar novos casos de uso aprovados
