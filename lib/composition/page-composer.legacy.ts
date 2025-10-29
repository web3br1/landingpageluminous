// Composition System - Page Composer
// Orchestrates page composition from declarative configuration

import { validatePageComposition } from "./composer-validation";
// Import index to ensure validators are initialized
import "./index";
import { flags } from "@/lib/flags";
import { logger } from "@/lib/logger";
import { readLocalStorageJSON } from "@/lib/utils/browser-storage";
// Static namespace import to avoid SSR/bundling issues from dynamic require
import * as marketing from "../../domains/marketing";

/**
 * @deprecated Legacy composer. New flow uses headers → PageConfig (Zod) → adapter → composer.
 * Keep for backward compatibility until all routes migrate to app/[slug]/page.tsx.
 */
// Types for section composition
export interface SectionConfig {
  id: string;
  component: string;
  content: any;
  order: number;
  enabled?: boolean;
  conditions?: {
    breakpoint?: "mobile" | "tablet" | "desktop";
    experiment?: string;
    userType?: "new" | "returning" | "enterprise";
  };
}

export interface PageComposition {
  sections: SectionConfig[];
  metadata: {
    title: string;
    description: string;
    keywords: readonly string[];
    ogImage?: string;
  };
  experiments: Array<{
    id: string;
    variant: string;
    sections: string[];
  }>;
  analytics: {
    pageType: string;
    conversionGoals: readonly string[];
  };
}

// Page configurations
const pageConfigs = {
  landing: {
    sections: [
      {
        id: "hero",
        component: "Hero",
        content: null, // Will be composed dynamically
        order: 1,
      },
      {
        id: "benefits",
        component: "Benefits",
        content: null,
        order: 2,
      },
      {
        id: "features",
        component: "Features",
        content: null,
        order: 3,
      },
      {
        id: "pricing",
        component: "Pricing",
        content: null,
        order: 4,
      },
    ],
    metadata: {
      title: "Luminaris - Business Intelligence com IA",
      description:
        "Automatize seus relatórios empresariais com IA inteligente. Dashboards automáticos, insights acionáveis e integrações perfeitas.",
      keywords: [
        "business intelligence",
        "automação",
        "relatórios",
        "dashboards",
        "IA",
      ],
    },
    analytics: {
      pageType: "landing",
      conversionGoals: ["cta_click", "signup_start", "demo_request"],
    },
  },

  features: {
    sections: [
      {
        id: "hero",
        component: "Hero",
        content: null,
        order: 1,
      },
      {
        id: "features",
        component: "Features",
        content: null,
        order: 2,
      },
    ],
    metadata: {
      title: "Funcionalidades | Luminaris",
      description:
        "Explore todas as funcionalidades do Luminaris: IA conversacional, dashboards inteligentes e integrações automáticas.",
      keywords: [
        "funcionalidades",
        "features",
        "IA",
        "dashboards",
        "integrações",
      ],
    },
    analytics: {
      pageType: "features",
      conversionGoals: ["feature_view", "demo_request"],
    },
  },

  pricing: {
    sections: [
      {
        id: "hero",
        component: "Hero",
        content: null,
        order: 1,
      },
      {
        id: "pricing",
        component: "Pricing",
        content: null,
        order: 2,
      },
    ],
    metadata: {
      title: "Preços e Planos | Luminaris",
      description:
        "Compare planos e calcule o ROI do Luminaris. Planos acessíveis com garantia de 30 dias.",
      keywords: ["preços", "planos", "ROI", "assinatura", "custo benefício"],
    },
    analytics: {
      pageType: "pricing",
      conversionGoals: ["pricing_view", "plan_selected", "checkout_start"],
    },
  },

  demo: {
    sections: [
      {
        id: "hero",
        component: "Hero",
        content: null,
        order: 1,
      },
      {
        id: "demo",
        component: "Demo",
        content: null,
        order: 2,
      },
    ],
    metadata: {
      title: "Demonstração Interativa | Luminaris",
      description:
        "Veja o Luminaris em ação. Experimente uma demonstração interativa do sistema de IA.",
      keywords: ["demo", "demonstração", "teste grátis", "experimentar"],
    },
    analytics: {
      pageType: "demo",
      conversionGoals: ["demo_start", "demo_complete", "signup_start"],
    },
  },

  signup: {
    sections: [
      {
        id: "hero",
        component: "Hero",
        content: null,
        order: 1,
      },
      {
        id: "signup",
        component: "SignupForm",
        content: null,
        order: 2,
      },
    ],
    metadata: {
      title: "Criar Conta | Luminaris",
      description:
        "Complete seu cadastro e tenha acesso completo à plataforma.",
      keywords: ["cadastro", "conta", "signup", "registro", "acesso"],
    },
    analytics: {
      pageType: "signup",
      conversionGoals: ["signup_start", "signup_complete", "payment_start"],
    },
  },

  trial: {
    sections: [
      {
        id: "hero",
        component: "Hero",
        content: null,
        order: 1,
      },
      {
        id: "trial",
        component: "TrialForm",
        content: null,
        order: 2,
      },
    ],
    metadata: {
      title: "Teste Gratuito | Luminaris",
      description:
        "Comece seu teste gratuito de 14 dias. Sem cartão de crédito necessário.",
      keywords: ["teste gratuito", "trial", "14 dias", "gratuito"],
    },
    analytics: {
      pageType: "trial",
      conversionGoals: ["trial_start", "trial_complete", "upgrade_start"],
    },
  },

  checkout: {
    sections: [
      {
        id: "checkout",
        component: "CheckoutForm",
        content: null, // Will be composed dynamically
        order: 1,
      },
    ],
    metadata: {
      title: "Finalizar Compra | Luminaris",
      description: "Complete sua compra de forma segura e rápida.",
      keywords: ["checkout", "pagamento", "compra", "segurança"],
    },
    analytics: {
      pageType: "checkout",
      conversionGoals: ["checkout_start", "payment_success", "payment_failed"],
    },
  },
} as const;

