/**
 * Dynamic Metadata Generator
 * Creates SEO-optimized metadata based on page content and experiments
 */

import React from "react";
import { Metadata } from "next";
import { SEOOptimizer } from "./seo-optimizer";
import { SEOContentAnalyzerServer } from "./seo-content-analyzer.server";
import { generatePageSchemas } from "./rich-snippets";
import type { SEOConfig } from "./seo-optimizer";

export interface PageMetadata {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
  structuredData?: object[];
  experimentId?: string;
  experimentVariant?: string;
  contentHash?: string;
}

export class DynamicMetadataGenerator {
  /**
   * Generate comprehensive metadata for a page
   */
  static generateMetadata(metadata: PageMetadata): Metadata {
    const config: SEOConfig = {
      title: metadata.title,
      description: metadata.description,
      keywords: metadata.keywords,
      canonical: metadata.canonical,
      ogImage: metadata.ogImage,
      structuredData: metadata.structuredData,
    };

    // Analyze content for SEO optimization
    const titleAnalysis = SEOContentAnalyzerServer.analyzeContent(
      metadata.title,
    );
    const descriptionAnalysis = SEOContentAnalyzerServer.analyzeContent(
      metadata.description,
    );

    // Optimize title if needed
    if (titleAnalysis.wordCount < 5) {
      config.title = SEOContentAnalyzerServer.generateTitle(
        metadata.title,
        metadata.keywords || [],
        60,
      );
    }

    // Optimize description if needed
    if (descriptionAnalysis.wordCount < 20) {
      config.description = SEOContentAnalyzerServer.generateDescription(
        metadata.description,
        metadata.keywords || [],
        160,
      );
    }

    // Generate Open Graph image if not provided
    if (!config.ogImage) {
      config.ogImage = this.generateOGImageURL(
        metadata.title,
        metadata.experimentVariant,
      );
    }

    // Add experiment tracking
    if (metadata.experimentId && metadata.experimentVariant) {
      // Add subtle tracking parameters
      config.canonical = metadata.canonical
        ? `${metadata.canonical}?exp=${metadata.experimentId}_${metadata.experimentVariant}`
        : undefined;
    }

    return {
      title: config.title,
      description: config.description,
      keywords: config.keywords?.join(", "),
      authors: [{ name: "DataFlow Team" }],
      creator: "DataFlow",
      publisher: "DataFlow",
      formatDetection: {
        email: false,
        address: false,
        telephone: false,
      },
      metadataBase: new URL(
        process.env.NEXT_PUBLIC_APP_URL || "https://dataflow.com",
      ),
      alternates: {
        canonical: config.canonical,
      },
      openGraph: {
        title: config.title,
        description: config.description,
        url: config.canonical,
        siteName: "DataFlow",
        images: config.ogImage
          ? [
              {
                url: config.ogImage,
                width: 1200,
                height: 630,
                alt: `${metadata.title} - DataFlow`,
              },
            ]
          : undefined,
        locale: "pt_BR",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: config.title,
        description: config.description,
        images: config.ogImage ? [config.ogImage] : undefined,
        creator: "@dataflow",
      },
      robots: {
        index: true,
        follow: true,
        nocache: false,
        googleBot: {
          index: true,
          follow: true,
          noimageindex: false,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },
      // Add structured data as JSON-LD
      other: config.structuredData
        ? {
            "script:ld+json": JSON.stringify(config.structuredData),
          }
        : undefined,
    };
  }

  /**
   * Generate OG image URL dynamically
   */
  private static generateOGImageURL(
    title: string,
    experimentVariant?: string,
  ): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dataflow.com";
    const encodedTitle = encodeURIComponent(title.substring(0, 100));
    const variant = experimentVariant ? `&variant=${experimentVariant}` : "";

    return `${baseUrl}/api/og?title=${encodedTitle}${variant}`;
  }

