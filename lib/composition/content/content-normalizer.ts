import { z } from "zod";
import type { SectionId } from "../registry/section-registry";

// ===== BASE CONTENT SCHEMA =====
const BaseSectionContentSchema = z
  .object({
    id: z.string().optional(),
    variant: z.string().default("default"),
    tracking: z
      .object({
        sectionId: z.string(),
        eventCategory: z.string().default("landing_page"),
        eventAction: z.string().default("section_interaction"),
      })
      .optional(),
    // Allow additional fields for specific section content
  })
  .catchall(z.any());

// ===== PLACEHOLDER SCHEMA =====
const PlaceholderContentSchema = BaseSectionContentSchema.extend({
  message: z.string().default("Seção em desenvolvimento"),
  showCta: z.boolean().default(false),
  cta: z
    .object({
      text: z.string().default("Saiba mais"),
      href: z.string().url().default("#"),
    })
    .optional(),
});

// ===== SCHEMA REGISTRY =====
const contentSchemaRegistry: Record<SectionId, z.ZodSchema<unknown>> = {
  // All sections use base schema for now - can be extended later
  hero: BaseSectionContentSchema,
  benefits: BaseSectionContentSchema,
  features: BaseSectionContentSchema,
  pricing: BaseSectionContentSchema,
  "social-proof": BaseSectionContentSchema,
  faq: BaseSectionContentSchema,
  demo: BaseSectionContentSchema,
  "final-cta": BaseSectionContentSchema,
  footer: BaseSectionContentSchema,
  checkout: PlaceholderContentSchema,
  trial: PlaceholderContentSchema,
  signup: PlaceholderContentSchema,
  pillars: PlaceholderContentSchema,
  "how-it-works": PlaceholderContentSchema,
  verticals: PlaceholderContentSchema,
  "proof-traction": PlaceholderContentSchema,
  "lead-form": PlaceholderContentSchema,
  "pricing-presale": PlaceholderContentSchema,
};

// ===== CONTENT NORMALIZER CLASS =====
export class ContentNormalizer {
  /**
   * Normalize content for a specific section
   * Validates, transforms, and provides defaults
   */
  static normalizeContent(
    sectionId: SectionId,
    rawContent: unknown,
  ): Record<string, unknown> {
    const schema = contentSchemaRegistry[sectionId];

    if (!schema) {
      throw new Error(`No content schema found for section: ${sectionId}`);
    }

    try {
      // Validate and transform the content
      const normalizedContent = schema.parse(rawContent);

      // Add section ID if not present
      const content = normalizedContent as any;
      if (!content.id) {
        content.id = sectionId;
      }

      // Add tracking defaults if not present
      if (!content.tracking) {
        content.tracking = {
          sectionId,
          eventCategory: "landing_page",
          eventAction: "section_interaction",
        };
      }

      console.log(
        `[ContentNormalizer] Normalized content for section: ${sectionId}`,
      );
      return content;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(
          `[ContentNormalizer] Validation failed for section ${sectionId}:`,
          error.issues,
        );
        throw new Error(
          `Content validation failed for section ${sectionId}: ${error.message}`,
        );
      }

      console.error(
        `[ContentNormalizer] Unexpected error normalizing content for ${sectionId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Check if content is valid for a section (without throwing)
   */
  static isValidContent(sectionId: SectionId, content: unknown): boolean {
    const schema = contentSchemaRegistry[sectionId];

    if (!schema) {
      console.warn(
        `[ContentNormalizer] No schema found for section: ${sectionId}`,
      );
      return false;
    }

    const result = schema.safeParse(content);
    return result.success;
  }

  /**
   * Get validation errors for content
   */
  static getValidationErrors(
    sectionId: SectionId,
    content: unknown,
  ): z.ZodIssue[] | null {
    const schema = contentSchemaRegistry[sectionId];

    if (!schema) {
      return null;
    }

    const result = schema.safeParse(content);
    return result.success ? null : result.error.issues;
  }

  /**
   * Get default content for a section
   */
  static getDefaultContent(sectionId: SectionId): Record<string, unknown> {
    const defaults: Record<string, unknown> = {
      hero: {
        headline: "Bem-vindo à nossa plataforma",
        subheadline: "Transforme seu negócio com nossas soluções inovadoras",
        primaryCta: {
          text: "Começar agora",
          href: "#pricing",
        },
        variant: "default",
      },
      benefits: {
        title: "Por que escolher nossa solução?",
        benefits: [
          {
            icon: "Zap",
            title: "Rápido e eficiente",
            description: "Economize tempo com automação inteligente",
          },
        ],
        variant: "default",
      },
      features: {
        title: "Recursos poderosos",
        features: [
          {
            icon: "Star",
            title: "Recurso incrível",
            description: "Funcionalidade que faz a diferença",
          },
        ],
        layout: "grid",
        variant: "default",
      },
      pricing: {
        title: "Planos e preços",
        plans: [
          {
            id: "starter",
            name: "Starter",
            description: "Perfeito para começar",
            price: {
              amount: 29,
              currency: "BRL",
              period: "month",
            },
            features: ["Feature 1", "Feature 2"],
            cta: {
              text: "Começar",
              href: "#signup",
            },
          },
        ],
        variant: "default",
      },
      "social-proof": {
        testimonials: [],
        logos: [],
        metrics: [],
        variant: "default",
      },
      faq: {
        title: "Perguntas frequentes",
        faqs: [
          {
            question: "Como funciona?",
            answer: "É simples e intuitivo.",
          },
        ],
        variant: "default",
      },
      demo: {
        title: "Veja em ação",
        demo: {
          type: "video",
          src: "#",
        },
        variant: "default",
      },
      footer: {
        links: [],
        social: [],
        legal: [
          {
            text: "Política de Privacidade",
            href: "/privacidade",
          },
          {
            text: "Termos de Uso",
            href: "/termos",
          },
        ],
        variant: "default",
      },
    };

    const defaultContent = defaults[sectionId] || {
      message: `Seção ${sectionId} em desenvolvimento`,
      variant: "default",
    };

    return this.normalizeContent(sectionId, defaultContent);
  }

  /**
   * Merge user content with defaults
   */
  static mergeWithDefaults(
    sectionId: SectionId,
    userContent: Record<string, unknown>,
  ): Record<string, unknown> {
    const defaults = this.getDefaultContent(sectionId);

    // Simple merge for now - can be enhanced later
    const merged = { ...defaults, ...userContent };

    return this.normalizeContent(sectionId, merged);
  }
}
