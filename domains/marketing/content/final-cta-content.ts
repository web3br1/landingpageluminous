// Content Layer - Final CTA Section Content
// Separated content from presentation - Single source of truth for final CTA content

export interface FinalCtaContent {
  headline: string;
  subheadline: string;
  primaryButton: {
    text: string;
    link: string;,
    tracking: {
      section: "final-cta",
      sectionId: "final-cta",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }
    };
  secondaryButton?: {
    text: string;
    link: string;
  };
  backgroundImage?: string;
  urgencyText?: string;
}

export const finalCtaContentVariants: Record<string, FinalCtaContent> = {
  default: {
    headline: "Pronto para transformar seus dados em resultados?",
    subheadline:
      "Junte-se a milhares de empresas que já descobriram o poder da inteligência artificial aplicada aos negócios.",
    primaryButton: {
      text: "Começar Grátis",
      link: "/signup",,
    tracking: {
      section: "final-cta",
      sectionId: "final-cta",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }
    },
    secondaryButton: {
      text: "Agendar Demo",
      link: "/demo",,
    tracking: {
      section: "final-cta",
      sectionId: "final-cta",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }
    },
    urgencyText: "Trial gratuito por 14 dias • Sem cartão de crédito",
  },

  enterprise: {
    headline: "Impulsione sua empresa com IA enterprise",
    subheadline:
      "Soluções robustas e escaláveis para grandes organizações. Suporte dedicado e conformidade total.",
    primaryButton: {
      text: "Falar com Especialista",
      link: "/enterprise-demo",,
    tracking: {
      section: "final-cta",
      sectionId: "final-cta",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }
    },
    secondaryButton: {
      text: "Ver Casos de Sucesso",
      link: "/cases",,
    tracking: {
      section: "final-cta",
      sectionId: "final-cta",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }
    },
    urgencyText: "Implementação completa em 30 dias",
  },
};

// Default export for easier importing
export const defaultFinalCtaContent = finalCtaContentVariants.default;
export const enterpriseFinalCtaContent = finalCtaContentVariants.enterprise;
