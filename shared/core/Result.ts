// Result pattern - Type-safe error handling
export type Result<T, E> = Ok<T> | Err<E>;

export class Ok<T> {
  readonly success = true as const;
  constructor(readonly value: T) {}
}

export class Err<E> {
  readonly success = false as const;
  constructor(readonly error: E) {}
}

export const Result = {
  ok<T>(value: T): Result<T, never> {
    return new Ok(value);
  },

  err<E>(error: E): Result<never, E> {
    return new Err(error);
  },
};

// Type guards
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.success;
}

export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return !result.success;
}
