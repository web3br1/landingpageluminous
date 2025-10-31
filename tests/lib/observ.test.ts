import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock console methods
const mockConsole = {
  warn: vi.fn(),
  error: vi.fn(),
  log: vi.fn(),
};

vi.stubGlobal("console", mockConsole);

describe("Observability (Telemetry)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should export telemetry functions", async () => {
    const { telemetry } = await import("@/lib/observ");

    expect(typeof telemetry.ssrRequestContextMissing).toBe("function");
    expect(typeof telemetry.sectionEnvelopeMissing).toBe("function");
    expect(typeof telemetry.seoTitleOverLimit).toBe("function");
  });

  it("should call console.warn for SSR context issues", async () => {
    const { telemetry } = await import("@/lib/observ");

    telemetry.ssrRequestContextMissing("Test error");

    expect(mockConsole.warn).toHaveBeenCalledWith(
      "[TELEMETRY] ssr_request_context_missing",
      expect.objectContaining({
        error: "Test error",
        phase: 3,
        issue: "headers_cookies_outside_request_scope",
        timestamp: expect.any(Number),
      }),
    );
  });

  it("should call console.error for envelope violations", async () => {
    const { telemetry } = await import("@/lib/observ");

    telemetry.sectionEnvelopeMissing("hero", new Error("Test error"));

    expect(mockConsole.error).toHaveBeenCalledWith(
      "[TELEMETRY] section_envelope_missing",
      expect.objectContaining({
        sectionId: "hero",
        error: "Test error",
        phase: 3,
        issue: "envelope_contract_violation",
        timestamp: expect.any(Number),
      }),
    );
  });

  it("should handle undefined error in envelope violations", async () => {
    const { telemetry } = await import("@/lib/observ");

    telemetry.sectionEnvelopeMissing("hero");

    expect(mockConsole.error).toHaveBeenCalledWith(
      "[TELEMETRY] section_envelope_missing",
      expect.objectContaining({
        sectionId: "hero",
        error: undefined,
      }),
    );
  });
});
