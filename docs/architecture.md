# 🏗️ Arquitetura - Landing Page SaaS

> Estrutura técnica e padrões do sistema Luminaris.
> Arquitetura composition-first focada em performance, testabilidade e manutenibilidade.

## 📋 Visão Geral

O sistema segue princípios de **CLEAN Architecture** + **DDD** (Domain-Driven Design) adaptados para landing pages SaaS, com foco em:

- **Separação de responsabilidades**: Conteúdo ≠ Apresentação
- **Componibilidade**: Seções como blocos reutilizáveis
- **Performance**: Lazy loading e code splitting automático
- **Testabilidade**: Componentes isolados e contratos Zod

## 🧩 Estrutura de Arquitetura

### 1. CLEAN + Ports & Adapters

```
┌─────────────────────────────────────┐
│           PRESENTATION              │ ← Next.js (app/)
│  ┌─────────────────────────────────┐ │
│  │         APPLICATION             │ │ ← Composers, Use-cases
│  │  ┌─────────────────────────────┐ │ │
│  │  │         DOMAIN              │ │ │ ← Entities, Value Objects
│  │  │  ┌─────────────────────────┐ │ │ │
│  │  │  │     INFRASTRUCTURE      │ │ │ │ ← Adapters, Services
│  │  │  │  ┌─────────────────────┐ │ │ │ │
│  │  │  │  │    FRAMEWORK        │ │ │ │ │ ← Next.js, React
│  │  │  │  └─────────────────────┘ │ │ │ │
│  │  │  └─────────────────────────┘ │ │ │
│  │  └─────────────────────────────┘ │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 2. Monólito Modular por Contextos

```
modules/
├── marketing/           # ← Contexto principal
│   ├── domain/         # Entidades e regras
│   ├── application/    # Use-cases e composers
│   └── infrastructure/ # Adapters e mappers
└── shared/             # ← Infraestrutura compartilhada
    ├── core/          # Result<T, AppError>, Option, etc.
    ├── errors/        # AppError, Problem+JSON
    ├── contracts/     # Schemas Zod
    └── config/        # Configurações ambiente
```

## 🔧 Padrões de Implementação

### Use-cases (Application Layer)

```typescript
// modules/marketing/application/compose-hero.ts
import { Result } from '@shared/core'
import { AppError } from '@shared/errors'

export interface HeroData {
  headline: string
  subheadline: string
  ctaText: string
}

export async function composeHero(
  experimentId?: string
): Promise<Result<HeroData, AppError>> {
  // Lógica de composição
  // Validação com Zod
  // Chamada a portas/infra
  // Retorno Result<T, AppError>
}
```

### Ports & Adapters (Infrastructure)

```typescript
// modules/marketing/domain/ports/content-repo.ts
export interface ContentRepository {
  getHeroContent(locale: string): Promise<HeroContent>
  getPricingPlans(): Promise<PricingPlan[]>
}

// modules/marketing/infrastructure/content-repo-impl.ts
export class ContentRepoImpl implements ContentRepository {
  async getHeroContent(locale: string): Promise<HeroContent> {
    // Implementação real (CMS, arquivo, etc.)
  }
}
```

### Composers (Application → Presentation)

```typescript
// domains/marketing/composers/hero-composer.ts
export function composeHeroContent() {
  const experiment = useExperiment("hero_headline")
  const result = await composeHero(experiment.variant)

  if (result.isErr()) {
    return { error: result.error }
  }

  return {
    content: result.value,
    variant: experiment.variant
  }
}
```

## 🎨 Design System Unificado

### Single Source of Truth

```typescript
// design-system/tokens/colors.ts
export const colorTokens = {
  primary: {
    50: "258 90% 98%",
    500: "258 90% 60%",
    900: "258 90% 20%"
  }
} as const

// design-system/foundations/theme.css (auto-gerado)
:root {
  --color-primary-500: 258 90% 60%;
}
```

### Component Variants

```typescript
// components/ui/button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({ variant = 'primary', size = 'md', ...props }) {
  return (
    <button
      className={cn(
        "inline-flex items-center rounded-2xl font-semibold transition",
        buttonVariants[variant][size]
      )}
      {...props}
    />
  )
}
```

## 📊 Sistema TDD Quality

### Gates Automáticos

```typescript
// tools/tdd/gates/quality-gate.ts
export async function runQualityGate() {
  const results = await Promise.all([
    runTypeCheck(),
    runLinting(),
    runUnitTests(),
    runIntegrationTests(),
    runDependencyCruiser(),
    runKnipAnalysis()
  ])

  const passed = results.every(r => r.passed)
  const coverage = calculateCoverage(results)

  return {
    passed,
    coverage,
    threshold: 0.8, // 80% mínimo
    details: results
  }
}
```

### Maturidade por Nível

- **M0**: Setup básico (typecheck, lint)
- **M1**: Testes unitários + cobertura
- **M2**: Testes integração + contratos
- **M3**: E2E + performance + acessibilidade

## 🚀 Performance & Assets

### Lazy Loading Inteligente

```typescript
// app/(marketing)/page.tsx
import dynamic from 'next/dynamic'

