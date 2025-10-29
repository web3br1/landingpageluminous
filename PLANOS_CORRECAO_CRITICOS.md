# 📋 PLANOS DETALHADOS PARA CORREÇÃO DOS PONTOS CRÍTICOS

**Data:** 23 de outubro de 2025
**Status:** 🔴 BLOQUEADO PARA PRODUÇÃO
**Objetivo:** Corrigir 43 testes falhando e restaurar qualidade para deploy

---

## 🎯 **1. SUITE DE TESTES QUEBRADA (43 testes falhando - 7.7% falha)**

### **Status Atual:**

- ✅ Arquivos de Teste: 26 passaram
- ❌ Arquivos de Teste: 25 falharam
- 📊 Testes Totais: 554
- ❌ Testes Falhando: 43 (7.7% de falha)
- 🚨 Problemas Críticos: 30 (uso de 'any')

### **Plano de Correção - FASE 1: ESTABILIZAÇÃO CRÍTICA (1-2 semanas)**

#### **Semana 1: Correções Urgentes (5 dias)**

**Dia 1-2: LeadForm Component (8 testes falhando)**

```bash
# Correções identificadas:
1. ✅ Ajustar queries getByLabelText vs getByRole
2. ✅ Corrigir timeout de 10s em validações básicas
3. ✅ Implementar isolamento adequado entre testes
4. ✅ Melhorar mocks de animação (Framer Motion)
5. ✅ Corrigir validação que não funciona como esperado
6. ✅ Ajustar botão submit text dinâmico
```

**Dia 3: Benefits Component**

```bash
# Correções identificadas:
1. ✅ Ajustar data-testid de "benefit-card-0" para "data-benefit-index"
2. ✅ Atualizar queries nos testes para usar data-benefit-index
3. ✅ Corrigir incompatibilidade entre teste e implementação
4. ✅ Verificar renderização correta dos ícones
```

**Dia 4: Final CTA Component**

```bash
# Correções identificadas:
1. ✅ Resolver elementos não encontrados no DOM
2. ✅ Corrigir queries de botões primários/secundários
3. ✅ Verificar renderização de background images
4. ✅ Ajustar testes de interações de clique
```

**Dia 5: API Endpoints**

```bash
# Correções identificadas:
1. ✅ Corrigir /api/monitoring/error status code (400 → 200)
2. ✅ Implementar geração de reportId
3. ✅ Ajustar validações incorretas
4. ✅ Respeitar contratos de API
```

#### **Semana 2: Qualidade Básica (5 dias)**

**Dia 6-7: Eliminação de 'any' (30 ocorrências)**

```bash
# Arquivos prioritários:
1. ✅ tests/components/sections/lead-form.test.tsx (5 ocorrências)
2. ✅ tests/components/sections/benefits.test.tsx (2 ocorrências)
3. ✅ tests/contract-apis.test.ts (10 ocorrências)
4. ✅ tests/components/hero.test.tsx (4 ocorrências)
5. ✅ tests/components/pricing.test.tsx (7 ocorrências)
```

**Dia 8: Implementar beforeEach adequado**

```bash
# Problema: Falta beforeEach em múltiplos arquivos
# Solução: Implementar isolamento adequado entre testes
```

**Dia 9: Substituir fireEvent por userEvent**

```bash
# Arquivos afetados: 17 ocorrências
# userEvent simula interações reais do usuário
# fireEvent deve ser usado apenas quando necessário
```

**Dia 10: Melhorar mocks realistas**

```bash
# Problema: Mocks vazios (jest.fn())
# Solução: Implementar retornos realistas
# Exemplo: fetch mock deve retornar Promise<Response>
```

### **Critérios de Sucesso Fase 1:**

- [ ] Taxa de falha reduzida para < 5% (máximo 27 testes falhando)
- [ ] LeadForm: 0 testes falhando
- [ ] Benefits: 0 testes falhando
- [ ] Final CTA: 0 testes falhando
- [ ] API Endpoints: status codes corretos
- [ ] 0 ocorrências críticas de 'any'

