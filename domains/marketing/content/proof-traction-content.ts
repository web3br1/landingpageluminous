// Content Layer - Proof Traction Section Content
// Separated content from presentation - Single source of truth for proof traction content

import type {
  ProofTractionContent,
  ProofTractionVariant,
} from "../types/proof-traction.types";

export const proofTractionContentVariants: Record<
  string,
  ProofTractionContent
> = {
  default: {
    title: "Resultados comprovados",
    subtitle: "Veja os números que nossos clientes alcançaram",
    metrics: [
      {
        value: "500+",
        label: "Empresas atendidas",
        description: "De startups a Fortune 500",
      },
      {
        value: "60%",
        label: "Redução no tempo de relatórios",
        description: "De dias para horas",
      },
      {
        value: "99.9%",
        label: "Uptime garantido",
        description: "Disponibilidade enterprise",
      },
      {
        value: "4.9/5",
        label: "Satisfação dos usuários",
        description: "Baseado em 2000+ avaliações",
      },
    ],
    // achievements: [
    //   {
    //     title: "Processamento de 100TB+ de dados",
    //     description: "Arquitetura escalável para grandes volumes",
    //     icon: "Database"
    //   },
    //   {
    //     title: "Integração com 50+ sistemas",
    //     description: "Conectores nativos e APIs customizadas",
    //     icon: "Link"
    //   },
    //   {
    //     title: "99.99% SLA para clientes enterprise",
    //     description: "Garantia de disponibilidade crítica",
    //     icon: "Shield"
    //   }
    // ]
  },

  detailed: {
    title: "Crescimento impulsionado por dados",
    subtitle: "Como nossos clientes estão transformando seus negócios",
    metrics: [
      {
        value: "75%",
        label: "Aumento na produtividade",
        description: "Equipes focam em estratégia",
      },
      {
        value: "40h",
        label: "Economia mensal por usuário",
        description: "Tempo recuperado para tarefas estratégicas",
      },
      {
        value: "200%",
        label: "ROI médio em 12 meses",
        description: "Retorno sobre investimento comprovado",
      },
      {
        value: "50+",
        label: "Integrações disponíveis",
        description: "Conecte com qualquer sistema",
      },
    ],
    // achievements: [
    //   {
    //     title: "Redução de 80% em custos operacionais",
    //     description: "Automação de processos manuais",
    //     icon: "DollarSign"
    //   },
    //   {
    //     title: "Aumento de 200% na agilidade",
    //     description: "Tomada de decisão baseada em dados em tempo real",
    //     icon: "Zap"
    //   },
    //   {
    //     title: "Implementação em menos de 2 semanas",
    //     description: "Setup rápido e suporte dedicado",
    //     icon: "Rocket"
    //   }
    // ]
  },
};

export const proofTractionConfiguration = {
  variants: [
    {
      id: "default",
      name: "Default Proof Traction",
      description: "Standard metrics and achievements display",
      content: proofTractionContentVariants.default,
      weight: 70,
    },
    {
      id: "detailed",
      name: "Detailed Proof Traction",
      description: "Detailed metrics with business impact focus",
      content: proofTractionContentVariants.detailed,
      weight: 30,
    },
  ],
  defaultVariant: "default",
} as const;

export const proofTractionVariants: ProofTractionVariant[] = [
  ...proofTractionConfiguration.variants,
];

// Type exports
export type ProofTractionContentVariants = typeof proofTractionContentVariants;
export type ProofTractionContentKey = keyof ProofTractionContentVariants;