// Input validation utilities
function validatePageType(
  pageType: string,
): asserts pageType is keyof typeof pageConfigs {
  if (!pageType || typeof pageType !== "string") {
    throw new Error(
      `Invalid pageType: must be a non-empty string, got ${typeof pageType}`,
    );
  }

  if (pageType.length > 50) {
    throw new Error(
      `Invalid pageType: too long (max 50 chars), got ${pageType.length}`,
    );
  }

  if (!Object.keys(pageConfigs).includes(pageType)) {
    throw new Error(
      `Invalid pageType: "${pageType}" not found in available pages: ${Object.keys(pageConfigs).join(", ")}`,
    );
  }
}

function validateSectionIdInput(
  sectionId: string,
): asserts sectionId is SectionId {
  if (!sectionId || typeof sectionId !== "string") {
    throw new Error(
      `Invalid sectionId: must be a non-empty string, got ${typeof sectionId}`,
    );
  }

  if (sectionId.length > 50) {
    throw new Error(
      `Invalid sectionId: too long (max 50 chars), got ${sectionId.length}`,
    );
  }

  assertSectionId(sectionId); // Reuse existing validation
}

// Main page composer function - Async for SSR compatibility
export async function composePage(
  pageType: keyof typeof pageConfigs,
): Promise<PageComposition> {
  // Runtime validation for additional safety
  validatePageType(pageType);

  try {
    const config = pageConfigs[pageType];

    // Compose sections with dynamic content (async)
    const composedSections = await Promise.all(
      config.sections.map(async (section) => ({
        ...section,
        content: await composeSectionContent(section.id, pageType),
      })),
    );

    // Collect active experiments
    const experiments = collectExperiments(composedSections);

    const composition = {
      sections: composedSections,
      metadata: config.metadata,
      experiments,
      analytics: config.analytics,
    };

    // Validate composition consistency
    const validation = validatePageComposition(composition);
    if (!validation.success) {
      logger.error("Page composition validation failed", {
        pageType,
        error: validation.error,
      });
      // In production, log warning and return fallback composition
      logger.warn("Using fallback composition due to validation errors", {
        pageType,
      });
      return await createFallbackComposition(pageType, validation.error);
    }

    return composition;
  } catch (error) {
    logger.error("Failed to compose page, using fallback", { pageType, error });
    return await createFallbackComposition(pageType, error as unknown);
  }
}

// Async page composer for client-side dynamic content
export async function composePageAsync(
  pageType: keyof typeof pageConfigs,
): Promise<PageComposition> {
  validatePageType(pageType);

  try {
    const config = pageConfigs[pageType];

    // Compose sections with dynamic content (async)
    const composedSections = await Promise.all(
      config.sections.map(async (section) => ({
        ...section,
        content: await composeSectionContentAsync(section.id, pageType),
      })),
    );

    // Collect active experiments
    const experiments: Array<{
      id: string;
      variant: string;
      sections: string[];
    }> = [];

    const composition = {
      sections: composedSections,
      metadata: config.metadata,
      experiments,
      analytics: config.analytics,
    };

    // Validate composition consistency
    const validation = validatePageComposition(composition);
    if (!validation.success) {
      logger.error("Page composition validation failed", {
        pageType,
        error: validation.error,
      });
      throw new Error(
        `Composition validation failed: ${JSON.stringify(validation.error)}`,
      );
    }

    return composition;
  } catch (error) {
    logger.error("Failed to compose page (async)", { pageType, error });
    return createFallbackCompositionSync(pageType, error as unknown);
  }
}

