# 💡 Exemplos Práticos - A/B Testing

> **Cenários reais de implementação com código completo**

---

## 🎨 1. Teste de Tema no Hero

### **Objetivo:** Descobrir qual tema gera mais conversões no hero

### **Configuração do Experimento**

```typescript
// lib/ab-testing/real-time-experiments.ts
export const REAL_TIME_EXPERIMENTS = {
  "hero-theme-optimization": {
    id: "hero-theme-optimization",
    name: "Hero Theme Optimization",
    description: "Test Liquid Glass vs Tech Blueprint themes in hero section",
    type: "theme",
    status: "running",
    variants: {
      A: {
        name: "Liquid Glass",
        themeId: "liquid-glass",
        weight: 50,
      },
      B: {
        name: "Tech Blueprint",
        themeId: "tech-blueprint",
        weight: 50,
      },
    },
    targeting: {
      userSegment: ["free", "trial"],
      devices: ["mobile", "desktop"],
    },
    rollout: {
      percentage: 25,
      minSampleSize: 1000,
      confidenceThreshold: 95,
    },
    metrics: {
      primary: "cta_click",
      secondary: ["scroll_depth", "time_on_page"],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};
```

### **Implementação no Componente**

```typescript
// components/sections/hero/hero.tsx
'use client'

import { useRealTimeExperiment } from '@/lib/hooks/use-real-time-experiment'
import { ExperimentCTA } from '@/components/experiments/experiment-wrapper'

export function Hero() {
  const experiment = useRealTimeExperiment('hero-theme-optimization')

  return (
    <section className={`hero-section ${experiment.themeId}`}>
      <div className="container">
        <div className="hero-content">
          <h1 className="hero-title">
            Automatize seus relatórios em <span className="highlight">minutos</span>
          </h1>

          <p className="hero-subtitle">
            Transforme dados complexos em insights acionáveis.
            Não perca mais tempo com planilhas manuais.
          </p>

          <div className="hero-actions">
            <ExperimentCTA
              experimentId="hero-theme-optimization"
              ctaType="primary"
              className="btn-primary"
            >
              Começar Grátis
            </ExperimentCTA>

            <button className="btn-secondary">
              Ver Demo
            </button>
          </div>
        </div>

        <div className="hero-visual">
          {/* Mockup ou ilustração baseada no tema */}
          <div className={`mockup ${experiment.themeId}`}>
            <img
              src={`/images/mockup-${experiment.themeId}.png`}
              alt="Product mockup"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
```

### **Resultado Esperado**

- **Liquid Glass:** Design moderno com glassmorphism
- **Tech Blueprint:** Design técnico com grid azul
- **Métrica:** Qual gera mais cliques no CTA
- **Impacto:** Otimização visual da primeira impressão

---

## 💰 2. Teste de Preços

### **Objetivo:** Testar diferentes estratégias de precificação

### **Configuração**

```typescript
export const REAL_TIME_EXPERIMENTS = {
  "pricing-strategy-test": {
    id: "pricing-strategy-test",
    name: "Pricing Strategy Test",
    description: "Test different pricing presentation strategies",
    type: "content",
    status: "running",
    variants: {
      A: {
        name: "Monthly Focus",
        weight: 50,
        customTokens: {
          planName: "Pro",
          price: "$29/mês",
          period: "por mês",
          highlight: "Mais Popular",
          ctaText: "Assinar Pro",
        },
      },
      B: {
        name: "Annual Discount",
        weight: 50,
        customTokens: {
          planName: "Pro Anual",
          price: "$19/mês",
          period: "por mês (cobrado anualmente)",
          highlight: "Economia de 35%",
          ctaText: "Assinar Anual",
        },
      },
    },
    targeting: {
      userSegment: ["trial"],
      countries: ["BR", "US"],
    },
    rollout: { percentage: 50, confidenceThreshold: 90 },
    metrics: { primary: "conversion", secondary: ["cta_click"] },
  },
};
```

### **Componente de Pricing**

