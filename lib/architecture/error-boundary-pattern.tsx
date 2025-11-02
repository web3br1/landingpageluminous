/**
 * Error Boundary Pattern - Standardized error handling and recovery for React components
 *
 * Eliminates inconsistent error handling by providing structured patterns
 * for error boundaries, logging, recovery strategies, and fallback UI.
 */

import * as React from "react";

// ===== SIMPLE ERROR BOUNDARY =====

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
  isRetrying: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error, retry: () => void) => React.ReactNode;
  maxRetries?: number;
  onError?: (error: Error) => void;
}

// Simple Error Boundary class component
export class SimpleErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary] Error caught:", error, errorInfo);

    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  private handleRetry = () => {
    const maxRetries = this.props.maxRetries || 1;

    if (this.state.retryCount >= maxRetries) {
      console.warn(`[ErrorBoundary] Max retries (${maxRetries}) exceeded`);
      return;
    }

    this.setState({ isRetrying: true });

    setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        retryCount: prevState.retryCount + 1,
        isRetrying: false,
      }));
    }, 1000);
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Custom fallback
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // Default fallback
      return this.renderDefaultError();
    }

    if (this.state.isRetrying) {
      return this.renderRetrying();
    }

    return this.props.children;
  }

  private renderDefaultError() {
    const maxRetries = this.props.maxRetries || 1;
    const canRetry = this.state.retryCount < maxRetries;

    return React.createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        padding: '2rem',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '0.5rem',
        color: '#dc2626',
      }
    }, React.createElement('div', {
      style: { textAlign: 'center', maxWidth: '400px' }
    }, [
      React.createElement('div', { key: 'icon', style: { fontSize: '2rem', marginBottom: '1rem' } }, '⚠️'),
      React.createElement('h2', { key: 'title', style: { fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' } },
        'Algo deu errado'
      ),
      React.createElement('div', { key: 'actions', style: { display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' } }, [
        canRetry ? React.createElement('button', {
          key: 'retry',
          onClick: this.handleRetry,
          disabled: this.state.isRetrying,
          style: {
            padding: '0.5rem 1rem',
            border: '1px solid #dc2626',
            borderRadius: '0.25rem',
            background: 'white',
            color: '#dc2626',
            cursor: 'pointer',
          }
        }, this.state.isRetrying ? 'Tentando...' : 'Tentar novamente') : null,
        React.createElement('button', {
          key: 'refresh',
          onClick: () => window.location.reload(),
          style: {
            padding: '0.5rem 1rem',
            border: '1px solid #dc2626',
            borderRadius: '0.25rem',
            background: 'white',
            color: '#dc2626',
            cursor: 'pointer',
          }
        }, 'Recarregar página')
      ].filter(Boolean))
    ]));
  }

  private renderRetrying() {
    const maxRetries = this.props.maxRetries || 1;

    return React.createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100px',
        color: '#6b7280'
      }
    }, React.createElement('div', { style: { textAlign: 'center' } }, [
      React.createElement('div', {
        key: 'spinner',
        style: {
          width: '20px',
          height: '20px',
          border: '2px solid #e5e7eb',
          borderTop: '2px solid #6b7280',
          borderRadius: '50%',
          animation: 'error-boundary-spin 1s linear infinite',
          margin: '0 auto 0.5rem'
        }
      }),
      React.createElement('p', { key: 'text' }, `Tentando novamente... (${this.state.retryCount}/${maxRetries})`)
    ]));
  }
}

// ===== HOOKS =====

/**
 * Hook for error handling in functional components
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    console.error("[useErrorHandler] Error:", error);
    setError(error);
  }, []);

  return {
    error,
    handleError,
    resetError,
    hasError: !!error,
  };
}

// ===== UTILITY FUNCTIONS =====

/**
 * Safe execution wrapper for async operations
 */
export async function safeExecute<T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error("[safeExecute] Error:", error);
    return fallback;
  }
}

/**
 * Safe component renderer
 */
export function safeRender(
  renderFn: () => React.ReactNode,
  fallback: React.ReactNode = null
): React.ReactNode {
  try {
    return renderFn();
  } catch (error) {
    console.error("[safeRender] Error:", error);
    return fallback;
  }
}

// ===== HOC (Higher Order Component) =====

interface WithErrorBoundaryOptions {
  componentName?: string;
  fallback?: (error: Error, retry: () => void) => React.ReactNode;
  maxRetries?: number;
  onError?: (error: Error) => void;
}

/**
 * HOC to wrap components with error boundary protection
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: WithErrorBoundaryOptions = {}
): React.ComponentType<P> {
  const {
    componentName = Component.displayName || Component.name || "UnknownComponent",
    fallback,
    maxRetries = 1,
    onError,
  } = options;

  const WrappedComponent = (props: P) => {
    const handleError = React.useCallback((error: Error) => {
      console.error(`[ErrorBoundary:${componentName}] Error:`, error);
      if (onError) {
        onError(error);
      }
    }, [componentName]);

    return (
      <SimpleErrorBoundary
        fallback={fallback}
        maxRetries={maxRetries}
        onError={handleError}
      >
        <Component {...props} />
      </SimpleErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withErrorBoundary(${componentName})`;

  return WrappedComponent;
}