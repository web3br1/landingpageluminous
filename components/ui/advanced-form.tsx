"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { useFormWithValidation } from "@/lib/hooks/use-form-with-validation";
import { FormField } from "./form-field";
import { FormButton } from "./form-button";
import { FadeUp } from "@/components/ui/fade-up-optimized";
import { Section } from "@/app/(marketing)/components/ui/section";
import { createPropValidator } from "../../lib/architecture/component-props";
import { withComponentContext } from "../../lib/architecture/logger-pattern";

// Cache for form validation schemas (performance optimization)
const formSchemaCache = new Map<string, z.ZodSchema<any>>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

interface FormFieldConfig {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "select" | "textarea";
  placeholder?: string;
  required?: boolean;
  options?: string[] | Array<{ value: string; label: string }>;
  rows?: number;
}

// Form state contract - standardized across all forms
export type FormStatus = "idle" | "submitting" | "success" | "error";

// Schema for AdvancedForm props validation
const AdvancedFormPropsSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  fields: z.array(z.object({
    name: z.string().min(1, "Field name is required"),
    label: z.string().min(1, "Field label is required"),
    type: z.enum(["text", "email", "tel", "select", "textarea"]).optional().default("text"),
    placeholder: z.string().optional(),
    required: z.boolean().optional().default(false),
    options: z.union([
      z.array(z.string()),
      z.array(z.object({ value: z.string(), label: z.string() }))
    ]).optional(),
    rows: z.number().min(1).optional(),
  })).min(1, "At least one field is required"),
  schema: z.any(), // Zod schema - validated at runtime
  defaultValues: z.record(z.string(), z.unknown()).optional(),
  sanitizeInputs: z.boolean().optional().default(true),
  submitText: z.string().optional().default("Enviar"),
  loadingText: z.string().optional().default("Enviando..."),
  successMessage: z.string().optional().default("Mensagem enviada com sucesso!"),
  privacyText: z.string().optional(),
  sectionId: z.string().optional(),
  rateLimit: z.object({
    maxAttempts: z.number().min(1),
    windowMs: z.number().min(1000),
    blockDurationMs: z.number().min(1000),
  }).optional(),
  backendRateLimit: z.object({
    action: z.string().min(1),
    maxRetries: z.number().min(0).optional().default(3),
    retryDelay: z.number().min(0).optional().default(1000),
    fallbackToClient: z.boolean().optional().default(false),
    clientFallbackConfig: z.object({
      maxAttempts: z.number().min(1),
      windowMs: z.number().min(1000),
      blockDurationMs: z.number().min(1000),
    }).optional(),
  }).optional(),
  onSubmit: z.any().optional(),
  onValidationError: z.any().optional(),
  onSubmitSuccess: z.any().optional(),
  onSubmitError: z.any().optional(),
  className: z.string().optional(),
});

export interface AdvancedFormProps<T extends Record<string, unknown>> extends z.infer<typeof AdvancedFormPropsSchema> {
  schema: z.ZodSchema<T>;
  onSubmit?: (data: T) => Promise<void>;
  onValidationError?: (errors: Array<{ field: string; message: string }>) => void;
}

// Create prop validator for AdvancedForm component
const advancedFormPropValidator = createPropValidator(AdvancedFormPropsSchema, "AdvancedForm", {
  logErrors: true,
  throwOnError: false,
  fallbackValues: {
    submitText: "Enviar",
    loadingText: "Enviando...",
    successMessage: "Mensagem enviada com sucesso!",
    sanitizeInputs: true,
  },
});

interface FormSuccessState {
  isVisible: boolean;
  message: string;
}