// Synchronous page composer for static generation compatibility
export function composePageSync(
  pageType: keyof typeof pageConfigs,
): PageComposition {
  validatePageType(pageType);

  try {
    const config = pageConfigs[pageType];

    // Compose sections with static fallback content (sync)
    const composedSections = config.sections.map((section) => ({
      ...section,
      content: composeSectionContentSync(section.id as any, pageType),
    }));

    // Collect active experiments (simplified for static generation)
    const experiments: Array<{
      id: string;
      variant: string;
      sections: string[];
    }> = [];

    const composition = {
      sections: composedSections,
      metadata: config.metadata,
      experiments,
      analytics: config.analytics,
    };

    // Validate composition consistency
    const validation = validatePageComposition(composition);
    if (!validation.success) {
      logger.error("Page composition validation failed (sync)", {
        pageType,
        error: validation.error,
      });
      // In production, log warning and return fallback composition
      logger.warn(
        "Using fallback composition due to validation errors (sync)",
        { pageType },
      );
      return createFallbackCompositionSync(pageType, validation.error);
    }

    // Dev-only deep serializability check
    if (process.env.NODE_ENV !== "production") {
      try {
        JSON.stringify(composition);
      } catch (e) {
        logger.error("Composition not serializable", { pageType, error: e });
        throw e;
      }
    }

    return composition;
  } catch (error) {
    logger.error("Failed to compose page (sync), using fallback", {
      pageType,
      error,
    });
    return createFallbackCompositionSync(pageType, error as unknown);
  }
}

