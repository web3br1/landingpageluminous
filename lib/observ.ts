// Phase 3 Telemetry - Minimal observability for critical issues


// Telemetry events for Phase 3 fixes
export const telemetry = {
  // SSR context issues
  ssrRequestContextMissing: (error: string) => {
    console.warn("[TELEMETRY] ssr_request_context_missing", {
      error,
      timestamp: Date.now(),
      phase: 3,
      issue: "headers_cookies_outside_request_scope",
    });
    // TODO: Send to monitoring system
  },

  // Envelope contract violations
  sectionEnvelopeMissing: (sectionId: string, error?: unknown) => {
    console.error("[TELEMETRY] section_envelope_missing", {
      sectionId,
      error: (error as Error)?.message || error,
      timestamp: Date.now(),
      phase: 3,
      issue: "envelope_contract_violation",
    });
    // TODO: Send to monitoring system with alert
  },

  // SEO compliance issues
  seoTitleOverLimit: (title: string, length: number) => {
    console.warn("[TELEMETRY] seo_title_over_limit", {
      title: title.substring(0, 50) + "...", // Truncate for logging
      length,
      limit: 60,
      timestamp: Date.now(),
      phase: 3,
      issue: "seo_title_length_violation",
    });
    // TODO: Send to monitoring system
  },
};

// Helper to validate SEO titles at runtime
export function validateSeoTitle(title: string): boolean {
  const isValid = title.length <= 60;
  if (!isValid) {
    telemetry.seoTitleOverLimit(title, title.length);
  }
  return isValid;
}

// Helper to validate envelope at composition time
export function validateEnvelopeAtComposition(
  data: unknown,
  sectionId: string,
): boolean {
  const hasEnvelope = data && typeof data === "object" && "envelope" in data;
  if (!hasEnvelope) {
    telemetry.sectionEnvelopeMissing(sectionId);
    return false;
  }
  return true;
}
