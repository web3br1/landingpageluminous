// Content Layer - Hero Section Content
// Separated content from presentation - Single source of truth for hero content

import type { HeroContent, HeroVariant } from "../types/hero.types";

export const heroContentVariants: Record<string, HeroContent> = {
  default: {
    headline: "Seu copiloto de automação empresarial, claro e inteligente.",
    subheadline:
      "Conecte, orquestre e acelere seus fluxos — sem fricção. Nossa IA entende seu negócio e gera sistemas sob medida automaticamente.",
    primaryCta: "Começar grátis",
    secondaryCta: "Ver demo (1:10)",
    badge: "Pré-venda Fundadores",
    metrics: [
      { value: "75%", label: "menos tempo em relatórios" },
      { value: "3x", label: "mais decisões assertivas" },
      { value: "24/7", label: "suporte disponível" },
    ],
    tracking: {
      section: "hero",
    },
  },

  experiment_a: {
    headline: "Automatize seus processos empresariais com IA inteligente.",
    subheadline:
      "Da entrevista ao sistema operacional — em minutos. Transforme dados em decisões através de linguagem natural e integrações perfeitas.",
    primaryCta: "Experimentar agora",
    secondaryCta: "Ver casos de sucesso",
    badge: "Tecnologia Inovadora",
    metrics: [
      { value: "10x", label: "mais velocidade" },
      { value: "99.9%", label: "uptime garantido" },
      { value: "50+", label: "integrações nativas" },
    ],
    tracking: {
      section: "hero",
    },
  },

  experiment_b: {
    headline: "Relatórios inteligentes em tempo real para seu negócio.",
    subheadline:
      "Dashboards que se adaptam ao seu ritmo. KPIs automáticos, alertas inteligentes e insights acionáveis que fazem diferença no resultado final.",
    primaryCta: "Agendar demonstração",
    secondaryCta: "Baixar brochure",
    badge: "Business Intelligence",
    metrics: [
      { value: "40h", label: "economia mensal" },
      { value: "+25%", label: "aumento em receita" },
      { value: "5min", label: "para implementar" },
    ],
    tracking: {
      section: "hero",
    },
  },

  enterprise: {
    headline: "Soluções enterprise de business intelligence para escala.",
    subheadline:
      "Arquitetura robusta para grandes volumes. Governança de dados, compliance automático e integrações corporativas de nível enterprise.",
    primaryCta: "Falar com especialista",
    secondaryCta: "Agendar consultoria",
    badge: "Enterprise Ready",
    metrics: [
      { value: "1000+", label: "usuários simultâneos" },
      { value: "99.99%", label: "SLA garantido" },
      { value: "ISO 27001", label: "certificado" },
    ],
    tracking: {
      section: "hero",
    },
  },

  experiment_user: {
    headline: "Somente Pronto para transformar seus dados em resultados?",
    subheadline:
      "Junte-se a milhares de empresas que já descobriram o poder da inteligência artificial aplicada aos negócios.",
    primaryCta: "Começar Grátis",
    secondaryCta: "Agendar Demo",
    badge: "Trial gratuito por 14 dias • Sem cartão de crédito",
    metrics: [
      { value: "75%", label: "menos tempo em relatórios" },
      { value: "3x", label: "mais decisões assertivas" },
      { value: "24/7", label: "suporte disponível" },
    ],
    tracking: {
      section: "hero",
    },
  },
} as const;

// Hero variants configuration for A/B testing and personalization
export const heroVariants: HeroVariant[] = [
  {
    id: "default",
    name: "Default",
    description: "Versão padrão com foco em automação empresarial e IA",
    content: heroContentVariants.default,
    weight: 40,
  },
  {
    id: "experiment_a",
    name: "Experiment A - IA Focus",
    description:
      "Versão experimental enfatizando capacidades de IA e automação inteligente",
    content: heroContentVariants.experiment_a,
    weight: 30,
  },
  {
    id: "experiment_b",
    name: "Experiment B - BI Focus",
    description:
      "Versão experimental focada em business intelligence e relatórios",
    content: heroContentVariants.experiment_b,
    weight: 25,
  },
  {
    id: "enterprise",
    name: "Enterprise Version",
    description:
      "Versão enterprise para grandes organizações com necessidades específicas",
    content: heroContentVariants.enterprise,
    weight: 5,
    conditions: {
      userType: "returning", // Only show to returning enterprise users
    },
  },
  {
    id: "experiment_user",
    name: "User Provided Content",
    description:
      "Conteúdo fornecido pelo usuário - foco em transformação de dados e IA para negócios",
    content: heroContentVariants.experiment_user,
    weight: 0, // Não ativo por padrão, pode ser ativado via experimento
  },
];

// Default configuration
export const heroConfiguration = {
  variants: heroVariants,
  defaultVariant: "default",
  experimentId: "hero_headline",
} as const;

// Type exports
export type HeroContentVariants = typeof heroContentVariants;
export type HeroContentKey = keyof HeroContentVariants;