// Fallback content for failed composition
function getFallbackContent(sectionId: string): any {
  logger.warn("Using fallback content for section", { sectionId });

  const fallbacks: Record<string, any> = {
    hero: {
      content: {
        headline: "Sistema de Automação Empresarial",
        subheadline: "Transforme dados em decisões inteligentes",
        primaryCta: "Começar Agora",
        secondaryCta: "Ver Demo",
      },
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content for hero section",
      },
    },
    benefits: {
      content: {
        title: "Benefícios comprovados",
        subtitle: "Resultados que você pode medir",
        benefits: [
          {
            icon: "Zap",
            title: "75% mais rápido",
            description: "Automatize processos manuais",
            metric: "75% economia",
          },
        ],
      },
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content for benefits section",
      },
    },
    features: {
      content: {
        title: "Funcionalidades avançadas",
        subtitle: "Tecnologia de ponta",
        features: [],
      },
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content for features section",
      },
    },
    pricing: {
      content: {
        title: "Planos flexíveis",
        subtitle: "Escolha o melhor para seu negócio",
        tiers: [],
      },
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content for pricing section",
      },
    },
    "social-proof": {
      content: null,
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content for social proof section",
      },
    },
    pillars: {
      content: null,
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content for pillars section",
      },
    },
    "how-it-works": {
      content: null,
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content for how-it-works section",
      },
    },
    verticals: {
      content: null,
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content for verticals section",
      },
    },
    "proof-traction": {
      content: {
        title: "Resultado Comprovado",
        subtitle: "Veja o que nossos clientes conquistaram",
        metrics: [
          {
            value: "10.000+",
            label: "Empresas Ativas",
            icon: "Building",
            trend: "up",
          },
          {
            value: "99.9%",
            label: "Uptime SLA",
            icon: "Shield",
            trend: "neutral",
          },
          { value: "75%", label: "Redução de Tempo", icon: "Zap", trend: "up" },
          { value: "4.9/5", label: "Satisfação", icon: "Star", trend: "up" },
        ],
        testimonials: [
          {
            quote:
              "Reduzimos nosso tempo de análise de 3 dias para 30 minutos. Impressionante!",
            author: "Maria Silva",
            role: "Diretora de Operações",
            company: "TechCorp Brasil",
            rating: 5,
          },
        ],
        logos: ["Google", "Microsoft", "Amazon", "Meta", "Spotify"],
      },
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content for proof-traction section",
      },
    },
    demo: {
      content: {
        title: "Veja o Luminaris em Ação",
        subtitle:
          "Uma demonstração completa das funcionalidades que revolucionarão seu negócio",
        description:
          "Assista a uma demonstração completa de 3 minutos mostrando como importar dados, criar dashboards personalizados e gerar relatórios automáticos que impressionam stakeholders.",
        demoType: "hybrid",
        primaryVideo: {
          src: "/videos/demo-luminaris.mp4",
          poster: "/images/demo-poster.jpg",
          title: "Demonstração Completa da Luminaris",
          duration: "3:24",
          format: "mp4",
        },
        features: {
          title: "O que você verá na demo:",
          items: [
            "IA Conversacional Avançada",
            "Dashboards Interativos",
            "Integrações Automáticas",
            "Relatórios Inteligentes",
          ],
        },
        cta: {
          primary: {
            text: "Agendar Demonstração Personalizada",
            link: "/demo/agendar",
          },
          secondary: {
            text: "Ver Demo Rápida",
            link: "#demo-video",
          },
        },
      },
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content for demo section",
      },
    },
    "pricing-presale": {
      content: {
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
            guarantee: "30 dias de garantia total",
          },
        ],
        guarantee:
          "Garantia de 30 dias. Sem perguntas, reembolso total se não ficar satisfeito.",
        urgencyText: "Apenas 50 vagas restantes no lote atual",
      },
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content for pricing-presale section",
      },
    },
    "lead-form": {
      content: {
        title: "Pronto para Transformar seus Dados?",
        subtitle: "Comece seu teste gratuito hoje mesmo",
        fields: [
          {
            name: "name",
            type: "text",
            label: "Nome completo",
            placeholder: "Seu nome completo",
            required: true,
          },
          {
            name: "email",
            type: "email",
            label: "Email profissional",
            placeholder: "seu@email.com",
            required: true,
          },
          {
            name: "company",
            type: "text",
            label: "Empresa",
            placeholder: "Nome da empresa",
            required: true,
          },
          {
            name: "phone",
            type: "tel",
            label: "Telefone",
            placeholder: "(11) 99999-9999",
            required: false,
          },
        ],
        submitText: "Começar Teste Gratuito",
        privacyText:
          "Ao enviar, você concorda com nossa Política de Privacidade.",
        successMessage: "Obrigado! Entraremos em contato em até 24 horas.",
      },
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content for lead-form section",
      },
    },
    faq: {
      content: {
        title: "Perguntas Frequentes",
        subtitle: "Tudo que você precisa saber sobre o Luminaris",
        items: [
          {
            question: "Como funciona o período de teste?",
            answer:
              "Oferecemos 14 dias de teste gratuito sem necessidade de cartão de crédito. Você terá acesso completo a todas as funcionalidades durante esse período.",
            category: "trial",
          },
          {
            question: "Quais integrações estão disponíveis?",
            answer:
              "Suportamos mais de 50 integrações nativas incluindo Google Sheets, Salesforce, HubSpot, Slack, WhatsApp Business API, e APIs REST customizadas.",
            category: "features",
          },
          {
            question: "Como funciona a garantia de 30 dias?",
            answer:
              "Se você não ficar satisfeito com o Luminaris por qualquer motivo, basta solicitar o reembolso dentro de 30 dias da contratação. Devolvemos 100% do valor pago.",
            category: "pricing",
          },
        ],
        ctaText: "Ainda tem dúvidas? Fale conosco",
        ctaLink: "/contato",
      },
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content for faq section",
      },
    },
    "final-cta": {
      content: {
        title: "Não Perca Esta Oportunidade",
        subtitle:
          "Junte-se a milhares de empresas que já transformaram seus dados em vantagem competitiva",
        primaryCtaText: "Começar Agora - Teste Gratuito",
        primaryCtaLink: "/signup",
        secondaryCtaText: "Agendar Demonstração",
        secondaryCtaLink: "/demo",
        urgencyText: "Apenas 47 vagas restantes para este mês",
        guarantee: "30 dias de garantia incondicional",
      },
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content for final-cta section",
      },
    },
    footer: {
      content: {
        description:
          "Transforme dados em decisões inteligentes com IA conversacional e dashboards automáticos.",
        columns: [
          {
            title: "Produto",
            links: [
              { label: "Funcionalidades", href: "/features" },
              { label: "Preços", href: "/pricing" },
              { label: "Demonstração", href: "/demo" },
            ],
          },
          {
            title: "Empresa",
            links: [
              { label: "Sobre nós", href: "/about" },
              { label: "Contato", href: "/contact" },
            ],
          },
          {
            title: "Suporte",
            links: [
              { label: "Central de Ajuda", href: "/help" },
              { label: "Documentação", href: "/docs" },
            ],
          },
        ],
        legalLinks: [
          { label: "Termos de Uso", href: "/terms" },
          { label: "Política de Privacidade", href: "/privacy" },
        ],
        copyright: "© 2024 Luminaris. Todos os direitos reservados.",
      },
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content for footer section",
      },
    },
    checkout: {
      content: {
        title: "Finalizar Compra",
        subtitle: "Complete suas informações para ativar seu plano",
        plan: {
          name: "Plano Pro",
          price: "R$ 497",
          period: "/mês",
          features: [
            "IA Conversacional Avançada",
            "Dashboards Ilimitados",
            "Integrações Completas",
            "Suporte Prioritário",
          ],
        },
        ctaText: "Finalizar Compra",
        termsText:
          "Ao finalizar, você concorda com nossos Termos de Uso e Política de Privacidade.",
      },
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content for checkout section",
      },
    },
    trial: {
      content: {
        title: "Teste Gratuito de 14 Dias",
        subtitle: "Acesse todas as funcionalidades sem compromisso",
        duration: "14 dias",
        features: [
          "IA Conversacional Completa",
          "Dashboards Ilimitados",
          "Todas as Integrações",
          "Suporte por Chat",
        ],
        ctaText: "Iniciar Teste Agora",
        termsText: "Ao se cadastrar, você concorda com nossos Termos de Uso.",
      },
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content for trial section",
      },
    },
    signup: {
      content: {
        title: "Criar Conta",
        subtitle: "Complete seu cadastro e tenha acesso imediato à plataforma",
        benefits: [
          "Configuração em 5 minutos",
          "Sem cartão de crédito necessário",
          "Cancelamento a qualquer momento",
        ],
        ctaText: "Criar Conta Gratuita",
        termsText:
          "Ao se cadastrar, você concorda com nossos Termos de Uso e Política de Privacidade.",
      },
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content for signup section",
      },
    },
  };

  return (
    fallbacks[sectionId] || {
      content: null,
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content for unknown section",
      },
    }
  );
}

