import { useState, useCallback } from "react";

/**
 * Hook para alternar entre estados
 * @param initialValue - Valor inicial
 * @param alternateValue - Valor alternativo (opcional)
 * @returns [value, toggle]
 */
export function useToggle<T = boolean>(
  initialValue: T,
  alternateValue?: T,
): [T, () => void] {
  const [currentValue, setCurrentValue] = useState<T>(initialValue);

  const toggle = useCallback(() => {
    setCurrentValue((prev) =>
      prev === initialValue
        ? alternateValue !== undefined
          ? alternateValue
          : (!prev as T)
        : initialValue,
    );
  }, [initialValue, alternateValue]);

  return [currentValue, toggle];
}
