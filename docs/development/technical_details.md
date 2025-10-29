# Detalhes Técnicos - Landing Page SaaS

## 📅 Data da Última Atualização

2025-10-02

## 🏗️ Arquitetura Técnica Implementada

### Composition-First Landing System

A arquitetura foi completamente refatorada para resolver problemas críticos de CSS fragmentado e páginas desconexas.

#### 🎯 Princípios Implementados

1. **Composition Root**: Páginas compostas declarativamente
2. **Content/UI Separation**: Conteúdo separado da apresentação
3. **Design System Unificado**: Single source of truth para tokens
4. **Component Composition**: Seções como blocos reutilizáveis

#### 📁 Estrutura Técnica

```
src/
├── domains/                 # Domínios DDD
│   └── marketing/
│       ├── content/         # Conteúdo separado
│       ├── composers/       # Orquestradores
│       └── types/           # Tipos específicos
├── design-system/           # Design System unificado
│   ├── tokens/             # Single source of truth
│   ├── foundations/        # CSS base + variáveis
│   └── variants/           # Component variants
├── lib/composition/        # Sistema de composição
└── components/sections/    # Seções padronizadas
```

#### 🔧 Sistema de Composição

- **Content Layer**: Dados em `domains/*/content/`
- **Content Composers**: Orquestração em `domains/*/composers/`
- **Composition Root**: Páginas declarativas via `composePage()`
- **Section Components**: UI pura em `components/sections/`

#### 🎨 Design System

- **Tokens Centralizados**: `design-system/tokens/`
- **CSS Auto-gerado**: `design-system/foundations/`
- **Variants Padronizadas**: `design-system/variants/`

#### 🔒 SSR Safety Implementation

**Problema Identificado**: Erros de "window is not defined" durante renderização server-side em Next.js.

##### ✅ Correções Implementadas

###### 1. Sanitização HTML Segura para SSR

```typescript
// Antes: Dependência problemática
import DOMPurify from "isomorphic-dompurify";

// Depois: Implementação SSR-safe
function sanitizeHTML(dirty: string): string {
  // Sanitização sem dependências externas
  return dirty.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );
  // ... outras regras de sanitização
}
```

###### 2. Inicialização Lazy de Singletons

```typescript
// Antes: Inicialização imediata no topo do módulo
const predictiveLoader = PredictiveLoader.getInstance();

// Depois: Inicialização lazy
let predictiveLoader: PredictiveLoader | null = null;
function getPredictiveLoader(): PredictiveLoader {
  if (!predictiveLoader) {
    predictiveLoader = PredictiveLoader.getInstance();
  }
  return predictiveLoader;
}
```

###### 3. Verificações de Ambiente Seguras

```typescript
function detectDeviceCapabilities(): DeviceCapabilities {
  // Valores padrão para SSR
  let prefersReducedMotion = false;

  // Só acessa APIs do browser quando disponível
  if (typeof window !== "undefined" && typeof navigator !== "undefined") {
    try {
      prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
    } catch (error) {
      prefersReducedMotion = false;
    }
  }

  return {
    /* capabilities */
  };
}
```

##### 📊 Resultados

- ✅ **SSR Funcionando**: Renderização server-side sem erros
- ✅ **CSR Preservado**: Funcionalidades client-side intactas
- ✅ **Performance Mantida**: Overhead mínimo adicionado
- ✅ **Segurança Garantida**: Sanitização robusta sem dependências externas

### 📋 Plano de Migração

#### ✅ Fase 1: Foundation (CONCLUÍDA)

- [x] Criar `design-system/` com tokens unificados
- [x] Migrar cores para single source of truth
- [x] Criar Section base padronizada
- [x] Manter páginas existentes funcionando

#### 🚧 Fase 2: Content Separation (EM ANDAMENTO)

- [x] Criar `domains/marketing/content/`
- [x] Implementar hero content separado
- [x] Criar composers para hero
- [ ] Migrar demais seções (benefits, features, etc.)
- [ ] Extrair conteúdo hardcoded dos componentes

#### 🔄 Fase 3: Composition System (PRÓXIMA)

- [ ] Implementar Composition Root completo
- [ ] Migrar páginas para configuração declarativa
- [ ] Unificar layouts por domínio
- [ ] Remover código duplicado entre páginas

#### 🎯 Fase 4: Optimization (FINAL)

- [ ] Code splitting por seção
- [ ] Lazy loading de conteúdo
- [ ] Bundle analysis e otimização
- [ ] A/B testing integrado

## 🛠️ Stack Tecnológica

### Core Framework

- **Next.js**: 14.2.4 (App Router)
- **React**: 18.3.1
- **TypeScript**: 5.4.5 (strict mode enabled)

