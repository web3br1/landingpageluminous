# 🧪 Test Utils Usage Guide

**Como usar a biblioteca centralizada de testes baseada nos padrões identificados**

## 📋 **Visão Geral**

A biblioteca `lib/test-utils.ts` foi criada para resolver os padrões problemáticos identificados durante as correções dos testes. Ela fornece mocks abrangentes, utilitários e helpers para facilitar o desenvolvimento de testes robustos.

## 🚀 **Uso Básico**

### **Importação**

```typescript
// Importe apenas o que precisa
import {
  setupBrowserAPIs,
  createMockUser,
  isValidDateString,
} from "@/lib/test/test-utils";

// Ou importe tudo para conveniência
import {
  describe,
  it,
  expect,
  render,
  screen,
  userEvent,
  setupBrowserAPIs,
} from "@/lib/test/test-utils";
```

## 🔧 **Padrões de Correção**

### **1. APIs Browser (FadeUp, animações, layouts responsivos)**

#### **❌ Antes (problema identificado):**

```typescript
describe('FadeUp', () => {
  it('renders with animation', () => {
    // Mocks incompletos causavam erros
    const mockMatchMedia = vi.fn().mockReturnValue({
      matches: false,
      addListener: vi.fn(), // ❌ Faltava addEventListener
    })

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    })

    // ❌ Mocks manuais repetitivos
    global.ResizeObserver = vi.fn()...
    global.IntersectionObserver = vi.fn()...
  })
})
```

#### **✅ Agora (correção implementada):**

```typescript
import { setupBrowserAPIs } from '@/lib/test/test-utils'

describe('FadeUp', () => {
  it('renders with animation', () => {
    // ✅ Uma chamada resolve todos os mocks necessários
    setupBrowserAPIs()

    render(<FadeUp>...</FadeUp>)
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })
})
```

### **2. Funções Ausentes (isValidDateString, formatCurrency)**

#### **❌ Antes (problema identificado):**

```typescript
it("validates dates", () => {
  // ❌ Implementação local no teste
  const isValidDateString = (dateString: string) => {
    const date = new Date(dateString);
    return !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}/);
  };
});
```

#### **✅ Agora (correção implementada):**

```typescript
import { isValidDateString } from "@/lib/test/test-utils";

it("validates dates", () => {
  // ✅ Função reutilizável e bem testada
  expect(isValidDateString("2024-01-15")).toBe(true);
  expect(isValidDateString("invalid")).toBe(false);
});
```

### **3. Timers Complexos (setTimeout, setInterval)**

#### **❌ Problema identificado:**

```typescript
describe.skip("Form Validation States", () => {
  it("shows loading", async () => {
    // ❌ Mesmo com fake timers, timeout ocorria
    await vi.advanceTimersByTimeAsync(10);
  });
});
```

#### **✅ Estratégia de correção:**

```typescript
// 1. Refatorar componente para aceitar delayFunction
const MyComponent = ({ delayFunction = setTimeout }) => {
  const handleSubmit = () => {
    delayFunction(() => setLoading(false), 1000)
  }
}

// 2. Testar com função controlável
import { createControllableDelay } from '@/lib/test/test-utils'

it('shows loading', async () => {
  const { delay, resolve } = createControllableDelay()

  render(<MyComponent delayFunction={delay} />)

  // Trigger action
  userEvent.click(button)

  // ✅ Controle total do timing
  expect(button).toBeDisabled()
  resolve() // Completa o delay imediatamente
  expect(button).not.toBeDisabled()
})
```

## 📚 **API Reference**

### **Browser APIs Mocks**

```typescript
import {
  setupBrowserAPIs,
  resetBrowserAPIs,
  mockMatchMedia,
} from "@/lib/test/test-utils";

// Configura todos os mocks necessários
setupBrowserAPIs();

// Reseta mocks entre testes
resetBrowserAPIs();

// Acesso direto aos mocks para asserções
expect(mockMatchMedia).toHaveBeenCalledWith("(max-width: 768px)");
```

### **Utility Functions**

```typescript
import {
  isValidDateString,
  formatCurrency,
  generateTestId,
  createMockUser,
  createMockFormData,
} from "@/lib/test/test-utils";

// Validação de datas
expect(isValidDateString("2024-01-15")).toBe(true);
expect(isValidDateString("2024-01-15T10:30:00Z")).toBe(true);

// Formatação de moeda
expect(formatCurrency(1234.56)).toBe("R$ 1.234,56");

// Geração de IDs únicos
const id = generateTestId("user"); // 'user-abc123def'

// Dados mock
const user = createMockUser({ name: "Custom Name" });
const formData = createMockFormData({ email: "custom@email.com" });
```

