"use client";

import { useCallback, useEffect, useRef } from "react";
import { analytics } from "../analytics-core";

// Unified event types
export type InteractionType = "click" | "press" | "activate";
export type InputMethod = "mouse" | "touch" | "keyboard" | "pointer";

export interface UnifiedEvent {
  type: InteractionType;
  inputMethod: InputMethod;
  target: HTMLElement;
  originalEvent: Event;
  timestamp: number;
}

// Event detection utilities (SSR safe)
const detectInputMethod = (event: Event): InputMethod => {
  // Keyboard detection
  if (event.type === "keydown" || event.type === "keyup") {
    return "keyboard";
  }

  // Touch detection
  if (event.type.startsWith("touch") || "touches" in event) {
    return "touch";
  }

  // Pointer detection (preferred over mouse) - SSR safe
  if (
    typeof window !== "undefined" &&
    window.PointerEvent &&
    event instanceof PointerEvent
  ) {
    return event.pointerType === "mouse"
      ? "mouse"
      : event.pointerType === "touch"
        ? "touch"
        : "pointer";
  }

  // Mouse detection (fallback)
  if (event.type.startsWith("mouse") || event instanceof MouseEvent) {
    return "mouse";
  }

  return "pointer"; // Default fallback
};

const normalizeInteractionType = (event: Event): InteractionType => {
  switch (event.type) {
    case "click":
    case "pointerdown":
    case "mousedown":
    case "touchstart":
      return "press";

    case "keydown":
      const keyEvent = event as KeyboardEvent;
      if (keyEvent.key === "Enter" || keyEvent.key === " ") {
        return "activate";
      }
      return "press";

    case "keyup":
      return "activate";

    default:
      return "click";
  }
};

// Hook for unified event handling
export function useUnifiedEvents() {
  const listenersRef = useRef<
    Map<HTMLElement, { [key: string]: EventListener }>
  >(new Map());

  // Add unified event listener
  const addUnifiedListener = useCallback(
    (
      element: HTMLElement,
      handler: (event: UnifiedEvent) => void,
      options: {
        capture?: boolean;
        once?: boolean;
        trackAnalytics?: boolean;
      } = {},
    ) => {
      const { capture = false, once = false, trackAnalytics = true } = options;

      // Remove existing listeners for this element
      removeUnifiedListener(element);

      const eventTypes = [
        "click",
        "pointerdown",
        "mousedown",
        "touchstart", // Press events
        "keydown",
        "keyup", // Keyboard events
      ];

      const listeners: { [key: string]: EventListener } = {};

      // Unified handler
      const unifiedHandler = (originalEvent: Event) => {
        // Prevent duplicate handling for composed events
        if (
          originalEvent.type === "click" &&
          (originalEvent as MouseEvent).detail === 0
        ) {
          return; // Skip programmatic clicks
        }

        const inputMethod = detectInputMethod(originalEvent);
        const interactionType = normalizeInteractionType(originalEvent);

        const unifiedEvent: UnifiedEvent = {
          type: interactionType,
          inputMethod,
          target: originalEvent.target as HTMLElement,
          originalEvent,
          timestamp: Date.now(),
        };

        // Track analytics if enabled
        if (trackAnalytics) {
          analytics.track("interaction", {
            type: interactionType,
            inputMethod,
            element: element.tagName.toLowerCase(),
            elementId: element.id || undefined,
            elementClass: element.className || undefined,
            timestamp: unifiedEvent.timestamp,
          });
        }

        // Call user handler
        handler(unifiedEvent);

        // Remove listener if once option is set
        if (once) {
          removeUnifiedListener(element);
        }
      };

      // Add listeners for all event types
      eventTypes.forEach((eventType) => {
        const listener = (event: Event) => {
          // Debounce rapid events (e.g., touchstart + click)
          if (
            event.type === "click" &&
            listeners.touchstart &&
            Date.now() - (listeners.touchstart as any).lastTouch < 300
          ) {
            return;
          }

          unifiedHandler(event);
        };

        element.addEventListener(eventType, listener, { capture, once });
        listeners[eventType] = listener;

        // Track touch timing for debounce
        if (eventType === "touchstart") {
          (listener as any).lastTouch = 0;
          element.addEventListener(
            "touchstart",
            () => {
              (listener as any).lastTouch = Date.now();
            },
            { capture },
          );
        }
      });

      // Store listeners for cleanup
      listenersRef.current.set(element, listeners);

      // Return cleanup function
      return () => removeUnifiedListener(element);
    },
    [],
  );

  // Remove unified event listener
  const removeUnifiedListener = useCallback((element: HTMLElement) => {
    const listeners = listenersRef.current.get(element);
    if (!listeners) return;

    Object.entries(listeners).forEach(([eventType, listener]) => {
      element.removeEventListener(eventType, listener);
    });

    listenersRef.current.delete(element);
  }, []);

  // Cleanup all listeners on unmount
  useEffect(() => {
    return () => {
      listenersRef.current.forEach((listeners, element) => {
        Object.entries(listeners).forEach(([eventType, listener]) => {
          element.removeEventListener(eventType, listener);
        });
      });
      listenersRef.current.clear();
    };
  }, []);

  return {
    addUnifiedListener,
    removeUnifiedListener,
  };
}

// Hook for tracking focus states (accessibility)
export function useFocusTracking() {
  const { addUnifiedListener } = useUnifiedEvents();

  const trackFocus = useCallback((element: HTMLElement) => {
    const handleFocus = () => {
      analytics.track("focus", {
        element: element.tagName.toLowerCase(),
        elementId: element.id || undefined,
        elementClass: element.className || undefined,
        timestamp: Date.now(),
      });
    };

    const handleBlur = () => {
      analytics.track("blur", {
        element: element.tagName.toLowerCase(),
        elementId: element.id || undefined,
        elementClass: element.className || undefined,
        timestamp: Date.now(),
      });
    };

    element.addEventListener("focus", handleFocus);
    element.addEventListener("blur", handleBlur);

    return () => {
      element.removeEventListener("focus", handleFocus);
      element.removeEventListener("blur", handleBlur);
    };
  }, []);

  return { trackFocus };
}

// Hook for tracking viewport visibility (lazy loading trigger)
export function useViewportTracking() {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementsRef = useRef<Set<Element>>(new Set());

  const observe = useCallback(
    (
      element: Element,
      callback: (entry: IntersectionObserverEntry) => void,
    ) => {
      if (!observerRef.current) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              // Track visibility changes
              analytics.track("viewport_visibility", {
                elementId: (entry.target as HTMLElement).id || undefined,
                visible: entry.isIntersecting,
                intersectionRatio: entry.intersectionRatio,
                timestamp: Date.now(),
              });

              callback(entry);
            });
          },
          {
            threshold: [0, 0.1, 0.5, 1.0],
            rootMargin: "50px",
          },
        );
      }

      observerRef.current.observe(element);
      elementsRef.current.add(element);
    },
    [],
  );

  const unobserve = useCallback((element: Element) => {
    if (observerRef.current) {
      observerRef.current.unobserve(element);
      elementsRef.current.delete(element);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        elementsRef.current.forEach((element) => {
          observerRef.current!.unobserve(element);
        });
        elementsRef.current.clear();
      }
    };
  }, []);

  return { observe, unobserve };
}
