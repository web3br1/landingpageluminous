/**
 * Logger Pattern - Standardized logging utilities and error handling
 *
 * Eliminates code duplication in logging by providing consistent patterns
 * for structured logging, context management, and error serialization.
 */

import { z } from "zod";

// ===== LOG LEVELS =====

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

export const LOG_LEVEL_NAMES = {
  [LogLevel.DEBUG]: "DEBUG",
  [LogLevel.INFO]: "INFO",
  [LogLevel.WARN]: "WARN",
  [LogLevel.ERROR]: "ERROR",
  [LogLevel.FATAL]: "FATAL",
} as const;

// ===== LOG CONTEXT SCHEMA =====

export const LogContextSchema = z.object({
  traceId: z.string().optional(),
  spanId: z.string().optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  tenantId: z.string().optional(),
  requestId: z.string().optional(),
  userAgent: z.string().optional(),
  ip: z.string().optional(),
  url: z.string().optional(),
  method: z.string().optional(),
  statusCode: z.number().optional(),
  duration: z.number().optional(),
  component: z.string().optional(),
  action: z.string().optional(),
});

export type LogContext = z.infer<typeof LogContextSchema>;

// ===== LOG ENTRY SCHEMA =====

export const LogEntrySchema = z.object({
  level: z.nativeEnum(LogLevel),
  message: z.string(),
  timestamp: z.string(),
  context: LogContextSchema.optional(),
  error: z.object({
    name: z.string(),
    message: z.string(),
    stack: z.string().optional(),
    code: z.string().optional(),
  }).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type LogEntry = z.infer<typeof LogEntrySchema>;

// ===== ERROR SERIALIZATION =====

export interface SerializedError {
  name: string;
  message: string;
  stack?: string;
  code?: string;
  cause?: SerializedError;
}

/**
 * Safely serialize an error for logging
 */
export function serializeError(error: unknown): SerializedError | undefined {
  if (!(error instanceof Error)) return undefined;

  const serialized: SerializedError = {
    name: error.name,
    message: error.message,
    ...(error instanceof Error && 'code' in error && { code: String(error.code) }),
  };

  // Only include stack in development
  if (process.env.NODE_ENV !== 'production') {
    serialized.stack = error.stack;
  }

  // Handle cause chains (if available)
  if (error instanceof Error && 'cause' in error && error.cause) {
    serialized.cause = serializeError(error.cause);
  }

  return serialized;
}

// ===== CONTEXT MANAGEMENT =====

class LogContextManager {
  private static instance: LogContextManager;
  private context: LogContext = {};

  private constructor() {}

  static getInstance(): LogContextManager {
    if (!LogContextManager.instance) {
      LogContextManager.instance = new LogContextManager();
    }
    return LogContextManager.instance;
  }

  setContext(context: Partial<LogContext>): void {
    this.context = { ...this.context, ...context };
  }

  getContext(): LogContext {
    return { ...this.context };
  }

  clearContext(): void {
    this.context = {};
  }

  createChildContext(additionalContext: Partial<LogContext>): LogContext {
    return { ...this.context, ...additionalContext };
  }
}

export const logContextManager = LogContextManager.getInstance();

// ===== LOGGER IMPLEMENTATION =====

export interface Logger {
  debug(message: string, metadata?: Record<string, unknown>): void;
  info(message: string, metadata?: Record<string, unknown>): void;
  warn(message: string, metadata?: Record<string, unknown>): void;
  error(message: string, error?: unknown, metadata?: Record<string, unknown>): void;
  fatal(message: string, error?: unknown, metadata?: Record<string, unknown>): void;

  withContext(context: Partial<LogContext>): Logger;
  withComponent(component: string): Logger;
  withTrace(traceId: string): Logger;
}

class StructuredLogger implements Logger {
  private baseContext: LogContext;

  constructor(baseContext: LogContext = {}) {
    this.baseContext = baseContext;
  }

  private log(level: LogLevel, message: string, error?: unknown, metadata?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: this.baseContext,
      metadata,
    };

    if (error) {
      entry.error = serializeError(error);
    }

    // Validate entry
    const validation = LogEntrySchema.safeParse(entry);
    if (!validation.success) {
      console.error('[Logger] Invalid log entry:', validation.error);
      return;
    }

    // Output based on level
    const output = JSON.stringify(validation.data);

    switch (level) {
      case LogLevel.DEBUG:
        if (process.env.NODE_ENV !== 'production') {
          console.debug(output);
        }
        break;
      case LogLevel.INFO:
        console.log(output);
        break;
      case LogLevel.WARN:
        console.warn(output);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(output);
        break;
    }
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, undefined, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, undefined, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, undefined, metadata);
  }

  error(message: string, error?: unknown, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, error, metadata);
  }

  fatal(message: string, error?: unknown, metadata?: Record<string, unknown>): void {
    this.log(LogLevel.FATAL, message, error, metadata);
  }

  withContext(context: Partial<LogContext>): Logger {
    return new StructuredLogger({ ...this.baseContext, ...context });
  }

  withComponent(component: string): Logger {
    return this.withContext({ component });
  }

  withTrace(traceId: string): Logger {
    return this.withContext({ traceId });
  }
}

// ===== GLOBAL LOGGER INSTANCE =====

export const logger = new StructuredLogger();

// ===== CONTEXT HELPERS =====

/**
 * Create a logger with request context
 */
export function withRequestContext(request: Request, additionalContext?: Partial<LogContext>): Logger {
  const url = new URL(request.url);
  const context: Partial<LogContext> = {
    url: url.pathname,
    method: request.method,
    userAgent: request.headers.get('user-agent') || undefined,
    ...additionalContext,
  };

  return logger.withContext(context);
}

/**
 * Create a logger with component context
 */
export function withComponentContext(component: string, action?: string): Logger {
  return logger.withContext({ component, action });
}

/**
 * Execute function with logging context
 */
export async function withLoggingContext<T>(
  context: Partial<LogContext>,
  fn: () => Promise<T>,
  component: string,
  action: string
): Promise<T> {
  const startTime = Date.now();
  const ctxLogger = logger.withContext({ ...context, component, action });

  try {
    ctxLogger.debug(`Starting ${action}`);

    const result = await fn();

    const duration = Date.now() - startTime;
    ctxLogger.info(`${action} completed successfully`, { duration });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    ctxLogger.error(`${action} failed`, error, { duration });

    throw error;
  }
}

// ===== PERFORMANCE LOGGING =====

/**
 * Log performance metrics
 */
export function logPerformance(
  operation: string,
  duration: number,
  metadata?: Record<string, unknown>
): void {
  const level = duration > 1000 ? LogLevel.WARN : LogLevel.INFO;
  const loggerInstance = logger.withContext({ component: 'performance', action: operation });

  const message = `Performance: ${operation} took ${duration}ms`;

  switch (level) {
    case LogLevel.INFO:
      loggerInstance.info(message, { duration, ...metadata });
      break;
    case LogLevel.WARN:
      loggerInstance.warn(message, { duration, ...metadata });
      break;
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Create a timed logger for operations
 */
export function createTimedLogger(component: string, action: string) {
  const startTime = Date.now();
  const ctxLogger = logger.withContext({ component, action });

  return {
    complete: (metadata?: Record<string, unknown>) => {
      const duration = Date.now() - startTime;
      ctxLogger.info(`${action} completed`, { duration, ...metadata });
    },
    fail: (error?: unknown, metadata?: Record<string, unknown>) => {
      const duration = Date.now() - startTime;
      ctxLogger.error(`${action} failed`, error, { duration, ...metadata });
    },
  };
}
