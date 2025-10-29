import { getSSRAdapter } from "../composition/container";

// ===== LOG LEVELS =====

export enum LogLevel {
  // eslint-disable-next-line no-unused-vars
  DEBUG = 0,
  // eslint-disable-next-line no-unused-vars
  INFO = 1,
  // eslint-disable-next-line no-unused-vars
  WARN = 2,
  // eslint-disable-next-line no-unused-vars
  ERROR = 3,
  // eslint-disable-next-line no-unused-vars
  FATAL = 4,
}

// ===== LOG CONTEXT =====

export interface LogContext {
  traceId?: string;
  spanId?: string;
  userId?: string;
  sessionId?: string;
  tenantId?: string;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  component?: string;
  operation?: string;
  experimentId?: string;
  experimentVariant?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
  [key: string]: unknown;
}

// ===== LOG ENTRY =====

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  service: string;
  version: string;
  environment: string;
}

// ===== LOGGER CONFIG =====

export interface LoggerConfig {
  level: LogLevel;
  service: string;
  version: string;
  environment: string;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  sampling?: {
    debug: number; // 0-1, percentage to sample
    info: number;
    warn: number;
    error: number;
  };
}

// ===== STRUCTURED LOGGER =====

export class StructuredLogger {
  private config: LoggerConfig;
  private buffer: LogEntry[] = []; // Initialize buffer to prevent undefined push errors
  private flushInterval: NodeJS.Timeout | null = null;

  constructor(config: LoggerConfig) {
    this.config = config;

    // Ensure buffer is always initialized
    if (!Array.isArray(this.buffer)) {
      this.buffer = [];
    }

    if (this.config.enableRemote && this.config.remoteEndpoint) {
      this.startFlushInterval();
    }
  }

  // ===== LOG METHODS =====

