/**
 * Error Boundary Telemetry - Integration Tests
 *
 * Testa telemetria e logging de error boundaries em componentes reais
 * Extende testes existentes com validação de logs e métricas
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { Boundary } from "@/lib/error/Boundary";
import { logger } from "@/lib/observability/logger";
import { metrics } from "@/lib/observability/metrics";

// Mock analytics for telemetry testing
vi.mock("@/lib/analytics", () => ({
  analytics: {
    track: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock logger for telemetry testing
vi.mock("@/lib/observability/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock components that throw different types of errors
const NetworkErrorComponent = () => {
  throw new Error("Network connection failed");
};

const ValidationErrorComponent = () => {
  throw new Error("Validation failed: invalid input");
};

const ComponentErrorComponent = () => {
  throw new Error("Component render error");
};

const ValidComponent = () => <div>Valid Component</div>;

// Mock logger and metrics
vi.mock("@/lib/observability/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("@/lib/observability/metrics", () => ({
  metrics: {
    increment: vi.fn(),
    gauge: vi.fn(),
    histogram: vi.fn(),
  },
}));

describe("Error Boundary Telemetry Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe("Telemetry Tracking on Errors", () => {
    it("should track network errors with proper telemetry", () => {
      const mockOnError = vi.fn();

      render(
        <Boundary onError={mockOnError} section="hero">
          <NetworkErrorComponent />
        </Boundary>,
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(screen.getByText("Network connection failed")).toBeInTheDocument();

      // Verify error callback was called
      expect(mockOnError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(Object),
      );

      // Verify the error is a network error
      const error = mockOnError.mock.calls[0][0];
      expect(error.message).toBe("Network connection failed");
    });

    it("should track validation errors with context", () => {
      const mockOnError = vi.fn();

      render(
        <Boundary onError={mockOnError} section="contact-form">
          <ValidationErrorComponent />
        </Boundary>,
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(
        screen.getByText("Validation failed: invalid input"),
      ).toBeInTheDocument();

      // Verify error callback with context
      expect(mockOnError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        }),
      );
    });

    it("should track component render errors", () => {
      const mockOnError = vi.fn();

      render(
        <Boundary onError={mockOnError} section="features">
          <ComponentErrorComponent />
        </Boundary>,
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      expect(screen.getByText("Component render error")).toBeInTheDocument();

      expect(mockOnError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.any(Object),
      );
    });
  });

  describe("Logging Integration", () => {
    it("should log errors to observability system", () => {
      render(
        <Boundary section="hero">
          <NetworkErrorComponent />
        </Boundary>,
      );

      // Verify logger was called
      expect(logger.error).toHaveBeenCalledWith(
        "Error boundary caught error in section hero",
        expect.objectContaining({
          error: expect.any(Error),
          errorInfo: expect.any(Object),
          section: "hero",
        }),
      );
    });

    it("should include component stack in logs", () => {
      render(
        <Boundary section="pricing">
          <ValidationErrorComponent />
        </Boundary>,
      );

      // Verify component stack is logged
      expect(logger.error).toHaveBeenCalledWith(
        "Error boundary caught error in section pricing",
        expect.objectContaining({
          error: expect.any(Error),
          errorInfo: expect.objectContaining({
            componentStack: expect.any(String),
          }),
          section: "pricing",
        }),
      );
    });

    it("should log retry attempts", async () => {
      render(
        <Boundary section="testimonials" maxRetries={3}>
          <ComponentErrorComponent />
        </Boundary>,
      );

      const retryButton = screen.getByTestId("retry-button");

      // First retry
      await act(async () => {
        retryButton.click();
      });

      expect(logger.info).toHaveBeenCalledWith(
        "Error boundary retry attempt 1/3 in section testimonials",
        expect.objectContaining({
          section: "testimonials",
          attempt: 1,
          maxRetries: 3,
        }),
      );

      // Second retry
      await act(async () => {
        retryButton.click();
      });

      expect(logger.info).toHaveBeenCalledWith(
        "Error boundary retry attempt 2/3 in section testimonials",
        expect.objectContaining({
          section: "testimonials",
          attempt: 2,
          maxRetries: 3,
        }),
      );
    });
  });

  describe("Metrics Collection", () => {
    it("should increment error metrics on boundary catch", () => {
      render(
        <Boundary section="hero">
          <NetworkErrorComponent />
        </Boundary>,
      );

      // Verify metrics were incremented
      expect(metrics.increment).toHaveBeenCalledWith(
        "error_boundary_caught",
        expect.objectContaining({
          section: "hero",
          error_type: "Error",
        }),
      );
    });

    it("should track retry attempts in metrics", async () => {
      render(
        <Boundary section="features" maxRetries={2}>
          <ValidationErrorComponent />
        </Boundary>,
      );

      const retryButton = screen.getByTestId("retry-button");

      // First retry
      await act(async () => {
        retryButton.click();
      });

      expect(metrics.increment).toHaveBeenCalledWith(
        "error_boundary_retry",
        expect.objectContaining({
          section: "features",
          attempt: 1,
        }),
      );

      // Second retry
      await act(async () => {
        retryButton.click();
      });

      expect(metrics.increment).toHaveBeenCalledWith(
        "error_boundary_retry",
        expect.objectContaining({
          section: "features",
          attempt: 2,
        }),
      );
    });

    it("should track reload actions", () => {
      // Mock window.location.reload
      const mockReload = vi.fn();
      Object.defineProperty(window, "location", {
        value: { reload: mockReload },
        writable: true,
      });

      render(
        <Boundary section="pricing">
          <ComponentErrorComponent />
        </Boundary>,
      );

      const reloadButton = screen.getByTestId("reload-button");
      reloadButton.click();

      expect(metrics.increment).toHaveBeenCalledWith(
        "error_boundary_reload",
        expect.objectContaining({
          section: "pricing",
        }),
      );

      expect(mockReload).toHaveBeenCalled();
    });
  });

  describe("Analytics Integration", () => {
    it("should send error events to analytics", () => {
      const { analytics } = require("@/lib/analytics");

      render(
        <Boundary section="contact">
          <NetworkErrorComponent />
        </Boundary>,
      );

      expect(analytics.error).toHaveBeenCalledWith(
        "error_boundary_error",
        expect.objectContaining({
          section: "contact",
          error_message: "Network connection failed",
          error_type: "Error",
        }),
      );
    });

    it("should track user interactions with error UI", async () => {
      const { analytics } = require("@/lib/analytics");

      render(
        <Boundary section="faq" maxRetries={1}>
          <ValidationErrorComponent />
        </Boundary>,
      );

      // Click retry
      const retryButton = screen.getByTestId("retry-button");
      await act(async () => {
        retryButton.click();
      });

      expect(analytics.track).toHaveBeenCalledWith(
        "error_boundary_retry_clicked",
        expect.objectContaining({
          section: "faq",
          attempt: 1,
        }),
      );
    });
  });

  describe("Real Component Integration", () => {
    it("should handle errors in lazy-loaded components with telemetry", async () => {
      // Component that fails after lazy loading simulation
      const FailingLazyComponent = () => {
        React.useEffect(() => {
          // Simulate async failure
          setTimeout(() => {
            throw new Error("Lazy component failed");
          }, 100);
        }, []);

        return <div>Loaded successfully</div>;
      };

      render(
        <Boundary section="lazy-section">
          <FailingLazyComponent />
        </Boundary>,
      );

      // Initially shows valid content
      expect(screen.getByText("Loaded successfully")).toBeInTheDocument();

      // Wait for async error
      await waitFor(() => {
        expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      });

      // Verify telemetry for lazy component error
      expect(logger.error).toHaveBeenCalledWith(
        "Error boundary caught error in section lazy-section",
        expect.any(Object),
      );

      expect(metrics.increment).toHaveBeenCalledWith(
        "error_boundary_caught",
        expect.objectContaining({
          section: "lazy-section",
        }),
      );
    });

    it("should handle network failures in data-fetching components", async () => {
      // Component that simulates network failure
      const NetworkFailingComponent = () => {
        const [error, setError] = React.useState<Error | null>(null);

        React.useEffect(() => {
          // Simulate network request failure
          setTimeout(() => {
            setError(new Error("API request failed"));
          }, 50);
        }, []);

        if (error) {
          throw error;
        }

        return <div>Loading data...</div>;
      };

      render(
        <Boundary section="data-component">
          <NetworkFailingComponent />
        </Boundary>,
      );

      // Initially loading
      expect(screen.getByText("Loading data...")).toBeInTheDocument();

      // Then error occurs
      await waitFor(() => {
        expect(screen.getByText("Something went wrong")).toBeInTheDocument();
      });

      expect(screen.getByText("API request failed")).toBeInTheDocument();

      // Verify network error telemetry
      expect(logger.error).toHaveBeenCalledWith(
        "Error boundary caught error in section data-component",
        expect.objectContaining({
          error: expect.objectContaining({
            message: "API request failed",
          }),
        }),
      );
    });
  });

  describe("Error Recovery Telemetry", () => {
    it("should track successful recovery after retry", async () => {
      // Component that fails once then succeeds
      let attemptCount = 0;
      const RecoveringComponent = () => {
        attemptCount++;
        if (attemptCount === 1) {
          throw new Error("Temporary failure");
        }
        return <div>Recovered successfully</div>;
      };

      render(
        <Boundary section="recovery-test" maxRetries={3}>
          <RecoveringComponent />
        </Boundary>,
      );

      // Shows error initially
      expect(screen.getByText("Something went wrong")).toBeInTheDocument();

      // Click retry
      const retryButton = screen.getByTestId("retry-button");
      await act(async () => {
        retryButton.click();
      });

      // Should recover
      await waitFor(() => {
        expect(screen.getByText("Recovered successfully")).toBeInTheDocument();
      });

      // Verify recovery telemetry
      expect(logger.info).toHaveBeenCalledWith(
        "Error boundary recovery successful in section recovery-test",
        expect.objectContaining({
          section: "recovery-test",
          attempts: 1,
        }),
      );

      expect(metrics.increment).toHaveBeenCalledWith(
        "error_boundary_recovery",
        expect.objectContaining({
          section: "recovery-test",
        }),
      );
    });
  });
});