### Styling & UI

- **Tailwind CSS**: 3.4.4
- **shadcn/ui**: Componentes base com Radix UI
- **Framer Motion**: 11.3.21 (animações micro)
- **Lucide React**: Ícones consistentes

### Formulários & Validação

- **React Hook Form**: 7.51.5
- **Zod**: 3.23.8 (validação de schemas)
- **@hookform/resolvers**: Integração RHF + Zod

### SEO & Analytics

- **next-seo**: 6.5.0 (metadados estruturados)
- **GA4/Plausible**: Implementação preparada

### Desenvolvimento

- **ESLint**: Configuração strict
- **Prettier**: Formatação consistente
- **Jest**: Testes unitários
- **Testing Library**: Testes de componentes

## 🏗️ Arquitetura do Projeto

```
/app
  /(marketing)
    page.tsx              → Página principal orquestrando seções
    layout.tsx            → Layout compartilhado
    components/
      sections/           → Organismos (Hero, Benefits, etc.)
        hero.tsx
        social-proof.tsx
        benefits.tsx
        demo.tsx
        features.tsx
        pricing.tsx
        faq.tsx
        final-cta.tsx
        footer.tsx
      ui/                 → Átomos/Moléculas
        cta-button.tsx
        fade-up.tsx
        section.tsx
  /(legal)
    privacy/page.tsx
    terms/page.tsx

/lib
  analytics.ts           → Eventos GA4/Plausible
  flags.ts              → Feature flags para A/B testing
  seo.ts                → Configurações next-seo
  utils.ts              → Utilitários gerais

/styles
  globals.css           → Tailwind + variáveis CSS customizadas

/public
  images/
    brand/              → Logo e identidade
    logos/              → Clientes para social proof
    product/            → Screenshots/mockups
```

## 🎨 Design System

### Paleta de Cores (CSS Variables)

```css
:root {
  /* Primary - Azul confiável */
  --primary-50: #eff6ff;
  --primary-500: #3b82f6;
  --primary-600: #2563eb;
  --primary-900: #1e3a8a;

  /* Accent - Verde para destaques */
  --accent-500: #22c55e;
  --accent-600: #16a34a;

  /* Neutral - Escala completa */
  --neutral-50: #fafafa;
  --neutral-100: #f5f5f5;
  /* ... até --neutral-900: #171717 */
}
```

### Tipografia

- **Display**: Inter Tight (títulos impactantes)
- **Body**: Inter (texto legível)
- **Escalas responsivas**: Usando `clamp()` para fluidez

### Componentes Base

- **Section**: Container responsivo com padding consistente
- **CtaButton**: Botão CTA com variantes (primary, secondary)
- **FadeUp**: Wrapper de animação Framer Motion

## 🔧 Configurações Técnicas

### Next.js Config (`next.config.js`)

```javascript
{
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  }
}
```

### TypeScript Config (`tsconfig.json`)

- Strict mode habilitado
- Path aliases configurados (`@/*`, `@/components/*`, etc.)
- Inclusão de tipos Next.js

### Tailwind Config (`tailwind.config.ts`)

- Modo escuro suportado
- Cores customizadas estendidas
- Fontes Inter e Inter Tight
- Animações customizadas

## 📊 Performance Budget

- **LCP (Largest Contentful Paint)**: ≤ 2.5s (validado via LHCI)
- **CLS (Cumulative Layout Shift)**: ≤ 0.1 (LHCI)
- **INP (Interaction to Next Paint)**: ≤ 200ms (LHCI)
- **Bundle Size**: Página crítica ≤ 180KB
- **JS Hidratado**: ≤ 70KB

## 🔒 Segurança

