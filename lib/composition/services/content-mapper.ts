/**
 * Content Mapper Service - Sprint T6
 * Maps content from CMS to component props
 */

import { ComposerValidation } from "../composer-validation";

export interface ContentMapperContext {
  locale?: string;
  experimentId?: string;
  variant?: string;
  preview?: boolean;
}

/**
 * Content mapper service
 */
export class ContentMapperService {
  private static instance: ContentMapperService;

  private constructor() {}

  static getInstance(): ContentMapperService {
    if (!ContentMapperService.instance) {
      ContentMapperService.instance = new ContentMapperService();
    }
    return ContentMapperService.instance;
  }

  /**
   * Map content for a specific section type
   */
  async mapContent(
    sectionType: string,
    config: Record<string, unknown>,
    context: ContentMapperContext
  ): Promise<Record<string, unknown>> {
    // Validate config
    const validation = (ComposerValidation as any).validateComposerInput(
      (ComposerValidation as any).BaseComposerInputSchema,
      config
    );

    if (!validation.success) {
      console.warn(`[ContentMapper] Invalid config for ${sectionType}:`, validation.errors);
      return this.getFallbackContent(sectionType);
    }

    // Apply experiment variants
    if (context.experimentId && context.variant) {
      return this.applyExperimentVariant(sectionType, config, context.variant);
    }

    // Get content from CMS (mock implementation)
    return this.getContentFromCMS(sectionType, config, context);
  }

  /**
   * Apply experiment variant to content
   */
  private applyExperimentVariant(
    sectionType: string,
    baseContent: Record<string, unknown>,
    variant: string
  ): Record<string, unknown> {
    // Mock experiment variant application
    const variants: Record<string, Record<string, (content: Record<string, unknown>) => Record<string, unknown>>> = {
      hero: {
        variant_a: (content) => ({
          ...content,
          headline: `${content.headline} (Variant A)`,
        }),
        variant_b: (content) => ({
          ...content,
          subheadline: `${content.subheadline} - Try it now!`,
        }),
      },
    };

    const sectionVariants = variants[sectionType];
    if (sectionVariants?.[variant]) {
      return sectionVariants[variant](baseContent);
    }

    return baseContent;
  }

  /**
   * Get content from CMS (mock implementation)
   */
  private async getContentFromCMS(
    sectionType: string,
    config: Record<string, unknown>,
    context: ContentMapperContext
  ): Promise<Record<string, unknown>> {
    // Mock CMS data - in real implementation, this would fetch from a CMS
    const mockContent: Record<string, Record<string, unknown>> = {
      hero: {
        headline: "Automatize seus relatórios em minutos",
        subheadline: "Transforme dados em insights acionáveis",
        primaryCta: { text: "Começar Grátis", link: "/signup" },
        secondaryCta: { text: "Ver Demo", link: "/demo" },
        visual: "/images/hero-dashboard.png",
      },
      features: {
        title: "Recursos Principais",
        features: [
          {
            icon: "BarChart3",
            title: "Relatórios Automáticos",
            description: "Gere relatórios em minutos, não horas",
            highlight: true,
          },
        ],
      },
      pricing: {
        title: "Planos e Preços",
        plans: [
          {
            name: "Starter",
            price: 29,
            period: "monthly",
            features: ["Até 5 usuários", "Relatórios básicos"],
          },
        ],
      },
    };

    const content = mockContent[sectionType];
    if (!content) {
      console.warn(`[ContentMapper] No content found for section type: ${sectionType}`);
      return this.getFallbackContent(sectionType);
    }

    // Apply localization if needed
    if (context.locale && context.locale !== 'pt-BR') {
      return this.localizeContent(content, context.locale);
    }

    return content;
  }

  /**
   * Localize content (mock implementation)
   */
  private localizeContent(content: Record<string, unknown>, locale: string): Record<string, unknown> {
    // Mock localization - in real implementation, this would use i18n
    if (locale === 'en-US') {
      return {
        ...content,
        headline: (content.headline as string)?.replace('relatórios', 'reports'),
        subheadline: (content.subheadline as string)?.replace('dados', 'data'),
      };
    }
    return content;
  }

  /**
   * Get fallback content for missing sections
   */
  private getFallbackContent(sectionType: string): Record<string, unknown> {
    const fallbacks: Record<string, Record<string, unknown>> = {
      hero: {
        headline: "Bem-vindo",
        subheadline: "Conteúdo será carregado em breve",
        primaryCta: { text: "Saiba Mais", link: "#" },
      },
      features: {
        title: "Recursos",
        features: [],
      },
      pricing: {
        title: "Preços",
        plans: [],
      },
    };

    return fallbacks[sectionType] || {};
  }
}