```typescript
// components/sections/pricing/pricing-card.tsx
'use client'

import { useRealTimeExperiment } from '@/lib/hooks/use-real-time-experiment'

interface PricingCardProps {
  basePrice?: string
  onSelect?: () => void
}

export function PricingCard({ basePrice, onSelect }: PricingCardProps) {
  const experiment = useRealTimeExperiment('pricing-strategy-test')

  const handleSelect = () => {
    experiment.trackConversion()
    onSelect?.()
  }

  return (
    <div className={`pricing-card ${experiment.variant === 'B' ? 'annual-highlight' : ''}`}>
      {experiment.customTokens?.highlight && (
        <div className="badge">
          {experiment.customTokens.highlight}
        </div>
      )}

      <h3 className="plan-name">
        {experiment.customTokens?.planName || 'Pro Plan'}
      </h3>

      <div className="price">
        <span className="amount">
          {experiment.customTokens?.price || basePrice || '$29'}
        </span>
        <span className="period">
          {experiment.customTokens?.period || 'por mês'}
        </span>
      </div>

      <button
        className="cta-button"
        onClick={handleSelect}
      >
        {experiment.customTokens?.ctaText || 'Assinar Agora'}
      </button>
    </div>
  )
}
```

---

## 🎯 3. Teste de CTA (Call to Action)

### **Objetivo:** Otimizar texto e cor dos botões de conversão

### **Configuração**

```typescript
export const REAL_TIME_EXPERIMENTS = {
  "cta-optimization": {
    id: "cta-optimization",
    name: "CTA Button Optimization",
    description: "Test different CTA texts and button styles",
    type: "content",
    status: "running",
    variants: {
      A: {
        name: "Começar Grátis - Blue",
        weight: 25,
        customTokens: {
          text: "Começar Grátis",
          color: "blue",
          size: "large",
        },
      },
      B: {
        name: "Testar 14 Dias - Green",
        weight: 25,
        customTokens: {
          text: "Testar 14 Dias Grátis",
          color: "green",
          size: "large",
        },
      },
      C: {
        name: "Ver Demo - Purple",
        weight: 25,
        customTokens: {
          text: "Ver Demo Interativa",
          color: "purple",
          size: "medium",
        },
      },
      D: {
        name: "Criar Conta - Orange",
        weight: 25,
        customTokens: {
          text: "Criar Conta Gratuita",
          color: "orange",
          size: "medium",
        },
      },
    },
    targeting: { userSegment: ["free"] },
    rollout: { percentage: 100, confidenceThreshold: 95 },
    metrics: { primary: "cta_click" },
  },
};
```

### **Componente de CTA**

```typescript
// components/ui/experiment-cta.tsx
'use client'

import { useRealTimeExperiment } from '@/lib/hooks/use-real-time-experiment'

interface ExperimentCTAProps {
  experimentId: string
  defaultText?: string
  defaultColor?: string
  className?: string
  onClick?: () => void
}

export function ExperimentCTA({
  experimentId,
  defaultText = 'Call to Action',
  defaultColor = 'blue',
  className = '',
  onClick
}: ExperimentCTAProps) {
  const experiment = useRealTimeExperiment(experimentId)

  const buttonText = experiment.customTokens?.text || defaultText
  const buttonColor = experiment.customTokens?.color || defaultColor
  const buttonSize = experiment.customTokens?.size || 'medium'

  const handleClick = () => {
    experiment.trackConversion()
    onClick?.()
  }

  return (
    <button
      className={`btn btn-${buttonColor} btn-${buttonSize} ${className}`}
      onClick={handleClick}
    >
      {buttonText}
    </button>
  )
}
```

---

## 🎨 4. Teste de Layout de Cards

### **Objetivo:** Otimizar layout de features/benefícios

### **Configuração**

```typescript
export const REAL_TIME_EXPERIMENTS = {
  "card-layout-test": {
    id: "card-layout-test",
    name: "Feature Cards Layout Test",
    description: "Test different card layouts and visual styles",
    type: "layout",
    status: "running",
    variants: {
      A: {
        name: "Standard Grid",
        weight: 33,
        customTokens: {
          layout: "grid",
          cardStyle: "standard",
          spacing: "normal",
          icons: true,
        },
      },
      B: {
        name: "Masonry Layout",
        weight: 33,
        customTokens: {
          layout: "masonry",
          cardStyle: "glass",
          spacing: "tight",
          icons: false,
        },
      },
      C: {
        name: "List Layout",
        weight: 34,
        customTokens: {
          layout: "list",
          cardStyle: "minimal",
          spacing: "loose",
          icons: true,
        },
      },
    },
    targeting: { devices: ["desktop", "tablet"] },
    rollout: { percentage: 30 },
    metrics: { primary: "feature_engagement" },
  },
};
```

