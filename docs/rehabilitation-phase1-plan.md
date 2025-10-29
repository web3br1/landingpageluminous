# 🚀 **Plano de Reabilitação - Fase 1: Crítica**

**Data:** 2025-10-24
**Status:** Planejado
**Prioridade:** Crítica 🔴
**Prazo Estimado:** 1-2 sprints (2-4 semanas)

## 🎯 **Objetivos da Fase 1**

Restaurar as funcionalidades críticas desabilitadas para priorizar **estabilidade e observabilidade**, mantendo a arquitetura Composition-First intacta.

### **Critérios de Sucesso**

- ✅ **100% dos testes desabilitados** restaurados e passando
- ✅ **Observabilidade completa** com métricas, tracing e logs estruturados
- ✅ **Analytics funcional** com eventos de conversão rastreados
- ✅ **Performance mantida** (Core Web Vitals < 2.5s LCP)
- ✅ **Estabilidade garantida** (0 erros críticos em produção)

---

## 📋 **Escopo da Fase 1**

### **1. 🔧 Testes Desabilitados (Prioridade Máxima)**

**Arquivos a restaurar:**

- `tests/api-monitoring.test.tsx.disabled` → `tests/api-monitoring.test.tsx`
- `tests/unit/ssr-fixes.test.ts.disabled` → `tests/unit/ssr-fixes.test.ts`
- `tests/analytics.test.ts.disabled` → `tests/analytics.test.ts`
- `tests/api-chatbot.test.ts.disabled` → `tests/api-chatbot.test.ts`
- `tests/flags.test.ts.disabled` → `tests/flags.test.ts`
- `app/api/webhooks/stripe/route-simple.ts.disabled` → `app/api/webhooks/stripe/route-simple.ts`

**Estratégia de Restauração:**

1. **Auditoria individual** de cada teste desabilitado
2. **Correção gradual** baseada em dependências
3. **Integração com CI/CD** para validação automática
4. **Documentação** de lições aprendidas

### **2. 📈 @shared/observ - Observabilidade Completa**

**Objetivo:** Implementar observabilidade production-ready com métricas, tracing e logs estruturados.

**Atividades:**

- ✅ **Habilitar import** em `lib/composition/adapters/infrastructure-adapters.ts`
- ✅ **Configurar métricas** (`db_tx_duration_ms`, `api_response_time`)
- ✅ **Implementar tracing** (`db.persist_document`, `api.call`)
- ✅ **Estruturar logs** com traceId, tenantId e contexto
- ✅ **Integrar Sentry** para error tracking avançado

**Benefícios Esperados:**

- 🔍 **Visibilidade completa** do sistema em produção
- 📊 **Métricas de negócio** (conversões, performance)
- 🐛 **Debug facilitado** com traces distribuídos
- 📈 **Monitoramento proativo** com alertas inteligentes

### **3. 📊 Plausible Analytics - Métricas de Conversão**

**Objetivo:** Restaurar analytics avançado compatível com Next.js 16.

**Atividades:**

- ✅ **Atualizar dependências** para versão compatível
- ✅ **Reimplementar PlausibleProvider** com lazy loading
- ✅ **Configurar eventos** de conversão (CTA clicks, form submissions)
- ✅ **Implementar tracking** de scroll depth e engagement
- ✅ **Testar integração** em staging environment

**Eventos Críticos:**

- `page_view` - Todas as páginas
- `cta_click` - Botões de conversão
- `form_submit` - Submissões de formulário
- `experiment_view` - Impressões de A/B tests

---

## 🏗️ **Arquitetura e Dependências**

### **Dependências Externas Necessárias**

```json
{
  "@shared/observ": "^1.0.0",
  "plausible-tracker": "^1.3.0",
  "@sentry/nextjs": "^8.0.0"
}
```

### **Mudanças Arquiteturais**

**Antes (Desabilitado):**

```typescript
// ❌ Import comentado
// import { timed } from '@/shared/observ'
```

**Depois (Ativo):**

```typescript
// ✅ Import ativo
import { timed } from "@/shared/observ";

// Uso em use-cases
export const someUseCase = timed("someUseCase", async (input) => {
  // lógica do caso de uso
});
```

### **Padrões de Observabilidade**

```typescript
// Métricas padrão
const METRICS = {
  db_tx_duration_ms: "histogram",
  api_response_time: "histogram",
  error_rate: "counter",
  conversion_rate: "gauge",
};

// Tracing spans
const SPANS = {
  "db.persist_document": "Database operations",
  "api.call": "External API calls",
  "user.action": "User interactions",
};
```

---

## 📅 **Cronograma Detalhado**

### **Sprint 1: Fundamentos (Semanas 1-2)**

#### **Semana 1: Testes e Observabilidade**

- **Dia 1-2:** Restauração de testes desabilitados (priorizar críticos)
- **Dia 3-4:** Implementação de @shared/observ
- **Dia 5:** Configuração de métricas básicas

#### **Semana 2: Analytics e Validação**

- **Dia 1-3:** Plausible Analytics compatível com Next.js 16
- **Dia 4-5:** Testes de integração e validação