function AdvancedForm<T extends Record<string, unknown>>(props: AdvancedFormProps<T>) {
  // Component-specific logger
  const logger = withComponentContext("AdvancedForm");

  // Validate props using the component-props pattern
  const validatedProps = advancedFormPropValidator.validateWithFallback(props, {
    submitText: "Enviar",
    loadingText: "Enviando...",
    successMessage: "Mensagem enviada com sucesso!",
  });

  // Log prop validation if there were issues
  const validationResult = advancedFormPropValidator.validate(props);
  if (!validationResult.success && validationResult.errors.length > 0) {
    logger.warn("AdvancedForm props validation failed, using fallbacks", {
      errors: validationResult.errors.length,
      fieldsCount: validatedProps.fields.length,
      hasRateLimit: !!validatedProps.rateLimit,
      hasBackendRateLimit: !!validatedProps.backendRateLimit,
    });
  }

  // Cache schema for performance
  const schemaCacheKey = `form_${validatedProps.fields.map(f => f.name).sort().join('_')}`;
  const cachedSchema = formSchemaCache.get(schemaCacheKey);

  const effectiveSchema = useMemo(() => {
    if (cachedSchema && (Date.now() - (cachedSchema as any)._cacheTime) < CACHE_TTL) {
      logger.debug("Using cached form schema", { cacheKey: schemaCacheKey });
      return cachedSchema;
    }

    logger.debug("Creating fresh form schema", { cacheKey: schemaCacheKey });
    const freshSchema = validatedProps.schema;
    (freshSchema as any)._cacheTime = Date.now();
    formSchemaCache.set(schemaCacheKey, freshSchema);

    return freshSchema;
  }, [validatedProps.schema, schemaCacheKey, logger]);

  const {
    title,
    subtitle,
    fields,
    defaultValues,
    submitText,
    loadingText,
  successMessage,
  privacyText,
  sectionId,
  rateLimit,
  backendRateLimit,
  onSubmit,
  onValidationError,
  className,
  } = validatedProps;

  // Log component initialization
  React.useEffect(() => {
    logger.info("AdvancedForm initialized", {
      fieldsCount: fields.length,
      hasRateLimit: !!rateLimit,
      hasBackendRateLimit: !!backendRateLimit,
      schemaCached: !!cachedSchema,
    });
  }, [fields.length, rateLimit, backendRateLimit, cachedSchema, logger]);

  // Use effective schema instead of the original schema
  const formHook = useFormWithValidation({
    schema: effectiveSchema,
    defaultValues,
  });

  // Override the submit handler to add logging
  const handleSubmit = React.useCallback(async (data: T) => {
    const startTime = performance.now();
    setStatus("submitting");

    logger.info("AdvancedForm submission started", {
      fieldsCount: fields.length,
      hasRateLimit: !!rateLimit,
    });

    try {
      await onSubmit?.(data);

      const duration = performance.now() - startTime;
      logger.info("AdvancedForm submission successful", {
        duration: Math.round(duration),
        fieldsCount: fields.length,
      });

      setStatus("success");
      setSuccessState({ isVisible: true, message: successMessage });
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error("AdvancedForm submission failed", error, {
        duration: Math.round(duration),
        fieldsCount: fields.length,
      });

      setStatus("error");
      onValidationError?.([{ field: "submit", message: "Erro ao enviar formulário" }]);
    }
  }, [onSubmit, successMessage, onValidationError, fields.length, rateLimit, logger]);

  // Continue with form state management
  const [successState, setSuccessState] = useState<FormSuccessState>({
    isVisible: false,
    message: successMessage,
  });

  // Screen reader announcements for status changes
  const [srAnnouncement, setSrAnnouncement] = useState<string>("");

  // Form status state
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const { formState: hookFormState, ...form } = useFormWithValidation({
    schema: validatedProps.schema,
    defaultValues: validatedProps.defaultValues,
    rateLimit: validatedProps.rateLimit,
    backendRateLimit: validatedProps.backendRateLimit,
    sanitizeInputs: validatedProps.sanitizeInputs,
    onSubmitSuccess: (data: unknown) => {
      // Contract: Synchronize states - set success state and clear submitting state
      console.log("✅ onSubmitSuccess called with:", data);
      setStatus("success");
      setSuccessState({ isVisible: true, message: successMessage });
      setSrAnnouncement("Formulário enviado com sucesso");
      validatedProps.onSubmitSuccess?.(data);
    },
    onSubmitError: (error: unknown) => {
      // Contract: Synchronize states - reset both local status and hook state on error
      console.log("❌ onSubmitError called with:", error);
      setStatus("idle");
      setSrAnnouncement(
        "Erro ao enviar formulário. Verifique os campos e tente novamente.",
      );
      console.error("Form submission error:", error);
      validatedProps.onSubmitError?.(error);
    },
  }) as any;

  // Reset form state for retry (exported for testing)
  const resetForm = () => {
    setStatus("idle");
    setSuccessState({ isVisible: false, message: successMessage });
    setSrAnnouncement("");
  };

  // Get rate limit block reason
  const getBlockReason = () => {
    if (!form.rateLimitState.isBlocked) return undefined;

    const timeMs = Math.max(0, form.rateLimitState.blockUntil - Date.now());
    const minutes = Math.floor(timeMs / 60000);
    const seconds = Math.floor((timeMs % 60000) / 1000);

    if (minutes > 0) {
      return `Muitas tentativas. Tente novamente em ${minutes}m ${seconds}s`;
    }
    return `Muitas tentativas. Tente novamente em ${seconds}s`;
  };

  if (successState.isVisible) {
    return (
      <Section id={sectionId}>
        <div className="max-w-2xl mx-auto text-center">
          <FadeUp>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-8"
            >
              <motion.div
                className="text-green-600 dark:text-green-400 mb-4"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
              >
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </motion.div>
              <motion.h3
                className="text-2xl font-bold text-green-800 dark:text-green-200 mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Sucesso!
              </motion.h3>
              <motion.p
                className="text-green-700 dark:text-green-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                {successState.message}
              </motion.p>
            </motion.div>
          </FadeUp>
        </div>
      </Section>
    );
  }

  return (
    <Section id={sectionId} className={className}>
      <div className="max-w-2xl mx-auto">
        <FadeUp>
          <div className="text-center mb-8">
            {title && (
              <h2
                id={`${sectionId}-title`}
                className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4"
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {subtitle}
              </p>
            )}
          </div>
        </FadeUp>

        {/* Screen reader status announcements - Contract requirement */}
        <div
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
          role="status"
          data-testid="form-status"
        >
          {srAnnouncement}
        </div>

        <form
          onSubmit={form.handleSubmit(
            async (data) => {
              // Contract: Set submitting state BEFORE any async operation
              setStatus("submitting");
              setSrAnnouncement("Enviando formulário...");

              try {
                await onSubmit(data);
                // Success will be handled by onSubmitSuccess callback
              } catch (error) {
                // Error will be handled by onSubmitError callback
                throw error;
              }
            },
            (errors) => {
              // Validation errors - reset submitting state
              setStatus("idle");
              setSrAnnouncement("Verifique os campos obrigatórios");
              console.error("Form validation errors:", errors);
            },
          )}
          className="space-y-6"
          noValidate
          aria-labelledby={title ? `${sectionId}-title` : undefined}
        >
          {fields.map((field, index) => (
            <FormField
              key={field.name}
              name={field.name}
              label={field.label}
              type={field.type}
              placeholder={field.placeholder}
              required={field.required}
              options={field.options}
              error={form.getFieldErrorMessage(field.name)}
              value={(form.watch(field.name) as string) || ""}
              onChange={(value) =>
                (form.setValue as any)(field.name, value)
              }
              onBlur={() => (form.trigger as any)(field.name)}
              disabled={hookFormState?.isSubmitting}
              rows={field.rows}
              delay={index * 0.1}
            />
          ))}

          <FormButton
            isLoading={status === "submitting" || hookFormState?.isSubmitting}
            isDisabled={
              !form.canSubmit ||
              status === "submitting" ||
              hookFormState?.isSubmitting
            }
            isBlocked={form.rateLimitState.isBlocked}
            blockReason={getBlockReason()}
            loadingText={loadingText}
            delay={fields.length * 0.1}
            type="submit"
          >
            {submitText}
          </FormButton>

          {/* Rate limit status indicator */}
          {form.rateLimitState.attempts > 0 &&
            !form.rateLimitState.isBlocked && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center"
              >
                Tentativas nesta sessão: {form.rateLimitState.attempts}
              </motion.div>
            )}

          {privacyText && (
            <FadeUp delay={(fields.length + 1) * 0.1}>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                {privacyText}
              </p>
            </FadeUp>
          )}
        </form>
      </div>
    </Section>
  );
}

// Export the component directly (error boundary can be added by parent components)
export { AdvancedForm };
export default AdvancedForm;
