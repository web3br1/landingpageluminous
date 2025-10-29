import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://dataflow.com.br";

  return {
    rules: [
      {
        userAgent: "*",
        // Allow production pages
        allow: [
          "/",
          "/features",
          "/pricing",
          "/demo",
          "/signup",
          "/trial",
          "/checkout",
        ],
        // Disallow admin, development, and internal pages
        disallow: [
          "/admin/", // Admin dashboard
          "/api/", // API routes
          "/_next/", // Next.js internal
          "/debug-styles", // Development debug
          "/dev", // Development tools
          "/playground", // Component playground
          "/test", // Test pages
          "/test-styles", // Style tests
          "/ssr-test", // SSR tests
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
