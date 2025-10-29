# 📋 Plano de Migração - Composition-First Architecture

## 🎯 Visão Geral

Este documento detalha o plano incremental para migrar da arquitetura atual (caótica) para a nova **Composition-First Landing System**, resolvendo os problemas críticos identificados de CSS fragmentado e páginas desconexas.

## 📊 Status Atual (Problemas Críticos)

### ❌ CSS/Styles

- 4 sistemas de cores diferentes simultaneamente
- Múltiplas fontes de verdade para tokens
- Duplicação massiva de dados
- CSS inline e hardcoded

### ❌ Páginas/Organização

- Conteúdo hardcoded em componentes
- Padrões inconsistentes de seção
- Composição manual em todas as páginas
- Dependências ocultas e acoplamento

## ✅ Nova Arquitetura Implementada

### Fase 1: Foundation ✅ CONCLUÍDA

- [x] **Design System Unificado**: Single source of truth em `design-system/tokens/`
- [x] **Estrutura de Pastas**: Domínios funcionais criados
- [x] **CSS Foundations**: Auto-gerado dos tokens
- [x] **Compatibilidade**: Páginas existentes ainda funcionam

### Fase 2: Content Separation ✅ QUASE CONCLUÍDA

- [x] **Hero Content**: Separado em `domains/marketing/content/hero-content.ts`
- [x] **Hero Composer**: Orquestração implementada
- [x] **Benefits Content**: Separado em `domains/marketing/content/benefits-content.ts`
- [x] **Benefits Composer**: Orquestração implementada
- [x] **Features Content**: Separado em `domains/marketing/content/features-content.ts`
- [x] **Features Composer**: Orquestração implementada
- [x] **Pricing Content**: Separado em `domains/marketing/content/pricing-content.ts`
- [x] **Pricing Composer**: Orquestração implementada
- [x] **Components Migration**: Benefits, Features, Pricing migrados para nova estrutura

### Fase 3: Composition System 🚧 EM ANDAMENTO

- [x] **Page Composer**: Sistema de orquestração implementado (`lib/composition/page-composer.ts`)
- [x] **Section Renderer**: Componente de renderização dinâmica implementado (`lib/composition/section-renderer.tsx`)
- [x] **Section Registry**: Catálogo completo de seções criado (`lib/composition/section-registry.ts`)
- [x] **Landing Page**: Página principal migrada para usar composição declarativa
- [ ] **Layout Unification**: Layouts consistentes por domínio

### Fase 4: Optimization 🎯 FINAL

- [ ] **Code Splitting**: Por seção/componente
- [ ] **Lazy Loading**: Conteúdo sob demanda
- [ ] **Bundle Analysis**: Otimização de tamanho
- [ ] **A/B Testing**: Integração completa

---

## 🗂️ Guia de Migração Detalhado

### 📁 **Estrutura Final Alvo**

```
src/
├── domains/                          # Domínios DDD
│   ├── marketing/                    # Domínio de negócio
│   │   ├── content/                  # ← Conteúdo puro (JSON-like)
│   │   │   ├── hero-content.ts       # Conteúdo do hero
│   │   │   ├── benefits-content.ts   # Conteúdo dos benefícios
│   │   │   └── page-configs.ts       # Configurações de página
│   │   ├── composers/                # ← Orquestradores
│   │   │   ├── hero-composer.ts      # Composer do hero
│   │   │   ├── page-composer.ts      # Composer de página
│   │   │   └── section-composer.ts   # Composer genérico
│   │   └── types/                    # ← Tipos específicos
│   │       ├── hero.types.ts         # Tipos do hero
│   │       └── content.types.ts      # Tipos de conteúdo
│   └── product/                      # Domínio produto
│       ├── content/
│       └── composers/
│
├── components/                       # Componentes por categoria
│   ├── sections/                     # ← Seções padronizadas
│   │   ├── hero/                     # Seção hero
│   │   │   ├── hero.tsx              # Componente React puro
│   │   │   ├── hero.types.ts         # Props da seção
│   │   │   └── hero.stories.tsx      # Storybook (futuro)
│   │   ├── benefits/                 # Seção benefits
│   │   └── shared/                   # Componentes compartilhados
│   ├── ui/                          # ← Design System atômico
│   │   ├── atoms/                    # Button, Input, etc.
│   │   ├── molecules/                # Card, FormField, etc.
│   │   └── organisms/                # SectionWrapper, etc.
│   └── layouts/                      # ← Layouts padronizados
│       ├── marketing-layout.tsx      # Layout do marketing
│       └── product-layout.tsx        # Layout do produto
│
├── design-system/                    # ← Design System unificado
│   ├── tokens/                       # ← SINGLE SOURCE OF TRUTH
│   │   ├── colors.ts                 # Cores centralizadas
│   │   ├── typography.ts             # Tipografia
│   │   ├── spacing.ts                # Espaçamento & layout
│   │   └── animations.ts             # Animações
│   ├── foundations/                  # ← CSS Foundations
│   │   ├── base.css                  # CSS reset & base
│   │   ├── theme.css                 # CSS vars geradas
│   │   └── utilities.css             # Utility classes
│   └── variants/                     # ← Component variants
│       ├── button-variants.ts        # Button variants
│       ├── card-variants.ts          # Card variants
│       └── input-variants.ts         # Input variants
│
├── lib/                             # Infraestrutura
│   ├── composition/                  # ← Sistema de composição
│   │   ├── page-composer.ts          # Orquestrador principal
│   │   ├── section-registry.ts       # Registro de seções
│   │   └── content-loader.ts         # Loader de conteúdo
│   ├── analytics/                    # ← Analytics unificado
│   ├── experiments/                  # ← A/B testing
│   └── seo/                          # ← SEO unificado
│
└── styles/                          # ← APENAS imports
    ├── globals.css                  # ← Importa tudo do design-system
    └── tailwind.config.ts           # ← Config Tailwind limpa
```