  /**
   * Generate metadata for landing pages
   */
  static generateLandingPageMetadata(
    experimentId?: string,
    experimentVariant?: string,
  ): Metadata {
    const baseTitle =
      experimentVariant === "urgency"
        ? "Automatize seus Processos - Oferta Limitada!"
        : experimentVariant === "benefit"
          ? "Transforme Dados em Decisões Inteligentes"
          : experimentVariant === "social_proof"
            ? "Junte-se a 10.000+ Empresas - DataFlow"
            : "Seu Copiloto de Automação Empresarial";

    const baseDescription =
      experimentVariant === "urgency"
        ? "Conecte, orquestre e acelere seus fluxos. IA avançada para automatização empresarial. Oferta por tempo limitado!"
        : experimentVariant === "benefit"
          ? "Da entrevista ao sistema operacional em minutos. Transforme dados em decisões através de linguagem natural e integrações perfeitas."
          : experimentVariant === "social_proof"
            ? "Mais de 10.000 empresas confiam na DataFlow para automatizar seus processos. Junte-se à revolução da automação inteligente."
            : "Conecte, orquestre e acelere seus fluxos — sem fricção. Nossa IA entende seu negócio e gera sistemas sob medida automaticamente.";

    return this.generateMetadata({
      title: baseTitle,
      description: baseDescription,
      keywords: [
        "automação empresarial",
        "IA",
        "inteligência artificial",
        "processos empresariais",
        "automação de workflows",
        "análise de dados",
        "transformação digital",
        "eficiência operacional",
      ],
      experimentId,
      experimentVariant,
      structuredData: generatePageSchemas("landing", {
        experimentId,
        experimentVariant,
        title: baseTitle,
        description: baseDescription,
      }),
    });
  }

  /**
   * Generate metadata for product pages
   */
  static generateProductPageMetadata(
    productName: string,
    productDescription: string,
    price?: number,
    currency = "BRL",
  ): Metadata {
    return this.generateMetadata({
      title: `${productName} - DataFlow`,
      description: productDescription,
      keywords: [
        productName.toLowerCase(),
        "plataforma",
        "automação",
        "inteligência artificial",
        "business intelligence",
      ],
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "Product",
          name: productName,
          description: productDescription,
          brand: {
            "@type": "Brand",
            name: "DataFlow",
          },
          offers: price
            ? {
                "@type": "Offer",
                price: price.toString(),
                priceCurrency: currency,
                availability: "https://schema.org/InStock",
              }
            : undefined,
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.7",
            ratingCount: "856",
          },
        },
      ],
    });
  }

  /**
   * Generate metadata for blog/article pages
   */
  static generateArticleMetadata(
    title: string,
    description: string,
    author: string,
    publishedTime: string,
    modifiedTime?: string,
    tags?: string[],
  ): Metadata {
    return this.generateMetadata({
      title: `${title} - Blog DataFlow`,
      description,
      keywords: tags,
      structuredData: [
        {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: title,
          description,
          author: {
            "@type": "Person",
            name: author,
          },
          publisher: {
            "@type": "Organization",
            name: "DataFlow",
            logo: {
              "@type": "ImageObject",
              url: `${process.env.NEXT_PUBLIC_APP_URL || "https://dataflow.com"}/images/logo.png`,
            },
          },
          datePublished: publishedTime,
          dateModified: modifiedTime || publishedTime,
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": process.env.NEXT_PUBLIC_APP_URL || "https://dataflow.com",
          },
        },
      ],
    });
  }

  /**
   * Update metadata dynamically (client-side)
   */
  static updateClientMetadata(metadata: Partial<SEOConfig>): void {
    if (typeof document === "undefined") return;

    const { title, description } = metadata;

    if (title) {
      document.title = title;
    }

    if (description) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute("content", description);
      }
    }

    // Update Open Graph tags
    if (title) {
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute("content", title);
      }
    }

    if (description) {
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) {
        ogDesc.setAttribute("content", description);
      }
    }
  }
}

// ===== REACT COMPONENT FOR DYNAMIC SEO =====

interface DynamicSEOProps {
  metadata: PageMetadata;
  children?: React.ReactNode;
}

export function DynamicSEO({ metadata, children }: DynamicSEOProps) {
  return (
    <>
      <SEOOptimizer
        config={{
          title: metadata.title,
          description: metadata.description,
          keywords: metadata.keywords,
          canonical: metadata.canonical,
          ogImage: metadata.ogImage,
          structuredData: metadata.structuredData,
        }}
        pageType="dynamic"
        experimentId={metadata.experimentId}
        experimentVariant={metadata.experimentVariant}
        contentHash={metadata.contentHash}
      />
      {children}
    </>
  );
}

// ===== PERFORMANCE TRACKING =====
// Note: Client-side hooks moved to separate file to avoid SSR issues
