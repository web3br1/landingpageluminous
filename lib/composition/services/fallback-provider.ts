// Fallback Provider - Single Responsibility: Provide fallback content and compositions
// Application Layer Service implementing IFallbackProvider

import { Result, AppError, isOk } from "@/lib/core/result";
import {
  IFallbackProvider,
  PageType,
  SectionId,
  PageComposition,
  SectionContent,
} from "../ports";
import { logger } from "@/lib/logger";

export class FallbackProvider implements IFallbackProvider {
  getFallbackComposition(
    pageType: string,
    error?: unknown,
  ): Result<PageComposition, AppError> {
    logger.warn("Providing fallback composition", { pageType, error });

    try {
      let config = this.getPageConfig(pageType);

      // Ensure config has valid sections array
      if (!config || !(config as any).sections || !Array.isArray((config as any).sections)) {
        logger.error("Invalid fallback config, using emergency fallback", {
          pageType,
        });
        // Emergency fallback - minimal landing page
        config = {
          sections: [{ id: "hero", component: "Hero", order: 1 }],
          metadata: {
            title: "Sistema Temporariamente Indisponível",
            description: "Estamos trabalhando para restaurar o serviço.",
            keywords: ["indisponível"],
          },
          analytics: {
            pageType: "landing",
            conversionGoals: ["contact"],
          },
        };
      }

      const fallbackSections = config.sections.map((section: unknown) => {
        if (typeof section !== 'object' || section === null || !('id' in section)) {
          return null;
        }
        const sectionObj = section as { id: string; [key: string]: unknown };
        const fallbackResult = this.getFallbackSectionContent(sectionObj.id);
        return {
          ...sectionObj,
          content: isOk(fallbackResult) ? fallbackResult.value : null,
        };
      }).filter(Boolean);

      const composition: PageComposition = {
        sections: fallbackSections,
        metadata: (config as any).metadata,
        experiments: [],
        analytics: (config as any).analytics,
        pageType: pageType as PageType,
      };

      return Result.ok(composition);
    } catch (fallbackError) {
      logger.error("Fallback composition creation failed", {
        pageType,
        originalError: error,
        fallbackError,
      });

      return {
        success: false,
        error: {
          name: "AppError",
          message: `Failed to create fallback composition for ${pageType}`,
          code: "INTERNAL_ERROR",
          details: { cause: fallbackError },
        },
      };
    }
  }

  getFallbackSectionContent(
    sectionId: SectionId,
  ): Result<SectionContent, AppError> {
    logger.debug("Providing fallback section content", { sectionId });

    const fallback = this.getSectionFallback(sectionId);

    if (fallback) {
      return Result.ok(fallback);
    }

    // CRITICAL: Always provide a fallback to prevent section filtering
    logger.warn(
      "No specific fallback found, using generic emergency fallback",
      { sectionId },
    );

    const genericFallback: SectionContent = {
      content: {
        title: `${sectionId.charAt(0).toUpperCase() + sectionId.slice(1)} Section`,
        description: "Conteúdo temporariamente indisponível. Retorne em breve.",
        status: "unavailable",
      },
      variant: {
        id: "generic-emergency",
        name: "Generic Emergency Fallback",
        description:
          "Generic fallback for any section without specific content",
      },
    };

    return Result.ok(genericFallback);
  }

  private getPageConfig(pageType: string): unknown {
    // Centralized page configurations with fallbacks
    const configs: Record<string, unknown> = {
      landing: {
        sections: [
          { id: "hero", component: "Hero", order: 1 },
          { id: "benefits", component: "Benefits", order: 2 },
          { id: "features", component: "Features", order: 3 },
          { id: "pricing", component: "Pricing", order: 4 },
        ],
        metadata: {
          title: "Sistema de Automação Empresarial",
          description: "Transforme dados em decisões inteligentes.",
          keywords: ["automação", "business intelligence", "dados"],
        },
        analytics: {
          pageType: "landing",
          conversionGoals: ["cta_click", "signup_start"],
        },
      },
      features: {
        sections: [
          { id: "hero", component: "Hero", order: 1 },
          { id: "features", component: "Features", order: 2 },
        ],
        metadata: {
          title: "Funcionalidades",
          description: "Explore todas as funcionalidades disponíveis.",
          keywords: ["funcionalidades", "features"],
        },
        analytics: {
          pageType: "features",
          conversionGoals: ["feature_view"],
        },
      },
      pricing: {
        sections: [
          { id: "hero", component: "Hero", order: 1 },
          { id: "pricing", component: "Pricing", order: 2 },
        ],
        metadata: {
          title: "Preços e Planos",
          description: "Compare planos e escolha o melhor para seu negócio.",
          keywords: ["preços", "planos"],
        },
        analytics: {
          pageType: "pricing",
          conversionGoals: ["pricing_view"],
        },
      },
      demo: {
        sections: [
          { id: "hero", component: "Hero", order: 1 },
          { id: "demo", component: "Demo", order: 2 },
        ],
        metadata: {
          title: "Demonstração",
          description: "Veja o sistema em ação.",
          keywords: ["demo", "demonstração"],
        },
        analytics: {
          pageType: "demo",
          conversionGoals: ["demo_start"],
        },
      },
      signup: {
        sections: [
          { id: "hero", component: "Hero", order: 1 },
          { id: "signup", component: "SignupForm", order: 2 },
        ],
        metadata: {
          title: "Criar Conta",
          description: "Complete seu cadastro.",
          keywords: ["cadastro", "signup"],
        },
        analytics: {
          pageType: "signup",
          conversionGoals: ["signup_start"],
        },
      },
      trial: {
        sections: [
          { id: "hero", component: "Hero", order: 1 },
          { id: "trial", component: "TrialForm", order: 2 },
        ],
        metadata: {
          title: "Teste Gratuito",
          description: "Comece seu teste gratuito.",
          keywords: ["trial", "teste gratuito"],
        },
        analytics: {
          pageType: "trial",
          conversionGoals: ["trial_start"],
        },
      },
      checkout: {
        sections: [{ id: "checkout", component: "CheckoutForm", order: 1 }],
        metadata: {
          title: "Finalizar Compra",
          description: "Complete sua compra.",
          keywords: ["checkout", "pagamento"],
        },
        analytics: {
          pageType: "checkout",
          conversionGoals: ["checkout_start"],
        },
      },
    };

    return configs[pageType] || configs.landing;
  }

