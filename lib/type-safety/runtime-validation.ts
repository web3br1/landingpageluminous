/**
 * Runtime Type Validation System
 * Combines Zod schemas with type guards for comprehensive validation
 */

import { z } from "zod";
import {
  isString,
  isNumber,
  isBoolean,
  isArray,
  isObject,
  isEmail,
  isURL,
  isUUID,
  isPageType,
  isSectionId,
  ValidationOutcome,
  createValidationSuccess,
  createValidationError,
} from "./type-guards";

// ===== ENHANCED ZOD SCHEMAS =====

export const StrictStringSchema = z.string().min(1).trim();

export const EmailSchema = z
  .string()
  .refine(isEmail, "Invalid email format")
  .transform((email) => email.toLowerCase().trim());

export const URLSchema = z.string().refine(isURL, "Invalid URL format");

export const UUIDSchema = z.string().refine(isUUID, "Invalid UUID format");

export const PageTypeSchema = z
  .string()
  .refine(isPageType, "Invalid page type");

export const SectionIdSchema = z
  .string()
  .refine(isSectionId, "Invalid section ID");

// ===== COMPOSITION SCHEMAS =====

export const CompositionContextSchema = z
  .object({
    userId: z.string().optional(),
    sessionId: z.string().optional(),
    tenantId: z.string().optional(),
    experimentId: z.string().optional(),
    experimentVariant: z.string().optional(),
    locale: z.string().default("pt-BR"),
    timezone: z.string().optional(),
    userAgent: z.string().optional(),
    referrer: z.string().optional(),
    utm: z
      .object({
        source: z.string().optional(),
        medium: z.string().optional(),
        campaign: z.string().optional(),
        term: z.string().optional(),
        content: z.string().optional(),
      })
      .optional(),
  })
  .strict();

export const SectionContentSchema = z
  .object({
    variant: z.object({
      id: z.string(),
      data: z.object({}).catchall(z.unknown()),
    }),
    metadata: z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
        keywords: z.array(z.string()).optional(),
        priority: z.number().min(0).max(1).optional(),
      })
      .optional(),
    experiments: z
      .array(
        z.object({
          id: z.string(),
          variant: z.string(),
          weight: z.number().min(0).max(1),
        }),
      )
      .optional(),
  })
  .strict();

export const SectionConfigSchema = z
  .object({
    id: SectionIdSchema,
    component: z.string(),
    content: SectionContentSchema,
    order: z.number().int().min(0),
    enabled: z.boolean().default(true),
    conditional: z
      .object({
        showIf: z.object({}).catchall(z.unknown()).optional(),
        hideIf: z.object({}).catchall(z.unknown()).optional(),
      })
      .optional(),
  })
  .strict();

export const PageCompositionSchema = z
  .object({
    sections: z.array(SectionConfigSchema),
    metadata: z.object({
      title: z.string(),
      description: z.string(),
      keywords: z.array(z.string()),
      canonical: z.string().url().optional(),
      ogImage: z.string().url().optional(),
      twitterCard: z.string().optional(),
      structuredData: z.object({}).catchall(z.unknown()).optional(),
    }),
    experiments: z
      .array(
        z.object({
          id: z.string(),
          variant: z.string(),
          conversion: z.boolean().optional(),
        }),
      )
      .optional(),
    analytics: z.object({
      pageType: PageTypeSchema,
      conversionGoals: z.array(z.string()),
      customEvents: z.array(z.string()).optional(),
    }),
  })
  .strict();

// ===== VALIDATION FUNCTIONS =====

export function validateCompositionContext(
  data: unknown,
): ValidationOutcome<z.infer<typeof CompositionContextSchema>> {
  try {
    const result = CompositionContextSchema.parse(data);
    return createValidationSuccess(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(
        (err) => `${err.path.join(".")}: ${err.message}`,
      );
      return createValidationError(errors);
    }
    return createValidationError(["Invalid composition context"]);
  }
}

export function validateSectionContent(
  data: unknown,
): ValidationOutcome<z.infer<typeof SectionContentSchema>> {
  try {
    const result = SectionContentSchema.parse(data);
    return createValidationSuccess(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(
        (err) => `${err.path.join(".")}: ${err.message}`,
      );
      return createValidationError(errors);
    }
    return createValidationError(["Invalid section content"]);
  }
}

export function validateSectionConfig(
  data: unknown,
): ValidationOutcome<z.infer<typeof SectionConfigSchema>> {
  try {
    const result = SectionConfigSchema.parse(data);
    return createValidationSuccess(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(
        (err) => `${err.path.join(".")}: ${err.message}`,
      );
      return createValidationError(errors);
    }
    return createValidationError(["Invalid section config"]);
  }
}