  debug(message: string, context: LogContext = {}): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context: LogContext = {}): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context: LogContext = {}): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context: LogContext = {}): void {
    this.log(LogLevel.ERROR, message, context);
  }

  fatal(message: string, context: LogContext = {}): void {
    this.log(LogLevel.FATAL, message, context);
  }

  // ===== PERFORMANCE LOGGING =====

  startTimer(operation: string, context: LogContext = {}): () => void {
    const startTime = Date.now();
    const traceId = context.traceId || this.generateTraceId();

    this.debug(`Starting operation: ${operation}`, {
      ...context,
      traceId,
      operation,
      event: "operation_start",
    });

    return () => {
      const duration = Date.now() - startTime;
      this.info(`Completed operation: ${operation}`, {
        ...context,
        traceId,
        operation,
        duration,
        event: "operation_complete",
      });
    };
  }

  // ===== REQUEST LOGGING =====

  logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context: LogContext = {},
  ): void {
    const level =
      statusCode >= 500
        ? LogLevel.ERROR
        : statusCode >= 400
          ? LogLevel.WARN
          : LogLevel.INFO;

    const message = `${method} ${url} ${statusCode} ${duration}ms`;

    this.log(level, message, {
      ...context,
      method,
      url,
      statusCode,
      duration,
      event: "http_request",
    });
  }

  // ===== ERROR LOGGING =====

  logError(error: Error, context: LogContext = {}): void {
    this.error(error.message, {
      ...context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as { code?: string }).code,
      },
      event: "error",
    });
  }

  // ===== BUSINESS EVENT LOGGING =====

  logBusinessEvent(
    event: string,
    properties: Record<string, unknown>,
    context: LogContext = {},
  ): void {
    this.info(`Business event: ${event}`, {
      ...context,
      event,
      ...properties,
      eventType: "business",
    });
  }

  // ===== EXPERIMENT LOGGING =====

  logExperiment(
    experimentId: string,
    variant: string,
    userId: string,
    context: LogContext = {},
  ): void {
    this.info(`Experiment assignment: ${experimentId}:${variant}`, {
      ...context,
      experimentId,
      experimentVariant: variant,
      userId,
      event: "experiment_assignment",
    });
  }

  logExperimentConversion(
    experimentId: string,
    variant: string,
    conversionType: string,
    context: LogContext = {},
  ): void {
    this.info(
      `Experiment conversion: ${experimentId}:${variant}:${conversionType}`,
      {
        ...context,
        experimentId,
        experimentVariant: variant,
        conversionType,
        event: "experiment_conversion",
      },
    );
  }

  // ===== PRIVATE METHODS =====

  private log(level: LogLevel, message: string, context: LogContext): void {
    if (level < this.config.level) return;

    // Sampling for high-volume logs
    if (!this.shouldSample(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        traceId: context.traceId || this.generateTraceId(),
      },
      service: this.config.service,
      version: this.config.version,
      environment: this.config.environment,
    };

    // Console logging
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Remote logging
    if (this.config.enableRemote && this.config.remoteEndpoint) {
      this.buffer.push(entry);

      // Flush immediately for errors
      if (level >= LogLevel.ERROR) {
        this.flush();
      }
    }
  }

  private shouldSample(level: LogLevel): boolean {
    if (!this.config.sampling) return true;

    const samplingRate =
      this.config.sampling[
        LogLevel[level].toLowerCase() as keyof typeof this.config.sampling
      ];
    if (samplingRate === undefined) return true;

    return Math.random() < samplingRate;
  }

  private logToConsole(entry: LogEntry): void {
    const ssrAdapter = getSSRAdapter();
    const levelStr = LogLevel[entry.level].toLowerCase();
    const prefix = `[${entry.timestamp}] ${levelStr.toUpperCase()} [${entry.service}]`;

    const logData = {
      message: entry.message,
      context: entry.context,
      service: entry.service,
      version: entry.version,
      environment: entry.environment,
    };

    switch (entry.level) {
      case LogLevel.DEBUG:
        ssrAdapter.safeConsoleLog("log", prefix, logData);
        break;
      case LogLevel.INFO:
        ssrAdapter.safeConsoleLog("log", prefix, logData);
        break;
      case LogLevel.WARN:
        ssrAdapter.safeConsoleLog("warn", prefix, logData);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        ssrAdapter.safeConsoleLog("error", prefix, logData);
        break;
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    try {
      const response = await fetch(this.config.remoteEndpoint!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.LOGGING_API_KEY || ""}`,
        },
        body: JSON.stringify({ entries }),
      });

      if (!response.ok) {
        console.error(
          "Failed to send logs to remote endpoint:",
          response.status,
        );
        // Re-queue failed entries
        this.buffer.unshift(...entries);
      }
    } catch (error) {
      console.error("Error sending logs to remote endpoint:", error);
      // Re-queue failed entries
      this.buffer.unshift(...entries);
    }
  }

  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 5000); // Flush every 5 seconds
  }

  private generateTraceId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
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

// ===== LOGGER FACTORY =====

export class LoggerFactory {
  private static instance: StructuredLogger | null = null;

  static getLogger(): StructuredLogger {
    if (!this.instance) {
      const config: LoggerConfig = {
        level: this.getLogLevelFromEnv(),
        service: process.env.SERVICE_NAME || "landing-page",
        version: process.env.APP_VERSION || "1.0.0",
        environment: process.env.NODE_ENV || "development",
        enableConsole: true,
        enableRemote: !!process.env.LOGGING_ENDPOINT,
        remoteEndpoint: process.env.LOGGING_ENDPOINT,
        sampling: {
          debug: parseFloat(process.env.LOG_SAMPLING_DEBUG || "0.1"), // 10% of debug logs
          info: parseFloat(process.env.LOG_SAMPLING_INFO || "0.5"), // 50% of info logs
          warn: parseFloat(process.env.LOG_SAMPLING_WARN || "1.0"), // 100% of warn logs
          error: parseFloat(process.env.LOG_SAMPLING_ERROR || "1.0"), // 100% of error logs
        },
      };

      this.instance = new StructuredLogger(config);
    }

    return this.instance;
  }

  private static getLogLevelFromEnv(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase();

    switch (level) {
      case "DEBUG":
        return LogLevel.DEBUG;
      case "INFO":
        return LogLevel.INFO;
      case "WARN":
        return LogLevel.WARN;
      case "ERROR":
        return LogLevel.ERROR;
      case "FATAL":
        return LogLevel.FATAL;
      default:
        return process.env.NODE_ENV === "production"
          ? LogLevel.INFO
          : LogLevel.DEBUG;
    }
  }

  static destroy(): void {
    if (this.instance) {
      this.instance.destroy();
      this.instance = null;
    }
  }
}

// ===== GLOBAL LOGGER INSTANCE =====

export const logger = LoggerFactory.getLogger();

// ===== CLEANUP ON EXIT =====

process.on("exit", () => {
  LoggerFactory.destroy();
});

process.on("SIGINT", () => {
  LoggerFactory.destroy();
  process.exit();
});

process.on("SIGTERM", () => {
  LoggerFactory.destroy();
  process.exit();
});
