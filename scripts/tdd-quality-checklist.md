# 📋 Checklist de Qualidade TDD - Landing Page SaaS

## 🎯 **Visão Geral**

Este checklist avalia se os testes seguem os princípios do **Test Driven Development (TDD)**, garantindo que o código seja:

- **Testável**: Estrutura facilita escrita de testes
- **Testado**: Cobertura adequada com testes significativos
- **Manutenível**: Testes claros e fáceis de manter

## 📊 **Estrutura de Avaliação**

### 1. **PRINCÍPIOS TDD - RED → GREEN → REFACTOR** ✅

- [ ] **RED**: Todos os testes falham inicialmente (antes da implementação)
- [ ] **GREEN**: Implementação faz todos os testes passarem
- [ ] **REFACTOR**: Código limpo mantendo testes verdes

### 2. **ESTRUTURA DO TESTE** ✅

- [ ] **AAA Pattern**: Arrange → Act → Assert
- [ ] **Nomenclatura clara**: `describe('Contexto', () => it('deve fazer algo específico'))`
- [ ] **Um conceito por teste**: Teste verifica apenas uma funcionalidade
- [ ] **Testes independentes**: Não dependem de ordem ou estado de outros testes

### 3. **TIPOS DE TESTE - PIRÂMIDE** ✅

#### **UNITÁRIOS** (Base da pirâmide - 70% dos testes)

- [ ] **Isolamento**: Testa apenas uma unidade (função/classe)
- [ ] **Mocks/Stubs**: Dependências externas mockadas
- [ ] **Fast**: Executam em < 100ms
- [ ] **Determinísticos**: Mesmo resultado sempre

#### **INTEGRAÇÃO** (Meio da pirâmide - 20% dos testes)

- [ ] **Múltiplas unidades**: Testa interação entre componentes
- [ ] **Dependências reais**: Bancos, APIs (com isolamento)
- [ ] **Cenários reais**: Fluxos completos de negócio

#### **E2E** (Topo da pirâmide - 10% dos testes)

- [ ] **Fluxo completo**: Ponta a ponta
- [ ] **Interface real**: Browser/App
- [ ] **Cenários críticos**: Happy path + edge cases

## 🔍 **CRITÉRIOS ESPECÍFICOS POR TIPO**

### **COMPONENTES REACT**

```typescript
// ✅ BOM
describe('Hero Component', () => {
  it('deve renderizar headline quando content é fornecido', () => {
    // Arrange
    const mockContent = { headline: 'Test' }

    // Act
    render(<Hero content={mockContent} />)

    // Assert
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
})

// ❌ RUIM - Múltiplas asserções
it('deve renderizar tudo', () => {
  render(<Hero content={content} />)
  expect(screen.getByText('title')).toBeInTheDocument()
  expect(screen.getByText('subtitle')).toBeInTheDocument()
  expect(screen.getByRole('button')).toBeInTheDocument()
})
```

### **HOOKS CUSTOMIZADOS**

```typescript
// ✅ BOM
describe("useDebounce", () => {
  it("deve debounced o valor por tempo especificado", async () => {
    const { result } = renderHook(() => useDebounce("test", 100));

    expect(result.current).toBe("test");

    await waitFor(
      () => {
        expect(result.current).toBe("debounced");
      },
      { timeout: 150 },
    );
  });
});
```

### **SERVIÇOS/DOMÍNIO**

```typescript
// ✅ BOM
describe("PageCompositionService", () => {
  describe("composePage", () => {
    it("deve retornar erro quando config inválida", () => {
      const service = new PageCompositionService(/* deps */);

      const result = service.composePage("invalid-page");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unknown page type");
    });
  });
});
```

## 📈 **MÉTRICAS DE QUALIDADE**

### **Cobertura**

- [ ] **Statements**: > 80%
- [ ] **Branches**: > 70%
- [ ] **Functions**: > 75%
- [ ] **Lines**: > 80%

### **Performance**

- [ ] **Unitários**: < 100ms médio
- [ ] **Integração**: < 500ms médio
- [ ] **E2E**: < 2000ms médio

### **Manutenibilidade**

- [ ] **Flaky tests**: < 1%
- [ ] **Testes skipped**: < 5%
- [ ] **Duplicação**: < 10% (DRY principle)

## 🏗️ **ARQUITETURA DE TESTES**

