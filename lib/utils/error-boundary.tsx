"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { CTA } from "@/components/ui/cta-button-unified";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Log to error reporting service
    console.error("Error Boundary caught an error:", error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            resetError={this.resetError}
          />
        );
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }

    return this.props.children;
  }
}

// Default error fallback component
function DefaultErrorFallback({
  error,
  resetError,
}: {
  error?: Error;
  resetError: () => void;
}) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <AlertTriangle
            className="w-16 h-16 text-destructive"
            aria-hidden="true"
          />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            Ops! Algo deu errado
          </h2>
          <p className="text-muted-foreground">
            Desculpe pelo inconveniente. Ocorreu um erro inesperado.
          </p>
          {process.env.NODE_ENV === "development" && error && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                Detalhes do erro (desenvolvimento)
              </summary>
              <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-auto">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <CTA
            onClick={resetError}
            variant="primary"
            size="md"
            aria-label="Tentar novamente"
          >
            <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
            Tentar novamente
          </CTA>

          <CTA
            onClick={() => window.location.reload()}
            variant="secondary"
            size="md"
            aria-label="Recarregar página"
          >
            Recarregar página
          </CTA>
        </div>
      </div>
    </div>
  );
}

// Hook para usar error boundary em componentes funcionais
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error("Error caught by hook:", error, errorInfo);
    // Could send to error reporting service
  };
}

// Section-specific error boundary
interface SectionErrorBoundaryProps {
  children: React.ReactNode;
  sectionName: string;
  fallback?: React.ReactNode;
}

export function SectionErrorBoundary({
  children,
  sectionName,
  fallback,
}: SectionErrorBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={({ resetError }) =>
        fallback || (
          <div className="py-16 text-center">
            <div className="space-y-4">
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
              <h3 className="text-lg font-semibold">
                Erro na seção {sectionName}
              </h3>
              <p className="text-muted-foreground">
                Não foi possível carregar esta seção. Tente recarregar a página.
              </p>
              <CTA onClick={resetError} variant="secondary" size="sm">
                Tentar novamente
              </CTA>
            </div>
          </div>
        )
      }
      onError={(error) => {
        console.error(`Error in section ${sectionName}:`, error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
