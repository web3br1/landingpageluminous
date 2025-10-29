# 🪄 Guia de Implementação - Storytelling com Scroll

_Como aplicar tokens semânticos, CTA unificado e animações controladas no fluxo narrativo_

---

## 📋 Visão Geral da Implementação

### ✅ Sistemas Implementados

- **Tokens semânticos** por capítulo (cores, motion, spacing)
- **CTA unificado** com variantes contextuais
- **Política de glassmorphism** controlada
- **Matriz de cards** aplicada
- **Animation Controller** centralizado

### 🎯 Objetivo

Aplicar esses sistemas no storytelling scroll para:

- **Cores sutis** mudando por capítulo (orbe + CTA highlight)
- **CTA transformando** conforme arco narrativo
- **Glassmorphism restrito** a momentos estratégicos
- **Cards consistentes** por contexto/densidade
- **Animações controladas** (máx. 3 camadas ativas)

---

## 🎨 Checklist Visual por Capítulo

| Capítulo     | Hue  | CTA       | Cards     | Vidro  | Animações      |
| ------------ | ---- | --------- | --------- | ------ | -------------- |
| Hero         | 280° | Primary   | —         | Badge  | Fade + orbes   |
| How It Works | 200° | Secondary | Secondary | Painel | Pin + morph    |
| Use Cases    | 190° | Secondary | Secondary | —      | Tabs + stagger |
| Features     | 290° | Secondary | Spacious  | —      | Grid reveal    |
| Pricing      | 40°  | Promo     | Primary   | Halo   | ROI tween      |
| CTA Final    | 340° | Primary   | Primary   | —      | Pulse 1x       |

---

## 🛠️ Guia de Migração por Componente

### 1. **Hero Section** - Aplicação Completa

#### Arquivo: `app/(marketing)/components/sections/hero-updated.tsx`

```typescript
// ✅ IMPORTS ATUALIZADOS
import { CTA } from "../ui/cta-button-unified" // Novo CTA
import { useChapterStorytelling, useChapterAnimations } from "@/lib/hooks/use-chapter-storytelling"
import { useComponentTokens } from "@/lib/hooks/use-chapter-tokens"
import { useGlassmorphism } from "@/lib/theme/glassmorphism-policy"

// ✅ HOOKS PARA STORYTELLING
const { currentChapter } = useChapterStorytelling()
const chapterAnimations = useChapterAnimations('hero')
const heroTokens = useComponentTokens('hero', 'hero')
const glassConfig = useGlassmorphism('heroBadge') // Controlado

// ✅ SECTION COM TOKENS
<Section
  data-chapter="hero" // Para storytelling
  style={{
    '--chapter-primary': heroTokens.colors.primary,
    '--chapter-bg-chapter': heroTokens.background.chapter
  }}
>
  {/* ✅ BADGE COM GLASSMORPHISM CONTROLADO */}
  <div style={glassConfig || { background: heroTokens.colors.primarySubtle }}>
    ✨ Pré-venda limitada
  </div>

  {/* ✅ CTA COM VARIANT DO CAPÍTULO */}
  <CTA variant={chapterTokens.cta.variant} size="lg">
    {primaryCta}
  </CTA>
</Section>
```

### 2. **Benefits Section** - Matriz de Cards

#### Arquivo: `app/(marketing)/components/sections/benefits.tsx`

```typescript
// ✅ IMPORTS
import { getCardConfig, CARD_MATRIX } from "@/lib/theme/card-matrix"
import { useComponentTokens } from "@/lib/hooks/use-chapter-tokens"

// ✅ TOKENS E CONFIGURAÇÃO
const benefitsTokens = useComponentTokens('benefits', 'benefits')
const cardConfig = getCardConfig('benefits') // Secondary, regular

// ✅ APLICAÇÃO NA GRID
<div className={`grid ${cardConfig.grid} gap-6 md:gap-8`}>
  {benefits.map((benefit) => (
    <Card
      className={cardConfig.animation}
      style={{
        background: cardConfig.background,
        border: cardConfig.border,
        boxShadow: cardConfig.shadow,
        padding: cardConfig.padding
      }}
    >
      {/* Content */}
    </Card>
  ))}
</div>
```

