# 🧪 BDD e Testes - Landing Page SaaS

> Guia completo para Behavior-Driven Development (BDD) no projeto Luminaris.
> Cenários Gherkin, pirâmide de testes e práticas de qualidade.

## 📋 Visão Geral

O sistema utiliza **BDD (Behavior-Driven Development)** para especificar e validar comportamentos através de:

- **Cenários Gherkin**: Linguagem natural executável
- **Pirâmide de testes**: Unit → Integration → E2E
- **Testes contratuais**: Validação de interfaces e APIs
- **Cobertura automatizada**: Gates obrigatórios em PRs

## 🎯 Cenários Gherkin

### Estrutura Padrão

```gherkin
# domains/marketing/docs/marketing.feature

Feature: Landing Page Marketing Content

  Background:
    Given the marketing system is initialized
    And the user locale is "pt-BR"

  @unit @marketing
  Scenario: Display hero section successfully
    Given the hero content is available
    When the user visits the landing page
    Then the hero headline should be displayed
    And the hero CTA should be clickable
    And the hero should match the design specifications

  @integration @marketing @experiment
  Scenario: Apply hero headline experiment
    Given an A/B test is configured for hero headline
    And the user is in variant "A"
    When the hero content is composed
    Then the variant "A" headline should be displayed
    And the experiment impression should be tracked

  @contract @marketing
  Scenario: Validate hero content contract
    Given the hero composer is called
    When the composition completes
    Then the response should match the HeroContent schema
    And all required fields should be present
    And no unexpected fields should be present
```

### Tags e Organização

```gherkin
# Tags obrigatórias por tipo de teste
@unit        # Testes de unidade (funções puras, entidades)
@integration # Testes de integração (adapters, serviços externos)
@contract    # Testes contratuais (schemas Zod, interfaces)
@e2e         # Testes end-to-end (Playwright)
@smoke       # Testes de fumaça (regressão crítica)

# Tags por contexto
@marketing   # Contexto de marketing
@shared      # Infraestrutura compartilhada

# Tags especiais
@experiment  # Testes de A/B testing
@performance # Testes de performance
@accessibility # Testes de acessibilidade
```

## 🏗️ Pirâmide de Testes

### 1. Unit Tests (Base)

```typescript
// modules/marketing/domain/entities/__tests__/hero-content.test.ts
import { describe, it, expect } from 'vitest'
import { HeroContent } from '../hero-content'

describe('HeroContent', () => {
  describe('validation', () => {
    it('should create valid hero content', () => {
      const content = HeroContent.create({
        headline: 'Automatize seus relatórios',
        subheadline: 'Em minutos, não dias',
        ctaText: 'Comece grátis'
      })

      expect(content.isSuccess()).toBe(true)
      expect(content.value.headline).toBe('Automatize seus relatórios')
    })

    it('should reject invalid headline', () => {
      const content = HeroContent.create({
        headline: '', // inválido
        subheadline: 'Em minutos, não dias',
        ctaText: 'Comece grátis'
      })

      expect(content.isError()).toBe(true)
      expect(content.error.message).toContain('headline')
    })
  })

  describe('business rules', () => {
    it('should enforce headline length limits', () => {
      const longHeadline = 'A'.repeat(101) // muito longo
      const content = HeroContent.create({
        headline: longHeadline,
        subheadline: 'Test',
        ctaText: 'CTA'
      })

      expect(content.isError()).toBe(true)
    })
  })
})
```

### 2. Integration Tests (Meio)

```typescript
// modules/marketing/infrastructure/__tests__/content-repo.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ContentRepositoryImpl } from '../content-repo-impl'
import { createTestDatabase } from '@tests/utils/test-db'

describe('ContentRepository', () => {
  let repo: ContentRepositoryImpl
  let db: TestDatabase

  beforeEach(async () => {
    db = await createTestDatabase()
    repo = new ContentRepositoryImpl(db.connection)
  })

  afterEach(async () => {
    await db.cleanup()
  })

  describe('getHeroContent', () => {
    it('should return hero content for valid locale', async () => {
      // Setup
      await db.seedHeroContent('pt-BR', {
        headline: 'Test Headline',
        subheadline: 'Test Subheadline',
        ctaText: 'Test CTA'
      })

      // Execute
      const result = await repo.getHeroContent('pt-BR')

      // Verify
      expect(result.isSuccess()).toBe(true)
      expect(result.value.headline).toBe('Test Headline')
    })

    it('should fallback to default locale when locale not found', async () => {
      // Setup
      await db.seedHeroContent('en', {
        headline: 'Default Headline',
        subheadline: 'Default Subheadline',
        ctaText: 'Default CTA'
      })

      // Execute
      const result = await repo.getHeroContent('fr') // não existe

      // Verify
      expect(result.isSuccess()).toBe(true)
      expect(result.value.headline).toBe('Default Headline')
    })
  })
})
```

