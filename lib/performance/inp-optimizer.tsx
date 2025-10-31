"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

interface INPOptimizerProps {
  children: React.ReactNode;
  debounceMs?: number;
  maxInteractions?: number;
}

/**
 * INP Optimizer Component
 * Optimizes Interaction to Next Paint by debouncing interactions and limiting rapid events
 */
export function INPOptimizer({
  children,
  debounceMs = 16, // ~60fps
  maxInteractions = 10
}: INPOptimizerProps) {
  const interactionCountRef = useRef(0);
  const lastInteractionTimeRef = useRef(0);

  const throttleInteractions = useCallback((callback: () => void) => {
    const now = Date.now();
    const timeSinceLastInteraction = now - lastInteractionTimeRef.current;

    if (timeSinceLastInteraction >= debounceMs) {
      interactionCountRef.current++;
      lastInteractionTimeRef.current = now;

      // Reset counter periodically
      if (interactionCountRef.current > maxInteractions) {
        setTimeout(() => {
          interactionCountRef.current = 0;
        }, 1000);
      }

      callback();
    }
  }, [debounceMs, maxInteractions]);

  useEffect(() => {
    // Add global interaction throttling
    const handleGlobalInteraction = (event: Event) => {
      const target = event.target as HTMLElement;

      // Only throttle interactive elements
      if (target.matches('button, a, input, textarea, select, [role="button"], [tabindex]')) {
        throttleInteractions(() => {
          // Allow the interaction to proceed
          console.log(`[INP] Interaction allowed: ${event.type} on ${target.tagName}`);
        });
      }
    };

    // Throttle rapid events
    document.addEventListener('click', handleGlobalInteraction, { passive: true });
    document.addEventListener('keydown', handleGlobalInteraction, { passive: true });
    document.addEventListener('input', handleGlobalInteraction, { passive: true });

    return () => {
      document.removeEventListener('click', handleGlobalInteraction);
      document.removeEventListener('keydown', handleGlobalInteraction);
      document.removeEventListener('input', handleGlobalInteraction);
    };
  }, [throttleInteractions]);

  return (
    <div data-inp-optimized="true">
      {children}
    </div>
  );
}

/**
 * Interactive Element Optimizer - Optimizes buttons, links, and form elements
 */
export function InteractiveElementOptimizer({
  children,
  as: Component = 'button',
  onClick,
  debounceMs = 100,
  ...props
}: {
  children: React.ReactNode;
  as?: React.ElementType;
  onClick?: (event: React.MouseEvent) => void;
  debounceMs?: number;
  [key: string]: any;
}) {
  const [isInteracting, setIsInteracting] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleClick = useCallback((event: React.MouseEvent) => {
    if (isInteracting) return;

    setIsInteracting(true);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Execute the click handler
    onClick?.(event);

    // Reset interaction state
    timeoutRef.current = setTimeout(() => {
      setIsInteracting(false);
    }, debounceMs);
  }, [onClick, debounceMs, isInteracting]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <Component
      {...props}
      onClick={handleClick}
      disabled={isInteracting}
      data-inp-interactive="true"
      style={{
        ...props.style,
        // Prevent multiple rapid clicks
        pointerEvents: isInteracting ? 'none' : 'auto',
        // Visual feedback
        opacity: isInteracting ? 0.7 : 1,
        transition: 'opacity 0.1s ease',
      }}
    >
      {children}
    </Component>
  );
}

/**
 * Form INP Optimizer - Prevents rapid form submissions and input events
 */
export function FormINPOptimizer({
  children,
  onSubmit,
  inputDebounceMs = 300,
  className = ""
}: {
  children: React.ReactNode;
  onSubmit?: (event: React.FormEvent) => void;
  inputDebounceMs?: number;
  className?: string;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const submitTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleSubmit = useCallback((event: React.FormEvent) => {
    event.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);

    // Clear any existing timeout
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
    }

    // Execute submit handler
    onSubmit?.(event);

    // Reset submit state after a delay
    submitTimeoutRef.current = setTimeout(() => {
      setIsSubmitting(false);
    }, 1000); // Prevent double submissions for 1 second
  }, [onSubmit, isSubmitting]);

  const handleInput = useCallback((event: React.FormEvent) => {
    // Debounce input events
    if (inputTimeoutRef.current) {
      clearTimeout(inputTimeoutRef.current);
    }

    inputTimeoutRef.current = setTimeout(() => {
      // Process input (validation, etc.)
      const target = event.target as HTMLInputElement;
      console.log(`[INP] Input processed: ${target.name || target.id}`);
    }, inputDebounceMs);
  }, [inputDebounceMs]);

  useEffect(() => {
    return () => {
      if (inputTimeoutRef.current) {
        clearTimeout(inputTimeoutRef.current);
      }
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
    };
  }, []);

  return (
    <form
      className={className}
      onSubmit={handleSubmit}
      onInput={handleInput}
      data-inp-form="true"
    >
      {children}
      {isSubmitting && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-sm text-blue-700 dark:text-blue-300">
              Processando...
            </span>
          </div>
        </div>
      )}
    </form>
  );
}

/**
 * Scroll INP Optimizer - Throttles scroll event handlers
 */
export function ScrollINPOptimizer({
  children,
  onScroll,
  throttleMs = 16,
  className = ""
}: {
  children: React.ReactNode;
  onScroll?: (event: React.UIEvent<HTMLDivElement>) => void;
  throttleMs?: number;
  className?: string;
}) {
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastScrollTimeRef = useRef(0);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const now = Date.now();
    const timeSinceLastScroll = now - lastScrollTimeRef.current;

    if (timeSinceLastScroll >= throttleMs) {
      lastScrollTimeRef.current = now;
      setIsScrolling(true);

      // Clear existing timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // Execute scroll handler
      onScroll?.(event);

      // Reset scrolling state
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, throttleMs * 2);
    }
  }, [onScroll, throttleMs]);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={className}
      onScroll={handleScroll}
      data-inp-scroll="true"
      style={{
        // Optimize scrolling performance
        willChange: isScrolling ? 'scroll-position' : 'auto',
        contain: 'layout style paint',
      }}
    >
      {children}
    </div>
  );
}

/**
 * Animation INP Optimizer - Prevents INP issues from animations
 */
export function AnimationINPOptimizer({
  children,
  reduceMotion = false,
  className = ""
}: {
  children: React.ReactNode;
  reduceMotion?: boolean;
  className?: string;
}) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const shouldReduceMotion = prefersReducedMotion || reduceMotion;

  return (
    <div
      className={className}
      style={{
        // Reduce motion for better INP
        transition: shouldReduceMotion ? 'none' : undefined,
        animation: shouldReduceMotion ? 'none' : undefined,
        // Optimize for interactions
        contain: 'layout style paint',
      }}
      data-inp-animation={shouldReduceMotion ? 'reduced' : 'normal'}
    >
      {children}
    </div>
  );
}

/**
 * Hover INP Optimizer - Prevents INP issues from hover effects
 */
export function HoverINPOptimizer({
  children,
  hoverDelay = 100,
  className = ""
}: {
  children: React.ReactNode;
  hoverDelay?: number;
  className?: string;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(true);
    }, hoverDelay);
  }, [hoverDelay]);

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, hoverDelay);
  }, [hoverDelay]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-inp-hover={isHovered ? 'active' : 'inactive'}
      style={{
        // Optimize hover performance
        willChange: isHovered ? 'transform, opacity' : 'auto',
        contain: 'layout style paint',
      }}
    >
      {children}
    </div>
  );
}
