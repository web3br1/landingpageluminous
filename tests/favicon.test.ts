import { test, expect } from "@playwright/test";

test.describe("Favicon endpoints", () => {
  test("should serve /favicon.ico without 404", async ({ request }) => {
    const res = await request.get("/favicon.ico");
    expect(res.status()).toBeLessThan(400);
    const type = res.headers()["content-type"] || "";
    expect(type).toMatch(/image\/(x-icon|vnd\.microsoft\.icon|png)/);
  });

  test("should serve /icon.png generated from app/icon.tsx", async ({
    request,
  }) => {
    const res = await request.get("/icon.png");
    expect(res.status()).toBeLessThan(400);
    const type = res.headers()["content-type"] || "";
    expect(type).toMatch(/image\/png/);
  });
});
