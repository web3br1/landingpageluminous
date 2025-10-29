/**
 * Mock for useBackendRateLimiting hook
 * Provides vitest/jest compatible mocks for rate limiting functionality
 */

import { vi } from "vitest";

// Mock return type that matches the actual hook
export interface MockRateLimitReturn {
  state: {
    isLoading: boolean;
    isBlocked: boolean;
    remainingAttempts: number;
    resetTime: number;
    retryAfter: number;
    error: string | null;
    lastCheck: number;
  };
  checkLimit: () => Promise<boolean>;
  reportUsage: (
    success?: boolean,
    metadata?: Record<string, any>,
  ) => Promise<void>;
  reset: () => void;
  canAttempt: boolean;
  getTimeUntilReset: () => { minutes: number; seconds: number };
}

// Default mock implementation - always allows requests
export const createRateLimitMock = (
  options: {
    allowRequests?: boolean;
    remainingAttempts?: number;
    isBlocked?: boolean;
    retryAfter?: number;
    error?: string | null;
  } = {},
): MockRateLimitReturn => {
  const {
    allowRequests = true,
    remainingAttempts = 999,
    isBlocked = false,
    retryAfter = 0,
    error = null,
  } = options;

  return {
    state: {
      isLoading: false,
      isBlocked,
      remainingAttempts,
      resetTime: Math.floor(Date.now() / 1000) + 3600,
      retryAfter,
      error,
      lastCheck: Date.now(),
    },
    checkLimit: vi.fn().mockResolvedValue(allowRequests),
    reportUsage: vi.fn().mockResolvedValue(undefined),
    reset: vi.fn(),
    canAttempt: !isBlocked,
    getTimeUntilReset: vi.fn().mockReturnValue({
      minutes: Math.floor(retryAfter / 60),
      seconds: retryAfter % 60,
    }),
  };
};

// Convenience mocks for common scenarios
export const rateLimitMockAllowAll = createRateLimitMock({
  allowRequests: true,
  remainingAttempts: 999,
  isBlocked: false,
});

export const rateLimitMockBlocked = createRateLimitMock({
  allowRequests: false,
  remainingAttempts: 0,
  isBlocked: true,
  retryAfter: 60,
});

export const rateLimitMockLimited = createRateLimitMock({
  allowRequests: true,
  remainingAttempts: 2,
  isBlocked: false,
  retryAfter: 0,
});

// Helper to apply mock to vitest module
export const mockUseBackendRateLimiting = (mockReturn: MockRateLimitReturn) => {
  return vi.fn().mockReturnValue(mockReturn);
};
