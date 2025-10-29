import { test, expect } from "@playwright/test";

test.describe("@smoke conflicting headers", () => {
  test("query tenant overrides when header missing", async ({ page }) => {
    await page.route("**/*", (route) => {
      const headers = {
        ...route.request().headers(),
        "accept-language": "en-US",
      };
      delete (headers as any)["x-tenant"];
      route.continue({ headers });
    });
    await page.goto("/?tenant=acme");
    await expect(page).toHaveURL(/\/acme(\?|$)/);
  });
});
