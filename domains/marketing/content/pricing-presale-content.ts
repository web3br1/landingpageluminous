// Content Layer - Pricing Presale Section Content
// Separated content from presentation - Single source of truth for pricing presale content

import type {
  PricingPresaleContent,
  PricingPresaleVariant,
} from "../types/pricing-presale.types";

export const pricingPresaleContentVariants: Record<
  string,
  PricingPresaleContent
> = {
  founder: {
    title: "Pré-venda Fundadores",
    subtitle: "Acesso antecipado vitalício com benefícios exclusivos",
    plans: [
      {
        name: "Fundador Pro",
        headline: "Acesso Vitalício Completo",
        price: "R$ 497",
        period: "/mês",
        originalPrice: "R$ 1.497",
        description:
          "Para empreendedores que querem revolucionar seus negócios com IA",
        features: [
          "Acesso vitalício ao plano Pro",
          "Suporte prioritário 24/7",
          "Pack de presets premium por vertical",
          "Direito a influenciar o roadmap",
          "Integrações ilimitadas",
          "Dashboards personalizáveis",
          "RAG/GraphRAG avançado",
          "OCR inteligente de documentos",
          "WhatsApp Business API",
          "Relatórios automatizados",
        ],
        benefits: [
          "Economia de R$ 12.000+ nos primeiros 2 anos",
          "Setup personalizado em até 24h",
          "Acesso antecipado a novos recursos",
          "Comunidade privada de fundadores",
          "Webinars exclusivos mensais",
        ],
        ctaText: "Entrar na pré-venda",
        popular: true,
        limitedTime: true,
        guarantee: "30 dias de garantia total",,
    tracking: {
      section: "pricing-presale",
      sectionId: "pricing-presale",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }
    },
    ],
    guarantee:
      "Garantia de 30 dias. Sem perguntas, reembolso total se não ficar satisfeito.",
    urgencyText: "Apenas 50 vagas restantes no lote atual",
  },

  annual: {
    title: "Pré-venda com Desconto Anual",
    subtitle: "Economia significativa com compromisso anual",
    plans: [
      {
        name: "Plano Anual Pro",
        headline: "Acesso Completo com 60% de Desconto",
        price: "R$ 197",
        period: "/mês",
        originalPrice: "R$ 497",
        description: "Para empresas que querem maximizar o ROI com IA",
        features: [
          "Plano Pro completo por 12 meses",
          "Suporte prioritário por email",
          "Integrações avançadas",
          "Dashboards personalizáveis",
          "Relatórios automatizados",
          "OCR inteligente de documentos",
        ],
        benefits: [
          "60% de economia no primeiro ano",
          "Suporte dedicado",
          "Integrações customizadas",
          "Treinamentos incluídos",
        ],
        ctaText: "Garantir desconto anual",
        popular: true,
        limitedTime: true,
        guarantee: "30 dias de garantia total",,
    tracking: {
      section: "pricing-presale",
      sectionId: "pricing-presale",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }
    },
    ],
    guarantee:
      "Garantia de 30 dias. Sem perguntas, reembolso total se não ficar satisfeito.",
    urgencyText: "Oferta limitada aos primeiros 100 clientes",
  },
};

export const pricingPresaleConfiguration: {
  variants: PricingPresaleVariant[];
  defaultVariant: string;,
    tracking: {
      section: "pricing-presale",
      sectionId: "pricing-presale",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }
    } = {
  variants: [
    {
      id: "founder",
      name: "Founder Lifetime Access",
      description: "Lifetime access with exclusive founder benefits",
      content: pricingPresaleContentVariants.founder,
      weight: 70,
    },
    {
      id: "annual",
      name: "Annual Discount Presale",
      description: "Significant savings with annual commitment",
      content: pricingPresaleContentVariants.annual,
      weight: 30,
    },
  ],
  defaultVariant: "founder",
};

export const pricingPresaleVariants: PricingPresaleVariant[] =
  pricingPresaleConfiguration.variants;

// Type exports
export type PricingPresaleContentVariants =
  typeof pricingPresaleContentVariants;
export type PricingPresaleContentKey = keyof PricingPresaleContentVariants;
