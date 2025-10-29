import React from "react";
import Script from "next/script";
import {
  ResourcePreloader,
  PerformanceResourceHints,
} from "./resource-preloader";

// Critical Performance Optimizations Component
// Implements preloading, prefetching and critical resource hints

interface CriticalOptimizationProps {
  children: React.ReactNode;
}

// Preload critical fonts
const CriticalFonts = () => (
  <>
    {/* Preconnect to external domains */}
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link
      rel="preconnect"
      href="https://fonts.gstatic.com"
      crossOrigin="anonymous"
    />

    {/* Preload critical fonts with font-display: swap */}
    <link
      rel="preload"
      href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
      as="style"
      onLoad={(e) => {
        const target = e.target as HTMLLinkElement;
        target.rel = "stylesheet";
      }}
    />
    <noscript>
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
      />
    </noscript>
  </>
);

// Preload critical resources
const ResourceHints = () => (
  <>
    {/* DNS prefetch for external resources */}
    <link rel="dns-prefetch" href="//fonts.googleapis.com" />
    <link rel="dns-prefetch" href="//fonts.gstatic.com" />

    {/* Preload critical CSS */}
    <link
      rel="preload"
      href="/_next/static/css/app/(marketing)/layout.css"
      as="style"
      onLoad={(e) => {
        const target = e.target as HTMLLinkElement;
        target.rel = "stylesheet";
      }}
    />

    {/* Preload critical JavaScript chunks */}
    <link rel="modulepreload" href="/_next/static/chunks/webpack.js" />
    <link rel="modulepreload" href="/_next/static/chunks/main.js" />
  </>
);

// Critical CSS for above-the-fold content
const CriticalCSS = () => (
  <style
    dangerouslySetInnerHTML={{
      __html: `
      /* Critical CSS for LCP optimization */
      .hero-section {
        min-height: 100vh;
        display: flex;
        align-items: center;
      }

      .hero-headline {
        font-size: clamp(2.5rem, 5vw, 4rem);
        font-weight: 700;
        line-height: 1.1;
        margin-bottom: 1rem;
      }

      .hero-subheadline {
        font-size: clamp(1.125rem, 2.5vw, 1.25rem);
        line-height: 1.6;
        color: hsl(var(--muted-foreground));
        max-width: 40rem;
      }

      .hero-cta {
        display: inline-flex;
        align-items: center;
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
        font-weight: 600;
        border-radius: 0.75rem;
        background-color: hsl(var(--primary));
        color: hsl(var(--primary-foreground));
        text-decoration: none;
        transition: all 0.2s ease;
      }

      .hero-cta:hover {
        background-color: hsl(var(--primary) / 0.9);
        transform: translateY(-1px);
      }

      /* Prevent layout shift */
      img {
        max-width: 100%;
        height: auto;
      }

      /* Loading states */
      .loading-skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
      }

      @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }

      /* Reduce motion for accessibility */
      @media (prefers-reduced-motion: reduce) {
        .hero-cta {
          transition: none;
        }
        .hero-cta:hover {
          transform: none;
        }
      }
    `,
    }}
  />
);

// Web Vitals monitoring script
const WebVitalsScript = () => (
  <Script
    id="web-vitals"
    strategy="afterInteractive"
    dangerouslySetInnerHTML={{
      __html: `
        // Web Vitals monitoring
        import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
          function sendToAnalytics({ name, delta, value, id }) {
            // Send to analytics service
            if (typeof window !== 'undefined' && window.gtag) {
              window.gtag('event', name, {
                event_category: 'Web Vitals',
                event_label: id,
                value: Math.round(name === 'CLS' ? value * 1000 : value),
                custom_map: { metric_value: value }
              });
            }

            // Log for debugging
            console.log(\`\${name}: \${value} (\${delta})\`);
          }

          getCLS(sendToAnalytics);
          getFID(sendToAnalytics);
          getFCP(sendToAnalytics);
          getLCP(sendToAnalytics);
          getTTFB(sendToAnalytics);
        }).catch(err => {
          console.warn('Failed to load web-vitals:', err);
        });
      `,
    }}
  />
);

// Legacy resource hints for performance
const LegacyPerformanceResourceHints = () => (
  <>
    {/* Preload hero section assets */}
    <link
      rel="preload"
      href="/images/hero-bg.webp"
      as="image"
      type="image/webp"
    />
    <link
      rel="preload"
      href="/images/hero-mockup.png"
      as="image"
      type="image/png"
    />

    {/* Prefetch likely next pages */}
    <link rel="prefetch" href="/features" />
    <link rel="prefetch" href="/pricing" />
    <link rel="prefetch" href="/demo" />
  </>
);

export function CriticalOptimization({ children }: CriticalOptimizationProps) {
  return (
    <>
      {/* Critical CSS - blocks rendering until loaded */}
      <CriticalCSS />

      {/* Performance resource hints */}
      <PerformanceResourceHints />

      {/* Web Vitals monitoring */}
      <WebVitalsScript />

      {/* Resource preloader for critical images */}
      <ResourcePreloader>{null}</ResourcePreloader>

      {/* Main content */}
      {children}
    </>
  );
}

// Utility function to preload critical components
export function preloadCriticalComponents() {
  // Preload critical components for better LCP
  // Note: React.preload is not available, using dynamic imports instead
  import("@/components/sections/hero/hero");
  import("@/components/sections/benefits/benefits");
}