export function validatePageComposition(
  data: unknown,
): ValidationOutcome<z.infer<typeof PageCompositionSchema>> {
  try {
    const result = PageCompositionSchema.parse(data);
    return createValidationSuccess(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(
        (err) => `${err.path.join(".")}: ${err.message}`,
      );
      return createValidationError(errors);
    }
    return createValidationError(["Invalid page composition"]);
  }
}

// ===== TYPE-SAFE VALIDATION UTILITIES =====

export function validateAndTransform<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context = "validation",
): ValidationOutcome<T> {
  try {
    const result = schema.parse(data);
    return createValidationSuccess(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map(
        (err) =>
          `${context}${err.path.length > 0 ? `.${err.path.join(".")}` : ""}: ${err.message}`,
      );
      return createValidationError(errors);
    }

    const message =
      error instanceof Error ? error.message : "Unknown validation error";
    return createValidationError([`${context}: ${message}`]);
  }
}

export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): { success: true; data: T } | { success: false; error: string } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    const message =
      error instanceof z.ZodError
        ? error.issues.map((err) => err.message).join(", ")
        : "Validation failed";
    return { success: false, error: message };
  }
}

// ===== RUNTIME TYPE ASSERTIONS =====

export function assertValidCompositionContext(
  data: unknown,
): asserts data is z.infer<typeof CompositionContextSchema> {
  const result = validateCompositionContext(data);
  if (!result.success) {
    throw new Error(`Invalid composition context: ${result.errors.join(", ")}`);
  }
}

export function assertValidSectionContent(
  data: unknown,
): asserts data is z.infer<typeof SectionContentSchema> {
  const result = validateSectionContent(data);
  if (!result.success) {
    throw new Error(`Invalid section content: ${result.errors.join(", ")}`);
  }
}

export function assertValidSectionConfig(
  data: unknown,
): asserts data is z.infer<typeof SectionConfigSchema> {
  const result = validateSectionConfig(data);
  if (!result.success) {
    throw new Error(`Invalid section config: ${result.errors.join(", ")}`);
  }
}

export function assertValidPageComposition(
  data: unknown,
): asserts data is z.infer<typeof PageCompositionSchema> {
  const result = validatePageComposition(data);
  if (!result.success) {
    throw new Error(`Invalid page composition: ${result.errors.join(", ")}`);
  }
}

// ===== TYPE-SAFE DATA TRANSFORMATION =====

export function createTypeSafeObject<T extends Record<string, unknown>>(
  schema: z.ZodSchema<T>,
  data: unknown,
  defaults: Partial<T> = {},
): T {
  const dataObject =
    typeof data === "object" && data !== null
      ? (data as Record<string, unknown>)
      : {};
  const merged = { ...defaults, ...dataObject };
  const result = safeParse(schema, merged);

  if (!result.success) {
    throw new Error(`Type validation failed: ${result.error}`);
  }

  return result.data;
}

export function transformWithValidation<T, U>(
  input: T,
  transformer: (data: T) => U,
  validator: (data: U) => ValidationOutcome<U>,
): ValidationOutcome<U> {
  try {
    const transformed = transformer(input);
    return validator(transformed);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Transformation failed";
    return createValidationError([message]);
  }
}

// ===== CONFIGURATION VALIDATION =====

export interface ValidationConfig {
  strictMode: boolean;
  failOnFirstError: boolean;
  customValidators: Record<string, (value: unknown) => boolean>;
}

export const defaultValidationConfig: ValidationConfig = {
  strictMode: true,
  failOnFirstError: false,
  customValidators: {},
};

export function validateWithConfig<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  config: Partial<ValidationConfig> = {},
): ValidationOutcome<T> {
  const mergedConfig = { ...defaultValidationConfig, ...config };

  try {
    const result = schema.parse(data);
    return createValidationSuccess(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = mergedConfig.failOnFirstError
        ? [error.issues[0].message]
        : error.issues.map((err) => err.message);

      return createValidationError(errors);
    }

    return createValidationError(["Validation failed"]);
  }
}

// ===== PERFORMANCE OPTIMIZED VALIDATION =====

const validationCache = new Map<
  string,
  { schema: z.ZodSchema<any>; result: any }
>();

export function cachedValidation<T>(
  cacheKey: string,
  schema: z.ZodSchema<T>,
  data: unknown,
  ttlMs = 300000, // 5 minutes
): ValidationOutcome<T> {
  const now = Date.now();
  const cached = validationCache.get(cacheKey);

  if (cached && now - cached.result.timestamp < ttlMs) {
    // Return cached result if data matches
    if (JSON.stringify(data) === JSON.stringify(cached.result.input)) {
      return cached.result.outcome;
    }
  }

  const outcome = validateAndTransform(schema, data);

  validationCache.set(cacheKey, {
    schema,
    result: {
      input: data,
      outcome,
      timestamp: now,
    },
  });

  return outcome;
}
