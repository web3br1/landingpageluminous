import { Metadata } from "next";

// Schema.org types for structured data
interface ProductSchema {
  "@context": "https://schema.org";
  "@type": "SoftwareApplication";
  name: string;
  description: string;
  applicationCategory: string;
  operatingSystem: string;
  offers: {
    "@type": "Offer";
    priceCurrency: string;
    price: string;
    availability: string;
    validFrom: string;
  };
  aggregateRating?: {
    "@type": "AggregateRating";
    ratingValue: string;
    reviewCount: string;
  };
  author: {
    "@type": "Organization";
    name: string;
    url: string;
  };
  screenshot?: string[];
  featureList?: string[];
}

interface BreadcrumbSchema {
  "@context": "https://schema.org";
  "@type": "BreadcrumbList";
  itemListElement: Array<{
    "@type": "ListItem";
    position: number;
    name: string;
    item: string;
  }>;
}

interface FAQSchema {
  "@context": "https://schema.org";
  "@type": "FAQPage";
  mainEntity: Array<{
    "@type": "Question";
    name: string;
    acceptedAnswer: {
      "@type": "Answer";
      text: string;
    };
  }>;
}

interface OrganizationSchema {
  "@context": "https://schema.org";
  "@type": "Organization";
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs: string[];
  contactPoint: {
    "@type": "ContactPoint";
    telephone: string;
    contactType: string;
    availableLanguage: string;
  };
}

// Generate product schema for SaaS applications
export function generateProductSchema(product: {
  name: string;
  description: string;
  price: number;
  currency: string;
  features?: string[];
  screenshots?: string[];
  rating?: {
    value: number;
    count: number;
  };
}): ProductSchema {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: product.name,
    description: product.description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web Browser",
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency,
      price: product.price.toString(),
      availability: "https://schema.org/InStock",
      validFrom: new Date().toISOString().split("T")[0],
    },
    ...(product.rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating.value.toString(),
        reviewCount: product.rating.count.toString(),
      },
    }),
    author: {
      "@type": "Organization",
      name: "DataFlow Brasil",
      url: "https://dataflow.com.br",
    },
    ...(product.screenshots && { screenshot: product.screenshots }),
    ...(product.features && { featureList: product.features }),
  };
}

// Generate breadcrumb schema for navigation
export function generateBreadcrumbSchema(
  breadcrumbs: Array<{
    name: string;
    url: string;
  }>,
): BreadcrumbSchema {
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

// Generate FAQ schema
export function generateFAQSchema(
  faqs: Array<{
    question: string;
    answer: string;
  }>,
): FAQSchema {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

// Generate organization schema
export function generateOrganizationSchema(): OrganizationSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "DataFlow Brasil",
    url: "https://dataflow.com.br",
    logo: "https://dataflow.com.br/images/logo.svg",
    description:
      "Plataforma completa de business intelligence para PMEs brasileiras. Automatize relatórios, dashboards interativos e insights em tempo real.",
    sameAs: [
      "https://linkedin.com/company/dataflow-brasil",
      "https://twitter.com/dataflowbr",
      "https://facebook.com/dataflowbr",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+55-11-99999-9999",
      contactType: "customer service",
      availableLanguage: "Portuguese",
    },
  };
}

// Generate review schema
export function generateReviewSchema(
  reviews: Array<{
    author: string;
    rating: number;
    datePublished: string;
    reviewBody: string;
  }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "DataFlow BI",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue:
        reviews.reduce((sum, review) => sum + review.rating, 0) /
        reviews.length,
      reviewCount: reviews.length,
    },
    review: reviews.map((review) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: review.author,
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: 5,
      },
      datePublished: review.datePublished,
      reviewBody: review.reviewBody,
    })),
  };
}

// Generate video schema for demo videos
export function generateVideoSchema(
  videos: Array<{
    name: string;
    description: string;
    thumbnailUrl: string;
    uploadDate: string;
    duration: string;
    contentUrl: string;
  }>,
) {
  return videos.map((video) => ({
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: video.name,
    description: video.description,
    thumbnailUrl: video.thumbnailUrl,
    uploadDate: video.uploadDate,
    duration: video.duration,
    contentUrl: video.contentUrl,
    embedUrl: video.contentUrl.replace(".mp4", ""),
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/WatchAction",
      userInteractionCount: 1000, // Approximate
    },
  }));
}

// Main function to generate all schemas for a page
export function generatePageSchemas(pageType: string, data?: any) {
  const schemas = [];

  // Always include organization schema
  schemas.push(generateOrganizationSchema());

  switch (pageType) {
    case "landing":
      // Product schema for main offering
      schemas.push(
        generateProductSchema({
          name: "DataFlow BI - Business Intelligence para PMEs",
          description:
            "Plataforma completa de business intelligence para PMEs brasileiras. Relatórios automáticos, dashboards interativos e insights em tempo real.",
          price: 99,
          currency: "BRL",
          features: [
            "Relatórios automáticos",
            "Dashboards interativos",
            "Insights em tempo real",
            "Suporte 24/7",
            "Integração com sistemas existentes",
          ],
          rating: {
            value: 4.8,
            count: 150,
          },
        }),
      );

      // Breadcrumb schema
      schemas.push(
        generateBreadcrumbSchema([
          { name: "Início", url: "https://dataflow.com.br" },
        ]),
      );
      break;

    case "pricing":
      // Product schema for pricing page
      schemas.push(
        generateProductSchema({
          name: "Planos DataFlow BI",
          description:
            "Escolha o plano ideal para seu negócio. Starter, Professional e Enterprise.",
          price: 99,
          currency: "BRL",
        }),
      );

      // Breadcrumb schema
      schemas.push(
        generateBreadcrumbSchema([
          { name: "Início", url: "https://dataflow.com.br" },
          { name: "Preços", url: "https://dataflow.com.br/pricing" },
        ]),
      );
      break;

    case "demo":
      // Video schema for demo page
      if (data?.videos) {
        schemas.push(...generateVideoSchema(data.videos));
      }
      break;

    case "features":
      // Breadcrumb schema
      schemas.push(
        generateBreadcrumbSchema([
          { name: "Início", url: "https://dataflow.com.br" },
          { name: "Recursos", url: "https://dataflow.com.br/features" },
        ]),
      );
      break;
  }

  // FAQ schema if FAQs are provided
  if (data?.faqs) {
    schemas.push(generateFAQSchema(data.faqs));
  }

  // Reviews schema if reviews are provided
  if (data?.reviews) {
    schemas.push(generateReviewSchema(data.reviews));
  }

  return schemas;
}

// Generate JSON-LD script tags for Next.js (to be used in JSX)
export function generateJsonLdSchemas(schemas: any[]) {
  // This function should be called from a .tsx file
  // For now, return the schemas directly for use in metadata
  return schemas;
}
