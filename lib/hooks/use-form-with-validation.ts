import { useState, useCallback, useRef } from "react";
import {
  useForm,
  UseFormProps,
  UseFormReturn,
  FieldValues,
  Path,
  FieldError,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { sanitizeInput } from "@/lib/security/input-sanitizer";
import { useBackendRateLimiting } from "./use-backend-rate-limiting";

// Rate limiting configuration
interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number; // Time window in milliseconds
  blockDurationMs: number; // How long to block after exceeding limit
}

interface RateLimitState {
  attempts: number;
  windowStart: number;
  isBlocked: boolean;
  blockUntil: number;
}

interface FormConfig<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  defaultValues?: Partial<T>;
  mode?: UseFormProps<T>["mode"];
  rateLimit?: RateLimitConfig;
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
  onSubmitSuccess?: (data: T) => Promise<void> | void;
  onSubmitError?: (error: any) => void;
}

interface FormState {
  isSubmitting: boolean;
  isSuccess: boolean;
  submitCount: number;
  lastSubmitTime: number;
}

interface UseFormWithValidationReturn {
  // React Hook Form methods
  register: any;
  handleSubmit: (
    onValid: (data: any) => Promise<void> | void,
    onInvalid?: (errors: any) => void,
  ) => (e?: React.FormEvent) => Promise<void>;
  watch: any;
  getValues: any;
  setValue: any;
  trigger: any;
  formState: any;

  // Rate limiting
  rateLimitState: RateLimitState;

  // Utility methods
  resetForm: () => void;
  sanitizeField: (name: Path<any>, value: string) => string;
  canSubmit: boolean;
  getFieldErrorMessage: (name: Path<any>) => string | undefined;
}

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxAttempts: 5,
  windowMs: 60000, // 1 minute
  blockDurationMs: 300000, // 5 minutes
};

/**
 * Enhanced form hook with Zod validation, rate limiting, and input sanitization
 */