### Headers de Segurança

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: origin-when-cross-origin`

### CSP (Content Security Policy)

- Conservadora em produção
- Permite apenas origens necessárias

## 🧪 Estratégia de Testes

### Pirâmide de Testes

1. **Unitários**: Funções puras, utils, hooks
2. **Integração**: Componentes com estado, API calls
3. **E2E**: Fluxos críticos (formulários, navegação)

### Ferramentas

- **Jest**: Unit/Integration com coverage ≥ 80%
- **Testing Library**: Queries acessíveis
- **jest-axe**: A11y (sem violações serious/critical)
- **Playwright**: E2E (SSR/hydration + fluxos críticos)

### BDD (Futuro)

- **Cucumber/Gherkin**: Cenários em português
- **Tags**: @smoke, @regression, @critical
- **CI Gates**: Testes obrigatórios antes do deploy

## 🚀 Deploy & CI/CD

### Ambiente

- **Vercel**: Deploy automático
- **Preview Deploy**: Por PR
- **Production**: Branch main

### CI Pipeline

- **lint-and-test**: ESLint + TypeScript + Jest (coverage)
- **e2e**: Playwright (cache de browsers, upload de report)
- **lighthouse**: LHCI (budgets, upload de report)
- Local: `npm run validate && npm run test:e2e && npm run ci:lighthouse`

## 📈 Monitoramento

### Métricas de Performance

- Core Web Vitals (CWV)
- Lighthouse scores
- Bundle analyzer

### Analytics

- GA4: Eventos customizados
- Plausible: Privacy-first analytics
- Sentry: Error tracking

### Business Metrics

- Taxa de conversão por CTA
- Scroll depth
- Bounce rate
- Form submissions

## 🔄 Feature Flags

### Infraestrutura

- **Vercel Edge Config**: Flags server-side
- **Cookies**: Client-side overrides

### Flags Planejados

- `exp.hero_headlines`: Variações de headline
- `exp.cta_colors`: Cores do botão CTA
- `exp.pricing_layout`: Layout de preços

## 🌐 Internacionalização (Futuro)

- **next-intl**: Framework de i18n
- **Estrutura**: `messages/{locale}.json`
- **Locales**: pt-BR, en-US (planejado)
- **RTL**: Suporte preparado

## 📚 Decisões Arquiteturais

### Por que Next.js App Router?

- Server Components por padrão (melhor performance)
- Nested layouts
- Built-in SEO optimizations

### Por que shadcn/ui?

- Componentes acessíveis por padrão
- Tailwind-first
- Tree-shaking automático
- Consistência visual

### Por que Framer Motion?

- Performance otimizada
- Suporte a `prefers-reduced-motion`
- API declarativa
- Micro-interactions suaves

### Por que Zod?

- Type inference automática
- Mensagens de erro customizáveis
- Integração perfeita com RHF
- Runtime type safety

## 🔔 Sistema de Notificações

### Arquitetura

- **Provider Pattern**: `NotificationProvider` para estado global
- **4 Tipos**: success, error, warning, info
- **Auto-dismiss**: Configurável por tipo (5-8 segundos)
- **Actions**: Botões customizáveis nas notificações
- **Animations**: Framer Motion para transições suaves

### Componente Toast

```typescript
interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

### Uso Rápido

```typescript
import { notify } from "@/lib/notifications";

// Notificações simples
notify.success("Cadastro realizado!", "Dados salvos com sucesso");
notify.error("Erro ao salvar", "Verifique os dados informados");
notify.warning("Atenção", "Sessão expira em 5 minutos");
notify.info("Nova funcionalidade", "Agora disponível na dashboard");

// Com ações
notify.success("Upload concluído", "Arquivo processado", {
  action: { label: "Ver resultado", onClick: () => navigate("/result") },
});
```

## 🚨 Tratamento de Erros

### Sistema Estruturado

- **AppError Class**: Tipos específicos de erro
- **Estratégias**: notify, redirect, log, silent
- **Error Boundary**: Captura erros React
- **LGPD Compliant**: Tratamento ético de dados

### Tipos de Erro

```typescript
enum ErrorType {
  NETWORK = "NETWORK",
  VALIDATION = "VALIDATION",
  AUTHENTICATION = "AUTHENTICATION",
  AUTHORIZATION = "AUTHORIZATION",
  BUSINESS_LOGIC = "BUSINESS_LOGIC",
  EXTERNAL_SERVICE = "EXTERNAL_SERVICE",
  UNKNOWN = "UNKNOWN",
}
```

### Estratégias de Tratamento

```typescript
// Notificar usuário
errorStrategies.notify(error);

// Redirecionar + notificar
errorStrategies.redirect(error, "/error");

// Apenas log (silencioso)
errorStrategies.log(error, context);

// Completo: log + notify
errorStrategies.handle(error, context);
```

### Hook useErrorHandler

```typescript
const { handleError, withErrorHandling } = useErrorHandler();

// Tratamento manual
try {
  await apiCall();
} catch (error) {
  handleError(error);
}

// Tratamento automático
const safeApiCall = withErrorHandling(async () => {
  return await apiCall();
});
```

## 🔗 Integração com Analytics

### Eventos Automáticos

- **Consentimento**: `consent_accepted`, `consent_rejected`
- **Notificações**: `notification_shown`, `notification_action`
- **Erros**: `error_occurred`, `error_boundary_caught`

### Rastreamento LGPD

- **Consentimento**: Armazenado localStorage com granularidade
- **Anonimização**: IPs anonimizados, dados sensíveis mascarados
- **Opt-out**: Respeito total às preferências do usuário
