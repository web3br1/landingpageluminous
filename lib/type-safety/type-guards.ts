/**
 * Type Guards and Runtime Type Validation
 * Provides compile-time and runtime type safety
 */

// ===== PRIMITIVE TYPE GUARDS =====

export function isString(value: unknown): value is string {
  return typeof value === "string";
}

export function isNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value) && isFinite(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

export function isUndefined(value: unknown): value is undefined {
  return value === undefined;
}

export function isNull(value: unknown): value is null {
  return value === null;
}

export function isNullish(value: unknown): value is null | undefined {
  return value == null;
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isFunction(value: unknown): value is Function {
  return typeof value === "function";
}

export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

// ===== SPECIFIC TYPE GUARDS =====

export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.trim().length > 0;
}

export function isPositiveNumber(value: unknown): value is number {
  return isNumber(value) && value > 0;
}

export function isNonNegativeNumber(value: unknown): value is number {
  return isNumber(value) && value >= 0;
}

export function isInteger(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value);
}

export function isPositiveInteger(value: unknown): value is number {
  return isInteger(value) && value > 0;
}

export function isEmail(value: unknown): value is string {
  if (!isString(value)) return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

export function isURL(value: unknown): value is string {
  if (!isString(value)) return false;

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function isUUID(value: unknown): value is string {
  if (!isString(value)) return false;

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

// ===== OBJECT TYPE GUARDS =====

export function hasProperty<T extends Record<string, unknown>>(
  obj: T,
  key: string,
): boolean {
  return key in obj && obj[key as keyof T] != null;
}

export function hasStringProperty<T extends Record<string, unknown>>(
  obj: T,
  key: keyof T,
): obj is T & Record<keyof T, string> {
  return isString(obj[key]);
}

export function hasNumberProperty<T extends Record<string, unknown>>(
  obj: T,
  key: keyof T,
): obj is T & Record<keyof T, number> {
  return isNumber(obj[key]);
}

// ===== ARRAY TYPE GUARDS =====

export function isArrayOf<T>(
  value: unknown,
  predicate: (item: unknown) => item is T,
): value is T[] {
  return isArray(value) && value.every(predicate);
}

export function isArrayOfStrings(value: unknown): value is string[] {
  return isArrayOf(value, isString);
}

export function isArrayOfNumbers(value: unknown): value is number[] {
  return isArrayOf(value, isNumber);
}

// ===== UNION TYPE GUARDS =====

export type Primitive = string | number | boolean | null | undefined;

export function isPrimitive(value: unknown): value is Primitive {
  return (
    isString(value) ||
    isNumber(value) ||
    isBoolean(value) ||
    isNull(value) ||
    isUndefined(value)
  );
}

// ===== ADVANCED TYPE GUARDS =====

export function isRecordOf<T>(
  value: unknown,
  keyPredicate: (key: string) => boolean,
  valuePredicate: (value: unknown) => value is T,
): value is Record<string, T> {
  if (!isObject(value)) return false;

  return Object.entries(value).every(
    ([key, val]) => keyPredicate(key) && valuePredicate(val),
  );
}

// ===== ASSERTION FUNCTIONS =====

export function assertString(
  value: unknown,
  fieldName = "value",
): asserts value is string {
  if (!isString(value)) {
    throw new TypeError(`${fieldName} must be a string, got ${typeof value}`);
  }
}

export function assertNumber(
  value: unknown,
  fieldName = "value",
): asserts value is number {
  if (!isNumber(value)) {
    throw new TypeError(`${fieldName} must be a number, got ${typeof value}`);
  }
}

export function assertBoolean(
  value: unknown,
  fieldName = "value",
): asserts value is boolean {
  if (!isBoolean(value)) {
    throw new TypeError(`${fieldName} must be a boolean, got ${typeof value}`);
  }
}

export function assertObject(
  value: unknown,
  fieldName = "value",
): asserts value is Record<string, unknown> {
  if (!isObject(value)) {
    throw new TypeError(`${fieldName} must be an object, got ${typeof value}`);
  }
}

export function assertArray(
  value: unknown,
  fieldName = "value",
): asserts value is unknown[] {
  if (!isArray(value)) {
    throw new TypeError(`${fieldName} must be an array, got ${typeof value}`);
  }
}

export function assertNonEmptyString(
  value: unknown,
  fieldName = "value",
): asserts value is string {
  if (!isNonEmptyString(value)) {
    throw new TypeError(
      `${fieldName} must be a non-empty string, got ${typeof value}`,
    );
  }
}

// ===== SAFE ACCESS UTILITIES =====

export function safeStringAccess(
  obj: unknown,
  key: string,
): string | undefined {
  if (!isObject(obj)) return undefined;
  const value = obj[key];
  return isString(value) ? value : undefined;
}

export function safeNumberAccess(
  obj: unknown,
  key: string,
): number | undefined {
  if (!isObject(obj)) return undefined;
  const value = obj[key];
  return isNumber(value) ? value : undefined;
}

export function safeBooleanAccess(
  obj: unknown,
  key: string,
): boolean | undefined {
  if (!isObject(obj)) return undefined;
  const value = obj[key];
  return isBoolean(value) ? value : undefined;
}

export function safeArrayAccess(
  obj: unknown,
  key: string,
): unknown[] | undefined {
  if (!isObject(obj)) return undefined;
  const value = obj[key];
  return isArray(value) ? value : undefined;
}

// ===== TYPE-SAFE OBJECT OPERATIONS =====

export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;

  for (const key of keys) {
    if (hasProperty(obj, key as string)) {
      result[key as K] = obj[key as K];
    }
  }

  return result;
}

export function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const result = { ...obj };

  for (const key of keys) {
    delete result[key];
  }

  return result;
}

export function keys<T extends Record<string, unknown>>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

export function values<T extends Record<string, unknown>>(
  obj: T,
): T[keyof T][] {
  return Object.values(obj) as T[keyof T][];
}

// ===== TYPE-SAFE ARRAY OPERATIONS =====

export function findFirst<T>(
  array: readonly T[],
  predicate: (item: T) => boolean,
): T | undefined {
  return array.find(predicate);
}

export function filterByType<T>(
  array: readonly unknown[],
  predicate: (item: unknown) => item is T,
): T[] {
  return array.filter(predicate);
}

// ===== VALIDATION RESULT =====

export interface ValidationResult<T> {
  success: true;
  data: T;
  errors?: never;
}

export interface ValidationError {
  success: false;
  data?: never;
  errors: string[];
}

export type ValidationOutcome<T> = ValidationResult<T> | ValidationError;

// ===== VALIDATION UTILITIES =====

export function createValidationSuccess<T>(data: T): ValidationResult<T> {
  return { success: true, data };
}

export function createValidationError(errors: string[]): ValidationError {
  return { success: false, errors };
}

export function validateAndTransform<T, U extends T>(
  value: T,
  validator: (val: T) => val is U,
  errorMessage: string,
): ValidationOutcome<U> {
  if (validator(value)) {
    return createValidationSuccess(value);
  }

  return createValidationError([errorMessage]);
}

// ===== COMPOSITION TYPE GUARDS =====

import type {
  PageType,
  SectionId,
  PageComposition,
  SectionConfig,
  SectionContent,
  CompositionContext,
} from "../composition/ports";

export function isPageType(value: unknown): value is PageType {
  return (
    isString(value) &&
    ["landing", "product", "pricing", "about"].includes(value)
  );
}

export function isSectionId(value: unknown): value is SectionId {
  return (
    isString(value) &&
    [
      "hero",
      "features",
      "benefits",
      "pricing",
      "testimonials",
      "faq",
      "footer",
      "social-proof",
      "demo",
      "cta",
    ].includes(value)
  );
}

export function isPageComposition(value: unknown): value is PageComposition {
  if (!isObject(value)) return false;

  return (
    hasProperty(value, "sections") &&
    isArray(value.sections) &&
    hasProperty(value, "metadata") &&
    isObject(value.metadata)
  );
}

export function isSectionConfig(value: unknown): value is SectionConfig {
  if (!isObject(value)) return false;

  return (
    hasProperty(value, "id") &&
    isSectionId(value.id) &&
    hasProperty(value, "component") &&
    isString(value.component)
  );
}

export function isSectionContent(value: unknown): value is SectionContent {
  if (!isObject(value)) return false;

  return hasProperty(value, "variant") && isObject(value.variant);
}

export function isCompositionContext(
  value: unknown,
): value is CompositionContext {
  if (!isObject(value)) return false;

  // CompositionContext can have various properties, so we do minimal validation
  return true;
}
