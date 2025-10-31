// Network Testing Utilities
// Shared utilities for network-related tests to avoid duplication

import { vi } from "vitest";

// Mock NetworkInformation API (if available)
export const createMockConnection = () => ({
  effectiveType: "4g" as const,
  downlink: 10,
  rtt: 50,
  saveData: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
});

// Mock online status
let mockOnlineStatus = true;

export const getMockOnlineStatus = () => mockOnlineStatus;
export const setMockOnlineStatus = (status: boolean) => {
  mockOnlineStatus = status;
};

// Network failure simulation utilities
export const createNetworkFailureUtils = () => {
  const mockFetch = vi.fn();

  const simulateNetworkFailure = (
    errorType: "timeout" | "connection" | "server" | "dns" = "connection",
  ) => {
    const errors = {
      timeout: new Error("Network timeout"),
      connection: new Error("Failed to fetch"),
      server: new Error("Internal server error"),
      dns: new Error("DNS resolution failed"),
    };

    mockFetch.mockRejectedValue(errors[errorType]);
  };

  const simulateNetworkRecovery = () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true }),
    });
  };

  const simulateOffline = () => {
    mockOnlineStatus = false;
    window.dispatchEvent(new Event("offline"));
  };

  const simulateOnline = () => {
    mockOnlineStatus = true;
    window.dispatchEvent(new Event("online"));
  };

  return {
    mockFetch,
    simulateNetworkFailure,
    simulateNetworkRecovery,
    simulateOffline,
    simulateOnline,
  };
};

// Network scenarios for complex test setups
export const NetworkScenarios = {
  offline: (url: string) => ({
    url,
    response: { status: 0, statusText: "Network Error" },
    delay: 0,
  }),
  timeout: (url: string) => ({
    url,
    response: new Error("Network timeout"),
    delay: 10000,
  }),
  serverError: (url: string) => ({
    url,
    response: { status: 500, statusText: "Internal Server Error" },
    delay: 100,
  }),
  dnsFailure: (url: string) => ({
    url,
    response: new Error("DNS resolution failed"),
    delay: 0,
  }),
};

// Setup network test environment (legacy compatibility)
export const setupNetworkTestEnvironment = (config: {
  navigator?: { onLine?: boolean };
  fetch?: { scenarios?: unknown[] };
}) => {
  const networkUtils = createNetworkTestUtils();

  // Setup navigator
  if (config.navigator?.onLine !== undefined) {
    setMockOnlineStatus(config.navigator.onLine);
  }

  // Setup fetch scenarios
  if (config.fetch?.scenarios) {
    // Apply scenarios to mockFetch
    config.fetch.scenarios.forEach((scenario) => {
      if (scenario.url && scenario.response) {
        networkUtils.mockFetch.mockImplementationOnce(
          (input: RequestInfo | URL) => {
            const url =
              typeof input === "string"
                ? input
                : input instanceof URL
                  ? input.href
                  : input.url;
            if (url.includes(scenario.url)) {
              if (scenario.response instanceof Error) {
                return Promise.reject(scenario.response);
              }
              return Promise.resolve({
                ok: scenario.response.status < 400,
                status: scenario.response.status,
                statusText: scenario.response.statusText,
                json: () =>
                  Promise.resolve({ error: scenario.response.statusText }),
              });
            }
            return networkUtils.mockFetch(input as unknown);
          },
        );
      }
    });
  }

  return {
    ...networkUtils,
    // Legacy compatibility
    networkUtils,
  };
};

// Unified network testing setup
export const createNetworkTestUtils = () => {
  const mockConnection = createMockConnection();
  const networkFailureUtils = createNetworkFailureUtils();

  // Setup navigator mocks
  Object.defineProperty(navigator, "onLine", {
    writable: true,
    value: mockOnlineStatus,
  });

  Object.defineProperty(navigator, "connection", {
    value: mockConnection,
    writable: true,
  });

  // Mock fetch globally
  const originalFetch = global.fetch;
  global.fetch = networkFailureUtils.mockFetch as unknown;

  return {
    mockConnection,
    ...networkFailureUtils,
    getMockOnlineStatus,
    setMockOnlineStatus,

    // Cleanup utilities
    cleanup: () => {
      global.fetch = originalFetch;
      mockOnlineStatus = true;
      networkFailureUtils.mockFetch.mockReset();
    },
  };
};
