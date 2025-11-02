# ✅ Qualidade e CI/CD - Landing Page SaaS

> Sistema de qualidade automatizado com gates obrigatórios, métricas de maturidade e CI/CD confiável.
> Foco em entrega segura, performance e experiência do usuário.

## 📋 Visão Geral

O **TDD Quality System** implementa qualidade automatizada através de:

- **Gates obrigatórios**: PRs bloqueados se qualidade abaixo do padrão
- **Métricas de maturidade**: Níveis M0-M3 com evolução controlada
- **CI/CD confiável**: Deploy automático com rollback seguro
- **Observabilidade**: Métricas em tempo real e alertas proativos

## 🎯 Gates de Qualidade

### Quality Gate (Obrigatório)

```typescript
// tools/tdd/gates/quality-gate.ts
export interface QualityGateResult {
  passed: boolean
  score: number
  threshold: number
  details: {
    typecheck: boolean
    lint: boolean
    tests: boolean
    coverage: number
    dependencies: boolean
    security: boolean
    performance: boolean
    accessibility: boolean
  }
}

export async function runQualityGate(): Promise<QualityGateResult> {
  const results = await Promise.all([
    runTypeScriptCheck(),
    runESLintCheck(),
    runTestSuite(),
    calculateCoverage(),
    runDependencyCruiser(),
    runSecurityScan(),
    runPerformanceBudget(),
    runAccessibilityCheck()
  ])

  const score = calculateOverallScore(results)
  const passed = score >= 85 // Threshold mínimo

  return {
    passed,
    score,
    threshold: 85,
    details: {
      typecheck: results[0].passed,
      lint: results[1].passed,
      tests: results[2].passed,
      coverage: results[3].percentage,
      dependencies: results[4].passed,
      security: results[5].passed,
      performance: results[6].passed,
      accessibility: results[7].passed
    }
  }
}
```

### Execução Automática

```bash
# Quality gate completo
pnpm run ci:tdd-gate

# Apenas verificações rápidas
pnpm run ci:quick-gate

# Com relatório detalhado
pnpm run ci:tdd-gate --report
```

## 📊 Métricas de Maturidade

### Níveis de Maturidade

| Nível | Descrição | Critérios | Threshold |
|-------|-----------|-----------|-----------|
| **M0** | Setup Básico | TypeScript + ESLint | ≥ 90% |
| **M1** | Testes Unitários | + Cobertura unitária | ≥ 80% |
| **M2** | Integração Completa | + Testes integração + contratos | ≥ 85% |
| **M3** | Produção Ready | + E2E + Performance + A11y | ≥ 90% |

### Avaliação de Maturidade

```typescript
// tools/tdd/maturity/maturity-evaluator.ts
export class MaturityEvaluator {
  static evaluate(projectPath: string): MaturityLevel {
    const metrics = this.collectMetrics(projectPath)

    if (this.isLevel3(metrics)) return 'M3'
    if (this.isLevel2(metrics)) return 'M2'
    if (this.isLevel1(metrics)) return 'M1'
    return 'M0'
  }

  private static collectMetrics(projectPath: string) {
    return {
      typecheck: runTypeScriptCheck(projectPath),
      lint: runESLintCheck(projectPath),
      unitTests: runUnitTests(projectPath),
      integrationTests: runIntegrationTests(projectPath),
      contractTests: runContractTests(projectPath),
      e2eTests: runE2ETests(projectPath),
      coverage: calculateCoverage(projectPath),
      performance: checkPerformanceBudget(projectPath),
      accessibility: checkAccessibility(projectPath),
      dependencies: checkDependencyHealth(projectPath),
      security: checkSecurityVulnerabilities(projectPath)
    }
  }

  private static isLevel3(metrics: any): boolean {
    return (
      metrics.typecheck &&
      metrics.lint &&
      metrics.unitTests &&
      metrics.integrationTests &&
      metrics.contractTests &&
      metrics.e2eTests &&
      metrics.coverage >= 80 &&
      metrics.performance &&
      metrics.accessibility &&
      metrics.dependencies &&
      metrics.security
    )
  }

  // ... outros níveis
}
```

### Dashboard de Maturidade

```bash
# Avaliação atual
pnpm run tdd:maturity

# Relatório detalhado
pnpm run tdd:maturity --report

# Histórico de evolução
pnpm run tdd:maturity --history
```

## 🔧 Configurações de Qualidade

### TypeScript Strict

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### ESLint Configuration

```javascript
// eslint.config.js
export default [
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: '@typescript-eslint/parser'
    },
    plugins: {
      '@typescript-eslint': typescriptEslint
    },
    rules: {
      // TypeScript strict
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-throw-literal': 'error',
      '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],

      // Qualidade de código
      'complexity': ['error', 10],
      'max-depth': ['error', 4],
      'max-lines-per-function': ['error', 50],

      // Import organization
      'import/order': ['error', {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always'
      }]
    }
  }
]
```

### Vitest Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '.next/',
        '**/*.d.ts',
        '**/*.config.*'
      ],
      thresholds: {
        global: {
          statements: 80,
          branches: 75,
          functions: 80,
          lines: 80
        },
        './src/components/': {
          statements: 90,
          branches: 85,
          functions: 90,
          lines: 90
        }
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000
  }
})
```

### Playwright Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000
  },
  expect: {
    timeout: 10000
  },
  reporter: process.env.CI ? 'github' : 'html'
})
```