### **Organização de Arquivos**

```
tests/
├── __mocks__/           # Mocks compartilhados
├── __utils__/           # Utilitários de teste
├── unit/               # Testes unitários puros
├── integration/        # Testes de integração
├── e2e/               # Testes end-to-end
└── components/         # Testes de componentes
    ├── ui/            # Átomos/moléculas
    ├── sections/      # Organismos
    └── pages/         # Páginas completas
```

### **Convenções de Nome**

- **Arquivos**: `componente.test.tsx`
- **Describes**: `describe('Componente', () => ...)`
- **Its**: `it('deve fazer algo específico', () => ...)`
- **Métodos**: `describe('#método', () => ...)`

## 🔧 **FERRAMENTAS E SETUP**

### **Configuração Vitest**

```typescript
// vitest.config.ts
{
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts']
  }
}
```

### **Setup Comum**

```typescript
// vitest.setup.ts
import { expect, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

// Extensões do Jest
expect.extend(matchers);

// Cleanup automático
afterEach(() => {
  cleanup();
});
```

## 🚨 **PROBLEMAS COMUNS E SOLUÇÕES**

### **1. Testes Flaky (Instáveis)**

```typescript
// ❌ Problema
it("deve fazer algo async", () => {
  setTimeout(() => {
    expect(result).toBe("expected");
  }, 100);
});

// ✅ Solução
it("deve fazer algo async", async () => {
  await waitFor(() => {
    expect(result).toBe("expected");
  });
});
```

### **2. Mocks Excessivos**

```typescript
// ❌ Problema - Mocka tudo
vi.mock("framer-motion", () => ({
  /* 50 linhas */
}));

// ✅ Solução - Mock minimal
vi.mock("framer-motion", () => ({
  motion: { div: "div" },
  useMotionValue: vi.fn(() => ({ get: vi.fn(), set: vi.fn() })),
}));
```

### **3. Dependência entre Testes**

```typescript
// ❌ Problema
let sharedState;

beforeEach(() => {
  sharedState = "initial";
});

it("teste 1", () => {
  sharedState = "modified";
});
it("teste 2", () => {
  expect(sharedState).toBe("initial");
}); // FALHA

// ✅ Solução
it("teste 1", () => {
  const state = "initial";
  // modifica state
  expect(state).toBe("modified");
});

it("teste 2", () => {
  const state = "initial";
  expect(state).toBe("initial");
});
```

## 📋 **CHECKLIST DE REVISÃO DE PR**

### **Antes do Merge**

- [ ] Todos os testes passam ✅
- [ ] Cobertura não diminuiu 📊
- [ ] Não há testes skipped ⚠️
- [ ] Performance mantida 🏃‍♂️
- [ ] Linting passa 🔍

### **Durante Code Review**

- [ ] Nomenclatura clara e descritiva 📝
- [ ] Um conceito por teste 🎯
- [ ] Mocks/Stubs apropriados 🤖
- [ ] Não testa implementação, testa comportamento 🎭

### **CI/CD Gates**

- [ ] Testes executam em < 5min ⏱️
- [ ] Cobertura reportada 📈
- [ ] Flaky tests detectados 🔄
- [ ] Security scan passa 🔒

## 🎯 **PROCESSO DE MELHORIA CONTÍNUA**

### **1. Métricas de Acompanhamento**

- Taxa de sucesso dos testes
- Tempo médio de execução
- Número de testes flaky
- Cobertura por módulo

### **2. Refatoração de Testes**

```bash
# Script para identificar testes lentos
npm run test -- --reporter=verbose | grep "slow"
```

### **3. Padronização**

- Documento de padrões de teste
- Templates para diferentes tipos de teste
- Code review checklist específico para testes

## 📚 **RECURSOS DE APRENDIZADO**

- [TDD by Example - Kent Beck](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530)
- [Testing JavaScript Applications - Manning](https://www.manning.com/books/testing-javascript-applications)
- [React Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest Docs](https://vitest.dev/)

---

## 🎯 **SCORE FINAL**

**Pontuação**: \_\_\_/100

**Nível**:

- 🟢 **90-100**: Excelente - Testes TDD maduros
- 🟡 **70-89**: Bom - Precisa melhorias pontuais
- 🔴 **< 70**: Crítico - Revisão completa necessária
