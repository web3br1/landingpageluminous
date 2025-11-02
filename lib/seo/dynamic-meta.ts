import { Metadata } from "next";
import {
  generateCanonicalUrl,
  generateCanonicalMetadata,
} from "./canonical-urls";
import { DuplicateContentDetector } from "./duplicate-content";

/**
 * Safe metadata property access with type guards
 */
function safeMetadataAccess<T>(
  metadata: unknown,
  property: string,
  fallback: T,
): T {
  if (!metadata || typeof metadata !== 'object') return fallback;
  const obj = metadata as Record<string, unknown>;
  return (obj[property] as T) ?? fallback;
}

function safeMetadataSpread(metadata: unknown): Record<string, unknown> {
  return metadata && typeof metadata === 'object' ? metadata as Record<string, unknown> : {};
}

/**
 * Configuration for dynamic meta generation
 */
export interface PageMetaConfig {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: "website" | "article" | "product" | "profile";
  section?: string;
  tags?: string[];
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  content?: string; // For duplicate detection
  noindex?: boolean;
  nofollow?: boolean;
}

/**
 * Generate dynamic metadata for any page
 */
export function generatePageMetadata(config: PageMetaConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    image,
    url = "/",
    type = "website",
    section,
    tags = [],
    author,
    publishedTime,
    modifiedTime,
    content = "",
    noindex = false,
    nofollow = false,
  } = config;

  // Generate canonical URL
  const canonicalMetadata = generateCanonicalMetadata(url);

  // Check for duplicate content if content is provided
  let finalMetadata: Metadata = { ...defaultSeo };

  if (content) {
    finalMetadata = DuplicateContentDetector.generateMetadataWithDuplicateCheck(
      url,
      finalMetadata,
      content,
    );
  }

  // Override with page-specific metadata
  if (title) {
    finalMetadata.title = title;
  }

  if (description) {
    finalMetadata.description = description;
  }

  // Combine keywords
  const defaultKeywords = Array.isArray(defaultSeo.keywords)
    ? defaultSeo.keywords
    : [];
  finalMetadata.keywords = [...defaultKeywords, ...keywords, ...tags];

  // Update Open Graph metadata
  if (finalMetadata.openGraph) {
    (finalMetadata.openGraph as unknown) = {
      ...finalMetadata.openGraph,
      type,
      title: title || finalMetadata.openGraph.title,
      description: description || finalMetadata.openGraph.description,
      url: generateCanonicalUrl(url),
    };

    if (image) {
      finalMetadata.openGraph.images = [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title || "Page image",
        },
      ];
    }

    // Add article-specific metadata
    if (
      type === "article" &&
      (publishedTime || modifiedTime || author || section)
    ) {
      const openGraph = safeMetadataSpread(finalMetadata.openGraph);
      openGraph.article = {
        ...(publishedTime && { publishedTime }),
        ...(modifiedTime && { modifiedTime }),
        ...(author && { author }),
        ...(section && { section }),
        ...(tags.length > 0 && { tags }),
      };
    }
  }

  // Update Twitter metadata
  if (finalMetadata.twitter) {
    finalMetadata.twitter = {
      ...finalMetadata.twitter,
      title: title || finalMetadata.twitter.title,
      description: description || finalMetadata.twitter.description,
    };

    if (image) {
      finalMetadata.twitter.images = [
        {
          url: image,
          alt: title || "Page image",
        },
      ];
    }
  }

  // Update canonical URLs
  finalMetadata.alternates = {
    ...finalMetadata.alternates,
    ...canonicalMetadata.alternates,
  };

  // Update robots directives
  if (finalMetadata.robots) {
    finalMetadata.robots = {
      ...(typeof finalMetadata.robots === 'object' && finalMetadata.robots ? finalMetadata.robots : {}),
      index: !noindex,
      follow: !nofollow,
    };
  }

  // Add structured data for specific content types
  if (type === "article" && (author || publishedTime)) {
    finalMetadata.other = {
      ...(finalMetadata.other || {}),
      "article:author": author,
      ...(publishedTime && { "article:published_time": publishedTime }),
      ...(modifiedTime && { "article:modified_time": modifiedTime }),
      ...(section && { "article:section": section }),
      ...(tags.length > 0 && { "article:tag": tags.join(",") }),
    };
  }

  return finalMetadata;
}

/**
 * Predefined meta configurations for common page types
 */