### 3. Contract Tests (Interface)

```typescript
// packages/shared-contracts/__tests__/hero-contract.test.ts
import { describe, it, expect } from 'vitest'
import { heroContentSchema } from '../hero-content-schema'
import { zodToJsonSchema } from 'zod-to-json-schema'

describe('Hero Content Contract', () => {
  const validHeroContent = {
    headline: 'Automatize seus relatórios em minutos',
    subheadline: 'Transforme dados em insights acionáveis',
    ctaText: 'Comece grátis',
    ctaHref: '/signup',
    backgroundImage: '/hero-bg.jpg',
    metrics: [
      { label: 'Usuários ativos', value: '10k+' },
      { label: 'Tempo economizado', value: '60%' }
    ]
  }

  describe('schema validation', () => {
    it('should accept valid hero content', () => {
      const result = heroContentSchema.safeParse(validHeroContent)
      expect(result.success).toBe(true)
    })

    it('should reject missing required fields', () => {
      const invalidContent = { ...validHeroContent }
      delete invalidContent.headline

      const result = heroContentSchema.safeParse(invalidContent)
      expect(result.success).toBe(false)
      expect(result.error.issues[0].path).toContain('headline')
    })

    it('should enforce field constraints', () => {
      const invalidContent = {
        ...validHeroContent,
        headline: 'A'.repeat(201) // muito longo
      }

      const result = heroContentSchema.safeParse(invalidContent)
      expect(result.success).toBe(false)
    })
  })

  describe('JSON schema generation', () => {
    it('should generate valid JSON schema', () => {
      const jsonSchema = zodToJsonSchema(heroContentSchema)
      expect(jsonSchema).toHaveProperty('$schema')
      expect(jsonSchema).toHaveProperty('type', 'object')
      expect(jsonSchema.properties).toHaveProperty('headline')
    })

    it('should include all required fields', () => {
      const jsonSchema = zodToJsonSchema(heroContentSchema)
      expect(jsonSchema.required).toContain('headline')
      expect(jsonSchema.required).toContain('subheadline')
      expect(jsonSchema.required).toContain('ctaText')
    })
  })
})
```

### 4. E2E Tests (Topo)

```typescript
// tests/e2e/marketing/landing-page.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should load hero section correctly', async ({ page }) => {
    // Hero section
    const heroHeadline = page.locator('[data-testid="hero-headline"]')
    await expect(heroHeadline).toBeVisible()
    await expect(heroHeadline).toContainText('Automatize')

    // CTA button
    const ctaButton = page.locator('[data-testid="hero-cta"]')
    await expect(ctaButton).toBeVisible()
    await expect(ctaButton).toContainText('Comece grátis')

    // Click CTA
    await ctaButton.click()
    await expect(page).toHaveURL(/\/signup/)
  })

  test('should display pricing plans', async ({ page }) => {
    // Scroll to pricing
    await page.locator('[data-testid="pricing-section"]').scrollIntoViewIfNeeded()

    // Check plans
    const starterPlan = page.locator('[data-testid="plan-starter"]')
    await expect(starterPlan).toBeVisible()
    await expect(starterPlan).toContainText('Starter')

    const proPlan = page.locator('[data-testid="plan-pro"]')
    await expect(proPlan).toBeVisible()
    await expect(proPlan).toContainText('Mais Popular')
  })

  test('should submit contact form', async ({ page }) => {
    // Fill form
    await page.fill('[data-testid="contact-name"]', 'João Silva')
    await page.fill('[data-testid="contact-email"]', 'joao@example.com')
    await page.fill('[data-testid="contact-message"]', 'Gostaria de uma demo')

    // Submit
    await page.click('[data-testid="contact-submit"]')

    // Check success message
    const successMessage = page.locator('[data-testid="contact-success"]')
    await expect(successMessage).toBeVisible()
    await expect(successMessage).toContainText('Mensagem enviada')
  })
})
```

