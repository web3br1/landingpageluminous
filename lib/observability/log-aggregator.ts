/**
 * Log Aggregation System - Fase 3
 * Sistema centralizado de agregação de logs com correlation IDs e structured logging
 */

import { logger } from "./logger";
import { tracer } from "./tracer";

/**
 * Log Entry Structure
 */
export interface LogEntry {
  id: string;
  timestamp: number;
  level: LogLevel;
  message: string;
  component: string;
  correlationId?: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  traceId?: string;
  spanId?: string;
  metadata: Record<string, unknown>;
  environment: string;
  version: string;
  hostname: string;
}

/**
 * Log Level Enum
 */
export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5,
}

/**
 * Log Filter Options
 */
export interface LogFilter {
  level?: LogLevel;
  component?: string;
  correlationId?: string;
  requestId?: string;
  userId?: string;
  timeRange?: {
    start: number;
    end: number;
  };
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Log Aggregation Statistics
 */
export interface LogStats {
  totalLogs: number;
  logsByLevel: Record<LogLevel, number>;
  logsByComponent: Record<string, number>;
  recentErrors: number;
  avgLogsPerMinute: number;
  storageUsed: number;
  oldestLog: number;
  newestLog: number;
}

/**
 * Log Aggregator Configuration
 */
export interface LogAggregatorConfig {
  maxEntries: number;
  retentionHours: number;
  enableConsoleOutput: boolean;
  enableFileOutput: boolean;
  enableStructuredOutput: boolean;
  logLevel: LogLevel;
  environment: string;
  version: string;
}

/**
 * Central Log Aggregator
 */
export class LogAggregator {
  private logs: LogEntry[] = [];
  private config: LogAggregatorConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private stats: LogStats;

  constructor(config: Partial<LogAggregatorConfig> = {}) {
    this.config = {
      maxEntries: 10000,
      retentionHours: 24,
      enableConsoleOutput: process.env.NODE_ENV === "development",
      enableFileOutput: false,
      enableStructuredOutput: true,
      logLevel:
        process.env.NODE_ENV === "development" ? LogLevel.DEBUG : LogLevel.INFO,
      environment: process.env.NODE_ENV || "development",
      version: process.env.npm_package_version || "1.0.0",
      ...config,
    };

    this.stats = {
      totalLogs: 0,
      logsByLevel: {
        [LogLevel.TRACE]: 0,
        [LogLevel.DEBUG]: 0,
        [LogLevel.INFO]: 0,
        [LogLevel.WARN]: 0,
        [LogLevel.ERROR]: 0,
        [LogLevel.FATAL]: 0,
      },
      logsByComponent: {},
      recentErrors: 0,
      avgLogsPerMinute: 0,
      storageUsed: 0,
      oldestLog: Date.now(),
      newestLog: Date.now(),
    };

    this.startCleanupTask();
    logger.info("LogAggregator initialized", {
      config: this.config,
      retentionPolicy: `${this.config.retentionHours}h`,
      maxEntries: this.config.maxEntries,
    });
  }

