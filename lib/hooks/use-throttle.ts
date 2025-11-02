
/**
 * Hook para throttled values - limita frequência de atualizações de valor
 * @param value - Valor a ser throttled
 * @param limit - Limite mínimo entre atualizações em ms (padrão 300)
 * @returns Valor throttled
 */
export function useThrottle<T>(value: T, limit = 300): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef<number>(0);

  useEffect(() => {
    const now = Date.now();
    if (now - lastRan.current >= limit) {
      setThrottledValue(value);
      lastRan.current = now;
    }
    // If within throttle period, don't update the value
  }, [value, limit]);

  return throttledValue;
}

/**
 * Hook para throttled callbacks - limita frequência de execução (deprecated, use useThrottle for values)
 * @param callback - Função a ser throttled
 * @param delay - Delay mínimo entre execuções em ms (padrão 300)
 * @returns Função throttled
 * @deprecated Use useThrottle for values instead
 */
export function useThrottleCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay = 300,
): T {
  const lastRan = useRef<number>(0);
  const callbackRef = useRef<T>(callback);
  const delayRef = useRef<number>(delay);

  // Update refs when dependencies change
  callbackRef.current = callback;
  delayRef.current = delay;

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastRan.current >= delayRef.current) {
      lastRan.current = now;
      callbackRef.current(...args);
    }
  }) as T;
}
