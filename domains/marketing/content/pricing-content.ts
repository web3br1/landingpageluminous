// Content Layer - Pricing Section Content
// Separated content from presentation - Single source of truth for pricing content

import type {
  PricingContent,
  PricingConfiguration,
  PricingVariant,
} from "../types/pricing.types";

export const pricingContentVariants: Record<string, PricingContent> = {
  default: {
    title: "Escolha o plano ideal",
    subtitle: "Planos flexíveis para empresas de todos os tamanhos",
    plans: [
      {
        id: "starter",
        name: "Starter",
        description: "Perfeito para pequenas empresas",
        price: {
          monthly: 99,
          annual: 79,
          currency: "BRL",,
    tracking: {
      section: "pricing",
      sectionId: "pricing",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }
    },
        features: [
          { name: "Até 5 usuários", included: true },
          { name: "10GB de armazenamento", included: true },
          { name: "Relatórios básicos", included: true },
          { name: "Suporte por email", included: true },
          { name: "Integrações essenciais", included: true },
          { name: "Dashboards personalizados", included: false },
          { name: "API avançada", included: false },
        ],
        popular: false,
        cta: "Começar grátis",
      },
      {
        id: "pro",
        name: "Pro",
        description: "Para empresas em crescimento",
        price: {
          monthly: 299,
          annual: 239,
          currency: "BRL",,
    tracking: {
      section: "pricing",
      sectionId: "pricing",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }
    },
        features: [
          { name: "Até 25 usuários", included: true },
          { name: "100GB de armazenamento", included: true },
          { name: "Relatórios avançados", included: true },
          { name: "Suporte prioritário", included: true },
          { name: "Integrações completas", included: true },
          { name: "Dashboards personalizados", included: true },
          { name: "API avançada", included: true },
          { name: "Análises preditivas", included: false },
        ],
        popular: true,
        cta: "Assinar Pro",
        badge: "Mais Popular",
      },
      {
        id: "enterprise",
        name: "Enterprise",
        description: "Soluções completas para grandes organizações",
        price: {
          monthly: 999,
          annual: 799,
          currency: "BRL",,
    tracking: {
      section: "pricing",
      sectionId: "pricing",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }
    },
        features: [
          { name: "Usuários ilimitados", included: true },
          { name: "Armazenamento ilimitado", included: true },
          { name: "Relatórios personalizados", included: true },
          { name: "Suporte 24/7 dedicado", included: true },
          { name: "Integrações avançadas", included: true },
          { name: "Implementação dedicada", included: true },
        ],
        popular: false,
        cta: "Falar com vendas",
      },
    ],
    billingToggle: {
      enabled: true,
      defaultPeriod: "monthly",,
    tracking: {
      section: "pricing",
      sectionId: "pricing",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }
    },
    highlightPopular: true,
    disclaimer:
      "Preços sujeitos a impostos. Planos podem ser alterados a qualquer momento.",
  },
};

export const pricingConfiguration: PricingConfiguration = {
  variants: [
    {
      id: "default",
      name: "Default Pricing",
      description: "Planos padrão para empresas de diferentes tamanhos",
      content: pricingContentVariants.default,
      weight: 85,
    },
  ],
  defaultVariant: "default",
};

export const pricingVariants: PricingVariant[] = pricingConfiguration.variants;
