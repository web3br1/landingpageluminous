# Contexto de Projeto - Landing Page SaaS

## 📋 Visão Geral

Este projeto implementa uma landing page completa para um produto SaaS de business intelligence, seguindo as melhores práticas de conversão e performance.

## 🎯 Objetivo de Negócio

Criar uma landing page que gere leads qualificados para demonstração do produto DataFlow, uma plataforma de business intelligence que automatiza relatórios e transforma dados em insights acionáveis.

## 👥 Persona Principal

**Gestor de PME no Varejo**

- Idade: 35-55 anos
- Cargo: CEO, COO, Gerente de Operações
- Dor: Gasta horas criando relatórios manuais no Excel
- Objetivo: Tomar decisões baseadas em dados em tempo real
- Comportamento: Busca soluções que economizem tempo, não quer aprender ferramentas complexas

## 💡 Proposta de Valor

"Automatize seus relatórios em minutos, não dias."

### Benefícios Principais

- **Redução de tempo**: Corte 60% do tempo gasto em relatórios
- **Decisões mais rápidas**: Insights em tempo real
- **Facilidade de uso**: Interface intuitiva, sem necessidade de treinamento extenso
- **ROI comprovado**: Aumento médio de 25% na eficiência operacional

## 🎯 Objetivos de Conversão

### Primário: Agendamento de Demo

- CTA principal: "Agendar demonstração gratuita"
- Meta: 5% de conversão
- Destino: Calendário de agendamento + formulário de qualificação

### Secundário: Trial

- CTA secundário: "Comece grátis"
- Meta: 2% de conversão
- Destino: Formulário de cadastro + trial de 14 dias

## 📊 Métricas de Sucesso

- **LCP (Largest Contentful Paint)**: ≤ 2.5s
- **CLS (Cumulative Layout Shift)**: ≤ 0.1
- **INP (Interaction to Next Paint)**: ≤ 200ms
- **Taxa de conversão**: ≥ 3%
- **Bounce rate**: ≤ 40%

## 🏗️ Arquitetura Técnica

### Nova Arquitetura: Composition-First Landing System

A arquitetura foi completamente refatorada para resolver problemas críticos de organização e manutenibilidade.

#### 🎯 Princípios Fundamentais

1. **Composition Root**: Páginas são compostas declarativamente através de configurações
2. **Content/UI Separation**: Conteúdo ≠ Apresentação (dados separados de componentes)
3. **Design System Unificado**: Single source of truth para tokens e estilos
4. **Component Composition**: Seções como blocos reutilizáveis com APIs consistentes

#### 📁 Estrutura de Pastas

```
src/
├── domains/                          # Domínios de negócio (DDD)
│   ├── marketing/
│   │   ├── content/                  # ← Conteúdo separado da UI
│   │   ├── composers/                # ← Compositores de conteúdo
│   │   └── types/                    # ← Tipos específicos
│
├── components/                       # Componentes por categoria
│   ├── sections/                     # ← Seções padronizadas
│   ├── ui/                          # ← Design System atômico
│   └── layouts/                      # ← Layouts padronizados
│
├── design-system/                    # ← Design System unificado
│   ├── tokens/                       # ← Single source of truth
│   ├── foundations/                  # ← CSS Foundations
│   └── variants/                     # ← Component variants
│
├── lib/
│   ├── composition/                  # ← Sistema de composição
│   ├── experiments/                  # ← A/B testing
│   └── analytics/                    # ← Analytics unificado
```

#### 🔧 Sistema de Composição

**1. Content Layer (Dados Separados)**

```typescript
// domains/marketing/content/hero-content.ts
export const heroContent = {
  default: {
    headline: "Seu copiloto de automação empresarial",
    subheadline: "Conecte, orquestre e acelere seus fluxos",
    ctaPrimary: "Começar grátis",
  },
};
```

**2. Content Composers (Transformadores)**