### **Componente de Features**

```typescript
// components/sections/features/features.tsx
'use client'

import { useRealTimeExperiment } from '@/lib/hooks/use-real-time-experiment'

const features = [
  { icon: 'zap', title: 'Automação', description: '...' },
  { icon: 'bar-chart', title: 'Analytics', description: '...' },
  // ...
]

export function Features() {
  const experiment = useRealTimeExperiment('card-layout-test')

  const layoutClass = experiment.customTokens?.layout || 'grid'
  const cardStyle = experiment.customTokens?.cardStyle || 'standard'
  const spacing = experiment.customTokens?.spacing || 'normal'
  const showIcons = experiment.customTokens?.icons !== false

  return (
    <section className={`features-section layout-${layoutClass} spacing-${spacing}`}>
      <div className="container">
        <h2>Funcionalidades Principais</h2>

        <div className={`features-grid ${layoutClass}`}>
          {features.map((feature, index) => (
            <div
              key={index}
              className={`feature-card style-${cardStyle}`}
              onClick={() => experiment.trackEngagement(`feature_${index}`)}
            >
              {showIcons && (
                <div className="feature-icon">
                  <Icon name={feature.icon} />
                </div>
              )}

              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

---

## 📱 5. Teste de Mobile vs Desktop

### **Objetivo:** Experiência otimizada por dispositivo

### **Configuração**

```typescript
export const REAL_TIME_EXPERIMENTS = {
  "device-optimization": {
    id: "device-optimization",
    name: "Device-Specific Optimization",
    description: "Test different experiences for mobile vs desktop",
    type: "layout",
    status: "running",
    variants: {
      mobile_first: {
        name: "Mobile-First Design",
        weight: 50,
        customTokens: {
          heroLayout: "stacked",
          ctaSize: "large",
          textSize: "large",
          spacing: "generous",
        },
      },
      desktop_focused: {
        name: "Desktop Optimized",
        weight: 50,
        customTokens: {
          heroLayout: "side-by-side",
          ctaSize: "medium",
          textSize: "medium",
          spacing: "compact",
        },
      },
    },
    targeting: { devices: ["mobile", "desktop"] },
    rollout: { percentage: 20 },
    metrics: { primary: "conversion" },
  },
};
```

### **Componente Responsivo**

```typescript
// components/sections/hero/responsive-hero.tsx
'use client'

import { useRealTimeExperiment } from '@/lib/hooks/use-real-time-experiment'

export function ResponsiveHero() {
  const experiment = useRealTimeExperiment('device-optimization')

  // Usar apenas se for o variant apropriado para o dispositivo
  const isMobile = typeof window !== 'undefined' &&
    window.innerWidth < 768

  const shouldApplyVariant = (
    (isMobile && experiment.variant === 'mobile_first') ||
    (!isMobile && experiment.variant === 'desktop_focused')
  )

  const layout = shouldApplyVariant
    ? experiment.customTokens?.heroLayout
    : 'default'

  const ctaSize = shouldApplyVariant
    ? experiment.customTokens?.ctaSize
    : 'medium'

  return (
    <section className={`hero layout-${layout}`}>
      <div className="hero-container">
        <div className="hero-content">
          <h1 style={{
            fontSize: experiment.customTokens?.textSize === 'large'
              ? 'clamp(2.5rem, 8vw, 4rem)'
              : 'clamp(2rem, 5vw, 3rem)'
          }}>
            Título do Hero
          </h1>

          <ExperimentCTA
            experimentId="device-optimization"
            className={`cta-${ctaSize}`}
          >
            Call to Action
          </ExperimentCTA>
        </div>

        <div className="hero-visual">
          {/* Visual adaptado */}
        </div>
      </div>
    </section>
  )
}
```

---

## 🔄 6. Teste de Progressive Rollout

### **Cenário:** Novo feature com rollout gradual

### **Configuração**

```typescript
export const REAL_TIME_EXPERIMENTS = {
  "new-feature-rollout": {
    id: "new-feature-rollout",
    name: "New Feature Rollout",
    description: "Gradual rollout of advanced analytics feature",
    type: "content",
    status: "running",
    variants: {
      control: {
        name: "Old Feature",
        weight: 80,
        customTokens: { showNewFeature: false },
      },
      treatment: {
        name: "New Advanced Analytics",
        weight: 20,
        customTokens: { showNewFeature: true },
      },
    },
    rollout: {
      percentage: 20, // Começar com 20%
      confidenceThreshold: 95,
      minSampleSize: 500,
    },
    metrics: { primary: "feature_usage" },
  },
};
```

### **Implementação**

```typescript
// components/dashboard/analytics-dashboard.tsx
'use client'

