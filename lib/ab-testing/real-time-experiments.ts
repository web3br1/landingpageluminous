// Real-Time A/B Testing for Themes
// Implements live experimentation with analytics and progressive rollout

export interface ExperimentConfig {
  id: string;
  name: string;
  description: string;
  type: "theme" | "content" | "layout";
  status: "draft" | "running" | "paused" | "completed";
  variants: {
    [key: string]: {
      name: string;
      themeId: string;
      weight: number; // Percentage (0-100)
      customTokens?: Record<string, any>;
    };
  };
  targeting: {
    userSegment?: string[];
    countries?: string[];
    devices?: ("mobile" | "tablet" | "desktop")[];
    userTypes?: ("new" | "returning" | "premium")[];
  };
  rollout: {
    percentage: number; // 0-100, how much of traffic to experiment
    startDate?: Date;
    endDate?: Date;
    minSampleSize?: number;
    confidenceThreshold?: number;
  };
  metrics: {
    primary: string; // e.g., 'cta_click', 'conversion'
    secondary: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ExperimentResult {
  experimentId: string;
  variant: string;
  userId: string;
  sessionId: string;
  timestamp: Date;
  metrics: {
    [metricName: string]: number | boolean;
  };
  context: {
    userAgent: string;
    country?: string;
    device?: string;
    referrer?: string;
  };
}

export interface ExperimentAnalytics {
  experimentId: string;
  totalUsers: number;
  variantStats: {
    [variantId: string]: {
      users: number;
      conversions: number;
      conversionRate: number;
      confidence: number;
      uplift: number;
      statisticalSignificance: boolean;
    };
  };
  timeSeries: Array<{
    timestamp: Date;
    variants: {
      [variantId: string]: {
        users: number;
        conversions: number;
      };
    };
  }>;
  winner?: string;
  confidence: number;
}

// Real-time experiment configurations
export const REAL_TIME_EXPERIMENTS: Record<string, ExperimentConfig> = {
  "theme-hero-optimization": {
    id: "theme-hero-optimization",
    name: "Hero Theme Optimization",
    description: "Test Liquid Glass vs Tech Blueprint in hero sections",
    type: "theme",
    status: "running",
    variants: {
      A: {
        name: "Liquid Glass",
        themeId: "liquid-glass",
        weight: 50,
      },
      B: {
        name: "Tech Blueprint",
        themeId: "tech-blueprint",
        weight: 50,
      },
    },
    targeting: {
      userSegment: ["free", "trial"],
      countries: ["BR", "US", "DE"],
      devices: ["mobile", "desktop"],
    },
    rollout: {
      percentage: 25, // Start with 25% of traffic
      startDate: new Date("2024-01-01"),
      minSampleSize: 1000,
      confidenceThreshold: 95,
    },
    metrics: {
      primary: "cta_click",
      secondary: ["scroll_depth", "time_on_page", "bounce_rate"],
    },
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },

  "theme-card-layout": {
    id: "theme-card-layout",
    name: "Card Layout Theme Test",
    description: "Test different card layouts with theme variations",
    type: "layout",
    status: "running",
    variants: {
      A: {
        name: "Standard Cards",
        themeId: "liquid-glass",
        weight: 33,
        customTokens: {
          cardBorderRadius: "0.5rem",
          cardShadow: "sm",
        },
      },
      B: {
        name: "Glass Cards",
        themeId: "liquid-glass",
        weight: 33,
        customTokens: {
          cardBorderRadius: "1rem",
          cardShadow: "lg",
          cardBackdrop: true,
        },
      },
      C: {
        name: "Blueprint Cards",
        themeId: "tech-blueprint",
        weight: 34,
        customTokens: {
          cardBorderRadius: "0.25rem",
          cardShadow: "none",
          cardGrid: true,
        },
      },
    },
    targeting: {
      userSegment: ["trial", "premium"],
      devices: ["desktop", "tablet"],
    },
    rollout: {
      percentage: 50,
      minSampleSize: 2000,
      confidenceThreshold: 90,
    },
    metrics: {
      primary: "feature_engagement",
      secondary: ["conversion", "time_on_page"],
    },
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
};

// Input validation schemas
const VALID_DEVICES = ["mobile", "tablet", "desktop"] as const;
const VALID_USER_TYPES = ["new", "returning", "premium"] as const;

function validateExperimentInput(
  experimentId: string,
  userId: string,
  context: Parameters<typeof assignRealTimeExperiment>[2],
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate experimentId
  if (!experimentId || typeof experimentId !== "string") {
    errors.push("experimentId must be a non-empty string");
  } else if (experimentId.length > 100) {
    errors.push("experimentId must be less than 100 characters");
  }

  // Validate userId
  if (!userId || typeof userId !== "string") {
    errors.push("userId must be a non-empty string");
  } else if (userId.length > 255) {
    errors.push("userId must be less than 255 characters");
  }

  // Validate context object
  if (context && typeof context !== "object") {
    errors.push("context must be an object");
  } else if (context) {
    // Validate device
    if (context.device && !VALID_DEVICES.includes(context.device)) {
      errors.push(`device must be one of: ${VALID_DEVICES.join(", ")}`);
    }

    // Validate userType
    if (context.userType && !VALID_USER_TYPES.includes(context.userType)) {
      errors.push(`userType must be one of: ${VALID_USER_TYPES.join(", ")}`);
    }

    // Validate country (ISO alpha-2)
    if (
      context.country &&
      (typeof context.country !== "string" || context.country.length !== 2)
    ) {
      errors.push("country must be a 2-character ISO alpha-2 code");
    }

    // Validate userAgent
    if (context.userAgent && typeof context.userAgent !== "string") {
      errors.push("userAgent must be a string");
    }

    // Validate referrer
    if (context.referrer && typeof context.referrer !== "string") {
      errors.push("referrer must be a string");
    }
  }

  return { isValid: errors.length === 0, errors };
}

// Real-time experiment assignment with progressive rollout and input validation
export function assignRealTimeExperiment(
  experimentId: string,
  userId: string,
  context: {
    userAgent?: string;
    country?: string;
    device?: "mobile" | "tablet" | "desktop";
    userType?: "new" | "returning" | "premium";
    referrer?: string;
  } = {},
): {
  variant: string;
  themeId: string;
  experimentId: string;
  customTokens?: Record<string, any>;
  shouldTrack: boolean;
} {
  // Validate inputs
  const validation = validateExperimentInput(experimentId, userId, context);
  if (!validation.isValid) {
    console.warn("[A/B Testing] Invalid input:", validation.errors);
    return {
      variant: "control",
      themeId: "liquid-glass",
      experimentId,
      shouldTrack: false,
    };
  }

  const experiment = REAL_TIME_EXPERIMENTS[experimentId];

  if (!experiment || experiment.status !== "running") {
    return {
      variant: "control",
      themeId: "liquid-glass",
      experimentId,
      shouldTrack: false,
    };
  }

  // Check targeting rules
  if (!matchesTargeting(experiment.targeting, context)) {
    return {
      variant: "control",
      themeId: "liquid-glass",
      experimentId,
      shouldTrack: false,
    };
  }

  // Progressive rollout check
  const rolloutPercentage = experiment.rollout.percentage;
  const userRolloutHash = hashString(`${experimentId}:${userId}`) % 100;

  if (userRolloutHash >= rolloutPercentage) {
    return {
      variant: "control",
      themeId: "liquid-glass",
      experimentId,
      shouldTrack: false,
    };
  }

  // Assign variant using consistent hashing
  const variantHash = hashString(`${experimentId}:${userId}:variant`) % 100;
  let cumulativeWeight = 0;

  for (const [variantId, variant] of Object.entries(experiment.variants)) {
    cumulativeWeight += variant.weight;
    if (variantHash < cumulativeWeight) {
      return {
        variant: variantId,
        themeId: variant.themeId,
        experimentId,
        customTokens: variant.customTokens,
        shouldTrack: true,
      };
    }
  }

  // Fallback
  return {
    variant: "A",
    themeId: experiment.variants.A.themeId,
    experimentId,
    customTokens: experiment.variants.A.customTokens,
    shouldTrack: true,
  };
}

// Check if user matches targeting criteria
function matchesTargeting(
  targeting: ExperimentConfig["targeting"],
  context: Parameters<typeof assignRealTimeExperiment>[2],
): boolean {
  // Early return if no context
  if (!context) {
    return false;
  }

  // User segment check
  if (targeting.userSegment && context.userType) {
    const userTypeMap = {
      new: "free",
      returning: "trial",
      premium: "premium",
    };
    const mappedType = userTypeMap[context.userType];
    if (!targeting.userSegment.includes(mappedType)) {
      return false;
    }
  }

  // Country check
  if (targeting.countries && context.country) {
    if (!targeting.countries.includes(context.country)) {
      return false;
    }
  }

  // Device check
  if (targeting.devices && context.device) {
    if (!targeting.devices.includes(context.device)) {
      return false;
    }
  }

  return true;
}

// Optimized hash function with caching for better performance
const hashCache = new Map<string, number>();
const MAX_CACHE_SIZE = 1000;

function hashString(str: string): number {
  // Check cache first
  if (hashCache.has(str)) {
    return hashCache.get(str)!;
  }

  // FNV-1a hash (faster and better distribution than djb2)
  let hash = 2166136261; // FNV offset basis

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash ^= char;
    hash *= 16777619; // FNV prime
    hash = hash >>> 0; // Convert to unsigned 32-bit
  }

  // Ensure positive number for consistent bucketing
  const positiveHash = hash >>> 0;

  // Cache the result (with LRU-like eviction)
  if (hashCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entries (simple FIFO eviction)
    const firstKey = hashCache.keys().next().value;
    if (firstKey !== undefined) {
      hashCache.delete(firstKey);
    }
  }
  hashCache.set(str, positiveHash);

  return positiveHash;
}

// Track experiment events with input validation and circuit breaker
export async function trackExperimentEvent(
  experimentId: string,
  variant: string,
  userId: string,
  sessionId: string,
  eventName: string,
  value: number | boolean = 1,
  context: ExperimentResult["context"] = { userAgent: "" },
): Promise<void> {
  // Validate inputs
  if (
    !experimentId ||
    typeof experimentId !== "string" ||
    !variant ||
    typeof variant !== "string" ||
    !userId ||
    typeof userId !== "string" ||
    !sessionId ||
    typeof sessionId !== "string" ||
    !eventName ||
    typeof eventName !== "string"
  ) {
    console.warn("[A/B Testing] Invalid tracking input");
    return;
  }

  if (typeof value !== "number" && typeof value !== "boolean") {
    console.warn("[A/B Testing] Invalid value type");
    return;
  }

  if (
    experimentId.length > 100 ||
    userId.length > 255 ||
    sessionId.length > 255 ||
    eventName.length > 100
  ) {
    console.warn("[A/B Testing] Input too long");
    return;
  }

  const result: ExperimentResult = {
    experimentId,
    variant,
    userId,
    sessionId,
    timestamp: new Date(),
    metrics: {
      [eventName]: value,
    },
    context,
  };

  // Import circuit breaker dynamically to avoid circular dependencies
  const { withAnalyticsResilience } = await import(
    "./analytics-circuit-breaker"
  );

  await withAnalyticsResilience(
    async () => {
      // In a real implementation, this would send to analytics service
      console.log("📊 Experiment Event:", result);

      // For demo: store in localStorage (replace with real analytics)
      if (typeof localStorage !== "undefined") {
        const key = `experiment_${experimentId}_${userId}_${sessionId}`;
        const existing = localStorage.getItem(key);
        const data = existing ? JSON.parse(existing) : {};

        data[eventName] =
          (data[eventName] || 0) + (typeof value === "number" ? value : 1);
        data.lastUpdate = new Date().toISOString();

        localStorage.setItem(key, JSON.stringify(data));
      }

      // Simulate network delay for demo
      await new Promise((resolve) => setTimeout(resolve, 10));
    },
    {
      fallback: () => {
        console.log("📊 Experiment Event (fallback):", result);
        // Fallback: just log, don't throw
        return null;
      },
    },
  );
}

// Get experiment analytics
export function getExperimentAnalytics(
  experimentId: string,
): ExperimentAnalytics | null {
  const experiment = REAL_TIME_EXPERIMENTS[experimentId];
  if (!experiment) return null;

  // In a real implementation, this would aggregate from analytics database
  // For demo, we'll simulate with localStorage data

  const variantStats: ExperimentAnalytics["variantStats"] = {};
  let totalUsers = 0;

  // Initialize variants
  Object.keys(experiment.variants).forEach((variantId) => {
    variantStats[variantId] = {
      users: 0,
      conversions: 0,
      conversionRate: 0,
      confidence: 0,
      uplift: 0,
      statisticalSignificance: false,
    };
  });

  // Aggregate data from localStorage (demo only)
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(`experiment_${experimentId}_`)) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || "{}");
        const variant = key.split("_")[2]; // Extract variant from key

