/**
 * Distributed Tracing System - Fase 3
 * Sistema de tracing distribuído para rastreamento end-to-end de requests
 */

import { logger } from "./logger";
import { getEnhancedLogger } from "./log-aggregator";

/**
 * Trace Context
 */
export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  correlationId: string;
  requestId: string;
  userId?: string;
  sessionId?: string;
  startTime: number;
  tags: Record<string, string>;
}

/**
 * Span Information
 */
export interface SpanInfo {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  status: "started" | "completed" | "error";
  attributes: Record<string, unknown>;
  events: SpanEvent[];
  children: SpanInfo[];
  parentId?: string;
}

/**
 * Span Event
 */
export interface SpanEvent {
  name: string;
  timestamp: number;
  attributes: Record<string, unknown>;
}

/**
 * Trace Information
 */
export interface TraceInfo {
  traceId: string;
  rootSpan: SpanInfo;
  totalSpans: number;
  totalDuration: number;
  status: "active" | "completed" | "error";
  errorCount: number;
  serviceCount: number;
  services: string[];
  startTime: number;
  endTime?: number;
}

/**
 * Performance Analysis
 */
export interface PerformanceAnalysis {
  totalDuration: number;
  spanCount: number;
  avgSpanDuration: number;
  longestSpan: {
    id: string;
    name: string;
    duration: number;
  };
  slowestSpans: Array<{
    id: string;
    name: string;
    duration: number;
    percentage: number;
  }>;
  errorSpans: SpanInfo[];
  bottlenecks: Array<{
    spanId: string;
    spanName: string;
    duration: number;
    percentage: number;
    suggestion: string;
  }>;
}

/**
 * Distributed Tracer
 */
export class DistributedTracer {
  private activeTraces = new Map<string, TraceInfo>();
  private activeSpans = new Map<string, SpanInfo>();
  private spanStack: SpanInfo[] = [];
  private maxTraces: number = 1000;
  private maxSpansPerTrace: number = 1000;
  private slowThresholdMs: number = 1000; // 1 second

  private enhancedLogger = getEnhancedLogger();

  /**
   * Start a new trace
   */
  startTrace(
    name: string,
    correlationId?: string,
    requestId?: string,
    userId?: string,
    sessionId?: string,
    initialTags: Record<string, string> = {},
  ): TraceContext {
    const traceId = this.generateTraceId();
    const spanId = this.generateSpanId();
    const startTime = Date.now();

    const context: TraceContext = {
      traceId,
      spanId,
      correlationId: correlationId || `corr_${traceId}`,
      requestId: requestId || `req_${traceId}`,
      userId,
      sessionId,
      startTime,
      tags: {
        service: "landing-page",
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV || "development",
        ...initialTags,
      },
    };

    // Create root span
    const rootSpan: SpanInfo = {
      id: spanId,
      name,
      startTime,
      status: "started",
      attributes: {
        "span.type": "root",
        "trace.root": true,
        ...context.tags,
      },
      events: [],
      children: [],
    };

    // Create trace info
    const traceInfo: TraceInfo = {
      traceId,
      rootSpan,
      totalSpans: 1,
      totalDuration: 0,
      status: "active",
      errorCount: 0,
      serviceCount: 1,
      services: ["landing-page"],
      startTime,
    };

    this.activeTraces.set(traceId, traceInfo);
    this.activeSpans.set(spanId, rootSpan);
    this.spanStack.push(rootSpan);

    // Cleanup old traces if needed
    this.cleanupOldTraces();

    this.enhancedLogger.info(`Trace started: ${name}`, "tracer", {
      traceId,
      spanId,
      correlationId: context.correlationId,
      requestId: context.requestId,
      userId,
      sessionId,
    });

    return context;
  }

