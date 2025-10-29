"use client";

import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { getSSRAdapter } from "../composition/container";
import { logger } from "../observability/logger";
import { metrics } from "../observability/metrics";

/**
 * SEO Optimizer Component
 * Dynamically generates and updates SEO metadata based on page content and experiments
 */

export interface SEOConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "product";
  twitterCard?: "summary" | "summary_large_image" | "app" | "player";
  structuredData?: object[];
  noIndex?: boolean;
  noFollow?: boolean;
  locale?: string;
  alternateLocales?: Array<{ locale: string; url: string }>;
}

interface SEOOptimizerProps {
  config: SEOConfig;
  pageType: string;
  experimentId?: string;
  experimentVariant?: string;
  contentHash?: string;
}

export function SEOOptimizer({
  config,
  pageType,
  experimentId,
  experimentVariant,
  contentHash,
}: SEOOptimizerProps) {
  const router = useRouter();
  const ssrAdapter = getSSRAdapter();
  const [dynamicConfig, setDynamicConfig] = useState<SEOConfig>(config);

  // Update metadata based on experiments and content changes
  useEffect(() => {
    const updateMetadata = () => {
      const updatedConfig = { ...config };

      // Add experiment tracking to title/description
      if (experimentId && experimentVariant) {
        // Subtle tracking for A/B testing without affecting user experience
        updatedConfig.title = config.title;
        // Add tracking pixel or meta tag for experiment tracking
        logger.info("SEO metadata updated for experiment", {
          experimentId,
          experimentVariant,
          pageType,
        });
      }

      // Update canonical URL if needed
      if (!updatedConfig.canonical) {
        updatedConfig.canonical = `${ssrAdapter.isClientContext() ? window.location.origin : ""}${router.asPath}`;
      }

      // Add content hash for cache busting if provided
      if (contentHash) {
        updatedConfig.canonical += `?v=${contentHash.substring(0, 8)}`;
      }

      setDynamicConfig(updatedConfig);

      // Track SEO metrics
      metrics.incrementCounter("seo_metadata_generated_total", 1, {
        page_type: pageType,
        has_experiment: experimentId ? "true" : "false",
      });
    };

    updateMetadata();
  }, [
    config,
    pageType,
    experimentId,
    experimentVariant,
    contentHash,
    router.asPath,
    ssrAdapter,
  ]);

  // Generate structured data
  const generateStructuredData = (): object[] => {
    const structuredData = [];

    // Organization schema
    structuredData.push({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "DataFlow",
      url: ssrAdapter.isClientContext()
        ? window.location.origin
        : "https://dataflow.com",
      logo: `${ssrAdapter.isClientContext() ? window.location.origin : "https://dataflow.com"}/images/logo.png`,
      sameAs: [
        "https://twitter.com/dataflow",
        "https://linkedin.com/company/dataflow",
      ],
    });

    // WebSite schema for search box
    structuredData.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "DataFlow - Automação Empresarial Inteligente",
      url: ssrAdapter.isClientContext()
        ? window.location.origin
        : "https://dataflow.com",
      potentialAction: {
        "@type": "SearchAction",
        target: `${ssrAdapter.isClientContext() ? window.location.origin : "https://dataflow.com"}/search?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    });

    // Add custom structured data from config
    if (dynamicConfig.structuredData) {
      structuredData.push(...dynamicConfig.structuredData);
    }

    return structuredData;
  };

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{dynamicConfig.title}</title>
      <meta name="description" content={dynamicConfig.description} />
      {dynamicConfig.keywords && (
        <meta name="keywords" content={dynamicConfig.keywords.join(", ")} />
      )}

      {/* Canonical URL */}
      {dynamicConfig.canonical && (
        <link rel="canonical" href={dynamicConfig.canonical} />
      )}

      {/* Robots */}
      {dynamicConfig.noIndex && <meta name="robots" content="noindex" />}
      {dynamicConfig.noFollow && <meta name="robots" content="nofollow" />}
      {dynamicConfig.noIndex && dynamicConfig.noFollow && (
        <meta name="robots" content="noindex, nofollow" />
      )}

      {/* Open Graph */}
      <meta property="og:title" content={dynamicConfig.title} />
      <meta property="og:description" content={dynamicConfig.description} />
      <meta property="og:type" content={dynamicConfig.ogType || "website"} />
      <meta property="og:url" content={dynamicConfig.canonical} />
      {dynamicConfig.ogImage && (
        <meta property="og:image" content={dynamicConfig.ogImage} />
      )}
      <meta property="og:site_name" content="DataFlow" />
      {dynamicConfig.locale && (
        <meta property="og:locale" content={dynamicConfig.locale} />
      )}

      {/* Twitter Card */}
      <meta
        name="twitter:card"
        content={dynamicConfig.twitterCard || "summary_large_image"}
      />
      <meta name="twitter:title" content={dynamicConfig.title} />
      <meta name="twitter:description" content={dynamicConfig.description} />
      {dynamicConfig.ogImage && (
        <meta name="twitter:image" content={dynamicConfig.ogImage} />
      )}

      {/* Alternate Languages */}
      {dynamicConfig.alternateLocales?.map((alt) => (
        <link
          key={alt.locale}
          rel="alternate"
          hrefLang={alt.locale}
          href={alt.url}
        />
      ))}

      {/* Structured Data */}
      {generateStructuredData().map((data, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(data),
          }}
        />
      ))}

      {/* Preload critical resources */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
        crossOrigin=""
      />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />

      {/* Theme color for mobile browsers */}
      <meta name="theme-color" content="#0066cc" />
      <meta name="msapplication-TileColor" content="#0066cc" />
    </Head>
  );
}

// ===== SEO CONTENT ANALYZER =====

export class SEOContentAnalyzer {
  /**
   * Analyze content for SEO optimization opportunities
   */
  static analyzeContent(content: string): {
    wordCount: number;
    keywordDensity: Record<string, number>;
    readabilityScore: number;
    suggestions: string[];
  } {
    const words = content
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 0);
    const wordCount = words.length;

    // Simple keyword density analysis
    const keywordDensity: Record<string, number> = {};
    words.forEach((word) => {
      if (word.length > 3) {
        // Only consider meaningful words
        keywordDensity[word] = (keywordDensity[word] || 0) + 1;
      }
    });

    // Normalize density
    Object.keys(keywordDensity).forEach((key) => {
      keywordDensity[key] = (keywordDensity[key] / wordCount) * 100;
    });

    // Simple readability score (Flesch Reading Ease approximation)
    const sentences = content.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / sentences;
    const readabilityScore =
      206.835 - 1.015 * avgWordsPerSentence - 84.6 * (words.length / wordCount);

    // Generate suggestions
    const suggestions: string[] = [];

    if (wordCount < 300) {
      suggestions.push(
        "Conteúdo muito curto. Considere adicionar mais informações.",
      );
    }

    if (readabilityScore < 60) {
      suggestions.push(
        "Texto pode ser difícil de ler. Considere simplificar a linguagem.",
      );
    }

    const highDensityKeywords = Object.entries(keywordDensity)
      .filter(([, density]) => density > 5)
      .map(([keyword]) => keyword);

    if (highDensityKeywords.length > 3) {
      suggestions.push(
        `Possível keyword stuffing detectado: ${highDensityKeywords.slice(0, 3).join(", ")}`,
      );
    }

    return {
      wordCount,
      keywordDensity,
      readabilityScore,
      suggestions,
    };
  }

  /**
   * Generate SEO-optimized title
   */
  static generateTitle(
    baseTitle: string,
    keywords: string[],
    maxLength = 60,
  ): string {
    let title = baseTitle;

    // Add primary keyword if not present
    if (
      keywords.length > 0 &&
      !title.toLowerCase().includes(keywords[0].toLowerCase())
    ) {
      title = `${keywords[0]} - ${title}`;
    }

    // Ensure title is within length limits
    if (title.length > maxLength) {
      title = title.substring(0, maxLength - 3) + "...";
    }

    return title;
  }

  /**
   * Generate SEO-optimized description
   */
  static generateDescription(
    content: string,
    keywords: string[],
    maxLength = 160,
  ): string {
    // Extract first meaningful paragraph
    const paragraphs = content
      .split("\n\n")
      .filter((p) => p.trim().length > 50);
    let description = paragraphs[0] || content.substring(0, maxLength);

    // Ensure primary keyword is included
    if (
      keywords.length > 0 &&
      !description.toLowerCase().includes(keywords[0].toLowerCase())
    ) {
      description = `${keywords[0]}. ${description}`;
    }

    // Trim to max length
    if (description.length > maxLength) {
      description = description.substring(0, maxLength - 3) + "...";
    }

    return description;
  }
}

// ===== POSITION-BASED LAZY LOADING =====

interface LazyLoadConfig {
  rootMargin?: string;
  threshold?: number;
  priority?: "high" | "low" | "auto";
}

export function usePositionBasedLazyLoading(
  elementRef: React.RefObject<Element>,
  config: LazyLoadConfig = {},
) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAboveFold, setIsAboveFold] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Check if element is in viewport on mount (for SSR)
    const rect = element.getBoundingClientRect();
    const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
    const isElementAboveFold = rect.top < window.innerHeight * 0.5;

    setIsVisible(isInViewport);
    setIsAboveFold(isElementAboveFold);

    // Skip intersection observer for above-the-fold content
    if (isElementAboveFold) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);

            // Track lazy loading performance
            metrics.recordHistogram(
              "lazy_load_delay_seconds",
              (Date.now() - performance.now()) / 1000,
              {
                element_type: element.tagName.toLowerCase(),
                priority: config.priority || "auto",
              },
            );
          }
        });
      },
      {
        rootMargin: config.rootMargin || "50px",
        threshold: config.threshold || 0.1,
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [elementRef, config]);

  return { isVisible, isAboveFold };
}

// ===== CONVERSION OPTIMIZATION =====

export class ConversionOptimizer {
  /**
   * Track conversion events with enhanced analytics
   */
  static trackConversion(
    eventType: string,
    value?: number,
    metadata?: Record<string, any>,
  ): void {
    // Track in multiple analytics systems
    metrics.incrementCounter("conversions_total", 1, {
      event_type: eventType,
      value: value?.toString() || "0",
    });

    logger.info("Conversion event tracked", {
      eventType,
      value,
      metadata,
      timestamp: Date.now(),
    });

    // In a real implementation, this would send to Google Analytics, Facebook Pixel, etc.
    if (typeof window !== "undefined") {
      // Google Analytics 4
      if ((window as any).gtag) {
        (window as any).gtag("event", eventType, {
          value,
          ...metadata,
        });
      }

      // Facebook Pixel
      if ((window as any).fbq) {
        (window as any).fbq("track", "Lead", {
          value,
          ...metadata,
        });
      }
    }
  }

  /**
   * Optimize CTA placement based on scroll depth and user behavior
   */
  static optimizeCTAPlacement(scrollDepth: number): {
    showStickyCTA: boolean;
    showExitIntent: boolean;
    highlightCTA: boolean;
  } {
    const optimizations = {
      showStickyCTA: false,
      showExitIntent: false,
      highlightCTA: false,
    };

    // Show sticky CTA after 25% scroll
    if (scrollDepth > 25) {
      optimizations.showStickyCTA = true;
    }

    // Show exit intent popup after 50% scroll
    if (scrollDepth > 50) {
      optimizations.showExitIntent = true;
    }

    // Highlight CTA after 75% scroll (desperation mode)
    if (scrollDepth > 75) {
      optimizations.highlightCTA = true;
    }

    return optimizations;
  }

  /**
   * A/B test different CTA copy and styling
   */
  static generateCTAVariant(variant: string): {
    text: string;
    style: string;
    urgencyLevel: "low" | "medium" | "high";
  } {
    const variants = {
      control: {
        text: "Começar Grátis",
        style: "bg-primary text-white",
        urgencyLevel: "low" as const,
      },
      urgency: {
        text: "Começar Agora - Oferta Limitada!",
        style: "bg-red-600 text-white animate-pulse",
        urgencyLevel: "high" as const,
      },
      benefit: {
        text: "Transforme seus Dados Hoje",
        style: "bg-green-600 text-white",
        urgencyLevel: "medium" as const,
      },
      social_proof: {
        text: "Junte-se a 10.000+ Empresas",
        style: "bg-blue-600 text-white",
        urgencyLevel: "medium" as const,
      },
    };

    return variants[variant as keyof typeof variants] || variants.control;
  }
}

// ===== PERFORMANCE OPTIMIZATION =====

export function useCoreWebVitalsTracking() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Track Core Web Vitals
    const reportWebVitals = (metric: any) => {
      const { name, value, id } = metric;

      metrics.recordHistogram(`web_vitals_${name.toLowerCase()}`, value, {
        metric_id: id,
      });

      logger.info(`Web Vital recorded: ${name}`, {
        value,
        id,
      });
    };

    // Import web-vitals library dynamically
    import("web-vitals")
      .then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
        onCLS(reportWebVitals);
        onINP(reportWebVitals);
        onFCP(reportWebVitals);
        onLCP(reportWebVitals);
        onTTFB(reportWebVitals);
      })
      .catch((error) => {
        logger.warn("Failed to load web-vitals library", {
          error: error.message,
        });
      });
  }, []);
}

// ===== DYNAMIC META TAGS HOOK =====

export function useDynamicMetaTags(
  baseConfig: SEOConfig,
  contentUpdates: Record<string, any> = {},
) {
  const [metaConfig, setMetaConfig] = useState<SEOConfig>(baseConfig);

  useEffect(() => {
    // Update meta tags based on content changes
    const updatedConfig = { ...baseConfig };

    // Analyze content for SEO improvements
    if (contentUpdates.title) {
      const analysis = SEOContentAnalyzer.analyzeContent(contentUpdates.title);
      updatedConfig.title = SEOContentAnalyzer.generateTitle(
        contentUpdates.title,
        contentUpdates.keywords || [],
      );
    }

    if (contentUpdates.description) {
      updatedConfig.description = SEOContentAnalyzer.generateDescription(
        contentUpdates.description,
        contentUpdates.keywords || [],
      );
    }

    setMetaConfig(updatedConfig);

    // Track SEO updates
    metrics.incrementCounter("seo_dynamic_updates_total", 1, {
      has_title_update: contentUpdates.title ? "true" : "false",
      has_description_update: contentUpdates.description ? "true" : "false",
    });
  }, [baseConfig, contentUpdates]);

  return metaConfig;
}
