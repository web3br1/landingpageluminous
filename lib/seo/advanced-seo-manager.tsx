"use client";

import React, { useEffect } from "react";
import Head from "next/head";
import { NextSeo } from "next-seo";

interface OrganizationSchema {
  "@context": string;
  "@type": string;
  name: string;
  url: string;
  logo: string;
  description: string;
  foundingDate?: string;
  contactPoint?: {
    "@type": string;
    telephone?: string;
    contactType?: string;
    areaServed?: string;
    availableLanguage?: string;
  };
  sameAs?: string[];
}

interface SoftwareApplicationSchema {
  "@context": string;
  "@type": string;
  name: string;
  applicationCategory: string;
  description: string;
  url: string;
  operatingSystem?: string;
  offers?: {
    "@type": string;
    price: string;
    priceCurrency: string;
    availability?: string;
    validFrom?: string;
    priceValidUntil?: string;
  };
  aggregateRating?: {
    "@type": string;
    ratingValue: string;
    ratingCount: string;
    bestRating?: string;
    worstRating?: string;
  };
  screenshot?: string;
  downloadUrl?: string;
}

interface FAQPageSchema {
  "@context": string;
  "@type": string;
  mainEntity: Array<{
    "@type": string;
    name: string;
    acceptedAnswer: {
      "@type": string;
      text: string;
    };
  }>;
}

interface BreadcrumbSchema {
  "@context": string;
  "@type": string;
  itemListElement: Array<{
    "@type": string;
    position: number;
    name: string;
    item: string;
  }>;
}

interface AdvancedSEOMetadata {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  twitterImage?: string;
  structuredData?: Array<OrganizationSchema | SoftwareApplicationSchema | FAQPageSchema | BreadcrumbSchema>;
  jsonLd?: any;
  metaRobots?: string;
  alternateLanguages?: Array<{ hrefLang: string; href: string }>;
  lastModified?: string;
  author?: string;
  publisher?: string;
}

interface AdvancedSEOProps {
  metadata: AdvancedSEOMetadata;
  children?: React.ReactNode;
}

/**
 * Advanced SEO Manager - BLOCO 5
 * Comprehensive SEO optimization with rich snippets and schema.org
 */
export function AdvancedSEO({ metadata, children }: AdvancedSEOProps) {
  useEffect(() => {
    // Add structured data to head
    if (metadata.structuredData && metadata.structuredData.length > 0) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(metadata.structuredData, null, 0);
      script.id = 'advanced-seo-structured-data';

      // Remove existing structured data
      const existing = document.getElementById('advanced-seo-structured-data');
      if (existing) existing.remove();

      document.head.appendChild(script);
    }

    // Add additional meta tags
    if (metadata.keywords) {
      addMetaTag('keywords', metadata.keywords.join(', '));
    }

    if (metadata.lastModified) {
      addMetaTag('last-modified', metadata.lastModified);
    }

    if (metadata.author) {
      addMetaTag('author', metadata.author);
    }

    if (metadata.publisher) {
      addMetaTag('publisher', metadata.publisher);
    }

    return () => {
      // Cleanup
      const script = document.getElementById('advanced-seo-structured-data');
      if (script) script.remove();

      // Remove added meta tags
      removeMetaTag('keywords');
      removeMetaTag('last-modified');
      removeMetaTag('author');
      removeMetaTag('publisher');
    };
  }, [metadata]);

  const addMetaTag = (name: string, content: string) => {
    const existing = document.querySelector(`meta[name="${name}"]`);
    if (existing) {
      (existing as HTMLMetaElement).content = content;
      return;
    }

    const meta = document.createElement('meta');
    meta.name = name;
    meta.content = content;
    document.head.appendChild(meta);
  };

  const removeMetaTag = (name: string) => {
    const meta = document.querySelector(`meta[name="${name}"]`);
    if (meta) meta.remove();
  };

  return (
    <>
      <NextSeo
        title={metadata.title}
        description={metadata.description}
        canonical={metadata.canonical}
        openGraph={{
          type: 'website',
          locale: 'pt_BR',
          url: metadata.canonical,
          title: metadata.title,
          description: metadata.description,
          images: metadata.ogImage ? [{
            url: metadata.ogImage,
            width: 1200,
            height: 630,
            alt: metadata.title,
            type: 'image/png',
          }] : undefined,
          siteName: 'DataFlow Brasil',
        }}
        twitter={{
          handle: '@dataflowbrasil',
          site: '@dataflowbrasil',
          cardType: 'summary_large_image',
          title: metadata.title,
          description: metadata.description,
          images: metadata.twitterImage ? [metadata.twitterImage] : undefined,
        }}
        additionalMetaTags={[
          {
            name: 'viewport',
            content: 'width=device-width, initial-scale=1, maximum-scale=5',
          },
          {
            name: 'format-detection',
            content: 'telephone=no',
          },
          {
            name: 'theme-color',
            content: '#1e40af', // primary blue
          },
          {
            name: 'msapplication-TileColor',
            content: '#1e40af',
          },
          {
            name: 'robots',
            content: metadata.metaRobots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
          },
        ]}
        additionalLinkTags={[
          // Canonical
          ...(metadata.canonical ? [{
            rel: 'canonical',
            href: metadata.canonical,
          }] : []),

          // Alternate languages
          ...(metadata.alternateLanguages || []).map(alt => ({
            rel: 'alternate',
            href: alt.href,
            hrefLang: alt.hrefLang,
          })),

          // Icons
          {
            rel: 'icon',
            href: '/favicon.ico',
            sizes: 'any',
          },
          {
            rel: 'icon',
            href: '/icon.svg',
            type: 'image/svg+xml',
          },
          {
            rel: 'apple-touch-icon',
            href: '/apple-touch-icon.png',
            sizes: '180x180',
          },
          {
            rel: 'manifest',
            href: '/manifest.json',
          },
        ]}
      />

      {/* Additional SEO enhancements */}
      <Head>
        {/* Preload critical resources for SEO */}
        <link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />

        {/* DNS prefetch for external services */}
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />

        {/* Security headers via meta tags (fallback) */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />

        {/* Additional SEO meta tags */}
        <meta name="geo.region" content="BR" />
        <meta name="geo.country" content="Brazil" />
        <meta name="geo.placename" content="São Paulo" />

        {/* Business information */}
        <meta name="ICBM" content="-23.5505,-46.6333" /> {/* São Paulo coordinates */}
        <meta name="DC.title" content={metadata.title} />
        <meta name="DC.description" content={metadata.description} />
        <meta name="DC.subject" content={metadata.keywords?.join(', ') || ''} />
        <meta name="DC.language" content="pt-BR" />
      </Head>

      {children}
    </>
  );
}

