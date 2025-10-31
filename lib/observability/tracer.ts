import { logger } from "./logger";
import { metrics } from "./metrics";

// ===== TRACE CONTEXT =====

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  service: string;
  operation: string;
  startTime: number;
  tags: Record<string, string | number | boolean>;
  baggage: Record<string, string>;
}

// ===== SPAN =====

export interface Span {
  id: string;
  traceId: string;
  parentSpanId?: string;
  name: string;
  service: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags: Record<string, string | number | boolean>;
  logs: Array<{
    timestamp: number;
    level: string;
    message: string;
    fields?: Record<string, unknown>;
  }>;
  references: SpanReference[];
  status: "started" | "completed" | "error";
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
}

export interface SpanReference {
  type: "child_of" | "follows_from";
  traceId: string;
  spanId: string;
}

// ===== TRACE =====

export interface Trace {
  id: string;
  service: string;
  operation: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  spans: Span[];
  status: "active" | "completed" | "error";
}

// ===== TRACER =====

export class Tracer {
  private activeSpans: Map<string, Span> = new Map();
  private traces: Map<string, Trace> = new Map();
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(
    private config: {
      serviceName: string;
      enableRemote: boolean;
      remoteEndpoint?: string;
      flushInterval: number;
      sampleRate: number; // 0-1
    },
  ) {
    if (config.enableRemote && config.remoteEndpoint) {
      this.startFlushInterval();
    }
  }

  // ===== SPAN MANAGEMENT =====

  startSpan(
    operation: string,
    parentContext?: TraceContext,
    tags: Record<string, string | number | boolean> = {},
  ): Span {
    const spanId = this.generateSpanId();
    const traceId = parentContext?.traceId || this.generateTraceId();
    const parentSpanId = parentContext?.spanId;

    const span: Span = {
      id: spanId,
      traceId,
      parentSpanId,
      name: operation,
      service: this.config.serviceName,
      startTime: Date.now(),
      tags: {
        ...tags,
        service: this.config.serviceName,
      },
      logs: [],
      references: parentSpanId
        ? [
            {
              type: "child_of",
              traceId,
              spanId: parentSpanId,
            },
          ]
        : [],
      status: "started",
    };

    // Sample decision
    if (Math.random() > this.config.sampleRate) {
      span.tags.sampled = false;
    } else {
      span.tags.sampled = true;
    }

    this.activeSpans.set(spanId, span);

    // Create or update trace
    if (!this.traces.has(traceId)) {
      this.traces.set(traceId, {
        id: traceId,
        service: this.config.serviceName,
        operation,
        startTime: span.startTime,
        spans: [span],
        status: "active",
      });
    } else {
      const trace = this.traces.get(traceId)!;
      trace.spans.push(span);
    }

    // Log span start
    logger.debug(`Started span: ${operation}`, {
      traceId,
      spanId,
      parentSpanId,
      operation,
      service: this.config.serviceName,
    });

    return span;
  }

  finishSpan(span: Span, error?: Error): void {
    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = error ? "error" : "completed";

    if (error) {
      span.error = {
        message: error.message,
        stack: error.stack,
        code: (error as unknown).code,
      };

      // Log error
      logger.error(`Span error: ${span.name}`, {
        traceId: span.traceId,
        spanId: span.id,
        operation: span.name,
        error: {
          name: "SpanError",
          message: span.error?.message || "Unknown span error",
          stack: span.error?.stack,
          code: span.error?.code,
        },
      });

      // Record error metric
      metrics.recordError("span_error", span.name, "medium");
    } else {
      // Log completion
      logger.debug(`Completed span: ${span.name}`, {
        traceId: span.traceId,
        spanId: span.id,
        operation: span.name,
        duration: span.duration,
      });
    }

    // Update trace
    const trace = this.traces.get(span.traceId);
    if (trace) {
      if (error) {
        trace.status = "error";
      } else if (trace.spans.every((s) => s.status !== "started")) {
        trace.status = "completed";
        trace.endTime = span.endTime;
        trace.duration = trace.endTime - trace.startTime;
      }
    }

    // Record performance metric
    if (span.duration) {
      metrics.recordHistogram("span_duration_seconds", span.duration / 1000, {
        operation: span.name,
        service: span.service,
        status: span.status,
      });
    }
  }