---

## 🔄 **Migração Passo a Passo**

### **Passo 1: Preparação do Ambiente**

#### ✅ Já Implementado:

```bash
# Estrutura de pastas criada
mkdir -p domains/marketing/content domains/marketing/composers components/sections/hero design-system/tokens

# Design System foundation
# design-system/tokens/colors.ts ✅
# design-system/tokens/typography.ts ✅
# design-system/tokens/spacing.ts ✅
# design-system/foundations/base.css ✅
# design-system/foundations/theme.css ✅
```

#### Próximos Passos:

```bash
# Criar estrutura para outras seções
mkdir -p components/sections/benefits components/sections/features
mkdir -p domains/marketing/types
```

### **Passo 2: Migração do Hero (Exemplo Completo)**

#### ✅ Já Implementado:

```typescript
// 1. Content separado
// domains/marketing/content/hero-content.ts ✅

// 2. Types definidos
// domains/marketing/types/hero.types.ts ✅

// 3. Composer criado
// domains/marketing/composers/hero-composer.ts ✅

// 4. Design System variants
// design-system/variants/button-variants.ts ✅
```

#### Próximos Passos:

```typescript
// 5. Componente migrado (próximo passo)
// components/sections/hero/hero.tsx

// 6. Page atualizada
// app/(marketing)/page.tsx - usar composeHeroContent()
```

### **Passo 3: Padrão para Outras Seções**

Para cada seção (benefits, features, pricing, etc.):

#### 1. Criar Content Layer

```typescript
// domains/marketing/content/benefits-content.ts
export const benefitsContent = {
  default: {
    title: "Resultados que você pode medir",
    subtitle:
      "Veja como nossa plataforma transforma dados em vantagem competitiva",
    benefits: [
      {
        icon: "Zap",
        title: "75% menos tempo em relatórios",
        description: "De dias para minutos...",
        metric: "De 2 dias para 30 min",
      },
      // ... outros benefícios
    ],
  },
};
```

#### 2. Criar Types

```typescript
// domains/marketing/types/benefits.types.ts
export interface BenefitContent {
  icon: string;
  title: string;
  description: string;
  metric?: string;
}

export interface BenefitsContent {
  title: string;
  subtitle: string;
  benefits: BenefitContent[];
}
```

#### 3. Criar Composer

```typescript
// domains/marketing/composers/benefits-composer.ts
export function composeBenefitsContent() {
  // Lógica de experimentos, personalização, etc.
  return {
    content: benefitsContent.default,
    variant: "default",
  };
}
```

#### 4. Migrar Componente

```typescript
// components/sections/benefits/benefits.tsx
interface BenefitsProps {
  content: BenefitsContent
  variant?: string
}

export function Benefits({ content, variant = 'default' }: BenefitsProps) {
  // UI pura, sem dados hardcoded
  return (
    <section>
      <h2>{content.title}</h2>
      {/* ... renderizar benefits */}
    </section>
  )
}
```

### **Passo 4: Composition Root**

#### Sistema de Composição Final:

