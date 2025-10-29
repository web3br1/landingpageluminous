import { test, expect } from '@playwright/test';

/**
 * Critical Path E2E Tests
 * Tests essential user journeys that must always work
 */
test.describe('Critical User Paths', () => {

  test('@critical-path should complete landing page to signup flow', async ({ page }) => {
    // Start timing for critical path measurement
    const startTime = Date.now();

    // 1. Land on homepage
    await page.goto('/');
    await expect(page).toHaveTitle(/.*SaaS.*/);

    // 2. Verify hero section loads
    await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();

    // 3. Click primary CTA (should lead to signup)
    const ctaButton = page.locator('[data-testid="hero-cta"]').first();
    await expect(ctaButton).toBeVisible();
    await ctaButton.click();

    // 4. Should navigate to signup page
    await page.waitForURL('**/signup');
    await expect(page).toHaveURL(/.*signup.*/);

    // 5. Verify signup form loads
    await expect(page.locator('[data-testid="signup-form"]')).toBeVisible();

    // 6. Fill out signup form
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.fill('[data-testid="name-input"]', 'Test User');

    // 7. Submit form
    await page.click('[data-testid="signup-submit"]');

    // 8. Should redirect to dashboard or confirmation
    await page.waitForURL((url) => !url.pathname.includes('/signup'));
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();

    // Measure critical path duration
    const duration = Date.now() - startTime;
    console.log(`🚀 Critical path completed in ${duration}ms`);

    // Assert reasonable performance (should complete within 10 seconds)
    expect(duration).toBeLessThan(10000);
  });

  test('@critical-path should handle pricing to checkout flow', async ({ page }) => {
    const startTime = Date.now();

    // 1. Go to pricing page
    await page.goto('/pricing');
    await expect(page).toHaveTitle(/.*Pricing.*/);

    // 2. Select a plan
    const proPlan = page.locator('[data-testid="pricing-card-pro"]');
    await expect(proPlan).toBeVisible();
    await proPlan.click();

    // 3. Click checkout CTA
    const checkoutButton = page.locator('[data-testid="checkout-cta"]');
    await expect(checkoutButton).toBeVisible();
    await checkoutButton.click();

    // 4. Should navigate to checkout
    await page.waitForURL('**/checkout');
    await expect(page.locator('[data-testid="checkout-form"]')).toBeVisible();

    // 5. Fill checkout form (without real payment)
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="card-expiry"]', '1230');
    await page.fill('[data-testid="card-cvc"]', '123');
    await page.fill('[data-testid="billing-name"]', 'Test User');

    // 6. Submit payment
    await page.click('[data-testid="complete-payment"]');

    // 7. Should show success or redirect
    await page.waitForURL((url) => !url.pathname.includes('/checkout'));
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();

    const duration = Date.now() - startTime;
    console.log(`💳 Checkout path completed in ${duration}ms`);
    expect(duration).toBeLessThan(15000); // 15 seconds for payment flow
  });

  test('@critical-path should handle mobile critical flow', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    const startTime = Date.now();

    // 1. Mobile homepage
    await page.goto('/');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();

    // 2. Open mobile menu
    await page.click('[data-testid="mobile-menu-toggle"]');
    await expect(page.locator('[data-testid="mobile-menu-content"]')).toBeVisible();

    // 3. Navigate to signup via mobile menu
    await page.click('[data-testid="mobile-signup-link"]');
    await page.waitForURL('**/signup');

    // 4. Complete mobile signup
    await page.fill('[data-testid="email-input"]', 'mobile@example.com');
    await page.fill('[data-testid="password-input"]', 'MobilePass123!');
    await page.click('[data-testid="signup-submit"]');

    await page.waitForURL((url) => !url.pathname.includes('/signup'));

    const duration = Date.now() - startTime;
    console.log(`📱 Mobile critical path completed in ${duration}ms`);
    expect(duration).toBeLessThan(12000);
  });

  test('@critical-path should handle error recovery in critical flows', async ({ page }) => {
    // 1. Try to access protected route without auth
    await page.goto('/dashboard');
    await page.waitForURL('**/login');

    // 2. Should redirect to login
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

    // 3. Try invalid login
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-submit"]');

    // 4. Should show error but not crash
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-form"]')).toBeVisible();

    // 5. Try valid login
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'TestPass123!');
    await page.click('[data-testid="login-submit"]');

    // 6. Should succeed
    await page.waitForURL('**/dashboard');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  });

});