  /**
   * Start a new span within the current trace
   */
  startSpan(
    name: string,
    parentSpanId?: string,
    attributes: Record<string, unknown> = {},
  ): string | null {
    if (this.spanStack.length === 0) {
      logger.warn("Cannot start span: no active trace");
      return null;
    }

    const parentSpan = parentSpanId
      ? this.activeSpans.get(parentSpanId)
      : this.spanStack[this.spanStack.length - 1];

    if (!parentSpan) {
      logger.warn("Cannot start span: parent span not found", { parentSpanId });
      return null;
    }

    const spanId = this.generateSpanId();
    const startTime = Date.now();

    const span: SpanInfo = {
      id: spanId,
      name,
      startTime,
      status: "started",
      attributes: {
        "span.type": "child",
        ...attributes,
      },
      events: [],
      children: [],
      parentId: parentSpan.id,
    };

    // Add to parent's children
    parentSpan.children.push(span);

    // Update trace info
    const traceInfo = this.findTraceBySpanId(parentSpan.id);
    if (traceInfo) {
      traceInfo.totalSpans++;

      // Check span limit
      if (traceInfo.totalSpans > this.maxSpansPerTrace) {
        logger.warn("Trace span limit exceeded", {
          traceId: traceInfo.traceId,
          spanCount: traceInfo.totalSpans,
          limit: this.maxSpansPerTrace,
        });
        return null;
      }
    }

    this.activeSpans.set(spanId, span);
    this.spanStack.push(span);

    this.enhancedLogger.debug(`Span started: ${name}`, "tracer", {
      spanId,
      parentSpanId: parentSpan.id,
      traceId: traceInfo?.traceId,
    });

    return spanId;
  }

  /**
   * End the current span
   */
  endSpan(spanId?: string, error?: Error): void {
    const targetSpanId =
      spanId || this.spanStack[this.spanStack.length - 1]?.id;

    if (!targetSpanId) {
      logger.warn("Cannot end span: no active span");
      return;
    }

    const span = this.activeSpans.get(targetSpanId);
    if (!span) {
      logger.warn("Cannot end span: span not found", { spanId: targetSpanId });
      return;
    }

    const endTime = Date.now();
    span.endTime = endTime;
    span.duration = endTime - span.startTime;
    span.status = error ? "error" : "completed";

    if (error) {
      span.attributes.error = error.message;
      span.events.push({
        name: "exception",
        timestamp: endTime,
        attributes: {
          "exception.type": error.name,
          "exception.message": error.message,
          "exception.stack": error.stack,
        },
      });
    }

    // Remove from stack
    if (this.spanStack[this.spanStack.length - 1]?.id === targetSpanId) {
      this.spanStack.pop();
    }

    // Update trace info
    const traceInfo = this.findTraceBySpanId(targetSpanId);
    if (traceInfo) {
      if (error) {
        traceInfo.errorCount++;
      }

      // Check if this completes the trace
      if (span.attributes["trace.root"]) {
        this.completeTrace(traceInfo.traceId);
      }

      // Performance analysis
      if (span.duration && span.duration > this.slowThresholdMs) {
        this.enhancedLogger.warn(`Slow span detected: ${span.name}`, "tracer", {
          spanId: targetSpanId,
          duration: span.duration,
          threshold: this.slowThresholdMs,
          traceId: traceInfo.traceId,
        });
      }
    }

    this.enhancedLogger.debug(`Span ended: ${span.name}`, "tracer", {
      spanId: targetSpanId,
      duration: span.duration,
      status: span.status,
      error: error?.message,
    });
  }

  /**
   * Add event to current span
   */
  addSpanEvent(name: string, attributes: Record<string, any> = {}): void {
    const currentSpan = this.spanStack[this.spanStack.length - 1];
    if (!currentSpan) {
      logger.warn("Cannot add event: no active span");
      return;
    }

    currentSpan.events.push({
      name,
      timestamp: Date.now(),
      attributes,
    });

    this.enhancedLogger.debug(`Span event: ${name}`, "tracer", {
      spanId: currentSpan.id,
      eventName: name,
      attributes,
    });
  }

