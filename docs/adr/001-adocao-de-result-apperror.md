# ADR 001: Adoção de Result<AppError> para tratamento de erros

## Status

✅ **Aceito**

## Contexto

O projeto Luminaris precisa de uma estratégia consistente para tratamento de erros que:

- Forneça tipagem forte em TypeScript
- Mantenha rastreabilidade de erros (traceId, context)
- Suporte diferentes tipos de erro (validation, business, infrastructure)
- Se integre bem com a arquitetura CLEAN + DDD
- Permita mapeamento automático para respostas HTTP (Problem+JSON RFC7807)

## Decisão

Adotamos o padrão `Result<T, AppError>` como estratégia principal de tratamento de erros, implementado através de:

1. **Tipo Result**: `Result<T, E> = Ok<T> | Err<E>`
2. **Classe AppError**: Hierarquia de erros tipados
3. **Mapeamento HTTP**: Conversão automática para Problem+JSON
4. **Logs estruturados**: Rastreamento completo com traceId

## Alternativas Consideradas

### 1. Try/Catch tradicional
```typescript
try {
  const result = await riskyOperation()
  return result
} catch (error) {
  return handleError(error)
}
```
**Problemas**: Tipagem fraca, exceptions não rastreáveis, difícil de compor.

### 2. Callbacks
```typescript
riskyOperation((error, result) => {
  if (error) return handleError(error)
  return handleSuccess(result)
})
```
**Problemas**: Callback hell, difícil de testar, não composable.

### 3. Promises com rejection
```typescript
return riskyOperation()
  .then(result => handleSuccess(result))
  .catch(error => handleError(error))
```
**Problemas**: Tipagem fraca, exceptions não controladas.

## Implementação

### 1. Tipo Result Base

```typescript
// packages/shared-core/src/result.ts
export type Result<T, E> = Ok<T> | Err<E>

export class Ok<T> {
  readonly success = true as const
  constructor(public readonly value: T) {}
}

export class Err<E> {
  readonly success = false as const
  constructor(public readonly error: E) {}
}

export const Result = {
  ok: <T>(value: T) => new Ok(value),
  err: <E>(error: E) => new Err(error)
}
```

### 2. Hierarquia AppError

```typescript
// packages/shared-errors/src/app-error.ts
export abstract class AppError {
  abstract readonly code: string
  abstract readonly message: string
  abstract readonly status: number

  constructor(
    public readonly traceId: string,
    public readonly context?: Record<string, any>
  ) {}
}

export class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR'
  readonly status = 400

  constructor(traceId: string, public readonly field: string, public readonly reason: string) {
    super(traceId, { field, reason })
  }
}

export class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND'
  readonly status = 404

  constructor(traceId: string, public readonly resource: string) {
    super(traceId, { resource })
  }
}
```

### 3. Use Case com Result

```typescript
// modules/marketing/application/compose-hero.ts
import { Result } from '@shared/core'
import { AppError } from '@shared/errors'

export class ComposeHeroUseCase {
  async execute(input: HeroInput): Promise<Result<HeroData, AppError>> {
    // Validação Zod
    const validation = heroInputSchema.safeParse(input)
    if (!validation.success) {
      return Result.err(new ValidationError(
        generateTraceId(),
        'input',
        validation.error.message
      ))
    }

    // Lógica de negócio
    try {
      const heroData = await this.composeHeroData(validation.data)
      return Result.ok(heroData)
    } catch (error) {
      return Result.err(new BusinessError(
        generateTraceId(),
        'HERO_COMPOSITION_FAILED',
        error.message
      ))
    }
  }
}
```

### 4. Mapeamento HTTP

```typescript
// app/api/hero/route.ts
import { NextResponse } from 'next/next'
import { composeHeroUseCase } from '@/modules/marketing/application'
import { mapAppErrorToProblemJson } from '@shared/errors'

export async function GET(request: Request) {
  const result = await composeHeroUseCase.execute({})

  if (result.success) {
    return NextResponse.json(result.value)
  }

  const problemJson = mapAppErrorToProblemJson(result.error)
  return NextResponse.json(problemJson, { status: result.error.status })
}
```

## Consequências

### Positivas

- **Tipagem forte**: TypeScript garante tratamento correto de erros
- **Rastreabilidade**: traceId segue erro através de toda a stack
- **Testabilidade**: Fácil testar cenários de sucesso e erro
- **Componibilidade**: Result é monad, permite chaining
- **Consistência**: Padrão único em toda a aplicação

### Negativas

- **Boilerplate**: Mais código para casos simples
- **Curva de aprendizado**: Novo padrão para a equipe
- **Integração**: Bibliotecas externas podem não usar Result

### Riscos

- **Adoção incompleta**: Equipe pode voltar para throw em alguns lugares
- **Mapeamento incorreto**: Erros podem ser mapeados para HTTP codes errados
- **Performance**: Wrapper Result pode ter overhead mínimo

## Métricas de Sucesso

- **Coverage de erro**: 100% dos use-cases retornam Result<T, AppError>
- **Consistência**: Zero uso de throw em domínio/aplicação
- **Mapeamento correto**: 100% dos erros mapeados para Problem+JSON válido
- **Rastreabilidade**: 100% dos erros incluem traceId válido

## Referências

- [RFC7807 - Problem Details for HTTP APIs](https://tools.ietf.org/html/rfc7807)
- [Railway Oriented Programming](https://fsharpforfunandprofit.com/rop/)
- [Domain-Driven Design - Eric Evans](https://domainlanguage.com/ddd/)

## Data da Decisão

2025-01-15

## Responsável

@team-architecture