## 🚀 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run quality gate
        run: pnpm run ci:tdd-gate

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  e2e-tests:
    runs-on: ubuntu-latest
    needs: quality-gate
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build application
        run: pnpm build

      - name: Run E2E tests
        run: pnpm test:e2e

  deploy:
    runs-on: ubuntu-latest
    needs: [quality-gate, e2e-tests]
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./
```

### Deployment Configuration

```javascript
// vercel.json
{
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["gru1"],
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

## 📈 Métricas e Observabilidade

### Performance Budget

```javascript
// tools/tdd/budgets/performance-budget.ts
export const performanceBudget = {
  lighthouse: {
    performance: 90,
    accessibility: 95,
    bestPractices: 95,
    seo: 95
  },
  coreWebVitals: {
    lcp: 2500,      // Largest Contentful Paint
    fid: 100,       // First Input Delay
    cls: 0.1        // Cumulative Layout Shift
  },
  bundleSize: {
    total: 200000,  // 200KB total
    initial: 70000  // 70KB initial
  }
}

export function checkPerformanceBudget(buildStats: any) {
  const results = {
    lighthouse: runLighthouseCheck(),
    coreWebVitals: measureCoreWebVitals(),
    bundleSize: analyzeBundleSize(buildStats)
  }

  return {
    passed: Object.values(results).every(r => r.passed),
    details: results
  }
}
```

### Alertas e Monitoramento

```typescript
// tools/tdd/monitoring/quality-monitor.ts
export class QualityMonitor {
  static async checkQualityHealth() {
    const metrics = await this.collectMetrics()

    // Alertas críticos
    if (metrics.testFailureRate > 5) {
      await this.alert('Tests failing at high rate', metrics)
    }

    if (metrics.coverage < 75) {
      await this.alert('Coverage below threshold', metrics)
    }

    if (metrics.buildTime > 300000) { // 5 minutes
      await this.alert('Build time too slow', metrics)
    }

    return metrics
  }

  private static async collectMetrics() {
    return {
      testFailureRate: await getTestFailureRate(),
      coverage: await getCoveragePercentage(),
      buildTime: await getLastBuildTime(),
      prWaitTime: await getAveragePRWaitTime(),
      deploymentFrequency: await getDeploymentFrequency()
    }
  }
}
```

## 🔒 Segurança e Compliance

### Security Scan

```typescript
// tools/tdd/security/security-scan.ts
export async function runSecurityScan() {
  const vulnerabilities = await Promise.all([
    runDependencyCheck(),
    runSecretsScan(),
    runCodeSecurityScan(),
    checkCSPHeaders(),
    validateInputSanitization()
  ])

  return {
    passed: vulnerabilities.every(v => v.severity !== 'critical'),
    details: vulnerabilities,
    report: generateSecurityReport(vulnerabilities)
  }
}
```

### Dependency Health

```typescript
// tools/tdd/dependencies/dependency-check.ts
export async function checkDependencyHealth() {
  const deps = await analyzeDependencies()

  const issues = deps.filter(dep => {
    return (
      dep.hasVulnerabilities ||
      dep.isOutdated ||
      dep.hasLicenseIssues ||
      dep.hasMaintenanceIssues
    )
  })

  return {
    passed: issues.length === 0,
    issues,
    recommendations: generateRecommendations(issues)
  }
}
```

## 📊 Dashboards e Relatórios

### Quality Dashboard

```typescript
// tools/tdd/dashboard/quality-dashboard.ts
export class QualityDashboard {
  static async generateReport() {
    const [
      maturity,
      coverage,
      performance,
      security,
      dependencies
    ] = await Promise.all([
      MaturityEvaluator.evaluate('.'),
      calculateCoverage('.'),
      checkPerformanceBudget({}),
      runSecurityScan(),
      checkDependencyHealth()
    ])

    return {
      timestamp: new Date().toISOString(),
      maturity: {
        level: maturity,
        score: this.calculateMaturityScore(maturity)
      },
      coverage: {
        percentage: coverage.percentage,
        trend: coverage.trend
      },
      performance: {
        score: performance.score,
        budget: performance.details
      },
      security: {
        vulnerabilities: security.details.vulnerabilities,
        compliance: security.passed
      },
      dependencies: {
        health: dependencies.passed,
        outdated: dependencies.details.outdatedCount
      }
    }
  }

  static async exportReport(format: 'json' | 'html' | 'pdf' = 'html') {
    const report = await this.generateReport()

    switch (format) {
      case 'json':
        return JSON.stringify(report, null, 2)
      case 'html':
        return this.generateHTMLReport(report)
      case 'pdf':
        return this.generatePDFReport(report)
      default:
        throw new Error(`Unsupported format: ${format}`)
    }
  }
}
```

### Relatórios Automáticos

```bash
# Relatório completo
pnpm run tdd:report

# Relatório HTML
pnpm run tdd:report --format html

# Relatório JSON para integração
pnpm run tdd:report --format json
```

## 🎯 Próximos Passos

### Melhorias Planejadas

1. **Integração com ferramentas externas**:
   - SonarQube para análise de código
   - Snyk para segurança de dependências
   - Lighthouse CI para performance

2. **Automação avançada**:
   - Auto-fix para linting issues
   - Sugestões de melhorias baseadas em métricas
   - Análise preditiva de qualidade

3. **Dashboards visuais**:
   - Integração com DataDog/New Relic
   - Dashboards em tempo real
   - Alertas inteligentes

4. **Qualidade preditiva**:
   - Machine learning para detectar padrões de bugs
   - Análise de risco de regressões
   - Otimização automática de thresholds

---

## 📚 Referências

- **[Arquitetura](./architecture.md)** - Estrutura técnica geral
- **[BDD](./bdd.md)** - Cenários e testes comportamentais
- **[Vocabulário](./vocabulario.md)** - Termos do domínio
- **[COMMANDS.md](./COMMANDS.md)** - Como executar verificações de qualidade
