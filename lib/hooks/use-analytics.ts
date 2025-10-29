/**
 * Analytics hooks for SSR-safe event tracking
 * Provides client-side only analytics with proper SSR handling
 */

import { useEffect, useCallback } from 'react';

// Analytics event types
export interface AnalyticsEvent {
  event: string;
  category?: string;
  action?: string;
  label?: string;
  value?: number;
  properties?: Record<string, any>;
}

// Analytics configuration
export interface AnalyticsConfig {
  enabled: boolean;
  debug: boolean;
  trackingId?: string;
}

// Default configuration
const DEFAULT_CONFIG: AnalyticsConfig = {
  enabled: true,
  debug: process.env.NODE_ENV === 'development',
};

/**
 * Check if we're in a browser environment
 */
function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Safe console logging for analytics events
 */
function logAnalytics(event: string, data: any): void {
  if (DEFAULT_CONFIG.debug) {
    console.log(`[Analytics] ${event}:`, data);
  }
}

/**
 * Track analytics event (client-side only)
 */
function trackEvent(event: AnalyticsEvent): void {
  if (!isBrowser() || !DEFAULT_CONFIG.enabled) {
    logAnalytics('skipped (SSR or disabled)', event);
    return;
  }

  try {
    // Placeholder for actual analytics implementation
    // In production, this would integrate with GA4, Plausible, etc.
    logAnalytics('tracked', event);

    // Example: Send to dataLayer for GTM
    if (window.dataLayer) {
      window.dataLayer.push({
        event: event.event,
        eventCategory: event.category,
        eventAction: event.action,
        eventLabel: event.label,
        eventValue: event.value,
        ...event.properties,
      });
    }

    // Example: Send to custom analytics endpoint
    // fetch('/api/analytics', { method: 'POST', body: JSON.stringify(event) });

  } catch (error) {
    console.warn('Analytics tracking failed:', error);
  }
}

/**
 * Hook for tracking page views
 */
export function usePageView(pageName?: string): void {
  useEffect(() => {
    if (pageName) {
      trackEvent({
        event: 'page_view',
        category: 'navigation',
        action: 'view',
        label: pageName,
      });
    }
  }, [pageName]);
}

/**
 * Hook for tracking user interactions
 */
export function useAnalyticsEvent() {
  const track = useCallback((event: AnalyticsEvent) => {
    trackEvent(event);
  }, []);

  const trackClick = useCallback((elementName: string, properties?: Record<string, any>) => {
    trackEvent({
      event: 'click',
      category: 'interaction',
      action: 'click',
      label: elementName,
      properties,
    });
  }, []);

  const trackConversion = useCallback((conversionType: string, value?: number, properties?: Record<string, any>) => {
    trackEvent({
      event: 'conversion',
      category: 'goal',
      action: conversionType,
      value,
      properties,
    });
  }, []);

  const trackError = useCallback((errorType: string, errorMessage?: string, properties?: Record<string, any>) => {
    trackEvent({
      event: 'error',
      category: 'error',
      action: errorType,
      label: errorMessage,
      properties,
    });
  }, []);

  return {
    track,
    trackClick,
    trackConversion,
    trackError,
  };
}

/**
 * Hook for tracking scroll depth
 */
export function useScrollTracking(thresholds: number[] = [25, 50, 75, 100]): void {
  useEffect(() => {
    if (!isBrowser()) return;

    let maxScroll = 0;
    const trackedThresholds = new Set<number>();

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      );

      const scrollPercent = Math.round((scrollTop / (documentHeight - windowHeight)) * 100);

      // Track new thresholds
      thresholds.forEach(threshold => {
        if (scrollPercent >= threshold && !trackedThresholds.has(threshold)) {
          trackedThresholds.add(threshold);
          trackEvent({
            event: 'scroll_depth',
            category: 'engagement',
            action: 'scroll',
            label: `${threshold}%`,
            value: threshold,
          });
        }
      });

      maxScroll = Math.max(maxScroll, scrollPercent);
    };

    // Throttle scroll events
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [thresholds]);
}

/**
 * Hook for tracking time spent on page
 */
export function useTimeTracking(pageName?: string): void {
  useEffect(() => {
    if (!isBrowser()) return;

    const startTime = Date.now();

    const trackTime = () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      trackEvent({
        event: 'time_spent',
        category: 'engagement',
        action: 'time',
        label: pageName || 'current_page',
        value: timeSpent,
      });
    };

    // Track time on page unload
    const handleBeforeUnload = () => {
      trackTime();
    };

    // Track time on visibility change
    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackTime();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      trackTime();
    };
  }, [pageName]);
}

/**
 * Hook for tracking form interactions
 */
export function useFormAnalytics(formName: string) {
  const { track } = useAnalyticsEvent();

  const trackFormStart = useCallback(() => {
    track({
      event: 'form_start',
      category: 'form',
      action: 'start',
      label: formName,
    });
  }, [track, formName]);

  const trackFormSubmit = useCallback((success: boolean) => {
    track({
      event: 'form_submit',
      category: 'form',
      action: success ? 'success' : 'error',
      label: formName,
      value: success ? 1 : 0,
    });
  }, [track, formName]);

  const trackFormField = useCallback((fieldName: string, action: 'focus' | 'blur' | 'change') => {
    track({
      event: 'form_field',
      category: 'form',
      action,
      label: `${formName}_${fieldName}`,
    });
  }, [track, formName]);

  return {
    trackFormStart,
    trackFormSubmit,
    trackFormField,
  };
}

/**
 * SSR-safe analytics initialization
 */
export function initializeAnalytics(config: Partial<AnalyticsConfig> = {}): void {
  if (!isBrowser()) return;

  // Merge config
  Object.assign(DEFAULT_CONFIG, config);

  logAnalytics('initialized', DEFAULT_CONFIG);
}

// Type declarations for global objects
declare global {
  interface Window {
    dataLayer?: any[];
  }
}