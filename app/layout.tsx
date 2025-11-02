// Design system globals - essential for Tailwind and theme system
import "../styles/globals.css";
// import { getThemeClasses } from "../lib/theme/theme-utils"
// import { getCriticalThemeCSS } from "../lib/theme/critical-css"
// import "../lib/accessibility/accessibility.css"

import React from "react";

import { headers } from "next/headers";

// Client component for lazy loading initialization
function LazyLoadingInitializer() {
  React.useEffect(() => {
    // Client-side lazy loading policy initialization
    const initializeLazyLoadingPolicies = async () => {
      try {
        // Policies initialization removed - not available in current implementation
        console.log("[LazyLoading] Policies initialized successfully");
      } catch (error) {
        console.warn("[LazyLoading] Failed to initialize policies:", error);
      }
    };

    initializeLazyLoadingPolicies();
  }, []);

  return null; // This component doesn't render anything
}

// Get CSP nonce from headers for secure script injection
async function getCSPNonce(): Promise<string | null> {
  try {
    const headersList = await headers();
    return headersList.get("x-nonce") || null;
  } catch (error) {
    // Fallback in case headers are not available
    console.warn("[Layout] Could not retrieve CSP nonce from headers:", error);
    return null;
  }
}
import { ThemeProvider } from "../lib/theme/theme-context";
import { NotificationProvider } from "../lib/notifications";
import { ErrorBoundary } from "../lib/utils/error-boundary";
import { PersonalizationProvider } from "../lib/personalization/personalization-context";
import { PlausibleProvider } from "../lib/analytics";
import { GlobalErrorBoundary } from "../lib/global-error-boundary";
import {
  AccessibilityProvider,
  SkipLinks,
} from "../lib/accessibility/accessibility-manager";
import {
  inter,
  interTight,
  FontPreloader,
} from "../lib/performance/font-optimization";
// Environment and Feature Flags (Fase 3)
import {
  getEnvironmentManager,
  isFeatureEnabled,
  FeatureFlag,
} from "../lib/environment/environment-manager";
import {
  EnvironmentProvider,
  DevelopmentOnly,
} from "../lib/environment/environment-provider";
import { DebugOverlay } from "../lib/dev-tools/visual-debugger";

// Performance Monitor Initialization Component - DISABLED temporarily due to SSR issues
// function PerformanceMonitorInitializer() {
//   "use client"

//   // Initialize Core Web Vitals tracking on client side only
//   React.useEffect(() => {
//     useCoreWebVitalsTracking()
//   }, [])

//   return null
// }
import { ServiceWorkerRegistration } from "../lib/sw/service-worker-registration";
import { JsonLd, WebsiteSchema } from "../lib/seo/json-ld";
// import PreloadHints from "../lib/performance/preload-manager"; // TODO: Implementar quando necessário
import { PWAProvider } from "../lib/pwa/service-worker-manager";
import { TenantProvider } from "../lib/multi-tenancy/tenant-context";
import { CookieConsentManager } from "../components/cookie-banner";

// Get text direction based on locale
async function getLocaleDirection(lang: string): Promise<"ltr" | "rtl"> {
  // RTL languages
  const rtlLocales = ["ar", "he", "fa", "ur", "yi", "ji"];
  const localePrefix = lang.split("-")[0].toLowerCase();

  return rtlLocales.includes(localePrefix) ? "rtl" : "ltr";
}

// Client component wrapper for debug overlays with feature flag control
function DebugOverlayWrapper() {
  // Only render if feature flag is enabled
  if (!isFeatureEnabled(FeatureFlag.DEBUG_OVERLAYS)) return null;

  return <DebugOverlay />;
}

// Client component wrapper for service worker with feature flag control
function ServiceWorkerWrapper() {
  // Only render if feature flag is enabled (typically production only)
  if (!isFeatureEnabled(FeatureFlag.CDN_OPTIMIZATION)) return null;

  return <ServiceWorkerRegistration />;
}

// Design system tokens imported via globals.css

