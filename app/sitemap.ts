import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://dataflow.com.br";

  // Only include production pages in sitemap
  // Admin pages and dev pages are excluded (noindex)
  const productionPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1, // Landing page - highest priority
    },
    {
      url: `${baseUrl}/features`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8, // Features - high priority
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9, // Pricing - very high priority (revenue critical)
    },
    {
      url: `${baseUrl}/demo`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7, // Demo - conversion focused
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6, // Signup - conversion page
    },
    {
      url: `${baseUrl}/trial`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6, // Trial - conversion page
    },
    {
      url: `${baseUrl}/checkout`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5, // Checkout - final conversion
    },
  ];

  return productionPages;
}