---

## 🎯 **2. LEAD FORM COMPONENT (MAIOR PROBLEMA - 8/13 testes falhando)**

### **Problemas Identificados:**

**A. Queries Incorretas:**

```typescript
// ❌ ERRADO (teste falhando):
expect(screen.getByText("Enviar")).toBeInTheDocument();

// ✅ CORRETO:
expect(screen.getByText(mockContent.submitText)).toBeInTheDocument();
```

**B. Timeouts de Validação:**

```typescript
// Problema: Validações não funcionam como esperado
// Causa: Componente não implementa validação em tempo real
// Solução: Implementar validação síncrona no submit
```

**C. Isolamento entre Testes:**

```typescript
// Problema: beforeEach ausente
// Solução: Implementar limpeza adequada entre testes
beforeEach(() => {
  vi.clearAllMocks();
  // Limpar DOM se necessário
});
```

**D. Mocks de Animação:**

```typescript
// Problema: Framer Motion causando conflitos
// Solução: Melhorar mock para neutralizar completamente animações
```

### **Plano de Correção Detalhado:**

#### **Passo 1: Corrigir Queries (2 horas)**

```typescript
// 1. Ajustar todas as queries para usar mockContent
// 2. Usar getByRole ao invés de getByLabelText quando apropriado
// 3. Verificar se elementos existem no DOM antes de testar
```

#### **Passo 2: Implementar Validação Síncrona (4 horas)**

```typescript
// 1. Modificar componente para validar no submit
// 2. Remover validação assíncrona que causa timeouts
// 3. Implementar feedback visual de erro
```

#### **Passo 3: Melhorar Isolamento (2 horas)**

```typescript
// 1. Adicionar beforeEach em todos os testes
// 2. Implementar cleanup adequado
// 3. Evitar vazamento de estado entre testes
```

#### **Passo 4: Refatorar Mocks (3 horas)**

```typescript
// 1. Melhorar mock do Framer Motion
// 2. Implementar mock de fetch mais realista
// 3. Adicionar mocks para analytics
```

### **Critérios de Sucesso:**

- [x] Todos os 21 testes passando (3 skipped por animações)
- [x] Validação funcionando corretamente
- [x] Formulário funcional end-to-end
- [x] Sem timeouts ou assincronias desnecessárias

---

## 🎯 **3. TYPE SAFETY COMPROMETIDA (30 usos de 'any')**

### **Análise dos Arquivos Afetados:**

```
📊 DISTRIBUIÇÃO DE 'any':
├── tests/components/sections/lead-form.test.tsx: 5
├── tests/contract-apis.test.ts: 10
├── tests/components/pricing.test.tsx: 7
├── tests/components/hero.test.tsx: 4
├── tests/components/sections/benefits.test.tsx: 2
└── Outros arquivos: 2
```

### **Plano de Correção Sistemática:**

#### **Passo 1: Criar Tipos Adequados (4 horas)**

```typescript
// Criar interfaces específicas para mocks
interface MockFramerMotionProps {
  children: React.ReactNode;
  initial?: Record<string, any>; // ← Temporário, será removido
  animate?: Record<string, any>;
  transition?: Record<string, any>;
  // ... outros props
}

// Substituir any por tipos específicos
interface MockFetchResponse {
  ok: boolean;
  status: number;
  json: () => Promise<any>; // ← Será tipado
}
```

#### **Passo 2: Refatoração por Arquivo (16 horas)**

**Arquivo 1: lead-form.test.tsx (2 horas)**

```typescript
// ❌ Antes:
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, ...props }: any) => {

// ✅ Depois:
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial, animate, ...props }: MockFramerMotionProps) => {
```

**Arquivo 2: contract-apis.test.ts (4 horas)**

```typescript
// ❌ Antes:
json: vi.fn((data: any, options?: ResponseOptions) => ({

// ✅ Depois:
json: vi.fn((data: unknown, options?: ResponseOptions) => {
  // Validar data com Zod antes de usar
  const validatedData = ApiResponseSchema.parse(data)
```

