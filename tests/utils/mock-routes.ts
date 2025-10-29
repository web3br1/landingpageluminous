import { Page } from "@playwright/test";

export async function mockCoreRoutes(page: Page) {
  // Feature flags estáveis
  await page.route("**/api/feature-flags", (r) =>
    r.fulfill({
      json: {
        abVariant: "A",
        geo: "BR",
        reducedMotion: true,
        userBucket: 1,
        experiments: {},
      },
      headers: { "content-type": "application/json" },
    }),
  );

  // Hero
  await page.route("**/api/hero", (r) =>
    r.fulfill({
      json: {
        title: "Você cria. A IA constrói.",
        subtitle: "Transforme suas ideias em apps com IA.",
        cta: "Começar teste grátis",
        variant: "default",
      },
      headers: { "content-type": "application/json" },
    }),
  );

  // Benefits
  await page.route("**/api/benefits", (r) =>
    r.fulfill({
      json: [
        {
          id: "automation",
          title: "Automação Total",
          description: "Elimine tarefas repetitivas",
        },
        {
          id: "ai",
          title: "IA Avançada",
          description: "Insights em tempo real",
        },
        {
          id: "security",
          title: "Segurança",
          description: "Proteção enterprise",
        },
      ],
      headers: { "content-type": "application/json" },
    }),
  );

  // Pricing
  await page.route("**/api/pricing", (r) =>
    r.fulfill({
      json: {
        plans: [
          {
            id: "starter",
            name: "Starter",
            price: 29,
            features: ["1 usuário", "10GB"],
          },
          {
            id: "pro",
            name: "Pro",
            price: 99,
            features: ["5 usuários", "100GB"],
            popular: true,
          },
          {
            id: "enterprise",
            name: "Enterprise",
            price: 299,
            features: ["Ilimitado", "Ilimitado"],
          },
        ],
      },
      headers: { "content-type": "application/json" },
    }),
  );
}

export async function mockSignupSuccess(page: Page) {
  await page.route("**/api/signup", (r) =>
    r.fulfill({
      json: { ok: true, userId: "e2e-123" },
      headers: { "content-type": "application/json" },
    }),
  );
}

export async function mockSignupInvalidEmail(page: Page) {
  await page.route("**/api/signup", (r) =>
    r.fulfill({
      status: 400,
      json: { error: "invalid_email" },
      headers: { "content-type": "application/json" },
    }),
  );
}

export async function mockDemoOk(page: Page) {
  await page.route("**/api/demo-request", (r) =>
    r.fulfill({
      json: { ok: true, demoId: "demo-123" },
      headers: { "content-type": "application/json" },
    }),
  );
}

export async function mockNetwork500(page: Page) {
  await page.route("**/api/unstable", (r) =>
    r.fulfill({
      status: 500,
      json: { message: "server error" },
      headers: { "content-type": "application/json" },
    }),
  );
}