const HeroSection = dynamic(() => import('@/components/sections/hero'), {
  loading: () => <HeroSkeleton />
})

const PricingSection = dynamic(() => import('@/components/sections/pricing'), {
  loading: () => <PricingSkeleton />
})
```

### Image Optimization

```typescript
// components/ui/optimized-image.tsx
import Image from 'next/image'

interface OptimizedImageProps {
  src: string
  alt: string
  priority?: boolean
  sizes?: string
}

export function OptimizedImage({ sizes = "(max-width: 768px) 100vw, 50vw", ...props }) {
  return (
    <Image
      sizes={sizes}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQ..."
      {...props}
    />
  )
}
```

## 🔒 Segurança & Observabilidade

### Content Security Policy

```typescript
// next.config.mjs
export default {
  async headers() {
    return [{
      source: '/(.*)',
      headers: [{
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https:",
          "font-src 'self'",
          "connect-src 'self'"
        ].join('; ')
      }]
    }]
  }
}
```

### Error Boundaries

```typescript
// components/error-boundary.tsx
export class ErrorBoundary extends Component {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log para observabilidade
    logError(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />
    }

    return this.props.children
  }
}
```

## 📱 Responsividade & Acessibilidade

### Grid System

```css
/* design-system/foundations/grid.css */
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

@media (min-width: 768px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### A11y Patterns

```typescript
// components/ui/focus-trap.tsx
export function FocusTrap({ children, active }: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active) return

    const focusableElements = containerRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    if (focusableElements?.length) {
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              lastElement.focus()
              e.preventDefault()
            }
          } else {
            if (document.activeElement === lastElement) {
              firstElement.focus()
              e.preventDefault()
            }
          }
        }
      }

      document.addEventListener('keydown', handleTabKey)
      firstElement.focus()

      return () => document.removeEventListener('keydown', handleTabKey)
    }
  }, [active])

  return <div ref={containerRef}>{children}</div>
}
```

## 🧠 Como Criar um Novo Módulo

### 1. Estrutura Básica

```bash
# Criar estrutura
mkdir -p modules/new-context/{domain,application,infrastructure}
mkdir -p modules/new-context/docs

# Arquivos essenciais
touch modules/new-context/README.md
touch modules/new-context/docs/{context}.feature
touch modules/new-context/domain/index.ts
touch modules/new-context/application/index.ts
touch modules/new-context/infrastructure/index.ts
```

### 2. Domain Layer

```typescript
// modules/new-context/domain/entities/entity.ts
export class Entity {
  constructor(
    public readonly id: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  // Regras de negócio
  // Invariantes
  // Value objects
}
```

### 3. Application Layer

```typescript
// modules/new-context/application/use-cases/create-entity.ts
import { Result } from '@shared/core'
import { AppError } from '@shared/errors'
import { EntityRepository } from '../domain/ports/entity-repo'

export class CreateEntityUseCase {
  constructor(private readonly repo: EntityRepository) {}

  async execute(input: CreateEntityInput): Promise<Result<Entity, AppError>> {
    // Validação Zod
    // Lógica de negócio
    // Persistência via repo
    // Retorno Result<T, AppError>
  }
}
```

### 4. Infrastructure Layer

```typescript
// modules/new-context/infrastructure/entity-repo-impl.ts
export class EntityRepoImpl implements EntityRepository {
  constructor(private readonly db: Database) {}

  async save(entity: Entity): Promise<void> {
    // Mapeamento para DB
    // Queries específicas
  }
}
```

### 5. Documentação

```markdown
# Contexto: New Context

## Objetivo
[Descrição do propósito do contexto]

## Use-cases
- create-entity
- update-entity
- list-entities

## Portas
- entity-repo (Database)
- external-service (HTTP)

## Eventos
- entity.created
- entity.updated
```

### 6. Testes

```typescript
// modules/new-context/docs/new-context.feature
Feature: New Context Management

  Scenario: Create new entity successfully
    Given valid entity data
    When I create the entity
    Then the entity should be created
    And an entity.created event should be published
```

---

## 📚 Referências Adicionais

- **[Qualidade](./quality.md)** - Gates e métricas de qualidade
- **[BDD](./bdd.md)** - Cenários e testes comportamentais
- **[Vocabulário](./vocabulario.md)** - Termos do domínio
- **[ADR](./ADR/)** - Decisões arquiteturais tomadas
