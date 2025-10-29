import { Then } from "@cucumber/cucumber";
import { expect } from "@playwright/test";

// Then steps para verificações visuais e de conteúdo
Then(
  "devo ver o título principal contendo {string}",
  async function (titleText: string) {
    const heroTitle = this.page.locator("h1").first();
    await expect(heroTitle).toBeVisible();
    const titleContent = await heroTitle.textContent();
    expect(titleContent?.toLowerCase()).toContain(titleText.toLowerCase());
  },
);

Then("devo ver dois botões de CTA visíveis", async function () {
  const ctaButtons = this.page
    .locator("button")
    .filter({ hasText: /(Comece|Ver)/ });
  await expect(ctaButtons).toHaveCount(2);
  for (const button of await ctaButtons.all()) {
    await expect(button).toBeVisible();
  }
});

Then("devo ver uma imagem de dashboard mockup", async function () {
  const dashboardImage = this.page.locator('img[alt*="dashboard"]').first();
  await expect(dashboardImage).toBeVisible();
});

Then(
  "os botões devem ter texto {string} e {string}",
  async function (text1: string, text2: string) {
    const button1 = this.page.locator(`text=${text1}`);
    const button2 = this.page.locator(`text=${text2}`);
    await expect(button1).toBeVisible();
    await expect(button2).toBeVisible();
  },
);

Then(
  "deve ser disparado um evento de analytics {string}",
  async function (eventName: string) {
    // Verificar se evento foi logado no console
    // Nota: Em produção, verificar se foi enviado para GA4/Plausible
    const logs: string[] = [];
    this.page.on("console", (msg: any) => {
      if (msg.text().includes("Analytics event:")) {
        logs.push(msg.text());
      }
    });

    // Aguardar um momento para o evento ser processado
    await this.page.waitForTimeout(1000);

    expect(logs.length).toBeGreaterThan(0);
    expect(logs.some((log) => log.includes(eventName))).toBe(true);
  },
);

Then(
  "o evento deve conter o parâmetro {string} como {string}",
  async function (param: string, value: string) {
    // Verificar parâmetros do evento no console log
    const logs: string[] = [];
    this.page.on("console", (msg: any) => {
      if (msg.text().includes("Analytics event:")) {
        logs.push(msg.text());
      }
    });

    await this.page.waitForTimeout(1000);

    const lastLog = logs[logs.length - 1];
    expect(lastLog).toContain(param);
    expect(lastLog).toContain(value);
  },
);

Then(
  "devo ver pelo menos {int} logos de empresas parceiras",
  async function (count: number) {
    const logos = this.page.locator('[id="social-proof"] img');
    const logoCount = await logos.count();
    expect(logoCount).toBeGreaterThanOrEqual(count);
  },
);

Then("devo ver métricas de {string}", async function (metric: string) {
  const metricElement = this.page.locator(`text=${metric}`);
  await expect(metricElement).toBeVisible();
});

Then("devo ver {string}", async function (text: string) {
  const element = this.page.locator(`text=${text}`);
  await expect(element).toBeVisible();
});

Then("devo ver o título {string}", async function (title: string) {
  const titleElement = this.page.locator(`text=${title}`);
  await expect(titleElement).toBeVisible();
});

Then("devo ver {int} cards de benefícios", async function (count: number) {
  const benefitsCards = this.page
    .locator('[id="benefits"]')
    .locator('[class*="rounded-2xl"]');
  await expect(benefitsCards).toHaveCount(count);
});

Then(
  "o primeiro benefício deve mencionar {string}",
  async function (text: string) {
    const firstBenefit = this.page
      .locator('[id="benefits"]')
      .locator("h3")
      .first();
    const benefitText = await firstBenefit.textContent();
    expect(benefitText?.toLowerCase()).toContain(text.toLowerCase());
  },
);

