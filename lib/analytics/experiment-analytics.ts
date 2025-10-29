// Experiment Analytics - Track and analyze A/B test performance
// Simple analytics system that can be extended with external services

import type { ExperimentEvent } from "../experiments/types";

// In-memory storage for development - replace with database in production
const eventStore: ExperimentEvent[] = [];

/**
 * Track experiment event
 */
export function trackExperimentEvent(event: ExperimentEvent): void {
  eventStore.push({
    ...event,
    timestamp: event.timestamp || new Date(),
  });

  // In production, send to analytics service
  sendToAnalytics(event);

  // Log for debugging
  console.log("📊 Experiment Event:", {
    experiment: event.experimentId,
    variant: event.variantId,
    type: event.eventType,
    user: event.userId?.slice(0, 8) + "...", // Truncate for privacy
  });
}

/**
 * Send event to external analytics service
 * Replace with actual implementation (GA4, Mixpanel, etc.)
 */
function sendToAnalytics(event: ExperimentEvent): void {
  // Google Analytics 4
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", `experiment_${event.eventType}`, {
      experiment_id: event.experimentId,
      variant_id: event.variantId,
      event_name: event.eventName,
      custom_parameters: {
        user_id: event.userId,
        session_id: event.sessionId,
        ...event.metadata,
      },
    });
  }

  // Mixpanel
  if (typeof window !== "undefined" && (window as any).mixpanel) {
    (window as any).mixpanel.track(`experiment_${event.eventType}`, {
      experiment_id: event.experimentId,
      variant_id: event.variantId,
      distinct_id: event.userId,
      ...event.metadata,
    });
  }

  // Custom analytics endpoint
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
    fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    }).catch((err) => console.warn("Analytics send failed:", err));
  }
}

/**
 * Get experiment metrics for analysis
 */
export function getExperimentMetrics(experimentId: string) {
  const events = eventStore.filter((e) => e.experimentId === experimentId);

  const variants = [...new Set(events.map((e) => e.variantId))];

  const metrics = variants.map((variantId) => {
    const variantEvents = events.filter((e) => e.variantId === variantId);
    const views = variantEvents.filter((e) => e.eventType === "view").length;
    const clicks = variantEvents.filter((e) => e.eventType === "click").length;
    const conversions = variantEvents.filter(
      (e) => e.eventType === "convert",
    ).length;

    return {
      variantId,
      views,
      clicks,
      conversions,
      clickRate: views > 0 ? (clicks / views) * 100 : 0,
      conversionRate: views > 0 ? (conversions / views) * 100 : 0,
    };
  });

  return {
    experimentId,
    totalEvents: events.length,
    variants: metrics,
    startDate: events.length > 0 ? events[0].timestamp : null,
    endDate: events.length > 0 ? events[events.length - 1].timestamp : null,
  };
}

/**
 * Get all experiment metrics
 */
export function getAllExperimentMetrics() {
  const experimentIds = [...new Set(eventStore.map((e) => e.experimentId))];
  return experimentIds.map((id) => getExperimentMetrics(id));
}

/**
 * Clear stored events (for testing/development)
 */
export function clearAnalytics(): void {
  eventStore.length = 0;
}

/**
 * Export analytics data (for backup/analysis)
 */
export function exportAnalytics(): ExperimentEvent[] {
  return [...eventStore];
}

/**
 * Import analytics data (for restoration)
 */
export function importAnalytics(events: ExperimentEvent[]): void {
  eventStore.push(...events);
}
