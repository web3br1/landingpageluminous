"use client";

import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { CTA } from "@/components/ui/cta-button-unified";
import { useProductionMonitoring } from "./production-monitoring";
import {
  errorTracker,
  ErrorCategory,
  ErrorSeverity,
} from "./error-tracking/comprehensive-error-tracker";

interface GlobalErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  isWebpackError: boolean;
  retryCount: number;
}

interface GlobalErrorBoundaryProps {
  children: React.ReactNode;
  maxRetries?: number;
}

export class GlobalErrorBoundary extends React.Component<
  GlobalErrorBoundaryProps,
  GlobalErrorBoundaryState
> {
  private monitor =
    typeof window !== "undefined" ? useProductionMonitoring() : null;
  private maxRetries: number;

  constructor(props: GlobalErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      isWebpackError: false,
      retryCount: 0,
    };
    this.maxRetries = props.maxRetries || 3;
  }

  private categorizeError(error: Error): string {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || "";

    // Network errors
    if (
      message.includes("fetch") ||
      message.includes("network") ||
      message.includes("timeout")
    ) {
      return "network";
    }

    // React errors
    if (
      message.includes("react") ||
      message.includes("render") ||
      message.includes("component") ||
      message.includes("hook") ||
      message.includes("state")
    ) {
      return "react";
    }

    // Webpack/runtime errors
    if (
      this.state.isWebpackError ||
      message.includes("chunk") ||
      message.includes("loading") ||
      message.includes("factory") ||
      message.includes("webpack")
    ) {
      return "webpack";
    }

    // JavaScript runtime errors
    if (
      message.includes("typeerror") ||
      message.includes("referenceerror") ||
      message.includes("syntaxerror") ||
      message.includes("rangeerror")
    ) {
      return "javascript";
    }

    // Performance errors
    if (
      message.includes("performance") ||
      message.includes("memory") ||
      message.includes("timeout") ||
      message.includes("slow")
    ) {
      return "performance";
    }

    return "unknown";
  }

  private extractComponentName(componentStack: string): string {
    if (!componentStack) return "unknown";

    // Extract component name from React error boundary stack
    const lines = componentStack.split("\n");
    for (const line of lines) {
      const match = line.match(/in\s+(\w+)/);
      if (match && match[1]) {
        return match[1];
      }
    }

    return "unknown";
  }

  private calculateSeverity(
    error: Error,
    category: string,
  ): "low" | "medium" | "high" | "critical" {
    // Critical errors that break the app
    if (category === "webpack" || category === "javascript") {
      return "critical";
    }

    // High severity for React and network errors
    if (category === "react" || category === "network") {
      return "high";
    }

    // Medium for performance issues
    if (category === "performance") {
      return "medium";
    }

    return "low";
  }

  static getDerivedStateFromError(
    error: Error,
  ): Partial<GlobalErrorBoundaryState> {
    // Detect webpack runtime errors
    const isWebpackError =
      error.message.includes("Loading chunk") ||
      error.message.includes("factory.call") ||
      error.message.includes(
        "Cannot read properties of undefined (reading 'call')",
      ) ||
      error.message.includes("ChunkLoadError") ||
      error.message.includes("webpack runtime");

    return {
      hasError: true,
      error,
      isWebpackError,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    // Track error with comprehensive error tracking system
    errorTracker.trackError(error, {
      boundary: "global",
      componentStack: errorInfo.componentStack,
      isWebpackError: this.state.isWebpackError,
      retryCount: this.state.retryCount,
      url: typeof window !== "undefined" ? window.location.href : "",
      userAgent:
        typeof window !== "undefined" ? window.navigator.userAgent : "",
      componentName: this.extractComponentName(errorInfo.componentStack || ""),
      sectionId: "global",
    });

    // Also send to production monitor for backward compatibility
    if (this.monitor) {
      this.monitor.trackError(error, {
        boundary: "global",
        componentStack: errorInfo.componentStack,
        isWebpackError: this.state.isWebpackError,
        retryCount: this.state.retryCount,
      });
    }

    // Log to console for development
    if (process.env.NODE_ENV === "development") {
      const errorCategory = this.categorizeError(error);
      console.group(
        `🚨 [${errorCategory.toUpperCase()}] Global Error Boundary`,
      );
      console.error("Error:", error.message);
      console.error("Category:", errorCategory);
      console.error("Severity:", this.calculateSeverity(error, errorCategory));
      console.error("Stack:", error.stack);
      console.error("Component Stack:", errorInfo.componentStack);
      console.error("Retry Count:", this.state.retryCount);
      console.groupEnd();
    }
  }

  handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;

    if (newRetryCount <= this.maxRetries) {
      this.setState({
        hasError: false,
        error: undefined,
        errorInfo: undefined,
        retryCount: newRetryCount,
      });

      // Track retry attempt
      if (this.monitor) {
        this.monitor.trackError(new Error("User initiated retry"), {
          boundary: "global",
          retryAttempt: newRetryCount,
          maxRetries: this.maxRetries,
        });
      }
    } else {
      // Max retries exceeded, suggest page reload
      window.location.reload();
    }
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.state.isWebpackError) {
        return (
          <WebpackErrorFallback
            onRetry={this.handleRetry}
            onGoHome={this.handleGoHome}
            retryCount={this.state.retryCount}
            maxRetries={this.maxRetries}
            error={this.state.error}
          />
        );
      }

      return (
        <GeneralErrorFallback
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
          retryCount={this.state.retryCount}
          maxRetries={this.maxRetries}
          error={this.state.error}
        />
      );
    }

    return this.props.children;
  }
}

