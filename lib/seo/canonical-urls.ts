import { Metadata } from "next";

/**
 * Configuration for canonical URL generation
 */
interface CanonicalConfig {
  baseUrl: string;
  defaultLocale: string;
  locales: string[];
  trailingSlash?: boolean;
  lowercase?: boolean;
}

/**
 * Default configuration for canonical URLs
 */
const defaultConfig: CanonicalConfig = {
  baseUrl: "https://dataflow.com.br",
  defaultLocale: "pt-BR",
  locales: ["pt-BR", "en-US"],
  trailingSlash: false,
  lowercase: true,
};

/**
 * Generate canonical URL for a given path and parameters
 */
export function generateCanonicalUrl(
  path: string = "/",
  config: Partial<CanonicalConfig> = {},
  params?: Record<string, string | string[]>,
): string {
  const finalConfig = { ...defaultConfig, ...config };
  const { baseUrl, trailingSlash, lowercase } = finalConfig;

  // Clean and normalize the path
  let canonicalPath = path.startsWith("/") ? path : `/${path}`;

  // Remove trailing slash if not desired (except for root)
  if (!trailingSlash && canonicalPath !== "/" && canonicalPath.endsWith("/")) {
    canonicalPath = canonicalPath.slice(0, -1);
  }

  // Add trailing slash if desired
  if (trailingSlash && canonicalPath !== "/" && !canonicalPath.endsWith("/")) {
    canonicalPath = `${canonicalPath}/`;
  }

  // Convert to lowercase if configured
  if (lowercase) {
    canonicalPath = canonicalPath.toLowerCase();
  }

  // Build full URL
  let canonicalUrl = `${baseUrl}${canonicalPath}`;

  // Add query parameters if provided
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();

    // Sort parameters for consistency
    Object.keys(params)
      .sort()
      .forEach((key) => {
        const value = params[key];
        if (Array.isArray(value)) {
          value.forEach((v) => searchParams.append(key, v));
        } else {
          searchParams.append(key, value);
        }
      });

    const queryString = searchParams.toString();
    if (queryString) {
      canonicalUrl += `?${queryString}`;
    }
  }

  return canonicalUrl;
}

/**
 * Generate canonical URL for paginated content
 */
export function generatePaginatedCanonicalUrl(
  basePath: string,
  page: number,
  config: Partial<CanonicalConfig> = {},
): string {
  // For page 1, use base path without pagination
  if (page === 1) {
    return generateCanonicalUrl(basePath, config);
  }

  // For other pages, add page parameter
  return generateCanonicalUrl(basePath, config, { page: page.toString() });
}

/**
 * Generate canonical URL for filtered/search content
 */
export function generateFilteredCanonicalUrl(
  basePath: string,
  filters: Record<string, string | string[]>,
  config: Partial<CanonicalConfig> = {},
): string {
  return generateCanonicalUrl(basePath, config, filters);
}

/**
 * Hook to generate canonical URL metadata for Next.js pages
 */
export function generateCanonicalMetadata(
  path: string = "/",
  config: Partial<CanonicalConfig> = {},
  additionalAlternates?: Metadata["alternates"],
): Pick<Metadata, "alternates"> {
  const canonicalUrl = generateCanonicalUrl(path, config);

  const alternates: Metadata["alternates"] = {
    canonical: canonicalUrl,
    ...additionalAlternates,
  };

  return { alternates };
}

/**
 * Generate hreflang alternates for multi-language sites
 */
export function generateHreflangAlternates(
  basePath: string,
  locale: string,
  config: Partial<CanonicalConfig> = {},
): Array<{ hreflang: string; href: string }> {
  const finalConfig = { ...defaultConfig, ...config };
  const alternates: Array<{ hreflang: string; href: string }> = [];

  // Add hreflang for each supported locale
  finalConfig.locales.forEach((loc) => {
    const localePath =
      loc === finalConfig.defaultLocale
        ? basePath
        : `/${loc.toLowerCase()}${basePath}`;
    const url = generateCanonicalUrl(localePath, config);

    alternates.push({
      hreflang: loc.toLowerCase().replace("-", "-"),
      href: url,
    });
  });

  // Add x-default for default locale
  const defaultUrl = generateCanonicalUrl(
    finalConfig.defaultLocale === "pt-BR" ? basePath : `/pt-br${basePath}`,
    config,
  );
  alternates.push({
    hreflang: "x-default",
    href: defaultUrl,
  });

  return alternates;
}

/**
 * Middleware helper to handle canonical redirects
 */
export function handleCanonicalRedirects(
  request: Request,
  config: Partial<CanonicalConfig> = {},
): Response | null {
  const url = new URL(request.url);
  const finalConfig = { ...defaultConfig, ...config };

  let shouldRedirect = false;
  let redirectUrl = url.href;

  // Handle trailing slash
  if (
    finalConfig.trailingSlash === false &&
    url.pathname !== "/" &&
    url.pathname.endsWith("/")
  ) {
    redirectUrl = redirectUrl.replace(/\/$/, "");
    shouldRedirect = true;
  } else if (
    finalConfig.trailingSlash === true &&
    url.pathname !== "/" &&
    !url.pathname.endsWith("/")
  ) {
    redirectUrl = `${redirectUrl}/`;
    shouldRedirect = true;
  }

  // Handle case sensitivity
  if (finalConfig.lowercase && url.pathname !== url.pathname.toLowerCase()) {
    const newUrl = new URL(redirectUrl);
    newUrl.pathname = newUrl.pathname.toLowerCase();
    redirectUrl = newUrl.href;
    shouldRedirect = true;
  }

  // Handle www vs non-www (assuming we prefer non-www)
  if (url.hostname.startsWith("www.")) {
    redirectUrl = redirectUrl.replace("www.", "");
    shouldRedirect = true;
  }

  if (shouldRedirect && redirectUrl !== url.href) {
    return new Response(null, {
      status: 301,
      headers: {
        Location: redirectUrl,
      },
    });
  }

  return null;
}

/**
 * Validate if a URL is canonical
 */
export function isCanonicalUrl(
  url: string,
  expectedCanonical: string,
  config: Partial<CanonicalConfig> = {},
): boolean {
  const finalConfig = { ...defaultConfig, ...config };
  const urlObj = new URL(url);
  const canonicalObj = new URL(expectedCanonical);

  // Check if hostnames match
  if (urlObj.hostname !== canonicalObj.hostname) {
    return false;
  }

  // Check trailing slash
  if (finalConfig.trailingSlash === false) {
    if (urlObj.pathname !== "/" && urlObj.pathname.endsWith("/")) {
      return false;
    }
  } else if (finalConfig.trailingSlash === true) {
    if (urlObj.pathname !== "/" && !urlObj.pathname.endsWith("/")) {
      return false;
    }
  }

  // Check case sensitivity
  if (
    finalConfig.lowercase &&
    urlObj.pathname !== urlObj.pathname.toLowerCase()
  ) {
    return false;
  }

  // Check if paths match
  if (urlObj.pathname.toLowerCase() !== canonicalObj.pathname.toLowerCase()) {
    return false;
  }

  return true;
}

/**
 * Generate sitemap entries with canonical URLs
 */
export function generateSitemapEntry(
  path: string,
  lastModified?: Date,
  changeFrequency?:
    | "always"
    | "hourly"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly"
    | "never",
  priority?: number,
  config: Partial<CanonicalConfig> = {},
) {
  const url = generateCanonicalUrl(path, config);

  return {
    url,
    lastModified: lastModified || new Date(),
    changeFrequency: changeFrequency || "weekly",
    priority: priority || 0.5,
  };
}