**Arquivo 3: pricing.test.tsx (3 horas)**

```typescript
// ❌ Antes:
vi.mock('@/lib/utils', () => ({
  cn: (...classes: any[]) => classes.filter(Boolean).join(' '),

// ✅ Depois:
vi.mock('@/lib/utils', () => ({
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
```

#### **Passo 3: Implementar Validação com Zod (4 horas)**

```typescript
// Criar schemas para validar dados de teste
const MockUserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  company: z.string().optional(),
});

const MockApiResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown(),
  message: z.string().optional(),
});
```

#### **Passo 4: Verificação Final (2 horas)**

```bash
# Executar typecheck para confirmar
pnpm tsc --noEmit

# Verificar se 'any' foi eliminado
pnpm grep -r ": any" tests/ | wc -l  # Deve ser 0
```

### **Critérios de Sucesso:**

- [ ] 0 ocorrências de 'any' em testes
- [ ] TypeScript strict passando
- [ ] Validação com Zod implementada
- [ ] Sem erros de compilação

---

## 🎯 **4. QUALIDADE DE TESTES INACEITÁVEL**

### **Problemas Identificados:**

**A. Uso Excessivo de 'any' (30 ocorrências):**

- Mocks inadequados
- Falta de tipagem
- Comprometimento da type safety

**B. fireEvent vs userEvent (17 ocorrências):**

```typescript
// ❌ fireEvent - não realista
fireEvent.click(button);

// ✅ userEvent - simula usuário real
await userEvent.click(button);
```

**C. Falta beforeEach:**

- Vazamento entre testes
- Estado compartilhado
- Resultados não determinísticos

**D. Mocks Inadequados:**

```typescript
// ❌ Mock vazio
const mockFn = vi.fn();

// ✅ Mock realista
const mockFn = vi.fn().mockResolvedValue({ success: true });
```

**E. Asserções Apenas de Presença (75% dos testes):**

```typescript
// ❌ Apenas presença
expect(element).toBeInTheDocument();

// ✅ Funcionalidade real
expect(element).toHaveTextContent("expected text");
expect(element).toBeEnabled();
```

### **Plano de Melhoria Sistemática:**

#### **Fase 1: Correções Básicas (1 semana)**

**Dia 1-2: Substituir fireEvent por userEvent**

```typescript
// Instalar @testing-library/user-event se necessário
import userEvent from "@testing-library/user-event";

// Substituir todos os fireEvent.click por userEvent.click
// Manter fireEvent apenas para eventos não suportados por userEvent
```

**Dia 3-4: Implementar beforeEach Adequado**

```typescript
// Padrão para todos os arquivos:
describe("Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Cleanup adicional se necessário
  });

  // ... testes
});
```

**Dia 5-6: Melhorar Mocks**

```typescript
// Exemplo: Mock de fetch realista
const mockFetch = vi.fn().mockImplementation((url: string) => {
  if (url.includes("/api/submit")) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, id: "123" }),
    });
  }
  return Promise.reject(new Error("Not found"));
});
```

**Dia 7: Refatorar Asserções**

```typescript
// De presença para funcionalidade
// ❌ expect(screen.getByText('button')).toBeInTheDocument()
// ✅ expect(button).toBeEnabled()
// ✅ expect(button).toHaveAttribute('type', 'submit')
```

#### **Fase 2: Padrões Avançados (1 semana)**

**Dia 8-9: Implementar Test Helpers**

```typescript
// Criar helpers reutilizáveis
export const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      <AnalyticsProvider>
        {component}
      </AnalyticsProvider>
    </ThemeProvider>
  )
}
```

**Dia 10-11: Padrões de Nomeação**

```typescript
// Padrão consistente:
describe("ComponentName", () => {
  describe("when condition", () => {
    it("should behavior", () => {
      // Test implementation
    });
  });
});
```

**Dia 12-13: Cobertura e Métricas**

```typescript
// Implementar testes de cobertura
// Configurar métricas de qualidade
// Documentar padrões de teste
```

