/**
 * Server-side flag resolution for consistent SSR/client hydration
 */

// Import experiment configuration from centralized registry (server-safe)
import { ALL_EXPERIMENTS } from "../experiments/experiments-registry";
import { telemetry } from "../observ";

// Convert experiment registry to server-compatible format
const EXPERIMENTS = Object.values(ALL_EXPERIMENTS).map((exp) => ({
  id: exp.id,
  name: exp.name,
  active: exp.status === "running",
  variants: exp.variants.map((v) => ({
    id: v.id,
    name: v.name,
    weight: v.weight,
  })),
}));

// Feature flags (server-safe)
const FEATURES = {
  newDashboard: true,
  advancedFilters: false,
  apiAccess: true,
  betaFeatures: false,
};

// Server-side experiment utilities
const experimentUtils = {
  // Generate consistent hash from request headers (IP, User-Agent, etc.)
  // Context-aware: only access headers/cookies within request context
  getRequestHash: async (): Promise<number> => {
    try {
      // Lazy import within request context to avoid SSR violations
      const { headers, cookies } = await import("next/headers");
      const headersList = await headers();
      const cookiesList = await cookies();

      // Use IP + User-Agent + session cookie for consistent hashing
      const ip =
        headersList.get("x-forwarded-for") ||
        headersList.get("x-real-ip") ||
        "127.0.0.1";

      const ua = headersList.get("user-agent") || "unknown";
      const sessionId = cookiesList.get("session-id")?.value || "default";

      // Create a consistent string to hash
      const hashString = `${ip}-${ua}-${sessionId}`;

      // Simple hash function (consistent across server/client)
      let hash = 0;
      for (let i = 0; i < hashString.length; i++) {
        const char = hashString.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit
      }

      return Math.abs(hash) % 100;
    } catch (error) {
      // SSR context missing - use controlled fallback with telemetry
      telemetry.ssrRequestContextMissing(
        error instanceof Error ? error.message : String(error),
      );
      return 42; // Consistent fallback for SSR
    }
  },

  // Select variant based on weight (same logic as client)
  selectVariant: async (experiment: unknown): Promise<string> => {
    const userHash = await experimentUtils.getRequestHash();
    let cumulativeWeight = 0;

    for (const variant of experiment.variants) {
      cumulativeWeight += variant.weight;
      if (userHash < cumulativeWeight) {
        return variant.id;
      }
    }

    // Fallback to first variant
    return experiment.variants[0]?.id || "control";
  },

  // Check if experiment is active
  isExperimentActive: (experimentId: string): boolean => {
    const experiment = EXPERIMENTS.find((exp) => exp.id === experimentId);
    return experiment?.active || false;
  },
};

// Server-side flag resolution
export async function getServerFlags() {
  const experiments: Record<string, string> = {};
  const flags: Record<string, unknown> = {};

  // Resolve experiment variants
  for (const experiment of EXPERIMENTS) {
    if (experimentUtils.isExperimentActive(experiment.id)) {
      const variant = await experimentUtils.selectVariant(experiment);
      experiments[experiment.id] = variant;
    } else {
      experiments[experiment.id] = "control";
    }
  }

  // Copy feature flags
  Object.assign(flags, FEATURES);

  return {
    experiments,
    flags,
  };
}

// Export for testing
export { EXPERIMENTS, FEATURES };
