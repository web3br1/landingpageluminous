# 🏗️ Estrutura do Projeto - Luminaris SaaS Landing Page

## 📁 Organização Geral

```
/luminaris-saas/
├── 📁 app/                          # Next.js App Router
│   ├── (marketing)/                 # Landing pages
│   ├── (product)/                   # Product pages
│   ├── (conversion)/                # Conversion funnels
│   ├── (admin)/                     # Admin dashboards
│   └── api/                         # API routes
├── 📁 components/                   # Reusable components
│   ├── ui/                          # Design system atoms
│   ├── sections/                    # Page sections
│   ├── personalization/             # ML components
│   └── admin/                       # Admin components
├── 📁 lib/                          # Business logic
│   ├── ml/                          # Machine learning
│   ├── cache/                       # Edge caching
│   ├── flags.ts                     # Feature flags
│   ├── analytics.tsx                # Analytics system
│   └── composition/                 # Composition system
├── 📁 domains/                      # Domain models
├── 📁 design-system/                # Design System
│   ├── tokens/                      # Design tokens
│   ├── foundations/                 # CSS foundations
│   └── variants/                    # Component variants
├── 📁 docs/                         # 📚 Documentation
│   ├── reports/                     # Implementation reports
│   ├── assets/                      # Assets & requirements
│   ├── development/                 # Development docs
│   └── adr/                         # Architecture decisions
├── 📁 shared/                       # Shared packages
├── 📁 modules/                      # Feature modules
├── 📁 scripts/                      # Build & deploy scripts
├── 📁 public/                       # Static assets
├── 📁 tmp/                          # 🗑️ Temporary files (ignored)
├── 📁 tests/                        # Test suites
└── 📁 features/                     # BDD features
```

## 🎯 Princípios de Organização

### ✅ Composition-First Architecture

- **Content/UI Separation**: Dados ≠ Apresentação
- **Design System Unificado**: Single source of truth
- **Component Composition**: Seções como blocos reutilizáveis

### ✅ Domain-Driven Design (DDD)

- **Bounded Contexts**: Módulos independentes
- **Clean Architecture**: Camadas bem definidas
- **Use Cases**: Lógica de negócio pura

### ✅ Test-Driven Development (TDD/BDD)

- **BDD Features**: Cenários em Gherkin primeiro
- **Unit/Contract Tests**: Cobertura ≥ 80%
- **E2E Tests**: Fluxos críticos automatizados

## 📂 Detalhes por Diretório

### `/app` - Next.js App Router

```
app/
├── (marketing)/page.tsx          # Landing page
├── (product)/features/page.tsx   # Features page
├── (conversion)/checkout/        # Checkout flow
├── (admin)/experiments/          # A/B testing dashboard
└── api/webhooks/stripe.ts        # API routes
```

### `/components` - Componentes Reutilizáveis

```
components/
├── ui/                           # Átomos (Button, Input)
├── sections/                     # Seções (Hero, Pricing)
├── personalization/              # ML components
└── admin/                        # Admin components
```

### `/lib` - Lógica de Negócio

```
lib/
├── composition/                  # Sistema de composição
├── experiments/                  # A/B testing engine
├── analytics/                    # Analytics system
├── ml/                          # Machine learning
├── cache/                       # Edge caching
└── flags.ts                     # Feature flags
```

### `/domains` - Modelos de Domínio

```
domains/
└── marketing/
    ├── content/                  # Dados das seções
    ├── composers/               # Compositores de conteúdo
    ├── types/                   # Tipos específicos
    └── index.ts                 # Exports
```

### `/design-system` - Sistema de Design

```
design-system/
├── tokens/                      # Cores, tipografia, espaçamento
├── foundations/                 # CSS base + variáveis
└── variants/                    # Component variants
```

### `/docs` - 📚 Documentação

```
docs/
├── reports/                     # Relatórios de implementação
├── assets/                      # Assets & requisitos
├── development/                 # Documentação de desenvolvimento
├── adr/                         # Architecture Decision Records
├── PROJECT_STRUCTURE.md         # Esta documentação
└── *.md                         # Guias específicos
```

### `/tmp` - 🗑️ Arquivos Temporários

```
tmp/
├── coverage/                    # Relatórios de cobertura
├── playwright-report/           # E2E test reports
├── test-results/               # Jest results
└── *.log                       # Logs temporários
```

> **Nota**: Tudo em `/tmp/` é ignorado pelo Git

## 🔧 Scripts & Configuração

### Arquivos de Configuração (Raiz)

- `package.json` - Dependências & scripts
- `next.config.mjs` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS
- `tsconfig.json` - TypeScript
- `jest.config.cjs` - Jest testing
- `playwright.config.ts` - E2E testing
- `.cursorrules` - AI assistant rules

### Scripts (`/scripts`)

- `setup-dev.js` - Ambiente de desenvolvimento
- `deploy-vercel.js` - Deploy automation
- `health-check.js` - Health monitoring
- `process-images.mjs` - Asset optimization

## 🚀 Como Trabalhar com Esta Estrutura

### Desenvolvimento

```bash
# Setup inicial
npm run setup

# Desenvolvimento
npm run dev

# Testes completos
npm run validate

# Build produção
npm run build
```

### Testes

```bash
# Unit + Integration
npm run test

# E2E
npm run test:e2e

# A11y
npm run test:a11y

# Performance
npm run ci:lighthouse
```

### Documentação

- **Relatórios**: `/docs/reports/`
- **Assets**: `/docs/assets/`
- **Desenvolvimento**: `/docs/development/`
- **Decisões**: `/docs/adr/`

## 🎯 Regras de Qualidade

### Commits

- Conventional commits (`feat:`, `fix:`, `docs:`)
- PRs com testes verdes
- Cobertura ≥ 80%

### Code Quality

- TypeScript strict
- ESLint + Prettier
- Dependency cruiser (arquitetura)
- Lighthouse ≥ 90

### Performance

- Core Web Vitals otimizados
- Bundle size < 180KB
- LCP < 2.5s, CLS < 0.1

---

## 📞 Contato & Suporte

Para dúvidas sobre a estrutura:

- 📖 Leia os ADRs em `/docs/adr/`
- 🐛 Issues no repositório
- 💬 Discussões na documentação

---

**Mantido pela equipe Luminaris** 🚀
