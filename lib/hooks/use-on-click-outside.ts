import { useEffect, useRef } from "react";

/**
 * Hook para detectar cliques fora de um elemento
 * @param handler - Função chamada quando clicar fora
 * @returns Ref para o elemento
 */
export function useOnClickOutside<T extends HTMLElement = HTMLElement>(
  handler: (event: MouseEvent | TouchEvent) => void,
): React.RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    // Only run on client side
    if (typeof document === "undefined") return;

    const listener = (event: MouseEvent | TouchEvent) => {
      const element = ref.current;
      if (!element || element.contains(event.target as Node)) {
        return;
      }
      handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [handler]);

  return ref;
}

import React from "react";
