// Content Layer - Social Proof Section Content
// Separated content from presentation - Single source of truth for social proof content

import type {
  CompanyLogo,
  SocialProofContent,
} from "../types/social-proof.types";

// Types defined in types/social-proof.types.ts

// Metric type defined in types/social-proof.types.ts

// SocialProofContent type defined in types/social-proof.types.ts

export const socialProofContentVariants: Record<string, SocialProofContent> = {
  default: {
    title: "Empresas que confiam na Luminaris",
    subtitle:
      "Mais de 500 empresas já transformaram seus dados em vantagem competitiva",
    layout: "full",
    showRatings: true,
    logos: [
      {
        src: "/images/logos/company-1.svg",
        alt: "Empresa Parceira 1",
        href: "#",
        width: 120,
        height: 40,
      },
      {
        src: "/images/logos/company-2.svg",
        alt: "Empresa Parceira 2",
        href: "#",
        width: 120,
        height: 40,
      },
      {
        src: "/images/logos/company-3.svg",
        alt: "Empresa Parceira 3",
        href: "#",
        width: 120,
        height: 40,
      },
      {
        src: "/images/logos/company-4.svg",
        alt: "Empresa Parceira 4",
        href: "#",
        width: 120,
        height: 40,
      },
      {
        src: "/images/logos/company-5.svg",
        alt: "Empresa Parceira 5",
        href: "#",
        width: 120,
        height: 40,
      },
      {
        src: "/images/logos/company-6.svg",
        alt: "Empresa Parceira 6",
        href: "#",
        width: 120,
        height: 40,
      },
    ],
    testimonials: [
      {
        quote:
          "A Luminaris revolucionou nossa análise de dados. Conseguimos identificar oportunidades que nossos concorrentes não viam, aumentando nossa receita em 35% no primeiro trimestre.",
        author: {
          name: "Ana Carolina Santos",
          role: "Diretora de Business Intelligence",
          company: "TechCorp Brasil",
          avatar: "/images/avatars/avatar-carlos.svg",
        },
        rating: 5,
        featured: true,
      },
      {
        quote:
          "Implementamos em 2 semanas e já estamos economizando 20 horas por semana em relatórios manuais. A equipe de dados agora foca no que realmente importa: estratégia.",
        author: {
          name: "Carlos Eduardo Lima",
          role: "Head de Dados",
          company: "DataFlow Solutions",
          avatar: "/images/avatars/avatar-mariana.svg",
        },
        rating: 5,
      },
      {
        quote:
          "O suporte é excepcional. Conseguimos personalizar dashboards complexos para nossas necessidades específicas. Recomendo para qualquer empresa séria com dados.",
        author: {
          name: "Mariana Costa",
          role: "Gerente de Analytics",
          company: "RetailMax",
          avatar: "/images/avatars/avatar-carlos.svg",
        },
        rating: 5,
      },
    ],
    metrics: [
      {
        value: "500+",
        label: "Empresas Ativas",
        description: "Clientes usando nossa plataforma diariamente",
        trend: "up",
        trendValue: "+15% este mês",
      },
      {
        value: "99.9%",
        label: "Uptime Garantido",
        description: "Disponibilidade da plataforma",
        trend: "stable",
      },
      {
        value: "35%",
        label: "Aumento Médio",
        description: "De receita para nossos clientes",
        trend: "up",
        trendValue: "+8% vs. ano passado",
      },
      {
        value: "24/7",
        label: "Suporte Técnico",
        description: "Disponível sempre que precisar",
        trend: "stable",
      },
    ],
    ctaText: "Junte-se a eles",
    ctaLink: "/signup",
  },

  logosOnly: {
    layout: "logos-only",
    logos: [
      {
        src: "/images/logos/company-1.svg",
        alt: "Empresa Parceira 1",
        width: 120,
        height: 40,
      },
      {
        src: "/images/logos/company-2.svg",
        alt: "Empresa Parceira 2",
        width: 120,
        height: 40,
      },
      {
        src: "/images/logos/company-3.svg",
        alt: "Empresa Parceira 3",
        width: 120,
        height: 40,
      },
      {
        src: "/images/logos/company-4.svg",
        alt: "Empresa Parceira 4",
        width: 120,
        height: 40,
      },
      {
        src: "/images/logos/company-5.svg",
        alt: "Empresa Parceira 5",
        width: 120,
        height: 40,
      },
      {
        src: "/images/logos/company-6.svg",
        alt: "Empresa Parceira 6",
        width: 120,
        height: 40,
      },
    ],
    testimonials: [],
    metrics: [],
  },

  testimonialsOnly: {
    title: "O que nossos clientes dizem",
    layout: "testimonials-only",
    showRatings: true,
    logos: [],
    testimonials: [
      {
        quote:
          "A Luminaris revolucionou nossa análise de dados. Conseguimos identificar oportunidades que nossos concorrentes não viam, aumentando nossa receita em 35% no primeiro trimestre.",
        author: {
          name: "Ana Carolina Santos",
          role: "Diretora de Business Intelligence",
          company: "TechCorp Brasil",
          avatar: "/images/avatars/avatar-carlos.svg",
        },
        rating: 5,
        featured: true,
      },
      {
        quote:
          "Implementamos em 2 semanas e já estamos economizando 20 horas por semana em relatórios manuais. A equipe de dados agora foca no que realmente importa: estratégia.",
        author: {
          name: "Carlos Eduardo Lima",
          role: "Head de Dados",
          company: "DataFlow Solutions",
          avatar: "/images/avatars/avatar-mariana.svg",
        },
        rating: 5,
      },
      {
        quote:
          "O suporte é excepcional. Conseguimos personalizar dashboards complexos para nossas necessidades específicas. Recomendo para qualquer empresa séria com dados.",
        author: {
          name: "Mariana Costa",
          role: "Gerente de Analytics",
          company: "RetailMax",
          avatar: "/images/avatars/avatar-carlos.svg",
        },
        rating: 5,
      },
    ],
    metrics: [],
  },

  metricsOnly: {
    title: "Resultados comprovados",
    layout: "metrics-only",
    logos: [],
    testimonials: [],
    metrics: [
      {
        value: "500+",
        label: "Empresas Ativas",
        description: "Clientes usando nossa plataforma diariamente",
        trend: "up",
        trendValue: "+15% este mês",
      },
      {
        value: "99.9%",
        label: "Uptime Garantido",
        description: "Disponibilidade da plataforma",
        trend: "stable",
      },
      {
        value: "35%",
        label: "Aumento Médio",
        description: "De receita para nossos clientes",
        trend: "up",
        trendValue: "+8% vs. ano passado",
      },
      {
        value: "24/7",
        label: "Suporte Técnico",
        description: "Disponível sempre que precisar",
        trend: "stable",
      },
    ],
  },
};

// Default export for easier importing
export const defaultSocialProofContent = socialProofContentVariants.default;
export const logosOnlySocialProofContent = socialProofContentVariants.logosOnly;
export const testimonialsOnlySocialProofContent =
  socialProofContentVariants.testimonialsOnly;
export const metricsOnlySocialProofContent =
  socialProofContentVariants.metricsOnly;