export const pageMetaPresets = {
  home: (): PageMetaConfig => ({
    title:
      "DataFlow — Relatórios automáticos em minutos | Business Intelligence",
    description:
      "Pare de perder tempo com planilhas manuais. Automatize seus relatórios de vendas, financeiro e operações. 14 dias grátis. Mais de 2.500 empresas confiam na DataFlow.",
    keywords: [
      "business intelligence",
      "relatórios automáticos",
      "BI Brasil",
      "dashboards",
    ],
    type: "website",
  }),

  features: (): PageMetaConfig => ({
    title:
      "Funcionalidades — DataFlow BI | Dashboards Interativos e Relatórios Automáticos",
    description:
      "Conheça todas as funcionalidades da DataFlow: dashboards em tempo real, relatórios automáticos por email, integrações com ERPs brasileiros e controle de acesso granular.",
    keywords: [
      "funcionalidades",
      "dashboards",
      "relatórios automáticos",
      "integrações ERP",
      "business intelligence",
    ],
    type: "website",
    section: "features",
  }),

  pricing: (): PageMetaConfig => ({
    title: "Preços — DataFlow BI | Planos Flexíveis para PME Brasileiras",
    description:
      "Planos Starter, Professional e Enterprise. Teste grátis por 14 dias. Dashboards ilimitados, integrações incluídas. Cancele quando quiser.",
    keywords: [
      "preços",
      "planos",
      "starter",
      "professional",
      "enterprise",
      "teste grátis",
    ],
    type: "website",
    section: "pricing",
  }),

  demo: (): PageMetaConfig => ({
    title: "Demonstração — DataFlow BI | Veja Como Funciona na Prática",
    description:
      "Agende uma demonstração personalizada da DataFlow. Veja como automatizar relatórios e criar dashboards interativos em tempo real.",
    keywords: [
      "demonstração",
      "demo",
      "teste",
      "dashboard interativo",
      "relatórios",
    ],
    type: "website",
    section: "demo",
  }),

  blog: (): PageMetaConfig => ({
    title: "Blog — DataFlow BI | Insights sobre Business Intelligence e Dados",
    description:
      "Artigos sobre business intelligence, análise de dados, dashboards e as melhores práticas para PME brasileiras tomarem decisões baseadas em dados.",
    keywords: [
      "blog",
      "business intelligence",
      "análise de dados",
      "insights",
      "PME",
    ],
    type: "website",
    section: "blog",
  }),

  about: (): PageMetaConfig => ({
    title: "Sobre Nós — DataFlow BI | Especialistas em Business Intelligence",
    description:
      "Conheça a DataFlow, empresa especializada em business intelligence para PME brasileiras. Mais de 2.500 clientes atendidos.",
    keywords: ["sobre", "empresa", "time", "história", "clientes"],
    type: "website",
    section: "about",
  }),

  contact: (): PageMetaConfig => ({
    title: "Contato — DataFlow BI | Fale Conosco",
    description:
      "Entre em contato com a equipe DataFlow. Suporte técnico, vendas e atendimento personalizado para sua empresa.",
    keywords: ["contato", "suporte", "vendas", "atendimento", "whatsapp"],
    type: "website",
    section: "contact",
  }),

  // Generate dynamic article metadata
  article: (articleData: {
    title: string;
    excerpt: string;
    author?: string;
    publishedAt?: string;
    updatedAt?: string;
    tags?: string[];
    image?: string;
    url: string;
  }): PageMetaConfig => ({
    title: `${articleData.title} | Blog DataFlow BI`,
    description: articleData.excerpt,
    keywords: articleData.tags || [],
    image: articleData.image,
    url: articleData.url,
    type: "article",
    author: articleData.author,
    publishedTime: articleData.publishedAt,
    modifiedTime: articleData.updatedAt,
    tags: articleData.tags,
    section: "blog",
  }),

  // Generate dynamic product metadata
  product: (productData: {
    name: string;
    description: string;
    image?: string;
    url: string;
  }): PageMetaConfig => ({
    title: `${productData.name} | DataFlow BI`,
    description: productData.description,
    image: productData.image,
    url: productData.url,
    type: "website",
    section: "product",
  }),
};

/**
 * Generate metadata for specific page types using presets
 */