```typescript
// lib/composition/page-composer.ts
export function composePage(pageType: 'landing' | 'features') {
  const sections = [
    {
      id: 'hero',
      component: 'Hero',
      content: composeHeroContent(),
      order: 1
    },
    {
      id: 'benefits',
      component: 'Benefits',
      content: composeBenefitsContent(),
      order: 2
    }
  ]

  return {
    sections: sections.sort((a, b) => a.order - b.order),
    metadata: generateMetadata(sections),
    experiments: collectExperiments(sections)
  }
}

// app/(marketing)/page.tsx
export default function MarketingPage() {
  const composition = composePage('landing')

  return (
    <MarketingLayout>
      {composition.sections.map(section => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </MarketingLayout>
  )
}
```

---

## ⚠️ **Breaking Changes Controlados**

### **Fase 1 → Fase 2 (Content Separation)**

- **Breaking**: Componentes recebem props ao invés de dados hardcoded
- **Mitigação**: Manter defaults no composer, migração gradual
- **Risco**: Baixo - só afeta desenvolvimento

### **Fase 2 → Fase 3 (Composition System)**

- **Breaking**: Páginas mudam de hardcoded para declarativo
- **Mitigação**: Composition fallback para seções não migradas
- **Risco**: Médio - requer testes visuais

### **Fase 3 → Fase 4 (Optimization)**

- **Breaking**: Code splitting pode afetar loading
- **Mitigação**: Feature flags para novos comportamentos
- **Risco**: Baixo - otimizações não quebram funcionalidade

---

## 🧪 **Estratégia de Testes**

### **Testes por Fase**

- **Fase 1**: Testes de build, lint, typecheck
- **Fase 2**: Testes de conteúdo + componentes isolados
- **Fase 3**: Testes de composição + integração visual
- **Fase 4**: Testes de performance + E2E

### **Testes de Regressão**

- Screenshots automáticos de todas as páginas
- Testes visuais com Chromatic ou similar
- Smoke tests em produção antes do deploy

---

## 📈 **Métricas de Sucesso**

### **Técnicas**

- **Build Time**: Redução de 30% (menos duplicação)
- **Bundle Size**: Redução de 20% (CSS unificado)
- **Type Errors**: Zero novos erros
- **Performance**: LCP/CLS mantidos ou melhorados

### **DX (Developer Experience)**

- **Tempo de feature**: Redução de 50% (padrões claros)
- **Bugs relacionados**: Redução de 70% (menos duplicação)
- **Onboarding**: 1 dia vs 1 semana (documentação clara)

### **Manutenibilidade**

- **Tempo de mudanças**: Redução de 60% (content separado)
- **Confiança**: Testes isolados aumentam cobertura
- **Escalabilidade**: Adicionar seções = configuração, não código

---

## 🚀 **Próximos Passos Imediatos**

### **Esta Semana (Fase 2 - Content Separation)** ✅ CONCLUÍDA

1. **Benefits Section**: ✅ Conteúdo + componente migrados
2. **Features Section**: ✅ Conteúdo + componente migrados
3. **Pricing Section**: ✅ Conteúdo + componente migrados
4. **Testing**: Criar testes para composers

### **Próxima Semana (Fase 3 - Composition System)** 🚧 EM ANDAMENTO

1. **Page Composer**: ✅ Sistema implementado
2. **Section Renderer**: ✅ Componente implementado
3. **Marketing Page**: ✅ Migrada para composição
4. **Layout Unification**: Unificar layouts por domínio
5. **Testing**: Testes de integração e E2E

### **Semana Seguinte (Fase 4 - Optimization)**

1. **Code Splitting**: Implementar lazy loading
2. **Bundle Analysis**: Otimizar tamanhos
3. **A/B Testing**: Integração completa
4. **Performance**: Medição e ajustes finais

---

## 🎯 **Resultado Final Esperado**

Uma arquitetura **escalável, manutenível e performática** que:

- ✅ **Elimina duplicação** de conteúdo e código
- ✅ **Padroniza** desenvolvimento de seções e páginas
- ✅ **Facilita** A/B testing e experimentação
- ✅ **Melhora** performance através de code splitting
- ✅ **Simplifica** manutenção e evolução
- ✅ **Aumenta** confiança através de testes isolados

**De**: Caos fragmentado e hardcoded
**Para**: Sistema composto, testável e escalável

---

## 📞 **Suporte e Comunicação**

- **Documentação**: `.cursorrules` atualizado com nova arquitetura
- **Code Reviews**: Foco em aderência aos princípios
- **Daily Standup**: Acompanhamento do progresso de migração
- **Pair Programming**: Para seções complexas ou dúvidas