  /**
   * Set attributes on current span
   */
  setSpanAttributes(attributes: Record<string, any>): void {
    const currentSpan = this.spanStack[this.spanStack.length - 1];
    if (!currentSpan) {
      logger.warn("Cannot set attributes: no active span");
      return;
    }

    Object.assign(currentSpan.attributes, attributes);
  }

  /**
   * Get current trace context
   */
  getCurrentContext(): TraceContext | null {
    const currentSpan = this.spanStack[this.spanStack.length - 1];
    if (!currentSpan) return null;

    const traceInfo = this.findTraceBySpanId(currentSpan.id);
    if (!traceInfo) return null;

    return {
      traceId: traceInfo.traceId,
      spanId: currentSpan.id,
      parentSpanId: currentSpan.parentId,
      correlationId:
        (traceInfo.rootSpan.attributes.correlationId as string) || "",
      requestId: (traceInfo.rootSpan.attributes.requestId as string) || "",
      userId: traceInfo.rootSpan.attributes.userId as string,
      sessionId: traceInfo.rootSpan.attributes.sessionId as string,
      startTime: traceInfo.startTime,
      tags: Object.fromEntries(
        Object.entries(traceInfo.rootSpan.attributes)
          .filter(([_, value]) => typeof value === "string")
          .map(([key, value]) => [key, value as string]),
      ),
    };
  }

  /**
   * Get trace information
   */
  getTrace(traceId: string): TraceInfo | null {
    return this.activeTraces.get(traceId) || null;
  }

  /**
   * Get all active traces
   */
  getActiveTraces(): TraceInfo[] {
    return Array.from(this.activeTraces.values()).filter(
      (trace) => trace.status === "active",
    );
  }

  /**
   * Get completed traces
   */
  getCompletedTraces(limit: number = 50): TraceInfo[] {
    return Array.from(this.activeTraces.values())
      .filter((trace) => trace.status !== "active")
      .sort((a, b) => (b.endTime || 0) - (a.endTime || 0))
      .slice(0, limit);
  }

  /**
   * Analyze trace performance
   */
  analyzeTracePerformance(traceId: string): PerformanceAnalysis | null {
    const trace = this.activeTraces.get(traceId);
    if (!trace) return null;

    const allSpans = this.getAllSpans(trace.rootSpan);
    const completedSpans = allSpans.filter(
      (span) => span.status === "completed" && span.duration,
    );

    if (completedSpans.length === 0) {
      return {
        totalDuration: 0,
        spanCount: allSpans.length,
        avgSpanDuration: 0,
        longestSpan: { id: "", name: "", duration: 0 },
        slowestSpans: [],
        errorSpans: allSpans.filter((span) => span.status === "error"),
        bottlenecks: [],
      };
    }

    const totalDuration = trace.totalDuration || 0;
    const avgSpanDuration =
      completedSpans.reduce((sum, span) => sum + (span.duration || 0), 0) /
      completedSpans.length;
    const longestSpan = completedSpans.reduce((longest, span) =>
      (span.duration || 0) > (longest.duration || 0) ? span : longest,
    );

    // Find slowest spans (top 5)
    const slowestSpans = completedSpans
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 5)
      .map((span) => ({
        id: span.id,
        name: span.name,
        duration: span.duration || 0,
        percentage:
          totalDuration > 0 ? ((span.duration || 0) / totalDuration) * 100 : 0,
      }));

    // Identify bottlenecks
    const bottlenecks = slowestSpans
      .filter((span) => span.percentage > 50) // More than 50% of total time
      .map((span) => ({
        spanId: span.id,
        spanName: span.name,
        duration: span.duration,
        percentage: span.percentage,
        suggestion: this.generateBottleneckSuggestion(span),
      }));