### **Async Testing Helpers**

```typescript
import {
  waitForStableState,
  createControllableDelay,
  measureExecutionTime,
} from "@/lib/test/test-utils";

// Espera estabilização do componente
await waitForStableState(200);

// Delay controlável para testes
const { delay, resolve } = createControllableDelay();
await delay(1000); // Promise que pode ser resolvida manualmente
resolve(); // Completa imediatamente

// Medição de performance
const { result, duration } = await measureExecutionTime(() =>
  expensiveOperation(),
);
expect(duration).toBeLessThan(100); // ms
```

### **Assertion Helpers**

```typescript
import { expectToHaveClasses, expectFormField } from "@/lib/test-helpers";

// Verificar classes CSS
expectToHaveClasses(element, ["btn", "btn-primary"]);

// Verificar campos de formulário
expectFormField(input, {
  type: "email",
  required: true,
  disabled: false,
});
```

## 🎯 **Casos de Uso Comuns**

### **Testando Componentes com Animações**

```typescript
import { setupBrowserAPIs } from '@/lib/test/test-utils'

describe('AnimatedComponent', () => {
  beforeEach(() => {
    setupBrowserAPIs() // ✅ Resolvido: APIs Browser
  })

  it('animates on mount', () => {
    render(<AnimatedComponent />)
    // Animações funcionam sem erros
  })
})
```

### **Testando Formulários**

```typescript
import { createMockFormData, createControllableDelay } from '@/lib/test/test-utils'

describe('LeadForm', () => {
  it('submits successfully', async () => {
    const formData = createMockFormData()
    const { delay, resolve } = createControllableDelay()

    render(<LeadForm delayFunction={delay} />)

    // Preenche formulário
    await userEvent.type(screen.getByLabelText(/nome/i), formData.name)
    await userEvent.click(screen.getByRole('button'))

    // Verifica loading state
    expect(screen.getByRole('button')).toBeDisabled()

    // Completa operação
    resolve()

    // Verifica sucesso
    await waitFor(() => {
      expect(screen.getByText('Sucesso!')).toBeInTheDocument()
    })
  })
})
```

### **Testando Validações**

```typescript
import { isValidDateString, formatCurrency } from "@/lib/test/test-utils";

describe("ValidationUtils", () => {
  it("validates dates correctly", () => {
    // ✅ Resolvido: Funções Ausentes
    expect(isValidDateString("2024-01-15")).toBe(true);
    expect(isValidDateString("invalid")).toBe(false);
  });

  it("formats currency", () => {
    expect(formatCurrency(1234.56)).toBe("R$ 1.234,56");
  });
});
```

## 🛠️ **Migração de Testes Existentes**

### **Passo 1: Atualizar Imports**

```typescript
// ❌ Antes
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// ✅ Depois
import { describe, it, expect, render, screen } from "@/lib/test/test-utils";
```

### **Passo 2: Substituir Mocks Manuais**

```typescript
// ❌ Antes
const mockMatchMedia = vi.fn()...
Object.defineProperty(window, 'matchMedia', { value: mockMatchMedia })

// ✅ Depois
setupBrowserAPIs()
```

### **Passo 3: Usar Helpers Disponíveis**

```typescript
// ❌ Antes
const user = { name: "Test", email: "test@email.com" };

// ✅ Depois
const user = createMockUser();
```

## 📊 **Benefícios**

- **✅ Consistência:** Todos os testes usam os mesmos mocks e helpers
- **✅ Manutenibilidade:** Mudanças em mocks afetam todos os testes automaticamente
- **✅ Produtividade:** Menos código boilerplate, foco na lógica de negócio
- **✅ Robustez:** Mocks abrangentes evitam erros inesperados
- **✅ Padronização:** Padrões de teste consistentes em todo o projeto

## 🚨 **Boas Práticas**

1. **Sempre use `setupBrowserAPIs()`** para componentes que usam animações ou layouts responsivos
2. **Prefira funções da biblioteca** ao invés de implementações locais
3. **Use `createControllableDelay()`** para testes com timing
4. **Importe apenas o necessário** para manter bundles pequenos
5. **Documente novos helpers** quando adicionar à biblioteca

---

**Diretor de Web Design**  
_Guia de Uso: Test Utils Library_  
_23 de outubro de 2025_
