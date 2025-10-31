import { test, expect } from '@playwright/test'

test.describe('{{FEATURE_NAME}} - E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Setup common state for all tests
    await page.goto('/')

    // Wait for critical elements to load
    await page.waitForSelector('[data-testid="page-renderer"]')

    // Accept cookies if banner appears
    const cookieBanner = page.locator('[data-testid="cookie-banner"]')
    if (await cookieBanner.isVisible()) {
      await page.click('[data-testid="accept-cookies"]')
    }
  })

  test('deve carregar página completa com sucesso', async ({ page }) => {
    // Verify page loaded successfully
    await expect(page).toHaveTitle(/DataFlow Brasil/)

    // Verify hero section is visible
    await expect(page.locator('[data-section="hero"]')).toBeVisible()

    // Verify main content areas are present
    await expect(page.locator('[data-section="benefits"]')).toBeVisible()
    await expect(page.locator('[data-section="features"]')).toBeVisible()
    await expect(page.locator('[data-section="pricing"]')).toBeVisible()

    // Verify no console errors
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    await page.waitForTimeout(2000) // Wait for potential errors
    expect(errors.length).toBe(0)
  })

  test('deve navegar corretamente entre seções', async ({ page }) => {
    // Test smooth scrolling to sections
    const benefitsSection = page.locator('[data-section="benefits"]')

    // Click on navigation link or scroll to section
    await page.evaluate(() => {
      document.querySelector('[data-section="benefits"]')?.scrollIntoView()
    })

    // Verify section is in viewport
    await expect(benefitsSection).toBeInViewport()

    // Test other sections
    const sections = ['features', 'pricing', 'faq', 'final-cta']
    for (const sectionId of sections) {
      const section = page.locator(`[data-section="${sectionId}"]`)
      await page.evaluate((id) => {
        document.querySelector(`[data-section="${id}"]`)?.scrollIntoView()
      }, sectionId)

      await expect(section).toBeInViewport()
    }
  })

  test.describe('CTA Conversions', () => {
    test('deve permitir interação com CTA principal', async ({ page }) => {
      // Find primary CTA button
      const primaryCTA = page.locator('[data-tracking="primary-cta"]').first()

      await expect(primaryCTA).toBeVisible()
      await expect(primaryCTA).toBeEnabled()

      // Click should trigger expected behavior (form open, navigation, etc.)
      await primaryCTA.click()

      // Verify expected outcome
      // This will vary based on the actual CTA behavior
      await expect(page.url()).toMatch(/signup|demo|contact/)
    })

    test('deve permitir interação com CTA secundário', async ({ page }) => {
      const secondaryCTA = page.locator('[data-tracking="secondary-cta"]').first()

      await expect(secondaryCTA).toBeVisible()
      await expect(secondaryCTA).toBeEnabled()

      await secondaryCTA.click()

      // Verify expected outcome for secondary CTA
      await expect(page.locator('[data-testid="demo-modal"]')).toBeVisible()
    })
  })

  test.describe('Responsividade', () => {
    test('deve funcionar corretamente em desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })

      // Verify desktop layout
      await expect(page.locator('.grid-cols-2')).toBeVisible() // Desktop grid

      // Test hover states
      const button = page.locator('[data-tracking="primary-cta"]').first()
      await button.hover()
      await expect(button).toHaveCSS('transform', /scale|translate/)
    })

    test('deve funcionar corretamente em mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      // Verify mobile layout
      await expect(page.locator('.grid-cols-1')).toBeVisible() // Mobile stack

      // Test touch interactions
      const button = page.locator('[data-tracking="primary-cta"]').first()
      await button.tap()

      // Verify mobile-specific behavior
      await expect(page.locator('[data-testid="mobile-menu"]')).not.toBeVisible()
    })

    test('deve funcionar corretamente em tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })

      // Verify tablet layout - may use desktop or mobile styles
      await expect(page.locator('[data-section="hero"]')).toBeVisible()

      // Test tablet-specific interactions if any
    })
  })

  test.describe('Acessibilidade', () => {
    test('deve ter navegação por teclado funcional', async ({ page }) => {
      // Start from page beginning
      await page.keyboard.press('Tab')

      // First focusable element should be visible
      const focusedElement = page.locator(':focus')
      await expect(focusedElement).toBeVisible()

      // Navigate through focusable elements
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab')
        const currentFocus = page.locator(':focus')
        await expect(currentFocus).toBeVisible()
      }
    })

    test('deve ter hierarquia de cabeçalhos correta', async ({ page }) => {
      const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents()

      // Should have H1
      const h1Headings = page.locator('h1')
      await expect(h1Headings).toHaveCount(1)

      // H2 should follow H1, etc.
      const h2Headings = page.locator('h2')
      expect(await h2Headings.count()).toBeGreaterThan(0)
    })

    test('deve ter imagens com alt text', async ({ page }) => {
      const images = page.locator('img')
      const imageCount = await images.count()

      for (let i = 0; i < imageCount; i++) {
        const alt = await images.nth(i).getAttribute('alt')
        expect(alt).toBeTruthy()
        expect(alt?.length).toBeGreaterThan(0)
      }
    })

    test('deve ter contraste de cores adequado', async ({ page }) => {
      // This would typically use axe-playwright or similar
      // For now, check basic contrast manually

      const heroText = page.locator('[data-testid="hero-text-block"]')
      const backgroundColor = await heroText.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      )
      const textColor = await heroText.evaluate(el =>
        window.getComputedStyle(el).color
      )

      // Basic check - ensure colors are different
      expect(backgroundColor).not.toBe(textColor)
    })
  })

  test.describe('Performance', () => {
    test('deve carregar em tempo razoável', async ({ page }) => {
      const startTime = Date.now()

      await page.goto('/')
      await page.waitForSelector('[data-testid="page-renderer"]')

      const loadTime = Date.now() - startTime

      // Should load within reasonable time (adjust based on requirements)
      expect(loadTime).toBeLessThan(5000) // 5 seconds
    })

    test('deve ser interativo rapidamente', async ({ page }) => {
      await page.goto('/')

      const startTime = Date.now()

      // Click on first interactive element
      await page.click('[data-tracking="primary-cta"]')

      const responseTime = Date.now() - startTime

      // Should respond within 100ms
      expect(responseTime).toBeLessThan(100)
    })

    test('não deve ter layout shift significativo', async ({ page }) => {
      await page.goto('/')

      // Monitor layout shifts
      let maxShift = 0
      page.on('metrics', (metrics) => {
        if (metrics.layoutShift) {
          maxShift = Math.max(maxShift, metrics.layoutShift.value)
        }
      })

      // Navigate through page
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight)
      })

      await page.waitForTimeout(2000)

      // Layout shift should be minimal
      expect(maxShift).toBeLessThan(0.1)
    })
  })

  test.describe('Funcionalidades Avançadas', () => {
    test('deve suportar experimentos A/B', async ({ page }) => {
      // Test different variants if applicable
      const heroHeadline = page.locator('h1').first()

      // Should have some headline text
      await expect(heroHeadline).toBeVisible()
      expect(await heroHeadline.textContent()).toBeTruthy()
    })

    test('deve funcionar com consentimento de cookies', async ({ page }) => {
      // Reset cookie consent
      await page.context().clearCookies()

      await page.goto('/')

      // Should show cookie banner
      await expect(page.locator('[data-testid="cookie-banner"]')).toBeVisible()

      // Accept cookies
      await page.click('[data-testid="accept-cookies"]')

      // Banner should disappear
      await expect(page.locator('[data-testid="cookie-banner"]')).not.toBeVisible()
    })

    test('deve suportar múltiplos idiomas', async ({ page }) => {
      // Test language switching if applicable
      // This depends on your i18n implementation

      const currentUrl = page.url()

      // If language switching is implemented, test it here
      if (currentUrl.includes('/pt') || currentUrl.includes('/en')) {
        // Test language-specific content
        await expect(page.locator('text="some translated text"')).toBeVisible()
      }
    })
  })
})