  private getSectionFallback(sectionId: SectionId): SectionContent | null {
    const fallbacks: Record<string, SectionContent> = {
      hero: {
        content: {
          headline: "Sistema Temporariamente Indisponível",
          subheadline:
            "Estamos trabalhando para restaurar o serviço. Tente novamente em alguns minutos.",
          primaryCta: "Tentar Novamente",
        },
        variant: {
          id: "emergency",
          name: "Emergency Fallback",
          description: "Minimal fallback content for hero section",
        },
      },

      benefits: {
        content: {
          title: "Benefícios Comprovados",
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
          id: "emergency",
          name: "Emergency Fallback",
          description: "Minimal fallback content for benefits section",
        },
      },

      features: {
        content: {
          title: "Funcionalidades Principais",
          subtitle: "Tecnologia de ponta para seu negócio",
          features: [],
        },
        variant: {
          id: "emergency",
          name: "Emergency Fallback",
          description: "Minimal fallback content for features section",
        },
      },

      pricing: {
        content: {
          title: "Planos Flexíveis",
          subtitle: "Escolha o melhor para seu negócio",
          tiers: [],
        },
        variant: {
          id: "emergency",
          name: "Emergency Fallback",
          description: "Minimal fallback content for pricing section",
        },
      },

      "social-proof": {
        content: null,
        variant: {
          id: "emergency",
          name: "Emergency Fallback",
          description: "Minimal fallback content for social proof section",
        },
      },

      demo: {
        content: {
          title: "Demonstração Indisponível",
          subtitle: "Retorne em breve para ver nossa demonstração interativa",
          description: "Estamos preparando uma experiência incrível para você.",
          demoType: "unavailable",
        },
        variant: {
          id: "emergency",
          name: "Emergency Fallback",
          description: "Minimal fallback content for demo section",
        },
      },

      faq: {
        content: {
          title: "Perguntas Frequentes",
          subtitle: "Principais dúvidas sobre nossa plataforma",
          items: [
            {
              question: "Como funciona o período de teste?",
              answer:
                "Oferecemos teste gratuito sem necessidade de cartão de crédito.",
              category: "trial",
            },
          ],
          ctaText: "Fale Conosco",
        },
        variant: {
          id: "emergency",
          name: "Emergency Fallback",
          description: "Minimal fallback content for FAQ section",
        },
      },

      "final-cta": {
        content: {
          title: "Pronto para Começar?",
          subtitle:
            "Junte-se a milhares de empresas que já transformaram seus negócios",
          primaryCtaText: "Começar Agora",
          primaryCtaLink: "/signup",
        },
        variant: {
          id: "emergency",
          name: "Emergency Fallback",
          description: "Minimal fallback content for final CTA section",
        },
      },

      footer: {
        content: {
          description: "Transforme dados em decisões inteligentes.",
          columns: [
            {
              title: "Produto",
              links: [
                { label: "Funcionalidades", href: "/features" },
                { label: "Preços", href: "/pricing" },
              ],
            },
          ],
          copyright: "© 2024 Sistema. Todos os direitos reservados.",
        },
        variant: {
          id: "emergency",
          name: "Emergency Fallback",
          description: "Minimal fallback content for footer section",
        },
      },

      checkout: {
        content: {
          title: "Finalizar Compra",
          subtitle: "Complete suas informações para ativar seu plano",
          plan: {
            name: "Plano Selecionado",
            price: "A consultar",
            period: "/mês",
            features: ["Suporte incluído"],
          },
          ctaText: "Continuar",
        },
        variant: {
          id: "emergency",
          name: "Emergency Fallback",
          description: "Minimal fallback content for checkout section",
        },
      },

      trial: {
        content: {
          title: "Teste Gratuito Indisponível",
          subtitle: "Retorne em breve para iniciar seu teste",
          duration: "14 dias",
          features: ["Acesso completo", "Suporte incluído"],
          ctaText: "Tentar Novamente",
        },
        variant: {
          id: "emergency",
          name: "Emergency Fallback",
          description: "Minimal fallback content for trial section",
        },
      },

      signup: {
        content: {
          title: "Cadastro Temporariamente Indisponível",
          subtitle: "Retorne em breve para criar sua conta",
          benefits: ["Configuração rápida", "Sem compromisso"],
          ctaText: "Tentar Novamente",
        },
        variant: {
          id: "emergency",
          name: "Emergency Fallback",
          description: "Minimal fallback content for signup section",
        },
      },
    };

    return fallbacks[sectionId] || null;
  }
}
