# 🧑‍💻 Guia do Desenvolvedor - A/B Testing em Tempo Real

> **Como integrar experimentos A/B em seus componentes React**

---

## 🚀 Início Rápido

### **1. Importar o Hook**

```typescript
import { useRealTimeExperiment } from "@/lib/hooks/use-real-time-experiment";
```

### **2. Usar em Componente**

```typescript
export function MyComponent() {
  const experiment = useRealTimeExperiment('meu-experimento')

  return (
    <div>
      {/* Conteúdo baseado na variante */}
      {experiment.variant === 'A' ? (
        <h1>Versão A</h1>
      ) : (
        <h1>Versão B</h1>
      )}

      {/* CTA com tracking automático */}
      <button onClick={() => experiment.trackConversion()}>
        Call to Action
      </button>
    </div>
  )
}
```

### **3. Ver Resultado**

- ✅ Usuário consistentemente vê mesma variante
- ✅ Interações são automaticamente rastreadas
- ✅ Métricas aparecem no dashboard admin

---

## 🎨 Padrões de Uso

### **Experimento de Tema**

```typescript
function HeroSection() {
  const experiment = useRealTimeExperiment('theme-hero-optimization')

  return (
    <section className={`hero ${experiment.themeId}`}>
      <h1>Headline Principal</h1>
      <p>Subheadline</p>

      <ExperimentCTA experimentId="theme-hero-optimization">
        Começar Agora
      </ExperimentCTA>
    </section>
  )
}
```

### **Experimento de Conteúdo**

```typescript
function PricingCard() {
  const experiment = useRealTimeExperiment('pricing-test')

  return (
    <div className="pricing-card">
      <h3>{experiment.customTokens?.planName || 'Plano Pro'}</h3>
      <div className="price">
        {experiment.customTokens?.price || '$29'}
      </div>

      <button onClick={() => experiment.trackConversion()}>
        {experiment.customTokens?.ctaText || 'Assinar Agora'}
      </button>
    </div>
  )
}
```

### **Experimento de Layout**

```typescript
function FeatureGrid() {
  const experiment = useRealTimeExperiment('layout-test')

  const layoutClass = experiment.customTokens?.layout === 'masonry'
    ? 'grid-masonry'
    : 'grid-standard'

  return (
    <div className={`features ${layoutClass}`}>
      {/* Features com layout diferente */}
    </div>
  )
}
```

---

## 📊 Tracking de Eventos

### **Eventos Automáticos**

O hook automaticamente rastreia:

- `experiment_exposure` - Usuário viu o experimento
- `scroll_25/50/75` - Marcos de scroll
- `time_on_page` - Tempo na página
- `page_hidden/visible` - Visibilidade

### **Eventos Manuais**

```typescript
const experiment = useRealTimeExperiment("my-experiment");

// Conversão primária (métrica principal)
experiment.trackConversion();

// Engajamento genérico
experiment.trackEngagement();

// Eventos customizados
experiment.trackEvent("video_play", 1);
experiment.trackEvent("form_submit", 1);
experiment.trackEvent("feature_click", "button_name");
experiment.trackEvent("time_spent", 45.5); // segundos
```

### **Métricas por Tipo de Experimento**

| Tipo      | Métrica Primária     | Métricas Secundárias           |
| --------- | -------------------- | ------------------------------ |
| `theme`   | `cta_click`          | `scroll_depth`, `time_on_page` |
| `content` | `conversion`         | `engagement`, `bounce_rate`    |
| `layout`  | `feature_engagement` | `conversion`, `time_on_page`   |

---

## ⚙️ Configuração de Experimentos

### **Estrutura Básica**