// Compose individual section content (async)
const validSectionIds = [
  "hero",
  "benefits",
  "features",
  "pricing",
  "social-proof",
  "demo",
  "faq",
  "final-cta",
  "footer",
  "checkout",
  "trial",
  "signup",
  "pillars",
  "how-it-works",
  "verticals",
  "proof-traction",
  "lead-form",
  "pricing-presale",
] as const;
type SectionId = (typeof validSectionIds)[number];
function assertSectionId(id: string): asserts id is SectionId {
  if (!validSectionIds.includes(id as any))
    throw new Error(`Invalid section id: ${id}`);
}

// Enhanced error handling for dynamic imports
async function safeDynamicImport<T>(
  importFn: () => Promise<T>,
  fallback: T,
  sectionId: string,
): Promise<T> {
  try {
    const result = await importFn();
    return result;
  } catch (error) {
    logger.warn(
      `Dynamic import failed for section ${sectionId}, using fallback`,
      {
        sectionId,
        error: error instanceof Error ? error.message : String(error),
      },
    );
    return fallback;
  }
}

function getUserSegmentsSafe(): string[] {
  return readLocalStorageJSON("dataflow_user_segments", []);
}

async function composeSectionContent(
  sectionId: string,
  pageType: string,
): Promise<any> {
  validateSectionIdInput(sectionId);
  validatePageType(pageType);
  switch (sectionId) {
    case "hero":
      // Dynamic import to avoid circular dependencies (SSR-safe)
      try {
        const { composeHeroContent } = await import("../../domains/marketing");
        const heroContent = composeHeroContent();

        // Apply experiment variants if hero experiment is active
        if (flags.getExperimentVariant("hero_headline") !== "control") {
          const variant = flags.getExperimentVariant("hero_headline");
          // Apply variant-specific modifications
          if (variant === "variant_a") {
            heroContent.content.headline =
              "Transforme Dados em Decisões Inteligentes";
            heroContent.content.subheadline =
              "Automatize seus relatórios em minutos, não dias. IA conversacional e dashboards interativos.";
          } else if (variant === "variant_b") {
            heroContent.content.headline = "Relatórios Automáticos em Minutos";
            heroContent.content.subheadline =
              "Da planilha manual para o dashboard inteligente. Economize horas de trabalho todos os dias.";
          }
        }

        // Apply personalization based on user segments (SSR-safe)
        try {
          const userSegments = getUserSegmentsSafe();
          if (userSegments.includes("enterprise")) {
            heroContent.content.subheadline =
              "Soluções corporativas para grandes volumes de dados e equipes distribuídas.";
          } else if (userSegments.includes("mobile_user")) {
            heroContent.content.headline =
              "Relatórios Inteligentes no Seu Bolso";
          }
        } catch {
          // Ignore personalization errors
        }

        return heroContent;
      } catch (error) {
        logger.error("Failed to load hero composer", { sectionId, error });
        return getFallbackContent(sectionId);
      }

    case "benefits":
      // Use benefits composer
      try {
        const { composeBenefitsContent } = await import(
          "../../domains/marketing"
        );
        return composeBenefitsContent();
      } catch (error) {
        logger.error("Failed to load benefits composer", { sectionId, error });
        return getFallbackContent(sectionId);
      }

    case "features":
      // Use features composer
      try {
        const { composeFeaturesContent } = await import(
          "../../domains/marketing"
        );
        return composeFeaturesContent();
      } catch (error) {
        logger.error("Failed to load features composer", { sectionId, error });
        return getFallbackContent(sectionId);
      }

    case "pricing":
      // Use pricing composer
      try {
        const { composePricingContent } = await import(
          "../../domains/marketing"
        );
        return composePricingContent();
      } catch (error) {
        logger.error("Failed to load pricing composer", { sectionId, error });
        return getFallbackContent(sectionId);
      }

    case "social-proof":
      // Use social-proof composer
      try {
        const { composeSocialProofContent } = await import(
          "../../domains/marketing"
        );
        return composeSocialProofContent();
      } catch (error) {
        logger.error("Failed to load social-proof composer", {
          sectionId,
          error,
        });
        return getFallbackContent(sectionId);
      }

    case "demo":
      // Use demo composer with enhanced error handling
      return await safeDynamicImport(
        async () => {
          const { composeDemoContent } = await import(
            "../../domains/marketing"
          );
          return composeDemoContent();
        },
        getFallbackContent(sectionId),
        sectionId,
      );

    case "faq":
      // Use FAQ composer
      try {
        const { composeFaqContent } = await import("../../domains/marketing");
        return composeFaqContent();
      } catch (error) {
        logger.error("Failed to load FAQ composer", { sectionId, error });
        return getFallbackContent(sectionId);
      }

    case "final-cta":
      // Use final-cta composer
      try {
        const { composeFinalCtaContent } = await import(
          "../../domains/marketing"
        );
        return composeFinalCtaContent();
      } catch (error) {
        logger.error("Failed to load final-cta composer", { sectionId, error });
        return getFallbackContent(sectionId);
      }

    case "footer":
      // Use footer composer
      try {
        const { composeFooterContent } = await import(
          "../../domains/marketing"
        );
        return composeFooterContent();
      } catch (error) {
        logger.error("Failed to load footer composer", { sectionId, error });
        return getFallbackContent(sectionId);
      }

    case "checkout":
      // Use checkout composer
      try {
        const { composeCheckoutContent } = await import(
          "../../domains/marketing"
        );
        return composeCheckoutContent();
      } catch (error) {
        logger.error("Failed to load checkout composer", { sectionId, error });
        return getFallbackContent(sectionId);
      }

    case "trial":
      // Use trial composer
      try {
        const { composeTrialContent } = await import("../../domains/marketing");
        return composeTrialContent();
      } catch (error) {
        logger.error("Failed to load trial composer", { sectionId, error });
        return getFallbackContent(sectionId);
      }

    case "signup":
      // Use signup composer
      try {
        const { composeSignupContent } = await import(
          "../../domains/marketing"
        );
        return composeSignupContent();
      } catch (error) {
        logger.error("Failed to load signup composer", { sectionId, error });
        return getFallbackContent(sectionId);
      }

    default:
      logger.warn("Unknown section", { sectionId });
      return null;
  }
}

