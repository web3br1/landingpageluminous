// Content Layer - How It Works Section Content
// Separated content from presentation - Single source of truth for how-it-works content

import type {
  HowItWorksContent,
  HowItWorksVariant,
} from "../types/how-it-works.types";

export const howItWorksContentVariants: Record<string, HowItWorksContent> = {
  default: {
    title: "Como Funciona",
    subtitle:
      "Em apenas 3 passos simples, transforme seus dados em decisões inteligentes",
    steps: [
      {
        step: 1,
        icon: "Upload",
        title: "Conecte seus dados",
        description:
          "Importe planilhas, conecte sistemas ou faça upload de documentos. Nossa IA entende automaticamente seus dados.",
        details: [
          "Suporte a Excel, CSV, Google Sheets",
          "Integrações com 50+ sistemas",
          "OCR inteligente para documentos",
          "Processamento automático de dados",
        ],
        order: 1,
      },
      {
        step: 2,
        icon: "MessageSquare",
        title: "Converse com seus dados",
        description:
          "Faça perguntas em linguagem natural e receba insights acionáveis instantaneamente.",
        details: [
          "IA conversacional avançada",
          "Perguntas em português natural",
          "Insights automáticos e personalizados",
          "Dashboards interativos gerados",
        ],
        order: 2,
      },
      {
        step: 3,
        icon: "BarChart3",
        title: "Tome decisões inteligentes",
        description:
          "Receba relatórios automatizados, alertas inteligentes e recomendações baseadas em dados.",
        details: [
          "Relatórios automáticos por email",
          "Dashboards personalizáveis",
          "Alertas de anomalias",
          "Recomendações de ação",
        ],
        order: 3,
      },
    ],
    ctaText: "Começar agora mesmo",
    ctaLink: "/signup",
  },

  detailed: {
    title: "Processo Completo em 4 Etapas",
    subtitle: "Da conexão à automação completa dos seus processos de análise",
    steps: [
      {
        step: 1,
        icon: "Database",
        title: "Integração de Dados",
        description:
          "Conecte todas suas fontes de dados de forma segura e automática.",
        details: [
          "Integrações nativas com ERPs",
          "APIs REST customizadas",
          "Sincronização em tempo real",
          "Backup automático de dados",
        ],
        order: 1,
      },
      {
        step: 2,
        icon: "Brain",
        title: "Processamento Inteligente",
        description:
          "Nossa IA analisa padrões, identifica tendências e gera insights únicos.",
        details: [
          "Machine Learning avançado",
          "Análise preditiva",
          "Detecção de anomalias",
          "Categorização automática",
        ],
        order: 2,
      },
      {
        step: 3,
        icon: "Users",
        title: "Colaboração em Equipe",
        description:
          "Compartilhe insights, crie dashboards colaborativos e tome decisões em conjunto.",
        details: [
          "Permissões granulares",
          "Comentários e anotações",
          "Histórico de mudanças",
          "Notificações em tempo real",
        ],
        order: 3,
      },
      {
        step: 4,
        icon: "Zap",
        title: "Automação Completa",
        description:
          "Configure regras automáticas para alertas, relatórios e ações baseadas em dados.",
        details: [
          "Automação de workflows",
          "Relatórios programados",
          "Integrações condicionais",
          "Ações automatizadas",
        ],
        order: 4,
      },
    ],
    ctaText: "Ver demonstração completa",
    ctaLink: "/demo",
  },
};

export const howItWorksConfiguration: {
  variants: HowItWorksVariant[];
  defaultVariant: string;
} = {
  variants: [
    {
      id: "default",
      name: "Simple 3-Step Process",
      description: "Clean and simple presentation of the 3 main steps",
      content: howItWorksContentVariants.default,
      weight: 70,
    },
    {
      id: "detailed",
      name: "Detailed 4-Step Process",
      description:
        "More comprehensive presentation with additional technical details",
      content: howItWorksContentVariants.detailed,
      weight: 30,
    },
  ],
  defaultVariant: "default",
};

export const howItWorksVariants: HowItWorksVariant[] =
  howItWorksConfiguration.variants;

// Type exports
export type HowItWorksContentVariants = typeof howItWorksContentVariants;
export type HowItWorksContentKey = keyof HowItWorksContentVariants;
