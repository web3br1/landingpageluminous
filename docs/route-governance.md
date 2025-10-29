# 🎯 Governança de Rotas - Luminaris SaaS

**Status:** ✅ **ATIVO** | **Versão:** 1.0 | **Última atualização:** Outubro 2025

---

## 📋 **ÍNDICE EXECUTIVO**

### **Rotas Oficiais (Composição Unificada)**

| Rota                 | PageType            | Status          | Propósito                 | Dono    |
| -------------------- | ------------------- | --------------- | ------------------------- | ------- |
| `/`                  | `landing`           | ✅ **Produção** | Landing page principal    | Product |
| `/features`          | `features`          | ✅ **Produção** | Página de funcionalidades | Product |
| `/pricing`           | `pricing`           | ✅ **Produção** | Página de preços          | Product |
| `/demo`              | `demo`              | ✅ **Produção** | Demonstração do produto   | Product |
| `/signup`            | `signup`            | ✅ **Produção** | Formulário de cadastro    | Product |
| `/trial`             | `trial`             | ✅ **Produção** | Trial gratuito            | Product |
| `/checkout`          | `checkout`          | ✅ **Produção** | Finalização de compra     | Product |
| `/admin/experiments` | `admin-experiments` | ✅ **Admin**    | Dashboard A/B testing     | Eng     |
| `/admin/ml`          | `admin-ml`          | ✅ **Admin**    | Dashboard ML/AI           | Eng     |
| `/admin/monitoring`  | `admin-monitoring`  | ✅ **Admin**    | Monitoramento sistema     | Eng     |

### **Rotas de Desenvolvimento (No Index)**

| Rota            | PageType       | Status     | Propósito                   | Cleanup |
| --------------- | -------------- | ---------- | --------------------------- | ------- |
| `/debug-styles` | `debug-styles` | 🧪 **Dev** | Debug CSS/Tailwind          | Q4 2025 |
| `/dev`          | `dev`          | 🧪 **Dev** | Ferramentas desenvolvimento | Q4 2025 |
| `/playground`   | `playground`   | 🧪 **Dev** | Playground componentes      | Q4 2025 |
| `/test`         | `test`         | 🧪 **Dev** | Páginas de teste            | Q4 2025 |
| `/test-styles`  | `test-styles`  | 🧪 **Dev** | Testes de estilos           | Q4 2025 |
| `/ssr-test`     | `ssr-test`     | 🧪 **Dev** | Testes SSR                  | Q4 2025 |

### **Rotas Especiais/Redirecionamentos**

| Rota      | Comportamento                              | Status       | Propósito               |
| --------- | ------------------------------------------ | ------------ | ----------------------- |
| `/[slug]` | Redirecionamento para `/`                  | ✅ **Ativo** | Tenant routing (futuro) |
| `/admin`  | Redirecionamento para `/admin/experiments` | ✅ **Ativo** | Shortcut admin          |

---

## 🎯 **REGRAS DE GOVERNANÇA**

### **1. Criação de Novas Rotas**

#### **Pré-requisitos:**

- [ ] **PageType** definido em `lib/composition/ports.ts`
- [ ] **Configuração** adicionada em `page-composition-service.ts`
- [ ] **Componentes** mapeados em `route-based-lazy-loading.tsx`
- [ ] **Metadata dinâmico** implementado
- [ ] **SEO correto** (canonical, robots)
- [ ] **Analytics** instrumentado

#### **Checklist de Aprovação:**

- [ ] **PM/PO:** Aprova necessidade de negócio
- [ ] **Design:** Wireframes aprovados
- [ ] **Eng:** Estimativa técnica ≤ 2 dias
- [ ] **SEO:** Keywords e estrutura validadas

### **2. Convenções de Naming**

#### **PageTypes:**

```typescript
// ✅ Correto
"landing" | "features" | "pricing" | "demo";
"signup" | "trial" | "checkout";
"admin-experiments" | "admin-ml" | "admin-monitoring";

// ❌ Incorreto
"LandingPage" | "features-page" | "pricingPage";
"admin_experiments" | "AdminExperiments";
```

#### **Rotas de URL:**

```bash
# ✅ Correto
/features      # Kebab-case, sem extensão
/pricing       # Singular quando apropriado
/admin/ml      # Prefixo admin/ para admin pages

# ❌ Incorreto
/Features      # PascalCase
/features.html # Extensão
/admin-ml      # Sem prefixo consistente
```

### **3. PageType Hierarchy**

