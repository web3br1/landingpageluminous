import { useState, useEffect, useCallback } from "react";
import { useScreenReader } from "./accessibility-manager";
import { isHTMLElement } from "@/lib/utils/dom-type-guards";

interface UseAccessibleLoadingOptions {
  loadingText?: string;
  successText?: string;
  errorText?: string;
  announceOnStart?: boolean;
  announceOnSuccess?: boolean;
  announceOnError?: boolean;
}

interface UseAccessibleLoadingReturn {
  isLoading: boolean;
  error: string | null;
  startLoading: (text?: string) => void;
  stopLoading: (successText?: string) => void;
  setError: (error: string, errorText?: string) => void;
  clearError: () => void;
  reset: () => void;
}

/**
 * Hook para gerenciar estados de loading com acessibilidade
 * Fornece anúncios automáticos para screen readers e estados ARIA apropriados
 */
export function useAccessibleLoading({
  loadingText = "Carregando...",
  successText = "Operação concluída com sucesso",
  errorText = "Ocorreu um erro",
  announceOnStart = true,
  announceOnSuccess = true,
  announceOnError = true,
}: UseAccessibleLoadingOptions = {}): UseAccessibleLoadingReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setErrorState] = useState<string | null>(null);
  const { announce } = useScreenReader();

  const startLoading = useCallback(
    (text?: string) => {
      setIsLoading(true);
      setErrorState(null);

      if (announceOnStart) {
        announce(text || loadingText, "polite");
      }
    },
    [announce, announceOnStart, loadingText],
  );

  const stopLoading = useCallback(
    (successMessage?: string) => {
      setIsLoading(false);
      setErrorState(null);

      if (announceOnSuccess) {
        announce(successMessage || successText, "polite");
      }
    },
    [announce, announceOnSuccess, successText],
  );

  const setError = useCallback(
    (errorMessage: string, announceText?: string) => {
      setIsLoading(false);
      setErrorState(errorMessage);

      if (announceOnError) {
        announce(announceText || errorText, "assertive");
      }
    },
    [announce, announceOnError, errorText],
  );

  const clearError = useCallback(() => {
    setErrorState(null);
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setErrorState(null);
  }, []);

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setError,
    clearError,
    reset,
  };
}

// ===== COMPONENTES DE LOADING =====

import React from "react";
import { AccessibleSpinner, AccessibleButton } from "./accessibility-manager";

interface AccessibleLoadingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  successText?: string;
  error?: string | null;
  onClick: () => Promise<void> | void;
  children: React.ReactNode;
}

export function AccessibleLoadingButton({
  loading = false,
  loadingText = "Processando...",
  successText = "Concluído",
  error,
  onClick,
  children,
  disabled,
  ...props
}: AccessibleLoadingButtonProps) {
  const { startLoading, stopLoading, setError, reset } = useAccessibleLoading({
    loadingText,
    successText,
    announceOnSuccess: true,
    announceOnError: true,
  });

  const handleClick = async () => {
    try {
      reset();
      startLoading();
      await onClick();
      stopLoading();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    }
  };

  return (
    <AccessibleButton
      {...props}
      loading={loading}
      loadingText={loadingText}
      disabled={disabled || loading}
      onClick={handleClick}
      className={error ? "button--error" : ""}
    >
      {children}
    </AccessibleButton>
  );
}

interface AccessibleLoadingSectionProps {
  loading?: boolean;
  error?: string | null;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  children: React.ReactNode;
  loadingText?: string;
  errorText?: string;
}

export function AccessibleLoadingSection({
  loading = false,
  error,
  loadingComponent,
  errorComponent,
  children,
  loadingText = "Carregando conteúdo...",
  errorText = "Erro ao carregar conteúdo",
}: AccessibleLoadingSectionProps) {
  const { announce } = useScreenReader();

  useEffect(() => {
    if (loading) {
      announce(loadingText, "polite");
    }
  }, [loading, loadingText, announce]);

  useEffect(() => {
    if (error) {
      announce(errorText, "assertive");
    }
  }, [error, errorText, announce]);

  if (error) {
    return (
      errorComponent || (
        <div role="alert" className="loading-error">
          <p>{error}</p>
          <AccessibleButton onClick={() => window.location.reload()}>
            Tentar novamente
          </AccessibleButton>
        </div>
      )
    );
  }

  if (loading) {
    return (
      loadingComponent || (
        <div aria-live="polite" className="loading-container">
          <AccessibleSpinner size="medium" label={loadingText} />
          <span className="sr-only">{loadingText}</span>
        </div>
      )
    );
  }

  return <>{children}</>;
}

