import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Next.js headers/cookies to simulate SSR environment
vi.mock("next/headers", () => ({
  headers: vi.fn(),
  cookies: vi.fn(),
}));

// Suppress Next.js warnings for SSR context during tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes?.("headers") && args[0]?.includes?.("request scope"))
    return;
  if (args[0]?.includes?.("cookies") && args[0]?.includes?.("request scope"))
    return;
  originalWarn.apply(console, args);
};

describe("SSR Headers/Cookies Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Server Flags in SSR Context", () => {
    it("should handle missing request context gracefully", async () => {
      // Import after mocking to ensure clean state
      const { getServerFlags } = await import("@/lib/flags/server-flags");

      // Mock headers/cookies to throw (simulating SSR without request context)
      const { headers, cookies } = await import("next/headers");
      vi.mocked(headers).mockRejectedValue(
        new Error("headers() was called outside a request scope"),
      );
      vi.mocked(cookies).mockRejectedValue(
        new Error("cookies() was called outside a request scope"),
      );

      // Should not throw and return fallback values
      const flags = await getServerFlags();

      expect(flags).toHaveProperty("experiments");
      expect(flags).toHaveProperty("flags");
      expect(typeof flags.experiments).toBe("object");
      expect(typeof flags.flags).toBe("object");
    });

    it("should generate consistent fallback hash when request context unavailable", async () => {
      const { getServerFlags } = await import("@/lib/flags/server-flags");

      // Mock failure for multiple calls to ensure consistency
      const { headers, cookies } = await import("next/headers");
      vi.mocked(headers).mockRejectedValue(new Error("No request context"));
      vi.mocked(cookies).mockRejectedValue(new Error("No request context"));

      const flags1 = await getServerFlags();
      const flags2 = await getServerFlags();

      // Should return consistent results
      expect(flags1.experiments).toEqual(flags2.experiments);
      expect(flags1.flags).toEqual(flags2.flags);
    });

    it("should succeed when request context is available", async () => {
      const { getServerFlags } = await import("@/lib/flags/server-flags");

      // Mock successful headers/cookies
      const { headers, cookies } = await import("next/headers");
      const mockHeaders = new Map([
        ["x-forwarded-for", "192.168.1.100"],
        ["user-agent", "Mozilla/5.0 Test Browser"],
      ]);
      const mockCookies = new Map([["session-id", "test-session-123"]]);

      vi.mocked(headers).mockResolvedValue({
        get: (key: string) => mockHeaders.get(key) || null,
      } as any);
      vi.mocked(cookies).mockResolvedValue({
        get: (key: string) => ({ value: mockCookies.get(key) || "default" }),
      } as any);

      const flags = await getServerFlags();

      expect(flags).toHaveProperty("experiments");
      expect(flags).toHaveProperty("flags");
      // Should not use fallback values when context is available
      expect(Object.keys(flags.experiments).length).toBeGreaterThan(0);
    });
  });

  describe("generateMetadata SSR Safety", () => {
    it("should not fail when called in SSR without request context", async () => {
      // This test ensures generateMetadata doesn't break during build/static generation
      const { composePageFull } = await import(
        "@/lib/composition/page-composer"
      );

      // Mock getServerFlags to simulate SSR context failure
      const { getServerFlags } = await import("@/lib/flags/server-flags");
      const mockGetServerFlags = vi
        .fn()
        .mockRejectedValue(new Error("SSR context unavailable"));
      vi.doMock("@/lib/flags/server-flags", () => ({
        getServerFlags: mockGetServerFlags,
      }));

      // Should handle gracefully (fallback behavior)
      await expect(composePageFull("landing")).resolves.toBeDefined();
    });
  });
});