// Collect experiments from composed sections
function collectExperiments(sections: SectionConfig[]) {
  const experiments: PageComposition["experiments"] = [];

  sections.forEach((section) => {
    if (section.content?.experiment) {
      const exp = section.content.experiment;
      const existing = experiments.find((e) => e.id === exp.id);

      if (existing) {
        existing.sections.push(section.id);
      } else {
        experiments.push({
          id: exp.id,
          variant: exp.variant,
          sections: [section.id],
        });
      }
    }
  });

  return experiments;
}

// Fallback composition for production error recovery
async function createFallbackComposition(
  pageType: keyof typeof pageConfigs,
  error: any,
  isNestedCall = false,
): Promise<PageComposition> {
  logger.warn("Creating fallback composition", {
    pageType,
    error,
    isNestedCall,
  });

  const config = pageConfigs[pageType];
  const fallbackSections = config.sections.map((section) => {
    // When in fallback mode, don't try to compose sections again to prevent infinite loops
    // Just use minimal fallback content directly
    if (isNestedCall) {
      logger.info("Using minimal fallback (nested call)", {
        sectionId: section.id,
      });
      return {
        ...section,
        content: createMinimalFallbackContent(section.id),
      };
    }

    // For the initial fallback call, try each section once more with minimal error handling
    try {
      // Only use static fallback content, don't call composeSectionContent again
      const content = getFallbackContent(section.id);
      return content
        ? { ...section, content }
        : {
            ...section,
            content: createMinimalFallbackContent(section.id),
          };
    } catch (sectionError) {
      logger.warn("Section fallback failed, using minimal fallback", {
        sectionId: section.id,
        error: sectionError as unknown,
      });
      return {
        ...section,
        content: createMinimalFallbackContent(section.id),
      };
    }
  });

  return {
    sections: fallbackSections,
    metadata: config.metadata,
    experiments: [],
    analytics: config.analytics,
  };
}

