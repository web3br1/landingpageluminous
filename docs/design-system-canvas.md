# 🎨 Design System Canvas - SaaS Landing

_Diagnóstico executivo + diretrizes de marca + plano de ação para coerência visual, conversão e governança._

---

## 📊 Diagnóstico Executivo

### ✅ Forças (manter e escalar)

- **Amplitude sólida**: hero → trial → signup → checkout
- **Arquitetura de animação**: wrappers (FadeUp, ChapterStepper) escaláveis
- **Design system**: shadcn/ui bem estendido, variantes claras de Button/CTA
- **CRO by design**: páginas pensadas para conversão (badges, toggles, sticky)

### ⚠️ Riscos (corrigir)

- **Dispersão visual**: cards "quase" consistentes → percepção de marca fraca
- **CTAs duplicados**: Button vs CtaButton → custos A/B elevados
- **Tokens incompletos**: falta camada semântica (brand/intent/surface)
- **Animação sem governança**: potencial sobreposição (Framer + gsap + tsparticles)

### 🎯 Oportunidades (ganho rápido)

- **Unificação visual**: tokens semânticos + política de vidro + matriz de cards
- **CTA convergente**: componente único com variantes claras
- **Storytelling medido**: instrumentação chapter_enter/cta_exposed/click

---

## 🎨 Diretrizes de Marca & UI

### A. Tokens Semânticos (cores, motion, spacing)

#### 1. **Tokens de Base** (`lib/theme/design-tokens.ts`)

```typescript
TOKENS_BASE = {
  bg: { base, subtle, surface, inverse },
  border: { base, subtle, strong },
  text: { primary, secondary, inverse },
};
```

#### 2. **Tokens de Marca**

```typescript
TOKENS_BRAND = {
  primary: "violeta confiável (CTA, links)",
  secondary: "ciano suave (destaques)",
  accent: "rosa/soft gold (promoções)",
};
```

#### 3. **Tokens de Intenção**

```typescript
TOKENS_INTENT = {
  cta: primary,
  info,
  success,
  warning,
  error,
};
```

#### 4. **Tokens de Capítulos** (storytelling sutil)

```typescript
TOKENS_CHAPTER = {
  hero: { hue: 280 }, // lavanda
  howItWorks: { hue: 200 }, // ciano-lavanda
  useCases: { hue: 190 }, // ciano
  pricing: { hue: 40 }, // ouro-pastel
};
```

#### 5. **Tokens de Motion**

```typescript
TOKENS_MOTION = {
  enter: 250ms, exit: 200ms, stagger: 100ms,
  easing: { standard, entrance, emphasis },
  offset: 12px, lift: 4px
}
```

#### 6. **Tokens de Spacing** (8px grid)

```typescript
TOKENS_SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
```

### B. Política de Glassmorphism (restrita)

#### ✅ Quando Usar (`lib/theme/glassmorphism-policy.ts`)

- **Hero badges**: foco pedagógico
- **Pedagogical overlays**: explicações contextuais
- **Mockup frames**: ilustrações técnicas
- **Spotlight panels**: destaques temporários

#### ❌ Quando Não Usar

- Cards estruturais (usar sólido)
- Navigation elements
- Form elements (sempre sólido)
- Dark mode default
- Mobile first

#### Variante Única Permitida

```typescript
GLASSMORPHISM_VARIANT.subtle = {
  background: "rgba(255, 255, 255, 0.7)",
  backdropBlur: "blur(12px)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
};
```

### C. Matriz de Cards (`lib/theme/card-matrix.ts`)

#### Densidades

```typescript
CARD_DENSITIES = {
  compact: { padding: 8px, minHeight: 120px, borderRadius: "8px" },
  regular: { padding: 16px, minHeight: 160px, borderRadius: "12px" },
  spacious: { padding: 24px, minHeight: 200px, borderRadius: "16px" }
}
```

#### Hierarquias

```typescript
CARD_HIERARCHIES = {
  primary: { shadow: md, hover: translateY(-2px) },   // conversão
  secondary: { shadow: sm, hover: translateY(-1px) }, // estrutural
  tertiary: { shadow: none, hover: background }       // complementar
}
```