**Dia 14: Revisão Final**

```typescript
// Executar todos os testes
// Verificar cobertura
// Documentar melhorias
```

### **Critérios de Sucesso:**

- [ ] 0 ocorrências de fireEvent (exceto onde necessário)
- [ ] beforeEach implementado em todos os arquivos
- [ ] Mocks realistas e bem tipados
- [ ] Asserções funcionais (não apenas presença)
- [ ] Cobertura de testes > 80%
- [ ] Padrões documentados

---

## 📊 **CRONOGRAMA GERAL DE CORREÇÃO**

### **FASE 1: ESTABILIZAÇÃO CRÍTICA (2 semanas)**

- **Semana 1:** Correções urgentes (LeadForm, Benefits, Final CTA, APIs)
- **Semana 2:** Qualidade básica (eliminar 'any', beforeEach, mocks)

### **FASE 2: VALIDAÇÃO FUNCIONAL (1 semana)**

- **Semana 3:** Testes end-to-end, Core Web Vitals, Acessibilidade

### **FASE 3: OTIMIZAÇÃO (1 semana)**

- **Semana 4:** Performance, bundle, cache, error boundaries

### **FASE 4: PRODUÇÃO (1 semana)**

- **Semana 5:** Deploy gradual, monitoring, rollback plan

---

## 🎯 **MÉTRICAS DE SUCESSO POR FASE**

### **Fase 1 - Estabilização:**

- ✅ Taxa de falha: < 5% (27 testes falhando máximo)
- ✅ LeadForm: 13/13 testes passando
- ✅ Benefits: testes passando
- ✅ Final CTA: testes passando
- ✅ APIs: status codes corretos
- ✅ Type safety: 0 'any' críticos

### **Fase 2 - Validação:**

- ✅ Lighthouse: > 90 em todas as métricas
- ✅ Acessibilidade: WCAG 2.1 AA
- ✅ Core Web Vitals: LCP < 2.5s, CLS < 0.1
- ✅ E2E: fluxos críticos funcionando

### **Fase 3 - Otimização:**

- ✅ Bundle size: < 200KB
- ✅ Performance: 95+ Lighthouse
- ✅ Error boundaries: implementados
- ✅ Cache: configurado corretamente

### **Fase 4 - Produção:**

- ✅ Deploy gradual bem-sucedido
- ✅ Monitoring ativo
- ✅ Rollback funcionando
- ✅ Métricas de negócio positivas

---

## 🚨 **PLANOS DE CONTINGÊNCIA**

### **Risco 1: Correções Mais Complexas que Previsto**

**Mitigação:**

- Focar primeiro nos testes críticos (LeadForm)
- Implementar feature flags para isolamento
- Deploy gradual por seção

### **Risco 2: Regressões Durante Correções**

**Mitigação:**

- Commits pequenos e frequentes
- CI/CD com testes em cada PR
- Rollback automático se métricas degradarem

### **Risco 3: Prazo Estourado**

**Mitigação:**

- Priorização clara (LeadForm primeiro)
- Scope reduzido se necessário
- Comunicação transparente com stakeholders

---

## 📋 **CHECKLIST FINAL DE DEPLOY**

### **Pré-Deploy:**

- [ ] Todos os 554 testes passando
- [ ] Lighthouse > 90
- [ ] Core Web Vitals dentro dos budgets
- [ ] Acessibilidade WCAG 2.1 AA
- [ ] Bundle size otimizado
- [ ] Type safety 100%
- [ ] E2E tests passando

### **Deploy:**

- [ ] Feature flags para rollback
- [ ] Monitoring ativo
- [ ] Alertas configurados
- [ ] Plano de rollback testado

### **Pós-Deploy:**

- [ ] Métricas de negócio monitoradas
- [ ] Performance em produção validada
- [ ] Feedback de usuários coletado
- [ ] Iteração baseada em dados

---

**Diretor de Web Design**  
_Planos de Correção Detalhados_  
_23 de outubro de 2025_