// ===== HOOK PARA FORMULÁRIOS =====

export interface FormFieldErrors {
  // Common form field errors
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  subject?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  role?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
  newsletter?: string;
  // Custom field errors
  [fieldName: string]: string | undefined;
}

export interface AccessibleFormData {
  // Common form fields
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  subject?: string;
  // User information
  firstName?: string;
  lastName?: string;
  company?: string;
  role?: string;
  // Preferences
  newsletter?: boolean;
  terms?: boolean;
  marketing?: boolean;
  // Custom form fields
  [key: string]: unknown;
}

interface UseAccessibleFormOptions {
  onSubmit: (data: AccessibleFormData) => Promise<void>;
  validateOnChange?: boolean;
  announceErrors?: boolean;
}

interface UseAccessibleFormReturn {
  isSubmitting: boolean;
  submitError: string | null;
  fieldErrors: Record<string, string>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  setFieldError: (field: string, error: string) => void;
  clearFieldError: (field: string) => void;
  clearAllErrors: () => void;
  resetForm: () => void;
}

export function useAccessibleForm({
  onSubmit,
  validateOnChange = true,
  announceErrors = true,
}: UseAccessibleFormOptions): UseAccessibleFormReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});

  const { announce } = useScreenReader();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      const data = Object.fromEntries(formData.entries());

      await onSubmit(data);

      announce("Formulário enviado com sucesso", "polite");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro ao enviar formulário";
      setSubmitError(errorMessage);

      if (announceErrors) {
        announce(`Erro no formulário: ${errorMessage}`, "assertive");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const setFieldError = useCallback(
    (field: string, error: string) => {
      setFieldErrors((prev) => ({ ...prev, [field]: error }));

      if (announceErrors) {
        announce(`Erro no campo ${field}: ${error}`, "assertive");
      }
    },
    [announce, announceErrors],
  );

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setFieldErrors({});
    setSubmitError(null);
  }, []);

  const resetForm = useCallback(() => {
    setIsSubmitting(false);
    setSubmitError(null);
    setFieldErrors({});
  }, []);

  return {
    isSubmitting,
    submitError,
    fieldErrors,
    handleSubmit,
    setFieldError,
    clearFieldError,
    clearAllErrors,
    resetForm,
  };
}

// ===== UTILITÁRIOS DE VALIDAÇÃO =====

export class FormValidator {
  static validateRequired(value: string, fieldName: string): string | null {
    if (!value.trim()) {
      return `${fieldName} é obrigatório`;
    }
    return null;
  }

  static validateEmail(email: string): string | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return "E-mail inválido";
    }
    return null;
  }

  static validateMinLength(
    value: string,
    minLength: number,
    fieldName: string,
  ): string | null {
    if (value.length < minLength) {
      return `${fieldName} deve ter pelo menos ${minLength} caracteres`;
    }
    return null;
  }

  static validateMaxLength(
    value: string,
    maxLength: number,
    fieldName: string,
  ): string | null {
    if (value.length > maxLength) {
      return `${fieldName} deve ter no máximo ${maxLength} caracteres`;
    }
    return null;
  }

  static validatePhone(phone: string): string | null {
    const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
    if (!phoneRegex.test(phone)) {
      return "Telefone deve estar no formato (XX) XXXXX-XXXX";
    }
    return null;
  }

  static async validateCPF(cpf: string): Promise<string | null> {
    // Use centralized CPF validation
    const { CPF_REGEX, validateCpfChecksum } = await import("@/lib/core/regex-patterns");

    if (!CPF_REGEX.test(cpf)) {
      return "CPF deve estar no formato XXX.XXX.XXX-XX";
    }

    if (!validateCpfChecksum(cpf)) {
      return "CPF inválido";
    }
    return null;
  }
}

// ===== FOCUS MANAGEMENT UTILITIES =====

export class FocusManager {
  private static previouslyFocusedElement: HTMLElement | null = null;

  static saveFocus() {
    this.previouslyFocusedElement = isHTMLElement(document.activeElement) ? document.activeElement : null;
  }

  static restoreFocus() {
    if (this.previouslyFocusedElement && this.previouslyFocusedElement.focus) {
      this.previouslyFocusedElement.focus();
    }
  }

  static focusFirstFocusableElement(container: HTMLElement) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    if (firstElement) {
      firstElement.focus();
    }
  }

  static focusLastFocusableElement(container: HTMLElement) {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ) as NodeListOf<HTMLElement>;

    const lastElement = focusableElements[focusableElements.length - 1];
    if (lastElement) {
      lastElement.focus();
    }
  }
}