import { useRealTimeExperiment } from '@/lib/hooks/use-real-time-experiment'

export function AnalyticsDashboard() {
  const experiment = useRealTimeExperiment('new-feature-rollout')

  return (
    <div className="dashboard">
      <h1>Analytics Dashboard</h1>

      {/* Features básicas sempre visíveis */}
      <BasicAnalytics />

      {/* Novo feature apenas para treatment group */}
      {experiment.customTokens?.showNewFeature && (
        <AdvancedAnalytics
          onUse={() => experiment.trackEngagement('advanced_analytics')}
        />
      )}

      {/* CTA para upgrade se não estiver no treatment */}
      {!experiment.customTokens?.showNewFeature && (
        <UpgradePrompt
          onClick={() => experiment.trackEvent('upgrade_prompt_click')}
        />
      )}
    </div>
  )
}
```

---

## 🎪 7. Teste de Onboarding

### **Objetivo:** Otimizar fluxo de onboarding

### **Configuração**

```typescript
export const REAL_TIME_EXPERIMENTS = {
  "onboarding-flow": {
    id: "onboarding-flow",
    name: "Onboarding Flow Optimization",
    description: "Test different onboarding experiences",
    type: "content",
    status: "running",
    variants: {
      guided_tour: {
        name: "Guided Tour",
        weight: 33,
        customTokens: {
          flow: "tour",
          steps: 5,
          showTooltips: true,
          autoAdvance: false,
        },
      },
      quick_setup: {
        name: "Quick Setup",
        weight: 33,
        customTokens: {
          flow: "quick",
          steps: 3,
          showTooltips: false,
          autoAdvance: true,
        },
      },
      minimal: {
        name: "Minimal Onboarding",
        weight: 34,
        customTokens: {
          flow: "minimal",
          steps: 1,
          showTooltips: false,
          autoAdvance: true,
        },
      },
    },
    targeting: { userTypes: ["new"] },
    rollout: { percentage: 40 },
    metrics: { primary: "onboarding_completion" },
  },
};
```

### **Componente de Onboarding**

```typescript
// components/onboarding/onboarding-flow.tsx
'use client'

import { useRealTimeExperiment } from '@/lib/hooks/use-real-time-experiment'

