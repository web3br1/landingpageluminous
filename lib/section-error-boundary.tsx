"use client";

import React, { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { CTA } from "@/components/ui/cta-button-unified";
import { useProductionMonitoring } from "./production-monitoring";

interface SectionErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
}

interface SectionErrorBoundaryProps {
  sectionId: string;
  fallback?: ReactNode;
  onError?: (
    sectionId: string,
    error: Error,
    errorInfo: React.ErrorInfo,
  ) => void;
  maxRetries?: number;
  children: ReactNode;
}

export class SectionErrorBoundary extends Component<
  SectionErrorBoundaryProps,
  SectionErrorBoundaryState
> {
  private monitor =
    typeof window !== "undefined" ? useProductionMonitoring() : null;
  private maxRetries: number;

  constructor(props: SectionErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0,
    };
    this.maxRetries = props.maxRetries || 2;
  }

  static getDerivedStateFromError(
    error: Error,
  ): Partial<SectionErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });

    const category = this.categorizeError(error);

    // Track section-specific error
    if (this.monitor) {
      this.monitor.trackError(error, {
        boundary: "section",
        sectionId: this.props.sectionId,
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount,
        category,
        severity: this.calculateSeverity(error, category),
        componentName: this.extractComponentName(
          errorInfo.componentStack || "",
        ),
        url: typeof window !== "undefined" ? window.location.href : "",
        timestamp: Date.now(),
      });
    }

    // Call custom error handler
    this.props.onError?.(this.props.sectionId, error, errorInfo);

    // Log in development
    if (process.env.NODE_ENV === "development") {
      console.group(
        `🚨 [${category.toUpperCase()}] Section Error Boundary - ${this.props.sectionId}`,
      );
      console.error("Error:", error.message);
      console.error("Component Stack:", errorInfo.componentStack);
      console.groupEnd();
    }
  }

  private categorizeError(error: Error): string {
    const message = error.message.toLowerCase();

    if (message.includes("fetch") || message.includes("network")) {
      return "network";
    }

    if (
      message.includes("react") ||
      message.includes("render") ||
      message.includes("component")
    ) {
      return "react";
    }

    if (message.includes("typeerror") || message.includes("referenceerror")) {
      return "javascript";
    }

    return "unknown";
  }

  private extractComponentName(componentStack: string): string {
    if (!componentStack) return "unknown";

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
    if (category === "javascript") return "critical";
    if (category === "react") return "high";
    if (category === "network") return "medium";
    return "low";
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

      // Track retry
      if (this.monitor) {
        this.monitor.trackError(new Error("Section retry"), {
          boundary: "section",
          sectionId: this.props.sectionId,
          retryAttempt: newRetryCount,
          maxRetries: this.maxRetries,
        });
      }
    } else {
      // Max retries reached - could emit an event to parent component
      console.warn(
        `Section ${this.props.sectionId} exceeded max retries (${this.maxRetries})`,
      );
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback for section errors
      return (
        <SectionErrorFallback
          sectionId={this.props.sectionId}
          onRetry={this.handleRetry}
          retryCount={this.state.retryCount}
          maxRetries={this.maxRetries}
          error={this.state.error}
        />
      );
    }

    return this.props.children;
  }
}

// Section-specific error fallback
function SectionErrorFallback({
  sectionId,
  onRetry,
  retryCount,
  maxRetries,
  error,
}: {
  sectionId: string;
  onRetry: () => void;
  retryCount: number;
  maxRetries: number;
  error?: Error;
}) {
  return (
    <section
      id={sectionId}
      className="py-8 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg my-8"
      role="alert"
      aria-live="polite"
    >
      <div className="container mx-auto px-4 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
        </div>

        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
          Erro na seção {sectionId}
        </h3>

        <p className="text-red-600 dark:text-red-400 text-sm mb-4">
          Esta seção não pôde ser carregada corretamente.
        </p>

        {retryCount < maxRetries && (
          <CTA
            onClick={onRetry}
            variant="secondary"
            size="sm"
            className="inline-flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente ({retryCount + 1}/{maxRetries})
          </CTA>
        )}

        {process.env.NODE_ENV === "development" && error && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-red-700 dark:text-red-300 text-sm hover:underline">
              Detalhes técnicos (desenvolvimento)
            </summary>
            <pre className="mt-2 p-3 bg-red-100 dark:bg-red-900/50 rounded text-xs text-red-800 dark:text-red-200 overflow-auto max-w-full">
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </section>
  );
}

// Hook for functional components that need error tracking
export function useSectionErrorTracking(sectionId: string) {
  const monitor = useProductionMonitoring();

  return {
    trackSectionError: (error: Error, context?: unknown) => {
      monitor.trackError(error, {
        boundary: "section",
        sectionId,
        category: "section",
        ...(context && typeof context === 'object' ? context : {}),
      });
    },
  };
}
