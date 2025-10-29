// Content Layer - Features Section Content
// Separated content from presentation - Single source of truth for features content

import type {
  FeaturesContent,
  FeaturesConfiguration,
  FeaturesVariant,
} from "../types/features.types";

export const featuresContentVariants: Record<string, FeaturesContent> = {
  default: {
    title: "Funcionalidades que impulsionam resultados",
    subtitle:
      "Tecnologia de ponta para transformar dados em decisões inteligentes",
    layout: "zigzag",
    features: [
      {
        icon: "Database",
        title: "Integração Universal de Dados",
        description:
          "Conecte qualquer fonte de dados: ERPs, CRMs, planilhas, APIs e bancos de dados. Suporte nativo para mais de 50 sistemas empresariais.",
        highlight: "50+ integrações",,
    tracking: {
      section: "features",
      sectionId: "features",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }
    },
      {
        icon: "Zap",
        title: "Processamento em Tempo Real",
        description:
          "Atualizações instantâneas e dashboards dinâmicos. Monitore KPIs em tempo real com alertas inteligentes e notificações automáticas.",
        highlight: "Tempo real",
      },
      {
        icon: "Brain",
        title: "IA Conversacional",
        description:
          "Pergunte aos seus dados em linguagem natural. Receba insights acionáveis, previsões e recomendações baseadas em IA avançada.",
        highlight: "IA integrada",
      },
      {
        icon: "Shield",
        title: "Segurança Empresarial",
        description:
          "Criptografia de ponta a ponta, controle de acesso granular e conformidade com LGPD, GDPR e outras regulamentações.",
        highlight: "Conformidade total",
      },
      {
        icon: "BarChart3",
        title: "Relatórios Avançados",
        description:
          "Visualizações interativas, exportação em múltiplos formatos e agendamento automático de relatórios personalizados.",
        highlight: "Relatórios smart",
      },
      {
        icon: "Users",
        title: "Colaboração em Equipe",
        description:
          "Compartilhe dashboards, comente insights e colabore com sua equipe. Notificações e menções para manter todos alinhados.",
        highlight: "Colaborativo",
      },
    ],
  },

  enterprise: {
    title: "Soluções Enterprise Completas",
    subtitle: "Arquitetura robusta para grandes organizações e dados críticos",
    layout: "grid",
    features: [
      {
        icon: "Database",
        title: "Integração Universal de Dados",
        description:
          "Conecte qualquer fonte de dados: ERPs, CRMs, planilhas, APIs e bancos de dados. Suporte nativo para mais de 50 sistemas empresariais.",
        highlight: "50+ integrações",,
    tracking: {
      section: "features",
      sectionId: "features",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }
    },
      {
        icon: "Globe",
        title: "Multi-Tenant Seguro",
        description:
          "Isolamento completo entre tenants com segurança garantida. Personalização por organização mantendo consistência.",
        highlight: "Multi-tenant",
      },
      {
        icon: "Zap",
        title: "Performance Garantida",
        description:
          "SLA de 99.9% uptime com resposta sub-segundo. Otimização automática de queries e cache inteligente.",
        highlight: "99.9% uptime",
      },
      {
        icon: "Code",
        title: "APIs e Integrações",
        description:
          "APIs RESTful completas, webhooks, SDKs e conectores personalizados. Integre com qualquer sistema existente.",
        highlight: "APIs completas",
      },
      {
        icon: "Settings",
        title: "Automação Avançada",
        description:
          "Workflows automatizados, alertas inteligentes e ações baseadas em regras. Reduza intervenção manual em 80%.",
        highlight: "80% automação",
      },
    ],
  },
};

export const featuresConfiguration: FeaturesConfiguration = {
  variants: [
    {
      id: "default",
      name: "Default Features",
      description: "Funcionalidades completas para empresas de todos os portes",
      content: featuresContentVariants.default,
      weight: 80,
    },
    {
      id: "enterprise",
      name: "Enterprise Features",
      description: "Funcionalidades avançadas para grandes organizações",
      content: featuresContentVariants.enterprise,
      weight: 20,
      conditions: {
        userType: "enterprise",,
    tracking: {
      section: "features",
      sectionId: "features",
      eventCategory: "landing_page",
      eventAction: "section_interaction",
    }
    },
    },
  ],
  defaultVariant: "default",
};

export const featuresVariants: FeaturesVariant[] =
  featuresConfiguration.variants;