// Specialized fallback for webpack runtime errors
function WebpackErrorFallback({
  onRetry,
  onGoHome,
  retryCount,
  maxRetries,
  error,
}: {
  onRetry: () => void;
  onGoHome: () => void;
  retryCount: number;
  maxRetries: number;
  error?: Error;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Erro de Carregamento
          </h1>

          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            Alguns recursos da página não puderam ser carregados corretamente.
            Isso pode acontecer devido a problemas temporários de conexão ou
            cache.
          </p>

          {process.env.NODE_ENV === "development" && error && (
            <details className="mb-6 text-left">
              <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                Detalhes técnicos (desenvolvimento)
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}

          <div className="space-y-3">
            {retryCount < maxRetries ? (
              <CTA
                onClick={onRetry}
                variant="primary"
                size="md"
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente ({retryCount + 1}/{maxRetries})
              </CTA>
            ) : (
              <CTA
                onClick={onGoHome}
                variant="primary"
                size="md"
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Ir para Página Inicial
              </CTA>
            )}

            <CTA
              onClick={() => window.location.reload()}
              variant="secondary"
              size="md"
              className="w-full"
            >
              Recarregar Página Completa
            </CTA>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-6">
            Se o problema persistir, limpe o cache do navegador ou tente
            novamente mais tarde.
          </p>
        </div>
      </div>
    </div>
  );
}

// General error fallback for other types of errors
function GeneralErrorFallback({
  onRetry,
  onGoHome,
  retryCount,
  maxRetries,
  error,
}: {
  onRetry: () => void;
  onGoHome: () => void;
  retryCount: number;
  maxRetries: number;
  error?: Error;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-red-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Ops! Algo deu errado
          </h1>

          <p className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
            Desculpe pelo inconveniente. Ocorreu um erro inesperado na
            aplicação.
          </p>

          {process.env.NODE_ENV === "development" && error && (
            <details className="mb-6 text-left">
              <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                Detalhes técnicos (desenvolvimento)
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}

          <div className="space-y-3">
            {retryCount < maxRetries ? (
              <CTA
                onClick={onRetry}
                variant="primary"
                size="md"
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente ({retryCount + 1}/{maxRetries})
              </CTA>
            ) : (
              <CTA
                onClick={onGoHome}
                variant="primary"
                size="md"
                className="w-full"
              >
                <Home className="w-4 h-4 mr-2" />
                Ir para Página Inicial
              </CTA>
            )}

            <CTA
              onClick={() => window.location.reload()}
              variant="secondary"
              size="md"
              className="w-full"
            >
              Recarregar Página Completa
            </CTA>
          </div>
        </div>
      </div>
    </div>
  );
}