### **Sprint 2: Otimização e Produção (Semanas 3-4)**

#### **Semana 3: Refinamentos**

- **Dia 1-2:** Otimização de performance das métricas
- **Dia 3-4:** Alertas e dashboards
- **Dia 5:** Testes de carga

#### **Semana 4: Deploy e Monitoramento**

- **Dia 1-2:** Deploy gradual em staging
- **Dia 3-4:** Monitoramento e ajustes
- **Dia 5:** Deploy em produção com rollback plan

---

## 🔍 **Riscos e Mitigações**

### **Risco 1: Quebra de Compatibilidade**

**Probabilidade:** Média
**Impacto:** Alto
**Mitigação:**

- Ambiente de staging isolado
- Rollback automático em caso de falha
- Feature flags para controle gradual

### **Risco 2: Overhead de Performance**

**Probabilidade:** Baixa
**Impacto:** Médio
**Mitigação:**

- Métricas de performance incluídas no monitoramento
- Lazy loading para componentes pesados
- Budget de performance definido

### **Risco 3: Dependências Externas**

**Probabilidade:** Baixa
**Impacto:** Alto
**Mitigação:**

- Fallbacks implementados para falhas de dependências
- Circuit breakers para serviços externos
- Cache local para reduzir dependências

---

## ✅ **Critérios de Aceitação**

### **Funcional**

- [ ] Todos os testes desabilitados restaurados e passando (100%)
- [ ] @shared/observ totalmente integrado
- [ ] Plausible Analytics funcional em produção
- [ ] Eventos de conversão rastreados corretamente
- [ ] Métricas de negócio coletadas (conversões, engagement)

### **Performance**

- [ ] LCP < 2.5s (sem degradação)
- [ ] Overhead de observabilidade < 5% da performance
- [ ] Bundle size mantido < 180KB crítico
- [ ] Time to Interactive < 3s

### **Qualidade**

- [ ] Cobertura de testes > 80%
- [ ] 0 vulnerabilidades de segurança
- [ ] Lighthouse Score > 90 em todas as métricas
- [ ] 0 erros em produção (Sentry clean)

### **Operacional**

- [ ] Dashboards de observabilidade funcionais
- [ ] Alertas configurados para métricas críticas
- [ ] Runbooks atualizados
- [ ] Rollback testado e documentado

---

## 📊 **Métricas de Sucesso**

### **KPIs de Produto**

- **Conversões:** Aumento de 15% na taxa de conversão
- **Engagement:** Redução de 20% na taxa de bounce
- **Performance:** Manutenção de Core Web Vitals

### **KPIs Técnicos**

- **Disponibilidade:** 99.9% uptime
- **Latência:** P95 < 200ms para APIs críticas
- **Erros:** < 0.1% de erro rate

### **KPIs de Processo**

- **Velocidade:** 100% dos testes automatizados
- **Qualidade:** 0 bugs críticos em produção
- **Observabilidade:** 100% dos fluxos críticos monitorados

---

## 🔄 **Próximas Fases (Contexto)**

### **Fase 2: Funcionalidades (2-3 sprints)**

- Temas CSS completos
- A/B Testing ativo
- UX avançado (Chat, Onboarding, Recomendações)

### **Fase 3: Otimização (1 sprint)**

- Debug overlays
- Webhooks completos
- Monitoramento avançado

---

## 📋 **Checklist de Validação**

### **Pré-Deploy**

- [ ] Todos os testes passando localmente
- [ ] Staging environment configurado
- [ ] Rollback plan documentado
- [ ] Comunicação com stakeholders

### **Deploy**

- [ ] Deploy gradual (canary deployment)
- [ ] Monitoramento ativo durante deploy
- [ ] Testes automatizados em produção
- [ ] Comunicação de status

### **Pós-Deploy**

- [ ] Métricas de baseline coletadas
- [ ] Alertas testados
- [ ] Documentação atualizada
- [ ] Retrospective agendada

---

## 👥 **Responsabilidades**

### **Tech Lead/Architect**

- Aprovação de arquitetura e decisões técnicas
- Supervisão de qualidade de código
- Coordenação com outros squads

### **Dev Team**

- Implementação das funcionalidades
- Testes e validação
- Documentação técnica

### **QA**

- Testes funcionais e não-funcionais
- Validação de performance
- Testes de regressão

### **DevOps/SRE**

- Configuração de monitoramento
- Deploy e infraestrutura
- Alertas e runbooks

### **Product**

- Definição de métricas de sucesso
- Validação de funcionalidades
- Comunicação com usuários

---

## 💡 **Lições Aprendidas (da Desabilitação)**

### **Decisões Corretas**

- ✅ **Priorização de estabilidade** sobre funcionalidades
- ✅ **Preservação do código** para reabilitação gradual
- ✅ **Documentação clara** dos motivos de desabilitação

### **Melhorias para o Futuro**

- 🔄 **Feature flags** mais granulares
- 🔄 **Circuit breakers** automáticos
- 🔄 **Testes canary** antes de reabilitação completa

---

_Este plano será revisado semanalmente e ajustado baseado em aprendizados e feedback da implementação._
