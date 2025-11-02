"use client";

import React, { Component, ReactNode } from "react";
import { NetworkError, NetworkErrorType } from "../../network/resilient-fetch";

interface NetworkErrorBoundaryState {
  hasError: boolean;
  error: NetworkError | null;
  retryCount: number;
  isRetrying: boolean;
}

interface NetworkErrorBoundaryProps {
  children: ReactNode;
  fallback?: (
    error: NetworkError,
    retry: () => void,
    retryCount: number,
  ) => ReactNode;
  onError?: (error: NetworkError, retryCount: number) => void;
  onRetry?: (retryCount: number) => void;
  maxRetries?: number;
  resetOnPropsChange?: boolean;
  resetKeys?: unknown[];
}

const DEFAULT_MAX_RETRIES = 3;

export class NetworkErrorBoundary extends Component<
  NetworkErrorBoundaryProps,
  NetworkErrorBoundaryState
> {
  private retryTimeouts: NodeJS.Timeout[] = [];

  constructor(props: NetworkErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(
    error: Error,
  ): Partial<NetworkErrorBoundaryState> {
    // Only handle NetworkError instances
    if (error instanceof NetworkError) {
      return {
        hasError: true,
        error,
        retryCount: 0,
        isRetrying: false,
      };
    }

    // Re-throw non-network errors
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (error instanceof NetworkError) {
      console.error("Network error caught by boundary:", {
        error: error.message,
        type: error.type,
        status: error.status,
        retryable: error.retryable,
        componentStack: errorInfo.componentStack,
      });

      this.props.onError?.(error, this.state.retryCount);
    }
  }

  componentDidUpdate(prevProps: NetworkErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;

    if (resetOnPropsChange && resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, index) => key !== prevProps.resetKeys?.[index],
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  componentWillUnmount() {
    // Clear any pending retry timeouts
    this.retryTimeouts.forEach((timeout) => clearTimeout(timeout));
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      retryCount: 0,
      isRetrying: false,
    });
  };

  handleRetry = () => {
    const { maxRetries = DEFAULT_MAX_RETRIES } = this.props;
    const { retryCount } = this.state;

    if (retryCount >= maxRetries) {
      console.warn("Max retries exceeded, not retrying");
      return;
    }

    this.setState({ isRetrying: true });
    this.props.onRetry?.(retryCount + 1);

    // Clear any existing timeouts
    this.retryTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.retryTimeouts = [];

    // Add a small delay for UX feedback
    const timeout = setTimeout(() => {
      this.setState((prevState) => ({
        hasError: false,
        error: null,
        retryCount: prevState.retryCount + 1,
        isRetrying: false,
      }));
    }, 500); // 500ms delay for visual feedback

    this.retryTimeouts.push(timeout);
  };

  render() {
    const { hasError, error, retryCount, isRetrying } = this.state;
    const { children, fallback } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback(error, this.handleRetry, retryCount);
      }

      // Default fallback UI
      return (
        <DefaultNetworkErrorFallback
          error={error}
          onRetry={this.handleRetry}
          retryCount={retryCount}
          isRetrying={isRetrying}
          maxRetries={this.props.maxRetries || DEFAULT_MAX_RETRIES}
        />
      );
    }

    return children;
  }
}

// Default fallback component with accessibility and retry functionality
interface DefaultNetworkErrorFallbackProps {
  error: NetworkError;
  onRetry: () => void;
  retryCount: number;
  isRetrying: boolean;
  maxRetries: number;
}

function DefaultNetworkErrorFallback({
  error,
  onRetry,
  retryCount,
  isRetrying,
  maxRetries,
}: DefaultNetworkErrorFallbackProps) {
  const canRetry = retryCount < maxRetries && error.retryable;
  const errorMessage = getErrorMessage(error);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="network-error-boundary"
      style={{
        padding: "1rem",
        border: "1px solid #e5e7eb",
        borderRadius: "0.5rem",
        backgroundColor: "#fef2f2",
        color: "#991b1b",
        textAlign: "center",
      }}
    >
      <div style={{ marginBottom: "1rem" }}>
        <h3
          style={{
            margin: "0 0 0.5rem 0",
            fontSize: "1.125rem",
            fontWeight: "600",
          }}
        >
          Erro de Conexão
        </h3>
        <p style={{ margin: 0, fontSize: "0.875rem", opacity: 0.9 }}>
          {errorMessage}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {canRetry && (
          <button
            onClick={onRetry}
            disabled={isRetrying}
            aria-describedby="retry-description"
            style={{
              padding: "0.5rem 1rem",
              border: "1px solid #d1d5db",
              borderRadius: "0.375rem",
              backgroundColor: isRetrying ? "#f3f4f6" : "#ffffff",
              color: "#374151",
              cursor: isRetrying ? "not-allowed" : "pointer",
              fontSize: "0.875rem",
              fontWeight: "500",
              transition: "background-color 0.2s",
            }}
          >
            {isRetrying
              ? "Tentando..."
              : `Tentar Novamente${retryCount > 0 ? ` (${retryCount}/${maxRetries})` : ""}`}
          </button>
        )}

        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "0.5rem 1rem",
            border: "1px solid #d1d5db",
            borderRadius: "0.375rem",
            backgroundColor: "#ffffff",
            color: "#374151",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: "500",
          }}
        >
          Recarregar Página
        </button>
      </div>

      <div
        id="retry-description"
        style={{ marginTop: "0.5rem", fontSize: "0.75rem", opacity: 0.7 }}
      >
        Tentativas restantes: {maxRetries - retryCount}
      </div>
    </div>
  );
}

// Helper function to get user-friendly error messages
function getErrorMessage(error: NetworkError): string {
  switch (error.type) {
    case NetworkErrorType.NETWORK_TIMEOUT:
      return "A conexão demorou muito para responder. Verifique sua conexão com a internet.";

    case NetworkErrorType.NETWORK_OFFLINE:
      return "Você está offline. Verifique sua conexão com a internet.";

    case NetworkErrorType.DNS_ERROR:
      return "Não foi possível conectar ao servidor. Tente novamente em alguns instantes.";

    case NetworkErrorType.HTTP_CLIENT_ERROR:
      return `Erro na solicitação (${error.status}). Verifique os dados enviados.`;

    case NetworkErrorType.HTTP_SERVER_ERROR:
      return `Erro no servidor (${error.status}). Tente novamente em alguns instantes.`;

    case NetworkErrorType.PARSER_ERROR:
      return "Erro ao processar a resposta do servidor. Tente novamente.";

    case NetworkErrorType.ABORTED:
      return "A operação foi cancelada.";

    case NetworkErrorType.CIRCUIT_BREAKER_OPEN:
      return "Serviço temporariamente indisponível. Tente novamente em alguns minutos.";

    case NetworkErrorType.UNKNOWN:
    default:
      return "Ocorreu um erro inesperado. Tente novamente.";
  }
}

// Hook for easier usage in functional components
export function useNetworkErrorBoundary() {
  return {
    NetworkErrorBoundary,
    getErrorMessage,
  };
}
