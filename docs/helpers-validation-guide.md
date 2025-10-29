# Guia de Uso: Helpers e Validação

## 🎯 Visão Geral

Este guia demonstra como usar os novos helpers de tratamento de erros e validação de entrada implementados no sistema de composição.

## 🔧 Funções Helper

### ensureError

**Propósito**: Garantir que qualquer valor de erro seja convertido para um objeto `Error` válido.

```typescript
import { ensureError } from "@/lib/composition/services/page-composition-service";

function handleOperation() {
  try {
    // Operação que pode falhar
    riskyOperation();
  } catch (error) {
    // Sempre resulta em um Error object
    const errorObj = ensureError(error);

    // Agora podemos acessar propriedades do Error com segurança
    console.log(errorObj.message);
    console.log(errorObj.stack);
  }
}
```

**Casos de uso comuns**:

```typescript
// String como erro
const error1 = ensureError("simple message"); // Error('simple message')

// Número como erro
const error2 = ensureError(404); // Error('404')

// Objeto complexo
const error3 = ensureError({ code: "VALIDATION", details: "field required" });
// Error('[object Object]')

// Error object (retornado inalterado)
const originalError = new TypeError("type error");
const error4 = ensureError(originalError); // Mesmo objeto TypeError
```

### logErrorAndCapture

**Propósito**: Log estruturado + captura de erro em uma única chamada.

```typescript
import {
  logErrorAndCapture,
  getLogger,
  getErrorTracker,
} from "@/lib/composition";

function handleDatabaseError(
  error: unknown,
  operation: string,
  userId?: string,
) {
  const logger = getLogger();
  const errorTracker = getErrorTracker();

  logErrorAndCapture(logger, errorTracker, operation, error, {
    userId,
    operation,
    timestamp: Date.now(),
  });
}
```

**Exemplo completo**:

```typescript
async function processUserData(userId: string, data: any) {
  try {
    await validateAndSaveUserData(userId, data);
  } catch (error) {
    logErrorAndCapture(
      getLogger(),
      getErrorTracker(),
      "user_data_processing",
      error,
      {
        userId,
        dataSize: JSON.stringify(data).length,
        operation: "save_user_data",
      },
    );

    // Sistema continua funcionando
    return { success: false, fallback: true };
  }
}
```

## 🔍 Validação com Zod

### CompositionOptions

**Schema**: Validação de opções de composição.

```typescript
import { CompositionOptionsSchema } from "@/lib/composition/services/page-composition-service";

function validateCompositionOptions(options: any): boolean {
  const result = CompositionOptionsSchema.safeParse(options);

  if (!result.success) {
    console.warn("Invalid composition options:", result.error.issues);
    return false;
  }

  // Opções válidas
  const validOptions = result.data;
  return true;
}

// Uso
const options = {
  flags: {
    show_pricing: true,
    enable_chat: false,
    dark_mode: true,
  },
};

if (validateCompositionOptions(options)) {
  // Prosseguir com opções válidas
}
```

**Estrutura esperada**:

```typescript
{
  flags?: {
    [featureName: string]: boolean
  }
}
```

**Exemplos válidos**:

```typescript
// Com flags
{ flags: { feature_a: true, feature_b: false } }

// Sem flags
{}

// Vazio
{ flags: {} }
```

**Exemplos inválidos**:

```typescript
// Flags não é objeto
{ flags: 'invalid' }

// Valores não booleanos
{ flags: { feature: 'true' } }

// Propriedades extras (strict mode)
{ flags: { feature: true }, extra: 'not allowed' }
```

### CompositionContext

**Schema**: Validação de contexto de composição.

```typescript
import { CompositionContextSchema } from "@/lib/composition/services/page-composition-service";

function validateCompositionContext(context: any) {
  const result = CompositionContextSchema.safeParse(context);

  if (!result.success) {
    console.warn("Invalid composition context:", result.error.issues);
    return null;
  }

  return result.data;
}

// Uso
const context = {
  userId: "user123",
  tenantId: "tenant456",
  userSegments: ["premium", "enterprise"],
  experiments: { hero_test: "variant_a" },
  locale: "pt-BR",
  featureFlags: { new_feature: true },
  experimentOverrides: { override_test: "override_variant" },
};

const validContext = validateCompositionContext(context);
if (validContext) {
  // Usar contexto validado
}
```

**Estrutura esperada**:

```typescript
{
  userId?: string
  tenantId?: string
  userSegments?: string[]
  experiments?: Record<string, string>
  locale?: string
  featureFlags?: Record<string, boolean>
  experimentOverrides?: Record<string, string>
}
```

**Exemplos válidos**:

```typescript
// Contexto completo
{
  userId: 'user123',
  tenantId: 'tenant456',
  userSegments: ['premium', 'enterprise'],
  experiments: { hero_test: 'variant_a' },
  locale: 'pt-BR',
  featureFlags: { new_feature: true },
  experimentOverrides: { override_test: 'override_variant' }
}

// Contexto parcial
{
  userId: 'user123',
  locale: 'en-US'
}

// Contexto vazio (null/undefined)
null
undefined
{}
```

**Exemplos inválidos**:

```typescript
// userId não é string
{ userId: 12345 }

// userSegments não é array
{ userSegments: 'not-an-array' }

// userSegments com elementos não string
{ userSegments: ['valid', 123, 'also-valid'] }

// experiments com valores não string
{ experiments: { test: 'variant', another: 123 } }

// featureFlags com valores não boolean
{ featureFlags: { flag: 'yes' } }

// Propriedades extras
{ userId: '123', extraProperty: 'not allowed' }
```

## 🚀 Padrões Recomendados

### 1. Validação na Entrada das Funções

