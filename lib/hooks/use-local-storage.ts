import { useState, useCallback, useEffect } from "react";

/**
 * Hook para persistir valores no localStorage com hidratação SSR-safe
 * @param key - Chave do localStorage
 * @param initialValue - Valor inicial
 * @returns [storedValue, setValue, removeValue, isHydrated]
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((val: T) => T)) => void, () => void, boolean] {
  // Estado inicial sempre com valor padrão para evitar hydration mismatches
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  // Efeito para hidratar o valor do localStorage no cliente
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const item = window.localStorage.getItem(key);
        if (item !== null) {
          setStoredValue(JSON.parse(item));
        }
      } catch (error) {
        // Em caso de erro, mantém o valor inicial
        console.warn(`Error reading localStorage key "${key}":`, error);
      } finally {
        setIsHydrated(true);
      }
    }
  }, [key]);

  // Função para atualizar o valor
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);

      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
          console.warn(`Error writing to localStorage key "${key}":`, error);
        }
      }
    },
    [key, storedValue],
  );

  // Função para remover o valor
  const removeValue = useCallback(() => {
    setStoredValue(initialValue);
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Error removing localStorage key "${key}":`, error);
      }
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue, isHydrated];
}
