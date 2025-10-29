import { useEffect, useRef, useState } from "react";

/**
 * Hook para Intersection Observer
 * @param options - Opções do observer ou ref
 * @returns [ref, isIntersecting, entry]
 */
export function useIntersectionObserver(
  options?: IntersectionObserverInit | React.RefObject<Element>,
): [React.RefObject<Element>, boolean, IntersectionObserverEntry | null] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const internalRef = useRef<Element>(null);

  // Handle both signature variants
  const targetRef = options && "current" in options ? options : internalRef;
  const observerOptions = options && "current" in options ? undefined : options;

  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    // Create the observer using the global IntersectionObserver
    const observer = new IntersectionObserver(
      ([entry]: IntersectionObserverEntry[]) => {
        setIsIntersecting(entry.isIntersecting);
        setEntry(entry);
      },
      observerOptions,
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [targetRef, observerOptions]);

  // Ensure we always return a valid tuple
  return [targetRef, isIntersecting, entry] as [
    React.RefObject<Element>,
    boolean,
    IntersectionObserverEntry | null,
  ];
}

import React from "react";
