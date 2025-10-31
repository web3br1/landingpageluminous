import { Component, ReactNode } from "react";

interface BoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: unknown) => void;
  maxRetries?: number;
}

interface BoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
  errorInfo: unknown;
}

export class Boundary extends Component<BoundaryProps, BoundaryState> {
  constructor(props: BoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<BoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    const { onError } = this.props;

    this.setState({
      errorInfo,
    });

    // Log error (SSR-safe)
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    if (onError) {
      onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      this.setState((prevState) => ({
        hasError: false,
        error: null,
        retryCount: prevState.retryCount + 1,
      }));
    }
  };

  render() {
    const { hasError, error } = this.state;
    const { children, fallback, maxRetries = 3 } = this.props;

    if (hasError && error) {
      if (fallback) {
        return fallback(error, this.handleRetry);
      }

      return (
        <div role="alert" data-testid="error-boundary-fallback">
          <h2>Something went wrong</h2>
          <p>{error.message}</p>
          {this.state.retryCount < maxRetries && (
            <button onClick={this.handleRetry} data-testid="retry-button">
              Try again ({maxRetries - this.state.retryCount} attempts left)
            </button>
          )}
          <button
            onClick={() => {
              if (typeof window !== "undefined" && window.location) {
                window.location.reload();
              }
            }}
            data-testid="reload-button"
          >
            Reload page
          </button>
        </div>
      );
    }

    return children;
  }
}
