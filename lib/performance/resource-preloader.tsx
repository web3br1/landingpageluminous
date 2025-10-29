import React, { useEffect } from "react";
import { ImageCache, criticalImages } from "./image-optimization";
import { cacheManager } from "./cache-manager";

// Resource preloader for critical assets
interface ResourcePreloaderProps {
  children: React.ReactNode;
  preloadImages?: string[];
  preloadFonts?: string[];
  preloadScripts?: string[];
}

export function ResourcePreloader({
  children,
  preloadImages = criticalImages,
  preloadFonts = [],
  preloadScripts = [],
}: ResourcePreloaderProps) {
  useEffect(() => {
    // Preload critical images using cache manager
    if (preloadImages.length > 0) {
      const imagePromises = preloadImages.map((url) =>
        cacheManager.preloadResource({
          url,
          type: "image",
          priority: "critical",
        }),
      );

      Promise.allSettled(imagePromises).then((results) => {
        const failed = results.filter((r) => r.status === "rejected").length;
        if (failed > 0) {
          console.warn(`Failed to preload ${failed} images`);
        }
      });
    }

    // Preload fonts using cache manager
    preloadFonts.forEach((fontUrl) => {
      cacheManager
        .preloadResource({
          url: fontUrl,
          type: "font",
          priority: "high",
        })
        .catch((error) => {
          console.warn("Failed to preload font:", fontUrl, error);
        });
    });

    // Preload scripts using cache manager
    preloadScripts.forEach((scriptUrl) => {
      cacheManager
        .preloadResource({
          url: scriptUrl,
          type: "script",
          priority: "medium",
        })
        .catch((error) => {
          console.warn("Failed to preload script:", scriptUrl, error);
        });
    });

    // Log cache stats for debugging
    const logStats = () => {
      const stats = cacheManager.getCacheStats();
      console.log("Cache stats:", stats);
    };

    // Log stats after a delay to see preloaded resources
    const timer = setTimeout(logStats, 2000);

    return () => clearTimeout(timer);
  }, [preloadImages, preloadFonts, preloadScripts]);

  return <>{children}</>;
}

// Advanced resource hints component
interface ResourceHintsProps {
  dnsPrefetch?: string[];
  preconnect?: string[];
  preload?: Array<{
    href: string;
    as:
      | "audio"
      | "document"
      | "embed"
      | "fetch"
      | "font"
      | "image"
      | "object"
      | "script"
      | "style"
      | "track"
      | "video"
      | "worker";
    type?: string;
    crossOrigin?: "anonymous" | "use-credentials";
    media?: string;
  }>;
  prefetch?: string[];
}

export function ResourceHints({
  dnsPrefetch = [],
  preconnect = [],
  preload = [],
  prefetch = [],
}: ResourceHintsProps) {
  return (
    <>
      {/* DNS prefetch */}
      {dnsPrefetch.map((domain) => (
        <link key={`dns-${domain}`} rel="dns-prefetch" href={`//${domain}`} />
      ))}

      {/* Preconnect */}
      {preconnect.map((domain) => (
        <link
          key={`preconnect-${domain}`}
          rel="preconnect"
          href={`//${domain}`}
          crossOrigin="anonymous"
        />
      ))}

      {/* Preload */}
      {preload.map((resource, index) => (
        <link
          key={`preload-${index}`}
          rel="preload"
          href={resource.href}
          as={resource.as}
          type={resource.type}
          crossOrigin={resource.crossOrigin}
          media={resource.media}
        />
      ))}

      {/* Prefetch */}
      {prefetch.map((url) => (
        <link key={`prefetch-${url}`} rel="prefetch" href={url} />
      ))}
    </>
  );
}

// Critical resource hints for landing page
export const criticalResourceHints = {
  dnsPrefetch: [
    "fonts.googleapis.com",
    "fonts.gstatic.com",
    "cdn.vercel.com",
    "images.unsplash.com",
  ],
  preconnect: ["fonts.googleapis.com", "fonts.gstatic.com"],
  preload: [
    {
      href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
      as: "style" as const,
    },
    {
      href: "/images/hero-bg.webp",
      as: "image" as const,
      type: "image/webp",
    },
    {
      href: "/images/logo.svg",
      as: "image" as const,
      type: "image/svg+xml",
    },
  ],
  prefetch: ["/features", "/pricing", "/demo", "/api/health"],
};

// Service worker cache strategy hints
export function CacheStrategyHints() {
  useEffect(() => {
    // Add cache hints for service worker
    const meta = document.createElement("meta");
    meta.name = "cache-strategy";
    meta.content = "network-first";
    document.head.appendChild(meta);

    return () => {
      const existing = document.querySelector('meta[name="cache-strategy"]');
      if (existing) {
        existing.remove();
      }
    };
  }, []);

  return null;
}

// Font loading optimization with resource hints
export function FontResourceHints() {
  return (
    <>
      {/* Font preconnect */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />

      {/* Font preload with resource hints */}
      <link
        rel="preload"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
        as="style"
        onLoad={(e) => {
          const target = e.target as HTMLLinkElement;
          target.rel = "stylesheet";
        }}
      />

      {/* Fallback for non-JS */}
      <noscript>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
        />
      </noscript>
    </>
  );
}

// Image CDN optimization hints
export function ImageOptimizationHints() {
  return (
    <>
      {/* Image CDN preconnect */}
      <link rel="preconnect" href="https://cdn.vercel.com" />
      <link rel="preconnect" href="https://images.unsplash.com" />

      {/* Image format hints */}
      <meta name="image-formats" content="webp,avif" />
      <meta name="image-optimization" content="enabled" />
    </>
  );
}

// Combined optimization component
export function PerformanceResourceHints() {
  return (
    <>
      <ResourceHints {...criticalResourceHints} />
      <FontResourceHints />
      <ImageOptimizationHints />
      <CacheStrategyHints />
    </>
  );
}