#### Matriz por Contexto

```typescript
CARD_MATRIX = {
  benefits: { density: regular, hierarchy: secondary },
  pricing: { density: spacious, hierarchy: primary },
  demo: { density: regular, hierarchy: primary },
};
```

### D. CTAs Unificados (`app/(marketing)/components/ui/cta-button-unified.tsx`)

#### Variantes

```typescript
ctaVariants = {
  primary: "gradiente brand (conversão principal)",
  secondary: "surface + borda (ação secundária)",
  ghost: "apenas texto (ação sutil)",
  promo: "gradiente accent (promoções pontuais)",
};
```

#### Estados

```typescript
state = {
  default, loading, success, error
}
```

### E. Animation Controller (`lib/theme/animation-controller.ts`)

#### Guard-rails Implementados

- **Máximo 3 animações concorrentes**
- **Redução automática com `prefers-reduced-motion`**
- **Parallax limitado: < 16px desktop**
- **Pinning apenas capítulos 2 e 3**

#### Configurações Centralizadas

```typescript
ANIMATION_CONFIGS = {
  enter: { duration: 250ms, easing: standard },
  hover: { duration: 150ms, transform: translateY(-4px) },
  scroll: { threshold: 0.1, rootMargin: "-50px" }
}
```

---

## 📋 Plano de Ação (priorizado)

### Semana 1-2 (Quick Wins)

1. ✅ **Tokens semânticos** implementados + mapa Light/Dark + capítulos
2. ✅ **CTA unificado** criado + aliases para migração
3. ✅ **Política de vidro** implementada + guia Do/Don't
4. ⏳ **Checklist de contraste** automático (lint de a11y)

### Semana 3-4 (Coerência)

5. ✅ **Matriz de cards** aplicada a todos os componentes
6. ✅ **AnimationController** centralizando timings/easings
7. ⏳ **Instrumentação**: chapter_enter/cta_exposed/click

### Mês 2 (Otimização)

8. ⏳ **Dark theme** refinado
9. ⏳ **Playbook de A/B** para variações críticas
10. ⏳ **Kit de exemplos** Do/Don't

---

## 📈 Métricas-Chave

- **Consistência visual**: % componentes conformes DS (meta: ≥90% em 30 dias)
- **Conversão chapter→chapter**: drop How-it-works→Use-cases (baseline vs +4 semanas)
- **Performance LCP/CLS**: manter LCP <2.5s, CLS~0
- **Acessibilidade**: Lighthouse a11y ≥95
- **Taxa CTA primário**: uplift após padronização

---

## ✅ Decisões Executivas

- ✅ **Tokens semânticos** (brand/intent/surface/chapters)
- ✅ **Política de vidro** (2 níveis: none/subtle)
- ✅ **CTA unificado** (primary/secondary/ghost/promo)
- ✅ **AnimationController** centralizado
- ✅ **Matriz de cards** (densidade/hierarquia)
- ❌ **Manter 4 níveis de glass** (reduzido para 2)
- ❌ **CTAs duplicados** (convergido para 1)

---

## 🔄 Próximos Passos

1. **Aplicar tokens** nos componentes existentes
2. **Migrar Button/CtaButton** para CTA unificado
3. **Auditar glassmorphism** atual vs política
4. **Aplicar matriz de cards** em Benefits/Features/Pricing
5. **Testar AnimationController** com reduced-motion
6. **Implementar instrumentação** de eventos

---

## 📚 Referências Técnicas

- **Tokens**: `lib/theme/design-tokens.ts`
- **CTA Unificado**: `app/(marketing)/components/ui/cta-button-unified.tsx`
- **Política Vidro**: `lib/theme/glassmorphism-policy.ts`
- **Matriz Cards**: `lib/theme/card-matrix.ts`
- **Animation Controller**: `lib/theme/animation-controller.ts`

---

_Mantra: **clareza visual, promessa forte, CTA inevitável**._
