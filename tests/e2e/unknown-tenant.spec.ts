import { test, expect } from "@playwright/test";

test.describe("@smoke unknown tenant fallback", () => {
  test("navigates to not-found for unknown tenant", async ({ page }) => {
    const response = await page.goto("/tenant-inexistente");
    expect(response?.status()).toBe(404);
  });
});