## 🔧 Execução de Testes

### Comandos Principais

```bash
# Todos os testes
pnpm test

# Apenas unitários
pnpm test:unit

# Apenas integração
pnpm test:integration

# Apenas contratos
pnpm test:contract

# Apenas E2E
pnpm test:e2e

# Com watch mode
pnpm test:watch

# Com coverage
pnpm test:coverage
```

### Scripts PowerShell

```powershell
# Verificações completas
.\dev.ps1 -Command check

# Testes unitários
.\dev.ps1 -Command test
```

### Filtros por Tag

```bash
# Apenas testes de marketing
pnpm test --grep @marketing

# Apenas testes unitários
pnpm test --grep @unit

# Testes de contrato
pnpm test --grep @contract
```

## 📊 Cobertura e Qualidade

### Métricas de Cobertura

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '**/*.d.ts',
        '**/*.config.*',
        'coverage/',
        '.next/'
      ],
      thresholds: {
        global: {
          statements: 80,
          branches: 75,
          functions: 80,
          lines: 80
        }
      }
    }
  }
})
```

### Gates de Qualidade

```typescript
// tools/tdd/gates/test-gate.ts
export async function runTestGate() {
  const results = await Promise.all([
    runUnitTests(),
    runIntegrationTests(),
    runContractTests(),
    runE2ETests(),
    checkCoverage()
  ])

  const allPassed = results.every(r => r.passed)
  const coverage = results.find(r => r.type === 'coverage')

  return {
    passed: allPassed,
    coverage: coverage?.value || 0,
    requiredCoverage: 80,
    details: results
  }
}
```

## 🎯 Boas Práticas

### Escrevendo Cenários

1. **Use linguagem ubíqua**: Termos do negócio, não técnico
2. **Cenário por comportamento**: Um cenário = uma funcionalidade específica
3. **Given-When-Then claro**: Contexto → Ação → Resultado esperado
4. **Dados de teste realistas**: Use factories, não dados hardcoded
5. **Independência**: Cenários não devem depender uns dos outros

### Testes Unitários

1. **Uma asserção por teste**: Teste específico, não geral
2. **Arrange-Act-Assert**: Preparação → Execução → Verificação
3. **Test doubles**: Mocks para dependências externas
4. **Nomes descritivos**: `shouldReturnErrorWhenInvalidInput`
5. **Cobertura de edge cases**: Casos extremos e validações

### Testes de Integração

1. **Setup/teardown**: Banco de dados limpo por teste
2. **Dados de seed**: Consistentes e previsíveis
3. **Asserções completas**: Verificar estado final e efeitos colaterais
4. **Isolamento**: Não depender de estado externo
5. **Performance**: Timeout apropriado para operações I/O

### Testes Contratuais

1. **Schemas completos**: Todos os campos obrigatórios
2. **Validações rigorosas**: Tipos, formatos, constraints
3. **Backward compatibility**: Não quebrar contratos existentes
4. **Documentação**: Schemas servem como documentação viva
5. **Versionamento**: Evolução controlada de contratos

## 🛠️ Ferramentas e Utilitários

### Vitest Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: [
      '**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '**/__tests__/**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**'
    ]
  }
})
```

### Test Utilities

```typescript
// tests/utils/test-helpers.ts
export function createTestHeroContent(overrides = {}) {
  return {
    headline: 'Test Headline',
    subheadline: 'Test Subheadline',
    ctaText: 'Test CTA',
    ctaHref: '/test',
    ...overrides
  }
}

export function createMockExperiment(variant = 'A') {
  return {
    id: 'hero_headline_test',
    variant,
    trackImpression: vi.fn(),
    trackConversion: vi.fn()
  }
}
```

### Playwright Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ]
})
```

---

## 📚 Referências

- **[Arquitetura](./architecture.md)** - Estrutura técnica geral
- **[Qualidade](./quality.md)** - Gates e métricas de qualidade
- **[Vocabulário](./vocabulario.md)** - Termos do domínio
- **[COMMANDS.md](./COMMANDS.md)** - Como executar testes
