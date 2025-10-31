import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { useState, useEffect } from "react";

// Mock fetch and network APIs
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock navigator.onLine
let mockOnlineStatus = true;
Object.defineProperty(navigator, "onLine", {
  get: () => mockOnlineStatus,
  set: (value: boolean) => {
    mockOnlineStatus = value;
  },
  configurable: true,
});

// Network failure simulation utilities
const simulateNetworkRecovery = () => {
  mockFetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true }),
  });
};

// API call component with retry logic
const ApiCallComponent = ({
  onSuccess,
  onError,
  maxRetries = 3,
}: {
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
  maxRetries?: number;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<Error | null>(null);

  const makeApiCall = async (attempt = 0) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/data");

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err as Error;
      setError(error);

      // Retry logic with exponential backoff
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        setTimeout(() => {
          setRetryCount(attempt + 1);
          makeApiCall(attempt + 1);
        }, delay);
      } else {
        onError?.(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    makeApiCall();
  }, []);

  return (
    <div>
      <div data-testid="api-loading">{isLoading ? "Loading..." : "Idle"}</div>
      <div data-testid="api-data">
        {data ? JSON.stringify(data) : "No data"}
      </div>
      <div data-testid="api-error">{error ? error.message : "No error"}</div>
      <div data-testid="api-retries">Retries: {retryCount}</div>
      <button onClick={() => makeApiCall()} data-testid="api-retry">
        Retry
      </button>
    </div>
  );
};

describe("Network Failures - New Tests Only", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.useFakeTimers();
    user = userEvent.setup();
    vi.clearAllMocks();
    mockOnlineStatus = true;

    // Reset fetch mock
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("Network Request Failures - New Tests", () => {
    it("should handle timeout failures", async () => {
      // Mock fetch to simulate timeout by rejecting immediately with timeout error
      mockFetch.mockRejectedValue(new Error("Request timeout"));

      render(<ApiCallComponent />);

      await waitFor(() => {
        expect(screen.getByTestId("api-error")).toHaveTextContent(
          "Request timeout",
        );
      });

      expect(screen.getByTestId("api-loading")).toHaveTextContent("Idle");
    });

    it("should handle DNS resolution failures", async () => {
      // Mock fetch to simulate DNS resolution failure
      mockFetch.mockRejectedValue(new TypeError("Failed to fetch"));

      render(<ApiCallComponent />);

      await waitFor(() => {
        expect(screen.getByTestId("api-error")).toHaveTextContent(
          "Failed to fetch",
        );
      });

      expect(screen.getByTestId("api-loading")).toHaveTextContent("Idle");
    });
  });

  describe("Retry Logic and Backoff - New Tests", () => {
    it("should implement exponential backoff retry", async () => {
      // Fail first 2 attempts, succeed on 3rd
      mockFetch
        .mockRejectedValueOnce(new Error("Network error 1"))
        .mockRejectedValueOnce(new Error("Network error 2"))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        });

      render(<ApiCallComponent maxRetries={3} />);

      // Wait for component to start
      await waitFor(() => {
        expect(screen.getByTestId("api-loading")).toHaveTextContent(
          "Loading...",
        );
      });

      // Advance through first retry delay (1s)
      await vi.advanceTimersByTimeAsync(1000);

      // Should still be loading after first failure
      expect(screen.getByTestId("api-retries")).toHaveTextContent("Retries: 1");

      // Advance through second retry delay (2s)
      await vi.advanceTimersByTimeAsync(2000);

      // Should still be loading after second failure
      expect(screen.getByTestId("api-retries")).toHaveTextContent("Retries: 2");

      // Advance through third retry delay (4s) - this should succeed
      await vi.advanceTimersByTimeAsync(4000);

      // Wait for final success
      await waitFor(() => {
        expect(screen.getByTestId("api-data")).toHaveTextContent(
          '{"success":true}',
        );
      });

      expect(screen.getByTestId("api-retries")).toHaveTextContent("Retries: 3");
    });

    it("should respect max retry limit", async () => {
      // Always fail - mock will keep rejecting
      mockFetch.mockRejectedValue(new Error("Persistent network error"));

      render(<ApiCallComponent maxRetries={2} />);

      // Wait for component to start
      await waitFor(() => {
        expect(screen.getByTestId("api-loading")).toHaveTextContent(
          "Loading...",
        );
      });

      // Advance through first retry (1s)
      await vi.advanceTimersByTimeAsync(1000);
      expect(screen.getByTestId("api-retries")).toHaveTextContent("Retries: 1");

      // Advance through second retry (2s)
      await vi.advanceTimersByTimeAsync(2000);
      expect(screen.getByTestId("api-retries")).toHaveTextContent("Retries: 2");

      // After max retries, should stop retrying and show error
      await waitFor(() => {
        expect(screen.getByTestId("api-error")).toHaveTextContent(
          "Persistent network error",
        );
      });

      expect(screen.getByTestId("api-loading")).toHaveTextContent("Idle");
    });

    it("should allow manual retry after failure", async () => {
      mockFetch
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ success: true }),
        });

      render(<ApiCallComponent maxRetries={0} />); // No automatic retries

      // First call fails
      await waitFor(() => {
        expect(screen.getByTestId("api-error")).toHaveTextContent(
          "Network error",
        );
      });

      expect(screen.getByTestId("api-loading")).toHaveTextContent("Idle");

      // Manual retry button should be available
      expect(screen.getByTestId("api-retry")).toBeInTheDocument();

      // Manual retry - click the retry button
      fireEvent.click(screen.getByTestId("api-retry"));

      // Should succeed on retry
      await waitFor(() => {
        expect(screen.getByTestId("api-data")).toHaveTextContent(
          '{"success":true}',
        );
      });

      expect(screen.getByTestId("api-error")).toHaveTextContent("No error");
    });

    it("should handle retry after network recovery", async () => {
      // Start with network failure
      mockFetch.mockRejectedValueOnce(new Error("Failed to fetch"));

      render(<ApiCallComponent maxRetries={0} />);

      // First call fails
      await waitFor(() => {
        expect(screen.getByTestId("api-error")).toHaveTextContent(
          "Failed to fetch",
        );
      });

      // Simulate network recovery - next call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
      });

      // Trigger manual retry
      fireEvent.click(screen.getByTestId("api-retry"));

      // Should succeed after network recovery
      await waitFor(() => {
        expect(screen.getByTestId("api-data")).toHaveTextContent(
          '{"success":true}',
        );
      });

      expect(screen.getByTestId("api-error")).toHaveTextContent("No error");
    });
  });
});