export function generatePresetMetadata(
  preset: keyof typeof pageMetaPresets,
  overrides: Partial<PageMetaConfig> = {},
  data?: unknown,
): Metadata {
  let presetConfig: PageMetaConfig;

  // Handle presets that require data
  const presetFn = safeMetadataAccess(pageMetaPresets, preset, null);
  if (presetFn && typeof presetFn === 'function') {
    if ((preset === "article" || preset === "product") && data) {
      presetConfig = presetFn(data);
    } else {
      presetConfig = presetFn();
    }
  } else {
    // Fallback for invalid preset
    presetConfig = {
      title: "DataFlow BI",
      description: "Business Intelligence Platform",
      type: "website",
    };
  }

  const finalConfig = { ...presetConfig, ...overrides };
  return generatePageMetadata(finalConfig);
}

/**
 * Generate metadata with A/B testing variants
 */
export function generateABTestMetadata(
  baseConfig: PageMetaConfig,
  variant: "A" | "B",
  experimentData?: {
    experimentId: string;
    variantId: string;
  },
): Metadata {
  const metadata = generatePageMetadata(baseConfig);

  // Add experiment data to metadata for tracking
  if (experimentData) {
    metadata.other = {
      ...(metadata.other || {}),
      "data-experiment": experimentData.experimentId,
      "data-variant": experimentData.variantId,
    };
  }

  // Modify content based on variant
  if (variant === "B" && metadata.title && typeof metadata.title === "string") {
    // Example: Add urgency to variant B
    metadata.title = metadata.title.replace(
      "Relatórios automáticos",
      "Relatórios automáticos URGENTE",
    );
  }

  return metadata;
}

/**
 * Generate metadata for paginated content
 */
export function generatePaginatedMetadata(
  baseConfig: PageMetaConfig,
  page: number,
  totalPages: number,
): Metadata {
  const metadata = generatePageMetadata(baseConfig);

  // Update title for pagination
  if (metadata.title && typeof metadata.title === "string") {
    metadata.title = `${metadata.title} - Página ${page}`;
  }

  // Update description
  if (metadata.description && typeof metadata.description === "string") {
    metadata.description = `${metadata.description} Página ${page} de ${totalPages}.`;
  }

  // Add pagination meta tags
  metadata.other = {
    ...safeMetadataSpread(safeMetadataAccess(metadata, 'other', null)),
    "pagination-page": page.toString(),
    "pagination-total": totalPages.toString(),
  };

  // For page > 1, set noindex to avoid duplicate content
  if (page > 1) {
    metadata.robots = {
      index: false,
      follow: true,
    };
  }

  return metadata;
}

/**
 * Validate metadata completeness
 */
export function validateMetadata(metadata: Metadata): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!metadata.title) {
    errors.push("Title is required");
  }

  if (!metadata.description) {
    errors.push("Description is required");
  }

  // Title validation
  if (metadata.title) {
    const titleStr =
      typeof metadata.title === "string" ? metadata.title : "Title";
    if (titleStr.length > 60) {
      warnings.push(
        "Title is longer than 60 characters, may be truncated in search results",
      );
    }
    if (titleStr.length < 30) {
      warnings.push(
        "Title is shorter than 30 characters, consider making it more descriptive",
      );
    }
  }

  // Description validation
  if (metadata.description) {
    const descStr =
      typeof metadata.description === "string" ? metadata.description : "";
    if (descStr.length > 160) {
      warnings.push(
        "Description is longer than 160 characters, may be truncated in search results",
      );
    }
    if (descStr.length < 120) {
      warnings.push(
        "Description is shorter than 120 characters, consider making it more descriptive",
      );
    }
  }

  // Open Graph validation
  if (metadata.openGraph) {
    if (!metadata.openGraph.title) {
      warnings.push("Open Graph title is missing");
    }
    if (!metadata.openGraph.description) {
      warnings.push("Open Graph description is missing");
    }
    const ogImages = safeMetadataAccess(metadata.openGraph, 'images', []);
    if (!ogImages || (Array.isArray(ogImages) && ogImages.length === 0)) {
      warnings.push("Open Graph images are missing");
    }
  } else {
    warnings.push("Open Graph metadata is missing");
  }

  // Twitter validation
  if (metadata.twitter) {
    if (!metadata.twitter.title) {
      warnings.push("Twitter title is missing");
    }
    if (!metadata.twitter.description) {
      warnings.push("Twitter description is missing");
    }
    const twitterImages = safeMetadataAccess(metadata.twitter, 'images', []);
    if (
      !twitterImages ||
      (Array.isArray(twitterImages) && twitterImages.length === 0)
    ) {
      warnings.push("Twitter images are missing");
    }
  } else {
    warnings.push("Twitter metadata is missing");
  }

  // Canonical URL validation
  if (!metadata.alternates?.canonical) {
    warnings.push("Canonical URL is missing");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
