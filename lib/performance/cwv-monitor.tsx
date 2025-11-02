"use client";


interface CWVMetrics {
  lcp: number;
  cls: number;
  inp: number;
  fid: number;
  ttfb: number;
  fcp: number;
}

interface PerformanceEntryWithValue extends PerformanceEntry {
  value?: number;
  processingStart?: number;
  startTime?: number;
}

export function CWVMonitor() {
  const sendToServiceWorker = useCallback((type: string, data: any) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type, data });
    }
  }, []);

  const reportMetric = useCallback((metric: keyof CWVMetrics, value: number) => {
    console.log(`[CWV] ${metric.toUpperCase()}: ${value}`);

    // Send to service worker for persistence
    sendToServiceWorker('update-performance', { metric, value });

    // Send to analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'web_vitals', {
        event_category: 'Web Vitals',
        event_label: metric.toUpperCase(),
        value: Math.round(value),
        custom_map: { metric_value: value }
      });
    }
  }, [sendToServiceWorker]);

  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('[SW] Registered successfully:', registration.scope);
        })
        .catch(error => {
          console.error('[SW] Registration failed:', error);
        });
    }

    // LCP (Largest Contentful Paint) monitoring
    const observeLCP = () => {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntryWithValue;

        if (lastEntry && lastEntry.startTime) {
          reportMetric('lcp', lastEntry.startTime);
        }
      });

      try {
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('[CWV] LCP not supported');
      }
    };

    // CLS (Cumulative Layout Shift) monitoring
    const observeCLS = () => {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShiftEntry = entry as any;
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value;
          }
        }
        reportMetric('cls', clsValue);
      });

      try {
        observer.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('[CWV] CLS not supported');
      }
    };

    // FID (First Input Delay) monitoring
    const observeFID = () => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fidEntry = entry as PerformanceEntryWithValue;
          if (fidEntry.processingStart && fidEntry.startTime) {
            const fid = fidEntry.processingStart - fidEntry.startTime;
            reportMetric('fid', fid);
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.warn('[CWV] FID not supported');
      }
    };

    // INP (Interaction to Next Paint) monitoring
    const observeINP = () => {
      let maxINP = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const inpEntry = entry as PerformanceEntryWithValue;
          if (inpEntry.processingStart && inpEntry.startTime) {
            const inp = inpEntry.processingStart - inpEntry.startTime;
            maxINP = Math.max(maxINP, inp);
            reportMetric('inp', maxINP);
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['event'] });
      } catch (e) {
        console.warn('[CWV] INP not supported');
      }
    };

    // FCP (First Contentful Paint) monitoring
    const observeFCP = () => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fcpEntry = entry as PerformanceEntryWithValue;
          if (fcpEntry.startTime) {
            reportMetric('fcp', fcpEntry.startTime);
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['paint'] });
      } catch (e) {
        console.warn('[CWV] FCP not supported');
      }
    };

    // TTFB (Time to First Byte) monitoring
    const observeTTFB = () => {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const navigationEntry = entry as any;
          if (navigationEntry.responseStart && navigationEntry.requestStart) {
            const ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
            reportMetric('ttfb', ttfb);
          }
        }
      });

      try {
        observer.observe({ entryTypes: ['navigation'] });
      } catch (e) {
        console.warn('[CWV] TTFB not supported');
      }
    };

    // Initialize all observers
    observeLCP();
    observeCLS();
    observeFID();
    observeINP();
    observeFCP();
    observeTTFB();

    // Resource hints optimization
    const addResourceHints = () => {
      const hints = [
        // DNS prefetch for external domains
        { rel: 'dns-prefetch', href: '//fonts.googleapis.com' },
        { rel: 'dns-prefetch', href: '//fonts.gstatic.com' },
        { rel: 'dns-prefetch', href: '//cdn.vercel.com' },

        // Preconnect for critical resources
        { rel: 'preconnect', href: '//fonts.googleapis.com', crossorigin: true },
        { rel: 'preconnect', href: '//fonts.gstatic.com', crossorigin: true },

        // Preload critical resources
        { rel: 'preload', href: '/fonts/main.woff2', as: 'font', type: 'font/woff2', crossorigin: true },
        { rel: 'preload', href: '/images/logo.svg', as: 'image', type: 'image/svg+xml' },
      ];

      hints.forEach(hint => {
        const link = document.createElement('link');
        Object.assign(link, hint);
        document.head.appendChild(link);
      });
    };

    // Add resource hints after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', addResourceHints);
    } else {
      addResourceHints();
    }

    // Cleanup
    return () => {
      // Observers will be garbage collected automatically
    };
  }, [reportMetric]);

  // This component doesn't render anything
  return null;
}

// Hook for manual performance tracking
export function usePerformanceTracking() {
  const trackPerformance = useCallback((metric: string, value: number) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'update-performance',
        data: { metric, value }
      });
    }

    // Also send to analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_metric', {
        event_category: 'Performance',
        event_label: metric,
        value: Math.round(value)
      });
    }
  }, []);

  return { trackPerformance };
}

// Utility function to get performance budget status
export function getPerformanceBudgetStatus(metrics: Partial<CWVMetrics>) {
  const budgets = {
    lcp: { good: 2500, poor: 4000 },
    cls: { good: 0.1, poor: 0.25 },
    inp: { good: 200, poor: 500 },
    fid: { good: 100, poor: 300 },
  };

  const status = {
    lcp: metrics.lcp ? (metrics.lcp <= budgets.lcp.good ? 'good' : metrics.lcp <= budgets.lcp.poor ? 'needs-improvement' : 'poor') : 'unknown',
    cls: metrics.cls !== undefined ? (metrics.cls <= budgets.cls.good ? 'good' : metrics.cls <= budgets.cls.poor ? 'needs-improvement' : 'poor') : 'unknown',
    inp: metrics.inp ? (metrics.inp <= budgets.inp.good ? 'good' : metrics.inp <= budgets.inp.poor ? 'needs-improvement' : 'poor') : 'unknown',
    fid: metrics.fid ? (metrics.fid <= budgets.fid.good ? 'good' : metrics.fid <= budgets.fid.poor ? 'needs-improvement' : 'poor') : 'unknown',
  };

  return status;
}
