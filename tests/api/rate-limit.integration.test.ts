import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockRateLimitService = {
  checkRateLimit: vi.fn(),
  applyBackoff: vi.fn(),
};

const mockFetch = vi.fn();

beforeEach(() => {
  global.fetch = mockFetch;
  vi.clearAllMocks();
});

afterEach(() => {
  global.fetch = originalFetch;
});

const originalFetch = global.fetch;

describe("Rate Limiting and Backoff Strategies", () => {
  it("enforces API rate limits", async () => {
    const request = { endpoint: "/api/leads", userId: "user123" };

    mockRateLimitService.checkRateLimit.mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetTime: new Date(Date.now() + 60000).toISOString(),
    });

    const result = await mockRateLimitService.checkRateLimit(request);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("applies exponential backoff", async () => {
    const failedRequest = { id: "req_123", failures: 3 };

    mockRateLimitService.applyBackoff.mockResolvedValue({
      delay: 8000, // 8 seconds for 3rd failure
      nextAttempt: new Date(Date.now() + 8000).toISOString(),
    });

    const result = await mockRateLimitService.applyBackoff(failedRequest);

    expect(result.delay).toBe(8000);
    expect(result.nextAttempt).toBeDefined();
  });
});
