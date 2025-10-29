# Sistema de A/B Testing - Guia Rápido

## 🎯 Visão Geral

O sistema de A/B Testing permite testar diferentes variantes de conteúdo e UI para otimizar taxas de conversão. Implementado seguindo as melhores práticas de arquitetura Composition-First.

## 🚀 Funcionalidades

- ✅ **Feature Flags**: Controle granular de funcionalidades
- ✅ **Experiment Management**: Interface completa para gerenciar testes
- ✅ **Analytics Integration**: Rastreamento automático de eventos
- ✅ **Variant Assignment**: Distribuição consistente de usuários
- ✅ **Real-time Dashboard**: Visualização de resultados

## 📊 Como Funciona

### 1. Experiment Definition

```typescript
// Definido em lib/experiments/types.ts
const heroHeadlineVariants = {
  control: "Headline original",
  variant_a: "Headline variante A",
  variant_b: "Headline variante B",
};
```

### 2. Component Integration

```typescript
// No componente Hero
const { variant, trackClick } = useABTest("hero_headline");

const headline =
  variant === "variant_a"
    ? heroHeadlineVariants.variant_a
    : heroHeadlineVariants.control;

// Tracking automático
const handleCTA = () => {
  trackClick("primary_cta");
  // Lógica original
};
```

### 3. Analytics Collection

```typescript
// Eventos rastreados automaticamente:
// - view: quando usuário vê a variante
// - click: quando interage com elementos
// - convert: quando completa ação desejada
```

## 🛠️ Gerenciamento

### Dashboard Admin

- Acesse: `/admin/experiments`
- **Experiments Tab**: Criar, editar, pausar/ativar testes
- **Analytics Tab**: Visualizar métricas em tempo real
- **Feature Flags Tab**: Controle de funcionalidades (futuro)

### Built-in Experiments

- `hero_headline`: Testa diferentes headlines do Hero
- `cta_button_color`: Testa cores dos botões CTA
- `pricing_layout`: Testa layouts de preços

## 🎨 Exemplo Prático

### Hero Section com A/B Testing

```typescript
// components/sections/hero/hero.tsx
const { variant, trackClick } = useABTest("hero_headline");

const getHeadline = () => {
  switch (variant) {
    case "variant_a":
      return "Transforme dados em decisões inteligentes";
    case "variant_b":
      return "Inteligência Artificial para seus relatórios";
    default:
      return "Automatize seus dados. Acelere seus resultados.";
  }
};
```

## 📈 Métricas Disponíveis

- **Views**: Número de vezes que a variante foi vista
- **Clicks**: Interações com elementos rastreáveis
- **Conversions**: Ações desejadas completadas
- **Click Rate**: Taxa de cliques (clicks/views)
- **Conversion Rate**: Taxa de conversão (conversions/views)

## 🔧 Configuração

### Ativar Experiments

```typescript
// lib/experiments/feature-flags.ts
Object.values(BUILT_IN_EXPERIMENTS).forEach((exp) => {
  experiments.set(exp.id, { ...exp, status: "running" });
});
```

### Criar Novo Experiment

```typescript
const newExperiment = {
  id: "new_test",
  name: "New Test",
  variants: [
    { id: "control", name: "Control", weight: 50 },
    { id: "variant_a", name: "Variant A", weight: 50 },
  ],
  metrics: { primary: "cta_click_rate" },
};

admin.createExperiment(newExperiment);
```

## 📊 Visualizar Resultados

1. Acesse `/admin/experiments`
2. Clique na aba "Analytics"
3. Veja métricas em tempo real por variante
4. Compare performance automaticamente

## 🎯 Debugging

### Indicador de Debug

- Componente `ExperimentIndicator` mostra variante ativa
- Aparece no canto inferior esquerdo da página
- Remove em produção

### Console Logs

```javascript
// Ver logs no console do navegador
console.log("Experiment event:", event);
```

## 🔒 Segurança e Privacidade

- **Anonymous Tracking**: IDs de usuário anonimizados
- **GDPR Compliant**: Sem dados pessoais nos logs
- **Session-based**: Assignment consistente por sessão
- **Opt-out**: Respeita configurações de privacidade

## 🚀 Próximos Passos

1. **Integração com Analytics Externos**:
   - Google Analytics 4
   - Mixpanel
   - Amplitude
   - Custom API

2. **Advanced Targeting**:
   - Segmentação por geografia
   - Comportamento do usuário
   - Device type
   - Traffic source

3. **Statistical Significance**:
   - Cálculo automático de significância estatística
   - Teste A/A para validação
   - Bayesian statistics

4. **Multi-armed Bandit**:
   - Otimização automática
   - Aprendizado contínuo
   - Maximização de receita

## 📚 Arquitetura Técnica

```
lib/experiments/
├── types.ts           # Definições TypeScript
├── feature-flags.ts   # Sistema core
├── hooks.tsx         # React hooks
└── experiment-analytics.ts # Analytics

components/
├── admin/experiment-dashboard.tsx  # Interface admin
└── ui/experiment-indicator.tsx     # Debug component
```

## 🎯 Best Practices

1. **Test One Variable at a Time**: Evite testes multivariados complexos
2. **Sample Size**: Aguarde tamanho de amostra estatisticamente significativo
3. **Duration**: Rode testes por pelo menos 1-2 semanas
4. **Consistency**: Mantenha outras variáveis constantes
5. **Documentation**: Documente hipóteses e resultados

---

**Sistema ativo e coletando dados!** 🚀

Visite `/admin/experiments` para gerenciar seus testes A/B.
