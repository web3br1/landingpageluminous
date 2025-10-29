// Error Boundary for A/B Testing Components
// Provides graceful degradation when experiments fail

"use client";

import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ExperimentErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  experimentId?: string;
}

interface ExperimentErrorBoundaryProps {
  children: React.ReactNode;
  experimentId?: string;
  fallback?: React.ComponentType<{
    error?: Error;
    experimentId?: string;
    retry: () => void;
  }>;
  onError?: (error: Error, experimentId?: string) => void;
}

class ExperimentErrorBoundary extends React.Component<
  ExperimentErrorBoundaryProps,
  ExperimentErrorBoundaryState
> {
  constructor(props: ExperimentErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ExperimentErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { experimentId, onError } = this.props;

    // Log error with experiment context
    console.error("[Experiment Error]", {
      experimentId,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Call custom error handler
    onError?.(error, experimentId);

    // Track experiment error (if analytics available)
    try {
      if (typeof window !== "undefined" && (window as any).analytics) {
        (window as any).analytics.track("experiment_error", {
          experiment_id: experimentId,
          error_message: error.message,
          error_type: error.name,
          user_agent: navigator.userAgent,
        });
      }
    } catch (trackingError) {
      console.warn("[Experiment Error] Failed to track error:", trackingError);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback, experimentId } = this.props;

      if (Fallback) {
        return (
          <Fallback
            error={this.state.error}
            experimentId={experimentId}
            retry={this.handleRetry}
          />
        );
      }

      return (
        <DefaultExperimentError
          error={this.state.error}
          experimentId={experimentId}
          retry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

// Default error UI for experiments
function DefaultExperimentError({
  error,
  experimentId,
  retry,
}: {
  error?: Error;
  experimentId?: string;
  retry: () => void;
}) {
  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertTitle className="text-orange-800">
        Experimento Indisponível
        {experimentId && (
          <span className="font-mono text-sm"> ({experimentId})</span>
        )}
      </AlertTitle>
      <AlertDescription className="text-orange-700">
        <div className="space-y-2">
          <p>
            Ocorreu um erro ao carregar este experimento.
            {error && (
              <span className="block text-sm font-mono mt-1">
                {error.message}
              </span>
            )}
          </p>
          <Button
            onClick={retry}
            variant="outline"
            size="sm"
            className="border-orange-300 text-orange-700 hover:bg-orange-100"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Tentar Novamente
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

// Hook for handling experiment errors
export function useExperimentErrorHandler(experimentId?: string) {
  const handleError = React.useCallback(
    (error: Error, expId?: string) => {
      // Custom error handling logic
      console.error(`[Experiment ${expId || experimentId}] Error:`, error);

      // Could send to error reporting service
      // reportError(error, { experimentId: expId || experimentId })
    },
    [experimentId],
  );

  return handleError;
}

// HOC for wrapping experiment components with error boundary
export function withExperimentErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  experimentId?: string,
) {
  const WrappedComponent = (props: P) => (
    <ExperimentErrorBoundary experimentId={experimentId}>
      <Component {...props} />
    </ExperimentErrorBoundary>
  );

  WrappedComponent.displayName = `withExperimentErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

export default ExperimentErrorBoundary;