    return {
      totalDuration,
      spanCount: allSpans.length,
      avgSpanDuration,
      longestSpan: {
        id: longestSpan.id,
        name: longestSpan.name,
        duration: longestSpan.duration || 0,
      },
      slowestSpans,
      errorSpans: allSpans.filter((span) => span.status === "error"),
      bottlenecks,
    };
  }

  /**
   * Export trace data
   */
  exportTrace(traceId: string): any {
    const trace = this.activeTraces.get(traceId);
    if (!trace) return null;

    return {
      traceId: trace.traceId,
      status: trace.status,
      startTime: trace.startTime,
      endTime: trace.endTime,
      totalDuration: trace.totalDuration,
      totalSpans: trace.totalSpans,
      errorCount: trace.errorCount,
      serviceCount: trace.serviceCount,
      services: trace.services,
      rootSpan: this.serializeSpan(trace.rootSpan),
      performanceAnalysis: this.analyzeTracePerformance(traceId),
      exportedAt: Date.now(),
    };
  }

  /**
   * Get tracer statistics
   */
  getStats() {
    const activeTraces = this.getActiveTraces();
    const completedTraces = this.getCompletedTraces(1000);

    const avgTraceDuration =
      completedTraces.length > 0
        ? completedTraces.reduce((sum, trace) => sum + trace.totalDuration, 0) /
          completedTraces.length
        : 0;

    const errorRate =
      completedTraces.length > 0
        ? completedTraces.reduce((sum, trace) => sum + trace.errorCount, 0) /
          completedTraces.length
        : 0;

    return {
      activeTraces: activeTraces.length,
      completedTraces: completedTraces.length,
      totalSpans: this.activeSpans.size,
      avgTraceDuration,
      errorRate,
      memoryUsage: {
        traces: this.activeTraces.size,
        spans: this.activeSpans.size,
        stackDepth: this.spanStack.length,
      },
    };
  }

  /**
   * Complete a trace
   */
  private completeTrace(traceId: string): void {
    const trace = this.activeTraces.get(traceId);
    if (!trace) return;

    trace.endTime = Date.now();
    trace.totalDuration = trace.endTime - trace.startTime;
    trace.status = trace.errorCount > 0 ? "error" : "completed";

    // Update service information
    const services = new Set<string>();
    this.collectServices(trace.rootSpan, services);
    trace.services = Array.from(services);
    trace.serviceCount = services.size;

    this.enhancedLogger.info(
      `Trace completed: ${trace.rootSpan.name}`,
      "tracer",
      {
        traceId,
        duration: trace.totalDuration,
        spans: trace.totalSpans,
        errors: trace.errorCount,
        services: trace.services,
      },
    );
  }

  /**
   * Find trace by span ID
   */
  private findTraceBySpanId(spanId: string): TraceInfo | null {
    for (const trace of this.activeTraces.values()) {
      if (this.spanBelongsToTrace(spanId, trace.rootSpan)) {
        return trace;
      }
    }
    return null;
  }

  /**
   * Check if span belongs to trace
   */
  private spanBelongsToTrace(spanId: string, rootSpan: SpanInfo): boolean {
    if (rootSpan.id === spanId) return true;

    for (const child of rootSpan.children) {
      if (this.spanBelongsToTrace(spanId, child)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get all spans in a trace
   */
  private getAllSpans(rootSpan: SpanInfo): SpanInfo[] {
    const spans = [rootSpan];

    for (const child of rootSpan.children) {
      spans.push(...this.getAllSpans(child));
    }

    return spans;
  }

  /**
   * Collect all services in a trace
   */
  private collectServices(span: SpanInfo, services: Set<string>): void {
    if (span.attributes.service) {
      services.add(span.attributes.service as string);
    }

    for (const child of span.children) {
      this.collectServices(child, services);
    }
  }

  /**
   * Serialize span for export
   */
  private serializeSpan(span: SpanInfo): any {
    return {
      id: span.id,
      name: span.name,
      startTime: span.startTime,
      endTime: span.endTime,
      duration: span.duration,
      status: span.status,
      attributes: span.attributes,
      events: span.events,
      children: span.children.map((child) => this.serializeSpan(child)),
    };
  }

  /**
   * Generate bottleneck suggestion
   */
  private generateBottleneckSuggestion(span: {
    id: string;
    name: string;
    duration: number;
    percentage: number;
  }): string {
    const suggestions: Record<string, string> = {
      api_call: "Consider implementing caching or optimizing the API call",
      database_query: "Check for missing indexes or optimize query structure",
      file_operation: "Consider using streaming or async file operations",
      external_service:
        "Review service response times and implement circuit breaker",
      rendering: "Optimize component rendering or implement virtualization",
      computation: "Consider memoization or algorithm optimization",
    };

    // Simple heuristic based on span name
    const spanType = span.name.toLowerCase();
    for (const [key, suggestion] of Object.entries(suggestions)) {
      if (spanType.includes(key)) {
        return suggestion;
      }
    }

    return "Review the operation for optimization opportunities";
  }

  /**
   * Generate unique trace ID
   */
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique span ID
   */
  private generateSpanId(): string {
    return `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup old traces
   */
  private cleanupOldTraces(): void {
    if (this.activeTraces.size <= this.maxTraces) return;

    // Remove oldest completed traces
    const completedTraces = Array.from(this.activeTraces.entries())
      .filter(([, trace]) => trace.status !== "active")
      .sort(([, a], [, b]) => (a.endTime || 0) - (b.endTime || 0));

    const tracesToRemove = completedTraces.slice(
      0,
      this.activeTraces.size - this.maxTraces,
    );

    for (const [traceId] of tracesToRemove) {
      this.activeTraces.delete(traceId);
    }

    if (tracesToRemove.length > 0) {
      logger.info("Cleaned up old traces", {
        removedCount: tracesToRemove.length,
        remainingTraces: this.activeTraces.size,
      });
    }
  }
}

// ===== SINGLETON INSTANCE =====

let tracerInstance: DistributedTracer | null = null;

export function getDistributedTracer(): DistributedTracer {
  if (!tracerInstance) {
    tracerInstance = new DistributedTracer();
  }
  return tracerInstance;
}

export function destroyDistributedTracer(): void {
  if (tracerInstance) {
    tracerInstance = null;
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Create a traced function wrapper
 */
export function traced<T extends any[], R>(
  name: string,
  fn: (...args: T) => Promise<R>,
  attributes: Record<string, unknown> = {},
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const tracer = getDistributedTracer();
    const spanId = tracer.startSpan(name, undefined, attributes);

    try {
      const result = await fn(...args);
      if (spanId) tracer.endSpan(spanId);
      return result;
    } catch (error) {
      if (spanId) tracer.endSpan(spanId, error as Error);
      throw error;
    }
  };
}

/**
 * Create a traced sync function wrapper
 */
export function tracedSync<T extends any[], R>(
  name: string,
  fn: (...args: T) => R,
  attributes: Record<string, unknown> = {},
): (...args: T) => R {
  return (...args: T): R => {
    const tracer = getDistributedTracer();
    const spanId = tracer.startSpan(name, undefined, attributes);

    try {
      const result = fn(...args);
      if (spanId) tracer.endSpan(spanId);
      return result;
    } catch (error) {
      if (spanId) tracer.endSpan(spanId, error as Error);
      throw error;
    }
  };
}

/**
 * Start trace with automatic context management
 */
export function withTrace<T>(
  name: string,
  fn: (context: TraceContext) => Promise<T>,
  correlationId?: string,
  requestId?: string,
  userId?: string,
  sessionId?: string,
  tags?: Record<string, string>,
): Promise<T> {
  const tracer = getDistributedTracer();
  const context = tracer.startTrace(
    name,
    correlationId,
    requestId,
    userId,
    sessionId,
    tags,
  );

  return fn(context).finally(() => {
    // End root span
    tracer.endSpan(context.spanId);
  });
}
