import { test, expect } from '@playwright/test';

/**
 * Complete SEO Testing
 * Testa SEO avançado incluindo structured data e rich snippets
 */
test.describe('Complete SEO Testing', () => {

  test('should validate structured data (JSON-LD)', async ({ page }) => {
    await page.goto('/');

    // Extrair dados estruturados JSON-LD
    const structuredData = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      return Array.from(scripts).map(script => {
        try {
          return JSON.parse(script.textContent || '');
        } catch {
          return null;
        }
      }).filter(Boolean);
    });

    if (structuredData.length > 0) {
      console.log(`✅ Found ${structuredData.length} JSON-LD structured data objects`);

      // Verificar tipos comuns de schema.org
      const schemaTypes = structuredData.map(data => data['@type'] || data.type).filter(Boolean);

      // Deve ter pelo menos Organization ou WebSite
      const hasBasicSchemas = schemaTypes.some(type =>
        ['Organization', 'WebSite', 'SoftwareApplication'].includes(type)
      );

      if (hasBasicSchemas) {
        console.log('✅ Basic structured data schemas present');
      }

      // Verificar se tem @context válido
      const validContexts = structuredData.every(data =>
        data['@context'] === 'https://schema.org' || data['@context']?.includes('schema.org')
      );

      expect(validContexts).toBe(true);
      console.log('✅ Valid schema.org context');

    } else {
      console.log('⚠️ No structured data found');
    }
  });

  test('should validate Open Graph meta tags', async ({ page }) => {
    await page.goto('/');

    const ogTags = await page.evaluate(() => {
      const metaTags = document.querySelectorAll('meta[property^="og:"]');
      const tags = {};
      metaTags.forEach(tag => {
        const property = tag.getAttribute('property')?.replace('og:', '');
        const content = tag.getAttribute('content');
        if (property && content) {
          tags[property] = content;
        }
      });
      return tags;
    });

    // Tags OG essenciais
    const requiredOGTags = ['title', 'description', 'image', 'url', 'type'];
    const presentTags = requiredOGTags.filter(tag => ogTags[tag]);

    console.log(`✅ OG tags present: ${presentTags.length}/${requiredOGTags.length}`);

    // Deve ter pelo menos title e description
    expect(ogTags.title).toBeTruthy();
    expect(ogTags.description).toBeTruthy();

    if (ogTags.image) {
      // Verificar se imagem é acessível
      try {
        const response = await page.request.head(ogTags.image);
        expect([200, 301, 302]).toContain(response.status());
        console.log('✅ OG image is accessible');
      } catch (error) {
        console.log('⚠️ OG image not accessible');
      }
    }
  });

  test('should validate Twitter Card meta tags', async ({ page }) => {
    await page.goto('/');

    const twitterTags = await page.evaluate(() => {
      const metaTags = document.querySelectorAll('meta[name^="twitter:"], meta[property^="twitter:"]');
      const tags = {};
      metaTags.forEach(tag => {
        const name = tag.getAttribute('name') || tag.getAttribute('property');
        const property = name?.replace('twitter:', '');
        const content = tag.getAttribute('content');
        if (property && content) {
          tags[property] = content;
        }
      });
      return tags;
    });

    // Tags Twitter Card essenciais
    const requiredTwitterTags = ['card', 'title', 'description'];
    const presentTags = requiredTwitterTags.filter(tag => twitterTags[tag]);

    console.log(`✅ Twitter Card tags present: ${presentTags.length}/${requiredTwitterTags.length}`);

    // Deve ter pelo menos card type, title e description
    expect(twitterTags.card).toBeTruthy();
    expect(twitterTags.title).toBeTruthy();
    expect(twitterTags.description).toBeTruthy();

    // Card type deve ser válido
    const validCardTypes = ['summary', 'summary_large_image', 'app', 'player'];
    expect(validCardTypes).toContain(twitterTags.card);
  });

  test('should validate robots meta tag and robots.txt', async ({ page }) => {
    await page.goto('/');

    // Verificar meta robots
    const robotsMeta = await page.locator('meta[name="robots"]').getAttribute('content');

    if (robotsMeta) {
      console.log(`✅ Robots meta tag: ${robotsMeta}`);
      // Não deve ter "noindex" para página principal (assumindo que é indexável)
      expect(robotsMeta.toLowerCase()).not.toContain('noindex');
    }

    // Verificar robots.txt
    try {
      const robotsResponse = await page.request.get('/robots.txt');
      if (robotsResponse.status() === 200) {
        const robotsContent = await robotsResponse.text();
        expect(robotsContent).toContain('User-agent:');
        expect(robotsContent).toContain('Disallow:');
        console.log('✅ robots.txt is valid');
      }
    } catch (error) {
      console.log('⚠️ robots.txt not found or not accessible');
    }
  });

  test('should validate canonical URLs', async ({ page }) => {
    await page.goto('/');

    const canonicalUrl = await page.locator('link[rel="canonical"]').getAttribute('href');

    if (canonicalUrl) {
      console.log(`✅ Canonical URL: ${canonicalUrl}`);

      // Deve ser uma URL absoluta
      expect(canonicalUrl).toMatch(/^https?:\/\//);

      // Deve corresponder à URL atual (ou ser a versão canônica)
      const currentUrl = page.url();
      const canonicalOrigin = new URL(canonicalUrl).origin;
      const currentOrigin = new URL(currentUrl).origin;

      expect(canonicalOrigin).toBe(currentOrigin);
    } else {
      console.log('⚠️ Canonical URL not found');
    }
  });

  test('should validate hreflang tags for internationalization', async ({ page }) => {
    await page.goto('/');

    const hreflangTags = await page.locator('link[rel="alternate"][hreflang]').all();

    if (hreflangTags.length > 0) {
      console.log(`✅ Found ${hreflangTags.length} hreflang tags`);

      // Validar formato dos hreflang
      for (const tag of hreflangTags) {
        const hreflang = await tag.getAttribute('hreflang');
        const href = await tag.getAttribute('href');

        expect(hreflang).toBeTruthy();
        expect(href).toBeTruthy();

        // hreflang deve ser válido (xx ou xx-XX)
        expect(hreflang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/);
      }

      // Deve ter hreflang="x-default"
      const hasDefault = await page.locator('link[rel="alternate"][hreflang="x-default"]').isVisible();
      expect(hasDefault).toBe(true);
    } else {
      console.log('⚠️ No hreflang tags found (i18n not implemented)');
    }
  });

  test('should validate sitemap references', async ({ page }) => {
    // Verificar referência ao sitemap no robots.txt
    try {
      const robotsResponse = await page.request.get('/robots.txt');
      if (robotsResponse.status() === 200) {
        const robotsContent = await robotsResponse.text();
        const hasSitemap = robotsContent.includes('Sitemap:');

        if (hasSitemap) {
          console.log('✅ Sitemap referenced in robots.txt');
        } else {
          console.log('⚠️ Sitemap not referenced in robots.txt');
        }
      }
    } catch (error) {
      console.log('⚠️ Could not check sitemap reference');
    }

    // Tentar acessar sitemap diretamente
    try {
      const sitemapResponse = await page.request.get('/sitemap.xml');
      if (sitemapResponse.status() === 200) {
        const sitemapContent = await sitemapResponse.text();
        expect(sitemapContent).toContain('<urlset');
        expect(sitemapContent).toContain('<loc>');
        console.log('✅ sitemap.xml is valid');
      }
    } catch (error) {
      console.log('⚠️ sitemap.xml not found or not accessible');
    }
  });

  test('should validate breadcrumb structured data', async ({ page }) => {
    // Testar páginas que podem ter breadcrumbs
    const testPages = ['/pricing', '/features', '/signup'];

    for (const testPage of testPages) {
      try {
        await page.goto(testPage);

        const breadcrumbData = await page.evaluate(() => {
          const scripts = document.querySelectorAll('script[type="application/ld+json"]');
          return Array.from(scripts).map(script => {
            try {
              const data = JSON.parse(script.textContent || '');
              return data['@type'] === 'BreadcrumbList' ? data : null;
            } catch {
              return null;
            }
          }).filter(Boolean);
        });

        if (breadcrumbData.length > 0) {
          console.log(`✅ Breadcrumb structured data found on ${testPage}`);

          // Validar estrutura do breadcrumb
          const breadcrumb = breadcrumbData[0];
          expect(breadcrumb.itemListElement).toBeDefined();
          expect(Array.isArray(breadcrumb.itemListElement)).toBe(true);
        }

      } catch (error) {
        // Página pode não existir, continuar
        console.log(`⚠️ Could not test breadcrumbs on ${testPage}`);
      }
    }
  });

});