```
📊 PUBLIC PAGES (SEO Indexado)
├── landing (/) - Principal funil de entrada
├── features (/features) - Demonstra valor
├── pricing (/pricing) - Converte visitantes
├── demo (/demo) - Fecha venda
├── signup (/signup) - Converte leads
├── trial (/trial) - Trial onboarding
└── checkout (/checkout) - Finaliza compra

👑 ADMIN PAGES (No Index)
├── admin-experiments - A/B testing
├── admin-ml - Machine Learning
├── admin-monitoring - System monitoring
├── admin-performance - Performance metrics
├── admin-tracing - Distributed tracing
├── admin-logs - System logs
└── admin-webhooks - Webhook management

🧪 DEVELOPMENT PAGES (No Index, Dev Only)
├── debug-* - Debugging tools
├── dev - Development utilities
├── playground - Component testing
├── test* - Test pages
└── *-test - Test utilities
```

---

## 🚀 **PROCESSO DE DEPLOY**

### **Fase 1: Desenvolvimento**

```bash
# 1. Criar PageType
git checkout -b feature/new-route-[routename]

# 2. Implementar configuração
# Editar: lib/composition/ports.ts
# Editar: lib/composition/services/page-composition-service.ts
# Editar: lib/composition/performance/route-based-lazy-loading.tsx

# 3. Criar página física
# Criar: app/[route]/page.tsx

# 4. Testar localmente
npm run dev
```

### **Fase 2: Code Review**

```bash
# 1. PR Template Checklist
- [ ] PageType adicionado corretamente
- [ ] Configuração validada
- [ ] Componentes mapeados
- [ ] Metadata dinâmico
- [ ] SEO configurado
- [ ] Analytics instrumentado

# 2. Testes obrigatórios
npm run type-check
npm run lint
npm run test:unit
npm run test:e2e # (se aplicável)
```

### **Fase 3: Deploy**

```bash
# 1. Deploy gradual
# Feature flag para nova rota (opcional)

# 2. Monitoramento
# - Performance impact
# - SEO impact
# - User behavior changes

# 3. Rollback plan
# - Feature flag disable
# - Route removal
```

---

## 📊 **MÉTRICAS DE GOVERNANÇA**

### **KPIs de Qualidade**

- **Lead time** para nova rota: ≤ 2 dias
- **Taxa de sucesso** de rotas novas: ≥ 95%
- **Incidentes** por rota nova: 0 nos primeiros 30 dias
- **Performance impact** de nova rota: ≤ 5% degradation

### **Monitoramento Contínuo**

```typescript
// Rota health check (exemplo)
interface RouteHealth {
  path: string;
  status: "healthy" | "degraded" | "critical";
  lcp: number;
  cls: number;
  fid: number;
  seoScore: number;
  lastChecked: Date;
}
```

---

## 🎯 **ROADMAP DE EVOLUÇÃO**

### **Q4 2025: Estabilização**

- ✅ Unificar sistema de composição
- ✅ Migrar admin pages
- ✅ Resolver duplicação [slug]
- ✅ Implementar governança atual

### **Q1 2026: Otimização**

- [ ] Automatizar criação de rotas
- [ ] Dashboard de health de rotas
- [ ] A/B testing de rotas
- [ ] Analytics avançado por rota

### **Q2 2026: Inovação**

- [ ] Tenant-aware routing (multi-tenant)
- [ ] Dynamic route generation
- [ ] Route performance optimization
- [ ] Advanced personalization

---

## 📞 **SUPORTE E MANUTENÇÃO**

### **Dono por Categoria**

- **Public Pages:** Product Manager + Engineering Lead
- **Admin Pages:** Engineering Lead + DevOps
- **Dev Pages:** Individual contributors (auto-gerenciado)

### **Processo de Mudanças**

1. **Proposta:** Issue no repositório com justificativa
2. **Aprovação:** PM para business, Eng Lead para technical
3. **Implementação:** Seguir processo de deploy
4. **Monitoramento:** 30 dias de observação

### **Contatos de Emergência**

- **SEO Issues:** SEO Specialist
- **Performance Issues:** Performance Engineer
- **Security Issues:** Security Team
- **General Issues:** Engineering Lead

---

## ✅ **CHECKLIST DE CONFORMIDADE**

### **Para Cada Rota Existente:**

- [ ] PageType definido corretamente
- [ ] Configuração no page-composition-service
- [ ] Componentes mapeados no lazy loading
- [ ] Metadata dinâmico implementado
- [ ] SEO configurado (canonical, robots)
- [ ] Analytics instrumentado
- [ ] Documentado neste arquivo

### **Para Novas Rotas:**

- [ ] Aprovada por PM + Eng Lead
- [ ] Segue convenções de naming
- [ ] Checklist completo executado
- [ ] Documentação atualizada

---

**Mantido pela equipe Luminaris** 🚀
_Última revisão: Outubro 2025_
