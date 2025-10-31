"use client";

import React, { useState, useEffect, useRef, lazy, Suspense, ComponentType } from "react";
import { cn } from "@/lib/utils";

/**
 * Optimized Lazy Loading System - Sprint T5 Performance
 * Provides intelligent component and image lazy loading with performance monitoring
 */

interface LazyComponentProps<T = any> {
  component: () => Promise<{ default: ComponentType<T> }>;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  preloadDistance?: number;
  priority?: "low" | "normal" | "high";
  trackPerformance?: boolean;
  componentProps?: T;
}

interface LazyImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> {
  src: string;
  alt: string;
  priority?: "low" | "normal" | "high";
  placeholder?: string;
  blurDataURL?: string;
  quality?: number;
  trackPerformance?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

interface IntersectionObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
}

/**
 * Smart Lazy Component Loader with performance monitoring
 */
export function LazyComponent<T = any>({
  component,
  fallback,
  errorFallback,
  preloadDistance = 200,
  priority = "normal",
  trackPerformance = true,
  componentProps,
  ...props
}: LazyComponentProps<T> & React.HTMLAttributes<HTMLDivElement>) {
  const [isVisible, setIsVisible] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadStartTime, setLoadStartTime] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const LazyLoadedComponent = lazy(component);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setLoadStartTime(performance.now());
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: `${preloadDistance}px`,
        threshold: 0.1,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [preloadDistance]);

  const handleLoad = () => {
    setIsLoaded(true);
    if (trackPerformance && loadStartTime) {
      const loadTime = performance.now() - loadStartTime;
      console.log(`Component loaded in ${loadTime.toFixed(2)}ms`, {
        priority,
        componentName: component.name || "unknown",
      });
    }
  };

  const handleError = (error: Error) => {
    setHasError(true);
    console.error("Lazy component failed to load:", error);
  };

  if (hasError && errorFallback) {
    return <>{errorFallback}</>;
  }

  return (
    <div
      ref={containerRef}
      className={cn("lazy-component", props.className)}
      {...props}
    >
      {isVisible ? (
        <Suspense
          fallback={
            fallback || (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )
          }
        >
          <LazyLoadedComponent
            {...(componentProps as T)}
            onLoad={handleLoad}
          />
        </Suspense>
      ) : (
        <div className="min-h-[100px] bg-gray-100 animate-pulse rounded" />
      )}
    </div>
  );
}

/**
 * Optimized Lazy Image with progressive loading and performance tracking
 */
export function LazyImage({
  src,
  alt,
  priority = "normal",
  placeholder,
  blurDataURL,
  quality = 75,
  trackPerformance = true,
  onLoad,
  onError,
  className,
  ...props
}: LazyImageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [loadStartTime, setLoadStartTime] = useState<number>(0);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (priority === "high") {
      setIsVisible(true);
      return;
    }

    const element = imgRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setLoadStartTime(performance.now());
            setIsVisible(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: "50px",
        threshold: 0.1,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    if (trackPerformance && loadStartTime) {
      const loadTime = performance.now() - loadStartTime;
      console.log(`Image loaded in ${loadTime.toFixed(2)}ms`, {
        src: src.substring(0, 50) + "...",
        priority,
      });
    }
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {/* Placeholder/Blur */}
      {(!isLoaded || hasError) && (
        <div
          className="absolute inset-0 bg-gray-200 animate-pulse"
          style={{
            backgroundImage: blurDataURL ? `url(${blurDataURL})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: blurDataURL ? "blur(10px)" : undefined,
          }}
        />
      )}

      {/* Main Image */}
      {isVisible && !hasError && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={priority === "high" ? "eager" : "lazy"}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            "transition-opacity duration-300",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          {...props}
        />
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-4xl mb-2">📷</div>
            <p className="text-sm">Imagem não pôde ser carregada</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Virtualized List Component for large datasets
 */
interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className,
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div
      ref={containerRef}
      className={cn("overflow-auto", className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        <div
          style={{
            transform: `translateY(${startIndex * itemHeight}px)`,
          }}
        >
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Performance Monitoring Hook for Components
 */
export function usePerformanceMonitor(componentName: string) {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef<number>(0);

  useEffect(() => {
    renderCountRef.current += 1;
    const now = performance.now();
    const timeSinceLastRender = now - lastRenderTimeRef.current;

    if (lastRenderTimeRef.current > 0) {
      console.log(`${componentName} re-rendered`, {
        renderCount: renderCountRef.current,
        timeSinceLastRender: `${timeSinceLastRender.toFixed(2)}ms`,
      });
    }

    lastRenderTimeRef.current = now;
  });

  return {
    renderCount: renderCountRef.current,
    reset: () => {
      renderCountRef.current = 0;
    },
  };
}

/**
 * Intelligent Preloading Hook
 */
export function useIntelligentPreload(
  urls: string[],
  options: {
    priority?: "low" | "normal" | "high";
    preloadDistance?: number;
  } = {}
) {
  const { priority = "normal", preloadDistance = 300 } = options;
  const [preloadedUrls, setPreloadedUrls] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Start preloading when element is near viewport
            urls.forEach((url) => {
              if (!preloadedUrls.has(url)) {
                const link = document.createElement("link");
                link.rel = "preload";
                link.href = url;
                link.as = url.endsWith(".js") ? "script" : "image";
                document.head.appendChild(link);

                setPreloadedUrls((prev) => new Set(prev).add(url));
              }
            });
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: `${preloadDistance}px`,
        threshold: 0.1,
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [urls, preloadDistance, preloadedUrls]);

  return containerRef;
}
