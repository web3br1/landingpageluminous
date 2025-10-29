import { useEffect, useRef } from "react";

/**
 * Hook para adicionar event listeners de forma segura
 * @param eventName - Nome do evento
 * @param handler - Função handler
 * @param element - Elemento alvo (padrão window)
 */
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element?: EventTarget,
): void;

export function useEventListener<K extends keyof DocumentEventMap>(
  eventName: K,
  handler: (event: DocumentEventMap[K]) => void,
  element?: EventTarget,
): void;

export function useEventListener(
  eventName: string,
  handler: (event: Event) => void,
  element?: EventTarget,
): void {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    // SSR safety: only add listeners on client-side
    if (typeof window === "undefined") return;

    const targetElement = element || window;
    const isSupported = targetElement && targetElement.addEventListener;
    if (!isSupported) return;

    const eventListener = (event: Event) => savedHandler.current(event);
    targetElement.addEventListener(eventName, eventListener);

    return () => {
      targetElement.removeEventListener(eventName, eventListener);
    };
  }, [eventName, element]);
}