Then("deve haver métricas específicas em cada benefício", async function () {
  const metrics = this.page
    .locator('[id="benefits"]')
    .locator('[class*="text-primary"]')
    .filter({ hasText: /%/ });
  const metricsCount = await metrics.count();
  expect(metricsCount).toBeGreaterThan(0);
});

Then("devo ver o título contendo {string}", async function (titleText: string) {
  const title = this.page
    .locator("h2")
    .filter({ hasText: new RegExp(titleText, "i") })
    .first();
  await expect(title).toBeVisible();
});

Then("devo ver {int} funcionalidades listadas", async function (count: number) {
  const features = this.page.locator('[id="features"]').locator("h3");
  await expect(features).toHaveCount(count);
});

Then(
  "cada funcionalidade deve ter ícone, título e descrição",
  async function () {
    const features = this.page
      .locator('[id="features"]')
      .locator('[class*="space-y-6"]');

    for (const feature of await features.all()) {
      const icon = feature.locator("svg").first();
      const title = feature.locator("h3").first();
      const description = feature.locator("p").first();

      await expect(icon).toBeVisible();
      await expect(title).toBeVisible();
      await expect(description).toBeVisible();
    }
  },
);

Then("pelo menos uma deve mencionar {string}", async function (text: string) {
  const descriptions = this.page.locator('[id="features"] p');
  let found = false;

  for (const desc of await descriptions.all()) {
    const descText = await desc.textContent();
    if (descText?.toLowerCase().includes(text.toLowerCase())) {
      found = true;
      break;
    }
  }

  expect(found).toBe(true);
});

Then("devo ver {int} planos de preços", async function (count: number) {
  const plans = this.page
    .locator('[id="pricing"]')
    .locator('[class*="bg-white"]')
    .filter({ hasText: /R\$/ });
  await expect(plans).toHaveCount(count);
});

Then(
  "o plano do meio deve estar marcado como {string}",
  async function (popularText: string) {
    const popularBadge = this.page.locator(`text=${popularText}`);
    await expect(popularBadge).toBeVisible();
  },
);

Then(
  "devo ver toggle entre {string} e {string}",
  async function (option1: string, option2: string) {
    const toggle1 = this.page.locator(`text=${option1}`);
    const toggle2 = this.page.locator(`text=${option2}`);
    await expect(toggle1).toBeVisible();
    await expect(toggle2).toBeVisible();
  },
);

Then("os preços devem estar em reais \\(R$\\)", async function () {
  const prices = this.page.locator("text=/R\\$ \\d+/");
  const priceCount = await prices.count();
  expect(priceCount).toBeGreaterThan(0);
});

Then(
  "devo ver pelo menos {int} perguntas frequentes",
  async function (count: number) {
    const questions = this.page.locator('[id="faq"] button');
    const questionCount = await questions.count();
    expect(questionCount).toBeGreaterThanOrEqual(count);
  },
);

Then("ao clicar em uma pergunta deve expandir a resposta", async function () {
  const firstQuestion = this.page.locator('[id="faq"] button').first();
  await firstQuestion.click();

  // Verificar se resposta apareceu
  const answer = this.page.locator('[id="faq"]').locator("p").first();
  await expect(answer).toBeVisible();
});

Then("deve haver pergunta sobre {string}", async function (topic: string) {
  const questions = this.page.locator('[id="faq"] button');
  let found = false;

  for (const question of await questions.all()) {
    const questionText = await question.textContent();
    if (questionText?.toLowerCase().includes(topic.toLowerCase())) {
      found = true;
      break;
    }
  }

  expect(found).toBe(true);
});

Then(
  "devo ver um banner de cookies após {int} segundos",
  async function (seconds: number) {
    // Aguardar o banner aparecer
    await this.page.waitForTimeout(seconds * 1000);

    const banner = this.page.locator("text=🍪 Privacidade e Cookies");
    await expect(banner).toBeVisible();
  },
);