export function useFormWithValidation({
  schema,
  defaultValues,
  mode = "onSubmit",
  rateLimit = DEFAULT_RATE_LIMIT,
  backendRateLimit,
  sanitizeInputs = true,
  onSubmitSuccess,
  onSubmitError,
}: any): UseFormWithValidationReturn {
  const [formState, setFormState] = useState<FormState>({
    isSubmitting: false,
    isSuccess: false,
    submitCount: 0,
    lastSubmitTime: 0,
  });

  const [rateLimitState, setRateLimitState] = useState<RateLimitState>({
    attempts: 0,
    windowStart: Date.now(),
    isBlocked: false,
    blockUntil: 0,
  });

  // Backend rate limiting hook
  const backendRateLimitingHook = useBackendRateLimiting(
    backendRateLimit
      ? {
          action: backendRateLimit.action,
          maxRetries: backendRateLimit.maxRetries,
          retryDelay: backendRateLimit.retryDelay,
          fallbackToClient: backendRateLimit.fallbackToClient ?? true,
          clientFallbackConfig: backendRateLimit.clientFallbackConfig || {
            maxAttempts: rateLimit.maxAttempts,
            windowMs: rateLimit.windowMs,
            blockDurationMs: rateLimit.blockDurationMs,
          },
        }
      : {
          action: "form_submit",
          fallbackToClient: true,
          clientFallbackConfig: {
            maxAttempts: rateLimit.maxAttempts,
            windowMs: rateLimit.windowMs,
            blockDurationMs: rateLimit.blockDurationMs,
          },
        },
  );

  // Ensure default values are never undefined to prevent controlled/uncontrolled input issues
  const safeDefaultValues = defaultValues || {};

  // Use React Hook Form with Zod resolver
  const form = useForm({
    mode,
    resolver: zodResolver(schema),
    defaultValues: safeDefaultValues,
  });

  // Check if submission is allowed based on rate limiting
  const checkRateLimit = useCallback(() => {
    const now = Date.now();

    // If currently blocked, check if block period has expired
    if (rateLimitState.isBlocked) {
      if (now >= rateLimitState.blockUntil) {
        // Reset rate limit state
        setRateLimitState({
          attempts: 0,
          windowStart: now,
          isBlocked: false,
          blockUntil: 0,
        });
        return true;
      }
      return false;
    }

    // Check if we're in a new time window
    if (now - rateLimitState.windowStart >= rateLimit.windowMs) {
      // Reset attempts for new window
      setRateLimitState((prev) => ({
        ...prev,
        attempts: 0,
        windowStart: now,
      }));
      return true;
    }

    // Check if we've exceeded max attempts
    if (rateLimitState.attempts >= rateLimit.maxAttempts) {
      // Block submissions
      setRateLimitState((prev) => ({
        ...prev,
        isBlocked: true,
        blockUntil: now + rateLimit.blockDurationMs,
      }));
      return false;
    }

    return true;
  }, [rateLimit, rateLimitState]);

  // Sanitize field value
  const sanitizeField = useCallback(
    (name: Path<any>, value: string): string => {
      if (!sanitizeInputs) return value;

      // Basic sanitization for now (can be enhanced later with schema analysis)
      const fieldName = String(name);
      if (fieldName.toLowerCase().includes("email")) {
        // Email field - basic sanitization
        return sanitizeInput(value, { maxLength: 254 });
      }
      // Default sanitization
      return sanitizeInput(value, { maxLength: 1000 });
    },
    [sanitizeInputs],
  );

  // Enhanced submit handler with backend rate limiting and error handling
  const handleSubmit = useCallback(
    (
      onValid: (data: any) => Promise<void> | void,
      onInvalid?: (errors: any) => void,
    ) => {
      return async (e?: React.FormEvent) => {
        if (e) {
          e.preventDefault();
        }

        // Check backend rate limiting first
        if (backendRateLimit) {
          try {
            const rateLimitAllowed = await backendRateLimitingHook.checkLimit();
            if (!rateLimitAllowed) {
              const error = new Error(
                "Rate limit exceeded. Please try again later.",
              );
              onSubmitError?.(error);
              return;
            }
          } catch (error) {
            // If backend check fails, fall back to client-side check
            if (!checkRateLimit()) {
              onSubmitError?.(
                new Error("Rate limit exceeded. Please try again later."),
              );
              return;
            }
          }
        } else {
          // Only client-side rate limiting
          if (!checkRateLimit()) {
            onSubmitError?.(
              new Error("Rate limit exceeded. Please try again later."),
            );
            return;
          }
        }

        // Update client-side rate limit attempts
        setRateLimitState((prev) => ({
          ...prev,
          attempts: prev.attempts + 1,
        }));

        // Set submitting state
        setFormState((prev) => ({
          ...prev,
          isSubmitting: true,
          isSuccess: false,
        }));

        try {
          // Use React Hook Form's handleSubmit
          await form.handleSubmit(
            async (data) => {
              try {
                // Sanitize inputs if enabled
                if (sanitizeInputs) {
                  Object.keys(data).forEach((key) => {
                    if (typeof data[key] === "string") {
                      data[key] = sanitizeField(
                        key as Path<any>,
                        data[key] as string,
                      ) as any;
                    }
                  });
                }

                // Call user submit handler
                await onValid(data as any);

                // Report successful usage to backend
                if (backendRateLimit) {
                  await backendRateLimitingHook.reportUsage(true, {
                    formData: Object.keys(data), // Don't send actual data for privacy
                    timestamp: Date.now(),
                  });
                }

                // Call success callback
                await onSubmitSuccess?.(data as any);

                // Update form state
                setFormState((prev) => ({
                  ...prev,
                  isSubmitting: false,
                  isSuccess: true,
                  submitCount: prev.submitCount + 1,
                  lastSubmitTime: Date.now(),
                }));

                // Reset rate limit on successful submission
                setRateLimitState((prev) => ({
                  ...prev,
                  attempts: 0,
                }));
              } catch (error) {
                // Report failed usage to backend
                if (backendRateLimit) {
                  await backendRateLimitingHook.reportUsage(false, {
                    error:
                      error instanceof Error ? error.message : "Unknown error",
                    timestamp: Date.now(),
                  });
                }

                // Handle submit error
                setFormState((prev) => ({
                  ...prev,
                  isSubmitting: false,
                }));

                onSubmitError?.(error);
              }
            },
            (errors) => {
              // Handle validation errors
              setFormState((prev) => ({
                ...prev,
                isSubmitting: false,
              }));

              onInvalid?.(errors as any);
            },
          )(e);
        } catch (error) {
          setFormState((prev) => ({
            ...prev,
            isSubmitting: false,
          }));

          onSubmitError?.(error);
        }
      };
    },
    [
      form,
      backendRateLimit,
      checkRateLimit,
      sanitizeInputs,
      sanitizeField,
      onSubmitSuccess,
      onSubmitError,
    ],
  );

  // Reset form state
  const resetForm = useCallback(() => {
    form.reset();
    setFormState({
      isSubmitting: false,
      isSuccess: false,
      submitCount: 0,
      lastSubmitTime: 0,
    });
    setRateLimitState({
      attempts: 0,
      windowStart: Date.now(),
      isBlocked: false,
      blockUntil: 0,
    });
  }, [form]);

  // Get field error message
  const getFieldErrorMessage = useCallback(
    (name: Path<any>): string | undefined => {
      const error = form.formState.errors[name] as any;
      return error?.message;
    },
    [form.formState.errors],
  );

  // Check if form can be submitted
  const canSubmit =
    !formState.isSubmitting &&
    !rateLimitState.isBlocked &&
    !form.formState.isSubmitting;

  return {
    register: form.register,
    handleSubmit,
    watch: form.watch,
    getValues: form.getValues,
    setValue: form.setValue,
    trigger: form.trigger,
    formState: {
      ...form.formState,
      ...formState,
    },
    rateLimitState,
    resetForm,
    sanitizeField,
    canSubmit,
    getFieldErrorMessage,
  };
}
