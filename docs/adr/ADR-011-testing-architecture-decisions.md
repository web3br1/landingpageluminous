# ADR-011: Testing Architecture Decisions

## Status

✅ Aprovado e Implementado

## Contexto

Durante a implementação da landing page SaaS, enfrentamos diversos desafios relacionados a testes, animações e arquitetura de componentes customizados. Este ADR documenta as decisões tomadas para resolver esses problemas de forma consistente e sustentável.

## Decisão

### 1. Jest + Framer Motion Mock Strategy

**Decisão**: Implementar mock minimal do Framer Motion que preserva APIs essenciais mas desabilita animações em testes.

**Razão**:

- Framer Motion causa conflitos em testes Jest devido ao sistema de módulos ESM/CommonJS
- Animações não são relevantes para testes funcionais
- Reduz tempo de execução e complexidade de testes

**Implementação**:

```typescript
// jest.setup.js - Mock minimal que preserva APIs
jest.mock('framer-motion', () => ({
  motion: { div: passthrough('div'), ... },
  useMotionValue: jest.fn((initial) => ({ get: () => initial, set: jest.fn(), ... })),
  // Outros hooks mockados com objetos mock consistentes
}))
```

### 2. Custom Hooks Architecture

**Decisão**: Implementar hooks customizados funcionais com TypeScript strict, seguindo padrão de testes TDD.

**Razão**:

- Reutilização de lógica comum (debounce, throttle, localStorage)
- Melhor testabilidade e manutenibilidade
- Consistência com ecossistema React moderno

**Padrões Implementados**:

- `useDebounce<T>`: Debounce com tipos genéricos
- `useThrottle<T>`: Throttle com callback pattern
- `useLocalStorage<T>`: Persistência com SSR safety
- `useIntersectionObserver`: Intersection API com cleanup
- `useEventListener`: Event binding com cleanup automático
- `useOnClickOutside`: Click outside detection
- `usePrevious<T>`: Valor anterior tracking
- `useToggle<T>`: Toggle state management

### 3. BDD Testing Strategy

**Decisão**: Adotar Cucumber + Gherkin para testes BDD, mantendo Jest para unit/integration.

**Razão**:

- Separação clara entre testes de negócio (BDD) e implementação (Jest)
- Documentação viva através de cenários executáveis
- Colaboração entre negócio e desenvolvimento

**Estrutura**:

```
features/
  landing-page.feature    # Cenários de negócio
  step_definitions/       # Implementação dos steps
tests/                    # Jest tests (unit/integration)
```

### 4. Playwright E2E Configuration

**Decisão**: Configurar E2E com seeds, smoke tests e isolamento adequado.

**Razão**:

- Cobertura end-to-end crítica para landing pages
- Validação de fluxos completos de conversão
- Detecção precoce de regressions funcionais

**Configuração**:

- Base URL: http://localhost:3002 (consistente com dev)
- Testes de hidratação, SSR, e fluxos críticos
- Paralelização e isolamento de browser

## Consequências

### Positivas

- ✅ Testes mais rápidos e confiáveis
- ✅ Melhor cobertura de cenários críticos
- ✅ Documentação viva através de BDD
- ✅ Reutilização de hooks customizados
- ✅ Separação clara de responsabilidades de teste

### Negativas

- ⚠️ Curva de aprendizado para BDD
- ⚠️ Manutenção de múltiplas camadas de teste
- ⚠️ Complexidade de setup de E2E

### Riscos

- **Risco**: Manutenção duplicada de testes
- **Mitigação**: Automação e CI gates rigorosos
- **Risco**: Flakes em E2E
- **Mitigação**: Paralelização e isolamento adequados

## Alternativas Consideradas

### 1. Testing Library Only

- **Razão rejeitada**: Não cobre cenários de negócio adequadamente
- **Razão rejeitada**: Falta documentação executável

### 2. Cypress para E2E

- **Razão rejeitada**: Playwright tem melhor suporte a Next.js
- **Razão rejeitada**: Melhor performance e confiabilidade

### 3. React Testing Library sem mocks

- **Razão rejeitada**: Framer Motion incompatível
- **Razão rejeitada**: Animações desnecessárias em testes

## Notas de Implementação

### Jest Setup Crítico

```javascript
// jest.setup.js - Ordem importa
1. Mocks de browser APIs (localStorage, matchMedia)
2. Framer Motion mock
3. Configurações globais
```

### Hook Testing Pattern

```typescript
// Testa comportamento, não implementação
describe("useDebounce", () => {
  it("should debounce value updates", async () => {
    // Testa timing e valor final
  });
});
```

### BDD Organization

```
Feature: Landing Page
  Scenario: User sees hero content
    Given user visits landing page
    When page loads
    Then hero headline is visible
```

## Referências

- [Jest Documentation](https://jestjs.io/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Cucumber Gherkin](https://cucumber.io/docs/gherkin/)
- [Framer Motion Testing](https://www.framer.com/docs/animation/#testing)