        if (variantStats[variant]) {
          variantStats[variant].users++;
          variantStats[variant].conversions += data.cta_click || 0;
          totalUsers++;
        }
      } catch (e) {
        // Ignore invalid data
      }
    }
  }

  // Calculate rates and stats
  Object.keys(variantStats).forEach((variantId) => {
    const stats = variantStats[variantId];
    stats.conversionRate =
      stats.users > 0 ? stats.conversions / stats.users : 0;

    // Calculate statistical significance (simplified)
    stats.statisticalSignificance = stats.users >= 100; // Basic threshold
    stats.confidence = Math.min((stats.users / 100) * 100, 100); // Mock confidence
  });

  // Calculate uplift vs control (variant A)
  const controlRate = variantStats.A?.conversionRate || 0;
  Object.keys(variantStats).forEach((variantId) => {
    if (variantId !== "A" && controlRate > 0) {
      variantStats[variantId].uplift =
        ((variantStats[variantId].conversionRate - controlRate) / controlRate) *
        100;
    }
  });

  // Determine winner
  let winner: string | undefined;
  let maxRate = 0;
  let maxConfidence = 0;

  Object.entries(variantStats).forEach(([variantId, stats]) => {
    if (stats.conversionRate > maxRate && stats.confidence >= 80) {
      maxRate = stats.conversionRate;
      maxConfidence = stats.confidence;
      winner = variantId;
    }
  });

  return {
    experimentId,
    totalUsers,
    variantStats,
    timeSeries: [], // Would be populated with real time series data
    winner:
      winner &&
      experiment.rollout?.confidenceThreshold &&
      maxConfidence >= experiment.rollout.confidenceThreshold
        ? winner
        : undefined,
    confidence: maxConfidence,
  };
}

// Auto-rollout winning variants
export function checkAutoRollout(experimentId: string): boolean {
  const analytics = getExperimentAnalytics(experimentId);
  if (!analytics?.winner) return false;

  const experiment = REAL_TIME_EXPERIMENTS[experimentId];
  if (!experiment) return false;

  // Check if we have statistical significance and confidence
  const winnerStats = analytics.variantStats[analytics.winner];
  if (!winnerStats?.statisticalSignificance) return false;

  if (analytics.confidence >= (experiment.rollout.confidenceThreshold || 95)) {
    // Auto-increase rollout percentage
    const currentPercentage = experiment.rollout.percentage;
    const newPercentage = Math.min(currentPercentage + 25, 100);

    if (newPercentage > currentPercentage) {
      experiment.rollout.percentage = newPercentage;
      experiment.updatedAt = new Date();

      console.log(
        `🚀 Auto-rollout: ${experimentId} increased to ${newPercentage}%`,
      );
      return true;
    }
  }

  return false;
}