```typescript
// Adicionar em lib/ab-testing/real-time-experiments.ts
export const REAL_TIME_EXPERIMENTS = {
  "meu-experimento": {
    id: "meu-experimento",
    name: "Nome do Experimento",
    description: "Descrição do que está sendo testado",
    type: "theme" | "content" | "layout",
    status: "draft" | "running" | "paused" | "completed",

    variants: {
      A: {
        name: "Nome da Variante A",
        themeId: "theme-a", // opcional
        weight: 50, // porcentagem
        customTokens: {
          // opcional
          headlineText: "Texto A",
          buttonColor: "blue",
        },
      },
      B: {
        name: "Nome da Variante B",
        themeId: "theme-b",
        weight: 50,
        customTokens: {
          headlineText: "Texto B",
          buttonColor: "green",
        },
      },
    },

    targeting: {
      userSegment: ["free", "trial", "premium"],
      countries: ["BR", "US", "DE"],
      devices: ["mobile", "tablet", "desktop"],
      userTypes: ["new", "returning", "premium"],
    },

    rollout: {
      percentage: 25, // 0-100
      startDate: new Date(),
      endDate: new Date(),
      minSampleSize: 1000,
      confidenceThreshold: 95,
    },

    metrics: {
      primary: "cta_click",
      secondary: ["scroll_depth", "time_on_page", "bounce_rate"],
    },

    createdAt: new Date(),
    updatedAt: new Date(),
  },
};
```

### **Targeting Rules**

```typescript
targeting: {
  // Segmentos de usuário
  userSegment: ['free', 'trial'],

  // Países (ISO alpha-2)
  countries: ['BR', 'US'],

  // Dispositivos
  devices: ['mobile', 'desktop'],

  // Tipos de usuário
  userTypes: ['new', 'returning']
}
```

### **Progressive Rollout**

```typescript
rollout: {
  percentage: 25,        // % inicial do tráfego
  minSampleSize: 1000,   // mínimo por variante
  confidenceThreshold: 95 // % confiança para winner
}
```

---

## 🧩 Componentes Wrapper

### **ExperimentWrapper (Genérico)**

```typescript
import { ExperimentWrapper } from '@/components/experiments/experiment-wrapper'

function MyComponent() {
  return (
    <ExperimentWrapper experimentId="my-experiment">
      {(experiment) => (
        <div className={experiment.themeId}>
          <h1>{experiment.customTokens?.title}</h1>
          <p>{experiment.customTokens?.subtitle}</p>

          <button onClick={() => experiment.trackEvent('click')}>
            {experiment.customTokens?.buttonText}
          </button>
        </div>
      )}
    </ExperimentWrapper>
  )
}
```

### **ExperimentCTA (Especializado)**

```typescript
import { ExperimentCTA } from '@/components/experiments/experiment-wrapper'

function HeroSection() {
  return (
    <section>
      <h1>Título</h1>

      <ExperimentCTA
        experimentId="hero-test"
        ctaType="primary"
        className="btn-primary"
      >
        Call to Action
      </ExperimentCTA>

      <ExperimentCTA
        experimentId="hero-test"
        ctaType="secondary"
        variant="outline"
      >
        Secondary CTA
      </ExperimentCTA>
    </section>
  )
}
```

---

## 🔍 Debugging e Desenvolvimento

### **Verificar Atribuição**

```typescript
function DebugComponent() {
  const experiment = useRealTimeExperiment('my-experiment')

  return (
    <div className="debug-info">
      <p>Variant: {experiment.variant}</p>
      <p>Theme: {experiment.themeId}</p>
      <p>Should Track: {experiment.shouldTrack ? 'Yes' : 'No'}</p>
      <p>Custom Tokens: {JSON.stringify(experiment.customTokens)}</p>
    </div>
  )
}
```

### **Console Logs**

O sistema loga automaticamente:

- Atribuição de variantes
- Eventos rastreados
- Rollout changes
- Winner detection

```bash
# Ver logs no browser console
📊 Experiment Event: { experimentId, variant, userId, eventName, ... }
🚀 Auto-rollout: experiment increased to 50%
🎯 Winner detected: variant A with 15.3% uplift
```

### **Local Storage (Demo)**

Durante desenvolvimento, dados são armazenados em localStorage:

```javascript
// Ver dados no browser dev tools
localStorage.getItem("experiment_theme-hero-optimization_user123_session456");
```

---

## 🎯 Melhores Práticas

### **1. Naming Conventions**

```typescript
// ✅ Bom
experimentId: 'hero-theme-test-q1-2024'
variant names: 'Liquid Glass', 'Tech Blueprint'

// ❌ Ruim
experimentId: 'test1'
variant names: 'A', 'B'
```

### **2. Métricas Consistentes**

