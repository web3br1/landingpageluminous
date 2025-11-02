"use client";

import React, { useEffect, useRef, useState } from "react";

interface LCPPlaceholderProps {
  width: number;
  height: number;
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  onLoad?: () => void;
}

/**
 * LCP Optimizer Component
 * Reserves space for Largest Contentful Paint elements to prevent layout shift
 */
export function LCPPlaceholder({
  width,
  height,
  src,
  alt,
  priority = false,
  className = "",
  onLoad
}: LCPPlaceholderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Calculate aspect ratio for space reservation
  const aspectRatio = width && height ? `${width}/${height}` : undefined;

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const handleLoad = () => {
      setIsLoaded(true);
      onLoad?.();
    };

    const handleError = () => {
      setHasError(true);
    };

    if (img.complete) {
      handleLoad();
    } else {
      img.addEventListener('load', handleLoad);
      img.addEventListener('error', handleError);
    }

    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
    };
  }, [onLoad]);

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        aspectRatio,
        minHeight: aspectRatio ? `calc(${height}/${width} * 100vw)` : undefined,
      }}
      data-lcp-candidate="true"
    >
      {/* Reserve space with background */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 animate-pulse"
        style={{ aspectRatio }}
      />

      {/* Actual image */}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ aspectRatio }}
      />

      {/* Loading indicator */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 dark:bg-neutral-800">
          <div className="text-center text-neutral-500">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm">Erro ao carregar imagem</p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Hero Image Optimizer - Critical for LCP
 */
export function HeroImageOptimizer({
  src,
  alt,
  width = 1920,
  height = 1080,
  className = ""
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
}) {
  const [isLCP, setIsLCP] = useState(false);

  useEffect(() => {
    // Mark as potential LCP candidate
    setIsLCP(true);

    // Preload the image
    const img = new Image();
    img.src = src;
    img.loading = 'eager';
    img.fetchPriority = 'high';

    // Report LCP when image loads
    img.onload = () => {
      if ('performance' in window && 'PerformanceObserver' in window) {
        // This will be captured by CWVMonitor
        console.log('[LCP] Hero image loaded, potential LCP candidate');
      }
    };
  }, [src]);

  return (
    <LCPPlaceholder
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={true}
      className={`${className} ${isLCP ? 'data-lcp-candidate' : ''}`}
      onLoad={() => {
        // Mark LCP timing
        if ('performance' in window && 'mark' in performance) {
          performance.mark('hero-image-loaded');
        }
      }}
    />
  );
}

/**
 * Content Image Optimizer - For above-the-fold content
 */
export function ContentImageOptimizer({
  src,
  alt,
  width,
  height,
  className = "",
  priority = false
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <LCPPlaceholder
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className={className}
    />
  );
}

/**
 * Text Content Optimizer - Reserves space for text content
 */
export function TextContentOptimizer({
  children,
  minHeight = "200px",
  className = ""
}: {
  children: React.ReactNode;
  minHeight?: string;
  className?: string;
}) {
  return (
    <div
      className={`relative ${className}`}
      style={{ minHeight }}
      data-text-content="true"
    >
      {children}
    </div>
  );
}

/**
 * Critical Content Wrapper - Ensures LCP elements load first
 */
export function CriticalContentWrapper({
  children,
  priority = "high"
}: {
  children: React.ReactNode;
  priority?: "high" | "normal" | "low";
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Add resource hints for critical content
    const links = container.querySelectorAll('img, video, iframe');
    links.forEach((element) => {
      if (priority === 'high') {
        element.setAttribute('fetchpriority', 'high');
        element.setAttribute('loading', 'eager');
      }
    });
  }, [priority]);

  return (
    <div
      ref={containerRef}
      className="critical-content-wrapper"
      data-content-priority={priority}
    >
      {children}
    </div>
  );
}

/**
 * Font Loading Optimizer - Critical for LCP
 */
export function FontOptimizer() {
  useEffect(() => {
    // Preload critical fonts
    const fontLinks = [
      {
        href: '/fonts/main.woff2',
        type: 'font/woff2',
        crossOrigin: 'anonymous'
      },
      {
        href: '/fonts/main-bold.woff2',
        type: 'font/woff2',
        crossOrigin: 'anonymous'
      }
    ];

    fontLinks.forEach(font => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = font.href;
      link.as = 'font';
      link.type = font.type;
      link.crossOrigin = font.crossOrigin as any;
      link.fetchPriority = 'high';
      document.head.appendChild(link);
    });

    // Add font-display: swap to prevent invisible text
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'Main Font';
        src: url('/fonts/main.woff2') format('woff2'),
             url('/fonts/main.woff') format('woff');
        font-display: swap;
        font-weight: 400;
      }
      @font-face {
        font-family: 'Main Font';
        src: url('/fonts/main-bold.woff2') format('woff2'),
             url('/fonts/main-bold.woff') format('woff');
        font-display: swap;
        font-weight: 700;
      }
    `;
    document.head.appendChild(style);
  }, []);

  return null;
}
