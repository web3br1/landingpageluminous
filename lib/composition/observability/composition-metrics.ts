import { metrics } from "../../observability/metrics";
import type { PageType, SectionId } from "../ports";

// ===== COMPOSITION-SPECIFIC METRICS =====

export class CompositionMetrics {
  private static instance: CompositionMetrics | null = null;

  static getInstance(): CompositionMetrics {
    if (!this.instance) {
      this.instance = new CompositionMetrics();
    }
    return this.instance;
  }

  // ===== PAGE COMPOSITION METRICS =====

  recordPageCompositionStart(
    pageType: PageType,
    context?: Record<string, unknown>,
  ) {
    metrics.incrementCounter("page_composition_started_total", 1, {
      page_type: pageType,
      has_context: context ? "true" : "false",
    });
  }

  recordPageCompositionComplete(
    pageType: PageType,
    durationMs: number,
    sectionCount: number,
  ) {
    metrics.recordHistogram("page_composition_duration_ms", durationMs, {
      page_type: pageType,
      sections_count: sectionCount.toString(),
    });

    metrics.incrementCounter("page_composition_completed_total", 1, {
      page_type: pageType,
      sections_count: sectionCount.toString(),
    });
  }

  recordPageCompositionError(
    pageType: PageType,
    errorType: string,
    durationMs?: number,
  ) {
    metrics.incrementCounter("page_composition_errors_total", 1, {
      page_type: pageType,
      error_type: errorType,
    });

    if (durationMs !== undefined) {
      metrics.recordHistogram(
        "page_composition_error_duration_ms",
        durationMs,
        {
          page_type: pageType,
          error_type: errorType,
        },
      );
    }
  }

  // ===== SECTION PROCESSING METRICS =====

  recordSectionProcessingStart(sectionId: SectionId, pageType: PageType) {
    metrics.incrementCounter("section_processing_started_total", 1, {
      section_id: sectionId,
      page_type: pageType,
    });
  }

  recordSectionProcessingComplete(
    sectionId: SectionId,
    pageType: PageType,
    durationMs: number,
  ) {
    metrics.recordHistogram("section_processing_duration_ms", durationMs, {
      section_id: sectionId,
      page_type: pageType,
    });

    metrics.incrementCounter("section_processing_completed_total", 1, {
      section_id: sectionId,
      page_type: pageType,
    });
  }

  recordSectionProcessingError(
    sectionId: SectionId,
    pageType: PageType,
    errorType: string,
  ) {
    metrics.incrementCounter("section_processing_errors_total", 1, {
      section_id: sectionId,
      page_type: pageType,
      error_type: errorType,
    });
  }

  // ===== CONTENT NORMALIZATION METRICS =====

  recordContentNormalization(
    sectionId: SectionId,
    operation: "normalize" | "validate" | "merge",
  ) {
    metrics.incrementCounter("content_normalization_operations_total", 1, {
      section_id: sectionId,
      operation,
    });
  }

  recordContentNormalizationError(
    sectionId: SectionId,
    operation: string,
    errorType: string,
  ) {
    metrics.incrementCounter("content_normalization_errors_total", 1, {
      section_id: sectionId,
      operation,
      error_type: errorType,
    });
  }

  // ===== LAZY LOADING METRICS =====

  recordLazyLoadingDecision(
    sectionId: SectionId,
    decision: "immediate" | "high" | "medium" | "low" | "deferred",
  ) {
    metrics.incrementCounter("lazy_loading_decisions_total", 1, {
      section_id: sectionId,
      decision,
    });
  }

  recordLazyLoadingTrigger(sectionId: SectionId, trigger: string) {
    metrics.incrementCounter("lazy_loading_triggers_total", 1, {
      section_id: sectionId,
      trigger,
    });
  }

  // ===== FALLBACK METRICS =====

  recordFallbackUsed(
    pageType: PageType,
    fallbackType: "page" | "section",
    reason: string,
  ) {
    metrics.incrementCounter("fallback_usage_total", 1, {
      page_type: pageType,
      fallback_type: fallbackType,
      reason,
    });
  }

  // ===== EXPERIMENT METRICS =====

