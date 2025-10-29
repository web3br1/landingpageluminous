import { test, expect } from "@playwright/test";

test.describe("@smoke rewrite root with query tenant", () => {
  test("root + ?tenant=acme rewrites to /acme", async ({ page }) => {
    await page.route("**/*", (route) => {
      route.continue({
        headers: { ...route.request().headers(), "accept-language": "en-US" },
      });
    });
    await page.goto("/?tenant=acme");
    await expect(page).toHaveURL(/\/acme(\?|$)/);
  });
});
