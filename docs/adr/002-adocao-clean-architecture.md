# ADR 002: Adoção de CLEAN Architecture com Monólito Modular

## Status

✅ **Aceito**

## Contexto

O projeto Luminaris precisa de uma arquitetura que:

- **Separe responsabilidades**: Domínio puro, sem dependências de framework
- **Seja testável**: Componentes isolados e mockáveis
- **Permita evolução**: Mudanças em camadas sem quebrar outras
- **Suporte escalabilidade**: De MVP para produto enterprise
- **Mantenha consistência**: Padrões claros para toda a equipe

A landing page atual tem estrutura simples, mas precisamos preparar para crescimento com múltiplos contextos (marketing, analytics, user management, etc.).

## Decisão

Adotamos **CLEAN Architecture** com **Monólito Modular**, estruturado em:

1. **Camadas**: Domain → Application → Infrastructure → Presentation
2. **Módulos**: Contextos independentes (bounded contexts)
3. **Ports & Adapters**: Interfaces na borda do domínio
4. **Dependency Inversion**: Dependências apontam para dentro

## Alternativas Consideradas

### 1. Arquitetura Tradicional (MVC)

```
controllers/ → services/ → models/ → database/
```

**Problemas**:
- Regras de negócio em controllers
- Dependência direta de framework
- Difícil de testar isoladamente
- Acoplamento alto entre camadas

### 2. Microserviços desde o início

```
service-marketing/  service-analytics/  service-users/
```

**Problemas**:
- Overhead de infraestrutura para MVP
- Complexidade de comunicação entre serviços
- Deployment mais complexo
- Time-to-market maior

### 3. Hexagonal Architecture pura

**Problemas**:
- Estrutura muito abstrata para landing page
- Overhead desnecessário para contexto simples
- Curva de aprendizado maior

## Implementação

### Estrutura de Módulos

```
modules/
├── marketing/           # Contexto de marketing
│   ├── domain/         # Regras de negócio puras
│   │   ├── entities/   # Entidades (Hero, PricingPlan)
│   │   ├── value-objects/ # VOs (Email, Currency)
│   │   ├── services/   # Domain Services
│   │   └── ports/      # Interfaces do domínio
│   ├── application/    # Casos de uso e composers
│   │   ├── use-cases/  # Lógica de orquestração
│   │   ├── composers/  # Composição de seções
│   │   └── dtos/       # Data Transfer Objects
│   └── infrastructure/ # Adaptadores externos
│       ├── repos/      # Repositórios (DB, CMS)
│       ├── services/   # Serviços externos (API)
│       └── mappers/    # Mapeamento de dados
```

### Exemplo Prático

```typescript
// modules/marketing/domain/entities/hero.ts
export class Hero {
  constructor(
    public readonly headline: string,
    public readonly subheadline: string,
    public readonly ctaText: string
  ) {}

  // Regras de negócio puras
  canDisplay(): boolean {
    return this.headline.length > 10 && this.ctaText.length > 5
  }
}

// modules/marketing/domain/ports/hero-repo.ts
export interface HeroRepository {
  getHeroContent(): Promise<Hero>
  saveHeroContent(hero: Hero): Promise<void>
}

// modules/marketing/application/use-cases/compose-hero.ts
export class ComposeHeroUseCase {
  constructor(private readonly heroRepo: HeroRepository) {}

  async execute(): Promise<Result<HeroData, AppError>> {
    const hero = await this.heroRepo.getHeroContent()

    if (!hero.canDisplay()) {
      return Result.err(new ValidationError('Hero content invalid'))
    }

    return Result.ok({
      headline: hero.headline,
      subheadline: hero.subheadline,
      ctaText: hero.ctaText
    })
  }
}

// modules/marketing/infrastructure/hero-repo-impl.ts
export class HeroRepositoryImpl implements HeroRepository {
  constructor(private readonly cms: CMSClient) {}

  async getHeroContent(): Promise<Hero> {
    const data = await this.cms.getContent('hero')
    return new Hero(data.headline, data.subheadline, data.ctaText)
  }
}
```

### Composição no Presentation Layer

```typescript
// app/(marketing)/page.tsx
export default async function MarketingPage() {
  const heroResult = await composeHeroUseCase.execute()
  const pricingResult = await composePricingUseCase.execute()

  if (heroResult.success && pricingResult.success) {
    return (
      <div>
        <HeroSection data={heroResult.value} />
        <PricingSection data={pricingResult.value} />
      </div>
    )
  }

  return <ErrorPage />
}
```

## Consequências

### Positivas

- **Testabilidade**: Domínio 100% testável sem infraestrutura
- **Manutenibilidade**: Mudanças isoladas por camada
- **Flexibilidade**: Fácil trocar implementações (DB, APIs, etc.)
- **Escalabilidade**: Adicionar contextos sem quebrar existentes
- **Consistência**: Padrões claros para toda a equipe

### Negativas

- **Complexidade inicial**: Mais arquivos e pastas
- **Boilerplate**: Mais código para setups simples
- **Curva de aprendizado**: Novo padrão arquitetural

### Riscos

- **Over-engineering**: Arquitetura complexa demais para landing page
- **Adoção parcial**: Equipe pode não seguir em todos os módulos
- **Refatoring**: Migração da estrutura atual pode ser custosa

## Métricas de Sucesso

- **Cobertura de testes**: > 80% no domínio e aplicação
- **Adesão arquitetural**: 100% dos módulos seguem a estrutura
- **Velocidade de desenvolvimento**: Manter produtividade após curva de aprendizado
- **Facilidade de mudança**: Modificações em infraestrutura não quebram domínio

## Próximos Passos

1. **Migração gradual**: Converter estrutura atual módulo por módulo
2. **Templates**: Criar generators para novos módulos/contextos
3. **Documentação**: Guias de implementação por camada
4. **Ferramentas**: Scripts para validar adesão arquitetural

## Referências

- [Clean Architecture - Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [DDD Bounded Contexts](https://martinfowler.com/bliki/BoundedContext.html)
- [Ports & Adapters Pattern](https://alistair.cockburn.us/hexagonal-architecture/)

## Data da Decisão

2025-01-15

## Responsável

@team-architecture
