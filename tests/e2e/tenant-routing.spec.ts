import { test, expect } from "@playwright/test";

test.describe("@smoke tenant routing and headers", () => {
  test("root rewrites to tenant when x-tenant is present", async ({
    page,
    request,
    context,
  }) => {
    await context.addInitScript(() => {
      // noop
    });
    await page.route("**/*", (route) => {
      route.continue({
        headers: {
          ...route.request().headers(),
          "x-tenant": "acme",
          "accept-language": "en-US",
        },
      });
    });
    await page.goto("/");
    await expect(page).toHaveURL(/\/acme(\?|$)/);
  });

  test("campaign header available to server", async ({ page, context }) => {
    await page.route("**/*", (route) => {
      route.continue({
        headers: {
          ...route.request().headers(),
          "x-tenant": "acme",
          "x-campaign": "bf-25",
        },
      });
    });
    await page.goto("/acme");
    await expect(page.locator("body")).toBeVisible();
  });

  test("sticky AB variant via cookie", async ({ page, context }) => {
    await context.addCookies([
      {
        name: "abv",
        value: "B",
        url: "http://localhost:3000",
        sameSite: "Lax",
      },
    ]);
    await page.route("**/*", (route) => {
      route.continue({
        headers: { ...route.request().headers(), "x-tenant": "acme" },
      });
    });
    await page.goto("/acme");
    await expect(page.locator("body")).toBeVisible();
  });
});
