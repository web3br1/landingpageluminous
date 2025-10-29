"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { z } from "zod";
import { useFormWithValidation } from "@/lib/hooks/use-form-with-validation";
import { FormField } from "./form-field";
import { FormButton } from "./form-button";
import { FadeUp } from "@/app/(marketing)/components/ui/fade-up";
import { Section } from "@/app/(marketing)/components/ui/section";

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

interface AdvancedFormProps<T extends Record<string, any>> {
  title?: string;
  subtitle?: string;
  fields: FormFieldConfig[];
  schema: z.ZodSchema<T>;
  defaultValues?: Partial<T>;
  submitText?: string;
  loadingText?: string;
  successMessage?: string;
  privacyText?: string;
  sectionId?: string;
  rateLimit?: {
    maxAttempts: number;
    windowMs: number;
    blockDurationMs: number;
  };
  backendRateLimit?: {
    action: string;
    maxRetries?: number;
    retryDelay?: number;
    fallbackToClient?: boolean;
    clientFallbackConfig?: {
      maxAttempts: number;
      windowMs: number;
      blockDurationMs: number;
    };
  };
  sanitizeInputs?: boolean;
  // Contract: onSubmit MUST return a Promise for predictable async behavior
  onSubmit: (data: T) => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: any) => void;
  className?: string;
}

interface FormSuccessState {
  isVisible: boolean;
  message: string;
}

export function AdvancedForm<T extends Record<string, any>>({
  title,
  subtitle,
  fields,
  schema,
  defaultValues,
  submitText = "Enviar",
  loadingText = "Enviando...",
  successMessage = "Mensagem enviada com sucesso!",
  privacyText,
  sectionId = "advanced-form",
  rateLimit = {
    maxAttempts: 5,
    windowMs: 60000, // 1 minute
    blockDurationMs: 300000, // 5 minutes
  },
  backendRateLimit = undefined,
  sanitizeInputs = true,
  onSubmit,
  onSuccess,
  onError,
  className = "",
}: AdvancedFormProps<T>) {
  // Standardized form state contract
  const [status, setStatus] = useState<FormStatus>("idle");

  const [successState, setSuccessState] = useState<FormSuccessState>({
    isVisible: false,
    message: successMessage,
  });

  // Screen reader announcements for status changes
  const [srAnnouncement, setSrAnnouncement] = useState<string>("");

  const form = useFormWithValidation({
    schema,
    defaultValues,
    rateLimit,
    backendRateLimit,
    sanitizeInputs,
    onSubmitSuccess: (data: any) => {
      // Contract: Synchronize states - set success state and clear submitting state
      console.log("✅ onSubmitSuccess called with:", data);
      setStatus("success");
      setSuccessState({ isVisible: true, message: successMessage });
      setSrAnnouncement("Formulário enviado com sucesso");
      onSuccess?.();
    },
    onSubmitError: (error: any) => {
      // Contract: Synchronize states - reset both local status and hook state on error
      console.log("❌ onSubmitError called with:", error);
      setStatus("idle");
      setSrAnnouncement(
        "Erro ao enviar formulário. Verifique os campos e tente novamente.",
      );
      console.error("Form submission error:", error);
      onError?.(error);
    },
  });

  // Reset form state for retry (exported for testing)
  const resetForm = () => {
    setStatus("idle");
    setSuccessState({ isVisible: false, message: successMessage });
    setSrAnnouncement("");
  };

  // Get rate limit block reason
  const getBlockReason = () => {
    if (!form.rateLimitState.isBlocked) return undefined;

    const timeMs = (form.rateLimitState as any).timeUntilUnblock || 0;
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
              name={field.name as any}
              label={field.label}
              type={field.type}
              placeholder={field.placeholder}
              required={field.required}
              options={field.options}
              error={form.getFieldErrorMessage(field.name as any)}
              value={form.watch(field.name as any) as string}
              onChange={(value) =>
                form.setValue(field.name as any, value as any)
              }
              onBlur={() => form.trigger(field.name as any)}
              disabled={form.formState.isSubmitting}
              rows={field.rows}
              delay={index * 0.1}
            />
          ))}

          <FormButton
            isLoading={status === "submitting" || form.formState.isSubmitting}
            isDisabled={
              !form.canSubmit ||
              status === "submitting" ||
              form.formState.isSubmitting
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