  /**
   * Log a message with full context
   */
  log(
    level: LogLevel,
    message: string,
    component: string,
    metadata: Record<string, unknown> = {},
    error?: Error,
  ): void {
    // Check if level should be logged
    if (level < this.config.logLevel) {
      return;
    }

    const now = Date.now();
    const activeSpan = tracer.getActiveSpan();

    const logEntry: LogEntry = {
      id: `log_${now}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now,
      level,
      message,
      component,
      correlationId: metadata.correlationId || this.getCorrelationId(),
      requestId: metadata.requestId || this.getRequestId(),
      userId: metadata.userId,
      sessionId: metadata.sessionId,
      traceId: activeSpan?.traceId,
      spanId: activeSpan?.id,
      metadata: {
        ...metadata,
        error: error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : undefined,
      },
      environment: this.config.environment,
      version: this.config.version,
      hostname:
        typeof window === "undefined"
          ? require("os").hostname()
          : window.location.hostname,
    };

    // Add to internal storage
    this.addLogEntry(logEntry);

    // Console output for development
    if (this.config.enableConsoleOutput) {
      this.outputToConsole(logEntry);
    }

    // File output (placeholder for production)
    if (this.config.enableFileOutput) {
      this.outputToFile(logEntry);
    }

    // Forward to existing logger system
    this.forwardToLogger(logEntry);
  }

  /**
   * Add log entry to storage
   */
  private addLogEntry(entry: LogEntry): void {
    this.logs.push(entry);

    // Maintain size limit
    if (this.logs.length > this.config.maxEntries) {
      this.logs.shift();
    }

    // Update statistics
    this.stats.totalLogs++;
    this.stats.logsByLevel[entry.level]++;
    this.stats.logsByComponent[entry.component] =
      (this.stats.logsByComponent[entry.component] || 0) + 1;

    if (entry.level >= LogLevel.ERROR) {
      this.stats.recentErrors++;
    }

    this.stats.newestLog = entry.timestamp;
    if (entry.timestamp < this.stats.oldestLog) {
      this.stats.oldestLog = entry.timestamp;
    }

    // Calculate average logs per minute (rough estimate)
    const timeSpanMinutes =
      (this.stats.newestLog - this.stats.oldestLog) / (1000 * 60);
    if (timeSpanMinutes > 0) {
      this.stats.avgLogsPerMinute = this.stats.totalLogs / timeSpanMinutes;
    }

    // Calculate storage used (rough estimate)
    this.stats.storageUsed = JSON.stringify(this.logs).length;
  }

  /**
   * Get logs with filtering
   */
  getLogs(filter: LogFilter = {}): LogEntry[] {
    let filteredLogs = [...this.logs];

    // Apply filters
    if (filter.level !== undefined) {
      filteredLogs = filteredLogs.filter((log) => log.level >= filter.level!);
    }

    if (filter.component) {
      filteredLogs = filteredLogs.filter((log) =>
        log.component.includes(filter.component!),
      );
    }

    if (filter.correlationId) {
      filteredLogs = filteredLogs.filter(
        (log) => log.correlationId === filter.correlationId,
      );
    }

    if (filter.requestId) {
      filteredLogs = filteredLogs.filter(
        (log) => log.requestId === filter.requestId,
      );
    }

    if (filter.userId) {
      filteredLogs = filteredLogs.filter((log) => log.userId === filter.userId);
    }

    if (filter.timeRange) {
      filteredLogs = filteredLogs.filter(
        (log) =>
          log.timestamp >= filter.timeRange!.start &&
          log.timestamp <= filter.timeRange!.end,
      );
    }

    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      filteredLogs = filteredLogs.filter(
        (log) =>
          log.message.toLowerCase().includes(searchTerm) ||
          log.component.toLowerCase().includes(searchTerm) ||
          JSON.stringify(log.metadata).toLowerCase().includes(searchTerm),
      );
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => b.timestamp - a.timestamp);

    // Apply pagination
    const offset = filter.offset || 0;
    const limit = filter.limit || 100;
    return filteredLogs.slice(offset, offset + limit);
  }

  /**
   * Get logs for a specific correlation ID (trace)
   */
  getTraceLogs(correlationId: string): LogEntry[] {
    return this.logs
      .filter((log) => log.correlationId === correlationId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get logs for a specific request
   */
  getRequestLogs(requestId: string): LogEntry[] {
    return this.logs
      .filter((log) => log.requestId === requestId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get current statistics
   */
  getStats(): LogStats {
    return { ...this.stats };
  }

  /**
   * Export logs for backup/analysis
   */
  exportLogs(filter: LogFilter = {}): LogEntry[] {
    return this.getLogs({ ...filter, limit: undefined, offset: undefined });
  }

  /**
   * Clear old logs based on retention policy
   */
  private cleanup(): void {
    const cutoffTime = Date.now() - this.config.retentionHours * 60 * 60 * 1000;
    const initialCount = this.logs.length;

    this.logs = this.logs.filter((log) => log.timestamp > cutoffTime);

    const removedCount = initialCount - this.logs.length;
    if (removedCount > 0) {
      logger.info("Log cleanup completed", {
        removedCount,
        remainingCount: this.logs.length,
        retentionHours: this.config.retentionHours,
      });
    }
  }

  /**
   * Start cleanup task
   */
  private startCleanupTask(): void {
    // Run cleanup every hour
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      60 * 60 * 1000,
    );

    // Initial cleanup
    this.cleanup();
  }

  /**
   * Stop cleanup task
   */
  private stopCleanupTask(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Output to console
   */
  private outputToConsole(entry: LogEntry): void {
    const levelName = LogLevel[entry.level];
    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[${timestamp}] ${levelName} [${entry.component}]`;

    const output = {
      message: entry.message,
      correlationId: entry.correlationId,
      metadata: entry.metadata,
    };

    switch (entry.level) {
      case LogLevel.TRACE:
      case LogLevel.DEBUG:
        console.debug(`${prefix}:`, output);
        break;
      case LogLevel.INFO:
        console.info(`${prefix}:`, output);
        break;
      case LogLevel.WARN:
        console.warn(`${prefix}:`, output);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(`${prefix}:`, output);
        break;
    }
  }

  /**
   * Output to file (placeholder for production implementation)
   */
  private outputToFile(entry: LogEntry): void {
    // In production, this would write to files, databases, or external services
    // For now, just log that file output is enabled
    if (entry.level >= LogLevel.WARN) {
      console.log(`[FILE] ${JSON.stringify(entry)}`);
    }
  }

  /**
   * Forward to existing logger system
   */
  private forwardToLogger(entry: LogEntry): void {
    const logData = {
      component: entry.component,
      correlationId: entry.correlationId,
      requestId: entry.requestId,
      traceId: entry.traceId,
      spanId: entry.spanId,
      ...entry.metadata,
    };

    // Error is handled separately in logger.error calls

    switch (entry.level) {
      case LogLevel.TRACE:
        logger.debug(`[${entry.component}] ${entry.message}`, logData);
        break;
      case LogLevel.DEBUG:
        logger.debug(`[${entry.component}] ${entry.message}`, logData);
        break;
      case LogLevel.INFO:
        logger.info(`[${entry.component}] ${entry.message}`, logData);
        break;
      case LogLevel.WARN:
        logger.warn(`[${entry.component}] ${entry.message}`, logData);
        break;
      case LogLevel.ERROR:
        logger.error(`[${entry.component}] ${entry.message}`, {
          ...logData,
          error: entry.metadata.error,
        });
        break;
      case LogLevel.FATAL:
        logger.error(`[${entry.component}] FATAL: ${entry.message}`, {
          ...logData,
          error: entry.metadata.error,
        });
        break;
    }
  }

  /**
   * Get current correlation ID from context
   */
  private getCorrelationId(): string {
    // In a real implementation, this would come from AsyncLocalStorage or similar
    // For now, generate a new one
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current request ID from context
   */
  private getRequestId(): string {
    // In a real implementation, this would come from request context
    // For now, generate a new one
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Destroy aggregator
   */
  destroy(): void {
    this.stopCleanupTask();
    this.logs = [];
    logger.info("LogAggregator destroyed");
  }
}

/**
 * Correlation Context Manager
 */
export class CorrelationContext {
  private static context = new Map<string, string>();

  static setCorrelationId(id: string): void {
    this.context.set("correlationId", id);
  }

  static getCorrelationId(): string | undefined {
    return this.context.get("correlationId");
  }

  static setRequestId(id: string): void {
    this.context.set("requestId", id);
  }

  static getRequestId(): string | undefined {
    return this.context.get("requestId");
  }

  static setUserId(id: string): void {
    this.context.set("userId", id);
  }

  static getUserId(): string | undefined {
    return this.context.get("userId");
  }

  static setSessionId(id: string): void {
    this.context.set("sessionId", id);
  }

  static getSessionId(): string | undefined {
    return this.context.get("sessionId");
  }

  static clear(): void {
    this.context.clear();
  }

  static getAll(): Record<string, string> {
    return Object.fromEntries(this.context);
  }
}

/**
 * Enhanced Logger with Aggregation
 */
export class EnhancedLogger {
  constructor(private aggregator: LogAggregator) {}

  trace(
    message: string,
    component: string,
    metadata: Record<string, unknown> = {},
  ): void {
    this.aggregator.log(LogLevel.TRACE, message, component, {
      ...CorrelationContext.getAll(),
      ...metadata,
    });
  }

  debug(
    message: string,
    component: string,
    metadata: Record<string, unknown> = {},
  ): void {
    this.aggregator.log(LogLevel.DEBUG, message, component, {
      ...CorrelationContext.getAll(),
      ...metadata,
    });
  }

  info(
    message: string,
    component: string,
    metadata: Record<string, unknown> = {},
  ): void {
    this.aggregator.log(LogLevel.INFO, message, component, {
      ...CorrelationContext.getAll(),
      ...metadata,
    });
  }

  warn(
    message: string,
    component: string,
    metadata: Record<string, unknown> = {},
    error?: Error,
  ): void {
    this.aggregator.log(
      LogLevel.WARN,
      message,
      component,
      {
        ...CorrelationContext.getAll(),
        ...metadata,
      },
      error,
    );
  }

  error(
    message: string,
    component: string,
    metadata: Record<string, unknown> = {},
    error?: Error,
  ): void {
    this.aggregator.log(
      LogLevel.ERROR,
      message,
      component,
      {
        ...CorrelationContext.getAll(),
        ...metadata,
      },
      error,
    );
  }

  fatal(
    message: string,
    component: string,
    metadata: Record<string, unknown> = {},
    error?: Error,
  ): void {
    this.aggregator.log(
      LogLevel.FATAL,
      message,
      component,
      {
        ...CorrelationContext.getAll(),
        ...metadata,
      },
      error,
    );
  }

  /**
   * Create child logger with fixed component
   */
  child(component: string): {
    trace: (message: string, metadata?: Record<string, unknown>) => void;
    debug: (message: string, metadata?: Record<string, unknown>) => void;
    info: (message: string, metadata?: Record<string, unknown>) => void;
    warn: (
      message: string,
      metadata?: Record<string, unknown>,
      error?: Error,
    ) => void;
    error: (
      message: string,
      metadata?: Record<string, unknown>,
      error?: Error,
    ) => void;
    fatal: (
      message: string,
      metadata?: Record<string, unknown>,
      error?: Error,
    ) => void;
  } {
    return {
      trace: (message: string, metadata?: Record<string, unknown>) =>
        this.trace(message, component, metadata),
      debug: (message: string, metadata?: Record<string, unknown>) =>
        this.debug(message, component, metadata),
      info: (message: string, metadata?: Record<string, unknown>) =>
        this.info(message, component, metadata),
      warn: (
        message: string,
        metadata?: Record<string, unknown>,
        error?: Error,
      ) => this.warn(message, component, metadata, error),
      error: (
        message: string,
        metadata?: Record<string, unknown>,
        error?: Error,
      ) => this.error(message, component, metadata, error),
      fatal: (
        message: string,
        metadata?: Record<string, unknown>,
        error?: Error,
      ) => this.fatal(message, component, metadata, error),
    };
  }
}

// ===== SINGLETON INSTANCE =====

let logAggregatorInstance: LogAggregator | null = null;
let enhancedLoggerInstance: EnhancedLogger | null = null;

export function getLogAggregator(
  config?: Partial<LogAggregatorConfig>,
): LogAggregator {
  if (!logAggregatorInstance) {
    logAggregatorInstance = new LogAggregator(config);
  }
  return logAggregatorInstance;
}

export function getEnhancedLogger(): EnhancedLogger {
  if (!enhancedLoggerInstance) {
    const aggregator = getLogAggregator();
    enhancedLoggerInstance = new EnhancedLogger(aggregator);
  }
  return enhancedLoggerInstance;
}

export function destroyLogAggregator(): void {
  if (enhancedLoggerInstance) {
    enhancedLoggerInstance = null;
  }
  if (logAggregatorInstance) {
    logAggregatorInstance.destroy();
    logAggregatorInstance = null;
  }
}

// ===== UTILITY FUNCTIONS =====

export function withCorrelationContext<T>(
  correlationId: string,
  fn: () => T,
  requestId?: string,
  userId?: string,
  sessionId?: string,
): T {
  CorrelationContext.setCorrelationId(correlationId);
  if (requestId) CorrelationContext.setRequestId(requestId);
  if (userId) CorrelationContext.setUserId(userId);
  if (sessionId) CorrelationContext.setSessionId(sessionId);

  try {
    return fn();
  } finally {
    CorrelationContext.clear();
  }
}

export function generateCorrelationId(): string {
  return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
