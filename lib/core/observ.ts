// Simple observability utilities to replace @shared/observ
// Basic timing and logging functions

export interface TimedResult {
  duration: number;
  result: unknown;
}

export const observability = {
  timed: <T>(
    operation: string,
    fn: () => T
  ): T => {
    const start = Date.now();
    try {
      const result = fn();
      const duration = Date.now() - start;
      console.log(`[TIMED] ${operation}: ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`[TIMED ERROR] ${operation}: ${duration}ms`, error);
      throw error;
    }
  },

  timedAsync: async <T>(
    operation: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    const start = Date.now();
    try {
      const result = await fn();
      const duration = Date.now() - start;
      console.log(`[TIMED ASYNC] ${operation}: ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`[TIMED ASYNC ERROR] ${operation}: ${duration}ms`, error);
      throw error;
    }
  },
};

// Re-export timed function for compatibility
export const timed = observability.timed;
export const timedAsync = observability.timedAsync;
