// Structured logger with safe defaults for production
export type LogLevel = "debug" | "info" | "warn" | "error";

const isProd = process.env.NODE_ENV === "production";

function serializeError(
  err: unknown,
): { name: string; message: string; stack?: string } | undefined {
  if (!(err instanceof Error)) return undefined;
  return {
    name: err.name,
    message: err.message,
    ...(isProd ? {} : { stack: err.stack }),
  };
}

function base(
  level: LogLevel,
  msg: string,
  fields?: Record<string, unknown>,
): void {
  const errorField = serializeError(
    fields && (fields as Record<string, unknown>).error,
  );
  const { error, ...rest } = (fields || {}) as Record<string, unknown>;
  const payload: Record<string, unknown> = {
    level,
    msg,
    ...rest,
    ...(errorField ? { error: errorField } : {}),
  };

  const method = level === "info" ? "log" : level;
  // Use a single line JSON for easy ingestion by log processors
  (console as unknown)[method](JSON.stringify(payload));
}

export const logger = {
  debug: (msg: string, f?: Record<string, unknown>) => {
    // Only log debug in development
    if (!isProd) base("info", msg, f);
  },
  info: (msg: string, f?: Record<string, unknown>) => base("info", msg, f),
  warn: (msg: string, f?: Record<string, unknown>) => base("warn", msg, f),
  error: (msg: string, f?: Record<string, unknown>) => base("error", msg, f),
};
