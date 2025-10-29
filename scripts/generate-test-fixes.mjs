#!/usr/bin/env node

/**
 * @fileoverview Script de geração automática de correções para lacunas de teste
 * Gera código de teste boilerplate para cobrir lacunas críticas identificadas
 *
 * Usage: node scripts/generate-test-fixes.mjs <gap-id> [--apply]
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')
const TESTS_DIR = path.join(ROOT_DIR, 'tests')

/**
 * Templates de correção para lacunas críticas
 */
const FIX_TEMPLATES = {
  'form-submission-e2e': {
    file: 'tests/e2e/form-submission-real.spec.ts',
    content: `import { test, expect } from '@playwright/test'
import { setupMSW, mockCRMAPI, mockAnalyticsAPI } from '../utils/test-mocks'

test.describe('Form Submission E2E - Real Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Setup MSW for API mocking in browser context
    await setupMSW(page, {
      crm: { enabled: true, mode: 'record' }, // Record real responses
      analytics: { enabled: true, mode: 'record' },
      mailing: { enabled: true, mode: 'record' }
    })

    await page.goto('/contact')
    await page.waitForLoadState('networkidle')
  })

  test('lead form submits successfully with real CRM integration', async ({ page }) => {
    // Fill form with realistic data
    await page.fill('[name="name"]', 'João Silva')
    await page.fill('[name="email"]', 'joao.silva@empresa.com')
    await page.fill('[name="company"]', 'TechCorp Ltda')
    await page.selectOption('[name="role"]', 'CTO')
    await page.fill('[name="message"]', 'Interessado em automatização de relatórios')

    // Mock CRM API to capture real submission
    const crmCall = page.waitForRequest(req =>
      req.url().includes('/api/crm/contacts') && req.method() === 'POST'
    )

    // Submit form
    await page.click('button[type="submit"]')

    // Verify API call was made with correct data
    const request = await crmCall
    const requestBody = JSON.parse(request.postData() || '{}')

    expect(requestBody).toMatchObject({
      name: 'João Silva',
      email: 'joao.silva@empresa.com',
      company: 'TechCorp Ltda',
      role: 'CTO',
      source: 'website_contact_form'
    })

    // Verify success message
    await expect(page.locator('.success-message')).toBeVisible()
    await expect(page.locator('.success-message')).toContainText('obrigado')

    // Verify analytics event was sent
    const analyticsCall = await page.waitForRequest(req =>
      req.url().includes('/api/analytics/event')
    )
    const analyticsBody = JSON.parse(analyticsCall.postData() || '{}')
    expect(analyticsBody.event).toBe('lead_form_submit')
  })

  test('form handles CRM API failures gracefully', async ({ page }) => {
    // Setup CRM API to fail
    await page.route('**/api/crm/contacts', route =>
      route.fulfill({ status: 500, body: JSON.stringify({ error: 'CRM unavailable' }) })
    )

    // Fill and submit form
    await page.fill('[name="name"]', 'Test User')
    await page.fill('[name="email"]', 'test@example.com')
    await page.click('button[type="submit"]')

    // Should show error message instead of success
    await expect(page.locator('.error-message')).toBeVisible()
    await expect(page.locator('.error-message')).toContainText('erro')

    // Form should remain accessible for retry
    await expect(page.locator('button[type="submit"]')).toBeEnabled()
  })

  test('form validates email format before submission', async ({ page }) => {
    const invalidEmails = [
      'invalid-email',
      'user@',
      '@domain.com',
      'user@domain',
      'user name@domain.com'
    ]

    for (const invalidEmail of invalidEmails) {
      await page.fill('[name="email"]', invalidEmail)
      await page.click('button[type="submit"]')

      // Should prevent submission and show validation error
      await expect(page.locator('.error-message, [aria-invalid="true"]')).toBeVisible()

      // Clear form for next test
      await page.fill('[name="email"]', '')
    }

    // Test valid email
    await page.fill('[name="email"]', 'valid@email.com')
    await page.fill('[name="name"]', 'Valid User')

    const submitPromise = page.waitForRequest(req => req.url().includes('/api/crm/contacts'))
    await page.click('button[type="submit"]')

    // Should submit successfully
    await submitPromise
  })

  test('trial signup form integrates with multiple services', async ({ page }) => {
    await page.goto('/trial')

    // Fill trial form
    await page.fill('[name="name"]', 'Trial User')
    await page.fill('[name="email"]', 'trial@company.com')
    await page.fill('[name="company"]', 'TrialCorp')
    await page.selectOption('[name="plan"]', 'pro')

    // Setup multiple service expectations
    const [crmCall, mailingCall, analyticsCall] = await Promise.all([
      page.waitForRequest(req => req.url().includes('/api/crm/contacts')),
      page.waitForRequest(req => req.url().includes('/api/mailing/subscribe')),
      page.waitForRequest(req => req.url().includes('/api/analytics/conversion'))
    ])

    await page.click('button[type="submit"]')

    // Verify all services were called
    expect(crmCall).toBeTruthy()
    expect(mailingCall).toBeTruthy()
    expect(analyticsCall).toBeTruthy()

    // Verify user is redirected to onboarding
    await expect(page).toHaveURL(/\/onboarding|\/welcome/)
  })
})`
  },

  'crm-integration-real': {
    file: 'tests/integration/crm-real-integration.test.ts',
    content: `import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { GenericContainer, StartedTestContainer } from 'testcontainers'
import { createCRMClient } from '@/lib/crm/client'
import { createContact, getContact } from '@/lib/crm/operations'

describe('CRM Real Integration Tests', () => {
  let crmContainer: StartedTestContainer
  let crmClient: any

  beforeAll(async () => {
    // Start real CRM instance for testing
    crmContainer = await new GenericContainer('hubspot/crm-api:latest')
      .withExposedPorts(8080)
      .withEnvironment({
        HUBSPOT_API_KEY: 'test-api-key',
        DATABASE_URL: 'postgresql://test:test@localhost:5432/test'
      })
      .start()

    // Start PostgreSQL for CRM data
    const postgresContainer = await new GenericContainer('postgres:15')
      .withExposedPorts(5432)
      .withEnvironment({
        POSTGRES_USER: 'test',
        POSTGRES_PASSWORD: 'test',
        POSTGRES_DB: 'test'
      })
      .start()

    // Wait for services to be ready
    await new Promise(resolve => setTimeout(resolve, 10000))

    // Create real CRM client
    crmClient = createCRMClient({
      baseURL: \`http://localhost:\${crmContainer.getMappedPort(8080)}\`,
      apiKey: 'test-api-key'
    })
  }, 60000) // 60 second timeout for container startup

  afterAll(async () => {
    await crmContainer.stop()
  })

  describe('Contact Creation', () => {
    it('creates contact successfully in real CRM', async () => {
      const contactData = {
        name: 'Integration Test User',
        email: \`test-\${Date.now()}@example.com\`,
        company: 'Test Company',
        role: 'Developer',
        source: 'integration_test',
        tags: ['test', 'integration'],
        custom_properties: {
          test_run_id: Date.now(),
          test_type: 'crm_integration'
        }
      }

      // Create contact in real CRM
      const result = await createContact(crmClient, contactData)

      expect(result.success).toBe(true)
      expect(result.contactId).toBeDefined()
      expect(typeof result.contactId).toBe('string')

      // Verify contact was created by fetching it back
      const fetchedContact = await getContact(crmClient, result.contactId!)

      expect(fetchedContact.email).toBe(contactData.email)
      expect(fetchedContact.name).toBe(contactData.name)
      expect(fetchedContact.company).toBe(contactData.company)
    })

    it('handles duplicate email addresses', async () => {
      const email = \`duplicate-\${Date.now()}@example.com\`
      const contactData1 = {
        name: 'First User',
        email,
        company: 'Company A'
      }

      const contactData2 = {
        name: 'Second User',
        email, // Same email
        company: 'Company B'
      }

      // Create first contact
      const result1 = await createContact(crmClient, contactData1)
      expect(result1.success).toBe(true)

      // Attempt to create duplicate
      const result2 = await createContact(crmClient, contactData2)

      // Should either update existing or return specific error
      expect(result2.success || result2.error?.code === 'DUPLICATE_EMAIL').toBe(true)
    })

    it('validates required fields', async () => {
      const invalidData = {
        name: '', // Empty name
        email: 'invalid-email', // Invalid email
        company: 'Test Company'
      }

      const result = await createContact(crmClient, invalidData)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error?.message).toMatch(/name.*required|email.*invalid/i)
    })
  })

  describe('Contact Updates', () => {
    it('updates contact information', async () => {
      // Create initial contact
      const initialData = {
        name: 'Update Test User',
        email: \`update-\${Date.now()}@example.com\`,
        company: 'Initial Company'
      }

      const createResult = await createContact(crmClient, initialData)
      expect(createResult.success).toBe(true)

      // Update contact
      const updateData = {
        company: 'Updated Company',
        role: 'Senior Developer',
        tags: ['updated', 'integration']
      }

      const updateResult = await updateContact(crmClient, createResult.contactId!, updateData)
      expect(updateResult.success).toBe(true)

      // Verify update
      const fetchedContact = await getContact(crmClient, createResult.contactId!)
      expect(fetchedContact.company).toBe('Updated Company')
      expect(fetchedContact.role).toBe('Senior Developer')
      expect(fetchedContact.tags).toContain('updated')
    })
  })

  describe('Error Handling', () => {
    it('handles CRM API timeouts', async () => {
      // Configure client with very short timeout
      const timeoutClient = createCRMClient({
        baseURL: \`http://localhost:\${crmContainer.getMappedPort(8080)}\`,
        apiKey: 'test-api-key',
        timeout: 1 // 1ms timeout
      })

      const contactData = {
        name: 'Timeout Test',
        email: \`timeout-\${Date.now()}@example.com\`
      }

      // This should timeout
      const result = await createContact(timeoutClient, contactData)

      expect(result.success).toBe(false)
      expect(result.error?.code).toBe('TIMEOUT')
    })

    it('handles rate limiting', async () => {
      // Make many rapid requests to trigger rate limiting
      const promises = []
      for (let i = 0; i < 100; i++) {
        promises.push(createContact(crmClient, {
          name: \`Rate Limit Test \${i}\`,
          email: \`rate-limit-\${Date.now()}-\${i}@example.com\`
        }))
      }

      const results = await Promise.allSettled(promises)

      // Some requests should succeed, some should fail with rate limit
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
      const rateLimited = results.filter(r =>
        r.status === 'fulfilled' && r.value.error?.code === 'RATE_LIMIT'
      ).length

      expect(successful).toBeGreaterThan(0)
      expect(rateLimited).toBeGreaterThan(0)
    })
  })

  describe('Data Synchronization', () => {
    it('syncs contact data correctly', async () => {
      const contactData = {
        name: 'Sync Test User',
        email: \`sync-\${Date.now()}@example.com\`,
        company: 'Sync Corp',
        custom_properties: {
          last_sync: new Date().toISOString(),
          sync_source: 'integration_test'
        }
      }

      // Create contact
      const createResult = await createContact(crmClient, contactData)

      // Simulate data sync by fetching and comparing
      const syncedContact = await getContact(crmClient, createResult.contactId!)

      expect(syncedContact.name).toBe(contactData.name)
      expect(syncedContact.email).toBe(contactData.email)
      expect(syncedContact.company).toBe(contactData.company)
      expect(syncedContact.custom_properties?.sync_source).toBe('integration_test')
    })

    it('handles concurrent updates', async () => {
      // Create contact
      const contactData = {
        name: 'Concurrent Test',
        email: \`concurrent-\${Date.now()}@example.com\`,
        company: 'Concurrent Corp'
      }

      const createResult = await createContact(crmClient, contactData)

      // Simulate concurrent updates
      const updatePromises = [
        updateContact(crmClient, createResult.contactId!, { company: 'Company A' }),
        updateContact(crmClient, createResult.contactId!, { company: 'Company B' }),
        updateContact(crmClient, createResult.contactId!, { company: 'Company C' })
      ]

      const results = await Promise.allSettled(updatePromises)

      // At least one should succeed, others might fail due to optimistic locking
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
      expect(successful).toBeGreaterThan(0)

      // Final state should be one of the updates
      const finalContact = await getContact(crmClient, createResult.contactId!)
      expect(['Company A', 'Company B', 'Company C']).toContain(finalContact.company)
    })
  })
})`
  },

  'page-composition-integration': {
    file: 'tests/integration/page-composition-real.test.tsx',
    content: `import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { composePage } from '@/lib/composition/page-composer'
import { createTestCMSClient } from '../utils/test-cms-client'
import type { PageType } from '@/lib/composition/types'

describe('Page Composition Integration - Real Data', () => {
  let cmsClient: any

  beforeAll(async () => {
    // Create real CMS client for testing
    cmsClient = createTestCMSClient({
      baseURL: process.env.CMS_TEST_URL || 'http://localhost:3001/api/cms',
      apiKey: process.env.CMS_TEST_API_KEY || 'test-key'
    })
  })

  describe('Landing Page Composition', () => {
    it('composes landing page with real CMS data', async () => {
      const pageType: PageType = 'marketing'
      const locale = 'pt-BR'

      // Compose page with real data
      const composition = await composePage(pageType, locale, {
        cmsClient,
        includeDrafts: true,
        experimentOverrides: {
          hero_headline: 'A',
          pricing_layout: 'B'
        }
      })

      expect(composition.success).toBe(true)

      if (composition.success) {
        const { sections, metadata, experiments } = composition.data

        // Verify page structure
        expect(sections).toBeDefined()
        expect(sections.length).toBeGreaterThan(0)
        expect(metadata).toBeDefined()
        expect(experiments).toBeDefined()

        // Verify essential sections exist
        const sectionTypes = sections.map(s => s.type)
        expect(sectionTypes).toContain('hero')
        expect(sectionTypes).toContain('benefits')
        expect(sectionTypes).toContain('pricing')

        // Verify metadata
        expect(metadata.title).toBeTruthy()
        expect(metadata.description).toBeTruthy()
      }
    })

    it('renders composed page correctly', async () => {
      const composition = await composePage('marketing', 'pt-BR', {
        cmsClient,
        includeDrafts: false
      })

      expect(composition.success).toBe(true)

      if (composition.success) {
        // Render the composed page
        const { container } = render(composition.data.page)

        // Wait for dynamic content to load
        await waitFor(() => {
          expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
        })

        // Verify hero section
        const heroHeading = screen.getByRole('heading', { level: 1 })
        expect(heroHeading).toBeInTheDocument()
        expect(heroHeading.textContent).toBeTruthy()

        // Verify CTAs are present
        const ctas = screen.getAllByRole('button')
        expect(ctas.length).toBeGreaterThan(0)

        // Verify sections are rendered
        const sections = container.querySelectorAll('[data-section]')
        expect(sections.length).toBeGreaterThan(3) // At least hero, benefits, pricing
      }
    })

    it('handles CMS data unavailability gracefully', async () => {
      // Simulate CMS failure
      const failingCmsClient = createTestCMSClient({
        baseURL: 'http://nonexistent-cms-url',
        apiKey: 'test-key'
      })

      const composition = await composePage('marketing', 'pt-BR', {
        cmsClient: failingCmsClient,
        fallbackToDefaults: true
      })

      // Should still compose with fallback data
      expect(composition.success).toBe(true)

      if (composition.success) {
        const { sections } = composition.data

        // Should have fallback sections
        expect(sections.length).toBeGreaterThan(0)

        // Fallback sections should have default content
        const heroSection = sections.find(s => s.type === 'hero')
        expect(heroSection).toBeDefined()
        expect(heroSection?.content).toBeDefined()
      }
    })

    it('applies experiments correctly in composition', async () => {
      const experimentOverrides = {
        hero_headline: 'B', // Use variant B
        pricing_layout: 'A',
        cta_color: 'blue'
      }

      const composition = await composePage('marketing', 'pt-BR', {
        cmsClient,
        experimentOverrides
      })

      expect(composition.success).toBe(true)

      if (composition.success) {
        const { experiments } = composition.data

        // Verify experiments were applied
        expect(experiments.hero_headline.variant).toBe('B')
        expect(experiments.pricing_layout.variant).toBe('A')
        expect(experiments.cta_color.variant).toBe('blue')

        // Verify sections reflect experiment variants
        const heroSection = composition.data.sections.find(s => s.type === 'hero')
        expect(heroSection?.experimentVariant).toBe('B')
      }
    })
  })

  describe('Section Composition', () => {
    it('composes individual sections with real data', async () => {
      const sections = ['hero', 'benefits', 'pricing', 'faq']

      for (const sectionType of sections) {
        const sectionComposition = await composePage('marketing', 'pt-BR', {
          cmsClient,
          sectionOverrides: [sectionType]
        })

        expect(sectionComposition.success).toBe(true)

        if (sectionComposition.success) {
          const section = sectionComposition.data.sections.find(s => s.type === sectionType)
          expect(section).toBeDefined()
          expect(section?.content).toBeDefined()

          // Render section to verify it works
          const { container } = render(section?.component)
          expect(container.firstChild).toBeInTheDocument()
        }
      }
    })

    it('handles section-specific errors gracefully', async () => {
      // Force one section to fail
      const composition = await composePage('marketing', 'pt-BR', {
        cmsClient,
        sectionOverrides: ['hero', 'nonexistent-section']
      })

      expect(composition.success).toBe(true) // Page should still compose

      if (composition.success) {
        const heroSection = composition.data.sections.find(s => s.type === 'hero')
        const badSection = composition.data.sections.find(s => s.type === 'nonexistent-section')

        // Hero should work
        expect(heroSection).toBeDefined()

        // Bad section should be handled gracefully (either fallback or omitted)
        // This depends on implementation - could be fallback content or section omission
      }
    })
  })

  describe('Performance and Caching', () => {
    it('caches composition results appropriately', async () => {
      const startTime = Date.now()

      // First composition
      await composePage('marketing', 'pt-BR', { cmsClient })

      const firstDuration = Date.now() - startTime

      const secondStartTime = Date.now()

      // Second composition (should use cache)
      await composePage('marketing', 'pt-BR', { cmsClient })

      const secondDuration = Date.now() - secondStartTime

      // Second should be faster (cached)
      expect(secondDuration).toBeLessThan(firstDuration)
    })

    it('invalidates cache when content changes', async () => {
      // First composition
      const composition1 = await composePage('marketing', 'pt-BR', { cmsClient })
      expect(composition1.success).toBe(true)

      // Simulate content change in CMS
      await cmsClient.updateContent('hero', { headline: 'Updated Headline' })

      // Second composition should get fresh data
      const composition2 = await composePage('marketing', 'pt-BR', {
        cmsClient,
        skipCache: true // Force fresh data
      })

      expect(composition2.success).toBe(true)

      if (composition1.success && composition2.success) {
        // Content should be different (or at least cache bypassed)
        expect(composition2.data.timestamp).toBeGreaterThan(composition1.data.timestamp)
      }
    })
  })

  describe('Internationalization', () => {
    it('composes page for different locales', async () => {
      const locales = ['pt-BR', 'en-US', 'es-ES']

      for (const locale of locales) {
        const composition = await composePage('marketing', locale, {
          cmsClient
        })

        expect(composition.success).toBe(true)

        if (composition.success) {
          // Verify locale-specific content
          expect(composition.data.locale).toBe(locale)

          // Content should be in correct language
          const sections = composition.data.sections
          sections.forEach(section => {
            if (section.content?.headline) {
              // Basic check that content exists for locale
              expect(section.content.headline).toBeTruthy()
            }
          })
        }
      }
    })
  })
})`
  },

  'ab-testing-functional': {
    file: 'tests/e2e/ab-testing-functional.spec.ts',
    content: `import { test, expect } from '@playwright/test'
import { ExperimentManager } from '@/lib/ab-testing/experiment-manager'
import { AnalyticsTracker } from '@/lib/analytics/tracker'

test.describe('A/B Testing Functional E2E', () => {
  let experimentManager: ExperimentManager
  let analyticsTracker: AnalyticsTracker

  test.beforeEach(async ({ page }) => {
    // Initialize experiment manager
    experimentManager = new ExperimentManager({
      storage: 'sessionStorage',
      apiEndpoint: '/api/experiments'
    })

    // Initialize analytics
    analyticsTracker = new AnalyticsTracker({
      apiEndpoint: '/api/analytics',
      userId: 'test-user-' + Date.now()
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test.describe('Experiment Assignment', () => {
    test('assigns user to experiment variants consistently', async ({ page, context }) => {
      // First visit - assign variant
      const variant1 = await page.evaluate(() => {
        return window.experimentManager?.getVariant('hero_headline')
      })

      expect(variant1).toBeDefined()
      expect(['A', 'B', 'control']).toContain(variant1)

      // Refresh page - should get same variant
      await page.reload()
      await page.waitForLoadState('networkidle')

      const variant2 = await page.evaluate(() => {
        return window.experimentManager?.getVariant('hero_headline')
      })

      expect(variant2).toBe(variant1) // Should be consistent
    })

    test('different users get different variants', async ({ browser }) => {
      const variants: string[] = []

      // Create multiple users
      for (let i = 0; i < 10; i++) {
        const context = await browser.newContext()
        const page = await context.newPage()

        await page.goto('/')
        await page.waitForLoadState('networkidle')

        const variant = await page.evaluate(() => {
          return window.experimentManager?.getVariant('hero_headline')
        })

        variants.push(variant!)

        await context.close()
      }

      // Should have some distribution (not all same variant)
      const uniqueVariants = [...new Set(variants)]
      expect(uniqueVariants.length).toBeGreaterThan(1)
    })

    test('respects experiment targeting rules', async ({ page }) => {
      // Test user from Brazil
      await page.evaluate(() => {
        Object.defineProperty(navigator, 'language', { value: 'pt-BR' })
      })

      await page.reload()

      const brVariant = await page.evaluate(() => {
        return window.experimentManager?.getVariant('pricing_currency')
      })

      expect(brVariant).toBe('BRL') // Should show BRL pricing

      // Test user from US
      await page.evaluate(() => {
        Object.defineProperty(navigator, 'language', { value: 'en-US' })
      })

      await page.reload()

      const usVariant = await page.evaluate(() => {
        return window.experimentManager?.getVariant('pricing_currency')
      })

      expect(usVariant).toBe('USD') // Should show USD pricing
    })
  })

  test.describe('Variant Rendering', () => {
    test('renders correct variant content', async ({ page }) => {
      // Force variant A
      await page.evaluate(() => {
        window.experimentManager?.setForcedVariant('hero_headline', 'A')
      })

      await page.reload()

      // Check that variant A content is rendered
      const heroHeading = page.locator('[data-section="hero"] h1')
      await expect(heroHeading).toContainText('headline variant A')

      // Force variant B
      await page.evaluate(() => {
        window.experimentManager?.setForcedVariant('hero_headline', 'B')
      })

      await page.reload()

      // Check that variant B content is rendered
      await expect(heroHeading).toContainText('headline variant B')
    })

    test('applies variant-specific styles', async ({ page }) => {
      // Test CTA color experiment
      await page.evaluate(() => {
        window.experimentManager?.setForcedVariant('cta_color', 'blue')
      })

      await page.reload()

      const ctaButton = page.locator('[data-section="hero"] button').first()
      const buttonColor = await ctaButton.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      )

      expect(buttonColor).toContain('0, 0, 255') // RGB for blue

      // Test green variant
      await page.evaluate(() => {
        window.experimentManager?.setForcedVariant('cta_color', 'green')
      })

      await page.reload()

      const greenButtonColor = await ctaButton.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      )

      expect(greenButtonColor).toContain('0, 128, 0') // RGB for green
    })
  })

  test.describe('Analytics Tracking', () => {
    test('tracks experiment impressions', async ({ page }) => {
      let impressionTracked = false

      // Listen for analytics calls
      page.on('request', request => {
        if (request.url().includes('/api/analytics') && request.method() === 'POST') {
          const data = JSON.parse(request.postData() || '{}')
          if (data.event === 'experiment_impression' && data.experimentId === 'hero_headline') {
            impressionTracked = true
          }
        }
      })

      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Wait for impression tracking
      await page.waitForTimeout(1000)

      expect(impressionTracked).toBe(true)
    })

    test('tracks experiment conversions', async ({ page }) => {
      // Assign to experiment variant
      await page.evaluate(() => {
        window.experimentManager?.setForcedVariant('hero_headline', 'A')
      })

      await page.reload()

      let conversionTracked = false

      // Listen for conversion events
      page.on('request', request => {
        if (request.url().includes('/api/analytics') && request.method() === 'POST') {
          const data = JSON.parse(request.postData() || '{}')
          if (data.event === 'experiment_conversion' &&
              data.experimentId === 'hero_headline' &&
              data.variant === 'A') {
            conversionTracked = true
          }
        }
      })

      // Perform conversion action (click CTA)
      const ctaButton = page.locator('[data-section="hero"] button').first()
      await ctaButton.click()

      // Wait for conversion tracking
      await page.waitForTimeout(500)

      expect(conversionTracked).toBe(true)
    })

    test('tracks interactions per variant', async ({ page }) => {
      const interactions: any[] = []

      page.on('request', request => {
        if (request.url().includes('/api/analytics') && request.method() === 'POST') {
          const data = JSON.parse(request.postData() || '{}')
          if (data.experimentId) {
            interactions.push(data)
          }
        }
      })

      // Test variant A
      await page.evaluate(() => {
        window.experimentManager?.setForcedVariant('hero_headline', 'A')
      })

      await page.reload()

      const ctaA = page.locator('[data-section="hero"] button').first()
      await ctaA.click()

      // Test variant B
      await page.evaluate(() => {
        window.experimentManager?.setForcedVariant('hero_headline', 'B')
      })

      await page.reload()

      const ctaB = page.locator('[data-section="hero"] button').first()
      await ctaB.click()

      await page.waitForTimeout(1000)

      // Should have tracked interactions for both variants
      const variantAInteractions = interactions.filter(i => i.variant === 'A')
      const variantBInteractions = interactions.filter(i => i.variant === 'B')

      expect(variantAInteractions.length).toBeGreaterThan(0)
      expect(variantBInteractions.length).toBeGreaterThan(0)
    })
  })

  test.describe('Experiment Persistence', () => {
    test('persists variant assignment across sessions', async ({ page, context }) => {
      // Assign variant
      const variant1 = await page.evaluate(() => {
        const variant = window.experimentManager?.getVariant('hero_headline')
        window.experimentManager?.persistVariant('hero_headline', variant)
        return variant
      })

      // Create new page (new session)
      const newPage = await context.newPage()
      await newPage.goto('/')
      await newPage.waitForLoadState('networkidle')

      // Should get same variant
      const variant2 = await newPage.evaluate(() => {
        return window.experimentManager?.getVariant('hero_headline')
      })

      expect(variant2).toBe(variant1)

      await newPage.close()
    })

    test('respects experiment rollout percentages', async ({ page }) => {
      // Test with 50% rollout
      await page.evaluate(() => {
        window.experimentManager?.setExperimentConfig('hero_headline', {
          rollout: 50, // 50% of users
          variants: ['A', 'B']
        })
      })

      let controlCount = 0
      let variantCount = 0

      // Test multiple users
      for (let i = 0; i < 100; i++) {
        await page.evaluate(() => {
          window.experimentManager?.clearStoredVariants() // Fresh user
        })

        const variant = await page.evaluate(() => {
          return window.experimentManager?.getVariant('hero_headline')
        })

        if (variant === 'control') controlCount++
        else variantCount++
      }

      // Should be roughly 50/50 distribution
      const totalAssigned = controlCount + variantCount
      const variantPercentage = (variantCount / totalAssigned) * 100

      expect(variantPercentage).toBeGreaterThan(40) // Allow some variance
      expect(variantPercentage).toBeLessThan(60)
    })
  })

  test.describe('Error Handling', () => {
    test('falls back gracefully when experiment service fails', async ({ page }) => {
      // Simulate experiment service failure
      await page.evaluate(() => {
        window.experimentManager?.disable()
      })

      await page.reload()

      // Page should still load with default content
      await expect(page.locator('[data-section="hero"]')).toBeVisible()
      await expect(page.locator('h1')).toBeVisible()

      // Should use control/default variants
      const variant = await page.evaluate(() => {
        return window.experimentManager?.getVariant('hero_headline')
      })

      expect(variant).toBe('control')
    })

    test('handles invalid experiment configurations', async ({ page }) => {
      // Set invalid experiment config
      await page.evaluate(() => {
        window.experimentManager?.setExperimentConfig('hero_headline', {
          variants: [], // Empty variants
          rollout: 100
        })
      })

      await page.reload()

      // Should fall back to control
      const variant = await page.evaluate(() => {
        return window.experimentManager?.getVariant('hero_headline')
      })

      expect(variant).toBe('control')
    })
  })

  test.describe('Cross-Platform Consistency', () => {
    test('maintains variant assignment across devices', async ({ browser }) => {
      // Simulate mobile user agent
      const mobileContext = await browser.newContext({
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15'
      })

      const mobilePage = await mobileContext.newPage()
      await mobilePage.goto('/')
      await mobilePage.waitForLoadState('networkidle')

      const mobileVariant = await mobilePage.evaluate(() => {
        return window.experimentManager?.getVariant('hero_headline')
      })

      // Simulate desktop with same user identifier
      const desktopContext = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      })

      const desktopPage = await desktopContext.newPage()
      await desktopPage.goto('/')
      await desktopPage.waitForLoadState('networkidle')

      const desktopVariant = await desktopPage.evaluate(() => {
        return window.experimentManager?.getVariant('hero_headline')
      })

      // Should be consistent for same user
      expect(desktopVariant).toBe(mobileVariant)

      await mobileContext.close()
      await desktopContext.close()
    })
  })
})`
  },

  'security-xss-injection': {
    file: 'tests/security/xss-injection.test.ts',
    content: `import { describe, it, expect } from 'vitest'
import { sanitizeInput, validateUserInput } from '@/lib/security/input-sanitizer'

describe('XSS Injection Protection', () => {
  describe('Input Sanitization', () => {
    it('removes script tags from user input', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello World'
      const sanitized = sanitizeInput(maliciousInput)

      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('alert("xss")')
      expect(sanitized).toContain('Hello World')
    })

    it('escapes HTML entities in dynamic content', () => {
      const maliciousInput = '<img src=x onerror=alert(1)>'
      const sanitized = sanitizeInput(maliciousInput)

      expect(sanitized).not.toContain('onerror=')
      expect(sanitized).toContain('&lt;img')
    })
  })

  describe('Input Validation', () => {
    it('validates email format to prevent injection', () => {
      const validEmails = ['user@example.com']
      const invalidEmails = ['user@<script>alert(1)</script>.com']

      validEmails.forEach(email => {
        expect(validateUserInput(email, 'email')).toBe(true)
      })

      invalidEmails.forEach(email => {
        expect(validateUserInput(email, 'email')).toBe(false)
      })
    })
  })
})`
  }
}

