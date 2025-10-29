// Content Layer - Verticals Section Content
// Separated content from presentation - Single source of truth for verticals content

import type {
  VerticalsContent,
  VerticalsVariant,
} from "../types/verticals.types";

export const verticalsContentVariants: Record<string, VerticalsContent> = {
  default: {
    title: "Para Todos os Setores",
    subtitle: "Soluções especializadas para diferentes segmentos de mercado",
    verticals: [
      {
        id: "ecommerce",
        name: "E-commerce",
        icon: "ShoppingCart",
        description:
          "Otimize vendas, estoque e análise de comportamento do cliente",
        features: [
          "Análise de funil de vendas",
          "Previsão de demanda",
          "Segmentação de clientes",
          "Relatórios de performance",
        ],
        useCase: "Aumente conversões em 40% com insights automáticos",
        order: 1,
      },
      {
        id: "finance",
        name: "Financeiro",
        icon: "TrendingUp",
        description:
          "Controle financeiro inteligente com previsões e alertas automáticos",
        features: [
          "Previsão de fluxo de caixa",
          "Análise de risco",
          "Relatórios regulatórios",
          "Alertas de anomalias",
        ],
        useCase: "Reduza riscos em 60% com análise preditiva",
        order: 2,
      },
      {
        id: "healthcare",
        name: "Saúde",
        icon: "Heart",
        description: "Gestão de dados médicos e análise de resultados clínicos",
        features: [
          "Análise de resultados",
          "Gestão de pacientes",
          "Relatórios médicos",
          "Conformidade HIPAA/GDPR",
        ],
        useCase: "Melhore diagnósticos com análise de dados",
        order: 3,
      },
      {
        id: "manufacturing",
        name: "Manufatura",
        icon: "Cog",
        description:
          "Otimização de produção e controle de qualidade automatizado",
        features: [
          "Controle de qualidade",
          "Previsão de manutenção",
          "Otimização de produção",
          "Análise de eficiência",
        ],
        useCase: "Reduza downtime em 50% com manutenção preditiva",
        order: 4,
      },
      {
        id: "retail",
        name: "Varejo",
        icon: "Store",
        description:
          "Análise de vendas por loja, sazonalidade e comportamento do consumidor",
        features: [
          "Análise por loja",
          "Previsão de vendas",
          "Gestão de inventário",
          "Análise de sazonalidade",
        ],
        useCase: "Otimize estoques e aumente margem em 25%",
        order: 5,
      },
      {
        id: "education",
        name: "Educação",
        icon: "GraduationCap",
        description: "Análise de performance acadêmica e gestão institucional",
        features: [
          "Análise de performance",
          "Previsão de evasão",
          "Gestão de matrículas",
          "Relatórios educacionais",
        ],
        useCase: "Melhore retenção estudantil em 35%",
        order: 6,
      },
    ],
    ctaText: "Ver todas as soluções",
    ctaLink: "/solucoes",
  },

  focused: {
    title: "Soluções por Setor",
    subtitle: "Adaptadas especificamente para as necessidades do seu mercado",
    verticals: [
      {
        id: "enterprise",
        name: "Empresas",
        icon: "Building2",
        description:
          "Soluções enterprise com integração avançada e suporte dedicado",
        features: [
          "Integração enterprise",
          "Suporte 24/7",
          "SLA garantido",
          "Customizações avançadas",
        ],
        useCase: "Reduza custos operacionais em 40%",
        order: 1,
      },
      {
        id: "smb",
        name: "Pequenas Empresas",
        icon: "Briefcase",
        description:
          "Soluções acessíveis para pequenas empresas em crescimento",
        features: [
          "Setup rápido",
          "Preços acessíveis",
          "Interface intuitiva",
          "Suporte por chat",
        ],
        useCase: "Cresça 3x mais rápido com dados inteligentes",
        order: 2,
      },
    ],
    ctaText: "Encontrar minha solução",
    ctaLink: "/personalizar",
  },
};

export const verticalsConfiguration: {
  variants: VerticalsVariant[];
  defaultVariant: string;
} = {
  variants: [
    {
      id: "default",
      name: "Comprehensive Verticals",
      description: "Complete showcase of all industry verticals",
      content: verticalsContentVariants.default,
      weight: 80,
    },
    {
      id: "focused",
      name: "Focused Verticals",
      description: "Simplified presentation focusing on enterprise vs SMB",
      content: verticalsContentVariants.focused,
      weight: 20,
    },
  ],
  defaultVariant: "default",
};

export const verticalsVariants: VerticalsVariant[] =
  verticalsConfiguration.variants;

// Type exports
export type VerticalsContentVariants = typeof verticalsContentVariants;
export type VerticalsContentKey = keyof VerticalsContentVariants;