```typescript
// Use sempre as mesmas métricas
metrics: {
  primary: 'cta_click',     // Conversão principal
  secondary: [
    'scroll_depth',         // Engajamento
    'time_on_page',         // Tempo
    'bounce_rate'           // Qualidade
  ]
}
```

### **3. Sample Size Adequado**

```typescript
rollout: {
  minSampleSize: 1000,      // Mínimo confiável
  confidenceThreshold: 95   // Estatisticamente significativo
}
```

### **4. Testing**

```typescript
// Teste sempre
describe('MyComponent with A/B testing', () => {
  it('renders variant A correctly', () => {
    // Mock experiment assignment
    const mockExperiment = {
      variant: 'A',
      themeId: 'theme-a',
      shouldTrack: true,
      trackConversion: vi.fn()
    }

    render(<MyComponent experiment={mockExperiment} />)
    expect(screen.getByText('Variant A content')).toBeInTheDocument()
  })
})
```

---

## 🚨 Troubleshooting

### **Problema: Usuário vê variante diferente**

**Causa:** userId inconsistente ou experiment mudou
**Solução:** Use userId consistente, não mude experiment config

### **Problema: Eventos não são rastreados**

**Causa:** shouldTrack = false
**Solução:** Verifique targeting rules e rollout percentage

### **Problema: Métricas não aparecem no dashboard**

**Causa:** Analytics não configurado para produção
**Solução:** Implemente trackExperimentEvent() com analytics real

### **Problema: Hydration mismatch**

**Causa:** Experimento usado no server-side
**Solução:** Use apenas em componentes client-side ('use client')

---

## 📚 Exemplos Avançados

### **Conditional Rendering**

```typescript
function PricingSection() {
  const experiment = useRealTimeExperiment('pricing-strategy')

  if (experiment.variant === 'annual-discount') {
    return <AnnualPricingWithDiscount />
  }

  return <MonthlyPricing />
}
```

### **Dynamic Styling**

```typescript
function CardComponent() {
  const experiment = useRealTimeExperiment('card-design')

  const cardStyle = {
    borderRadius: experiment.customTokens?.borderRadius || '8px',
    boxShadow: experiment.customTokens?.shadow || '0 2px 8px rgba(0,0,0,0.1)',
    background: experiment.customTokens?.gradient
      ? `linear-gradient(135deg, ${experiment.customTokens.gradient})`
      : 'white'
  }

  return (
    <div style={cardStyle}>
      {/* Card content */}
    </div>
  )
}
```

### **Feature Flags Integration**

```typescript
function NewFeature() {
  const experiment = useRealTimeExperiment('new-feature-rollout')

  if (experiment.variant === 'control') {
    return <OldFeature />
  }

  return <NewFeature />
}
```

---

## 🔗 Integração com Produção

### **Substituir Analytics Demo**

```typescript
// Em lib/ab-testing/real-time-experiments.ts
export function trackExperimentEvent(
  experimentId: string,
  variant: string,
  userId: string,
  sessionId: string,
  eventName: string,
  value: number | boolean = 1,
  context: any = {},
) {
  // Para produção, substitua por seu analytics
  analytics.track("experiment_event", {
    experiment_id: experimentId,
    variant,
    user_id: hashUserId(userId), // Importante: anonimizar
    session_id: sessionId,
    event_name: eventName,
    value,
    timestamp: new Date(),
    context: sanitizeContext(context), // Remover PII
  });
}
```

### **Database Schema**

```sql
CREATE TABLE experiment_events (
  id UUID PRIMARY KEY,
  experiment_id VARCHAR(255) NOT NULL,
  variant VARCHAR(50) NOT NULL,
  user_id VARCHAR(255) NOT NULL, -- hashed
  session_id VARCHAR(255) NOT NULL,
  event_name VARCHAR(255) NOT NULL,
  value DECIMAL(10,2),
  timestamp TIMESTAMP NOT NULL,
  context JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_experiment_events_lookup
ON experiment_events(experiment_id, variant, user_id, event_name);
```

---

**🎯 Agora você está pronto para criar experimentos A/B que otimizam a experiência do usuário com dados científicos!**

**Precisa de ajuda?** Consulte o dashboard em `/admin/experiments` ou veja os exemplos em `/experiments-demo`.
