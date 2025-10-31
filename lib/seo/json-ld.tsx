import { jsonLd, stringifyForScript } from "../seo";

interface JsonLdProps {
  additionalSchemas?: Record<string, unknown>[];
}

// Interfaces for page data types
interface ArticlePageData {
  slug: string;
  title: string;
  excerpt?: string;
  description?: string;
  image?: string;
  publishedAt?: string;
  updatedAt?: string;
  author?: {
    name?: string;
  };
  category?: string;
  tags?: string[];
}

interface ProductPageData {
  slug: string;
  name: string;
  description?: string;
  images?: string[];
  category?: string;
  price?: number;
  currency?: string;
  availability?: string;
  brand?: string;
  features?: string[];
  rating?: {
    value: number;
    count: number;
  };
}

interface OrganizationPageData {
  name: string;
  description?: string;
  url?: string;
  logo?: string;
  sameAs?: string[];
  foundingDate?: string;
  contactPoint?: {
    telephone?: string;
    email?: string;
  };
}

/**
 * Componente para injetar schemas JSON-LD na página
 * Deve ser usado dentro do <head> do documento
 */
export function JsonLd({ additionalSchemas = [] }: JsonLdProps) {
  // Combinar schemas padrão com adicionais
  const allSchemas = [...jsonLd, ...additionalSchemas];

  return (
    <>
      {allSchemas.map((schema, index) => (
        <script
          key={`json-ld-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: stringifyForScript(schema),
          }}
        />
      ))}
    </>
  );
}

/**
 * Hook para gerar schema dinâmico baseado no contexto da página
 */
export function usePageSchema(pageType: string, pageData?: ArticlePageData | ProductPageData | OrganizationPageData | unknown) {
  const baseSchemas = [...jsonLd];

  // Adicionar schemas específicos por página
  switch (pageType) {
    case "features":
      // Skip for now to fix build
      break;

    case "pricing":
      // Skip for now to fix build
      break;

    case "blog":
    case "article":
      if (pageData) {
        const articleData = pageData as ArticlePageData;
        baseSchemas.push({
          "@context": "https://schema.org",
          "@type": "Article",
          "@id": `https://dataflow.com.br${articleData.slug}/#article`,
          name: articleData.title,
          description: articleData.excerpt || articleData.description,
          ...(articleData.image && { image: articleData.image }),
          ...(articleData.publishedAt && { datePublished: articleData.publishedAt }),
          ...(articleData.updatedAt && { dateModified: articleData.updatedAt }),
          author: {
            "@type": "Organization",
            "@id": "https://dataflow.com.br/#organization",
            name: articleData.author?.name || "DataFlow Team",
            url: "https://dataflow.com.br",
            logo: "https://dataflow.com.br/logo.png",
            sameAs: ["https://dataflow.com.br"],
          },
          publisher: {
            "@type": "Organization",
            "@id": "https://dataflow.com.br/#organization",
            name: "DataFlow Brasil",
          },
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": `https://dataflow.com.br${articleData.slug}/#webpage`,
          },
          articleSection: articleData.category,
          keywords: articleData.tags?.join(", "),
        } as any);
      }
      break;

    case "product":
      if (pageData) {
        const productData = pageData as ProductPageData;
        baseSchemas.push({
          "@context": "https://schema.org",
          "@type": "Product",
          "@id": `https://dataflow.com.br${productData.slug}/#product`,
          name: productData.name,
          description: productData.description,
          ...(productData.images && { image: productData.images }),
          brand: {
            "@id": "https://dataflow.com.br/#organization",
          },
          offers: productData.price ? [{
            "@type": "Offer" as const,
            price: productData.price.toString(),
            priceCurrency: productData.currency || "BRL",
            availability: productData.availability || "https://schema.org/InStock",
          } as any] : [],
          aggregateRating: productData.rating
            ? {
                "@type": "AggregateRating",
                ratingValue: productData.rating.value.toString(),
                ratingCount: productData.rating.count.toString(),
                bestRating: "5",
                worstRating: "1",
              }
            : undefined,
        } as any);
      }
      break;
  }

  return baseSchemas;
}

/**
 * Componente para website schema (deve aparecer em todas as páginas)
 */
export function WebsiteSchema() {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://dataflow.com.br/#website",
    url: "https://dataflow.com.br",
    name: "DataFlow Brasil",
    alternateName: "DataFlow BI",
    description:
      "Plataforma completa de business intelligence para PME brasileiras. Automatize seus relatórios e dashboards.",
    inLanguage: "pt-BR",
    publisher: {
      "@id": "https://dataflow.com.br/#organization",
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://dataflow.com.br/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
    sameAs: [
      "https://www.linkedin.com/company/dataflow-brasil",
      "https://twitter.com/dataflow_br",
      "https://www.instagram.com/dataflow_br",
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: stringifyForScript(websiteSchema),
      }}
    />
  );
}