// Compose individual section content asynchronously (for client-side)
async function composeSectionContentAsync(
  sectionId: string,
  pageType: string,
): Promise<any> {
  validateSectionIdInput(sectionId);
  validatePageType(pageType);
  try {
    switch (sectionId) {
      case "hero":
        try {
          const { composeHeroContent } = await import(
            "../../domains/marketing"
          );
          return composeHeroContent();
        } catch (error) {
          console.warn(`Hero composer failed, using fallback:`, error);
          return getFallbackContent(sectionId);
        }

      case "social-proof":
        // Use social-proof composer
        try {
          const { composeSocialProofContent } = await import(
            "../../domains/marketing"
          );
          return composeSocialProofContent();
        } catch (error) {
          logger.error("Failed to load social-proof composer", {
            sectionId,
            error,
          });
          return getFallbackContent(sectionId);
        }

      case "benefits":
        try {
          const { composeBenefitsContent } = await import(
            "../../domains/marketing"
          );
          return composeBenefitsContent();
        } catch (error) {
          console.warn(`Benefits composer failed, using fallback:`, error);
          return getFallbackContent(sectionId);
        }

      case "features":
        try {
          const { composeFeaturesContent } = await import(
            "../../domains/marketing"
          );
          return composeFeaturesContent();
        } catch (error) {
          console.warn(`Features composer failed, using fallback:`, error);
          return getFallbackContent(sectionId);
        }

      case "pillars":
        try {
          const { composePillarsContent } = await import(
            "../../domains/marketing"
          );
          return composePillarsContent();
        } catch (error) {
          console.warn(`Pillars composer failed, using fallback:`, error);
          return getFallbackContent(sectionId);
        }

      case "how-it-works":
        try {
          const { composeHowItWorksContent } = await import(
            "../../domains/marketing"
          );
          return composeHowItWorksContent();
        } catch (error) {
          console.warn(`How it works composer failed, using fallback:`, error);
          return getFallbackContent(sectionId);
        }

      case "verticals":
        try {
          const { composeVerticalsContent } = await import(
            "../../domains/marketing"
          );
          return composeVerticalsContent();
        } catch (error) {
          console.warn(`Verticals composer failed, using fallback:`, error);
          return getFallbackContent(sectionId);
        }

      case "proof-traction":
        try {
          const { composeProofTractionContent } = await import(
            "../../domains/marketing"
          );
          return composeProofTractionContent();
        } catch (error) {
          console.warn(
            `Proof traction composer failed, using fallback:`,
            error,
          );
          return getFallbackContent(sectionId);
        }

      case "demo":
        return await safeDynamicImport(
          async () => {
            const { composeDemoContent } = await import(
              "../../domains/marketing"
            );
            return composeDemoContent();
          },
          getFallbackContent(sectionId),
          sectionId,
        );

      case "lead-form":
        try {
          const { composeLeadFormContent } = await import(
            "../../domains/marketing"
          );
          return composeLeadFormContent();
        } catch (error) {
          console.warn(`Lead form composer failed, using fallback:`, error);
          return getFallbackContent(sectionId);
        }

      case "pricing":
        try {
          const { composePricingContent } = await import(
            "../../domains/marketing"
          );
          return composePricingContent();
        } catch (error) {
          console.warn(`Pricing composer failed, using fallback:`, error);
          return getFallbackContent(sectionId);
        }

      case "faq":
        try {
          const { composeFaqContent } = await import("../../domains/marketing");
          return composeFaqContent();
        } catch (error) {
          console.warn(`FAQ composer failed, using fallback:`, error);
          return getFallbackContent(sectionId);
        }

      case "final-cta":
        try {
          const { composeFinalCtaContent } = await import(
            "../../domains/marketing"
          );
          return composeFinalCtaContent();
        } catch (error) {
          console.warn(`Final CTA composer failed, using fallback:`, error);
          return getFallbackContent(sectionId);
        }

      case "footer":
        try {
          const { composeFooterContent } = await import(
            "../../domains/marketing"
          );
          return composeFooterContent();
        } catch (error) {
          console.warn(`Footer composer failed, using fallback:`, error);
          return getFallbackContent(sectionId);
        }

      case "checkout":
        try {
          const { composeCheckoutContent } = await import(
            "../../domains/marketing"
          );
          return composeCheckoutContent();
        } catch (error) {
          console.warn(`Checkout composer failed, using fallback:`, error);
          return getFallbackContent(sectionId);
        }

      case "trial":
        try {
          const { composeTrialContent } = await import(
            "../../domains/marketing"
          );
          return composeTrialContent();
        } catch (error) {
          console.warn(`Trial composer failed, using fallback:`, error);
          return getFallbackContent(sectionId);
        }

      case "signup":
        try {
          const { composeSignupContent } = await import(
            "../../domains/marketing"
          );
          return composeSignupContent();
        } catch (error) {
          console.warn(`Signup composer failed, using fallback:`, error);
          return getFallbackContent(sectionId);
        }

      case "pricing-presale":
        try {
          const { composePricingPresaleContent } = await import(
            "../../domains/marketing"
          );
          return composePricingPresaleContent();
        } catch (error) {
          console.warn(
            `Pricing presale composer failed, using fallback:`,
            error,
          );
          return getFallbackContent(sectionId);
        }

      // Static content for sections without composers yet
      default:
        return getFallbackContent(sectionId);
    }
  } catch (error) {
    logger.error("Error composing section", { sectionId, error });
    return getFallbackContent(sectionId);
  }
}