// Import all theme packs for dynamic loading
// IMPORTANTE: tech-blueprint deve ser o último para ter prioridade máxima
import "../styles/theme-liquid-glass.css";
import "../styles/theme-neo-brutal.css";
import "../styles/theme-cyber-neon.css";
import "../styles/theme-editorial-serif.css";
import "../styles/theme-bento-grid.css";
import "../styles/theme-soft-ui.css";
import "../styles/theme-mono-luxe.css";
import "../styles/theme-retro-pixel.css";
import "../styles/theme-nature-organic.css";
// TECH-BLUEPRINT deve ser o último para sobrescrever todos os outros
import "../styles/theme-tech-blueprint.css";

const defaultTheme = {
  mode: "system" as const,
  colorScheme: "default" as const,
};

async function getLayoutData() {
  const h = await headers();
  const theme = h.get("x-theme") || "liquid-glass";
  // Always use pt-BR for Brazilian Portuguese
  const lang = "pt-BR";
  return { theme, lang };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // [HIPÓTESE 4] Logs extensivos para contexto do React e providers
  console.log("[Layout] RootLayout called", {
    isServer: typeof window === "undefined",
    hasWindow: typeof window !== "undefined",
    hasDocument: typeof document !== "undefined",
    React: typeof React,
    ReactVersion: React?.version,
    timestamp: Date.now(),
    providers: {
      ThemeProvider: typeof ThemeProvider,
      NotificationProvider: typeof NotificationProvider,
      ErrorBoundary: typeof ErrorBoundary,
      PersonalizationProvider: typeof PersonalizationProvider,
      PlausibleProvider: typeof PlausibleProvider,
      GlobalErrorBoundary: typeof GlobalErrorBoundary,
      AccessibilityProvider: typeof AccessibilityProvider,
      EnvironmentProvider: typeof EnvironmentProvider,
      PWAProvider: typeof PWAProvider,
      TenantProvider: typeof TenantProvider,
    },
    environment: {
      nodeVersion: process?.version,
      nextVersion: process?.env?.NEXT_RUNTIME,
      isDev: process?.env?.NODE_ENV === "development",
      isProd: process?.env?.NODE_ENV === "production",
    },
  });

  const { theme, lang } = await getLayoutData();
  const isProd = process.env.NODE_ENV === "production";

  // Get CSP nonce for secure script injection (only in production)
  const cspNonce = isProd ? await getCSPNonce() : null;

  // Get direction from personalization engine based on locale
  const direction = await getLocaleDirection(lang);

  const debugStageRaw = process.env.NEXT_PUBLIC_LAYOUT_DEBUG_STAGE;
  const parsed = Number(debugStageRaw);
  const debugStage = Number.isFinite(parsed)
    ? parsed
    : Number.POSITIVE_INFINITY;

  return (
    <html
      lang={lang}
      dir={direction}
      data-theme={theme}
      suppressHydrationWarning
    >
      <head>
        {/* Critical CSS inline to prevent FOUC */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
            /* Critical CSS for above-the-fold content */
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
              background: hsl(var(--background, 0 0% 100%));
              color: hsl(var(--foreground, 222.2 84% 4.9%));
              line-height: 1.5;
              margin: 0;
              padding: 0;
            }

            /* Hero section critical styles */
            .hero {
              background: hsl(var(--primary, 221.2 83.2% 53.3%));
              color: hsl(var(--primary-foreground, 210 40% 98%));
            }

            /* Basic button styles to prevent CLS */
            button, [role="button"] {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              border-radius: 0.375rem;
              font-size: 0.875rem;
              font-weight: 500;
              transition: all 0.2s ease-in-out;
              cursor: pointer;
              border: 1px solid transparent;
              min-height: 44px; /* Touch target */
            }

            /* Hide scrollbar during loading to prevent CLS */
            html[data-loading] {
              overflow: hidden;
            }

            /* Reduced motion support */
            @media (prefers-reduced-motion: reduce) {
              *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
              }
            }
          `,
          }}
        />

        {/* Resource hints for critical assets - fonts handled by next/font */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://www.googletagmanager.com"
          crossOrigin="anonymous"
        />

        {/* Viewport meta tag for mobile responsiveness */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />

        {/* Anti-FOUC Script - Set system preferences before CSS loads */}
        <script
          nonce={isProd ? cspNonce || undefined : undefined}
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                'use strict';

                // CSP Nonce available globally for dynamic script injection (production only)
                ${isProd && cspNonce ? `window.__csp_nonce = '${cspNonce}';` : ""}

                // 1. Ensure data-theme is set (already done by SSR, but double-check)
                if (!document.documentElement.hasAttribute('data-theme')) {
                  document.documentElement.setAttribute('data-theme', '${theme}');
                }

                // 2. Set system preferences (NOT controlled by React - prevents hydration mismatch)
                function updateSystemTheme() {
                  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  document.documentElement.setAttribute('data-system-theme', isDark ? 'dark' : 'light');
                }

                function updateReducedMotion() {
                  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                  document.documentElement.setAttribute('data-reduced-motion', reduced ? 'true' : 'false');
                }

                if (window.matchMedia) {
                  updateSystemTheme();
                  updateReducedMotion();

                  // Listen for changes (but don't update React-controlled attributes)
                  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateSystemTheme);
                  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', updateReducedMotion);
                }

                // 3. Remove loading state after hydration to enable transitions
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', function() {
                    setTimeout(function() {
                      document.documentElement.removeAttribute('data-loading');
                    }, 50);
                  });
                } else {
                  setTimeout(function() {
                    document.documentElement.removeAttribute('data-loading');
                  }, 50);
                }
              })();
            `,
          }}
        />

        {/* Anti-FOUC: Critical tokens inline - DETERMINISTIC CONTENT ONLY */}
        {/* Temporarily commented out due to PostCSS issues */}
        {/* <style
          id="critical-theme-tokens"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: getCriticalThemeCSS(theme)
          }}
        /> */}

        {/* SEO and performance optimizations handled by Next.js Image component */}
        {/* REMOVIDO: CSS inline que pode estar sobrescrevendo variáveis do tema */}
        {/* Structured Data - JSON-LD Schema.org */}
        <WebsiteSchema />
        <JsonLd />
      </head>
      <body className={`--font-inter --font-inter-tight font-sans antialiased`}>
        <EnvironmentProvider>
          <AccessibilityProvider>
            <SkipLinks />
            <FontPreloader />
            {/* <PreloadHints /> - TODO: Implementar preload hints no head */}
            {/* Provider isolation by stage for debugging (dev only via NEXT_PUBLIC_LAYOUT_DEBUG_STAGE) */}
            {debugStage < 1 ? (
              <>{children}</>
            ) : (
              <GlobalErrorBoundary>
                {debugStage < 2 ? (
                  <>{children}</>
                ) : (
                  <ErrorBoundary>
                    {debugStage < 3 ? (
                      <>{children}</>
                    ) : (
                      <PlausibleProvider>
                        {debugStage < 4 ? (
                          <>{children}</>
                        ) : (
                          <PersonalizationProvider>
                            {debugStage < 5 ? (
                              <>{children}</>
                            ) : (
                              <ThemeProvider defaultTheme={defaultTheme}>
                                {debugStage < 6 ? (
                                  <>{children}</>
                                ) : (
                                  <NotificationProvider>
                                    <TenantProvider>
                                      <PWAProvider>
                                        {/* <PerformanceMonitorInitializer /> */}
                                        {children}
                                      </PWAProvider>
                                    </TenantProvider>
                                  </NotificationProvider>
                                )}
                              </ThemeProvider>
                            )}
                          </PersonalizationProvider>
                        )}
                      </PlausibleProvider>
                    )}
                  </ErrorBoundary>
                )}
              </GlobalErrorBoundary>
            )}

            {/* Service Worker Registration - controlado por feature flags */}
            <ServiceWorkerWrapper />

            {/* Lazy Loading Policy Initialization */}
            <LazyLoadingInitializer />

            {/* Debug overlays reabilitados - apenas desenvolvimento */}
            <DebugOverlayWrapper />
          </AccessibilityProvider>
        </EnvironmentProvider>

        {/* GDPR Cookie Consent Manager */}
        <CookieConsentManager />
      </body>
    </html>
  );
}