/**
 * Organization Schema Helper
 */
export function createOrganizationSchema(overrides: Partial<OrganizationSchema> = {}): OrganizationSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DataFlow Brasil",
    url: "https://dataflowbrasil.com",
    logo: "https://dataflowbrasil.com/images/logo.svg",
    description: "Plataforma de automação de dados para empresas brasileiras",
    foundingDate: "2024-01-01",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+55-11-99999-9999",
      contactType: "customer service",
      areaServed: "BR",
      availableLanguage: "pt-BR",
    },
    sameAs: [
      "https://www.linkedin.com/company/dataflowbrasil",
      "https://twitter.com/dataflowbrasil",
      "https://www.instagram.com/dataflowbrasil"
    ],
    ...overrides,
  };
}

/**
 * Software Application Schema Helper
 */
export function createSoftwareApplicationSchema(overrides: Partial<SoftwareApplicationSchema> = {}): SoftwareApplicationSchema {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "DataFlow Brasil",
    applicationCategory: "BusinessApplication",
    description: "Automatize seus relatórios e dashboards com IA avançada. Reduza tempo de análise em até 80%.",
    url: "https://dataflowbrasil.com",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "BRL",
      availability: "https://schema.org/InStock",
      validFrom: "2024-01-01",
      priceValidUntil: "2024-12-31",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "1250",
      bestRating: "5",
      worstRating: "1",
    },
    screenshot: "https://dataflowbrasil.com/images/screenshot-dashboard.png",
    downloadUrl: "https://dataflowbrasil.com/signup",
    ...overrides,
  };
}

/**
 * FAQ Page Schema Helper
 */
export function createFAQPageSchema(faqs: Array<{ question: string; answer: string }>): FAQPageSchema {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * Breadcrumb Schema Helper
 */
export function createBreadcrumbSchema(breadcrumbs: Array<{ name: string; url: string }>): BreadcrumbSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };
}

/**
 * SEO Performance Tracker
 */
export function useSEOTracker() {
  useEffect(() => {
    // Track SEO-related events
    const trackSEOEvent = (event: string, data?: any) => {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', event, {
          event_category: 'SEO',
          event_label: data?.label || 'general',
          value: data?.value || 1,
          custom_map: data,
        });
      }
    };

    // Track structured data implementation
    trackSEOEvent('structured_data_implemented', {
      label: 'schema_org',
      value: 1,
    });

    // Track meta tags completeness
    trackSEOEvent('meta_tags_complete', {
      label: 'open_graph_twitter',
      value: 1,
    });

    // Monitor search console integration
    if (document.querySelector('meta[name="google-site-verification"]')) {
      trackSEOEvent('search_console_verified', {
        label: 'google_search_console',
        value: 1,
      });
    }
  }, []);
}
