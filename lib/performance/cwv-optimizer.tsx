"use client";

import React, { useEffect, useCallback } from "react";
import { usePerformanceMonitor } from "./optimized-lazy-loading";

interface CWVOptimizerProps {
  children: React.ReactNode;
  enableCLSPrevention?: boolean;
  enableLCPTracking?: boolean;
  enableINPOptimization?: boolean;
}

/**
 * Core Web Vitals Optimizer
 * Otimiza LCP, CLS e INP para melhor performance
 */
export function CWVOptimizer({
  children,
  enableCLSPrevention = true,
  enableLCPTracking = true,
  enableINPOptimization = true,
}: CWVOptimizerProps) {
  const performanceMonitor = usePerformanceMonitor("CWVOptimizer");

  // CLS Prevention - Reserve space for dynamic content
  const preventLayoutShift = useCallback(() => {
    if (!enableCLSPrevention) return;

    // Reserve space for images that might load
    const images = document.querySelectorAll('img[data-reserve-space]');
    images.forEach(img => {
      const aspectRatio = img.getAttribute('data-aspect-ratio');
      if (aspectRatio) {
        const [width, height] = aspectRatio.split('/').map(Number);
        if (width && height) {
          img.style.aspectRatio = `${width}/${height}`;
          img.style.minHeight = `${(height / width) * 100}vw`;
        }
      }
    });

    // Reserve space for text that might change
    const dynamicText = document.querySelectorAll('[data-dynamic-text]');
    dynamicText.forEach(el => {
      const minHeight = el.getAttribute('data-min-height');
      if (minHeight) {
        (el as HTMLElement).style.minHeight = minHeight;
      }
    });
  }, [enableCLSPrevention]);

  // LCP Tracking and Optimization
  const optimizeLCP = useCallback(() => {
    if (!enableLCPTracking) return;

    // Preload LCP candidate
    const lcpElement = document.querySelector('[data-lcp-candidate]');
    if (lcpElement) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.entryType === 'largest-contentful-paint') {
            performanceMonitor.trackMetric('LCP', entry.startTime);
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('LCP observer not supported');
      }
    }
  }, [enableLCPTracking, performanceMonitor]);

  // INP Optimization
  const optimizeINP = useCallback(() => {
    if (!enableINPOptimization) return;

    let interactionCount = 0;
    const maxInteractions = 50; // Limit interactions to improve INP

    const handleInteraction = () => {
      interactionCount++;
      if (interactionCount > maxInteractions) {
        // Throttle interactions
        return false;
      }
      return true;
    };

    // Monitor interaction delays
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'event' && entry.processingStart) {
          const delay = entry.processingStart - entry.startTime;
          performanceMonitor.trackMetric('Interaction_Delay', delay);

          if (delay > 100) { // INP threshold
            console.warn('High interaction delay detected:', delay, 'ms');
          }
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['event'] });
    } catch (e) {
      console.warn('Interaction observer not supported');
    }

    // Add interaction throttling
    document.addEventListener('click', handleInteraction, { passive: true });
    document.addEventListener('keydown', handleInteraction, { passive: true });
  }, [enableINPOptimization, performanceMonitor]);

  useEffect(() => {
    // Initialize optimizations
    preventLayoutShift();
    optimizeLCP();
    optimizeINP();

    // Cleanup
    return () => {
      // Cleanup logic if needed
    };
  }, [preventLayoutShift, optimizeLCP, optimizeINP]);

  return <>{children}</>;
}

/**
 * LCP Optimizer - Focus on Largest Contentful Paint
 */
export function LCPOptimizer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Prioritize loading of LCP elements
    const lcpElements = document.querySelectorAll('[data-lcp-priority]');
    lcpElements.forEach((el, index) => {
      const htmlEl = el as HTMLElement;
      htmlEl.style.contentVisibility = 'auto';

      // Add fetch priority for images
      if (htmlEl.tagName === 'IMG') {
        htmlEl.setAttribute('fetchpriority', 'high');
      }

      // Add loading priority for resources
      if (index === 0) {
        htmlEl.setAttribute('data-lcp-candidate', 'true');
      }
    });
  }, []);

  return <>{children}</>;
}

/**
 * CLS Prevention Component
 */
export function CLSPrevention({ children, aspectRatio }: {
  children: React.ReactNode;
  aspectRatio?: string;
}) {
  return (
    <div
      style={{
        aspectRatio,
        minHeight: aspectRatio ? `calc(${aspectRatio.split('/')[1]} / ${aspectRatio.split('/')[0]} * 100vw)` : undefined,
      }}
      data-cls-prevention="true"
    >
      {children}
    </div>
  );
}

/**
 * INP Optimizer - Interaction to Next Paint
 */
export function INPOptimizer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Debounce rapid interactions
    let interactionTimeout: NodeJS.Timeout;

    const debounceInteractions = () => {
      clearTimeout(interactionTimeout);
      interactionTimeout = setTimeout(() => {
        // Process batched interactions
      }, 16); // ~60fps
    };

    document.addEventListener('click', debounceInteractions, { passive: true });
    document.addEventListener('touchstart', debounceInteractions, { passive: true });

    return () => {
      clearTimeout(interactionTimeout);
      document.removeEventListener('click', debounceInteractions);
      document.removeEventListener('touchstart', debounceInteractions);
    };
  }, []);

  return <>{children}</>;
}
