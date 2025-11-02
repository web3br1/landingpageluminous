
interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number; // Time window in milliseconds
  blockDurationMs: number; // How long to block after exceeding limit
  key?: string; // Optional key for localStorage persistence
}

interface RateLimitState {
  attempts: number;
  windowStart: number;
  isBlocked: boolean;
  blockUntil: number;
  remainingAttempts: number;
  timeUntilUnblock: number;
  timeUntilReset: number;
}

interface UseRateLimitingReturn {
  state: RateLimitState;
  canAttempt: boolean;
  attempt: () => boolean;
  reset: () => void;
  getRemainingTime: () => { minutes: number; seconds: number };
}

const STORAGE_KEY_PREFIX = "rate_limit_";

/**
 * Hook for client-side rate limiting with localStorage persistence
 */
export function useRateLimiting(
  config: RateLimitConfig,
): UseRateLimitingReturn {
  const { maxAttempts, windowMs, blockDurationMs, key } = config;

  // Load initial state from localStorage if key provided
  const loadState = useCallback((): RateLimitState => {
    if (!key || typeof window === "undefined") {
      return {
        attempts: 0,
        windowStart: Date.now(),
        isBlocked: false,
        blockUntil: 0,
        remainingAttempts: maxAttempts,
        timeUntilUnblock: 0,
        timeUntilReset: windowMs,
      };
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY_PREFIX + key);
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = Date.now();

        // Check if stored state is still valid
        if (parsed.windowStart + windowMs < now) {
          // Window expired, reset
          return {
            attempts: 0,
            windowStart: now,
            isBlocked: false,
            blockUntil: 0,
            remainingAttempts: maxAttempts,
            timeUntilUnblock: 0,
            timeUntilReset: windowMs,
          };
        }

        // Check if block period expired
        if (parsed.isBlocked && parsed.blockUntil < now) {
          return {
            ...parsed,
            isBlocked: false,
            blockUntil: 0,
            remainingAttempts: Math.max(0, maxAttempts - parsed.attempts),
            timeUntilUnblock: 0,
          };
        }

        return {
          ...parsed,
          remainingAttempts: Math.max(0, maxAttempts - parsed.attempts),
          timeUntilUnblock: Math.max(0, parsed.blockUntil - now),
          timeUntilReset: Math.max(0, parsed.windowStart + windowMs - now),
        };
      }
    } catch (error) {
      console.warn("Failed to load rate limit state from localStorage:", error);
    }

    return {
      attempts: 0,
      windowStart: Date.now(),
      isBlocked: false,
      blockUntil: 0,
      remainingAttempts: maxAttempts,
      timeUntilUnblock: 0,
      timeUntilReset: windowMs,
    };
  }, [key, maxAttempts, windowMs]);

  // Save state to localStorage
  const saveState = useCallback(
    (state: RateLimitState) => {
      if (!key || typeof window === "undefined") return;

      try {
        localStorage.setItem(
          STORAGE_KEY_PREFIX + key,
          JSON.stringify({
            attempts: state.attempts,
            windowStart: state.windowStart,
            isBlocked: state.isBlocked,
            blockUntil: state.blockUntil,
          }),
        );
      } catch (error) {
        console.warn("Failed to save rate limit state to localStorage:", error);
      }
    },
    [key],
  );

  const [state, setState] = useState<RateLimitState>(loadState);

  // Update computed values when state changes
  const updateComputedValues = useCallback(
    (currentState: RateLimitState): RateLimitState => {
      const now = Date.now();
      const newState = { ...currentState };

      // Check if window expired
      if (now - currentState.windowStart >= windowMs) {
        newState.attempts = 0;
        newState.windowStart = now;
        newState.isBlocked = false;
        newState.blockUntil = 0;
      }

      // Check if block expired
      if (newState.isBlocked && now >= newState.blockUntil) {
        newState.isBlocked = false;
        newState.blockUntil = 0;
      }

      // Update computed values
      newState.remainingAttempts = Math.max(0, maxAttempts - newState.attempts);
      newState.timeUntilUnblock = newState.isBlocked
        ? Math.max(0, newState.blockUntil - now)
        : 0;
      newState.timeUntilReset = Math.max(
        0,
        newState.windowStart + windowMs - now,
      );

      return newState;
    },
    [maxAttempts, windowMs],
  );

  // Timer to update computed values
  useEffect(() => {
    const interval = setInterval(() => {
      setState((currentState) => {
        const newState = updateComputedValues(currentState);
        if (JSON.stringify(newState) !== JSON.stringify(currentState)) {
          saveState(newState);
          return newState;
        }
        return currentState;
      });
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [updateComputedValues, saveState]);

  // Check if attempt is allowed
  const canAttempt = !state.isBlocked && state.attempts < maxAttempts;

  // Attempt to make a request
  const attempt = useCallback((): boolean => {
    if (!canAttempt) return false;

    setState((currentState) => {
      const now = Date.now();

      // Check if window expired
      const newState = { ...currentState };
      if (now - currentState.windowStart >= windowMs) {
        newState.attempts = 0;
        newState.windowStart = now;
      }

      newState.attempts += 1;

      // Check if limit exceeded
      if (newState.attempts >= maxAttempts) {
        newState.isBlocked = true;
        newState.blockUntil = now + blockDurationMs;
      }

      const finalState = updateComputedValues(newState);
      saveState(finalState);
      return finalState;
    });

    return true;
  }, [
    canAttempt,
    maxAttempts,
    windowMs,
    blockDurationMs,
    updateComputedValues,
    saveState,
  ]);

  // Reset rate limiting
  const reset = useCallback(() => {
    const newState = {
      attempts: 0,
      windowStart: Date.now(),
      isBlocked: false,
      blockUntil: 0,
      remainingAttempts: maxAttempts,
      timeUntilUnblock: 0,
      timeUntilReset: windowMs,
    };

    setState(newState);
    saveState(newState);
  }, [maxAttempts, windowMs, saveState]);

  // Get remaining time formatted
  const getRemainingTime = useCallback(() => {
    const timeMs = state.isBlocked
      ? state.timeUntilUnblock
      : state.timeUntilReset;
    const minutes = Math.floor(timeMs / 60000);
    const seconds = Math.floor((timeMs % 60000) / 1000);

    return { minutes, seconds };
  }, [state]);

  return {
    state,
    canAttempt,
    attempt,
    reset,
    getRemainingTime,
  };
}