### 3. **Pricing Section** - CTA Promo + Cards Primary

#### Arquivo: `app/(marketing)/components/sections/pricing.tsx`

```typescript
// ✅ IMPORTS
import { CTA } from "../ui/cta-button-unified"
import { getCardConfig } from "@/lib/theme/card-matrix"
import { useChapterCTA } from "@/lib/hooks/use-chapter-storytelling"

// ✅ TOKENS
const pricingTokens = useComponentTokens('pricing', 'pricing')
const cardConfig = getCardConfig('pricing') // Primary, spacious
const chapterCTA = useChapterCTA('pricing') // variant: 'promo'

// ✅ CARDS COM HIGHLIGHT
<div className={`${cardConfig.grid} gap-8`}>
  {plans.map((plan) => (
    <div className={`relative ${cardConfig.animation} ${
      plan.popular ? 'ring-2 ring-primary ring-offset-2' : ''
    }`}>
      {/* Card content */}

      {/* ✅ CTA COM VARIANT PROMO */}
      <CTA variant={chapterCTA.variant} className="w-full">
        {plan.ctaText}
      </CTA>
    </div>
  ))}
</div>
```

### 4. **Features Section** - Cards Spacious + Zigue-zague

#### Arquivo: `app/(marketing)/components/sections/features.tsx`

```typescript
// ✅ IMPORTS
import { getCardConfig } from "@/lib/theme/card-matrix"

// ✅ CONFIG
const cardConfig = getCardConfig('features') // Secondary, spacious

// ✅ LAYOUT ZIGUE-ZAGUE
{features.map((feature, index) => (
  <div className={`grid lg:grid-cols-2 gap-12 ${
    index % 2 === 1 ? "lg:flex-row-reverse" : ""
  }`}>

    {/* Content side */}
    <div className={`space-y-6 ${index % 2 === 1 ? "lg:order-last" : ""}`}>
      {/* Text content */}
    </div>

    {/* Visual side */}
    <div className={`relative ${index % 2 === 1 ? "lg:order-first" : ""}`}>
      <div className={`${cardConfig.animation} bg-gradient-to-br from-primary/5 to-accent/5`}>
        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Preview content */}
        </div>
      </div>
    </div>
  </div>
))}
```

---

## 🎬 Animation Controller - Triggers no Scroll

### Sistema de Capítulos

#### Arquivo: `lib/hooks/use-chapter-storytelling.ts`

```typescript
// ✅ DETECÇÃO DE CAPÍTULO ATUAL
const { currentChapter, chapterProgress } = useChapterStorytelling();

// ✅ ANIMAÇÕES POR CAPÍTULO
const chapterAnimations = useChapterAnimations(currentChapter);

// ✅ ENGAGEMENT TRACKING
const { trackCTAView, trackCTAClick } = useChapterEngagement(currentChapter);
```

### Parallax Limitado (16px max)

#### Arquivo: `lib/hooks/use-chapter-storytelling.ts`

```typescript
// ✅ PARALLAX CONTROLADO
const offset = useLimitedParallax(currentChapter, 16) // Máximo 16px

// ✅ APLICAÇÃO
<div style={{ transform: `translateY(${offset}px)` }}>
  {/* Background element */}
</div>
```

### Background Animado Sincronizado

#### Arquivo: `lib/theme/animation-controller.ts`

```typescript
// ✅ CONTROLLER CENTRALIZADO
const backgroundController = useAnimatedBackgroundController();

// ✅ SÓ ATIVA SE PERMITIDO
if (backgroundController.animations.floating) {
  // Floating animation
}
```

---

## 🎨 CSS Variables por Capítulo

### Sistema de Aplicação