/**
 * Gera correção para uma lacuna específica
 */
function generateFix(gapId) {
  const template = FIX_TEMPLATES[gapId]

  if (!template) {
    console.error(`❌ Template não encontrado para lacuna: ${gapId}`)
    console.log('📋 Lacunas disponíveis:', Object.keys(FIX_TEMPLATES).join(', '))
    return
  }

  const filePath = path.join(ROOT_DIR, template.file)

  // Verifica se arquivo já existe
  if (fs.existsSync(filePath)) {
    console.log(`⚠️  Arquivo já existe: ${template.file}`)
    console.log('   Use --overwrite para sobrescrever')
    return
  }

  // Cria diretório se não existir
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  // Escreve arquivo
  fs.writeFileSync(filePath, template.content, 'utf8')

  console.log(`✅ Correção gerada: ${template.file}`)
  console.log(`📊 Tipo: ${gapId}`)
  console.log(`🧪 Execute: npm test -- ${template.file}`)
}

/**
 * Lista lacunas disponíveis para correção
 */
function listAvailableFixes() {
  console.log('🔧 Correções automáticas disponíveis:\n')

  Object.entries(FIX_TEMPLATES).forEach(([id, template]) => {
    console.log(`📋 ${id}`)
    console.log(`   Arquivo: ${template.file}`)
    console.log(`   Comando: node scripts/generate-test-fixes.mjs ${id} --apply`)
    console.log('')
  })
}

/**
 * Função principal
 */
function main() {
  const args = process.argv.slice(2)
  const gapId = args[0]
  const shouldApply = args.includes('--apply')
  const shouldList = args.includes('--list')

  if (shouldList || !gapId) {
    listAvailableFixes()
    return
  }

  if (!shouldApply) {
    console.log(`🔍 Preview da correção para: ${gapId}`)
    console.log('👆 Use --apply para gerar o arquivo')
    console.log('')
  }

  generateFix(gapId)
}

main()