```typescript
// domains/marketing/composers/hero-composer.ts
export function composeHeroContent() {
  const experiment = useExperiment("hero_headline");
  return {
    content: heroContent[experiment.variant],
    variant: experiment.variant,
  };
}
```

**3. Composition Root (Orquestração)**

```typescript
// app/(marketing)/page.tsx
const pageComposition = composeMarketingPage('landing')
return <PageRenderer composition={pageComposition} />
```

#### 🎨 Design System Unificado

**Single Source of Truth:**

```typescript
// design-system/tokens/colors.ts
export const colorTokens = {
  primary: { 50: "258 90% 98%", 500: "258 90% 60%" },
  // Todas as cores AQUI e só AQUI
};
```

**CSS Auto-gerado:**

```css
/* design-system/foundations/theme.css */
:root {
  --color-primary-500: 258 90% 60%;
  --color-primary-foreground: 0 0% 100%;
  /* Auto-gerado dos tokens */
}
```

#### ✅ Benefícios da Nova Arquitetura

1. **Manutenibilidade**: Mudar conteúdo ≠ tocar componente
2. **Reutilização**: Seções funcionam em qualquer página
3. **Testabilidade**: Componentes isolados, fácil mocking
4. **Performance**: Code splitting automático por seção
5. **Consistência**: Padrões unificados em tudo
6. **Escalabilidade**: Adicionar seções = só configuração
7. **A/B Testing**: Variantes declarativas, não código

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui
- **Animações**: Framer Motion
- **Formulários**: React Hook Form + Zod
- **SEO**: next-seo + Schema.org
- **Analytics**: GA4/Plausible
- **A/B Testing**: Feature flags via Edge Config

## 📱 Estrutura da Landing Page

1. **Hero**: Headline + subheadline + CTA + mockup
2. **Social Proof**: Credenciais técnicas + destaques de desenvolvimento (produto em lançamento)
3. **Benefícios**: 3-5 cards orientados a resultado
4. **Demo**: Vídeo/gif do produto em ação
5. **Features**: Lista detalhada de funcionalidades
6. **Pricing**: 2-3 planos com destaque no "Mais Popular"
7. **FAQ**: 5-7 perguntas frequentes
8. **Final CTA**: Repetição do CTA primário

## 🎨 Diretrizes de Design

### Paleta de Cores

- **Primary**: Azul confiável (#3b82f6) - confiança e profissionalismo
- **Accent**: Verde (#22c55e) - crescimento e sucesso
- **Neutral**: Escala de cinzas - fundo e textos

### Tipografia

- **Display**: Inter Tight - títulos impactantes
- **Body**: Inter - texto legível
- **Escalas responsivas**: clamp() para diferentes telas

## 🚀 Roadmap

### V1.0 (Atual)

- [x] Estrutura básica implementada
- [x] Componentes UI criados
- [x] Configuração inicial do projeto
- [x] **Social Proof redesenhada para produto em lançamento** - Destaques técnicos ao invés de métricas falsas
- [ ] Conteúdo real implementado
- [ ] Analytics configurado
- [ ] A/B testing implementado
- [ ] SEO otimizado

### V1.1 (Próxima)

- Microinterações e estados hover/focus
- Validações de formulários
- Integração com CRM

### V1.2 (Futuro)

- A/B testing das 3 variáveis críticas (headline, CTA, visual)
- Internacionalização (i18n)

## ⚠️ Restrições e Limitações

- **Performance Budget**: Página crítica ≤ 180KB, JS hidratado ≤ 70KB
- **Acessibilidade**: Contraste mínimo 4.5:1, navegação por teclado
- **SEO**: Lighthouse ≥ 90 em todas as métricas
- **Responsividade**: Funcional de 320px a 1440px+

## 📈 Hipóteses de A/B Testing

1. **Headline**: "Automatize seus relatórios hoje" vs "Relatórios prontos em minutos"
2. **CTA Color**: Azul primário vs Verde accent
3. **Hero Visual**: Mockup 3D vs Ilustração flat