  recordExperimentApplied(
    experimentId: string,
    variant: string,
    sectionIds: SectionId[],
  ) {
    metrics.incrementCounter("experiment_applications_total", 1, {
      experiment_id: experimentId,
      variant,
      sections_affected: sectionIds.length.toString(),
    });
  }

  // ===== PERFORMANCE MONITORING METRICS =====

  recordCompositionMemoryUsage(pageType: PageType, memoryDelta: number) {
    metrics.recordHistogram("composition_memory_delta_bytes", memoryDelta, {
      page_type: pageType,
    });
  }

  recordCompositionCpuTime(pageType: PageType, cpuTimeMs: number) {
    metrics.recordHistogram("composition_cpu_time_ms", cpuTimeMs, {
      page_type: pageType,
    });
  }

  // ===== CACHE METRICS =====

  recordContentCacheHit(
    sectionId: SectionId,
    cacheType: "memory" | "redis" | "cdn",
  ) {
    metrics.recordCacheHit(`composition_content_${cacheType}`, true);
  }

  recordContentCacheMiss(
    sectionId: SectionId,
    cacheType: "memory" | "redis" | "cdn",
  ) {
    metrics.recordCacheHit(`composition_content_${cacheType}`, false);
  }

  // ===== SYNCHRONOUS VS ASYNCHRONOUS METRICS =====

  recordCompositionMode(pageType: PageType, mode: "sync" | "async") {
    metrics.incrementCounter("composition_mode_usage_total", 1, {
      page_type: pageType,
      mode,
    });
  }

  // ===== HEALTH CHECK METRICS =====

  recordHealthCheck(status: "healthy" | "degraded" | "unhealthy") {
    metrics.setGauge(
      "composition_system_health",
      status === "healthy" ? 1 : status === "degraded" ? 0.5 : 0,
    );
  }

  recordServiceAvailability(service: string, available: boolean) {
    metrics.setGauge("composition_service_availability", available ? 1 : 0, {
      service,
    });
  }

  // ===== BUSINESS IMPACT METRICS =====

  recordPageLoadImpact(
    pageType: PageType,
    lcpImpact: number,
    clsImpact: number,
  ) {
    metrics.recordHistogram("page_load_lcp_impact_ms", lcpImpact, {
      page_type: pageType,
    });

    metrics.recordHistogram("page_load_cls_impact", clsImpact, {
      page_type: pageType,
    });
  }

  recordConversionImpact(experimentId: string, conversionLift: number) {
    metrics.recordHistogram("experiment_conversion_impact", conversionLift, {
      experiment_id: experimentId,
    });
  }
}

// ===== GLOBAL INSTANCE =====

export const compositionMetrics = CompositionMetrics.getInstance();

// ===== UTILITY FUNCTIONS =====

export function withCompositionMetrics<T extends unknown[], R>(
  operation: string,
  sectionId: SectionId,
  pageType: PageType,
  fn: (...args: T) => R,
): (...args: T) => R {
  return (...args: T) => {
    const startTime = Date.now();

    compositionMetrics.recordSectionProcessingStart(sectionId, pageType);

    try {
      const result = fn(...args);
      const duration = Date.now() - startTime;

      compositionMetrics.recordSectionProcessingComplete(
        sectionId,
        pageType,
        duration,
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      compositionMetrics.recordSectionProcessingError(
        sectionId,
        pageType,
        error instanceof Error ? error.name : "unknown",
      );

      throw error;
    }
  };
}

export async function withCompositionMetricsAsync<T extends unknown[], R>(
  operation: string,
  sectionId: SectionId,
  pageType: PageType,
  fn: (...args: T) => Promise<R>,
  args: T,
): Promise<R> {
  const startTime = Date.now();

  compositionMetrics.recordSectionProcessingStart(sectionId, pageType);

  try {
    const result = await fn(...args);
    const duration = Date.now() - startTime;

    compositionMetrics.recordSectionProcessingComplete(
      sectionId,
      pageType,
      duration,
    );

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    compositionMetrics.recordSectionProcessingError(
      sectionId,
      pageType,
      error instanceof Error ? error.name : "unknown",
    );

    throw error;
  }
}