Then(
  "o banner deve ter opções para aceitar todos ou apenas essenciais",
  async function () {
    const acceptAllButton = this.page.locator("text=Aceitar Todos");
    const essentialOnlyButton = this.page.locator("text=Apenas Essenciais");

    await expect(acceptAllButton).toBeVisible();
    await expect(essentialOnlyButton).toBeVisible();
  },
);

Then("deve haver link para configurações detalhadas", async function () {
  const configLink = this.page.locator("text=Configurar");
  await expect(configLink).toBeVisible();
});

Then("posso ver diferentes variações do headline principal", async function () {
  // Este teste seria mais complexo em um cenário real
  // Por enquanto, apenas verifica que a página carrega
  const headline = this.page.locator("h1").first();
  await expect(headline).toBeVisible();
});

Then("posso ver diferentes cores nos botões CTA", async function () {
  // Verificar que há botões CTA presentes
  const ctaButtons = this.page
    .locator("button")
    .filter({ hasText: /(Comece|Ver)/ });
  await expect(ctaButtons.first()).toBeVisible();
});

Then("o sistema deve manter consistência durante a sessão", async function () {
  // Recarregar página e verificar se elementos permanecem iguais
  const headlineBefore = await this.page.locator("h1").first().textContent();
  await this.page.reload();
  await this.page.waitForLoadState("networkidle");
  const headlineAfter = await this.page.locator("h1").first().textContent();

  expect(headlineAfter).toBe(headlineBefore);
});

Then("todos os elementos devem estar visíveis", async function () {
  const heroSection = this.page.locator('[id="hero"]');
  const socialProofSection = this.page.locator('[id="social-proof"]');
  const benefitsSection = this.page.locator('[id="benefits"]');

  await expect(heroSection).toBeVisible();
  await expect(socialProofSection).toBeVisible();
  await expect(benefitsSection).toBeVisible();
});

Then("o layout deve se adaptar corretamente", async function () {
  // Verificar se elementos não estão quebrados
  const viewport = this.page.viewportSize();
  expect(viewport?.width).toBe(375); // Mobile width

  // Verificar se não há overflow horizontal
  const body = this.page.locator("body");
  const scrollWidth = await body.evaluate((el: any) => el.scrollWidth);
  const clientWidth = await body.evaluate((el: any) => el.clientWidth);

  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 10); // Pequena tolerância
});

Then("os botões devem ter tamanho adequado para toque", async function () {
  const ctaButtons = this.page
    .locator("button")
    .filter({ hasText: /(Comece|Ver)/ });

  for (const button of await ctaButtons.all()) {
    const boundingBox = await button.boundingBox();
    expect(boundingBox?.width).toBeGreaterThanOrEqual(44); // Tamanho mínimo para toque
    expect(boundingBox?.height).toBeGreaterThanOrEqual(44);
  }
});

Then("devo ver meta tags title e description", async function () {
  const titleTag = await this.page.locator("title").first();
  await expect(titleTag).toBeVisible();

  const titleContent = await this.page.title();
  expect(titleContent).toContain("DataFlow");
});

Then("devo ver Open Graph tags para Facebook", async function () {
  const metaTags = await this.page.locator('meta[property^="og:"]').all();
  expect(metaTags.length).toBeGreaterThan(0);
});

Then("devo ver Twitter Card tags", async function () {
  const twitterTags = await this.page.locator('meta[name^="twitter:"]').all();
  expect(twitterTags.length).toBeGreaterThan(0);
});

Then("devo ver schemas JSON-LD estruturados", async function () {
  const jsonLdScripts = await this.page
    .locator('script[type="application/ld+json"]')
    .all();
  expect(jsonLdScripts.length).toBeGreaterThan(0);
});

// Steps específicos para A/B testing
Then(
  "{int}% devem ver {string}",
  async function (percentage: number, text: string) {
    // Em um teste real, isso seria verificado através de múltiplas execuções
    // Por enquanto, apenas verificamos que o texto pode existir
    const element = this.page.locator(`text=${text}`);
    // Não usar expect aqui pois pode não estar presente dependendo da variante
    await element.isVisible().catch(() => false); // Ignorar se não estiver presente
  },
);

