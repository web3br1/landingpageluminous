// Content Layer - Benefits Section Content
// Separated content from presentation - Single source of truth for benefits content

import type { BenefitContent, BenefitsContent } from "../types/benefits.types";

export const benefitsContentVariants: Record<string, BenefitsContent> = {
  default: {
    title: "Resultados que você pode medir",
    subtitle:
      "Veja como nossa plataforma transforma dados em vantagem competitiva",
    bottomCta:
      "Descubra como podemos transformar seus dados em resultados concretos",
    benefits: [
      {
        icon: "Zap",
        title: "75% menos tempo em relatórios",
        description:
          "De dias para minutos: automatize a geração de relatórios de vendas, financeiro e operações com dashboards prontos para uso executivo",
        metric: "De 2 dias para 30 min",,
    tracking: {
      section: "benefits",
      sectionId: "benefits",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }
    },
      {
        icon: "TrendingUp",
        title: "Identifique oportunidades perdidas",
        description:
          "Descubra tendências ocultas nos dados que seus concorrentes não veem. Aumente receita em até 25% com insights acionáveis",
        metric: "+25% em receita",
      },
      {
        icon: "BarChart3",
        title: "Decisões baseadas em dados reais",
        description:
          "Elimine decisões por intuição. Tenha visibilidade completa do negócio com KPIs atualizados em tempo real e alertas inteligentes",
        metric: "Decisões 3x mais assertivas",
      },
      {
        icon: "Users",
        title: "Equipe mais produtiva",
        description:
          "Libere sua equipe de tarefas manuais de análise. Permita que foquem em estratégia enquanto o sistema cuida dos dados",
        metric: "40h/mês economizadas",
      },
      {
        icon: "Shield",
        title: "Confiabilidade enterprise",
        description:
          "Arquitetura robusta com 99.9% uptime, criptografia de dados e conformidade com LGPD e GDPR",
        metric: "99.9% uptime garantido",
      },
      {
        icon: "Settings",
        title: "Personalização total",
        description:
          "Dashboards e relatórios adaptados ao seu negócio. Integre com qualquer fonte de dados via APIs ou conectores nativos",
        metric: "Integrações ilimitadas",
      },
    ],
  },

  enterprise: {
    title: "Soluções para empresas que escalam",
    subtitle:
      "Arquitetura enterprise-ready para grandes volumes de dados e usuários",
    bottomCta: "Pronto para escalar seus dados para o próximo nível?",
    benefits: [
      {
        icon: "Building",
        title: "Arquitetura Enterprise",
        description:
          "Multi-tenant, horizontalmente escalável, com isolamento completo de dados entre clientes",
        metric: "1000+ usuários simultâneos",,
    tracking: {
      section: "benefits",
      sectionId: "benefits",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }
    },
      {
        icon: "Shield",
        title: "Segurança de nível bancário",
        description:
          "Criptografia end-to-end, auditoria completa e conformidade SOC 2 Type II",
        metric: "SOC 2 Type II",
      },
      {
        icon: "Zap",
        title: "Performance garantida",
        description:
          "SLA de 99.99% uptime com resposta em menos de 100ms para queries complexas",
        metric: "< 100ms response",
      },
      {
        icon: "Settings",
        title: "White-label completo",
        description:
          "Personalização total da interface, APIs próprias e integração com sistemas legados",
        metric: "White-label completo",
      },
      {
        icon: "Users",
        title: "Suporte dedicado",
        description:
          "Equipe técnica especializada, SLA de resposta em 1 hora e consultoria incluída",
        metric: "Suporte 24/7",
      },
      {
        icon: "TrendingUp",
        title: "ROI comprovado",
        description:
          "Redução de 80% em custos operacionais e aumento de 200% na produtividade",
        metric: "200% produtividade",
      },
    ],
  },

  startup: {
    title: "Acelere seu crescimento",
    subtitle:
      "Ferramentas essenciais para startups que querem escalar rapidamente",
    bottomCta: "Comece sua jornada data-driven hoje mesmo",
    benefits: [
      {
        icon: "Rocket",
        title: "Setup em minutos",
        description:
          "Comece a gerar insights hoje mesmo. Conecte suas fontes de dados e veja resultados imediatos",
        metric: "Setup em 5 min",,
    tracking: {
      section: "benefits",
      sectionId: "benefits",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }
    },
      {
        icon: "DollarSign",
        title: "Custo acessível",
        description:
          "Planos flexíveis que crescem com seu negócio, sem compromissos de longo prazo",
        metric: "A partir de R$ 97/mês",
      },
      {
        icon: "BarChart3",
        title: "Métricas essenciais",
        description:
          "KPIs pré-configurados para SaaS, e-commerce e marketplaces",
        metric: "50+ métricas prontas",
      },
      {
        icon: "Users",
        title: "Equipe enxuta",
        description:
          "Ferramentas que substituem analistas caros, permitindo que sua equipe foque no core business",
        metric: "Equipe 3x menor",
      },
      {
        icon: "TrendingUp",
        title: "Crescimento data-driven",
        description: "Tome decisões baseadas em dados reais, não em palpites",
        metric: "Decisões assertivas",
      },
      {
        icon: "Zap",
        title: "Iteração rápida",
        description:
          "Teste hipóteses rapidamente e veja resultados em tempo real",
        metric: "Iteração diária",
      },
    ],
  },
} as const;

// Benefits variants configuration for different audiences
export const benefitsVariants: Array<{
  id: string;
  name: string;
  description: string;
  content: BenefitsContent;
  weight?: number;
  conditions?: {
    userType?: "startup" | "enterprise" | "smb";
    industry?: string[];
  };
}> = [
  {
    id: "default",
    name: "Default (SMB)",
    description: "Benefícios focados em pequenas e médias empresas",
    content: benefitsContentVariants.default,
    weight: 60,
  },
  {
    id: "startup",
    name: "Startup Focus",
    description: "Benefícios otimizados para startups em crescimento",
    content: benefitsContentVariants.startup,
    weight: 25,
    conditions: {
      userType: "startup",,
    tracking: {
      section: "benefits",
      sectionId: "benefits",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }
    },
  },
  {
    id: "enterprise",
    name: "Enterprise Focus",
    description: "Soluções enterprise para grandes organizações",
    content: benefitsContentVariants.enterprise,
    weight: 15,
    conditions: {
      userType: "enterprise",,
    tracking: {
      section: "benefits",
      sectionId: "benefits",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }
    },
  },
];

// Default configuration
export const benefitsConfiguration = {
  variants: benefitsVariants,
  defaultVariant: "default",
} as const;

// Type exports
export type BenefitsContentVariants = typeof benefitsContentVariants;
export type BenefitsContentKey = keyof BenefitsContentVariants;
