/**
 * Validation Service - Sprint T6
 * Validates composition contexts and content
 */

import { z } from "zod";
import { PageCompositionContext } from "./page-composition-service";
import { ComposerValidation } from "../composer-validation";

/**
 * Context validation schema
 */
const PageCompositionContextSchema = z.object({
  pageId: z.string().min(1).max(100),
  locale: z.string().optional(),
  userId: z.string().uuid().optional(),
  experimentId: z.string().optional(),
  variant: z.string().optional(),
  preview: z.boolean().optional(),
  timestamp: z.number().positive(),
});

/**
 * Validation service
 */
export class ValidationService {
  private static instance: ValidationService;

  private constructor() {}

  static getInstance(): ValidationService {
    if (!ValidationService.instance) {
      ValidationService.instance = new ValidationService();
    }
    return ValidationService.instance;
  }

  /**
   * Validate page composition context
   */
  async validateContext(context: PageCompositionContext): Promise<void> {
    const result = PageCompositionContextSchema.safeParse(context);

    if (!result.success) {
      const errors = (ComposerValidation as any).formatValidationErrors(result.error);
      console.error("[ValidationService] Invalid context:", errors);
      throw new Error(`Invalid page composition context: ${errors.join(', ')}`);
    }

    // Additional business rule validations
    await this.validateBusinessRules(context);
  }

  /**
   * Validate business rules
   */
  private async validateBusinessRules(context: PageCompositionContext): Promise<void> {
    // Rule 1: Preview mode requires authentication
    if (context.preview && !context.userId) {
      throw new Error("Preview mode requires user authentication");
    }

    // Rule 2: Experiment variants must be valid
    if (context.variant && !this.isValidVariant(context.variant)) {
      throw new Error(`Invalid experiment variant: ${context.variant}`);
    }

    // Rule 3: Locale must be supported
    if (context.locale && !this.isSupportedLocale(context.locale)) {
      throw new Error(`Unsupported locale: ${context.locale}`);
    }

    // Rule 4: Timestamp should not be too old or in the future
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    if (context.timestamp < now - fiveMinutes || context.timestamp > now + fiveMinutes) {
      throw new Error("Context timestamp is invalid (too old or in the future)");
    }
  }

  /**
   * Validate section content
   */
  async validateSectionContent(
    sectionType: string,
    content: Record<string, unknown>
  ): Promise<void> {
    const schema = this.getSectionValidationSchema(sectionType);

    if (!schema) {
      console.warn(`[ValidationService] No validation schema for section type: ${sectionType}`);
      return;
    }

    const result = (ComposerValidation as any).validateComposerInput(schema, content);

    if (!result.success && result.errors) {
      const errors = (ComposerValidation as any).formatValidationErrors(result.errors);
      console.error(`[ValidationService] Invalid content for ${sectionType}:`, errors);
      throw new Error(`Invalid ${sectionType} content: ${errors.join(', ')}`);
    }
  }

  /**
   * Get validation schema for section type
   */
  private getSectionValidationSchema(sectionType: string): z.ZodSchema | null {
    const schemas: Record<string, z.ZodSchema> = {
      hero: z.object({
        headline: z.string().min(1).max(200),
        subheadline: z.string().optional(),
        primaryCta: (ComposerValidation as any).ContentValidationSchemas.cta.optional(),
        secondaryCta: (ComposerValidation as any).ContentValidationSchemas.cta.optional(),
        visual: z.string().url().optional(),
      }),

      features: z.object({
        title: z.string().min(1).max(100),
        subtitle: z.string().optional(),
        features: z.array((ComposerValidation as any).ContentValidationSchemas.feature).max(10),
      }),

      pricing: z.object({
        title: z.string().min(1).max(100),
        subtitle: z.string().optional(),
        plans: z.array(z.object({
          name: z.string().min(1).max(50),
          price: z.number().nonnegative(),
          period: z.enum(['monthly', 'annual']),
          currency: z.string().length(3).optional(),
          features: z.array(z.string()),
          popular: z.boolean().optional(),
        })).min(1).max(5),
        billingToggle: z.object({
          enabled: z.boolean(),
          defaultPeriod: z.enum(['monthly', 'annual']),
        }).optional(),
      }),

      demo: z.object({
        title: z.string().min(1).max(100),
        subtitle: z.string().optional(),
        demoType: z.enum(['video', 'screenshots', 'interactive']),
        primaryVideo: (ComposerValidation as any).ContentValidationSchemas.video.optional(),
        screenshots: z.array((ComposerValidation as any).ContentValidationSchemas.image).optional(),
        tourSteps: z.array(z.object({
          title: z.string().min(1),
          description: z.string().min(1),
          image: (ComposerValidation as any).ContentValidationSchemas.image.optional(),
        })).optional(),
      }),

      testimonials: z.object({
        title: z.string().min(1).max(100),
        testimonials: z.array(z.object({
          quote: z.string().min(1).max(500),
          author: z.string().min(1).max(100),
          role: z.string().min(1).max(100),
          company: z.string().optional(),
          avatar: (ComposerValidation as any).ContentValidationSchemas.image.optional(),
        })).min(1).max(10),
      }),

      cta: z.object({
        headline: z.string().min(1).max(200),
        subheadline: z.string().optional(),
        primaryCta: (ComposerValidation as any).ContentValidationSchemas.cta,
        secondaryCta: (ComposerValidation as any).ContentValidationSchemas.cta.optional(),
        background: (ComposerValidation as any).ContentValidationSchemas.image.optional(),
      }),

      footer: z.object({
        company: z.object({
          name: z.string().min(1),
          logo: (ComposerValidation as any).ContentValidationSchemas.image.optional(),
          description: z.string().optional(),
        }),
        links: z.array(z.object({
          title: z.string().min(1),
          items: z.array(z.object({
            text: z.string().min(1),
            url: z.string().url(),
          })),
        })).optional(),
        social: z.array(z.object({
          platform: z.string().min(1),
          url: z.string().url(),
          icon: z.string().min(1),
        })).optional(),
        legal: z.array(z.object({
          text: z.string().min(1),
          url: z.string().url(),
        })).optional(),
      }),
    };

    return schemas[sectionType] || null;
  }

  /**
   * Check if variant is valid
   */
  private isValidVariant(variant: string): boolean {
    const validVariants = [
      'control', 'variant_a', 'variant_b', 'variant_c',
      'default', 'featured', 'minimal', 'detailed',
      'light', 'dark', 'colorful',
    ];
    return validVariants.includes(variant);
  }

  /**
   * Check if locale is supported
   */
  private isSupportedLocale(locale: string): boolean {
    const supportedLocales = [
      'pt-BR', 'en-US', 'es-ES', 'fr-FR', 'de-DE'
    ];
    return supportedLocales.includes(locale);
  }

  /**
   * Sanitize content
   */
  sanitizeContent(content: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(content)) {
      if (typeof value === 'string') {
        sanitized[key] = ComposerValidation.ContentSanitizer.sanitizeText(value);
      } else if (typeof value === 'object' && value !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = this.sanitizeContent(value as Record<string, unknown>);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Validate and sanitize content
   */
  async validateAndSanitizeContent(
    sectionType: string,
    content: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    // First validate
    await this.validateSectionContent(sectionType, content);

    // Then sanitize
    return this.sanitizeContent(content);
  }
}