export function OnboardingFlow() {
  const experiment = useRealTimeExperiment('onboarding-flow')

  const flow = experiment.customTokens?.flow || 'guided'
  const steps = experiment.customTokens?.steps || 3
  const showTooltips = experiment.customTokens?.showTooltips || false
  const autoAdvance = experiment.customTokens?.autoAdvance || false

  const [currentStep, setCurrentStep] = useState(0)

  const nextStep = () => {
    setCurrentStep(prev => prev + 1)
    experiment.trackEvent('onboarding_step_complete', currentStep + 1)
  }

  const complete = () => {
    experiment.trackConversion() // onboarding_completion
  }

  return (
    <div className={`onboarding flow-${flow}`}>
      <OnboardingHeader
        currentStep={currentStep}
        totalSteps={steps}
      />

      <OnboardingContent
        step={currentStep}
        showTooltips={showTooltips}
        onNext={autoAdvance ? nextStep : undefined}
      />

      {!autoAdvance && (
        <button onClick={nextStep}>
          Próximo
        </button>
      )}

      {currentStep === steps - 1 && (
        <button onClick={complete}>
          Começar a Usar
        </button>
      )}
    </div>
  )
}
```

---

## 📊 8. Teste de Personalização

### **Objetivo:** Conteúdo personalizado baseado em persona

### **Configuração**

```typescript
export const REAL_TIME_EXPERIMENTS = {
  "persona-personalization": {
    id: "persona-personalization",
    name: "Persona-Based Personalization",
    description: "Test personalized content for different user personas",
    type: "content",
    status: "running",
    variants: {
      startup: {
        name: "Startup Focus",
        weight: 25,
        customTokens: {
          headline: "Scale Fast with Automated Reports",
          benefits: [
            "Save 10 hours/week",
            "Real-time insights",
            "API integration",
          ],
          persona: "startup",
        },
      },
      enterprise: {
        name: "Enterprise Focus",
        weight: 25,
        customTokens: {
          headline: "Enterprise-Grade Analytics & Security",
          benefits: [
            "SOC 2 compliant",
            "Advanced permissions",
            "Dedicated support",
          ],
          persona: "enterprise",
        },
      },
      freelancer: {
        name: "Freelancer Focus",
        weight: 25,
        customTokens: {
          headline: "Simple Tools for Freelance Success",
          benefits: ["Easy setup", "Affordable pricing", "Client reports"],
          persona: "freelancer",
        },
      },
      agency: {
        name: "Agency Focus",
        weight: 25,
        customTokens: {
          headline: "Manage Multiple Clients Efficiently",
          benefits: [
            "White-label reports",
            "Client portals",
            "Bulk operations",
          ],
          persona: "agency",
        },
      },
    },
    targeting: { userTypes: ["new"] },
    rollout: { percentage: 30 },
    metrics: { primary: "conversion" },
  },
};
```

### **Componente Personalizado**

```typescript
// components/sections/hero/personalized-hero.tsx
'use client'

import { useRealTimeExperiment } from '@/lib/hooks/use-real-time-experiment'

export function PersonalizedHero() {
  const experiment = useRealTimeExperiment('persona-personalization')

  const headline = experiment.customTokens?.headline ||
    'Transforme seus dados em insights'

  const benefits = experiment.customTokens?.benefits || [
    'Automatize relatórios',
    'Insights em tempo real',
    'Fácil integração'
  ]

  return (
    <section className="hero personalized">
      <div className="container">
        <h1 className="hero-title">{headline}</h1>

        <ul className="hero-benefits">
          {benefits.map((benefit, index) => (
            <li key={index}>
              <Icon name="check" />
              {benefit}
            </li>
          ))}
        </ul>

        <ExperimentCTA
          experimentId="persona-personalization"
          className="btn-primary"
        >
          Começar Agora
        </ExperimentCTA>
      </div>
    </section>
  )
}
```

---

## 🎯 **Dicas Gerais para Todos os Exemplos**

### **1. Sempre Teste Pequeno Primeiro**

```typescript
rollout: {
  percentage: 5, // Começar pequeno
  // ...
}
```

### **2. Métricas Claras**

```typescript
metrics: {
  primary: 'cta_click', // Uma métrica principal
  secondary: ['time_on_page', 'bounce_rate'] // Métricas de apoio
}
```

### **3. Targeting Específico**

```typescript
targeting: {
  userSegment: ['trial'], // Usuários em período de teste
  countries: ['BR'],      // Mercado específico
  devices: ['mobile']     // Dispositivo específico
}
```

### **4. Variants Balanceados**

```typescript
variants: {
  A: { weight: 25 },
  B: { weight: 25 },
  C: { weight: 25 },
  D: { weight: 25 } // Pesos iguais para fairness
}
```

### **5. Monitorar Resultados**

- Acesse `/admin/experiments` para ver resultados em tempo real
- Configure alertas para winners detectados
- Use auto-rollout para escalar automaticamente

---

**🚀 Com esses exemplos, você pode testar praticamente qualquer aspecto da sua aplicação e otimizar a experiência do usuário com dados científicos!**