```typescript
function processComposition(pageType: PageType, context?: any, options?: any) {
  // Validar entrada
  const contextValidation = CompositionContextSchema.safeParse(context);
  const optionsValidation = CompositionOptionsSchema.safeParse(options);

  // Log warnings para dados inválidos
  if (!contextValidation.success) {
    logger.warn("Invalid context provided", {
      errors: contextValidation.error.issues,
    });
  }

  if (!optionsValidation.success) {
    logger.warn("Invalid options provided", {
      errors: optionsValidation.error.issues,
    });
  }

  // Usar dados validados ou defaults
  const validContext = contextValidation.success
    ? contextValidation.data
    : undefined;
  const validOptions = optionsValidation.success
    ? optionsValidation.data
    : undefined;

  // Continuar processamento...
}
```

### 2. Tratamento de Erros Consistente

```typescript
class MyService {
  async performOperation(params: any) {
    const logger = getLogger();
    const errorTracker = getErrorTracker();

    try {
      // Validação
      const validation = MyParamsSchema.safeParse(params);
      if (!validation.success) {
        throw new Error(`Validation failed: ${validation.error.message}`);
      }

      // Operação
      const result = await this.doOperation(validation.data);
      return Result.ok(result);
    } catch (error) {
      // Log estruturado + captura
      logErrorAndCapture(logger, errorTracker, "my_operation", error, {
        params,
        timestamp: Date.now(),
      });

      // Fallback ou re-throw
      return Result.err({
        message: "Operation failed",
        code: "OPERATION_ERROR",
      });
    }
  }
}
```

### 3. Monitoramento de Performance

```typescript
async function monitoredOperation() {
  const logger = getLogger();
  const performanceMonitor = getPerformanceMonitor();

  const timer = performanceMonitor.startTimer("my_operation");
  const startTime = performance.now();

  try {
    // Operação
    const result = await expensiveOperation();

    // Métricas
    const duration = performance.now() - startTime;
    await performanceMonitor.endTimer(timer);

    logger.info("Operation completed", {
      durationMs: duration,
      resultSize: result.length,
    });

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;
    await performanceMonitor.endTimer(timer);

    logErrorAndCapture(
      logger,
      getErrorTracker(),
      "monitored_operation",
      error,
      {
        durationMs: duration,
      },
    );

    throw error;
  }
}
```

## 🧪 Testando Helpers e Validação

### Testes para ensureError

```typescript
describe("ensureError", () => {
  it("should handle Error objects", () => {
    const original = new Error("test");
    const result = ensureError(original);
    expect(result).toBe(original);
  });

  it("should convert strings to Error", () => {
    const result = ensureError("error message");
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("error message");
  });

  it("should convert unknown values", () => {
    const result = ensureError({ code: 404 });
    expect(result).toBeInstanceOf(Error);
    expect(result.message).toBe("[object Object]");
  });
});
```

### Testes para Validação Zod

```typescript
describe("CompositionOptionsSchema", () => {
  it("should validate valid options", () => {
    const valid = { flags: { feature: true } };
    const result = CompositionOptionsSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject invalid options", () => {
    const invalid = { flags: "not-object" };
    const result = CompositionOptionsSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
```

### Testes de Integração

```typescript
describe("PageCompositionService validation", () => {
  it("should handle invalid input gracefully", async () => {
    const service = new PageCompositionService(/* mocks */);

    // Input inválido não deve quebrar o serviço
    const result = await service.composePage("landing", { invalid: "data" });

    // Deve retornar resultado válido (com warnings nos logs)
    expect(result.success).toBe(true);
  });

  it("should validate and use valid input", async () => {
    const service = new PageCompositionService(/* mocks */);
    const validContext = { userId: "123", locale: "en-US" };

    const result = await service.composePage("landing", validContext);

    expect(result.success).toBe(true);
    // Verificar se o contexto foi usado corretamente
  });
});
```

## 🔧 Troubleshooting

### Problemas Comuns

**1. ensureError retorna "[object Object]"**

```typescript
// Problema
const error = ensureError({ message: "custom error" }); // "[object Object]"

// Solução
const error = ensureError(
  new Error(JSON.stringify({ message: "custom error" })),
);
// ou
const error = new Error("Custom error");
error.details = { message: "custom error" };
```

**2. Validação Zod falha inesperadamente**

```typescript
// Verificar schema
const result = MySchema.safeParse(data);
if (!result.success) {
  console.log("Validation errors:", result.error.issues);
}

// Verificar tipos
console.log("Input type:", typeof data);
console.log("Input value:", data);
```

**3. logErrorAndCapture não loga**

```typescript
// Verificar se logger e errorTracker estão inicializados
console.log("Logger:", logger);
console.log("ErrorTracker:", errorTracker);

// Verificar se operação é string
console.log("Operation:", typeof operation, operation);
```

## 📋 Checklist de Uso

- [ ] **Importar helpers**: `ensureError`, `logErrorAndCapture`
- [ ] **Importar schemas**: `CompositionOptionsSchema`, `CompositionContextSchema`
- [ ] **Validar entrada**: Usar `safeParse()` no início das funções
- [ ] **Log warnings**: Para dados inválidos (não erros críticos)
- [ ] **Tratamento consistente**: Usar `logErrorAndCapture` em todos os catch
- [ ] **Testar validação**: Incluir casos válidos e inválidos
- [ ] **Documentar schemas**: Manter documentação atualizada

## 📚 Recursos Adicionais

- [Documentação Principal](./composition-system-updates.md)
- [Testes de Validação](./tests/unit/page-composition-helpers.test.ts)
- [Exemplos de Uso](./examples/composition-examples.ts)

---

**Última atualização**: Outubro 2025
**Versão**: 1.0
