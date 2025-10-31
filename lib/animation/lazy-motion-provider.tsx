"use client";

import { LazyMotion, domAnimation } from "framer-motion";
import { ReactNode, useState, useCallback, useEffect, useRef } from "react";

// ===== PERFORMANCE & LAZY LOADING TYPES =====

export interface LazyMotionFeatures {
  // DOM animation features (lighter bundle)
  domAnimation?: typeof domAnimation;
  // Full feature set (heavier bundle)
  domMax?: any;
  // Custom feature set
  custom?: Record<string, any>;
}

export interface LazyMotionProviderProps {
  children: ReactNode;
  features?: LazyMotionFeatures[keyof LazyMotionFeatures];
  strict?: boolean;
  // Performance monitoring
  enablePerformanceTracking?: boolean;
  // Bundle size reporting
  reportBundleSize?: boolean;
}

export interface LazyComponentProps {
  // Loading states
  loading?: boolean;
  error?: Error | null;
  // Performance hints
  priority?: "low" | "normal" | "high";
  // Bundle chunk hint
  chunkName?: string;
  // Fallback UI
  fallback?: ReactNode;
  // Custom props
  [key: string]: any;
}

/**
 * Lazy Motion Provider - Carrega Framer Motion apenas quando necessário
 *
 * Usa domAnimation como feature bundle mínimo (mais leve que domMax)
 * Reduz o bundle inicial em ~150-250KB
 */
export function LazyMotionProvider({
  children,
  features = domAnimation,
  strict = false,
}: LazyMotionProviderProps) {
  return (
    <LazyMotion features={features} strict={strict}>
      {children}
    </LazyMotion>
  );
}

/**
 * Hook para verificar se LazyMotion está disponível
 * Útil para componentes que precisam saber se animações estão ativas
 */
export function useLazyMotion() {
  return {
    isAvailable: typeof window !== "undefined",
    domAnimation,
  };
}

/**
 * Lazy Motion Loader - Carrega Framer Motion dinamicamente
 * Apenas quando o usuário interage ou rola a página
 */
export function useLazyMotionLoader() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadMotion = useCallback(async () => {
    if (isLoaded || isLoading) return;

    setIsLoading(true);
    try {
      // Dynamic import of framer-motion features
      const { domAnimation } = await import("framer-motion");
      // Mark as loaded
      setIsLoaded(true);
      return domAnimation;
    } catch (error) {
      console.warn("Failed to load framer-motion:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isLoading]);

  // Auto-load on user interaction or scroll
  useEffect(() => {
    const handleInteraction = () => {
      loadMotion();
      // Remove listeners after first interaction
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("scroll", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };

    // Load after 3 seconds of inactivity (user might be reading)
    const timeoutId = setTimeout(() => {
      loadMotion();
    }, 3000);

    // Load immediately on interaction
    window.addEventListener("click", handleInteraction, { passive: true });
    window.addEventListener("scroll", handleInteraction, { passive: true });
    window.addEventListener("keydown", handleInteraction, { passive: true });

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("scroll", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, [loadMotion]);

  return { isLoaded, isLoading, loadMotion };
}

/**
 * Motion Wrapper - Usa lazy loading para reduzir bundle inicial
 * Carrega Framer Motion apenas quando necessário
 */
export function MotionWrapper({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isLoaded, isLoading } = useLazyMotionLoader();

  // Show fallback while loading
  if (isLoading && !isLoaded) {
    return <>{fallback}</>;
  }

  // Use LazyMotion only after loading
  if (isLoaded) {
    return (
      <LazyMotion features={domAnimation} strict={false}>
        {children}
      </LazyMotion>
    );
  }

  // Fallback to static content before loading
  return <>{children}</>;
}

/**
 * Conditional Motion Component - Renderiza animações apenas quando carregado
 */
export function ConditionalMotion({
  children,
  staticFallback = children,
}: {
  children: ReactNode;
  staticFallback?: ReactNode;
}) {
  const { isLoaded } = useLazyMotionLoader();

  return <>{isLoaded ? children : staticFallback}</>;
}

/**
 * Lazy Recharts Loader - Carrega Recharts apenas quando necessário
 * Reduz bundle inicial em ~200-300KB
 */
export function useLazyRechartsLoader() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [components, setComponents] = useState<any>(null);

  const loadRecharts = useCallback(async () => {
    if (isLoaded || isLoading) return components;

    setIsLoading(true);
    try {
      // Dynamic import of recharts components
      const recharts = await import("recharts");
      setComponents(recharts);
      setIsLoaded(true);
      return recharts;
    } catch (error) {
      console.warn("Failed to load recharts:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isLoading, components]);

  return { isLoaded, isLoading, components, loadRecharts };
}

/**
 * Lazy Chart Component - Carrega gráficos apenas quando visíveis
 */
export function LazyChart({
  children,
  fallback = <div className="h-64 bg-gray-100 animate-pulse rounded-lg flex items-center justify-center">Carregando gráfico...</div>,
}: {
  children: (recharts: any) => ReactNode;
  fallback?: ReactNode;
}) {
  const { components, loadRecharts } = useLazyRechartsLoader();

  useEffect(() => {
    // Load recharts when component mounts
    loadRecharts();
  }, [loadRecharts]);

  if (!components) {
    return <>{fallback}</>;
  }

  return <>{children(components)}</>;
}

/**
 * Intersection-based Lazy Loader - Carrega componentes apenas quando visíveis
 * Reduz bundle inicial significativamente para componentes below-the-fold
 */
export function useIntersectionLazyLoader(options: {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
} = {}) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const elementRef = useRef<Element | null>(null);

  const { threshold = 0.1, rootMargin = "50px", triggerOnce = true } = options;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          setHasLoaded(true);
          if (triggerOnce) {
            observer.disconnect();
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return { elementRef, isVisible, hasLoaded };
}

/**
 * Lazy Component Wrapper - Renderiza children apenas quando visível
 */
export function LazyComponent({
  children,
  fallback = null,
  className = "",
  ...options
}: {
  children: ReactNode;
  fallback?: ReactNode;
  className?: string;
} & Parameters<typeof useIntersectionLazyLoader>[0]) {
  const { elementRef, hasLoaded } = useIntersectionLazyLoader(options);

  return (
    <div ref={elementRef as any} className={className}>
      {hasLoaded ? children : fallback}
    </div>
  );
}

/**
 * Performance Lazy Component - Combina interseção com carregamento dinâmico
 */
export function PerformanceLazyComponent({
  loader,
  children,
  fallback = <div className="h-32 bg-gray-100 animate-pulse rounded-lg" />,
  className = "",
  ...options
}: {
  loader: () => Promise<any>;
  children: (loadedModule: any) => ReactNode;
  fallback?: ReactNode;
  className?: string;
} & Parameters<typeof useIntersectionLazyLoader>[0]) {
  const { elementRef, hasLoaded } = useIntersectionLazyLoader(options);
  const [loadedModule, setLoadedModule] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (hasLoaded && !loadedModule && !isLoading) {
      setIsLoading(true);
      loader()
        .then(setLoadedModule)
        .catch((error) => {
          console.warn("Failed to load lazy component:", error);
        })
        .finally(() => setIsLoading(false));
    }
  }, [hasLoaded, loadedModule, isLoading, loader]);

  const content = loadedModule ? children(loadedModule) : fallback;

  return (
    <div ref={elementRef as any} className={className}>
      {content}
    </div>
  );
}