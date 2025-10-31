/**
 * Type validation helpers for safer type casting
 */

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

export function hasProperty<
  T extends Record<string, unknown>,
  K extends string,
>(obj: T, key: K): obj is T & Record<K, unknown> {
  return key in obj;
}

export function safeStringAccess(
  obj: unknown,
  key: string,
  fallback = "",
): string {
  if (!isObject(obj)) return fallback;
  const value = obj[key];
  return typeof value === "string" ? value : fallback;
}

export function safeNumberAccess(
  obj: unknown,
  key: string,
  fallback = 0,
): number {
  if (!isObject(obj)) return fallback;
  const value = obj[key];
  return typeof value === "number" ? value : fallback;
}

export function safeBooleanAccess(
  obj: unknown,
  key: string,
  fallback = false,
): boolean {
  if (!isObject(obj)) return fallback;
  const value = obj[key];
  return typeof value === "boolean" ? value : fallback;
}