  // ===== LOGGING WITHIN SPANS =====

  logToSpan(
    span: Span,
    level: "debug" | "info" | "warn" | "error",
    message: string,
    fields?: Record<string, unknown>,
  ): void {
    span.logs.push({
      timestamp: Date.now(),
      level,
      message,
      fields,
    });

    // Also log to main logger with trace context
    const logContext = {
      traceId: span.traceId,
      spanId: span.id,
      operation: span.name,
      service: span.service,
      ...fields,
    };

    switch (level) {
      case "debug":
        logger.debug(message, logContext);
        break;
      case "info":
        logger.info(message, logContext);
        break;
      case "warn":
        logger.warn(message, logContext);
        break;
      case "error":
        logger.error(message, logContext);
        break;
    }
  }

  // ===== CONTEXT MANAGEMENT =====

  getActiveSpan(): Span | null {
    // In a real implementation, this would use async local storage
    // For now, return the most recently started span
    const spans = Array.from(this.activeSpans.values());
    return spans.length > 0 ? spans[spans.length - 1] : null;
  }

  getSpan(spanId: string): Span | null {
    return this.activeSpans.get(spanId) || null;
  }

  getTrace(traceId: string): Trace | null {
    return this.traces.get(traceId) || null;
  }

  // ===== UTILITY METHODS =====

  injectContext(span: Span): TraceContext {
    return {
      traceId: span.traceId,
      spanId: span.id,
      parentSpanId: span.parentSpanId,
      service: span.service,
      operation: span.name,
      startTime: span.startTime,
      tags: span.tags,
      baggage: {}, // Could include distributed tracing baggage
    };
  }

  extractContext(headers: Record<string, string>): TraceContext | null {
    const traceId = headers["x-trace-id"] || headers["x-b3-traceid"];
    const spanId = headers["x-span-id"] || headers["x-b3-spanid"];
    const parentSpanId =
      headers["x-parent-span-id"] || headers["x-b3-parentspanid"];

    if (!traceId || !spanId) return null;

    return {
      traceId,
      spanId,
      parentSpanId,
      service: this.config.serviceName,
      operation: "extracted",
      startTime: Date.now(),
      tags: {},
      baggage: this.extractBaggage(headers),
    };
  }

  injectHeaders(span: Span): Record<string, string> {
    return {
      "x-trace-id": span.traceId,
      "x-span-id": span.id,
      "x-parent-span-id": span.parentSpanId || "",
      "x-service": span.service,
    };
  }

  // ===== HIGH-LEVEL API =====

  trace<T>(
    operation: string,
    fn: (span: Span) => T,
    parentContext?: TraceContext,
    tags: Record<string, string | number | boolean> = {},
  ): T {
    const span = this.startSpan(operation, parentContext, tags);

    try {
      const result = fn(span);
      this.finishSpan(span);
      return result;
    } catch (error) {
      this.finishSpan(span, error as Error);
      throw error;
    }
  }

  async traceAsync<T>(
    operation: string,
    fn: (span: Span) => Promise<T>,
    parentContext?: TraceContext,
    tags: Record<string, string | number | boolean> = {},
  ): Promise<T> {
    const span = this.startSpan(operation, parentContext, tags);

    try {
      const result = await fn(span);
      this.finishSpan(span);
      return result;
    } catch (error) {
      this.finishSpan(span, error as Error);
      throw error;
    }
  }

  // ===== PRIVATE METHODS =====

