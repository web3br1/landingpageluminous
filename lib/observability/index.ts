// Observability Module
// Unified exports for logging, metrics, tracing and performance monitoring

export {
  logger,
  LoggerFactory,
  StructuredLogger,
  type LogEntry,
  type LoggerConfig,
} from "./logger";
export { metrics } from "./metrics";
export {
  performanceMonitor,
  type PerformanceMonitor,
} from "./performance-monitor";
export { tracer, type Tracer } from "./tracer";

// Re-export commonly used observability utilities
import { logger } from "./logger";
import { metrics } from "./metrics";
import { performanceMonitor } from "./performance-monitor";
import { tracer } from "./tracer";

export const observability = {
  logger,
  metrics,
  performanceMonitor,
  tracer,
} as const;
