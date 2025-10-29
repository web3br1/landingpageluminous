import { useEffect, useRef } from "react";

/**
 * Hook para acessar o valor anterior de uma prop/variável
 * @param value - Valor atual
 * @returns Valor anterior
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>(undefined);
  const previousRef = useRef<T>(undefined);

  useEffect(() => {
    previousRef.current = ref.current;
    ref.current = value;
  }, [value]);

  return previousRef.current;
}
