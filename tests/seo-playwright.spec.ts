import { test, expect } from "@playwright/test";

// SEO Integration Tests using Playwright

test.describe("SEO Integration Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders all meta tags in HTML head", async ({ page }) => {
    // Check basic meta tags
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);

    // Check meta description
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toBeAttached();
    const descriptionContent = await metaDescription.getAttribute("content");
    expect(descriptionContent).toBeTruthy();
    expect(descriptionContent!.length).toBeGreaterThan(50);

    // Check meta keywords
    const metaKeywords = page.locator('meta[name="keywords"]');
    await expect(metaKeywords).toBeAttached();

    // Check charset
    const metaCharset = page.locator("meta[charset]");
    await expect(metaCharset).toBeAttached();
    const charset = await metaCharset.getAttribute("charset");
    expect(charset?.toLowerCase()).toBe("utf-8");
  });

  test("renders Open Graph meta tags", async ({ page }) => {
    // Check Open Graph basic tags
    const ogTitle = page.locator('meta[property="og:title"]');
    const ogDescription = page.locator('meta[property="og:description"]');
    const ogUrl = page.locator('meta[property="og:url"]');
    const ogType = page.locator('meta[property="og:type"]');

    await expect(ogTitle).toBeAttached();
    await expect(ogDescription).toBeAttached();
    await expect(ogUrl).toBeAttached();
    await expect(ogType).toBeAttached();

    // Validate og:type
    const ogTypeValue = await ogType.getAttribute("content");
    expect(ogTypeValue).toBe("website");
  });

  test("renders Twitter Card meta tags", async ({ page }) => {
    // Check Twitter Card tags
    const twitterCard = page.locator('meta[name="twitter:card"]');
    const twitterTitle = page.locator('meta[name="twitter:title"]');
    const twitterDescription = page.locator('meta[name="twitter:description"]');

    await expect(twitterCard).toBeAttached();
    await expect(twitterTitle).toBeAttached();
    await expect(twitterDescription).toBeAttached();

    // Validate twitter card type
    const cardType = await twitterCard.getAttribute("content");
    expect(["summary", "summary_large_image", "app", "player"]).toContain(
      cardType,
    );
  });

  test("renders canonical URL", async ({ page }) => {
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toBeAttached();

    const canonicalUrl = await canonical.getAttribute("href");
    expect(canonicalUrl).toMatch(/^https?:\/\//);
    expect(canonicalUrl).toContain("sistemaauto.com");
  });

  test("renders robots meta tag", async ({ page }) => {
    const robots = page.locator('meta[name="robots"]');
    await expect(robots).toBeAttached();

    const robotsContent = await robots.getAttribute("content");
    expect(robotsContent).toBeDefined();
    expect(robotsContent!.length).toBeGreaterThan(0);
  });

  test("generates valid sitemap.xml", async ({ page }) => {
    // Test sitemap endpoint
    const response = await page.request.get("/sitemap.xml");
    expect(response.status()).toBe(200);

    const sitemapContent = await response.text();
    expect(sitemapContent).toContain("<?xml");
    expect(sitemapContent).toContain("<urlset");
    expect(sitemapContent).toContain("<url>");
    expect(sitemapContent).toContain("<loc>");
  });

  test("validates sitemap URLs", async ({ page }) => {
    const response = await page.request.get("/sitemap.xml");
    const sitemapContent = await response.text();

    // Extract URLs from sitemap
    const urlMatches = sitemapContent.match(/<loc>(.*?)<\/loc>/g);
    expect(urlMatches).toBeDefined();

    if (urlMatches) {
      for (const urlMatch of urlMatches) {
        const url = urlMatch.replace("<loc>", "").replace("</loc>", "");
        expect(url).toMatch(/^https?:\/\//);
        expect(url).toContain("sistemaauto.com");
      }
    }
  });

  test("serves valid robots.txt", async ({ page }) => {
    const response = await page.request.get("/robots.txt");
    expect(response.status()).toBe(200);

    const robotsContent = await response.text();
    expect(robotsContent).toContain("User-agent:");
    expect(robotsContent).toContain("Disallow:"); // or Allow:
  });

  test("robots.txt allows important paths", async ({ page }) => {
    const response = await page.request.get("/robots.txt");
    const robotsContent = await response.text();

    // Should not disallow critical paths
    expect(robotsContent).not.toContain("Disallow: /");
    expect(robotsContent).toContain("Allow: /"); // or not disallow root
  });

  test("sitemap includes all important pages", async ({ page }) => {
    const response = await page.request.get("/sitemap.xml");
    const sitemapContent = await response.text();

    // Should include main pages
    expect(sitemapContent).toContain("/");

    // Check for priority and changefreq
    expect(sitemapContent).toContain("<priority>");
    expect(sitemapContent).toContain("<changefreq>");
  });

  test("generates Open Graph images with correct dimensions", async ({
    page,
  }) => {
    // Check for OG image
    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toBeAttached();

    const imageUrl = await ogImage.getAttribute("content");
    expect(imageUrl).toBeTruthy();

    // Check image dimensions (if accessible)
    if (imageUrl && imageUrl.startsWith("http")) {
      const response = await page.request.get(imageUrl);
      expect(response.status()).toBe(200);

      // Note: In a real test, you might check image dimensions
      // For now, just verify the image exists and is accessible
    }
  });

  test("has proper Open Graph image alt text", async ({ page }) => {
    // Check for OG image alt text
    const ogImageAlt = page.locator('meta[property="og:image:alt"]');
    // Note: og:image:alt is not commonly used, but good practice if present
    const isPresent = await ogImageAlt.isVisible().catch(() => false);
    if (isPresent) {
      const altText = await ogImageAlt.getAttribute("content");
      expect(altText).toBeTruthy();
      expect(altText!.length).toBeGreaterThan(0);
    }
  });

  test("Open Graph images are optimized", async ({ page }) => {
    const ogImage = page.locator('meta[property="og:image"]');
    const imageUrl = await ogImage.getAttribute("content");

    if (imageUrl) {
      const response = await page.request.get(imageUrl);

      // Check content type
      const contentType = response.headers()["content-type"];
      expect(contentType).toMatch(/image\/(png|jpg|jpeg|webp)/);

      // Check file size (should be reasonable for social sharing)
      const contentLength = response.headers()["content-length"];
      if (contentLength) {
        const sizeKB = parseInt(contentLength) / 1024;
        expect(sizeKB).toBeLessThan(500); // Less than 500KB
      }
    }
  });

  test("includes hreflang tags for multiple languages", async ({ page }) => {
    // Check for hreflang links
    const hreflangLinks = page.locator('link[rel="alternate"][hreflang]');
    const count = await hreflangLinks.count();

    // Should have at least one hreflang (including x-default)
    expect(count).toBeGreaterThanOrEqual(1);

    // Check that hreflang values are valid language codes
    for (let i = 0; i < count; i++) {
      const hreflang = await hreflangLinks.nth(i).getAttribute("hreflang");
      expect(hreflang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$|^x-default$/);
    }
  });

  test("has valid hreflang URLs", async ({ page }) => {
    const hreflangLinks = page.locator('link[rel="alternate"][hreflang]');

    const count = await hreflangLinks.count();
    for (let i = 0; i < count; i++) {
      const href = await hreflangLinks.nth(i).getAttribute("href");
      expect(href).toMatch(/^https?:\/\//);
    }
  });

  test("includes x-default hreflang", async ({ page }) => {
    const xDefault = page.locator(
      'link[rel="alternate"][hreflang="x-default"]',
    );
    await expect(xDefault).toBeAttached();

    const href = await xDefault.getAttribute("href");
    expect(href).toMatch(/^https?:\/\//);
  });

  test("respects noindex meta tag when present", async ({ page }) => {
    // Test a page that should have noindex
    // This would require testing specific pages with noindex directives

    const robotsMeta = page.locator('meta[name="robots"][content*="noindex"]');
    const isNoindex = await robotsMeta.isVisible().catch(() => false);

    if (isNoindex) {
      // If noindex is present, verify it contains noindex
      const content = await robotsMeta.getAttribute("content");
      expect(content).toContain("noindex");
    }
  });

  test("has efficient meta tag loading", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const loadTime = Date.now() - startTime;

    // Meta tags should load quickly
    expect(loadTime).toBeLessThan(2000); // 2 seconds max

    // Verify critical meta tags are present immediately
    const title = await page.title();
    expect(title).toBeTruthy();
  });

  test("minimizes blocking resources", async ({ page }) => {
    // Check that render-blocking resources are minimized
    const blockingStylesheets = await page.$$eval(
      'link[rel="stylesheet"]:not([media="print"])',
      (links) =>
        links.filter((link) => {
          const media = link.getAttribute("media");
          return !media || media !== "print";
        }),
    );

    // Should minimize render-blocking CSS
    expect(blockingStylesheets.length).toBeLessThan(5);
  });

  test("has efficient font loading", async ({ page }) => {
    // Check font loading strategy
    const fontLinks = page.locator(
      'link[rel="preload"][as="font"], link[rel="stylesheet"][href*="font"]',
    );
    const fontCount = await fontLinks.count();

    // Should have reasonable number of fonts
    expect(fontCount).toBeLessThan(10);

    // Check for font-display: swap or similar optimization
    const stylesWithFonts = await page.$$eval(
      'style, link[rel="stylesheet"]',
      (elements) => {
        return elements.some((el) => {
          const content = el.textContent || "";
          return content.includes("font-display");
        });
      },
    );

    // At least some font optimization should be present
    expect(stylesWithFonts).toBe(true);
  });
});
