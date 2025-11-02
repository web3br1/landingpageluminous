/**
 * Composer Validation Module - Sprint T6
 * Validation utilities for content composers
 */

import { z } from "zod";

/**
 * Base validation schema for composer inputs
 */
export const BaseComposerInputSchema = z.object({
  locale: z.string().optional(),
  preview: z.boolean().optional(),
  experimentId: z.string().optional(),
  variant: z.string().optional(),
});

/**
 * Content validation result
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: z.ZodError;
}

/**
 * Generic composer validator
 */
export function validateComposerInput<T>(
  schema: z.ZodSchema<T>,
  input: unknown
): ValidationResult<T> {
  try {
    const data = schema.parse(input);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Safe composer execution wrapper
 */
export async function safeComposerExecution<T>(
  composer: () => Promise<T>,
  fallback?: T
): Promise<T> {
  try {
    return await composer();
  } catch (error) {
    console.warn("[ComposerValidation] Composer execution failed:", error);
    if (fallback !== undefined) {
      return fallback;
    }
    throw error;
  }
}

/**
 * Content sanitization utilities
 */
export const ContentSanitizer = {
  /**
   * Sanitize HTML content
   */
  sanitizeHtml: (html: string): string => {
    // Basic HTML sanitization - remove script tags and dangerous attributes
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/javascript:/gi, '');
  },

  /**
   * Sanitize text content
   */
  sanitizeText: (text: string): string => {
    return text.replace(/[<>'"&]/g, (char) => {
      const entities: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      };
      return entities[char] || char;
    });
  },

  /**
   * Validate URL
   */
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Content validation schemas for common types
 */
export const ContentValidationSchemas = {
  /**
   * Basic content validation
   */
  basicContent: z.object({
    title: z.string().min(1).max(200),
    subtitle: z.string().optional(),
    description: z.string().optional(),
  }),

  /**
   * CTA validation
   */
  cta: z.object({
    text: z.string().min(1).max(50),
    link: z.string().url().optional(),
    variant: z.enum(['primary', 'secondary', 'outline']).optional(),
  }),

  /**
   * Feature validation
   */
  feature: z.object({
    icon: z.string().min(1),
    title: z.string().min(1).max(100),
    description: z.string().min(1).max(300),
    highlight: z.boolean().optional(),
  }),

  /**
   * Image validation
   */
  image: z.object({
    src: z.string().url(),
    alt: z.string().min(1),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
  }),

  /**
   * Video validation
   */
  video: z.object({
    title: z.string().min(1),
    src: z.string().url().optional(),
    videoId: z.string().optional(),
    poster: z.string().url().optional(),
    duration: z.string().optional(),
    format: z.enum(['youtube', 'local']).optional(),
  }).refine(
    (video) => video.src || (video.videoId && video.format === 'youtube'),
    "Video must have either src or videoId with youtube format"
  ),
};

/**
 * Base schema for any content block
 */
export const ContentBlockSchema = z.object({
  id: z.string().optional(),
  type: z.string(),
  metadata: z.record(z.any()).optional(),
});

/**
 * Schema for a content envelope, which wraps a content block
 */
export const ContentEnvelopeSchema = z.object({
  block: ContentBlockSchema,
  // Add any envelope-specific metadata here, e.g., A/B test info, personalization rules
  envelopeMeta: z.record(z.any()).optional(),
});

/**
 * Strict validation for a single content envelope
 */
export function validateEnvelopeStrict<T extends z.ZodSchema>(
  envelope: unknown,
  blockSchema: T
): ReturnType<typeof combinedSchema.safeParse> {
  const combinedSchema = ContentEnvelopeSchema.extend({
    block: blockSchema,
  });
  return combinedSchema.safeParse(envelope);
}

/**
 * A more lenient validation for a content block that might be directly passed
 */
export function validateContentBlockLax<T extends z.ZodSchema>(
  content: unknown,
  blockSchema: T
): ReturnType<T["safeParse"]> {
  return blockSchema.safeParse(content) as ReturnType<T["safeParse"]>;
}

/**
 * Type guard for validated content
 */
export function isContentValid<T>(
  result: ReturnType<z.ZodSchema<T>["safeParse"]>
): result is { success: true; data: T } {
  return result.success;
}

/**
 * ComposerGuard class for runtime validation
 */
export class ComposerGuard {
  static validate<T extends z.ZodSchema>(
    data: unknown,
    schema: T,
    context: string = "Unknown"
  ): z.infer<T> {
    const result = schema.safeParse(data);
    if (!result.success) {
      console.error(`[ComposerGuard] Validation failed for ${context}:`, result.error.issues);
      throw new Error(`Invalid content for ${context}: ${result.error.issues.map(i => i.message).join(", ")}`);
    }
    return result.data;
  }

  static validateEnvelope<T extends z.ZodSchema>(
    envelope: unknown,
    blockSchema: T,
    context: string = "Unknown"
  ): any {
    const result = validateEnvelopeStrict(envelope, blockSchema);
    if (!result.success) {
      console.error(`[ComposerGuard] Envelope validation failed for ${context}:`, result.error.issues);
      throw new Error(`Invalid envelope for ${context}: ${result.error.issues.map(i => i.message).join(", ")}`);
    }
    return result.data;
  }
}

/**
 * Validation error formatter
 */
export function formatValidationErrors(error: z.ZodError): string[] {
  return (error as any).errors.map((err: any) => {
    const path = err.path.join('.');
    return `${path}: ${err.message}`;
  });
}

/**
 * Export ComposerValidation as an alias for backward compatibility
 */
export const ComposerValidation = {
  validateEnvelopeStrict,
  validateContentBlockLax,
  isContentValid,
  ComposerGuard,
};

/**
 * Validate page composition structure
 */
export function validatePageComposition(
  composition: unknown
): { success: boolean; errors?: string[] } {
  try {
    if (!composition || typeof composition !== "object") {
      return { success: false, errors: ["Composition must be an object"] };
    }

    const comp = composition as Record<string, unknown>;

    // Check for required sections
    const requiredSections = ["hero", "benefits", "pricing"];
    const missingSections = requiredSections.filter(section => !comp[section]);

    if (missingSections.length > 0) {
      return {
        success: false,
        errors: [`Missing required sections: ${missingSections.join(", ")}`]
      };
    }

    // Validate each section has proper structure
    const errors: string[] = [];
    for (const [sectionName, sectionData] of Object.entries(comp)) {
      if (!sectionData || typeof sectionData !== "object") {
        errors.push(`Section '${sectionName}' must be an object`);
        continue;
      }

      const section = sectionData as Record<string, unknown>;
      if (!section.content) {
        errors.push(`Section '${sectionName}' missing content property`);
      }
    }

    return errors.length === 0 ? { success: true } : { success: false, errors };
  } catch (error) {
    return {
      success: false,
      errors: [`Validation error: ${error instanceof Error ? error.message : "Unknown error"}`]
    };
  }
}

/**
 * HOC for composition validation - wraps async composer functions with error handling
 */
export async function withCompositionValidation<T>(
  composerFn: () => Promise<T>,
  composerId: string = "unknown"
): Promise<T> {
  try {
    const result = await composerFn();

    // Basic validation - ensure result has expected structure
    if (!result || typeof result !== "object") {
      throw new Error(`Composer ${composerId} returned invalid result: ${typeof result}`);
    }

    // Log success for debugging
    console.debug(`[Composition:${composerId}] Validation passed`);

    return result;
  } catch (error) {
    console.error(`[Composition:${composerId}] Validation failed:`, error);

    // Re-throw with context
    if (error instanceof Error) {
      throw new Error(`Composer ${composerId} failed: ${error.message}`);
    }

    throw new Error(`Composer ${composerId} failed with unknown error`);
  }
}