  private generateTraceId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  private generateSpanId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private extractBaggage(
    headers: Record<string, string>,
  ): Record<string, string> {
    const baggage: Record<string, string> = {};

    // Extract baggage headers (x-b3-*)
    Object.entries(headers).forEach(([key, value]) => {
      if (key.startsWith("x-baggage-")) {
        const baggageKey = key.replace("x-baggage-", "");
        baggage[baggageKey] = value;
      }
    });

    return baggage;
  }

  private async flush(): Promise<void> {
    if (!this.config.enableRemote || !this.config.remoteEndpoint) return;

    // Get completed traces
    const completedTraces = Array.from(this.traces.values()).filter(
      (trace) => trace.status !== "active",
    );

    if (completedTraces.length === 0) return;

    try {
      const response = await fetch(this.config.remoteEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.TRACING_API_KEY || ""}`,
        },
        body: JSON.stringify({ traces: completedTraces }),
      });

      if (response.ok) {
        // Remove sent traces
        completedTraces.forEach((trace) => {
          this.traces.delete(trace.id);
          trace.spans.forEach((span) => {
            this.activeSpans.delete(span.id);
          });
        });
      } else {
        console.error(
          "Failed to send traces to remote endpoint:",
          response.status,
        );
      }
    } catch (error) {
      console.error("Error sending traces to remote endpoint:", error);
    }
  }

  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  // ===== CLEANUP =====

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }

    // Final flush
    this.flush();
  }
}

// ===== TRACER FACTORY =====

export class TracerFactory {
  private static instance: Tracer | null = null;

  static getTracer(): Tracer {
    if (!this.instance) {
      this.instance = new Tracer({
        serviceName: process.env.SERVICE_NAME || "landing-page",
        enableRemote: !!process.env.TRACING_ENDPOINT,
        remoteEndpoint: process.env.TRACING_ENDPOINT,
        flushInterval: parseInt(process.env.TRACING_FLUSH_INTERVAL || "10000"), // 10 seconds
        sampleRate: parseFloat(process.env.TRACING_SAMPLE_RATE || "0.1"), // 10% sampling
      });
    }

    return this.instance;
  }

  static destroy(): void {
    if (this.instance) {
      this.instance.destroy();
      this.instance = null;
    }
  }
}

// ===== GLOBAL TRACER INSTANCE =====

export const tracer = TracerFactory.getTracer();

// ===== DECORATORS =====

export function traced(operation?: string) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const methodName = operation || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = function (...args: unknown[]) {
      return tracer.trace(methodName, (span) => {
        // Add method arguments as tags (be careful with sensitive data)
        span.tags.argsCount = args.length;
        span.tags.className = target.constructor.name;
        span.tags.methodName = propertyKey;

        return originalMethod.apply(this, args);
      });
    };
  };
}

export function tracedAsync(operation?: string) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;
    const methodName = operation || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: unknown[]) {
      return tracer.traceAsync(methodName, async (span) => {
        // Add method arguments as tags (be careful with sensitive data)
        span.tags.argsCount = args.length;
        span.tags.className = target.constructor.name;
        span.tags.methodName = propertyKey;

        return originalMethod.apply(this, args);
      });
    };
  };
}

// ===== UTILITY FUNCTIONS =====

export function withTracing<T extends unknown[], R>(
  operation: string,
  fn: (...args: T) => R,
  tags: Record<string, string | number | boolean> = {},
): (...args: T) => R {
  return (...args: T) => {
    return tracer.trace(operation, (span) => {
      Object.assign(span.tags, tags);
      return fn(...args);
    });
  };
}

export function withTracingAsync<T extends unknown[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>,
  tags: Record<string, string | number | boolean> = {},
): (...args: T) => Promise<R> {
  return (...args: T) => {
    return tracer.traceAsync(operation, async (span) => {
      Object.assign(span.tags, tags);
      return fn(...args);
    });
  };
}

// ===== CLEANUP ON EXIT =====

process.on("exit", () => {
  TracerFactory.destroy();
});

process.on("SIGINT", () => {
  TracerFactory.destroy();
  process.exit();
});

process.on("SIGTERM", () => {
  TracerFactory.destroy();
  process.exit();
});
