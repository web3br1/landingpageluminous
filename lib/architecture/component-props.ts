/**
 * Component Props Validation Pattern - Standardized prop validation and error handling
 *
 * Eliminates runtime prop errors by providing consistent patterns
 * for validation, fallback handling, and error reporting in React components.
 */

import * as React from "react";
import { z, ZodError } from "zod";

// ===== PROPS VALIDATION SCHEMAS =====

export interface ValidationConfig {
  logErrors?: boolean;
  throwOnError?: boolean;
  fallbackValues?: Record<string, unknown>;
  componentName?: string;
}

// ===== VALIDATION RESULT TYPES =====

export interface ValidationResult<T> {
  success: true;
  data: T;
  errors?: never;
  warnings?: string[];
}

export interface ValidationError {
  success: false;
  data?: never;
  errors: z.ZodIssue[];
  warnings?: string[];
}

export type PropsValidationResult<T> = ValidationResult<T> | ValidationError;

// ===== VALIDATION FUNCTIONS =====

/**
 * Validate component props against a Zod schema
 */
export function validateProps<T>(
  props: unknown,
  schema: z.ZodSchema<T>,
  config: ValidationConfig = {}
): PropsValidationResult<T> {
  const {
    logErrors = true,
    throwOnError = false,
    fallbackValues = {},
    componentName = "UnknownComponent",
  } = config;

  try {
    const validatedData = schema.parse(props);

    // Check for warnings (optional props that could be improved)
    const warnings: string[] = [];

    return {
      success: true,
      data: validatedData,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    if (error instanceof ZodError) {
      const validationError: ValidationError = {
        success: false,
        errors: error.issues,
      };

      if (logErrors) {
        console.error(`[ComponentProps] Validation failed for ${componentName}:`, {
          errors: error.issues,
          props: typeof props === "object" ? props : { value: props },
          componentName,
        });
      }

      if (throwOnError) {
        throw error;
      }

      return validationError;
    }

    // Unexpected error
    if (logErrors) {
      console.error(`[ComponentProps] Unexpected error in ${componentName}:`, error);
    }

    if (throwOnError) {
      throw error;
    }

    return {
      success: false,
      errors: [{
        code: "custom",
        message: "Unexpected validation error",
        path: [],
      }],
    };
  }
}

/**
 * Validate props with fallback values for invalid data
 */
export function validatePropsWithFallback<T>(
  props: unknown,
  schema: z.ZodSchema<T>,
  config: ValidationConfig & { fallbackValues: Partial<T> }
): T {
  const result = validateProps(props, schema, config);

  if (result.success) {
    return result.data;
  }

  // Apply fallback values
  const fallbackProps = { ...config.fallbackValues } as T;

  if (config.logErrors) {
    console.warn(`[ComponentProps] Using fallback values for ${config.componentName || "UnknownComponent"}:`, {
      errors: result.errors,
      fallbackValues: config.fallbackValues,
    });
  }

  return fallbackProps;
}

// ===== HOOK FOR COMPONENT VALIDATION =====

/**
 * React hook for prop validation in functional components
 */
export function useValidatedProps<T>(
  props: unknown,
  schema: z.ZodSchema<T>,
  config: ValidationConfig = {}
): T {
  const [validatedProps, setValidatedProps] = React.useState<T | null>(null);
  const [errors, setErrors] = React.useState<PropsValidationResult<T> | null>(null);

  React.useEffect(() => {
    const result = validateProps(props, schema, config);

    if (result.success) {
      setValidatedProps(result.data);
      setErrors(null);
    } else {
      setErrors(result);
      if (config.fallbackValues) {
        setValidatedProps(config.fallbackValues as T);
      }
    }
  }, [props, schema, config]);

  if (errors && !config.fallbackValues) {
    throw new Error(`Props validation failed for ${config.componentName || "Component"}: ${errors.errors.map(e => e.message).join(", ")}`);
  }

  return validatedProps!;
}

// ===== COMMON PROP SCHEMAS =====

/**
 * Common schemas for frequently used prop types
 */
export const CommonPropSchemas = {
  // String props
  string: (defaultValue?: string) => z.string().default(defaultValue || ""),

  // Optional string
  optionalString: z.string().optional(),

  // Required string with min/max length
  requiredString: (min = 1, max = 1000) => z.string().min(min).max(max),

  // Number props
  number: (defaultValue?: number) => z.number().default(defaultValue || 0),

  // Optional number
  optionalNumber: z.number().optional(),

  // Boolean props
  boolean: (defaultValue = false) => z.boolean().default(defaultValue),

  // Array props
  array: <T>(itemSchema: z.ZodSchema<T>) => z.array(itemSchema).default([]),

  // Object props
  object: <T extends z.ZodRawShape>(shape: T) => z.object(shape),

  // CSS className
  className: z.string().optional(),

  // React children
  children: z.custom<React.ReactNode>().optional(),

  // Event handlers
  onClick: z.custom<(event: React.MouseEvent) => void>().optional(),

  // Style object
  style: z.record(z.string(), z.union([z.string(), z.number()])).optional(),

  // Ref
  ref: z.custom<React.Ref<any>>().optional(),
};

// ===== COMPONENT PROP VALIDATORS =====

/**
 * Create a prop validator for a specific component
 */
export function createPropValidator<T>(
  schema: z.ZodSchema<T>,
  componentName: string,
  options: Partial<ValidationConfig> = {}
) {
  return {
    validate: (props: unknown) => validateProps(props, schema, { componentName, ...options }),
    validateWithFallback: (props: unknown, fallbackValues: Partial<T>) =>
      validatePropsWithFallback(props, schema, { componentName, ...options, fallbackValues }),
    useValidatedProps: (props: unknown) => useValidatedProps(props, schema, { componentName, ...options }),
    schema,
  };
}

// ===== TYPE-SAFE PROP EXTRACTION =====

/**
 * Extract validated props from component arguments
 */
export function extractValidatedProps<T>(
  props: Record<string, unknown>,
  required: (keyof T)[],
  optional: (keyof T)[] = [],
  validators: Partial<Record<keyof T, z.ZodSchema<any>>> = {}
): T {
  const result = {} as T;

  // Validate required props
  for (const key of required) {
    const value = props[key as string];
    const validator = validators[key];

    if (validator) {
      const validation = validator.safeParse(value);
      if (!validation.success) {
        throw new Error(`Required prop "${String(key)}" validation failed: ${validation.error.message}`);
      }
      (result as any)[key] = validation.data;
    } else {
      if (value === undefined) {
        throw new Error(`Required prop "${String(key)}" is missing`);
      }
      (result as any)[key] = value;
    }
  }

  // Validate optional props
  for (const key of optional) {
    const value = props[key as string];
    const validator = validators[key];

    if (value !== undefined) {
      if (validator) {
        const validation = validator.safeParse(value);
        if (!validation.success) {
          console.warn(`Optional prop "${String(key)}" validation failed: ${validation.error.message}`);
          // Skip invalid optional props
          continue;
        }
        (result as any)[key] = validation.data;
      } else {
        (result as any)[key] = value;
      }
    }
  }

  return result;
}

// ===== REACT COMPONENT WRAPPER =====

/**
 * Higher-order component that adds prop validation
 */
export function withPropValidation<P extends Record<string, unknown>>(
  Component: React.ComponentType<P>,
  schema: z.ZodSchema<P>,
  config: ValidationConfig = {}
) {
  const componentName = config.componentName || Component.displayName || Component.name || "WrappedComponent";

  const ValidatedComponent = React.forwardRef<any, P>((props, ref) => {
    const validatedProps = useValidatedProps(props, schema, { ...config, componentName });

    return React.createElement(Component, { ...validatedProps, ref } as any);
  });

  ValidatedComponent.displayName = `Validated(${componentName})`;

  return ValidatedComponent;
}

// ===== PERFORMANCE MONITORING =====

/**
 * Monitor prop validation performance
 */
export function logValidationPerformance(
  componentName: string,
  validationTime: number,
  success: boolean,
  errorCount?: number
): void {
  if (validationTime > 10) { // Log slow validations (>10ms)
    console.warn(`[ComponentProps] Slow validation for ${componentName}: ${validationTime}ms`);
  }

  if (!success && errorCount) {
    console.error(`[ComponentProps] Validation failed for ${componentName}: ${errorCount} errors`);
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Create a performance-monitored validator
 */
export function createPerformanceValidator<T>(
  schema: z.ZodSchema<T>,
  componentName: string
) {
  return {
    validate: (props: unknown, config: ValidationConfig = {}) => {
      const startTime = performance.now();
      const result = validateProps(props, schema, { ...config, componentName });
      const endTime = performance.now();

      logValidationPerformance(componentName, endTime - startTime, result.success,
        result.success ? undefined : result.errors.length);

      return result;
    },
  };
}

/**
 * Safe prop accessor with logging
 */
export function safePropAccess<T>(
  obj: unknown,
  path: string[],
  defaultValue: T,
  componentName: string
): T {
  try {
    let current: any = obj;

    for (const key of path) {
      if (current == null || typeof current !== 'object') {
        console.warn(`[ComponentProps] Safe access failed for ${componentName}.${path.join('.')}: invalid path`);
        return defaultValue;
      }
      current = current[key];
    }

    return current !== undefined ? current : defaultValue;
  } catch (error) {
    console.error(`[ComponentProps] Safe access error for ${componentName}.${path.join('.')}:`, error);
    return defaultValue;
  }
}

// ===== TYPE HELPERS =====

/**
 * Extract validated prop types from schema
 */
export type ValidatedProps<T extends z.ZodSchema> = z.infer<T>;

/**
 * Create a component prop type with validation
 */
export type ComponentPropsWithValidation<T extends z.ZodSchema> = {
  schema: T;
  validate: (props: unknown) => PropsValidationResult<z.infer<T>>;
} & z.infer<T>;
