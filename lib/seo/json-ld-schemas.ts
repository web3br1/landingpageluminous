import { z } from "zod";

// Base schema.org types
const ThingSchema = z.object({
  "@context": z.literal("https://schema.org"),
  "@type": z.string(),
  "@id": z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  url: z.string().optional(),
  sameAs: z.array(z.string()).optional(),
});

// Software Application Schema
export const SoftwareApplicationSchema = ThingSchema.extend({
  "@type": z.literal("SoftwareApplication"),
  "@id": z.string().url(),
  name: z.string().min(1),
  description: z.string().min(10),
  url: z.string().url(),
  applicationCategory: z.string(),
  operatingSystem: z.string(),
  softwareVersion: z.string(),
  fileSize: z.string(),
  offers: z.array(
    z.object({
      "@type": z.literal("Offer"),
      price: z.string(),
      priceCurrency: z.string(),
      priceValidUntil: z.string(),
      description: z.string(),
    }),
  ),
  aggregateRating: z
    .object({
      "@type": z.literal("AggregateRating"),
      ratingValue: z.string(),
      ratingCount: z.string(),
      bestRating: z.string(),
      worstRating: z.string(),
    })
    .optional(),
  applicationSubCategory: z.string().optional(),
  author: z
    .object({
      "@type": z.literal("Organization"),
      "@id": z.string().optional(),
      name: z.string().min(1),
      url: z.string().url(),
      logo: z.string().url(),
      sameAs: z.array(z.string().url()).optional(),
    })
    .optional(),
  publisher: z
    .object({
      "@type": z.literal("Organization"),
      "@id": z.string().optional(),
      name: z.string().min(1),
    })
    .optional(),
  featureList: z.array(z.string()).optional(),
});

// Organization Schema
export const OrganizationSchema = ThingSchema.extend({
  "@type": z.literal("Organization"),
  "@id": z.string().url(),
  name: z.string().min(1),
  alternateName: z.string().optional(),
  url: z.string().url(),
  logo: z.string().url(),
  description: z.string().min(10),
  foundingDate: z.string().optional(),
  industry: z.string().optional(),
  numberOfEmployees: z.string().optional(),
  address: z
    .object({
      "@type": z.literal("PostalAddress"),
      addressCountry: z.string(),
      addressRegion: z.string().optional(),
      addressLocality: z.string().optional(),
    })
    .optional(),
  contactPoint: z
    .object({
      "@type": z.literal("ContactPoint"),
      telephone: z.string().optional(),
      contactType: z.string(),
      areaServed: z.string().optional(),
      availableLanguage: z.string().optional(),
    })
    .optional(),
  sameAs: z.array(z.string().url()),
});

// FAQ Page Schema
export const FAQPageSchema = ThingSchema.extend({
  "@type": z.literal("FAQPage"),
  mainEntity: z.array(
    z.object({
      "@type": z.literal("Question"),
      name: z.string().min(1),
      acceptedAnswer: z.object({
        "@type": z.literal("Answer"),
        text: z.string().min(10),
      }),
    }),
  ),
});

// Website Schema
export const WebsiteSchema = ThingSchema.extend({
  "@type": z.literal("WebSite"),
  "@id": z.string().url(),
  url: z.string().url(),
  name: z.string().min(1),
  alternateName: z.string().optional(),
  description: z.string().min(10),
  inLanguage: z.string(),
  publisher: ThingSchema.extend({
    "@type": z.literal("Organization"),
  }),
  potentialAction: z.object({
    "@type": z.literal("SearchAction"),
    target: z.object({
      "@type": z.literal("EntryPoint"),
      urlTemplate: z.string(),
    }),
    "query-input": z.string(),
  }),
});

// Article Schema
export const ArticleSchema = ThingSchema.extend({
  "@type": z.literal("Article"),
  "@id": z.string().url(),
  name: z.string().min(1),
  description: z.string().min(10),
  image: z.string().url().optional(),
  datePublished: z.string(),
  dateModified: z.string(),
  author: ThingSchema.extend({
    "@type": z.literal("Organization"),
  }),
  publisher: ThingSchema.extend({
    "@type": z.literal("Organization"),
  }),
  mainEntityOfPage: z.object({
    "@type": z.literal("WebPage"),
    "@id": z.string().url(),
  }),
  articleSection: z.string().optional(),
  keywords: z.string().optional(),
});

// Product Schema
export const ProductSchema = ThingSchema.extend({
  "@type": z.literal("Product"),
  "@id": z.string().url(),
  name: z.string().min(1),
  description: z.string().min(10),
  image: z.array(z.string().url()).optional(),
  brand: ThingSchema.extend({
    "@type": z.literal("Organization"),
  }).optional(),
  offers: z.array(z.any()).optional(), // Complex offer structure
  aggregateRating: z
    .object({
      "@type": z.literal("AggregateRating"),
      ratingValue: z.string(),
      reviewCount: z.string(),
      bestRating: z.string(),
      worstRating: z.string(),
    })
    .optional(),
});

// Validation functions
export function validateJsonLdSchema(
  schema: unknown,
  schemaType: string,
): { success: true } | { success: false; errors: z.ZodError } {
  try {
    switch (schemaType) {
      case "SoftwareApplication":
        SoftwareApplicationSchema.parse(schema);
        break;
      case "Organization":
        OrganizationSchema.parse(schema);
        break;
      case "FAQPage":
        FAQPageSchema.parse(schema);
        break;
      case "WebSite":
        WebsiteSchema.parse(schema);
        break;
      case "Article":
        ArticleSchema.parse(schema);
        break;
      case "Product":
        ProductSchema.parse(schema);
        break;
      default:
        return {
          success: false,
          errors: new z.ZodError([
            {
              code: "custom",
              message: `Unknown schema type: ${schemaType}`,
              path: ["@type"],
            },
          ]),
        };
    }
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

// Type exports for TypeScript
export type SoftwareApplication = z.infer<typeof SoftwareApplicationSchema>;
export type Organization = z.infer<typeof OrganizationSchema>;
export type FAQPage = z.infer<typeof FAQPageSchema>;
export type Website = z.infer<typeof WebsiteSchema>;
export type Article = z.infer<typeof ArticleSchema>;
export type Product = z.infer<typeof ProductSchema>;
