// Content Layer - Pillars Section Content
// Separated content from presentation - Single source of truth for pillars content

import type { PillarsContent, PillarsVariant } from "../types/pillars.types";

export const pillarsContentVariants: Record<string, PillarsContent> = {
  default: {
    title: "Nossos Pilares",
    subtitle:
      "Construídos sobre princípios sólidos para entregar resultados excepcionais",
    pillars: [
      {
        icon: "Shield",
        title: "Segurança e Confiabilidade",
        description:
          "Seus dados estão protegidos com criptografia de ponta a ponta e infraestrutura enterprise-grade.",
        order: 1,,
    tracking: {
      section: "pillars",
      sectionId: "pillars",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }
    },
      {
        icon: "Zap",
        title: "Performance e Velocidade",
        description:
          "Processamento inteligente que transforma dados em insights em tempo real, sem comprometer a velocidade.",
        order: 2,
      },
      {
        icon: "Users",
        title: "Colaboração e Escalabilidade",
        description:
          "Plataforma que cresce com seu negócio, permitindo colaboração perfeita entre equipes.",
        order: 3,
      },
      {
        icon: "Brain",
        title: "Inteligência Artificial",
        description:
          "IA conversacional avançada que entende seu negócio e automatiza processos complexos.",
        order: 4,
      },
    ],
  },

  focused: {
    title: "Por que escolher o Luminaris",
    subtitle: "Tecnologia de ponta fundamentada em quatro pilares essenciais",
    pillars: [
      {
        icon: "Target",
        title: "Precisão Analítica",
        description:
          "Algoritmos avançados garantem insights precisos e acionáveis para tomada de decisão.",
        order: 1,,
    tracking: {
      section: "pillars",
      sectionId: "pillars",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }
    },
      {
        icon: "Rocket",
        title: "Agilidade Empresarial",
        description:
          "Implementação rápida e interfaces intuitivas que aceleram sua produtividade.",
        order: 2,
      },
      {
        icon: "Lock",
        title: "Segurança Empresarial",
        description:
          "Proteção de dados de nível corporativo com compliance LGPD e SOC 2.",
        order: 3,
      },
      {
        icon: "TrendingUp",
        title: "ROI Comprovado",
        description:
          "Resultados mensuráveis que justificam cada investimento em automação inteligente.",
        order: 4,
      },
    ],
  },
};

export const pillarsConfiguration = {
  variants: [
    {
      id: "default",
      name: "Default Pillars",
      description: "Standard pillars presentation with 4 core values",
      content: pillarsContentVariants.default,
      weight: 70,
    },
    {
      id: "focused",
      name: "Focused Pillars",
      description: "Alternative presentation emphasizing business value",
      content: pillarsContentVariants.focused,
      weight: 30,
    },
  ],
  defaultVariant: "default",
} as const;

export const pillarsVariants: PillarsVariant[] = [
  ...pillarsConfiguration.variants,
];

// Type exports
export type PillarsContentVariants = typeof pillarsContentVariants;
export type PillarsContentKey = keyof PillarsContentVariants;