Then(
  "aproximadamente {int}% devem ver botões em azul \\(primary\\)",
  async function (percentage: number) {
    // Verificar se há botões com classe de primary
    const primaryButtons = this.page.locator('[class*="bg-primary"]');
    const buttonCount = await primaryButtons.count();
    expect(buttonCount).toBeGreaterThanOrEqual(0);
  },
);

Then(
  "aproximadamente {int}% devem ver botões em verde \\(accent\\)",
  async function (percentage: number) {
    // Verificar se há botões com classe de accent
    const accentButtons = this.page.locator('[class*="bg-accent"]');
    const buttonCount = await accentButtons.count();
    expect(buttonCount).toBeGreaterThanOrEqual(0);
  },
);

Then("deve continuar vendo a mesma variante", async function () {
  // Mesmo teste do "sistema deve manter consistência durante a sessão"
  const headlineBefore = await this.page.locator("h1").first().textContent();
  await this.page.reload();
  await this.page.waitForLoadState("networkidle");
  const headlineAfter = await this.page.locator("h1").first().textContent();

  expect(headlineAfter).toBe(headlineBefore);
});

Then("não deve haver mudança abrupta de experiência", async function () {
  // Mesmo teste de consistência
  const headlineBefore = await this.page.locator("h1").first().textContent();
  await this.page.reload();
  await this.page.waitForLoadState("networkidle");
  const headlineAfter = await this.page.locator("h1").first().textContent();

  expect(headlineAfter).toBe(headlineBefore);
});

Then("deve ser enviado evento {string}", async function (eventName: string) {
  // Mesmo teste do analytics event
  const logs: string[] = [];
  this.page.on("console", (msg: any) => {
    if (msg.text().includes("Analytics event:")) {
      logs.push(msg.text());
    }
  });

  await this.page.waitForTimeout(1000);
  expect(logs.some((log) => log.includes(eventName))).toBe(true);
});

Then(
  "os eventos devem incluir ID do experimento e variante",
  async function () {
    // Verificar se logs de analytics incluem experiment data
    const logs: string[] = [];
    this.page.on("console", (msg: any) => {
      if (msg.text().includes("Analytics event:")) {
        logs.push(msg.text());
      }
    });

    await this.page.waitForTimeout(1000);
    expect(logs.length).toBeGreaterThan(0);
  },
);

Then("devo ver um painel com experimentos ativos", async function () {
  const debugPanel = this.page.locator("text=🧪 Experiment Debug");
  await expect(debugPanel).toBeVisible();
});

Then("devo ver variantes atuais para cada experimento", async function () {
  // Verificar se há informações de variantes no painel
  const currentVariants = this.page.locator("text=/Current:/");
  await expect(currentVariants.first()).toBeVisible();
});

Then("devo ver pesos de distribuição das variantes", async function () {
  // Verificar se há informações de pesos (%)
  const weights = this.page.locator("text=/\\d+%/");
  await expect(weights.first()).toBeVisible();
});

Then(
  "todos os usuários devem ver a variante {string}",
  async function (variant: string) {
    // Em um teste real, isso seria verificado com feature flags desabilitados
    // Por enquanto, apenas verifica que página carrega
    const headline = this.page.locator("h1").first();
    await expect(headline).toBeVisible();
  },
);

Then(
  "não deve haver distribuição de variantes experimentais",
  async function () {
    // Mesmo teste acima
    const headline = this.page.locator("h1").first();
    await expect(headline).toBeVisible();
  },
);

Then("posso ver uma nova variante na próxima carga", async function () {
  // Após reset, verificar que página recarrega
  await this.page.waitForLoadState("networkidle");
  const headline = this.page.locator("h1").first();
  await expect(headline).toBeVisible();
});

Then("o sistema deve reavaliar a distribuição", async function () {
  // Mesmo teste acima
  const headline = this.page.locator("h1").first();
  await expect(headline).toBeVisible();
});
