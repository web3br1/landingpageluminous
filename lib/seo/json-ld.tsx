import { jsonLd, stringifyForScript } from "../seo";

interface JsonLdProps {
  additionalSchemas?: Record<string, any>[];
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
export function usePageSchema(pageType: string, pageData?: any) {
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
        baseSchemas.push({
          "@context": "https://schema.org",
          "@type": "Article",
          "@id": `https://dataflow.com.br${pageData.slug}/#article`,
          name: pageData.title,
          description: pageData.excerpt || pageData.description,
          image: pageData.image,
          datePublished: pageData.publishedAt,
          dateModified: pageData.updatedAt,
          author: {
            "@type": "Organization",
            "@id": "https://dataflow.com.br/#organization",
            name: pageData.author?.name || "DataFlow Team",
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
            "@id": `https://dataflow.com.br${pageData.slug}/#webpage`,
          },
          articleSection: pageData.category,
          keywords: pageData.tags?.join(", "),
        } as any);
      }
      break;

    case "product":
      if (pageData) {
        baseSchemas.push({
          "@context": "https://schema.org",
          "@type": "Product",
          "@id": `https://dataflow.com.br${pageData.slug}/#product`,
          name: pageData.name,
          description: pageData.description,
          image: pageData.images,
          brand: {
            "@id": "https://dataflow.com.br/#organization",
          },
          offers: pageData.offers || [],
          aggregateRating: pageData.rating
            ? {
                "@type": "AggregateRating",
                ratingValue: pageData.rating.value,
                reviewCount: pageData.rating.count,
                bestRating: 5,
                worstRating: 1,
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