// Compose individual section content synchronously (for static generation)
function composeSectionContentSync(sectionId: string, pageType: string): any {
  validateSectionIdInput(sectionId);
  validatePageType(pageType);

  try {
    switch (sectionId) {
      case "hero": {
        return marketing.composeHeroContent();
      }
      case "benefits": {
        return marketing.composeBenefitsContent();
      }
      case "features": {
        return marketing.composeFeaturesContent();
      }
      case "pricing": {
        return marketing.composePricingContent();
      }
      case "social-proof": {
        return marketing.composeSocialProofContent();
      }
      case "demo": {
        return marketing.composeDemoContent();
      }
      case "faq": {
        return marketing.composeFaqContent();
      }
      case "final-cta": {
        return marketing.composeFinalCtaContent();
      }
      case "footer": {
        return marketing.composeFooterContent();
      }
      default:
        return getFallbackContent(sectionId);
    }
  } catch (error) {
    logger.error("composeSectionContentSync failed, using fallback", {
      sectionId,
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      errorType: error?.constructor?.name,
    });
    return getFallbackContent(sectionId);
  }
}

// Synchronous fallback composition for static generation
function createFallbackCompositionSync(
  pageType: keyof typeof pageConfigs,
  error: any,
): PageComposition {
  logger.warn("Creating sync fallback composition", { pageType, error });

  const config = pageConfigs[pageType];
  const fallbackSections = config.sections.map((section) => ({
    ...section,
    content: createMinimalFallbackContent(section.id),
  }));

  return {
    sections: fallbackSections,
    metadata: config.metadata,
    experiments: [],
    analytics: config.analytics,
  };
}

// Create minimal fallback content for any section
function createMinimalFallbackContent(sectionId: string): any {
  const fallbacks: Record<string, any> = {
    hero: {
      content: {
        headline: "Serviço Temporariamente Indisponível",
        subheadline: "Estamos trabalhando para restaurar o serviço.",
        primaryCta: "Tentar Novamente",
      },
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content",
      },
    },
    "social-proof": {
      content: null,
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content",
      },
    },
    pillars: {
      content: null,
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content",
      },
    },
    benefits: {
      content: null,
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content",
      },
    },
    "how-it-works": {
      content: null,
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content",
      },
    },
    verticals: {
      content: null,
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content",
      },
    },
    "proof-traction": {
      content: null,
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content",
      },
    },
    demo: {
      content: null,
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content",
      },
    },
    features: {
      content: null,
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content",
      },
    },
    "pricing-presale": {
      content: null,
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content",
      },
    },
    "lead-form": {
      content: null,
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content",
      },
    },
    pricing: {
      content: null,
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content",
      },
    },
    faq: {
      content: null,
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content",
      },
    },
    "final-cta": {
      content: null,
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content",
      },
    },
    footer: {
      content: null,
      variant: {
        id: "fallback",
        name: "Fallback",
        description: "Emergency fallback content",
      },
    },
  };

  return fallbacks[sectionId] || null;
}

// Utility functions
export function getAvailablePages(): (keyof typeof pageConfigs)[] {
  return Object.keys(pageConfigs) as (keyof typeof pageConfigs)[];
}
