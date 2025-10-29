import { test } from "@playwright/test";
import { hardStabilize } from "./utils/stabilize";
import {
  mockCoreRoutes,
  mockSignupSuccess,
  mockSignupInvalidEmail,
  mockDemoOk,
} from "./utils/mock-routes";

test.describe("E2E Example with Playwright Mocks", () => {
  test.beforeEach(async ({ page }) => {
    await hardStabilize(page);
    await mockCoreRoutes(page);
  });

  test("successful signup flow", async ({ page }) => {
    await mockSignupSuccess(page);
    await page.goto("/signup");

    // Preencher formulário
    await page.getByLabel("Nome completo").fill("João Silva");
    await page.getByLabel("E-mail profissional").fill("joao.silva@email.com");
    await page.getByRole("button", { name: /Enviar mensagem/i }).click();

    // Verificar sucesso
    await expect(page.getByTestId("form-success")).toBeVisible();
    await expect(page.getByText("Mensagem enviada com sucesso!")).toBeVisible();
  });

  test("handles signup validation errors", async ({ page }) => {
    await mockSignupInvalidEmail(page);
    await page.goto("/signup");

    // Preencher com email inválido
    await page.getByLabel("Nome completo").fill("João");
    await page.getByLabel("E-mail profissional").fill("invalid-email");
    await page.getByRole("button", { name: /Enviar mensagem/i }).click();

    // Verificar erro tratado
    await expect(page.getByTestId("form-error")).toHaveText(/E-mail inválido/i);
  });

  test("demo request flow", async ({ page }) => {
    await mockDemoOk(page);
    await page.goto("/signup"); // Navigate to signup page which uses demo variant

    // Preencher formulário de demo
    await page.getByLabel("Nome completo").fill("Maria Santos");
    await page.getByLabel("E-mail profissional").fill("maria@techcorp.com");
    await page.getByLabel("Empresa").fill("TechCorp");
    await page.getByRole("button", { name: /Enviar mensagem/i }).click();

    // Verificar confirmação
    await expect(page.getByTestId("form-success")).toBeVisible();
    await expect(page.getByText("Mensagem enviada com sucesso!")).toBeVisible();
  });
});