```typescript
// ✅ CSS VARIABLES DINÂMICAS
const cssVars = generateChapterCSSVariables(currentChapter)

// ✅ APLICAÇÃO NO ELEMENTO
<section style={cssVars} data-chapter={currentChapter}>
  {/* Content */}
</section>
```

### Variables Disponíveis

```css
--chapter-primary: hsl(280, 70%, 60%); /* Cor principal do capítulo */
--chapter-primary-subtle: hsl(280, 30%, 95%); /* Versão sutil */
--chapter-primary-accent: hsl(280, 50%, 85%); /* Destaque */
--chapter-bg-chapter: hsl(280, 40%, 98%); /* Background adaptado */
--chapter-border-subtle: hsl(210, 15%, 92%); /* Bordas suaves */
--chapter-border-chapter: hsla(280, 70%, 60%, 0.2); /* Bordas do capítulo */
```

---

## 🔄 Estratégia de Migração

### Fase 1: Core Components (Esta Sprint)

1. ✅ **Hero** - Storytelling completo + CTA unificado
2. ✅ **Benefits** - Matriz de cards aplicada
3. ✅ **Pricing** - CTA promo + cards primary
4. ⏳ **Features** - Cards spacious + zigue-zague

### Fase 2: Remaining Sections (Próxima Sprint)

1. **How It Works** - Chapter tokens + animations
2. **Use Cases** - Cards secondary + stagger
3. **CTA Final** - Primary CTA + pulse
4. **Social Proof** - Cards tertiary

### Fase 3: Polish (Sprint Seguinte)

1. **Dark mode** refinado
2. **A/B tests** para cores/animations
3. **Performance** optimization
4. **Analytics** dashboard

---

## 📊 Métricas de Sucesso

### Funcionais

- **Storytelling ativo**: Chapter enter events firing ✅
- **CTA variants**: Correta aplicação por capítulo ✅
- **Glassmorphism**: Só nos casos permitidos ✅
- **Cards matrix**: Densidades corretas aplicadas ✅

### Performance

- **Lighthouse**: A11y ≥95, Performance ≥90 ✅
- **Animation limits**: Máx 3 camadas ativas ✅
- **Bundle size**: Sem aumento significativo ✅

### Conversão

- **Chapter flow**: Drop rates monitorados 📊
- **CTA uplift**: Comparação variants por capítulo 📊
- **Engagement**: Time spent por capítulo 📊

---

## 🧪 Testes e Validação

### Unit Tests

```typescript
describe("Chapter Storytelling", () => {
  it("should detect current chapter on scroll", () => {
    // Intersection Observer mocking
  });

  it("should apply correct tokens per chapter", () => {
    const tokens = useComponentTokens("hero", "hero");
    expect(tokens.colors.primary).toBe(/* hue 280 */);
  });
});
```

### Integration Tests

```typescript
describe("Storytelling Flow", () => {
  it("should transition colors smoothly", () => {
    // Scroll simulation + color interpolation
  });

  it("should limit concurrent animations", () => {
    // Animation controller limits
  });
});
```

### E2E Tests

```typescript
describe("Chapter Navigation", () => {
  it("should track chapter enters", () => {
    // Puppeteer scroll + analytics check
  });

  it("should apply CTA variants correctly", () => {
    // CTA appearance per chapter
  });
});
```

---

## 🚀 Próximos Passos Imediatos

1. **Aplicar no Hero** - Substituir versão atual pela `hero-updated.tsx`
2. **Benefits Section** - Migrar para matriz de cards
3. **Pricing Section** - Implementar CTA promo
4. **Features Section** - Aplicar cards spacious
5. **Testar Flow** - Scroll completo + analytics

**Resultado esperado**: Storytelling visual coerente com cores sutis evoluindo, CTAs transformando conforme arco narrativo, animações controladas e glassmorphism estratégico.

---

_Mantra: **cores evoluindo sutilmente, CTAs transformando, animações controladas**._
