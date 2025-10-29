# 🚀 Integração com Produção - A/B Testing

> **Como migrar do sistema demo para analytics real em produção**

---

## 🎯 Visão Geral da Migração

O sistema foi implementado com **localStorage para demo**, mas é arquitetado para **integração fácil com analytics real**.

### **O que Mudar:**

1. ✅ **Event Tracking** → Analytics real (GA4, Mixpanel, etc.)
2. ✅ **Data Storage** → Database para métricas
3. ✅ **Real-time Dashboard** → Dados de produção
4. ✅ **Privacy Compliance** → Anonimização de dados

### **O que Fica Igual:**

- ✅ Atribuição de variantes
- ✅ Progressive rollout
- ✅ Winner detection
- ✅ Dashboard interface
- ✅ Componentes React

---

## 📊 1. Substituir Event Tracking

### **Código Atual (Demo)**

```typescript
// lib/ab-testing/real-time-experiments.ts
export function trackExperimentEvent(...) {
  // ❌ Demo: usa localStorage
  const key = `experiment_${experimentId}_${userId}_${sessionId}`
  const existing = localStorage.getItem(key)
  const data = existing ? JSON.parse(existing) : {}

  data[eventName] = (data[eventName] || 0) + value
  localStorage.setItem(key, JSON.stringify(data))
}
```

### **Código para Produção**

```typescript
// ✅ Produção: integra com analytics real
export function trackExperimentEvent(
  experimentId: string,
  variant: string,
  userId: string,
  sessionId: string,
  eventName: string,
  value: number | boolean = 1,
  context: ExperimentResult["context"] = {},
) {
  // 1. Anonimizar userId (GDPR compliance)
  const hashedUserId = hashUserId(userId);

  // 2. Sanitizar context (remover PII)
  const safeContext = sanitizeContext(context);

  // 3. Enviar para analytics
  analytics.track("experiment_event", {
    experiment_id: experimentId,
    variant: variant,
    user_id: hashedUserId,
    session_id: sessionId,
    event_name: eventName,
    value: value,
    timestamp: new Date().toISOString(),
    context: safeContext,
  });

  // 4. Opcional: enviar para database próprio
  await saveExperimentEvent({
    experimentId,
    variant,
    userId: hashedUserId,
    sessionId,
    eventName,
    value,
    timestamp: new Date(),
    context: safeContext,
  });
}
```

### **Funções de Suporte**

```typescript
// Anonimização de user ID
function hashUserId(userId: string): string {
  return crypto
    .createHash("sha256")
    .update(userId + process.env.USER_ID_SALT)
    .digest("hex")
    .substring(0, 16); // 16 chars é suficiente
}

// Remover dados pessoais do context
function sanitizeContext(context: any) {
  const { userAgent, country, device } = context;

  return {
    user_agent: userAgent?.substring(0, 200), // Truncar se muito longo
    country: country?.toUpperCase(),
    device: device,
    referrer: undefined, // Remover referrer por privacidade
    ip: undefined, // Nunca coletar IP
    location: undefined, // Nunca coletar localização precisa
  };
}

// Salvar em database próprio (opcional)
async function saveExperimentEvent(event: ExperimentEvent) {
  await db.experimentEvents.insert(event);
}
```

---

## 🗄️ 2. Database Schema

### **Tabela Principal**

```sql
CREATE TABLE experiment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id VARCHAR(255) NOT NULL,
  variant VARCHAR(50) NOT NULL,
  user_id VARCHAR(255) NOT NULL, -- hashed, GDPR compliant
  session_id VARCHAR(255) NOT NULL,
  event_name VARCHAR(255) NOT NULL,
  value DECIMAL(10,2) DEFAULT 1,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  context JSONB,

  -- Indexes para performance
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes essenciais
CREATE INDEX idx_experiment_events_lookup
ON experiment_events(experiment_id, variant, timestamp);

CREATE INDEX idx_experiment_events_user
ON experiment_events(user_id, experiment_id);

CREATE INDEX idx_experiment_events_session
ON experiment_events(session_id, experiment_id);

-- Index para analytics rápidas
CREATE INDEX idx_experiment_events_analytics
ON experiment_events(experiment_id, event_name, timestamp)
WHERE event_name IN ('cta_click', 'conversion', 'experiment_exposure');
```

### **Tabela de Experimentos (Opcional)**

```sql
CREATE TABLE experiments (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  config JSONB NOT NULL, -- toda configuração do experimento
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### **Migrations**

```typescript
// migration script
export async function up() {
  await db.schema.createTable("experiment_events", (table) => {
    table.uuid("id").primary().defaultTo(db.raw("gen_random_uuid()"));
    table.string("experiment_id", 255).notNullable();
    table.string("variant", 50).notNullable();
    table.string("user_id", 255).notNullable();
    table.string("session_id", 255).notNullable();
    table.string("event_name", 255).notNullable();
    table.decimal("value", 10, 2).defaultTo(1);
    table.timestamp("timestamp").notNullable().defaultTo(db.fn.now());
    table.jsonb("context");
    table.timestamp("created_at").notNullable().defaultTo(db.fn.now());
  });

  // Indexes
  await db.schema.alterTable("experiment_events", (table) => {
    table.index(["experiment_id", "variant", "timestamp"]);
    table.index(["user_id", "experiment_id"]);
  });
}
```

---

## 📈 3. Analytics em Tempo Real

### **Substituir getExperimentAnalytics()**

```typescript
// Código atual (demo com localStorage)
export function getExperimentAnalytics(
  experimentId: string,
): ExperimentAnalytics | null {
  // ❌ Lê do localStorage
  // ...
}

// Código para produção
export async function getExperimentAnalytics(
  experimentId: string,
): Promise<ExperimentAnalytics | null> {
  // ✅ Consulta database real-time
  const experiment = REAL_TIME_EXPERIMENTS[experimentId];
  if (!experiment) return null;

  // Buscar eventos das últimas 24h (ou período configurável)
  const events = await db("experiment_events")
    .where("experiment_id", experimentId)
    .where("timestamp", ">", db.raw("NOW() - INTERVAL '24 hours'"))
    .select("*");

  // Agregar dados
  const variantStats: ExperimentAnalytics["variantStats"] = {};
  const totalUsers = new Set(events.map((e) => e.user_id)).size;

  // Inicializar stats por variante
  Object.keys(experiment.variants).forEach((variantId) => {
    variantStats[variantId] = {
      users: 0,
      conversions: 0,
      conversionRate: 0,
      confidence: 0,
      uplift: 0,
      statisticalSignificance: false,
    };
  });

  // Calcular métricas
  const userVariants = new Map<string, string>();

  events.forEach((event) => {
    const { user_id, variant, event_name, value } = event;

    // Primeiro evento define a variante do usuário
    if (!userVariants.has(user_id)) {
      userVariants.set(user_id, variant);
    }

    // Contar usuários por variante
    if (event_name === "experiment_exposure") {
      variantStats[variant].users++;
    }

    // Contar conversões
    if (experiment.metrics.primary === event_name) {
      variantStats[variant].conversions += Number(value);
    }
  });

  // Calcular taxas e estatísticas
  Object.keys(variantStats).forEach((variantId) => {
    const stats = variantStats[variantId];
    stats.conversionRate =
      stats.users > 0 ? stats.conversions / stats.users : 0;

    // Cálculo de confiança estatística simplificado
    stats.confidence = Math.min((stats.users / 100) * 100, 100);
    stats.statisticalSignificance =
      stats.users >= experiment.rollout.minSampleSize;
  });

  // Calcular uplift vs controle
  const controlRate = variantStats.A?.conversionRate || 0;
  Object.keys(variantStats).forEach((variantId) => {
    if (variantId !== "A" && controlRate > 0) {
      variantStats[variantId].uplift =
        ((variantStats[variantId].conversionRate - controlRate) / controlRate) *
        100;
    }
  });

  // Determinar vencedor
  let winner: string | undefined;
  let maxUplift = 0;
  let maxConfidence = 0;

  Object.entries(variantStats).forEach(([variantId, stats]) => {
    if (
      stats.uplift > maxUplift &&
      stats.confidence >= experiment.rollout.confidenceThreshold
    ) {
      maxUplift = stats.uplift;
      maxConfidence = stats.confidence;
      winner = variantId;
    }
  });

  return {
    experimentId,
    totalUsers,
    variantStats,
    timeSeries: await getTimeSeriesData(experimentId), // Implementar separadamente
    winner,
    confidence: maxConfidence,
  };
}

// Buscar dados de séries temporais
async function getTimeSeriesData(experimentId: string) {
  // Agregar por hora/dia
  const timeSeries = await db("experiment_events")
    .where("experiment_id", experimentId)
    .select(
      db.raw("date_trunc('hour', timestamp) as hour"),
      "variant",
      db.raw("count(distinct user_id) as users"),
      db.raw(
        "sum(case when event_name = 'conversion' then value else 0 end) as conversions",
      ),
    )
    .groupBy("hour", "variant")
    .orderBy("hour");

  // Transformar para formato do dashboard
  return timeSeries.map((row) => ({
    timestamp: row.hour,
    variants: {
      [row.variant]: {
        users: Number(row.users),
        conversions: Number(row.conversions),
      },
    },
  }));
}
```

---

## 🔄 4. Auto-rollout em Produção

### **Atualizar Experimentos**

```typescript
// Função para atualizar configuração de experimentos
export async function updateExperimentRollout(
  experimentId: string,
  newPercentage: number,
) {
  // ✅ Salvar no database
  await db("experiments")
    .where("id", experimentId)
    .update({
      config: db.raw(
        `jsonb_set(config, '{rollout,percentage}', '${newPercentage}')`,
      ),
      updated_at: db.fn.now(),
    });

  // ✅ Ou atualizar em memória se usar config files
  REAL_TIME_EXPERIMENTS[experimentId].rollout.percentage = newPercentage;
  REAL_TIME_EXPERIMENTS[experimentId].updatedAt = new Date();
}
```

### **Job de Auto-rollout**

```typescript
// Job que roda periodicamente (ex: a cada 5 minutos)
export async function processAutoRollouts() {
  const runningExperiments = Object.values(REAL_TIME_EXPERIMENTS).filter(
    (exp) => exp.status === "running",
  );

  for (const experiment of runningExperiments) {
    const analytics = await getExperimentAnalytics(experiment.id);

    if (analytics?.winner) {
      const winnerStats = analytics.variantStats[analytics.winner];
      const currentPercentage = experiment.rollout.percentage;

      // Verificar se deve fazer auto-rollout
      if (
        analytics.confidence >= experiment.rollout.confidenceThreshold &&
        winnerStats.uplift >= 5 && // mínimo 5% uplift
        currentPercentage < 100
      ) {
        const newPercentage = Math.min(currentPercentage + 25, 100);
        await updateExperimentRollout(experiment.id, newPercentage);

        // Log do rollout
        logger.info("Auto-rollout executed", {
          experimentId: experiment.id,
          winner: analytics.winner,
          uplift: winnerStats.uplift,
          oldPercentage: currentPercentage,
          newPercentage,
        });

        // Notificar via Slack/email se configurado
        await notifyRollout(experiment, analytics);
      }
    }
  }
}
```

---

## 🔒 5. Privacidade e Conformidade

### **GDPR Compliance**

```typescript
// Banner de consentimento
export function useConsent() {
  const [consent, setConsent] = useState(getCookie('experiment_consent'))

  const giveConsent = () => {
    setCookie('experiment_consent', 'granted', 365)
    setConsent('granted')
  }

  const revokeConsent = () => {
    setCookie('experiment_consent', 'revoked', -1)
    setConsent('revoked')
    // Limpar dados do usuário se necessário
  }

  return { consent, giveConsent, revokeConsent }
}

// Respeitar consentimento no tracking
export function trackExperimentEvent(...) {
  const consent = getCookie('experiment_consent')

  if (consent !== 'granted') {
    return // Não rastrear sem consentimento
  }

  // Prosseguir com tracking...
}
```

### **Data Retention**

```sql
-- Política de retenção: manter por 90 dias
CREATE OR REPLACE FUNCTION cleanup_old_experiment_events() RETURNS void AS $$
BEGIN
  DELETE FROM experiment_events
  WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Executar diariamente
SELECT cron.schedule('cleanup-experiment-events', '0 2 * * *', 'SELECT cleanup_old_experiment_events();');
```

---

## 📊 6. Monitoramento e Alertas

### **Métricas de Sistema**

```typescript
// Adicionar métricas do sistema
const experimentMetrics = {
  totalEvents: metrics.counter({
    name: 'experiment_events_total',
    help: 'Total experiment events tracked'
  }),

  eventLatency: metrics.histogram({
    name: 'experiment_event_latency_ms',
    help: 'Latency of experiment event processing'
  }),

  rolloutChanges: metrics.counter({
    name: 'experiment_rollout_changes_total',
    help: 'Total rollout percentage changes'
  })
}

// Usar nas funções
export async function trackExperimentEvent(...) {
  const startTime = Date.now()

  try {
    // ... lógica de tracking

    experimentMetrics.totalEvents.inc()
    experimentMetrics.eventLatency.observe(Date.now() - startTime)
  } catch (error) {
    // Log error
    throw error
  }
}
```

### **Alertas**

```yaml
# Prometheus alerting rules
groups:
  - name: experiment_alerts
    rules:
      - alert: ExperimentEventHighLatency
        expr: histogram_quantile(0.95, rate(experiment_event_latency_ms_bucket[5m])) > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Experiment event tracking is slow"

      - alert: ExperimentNoEvents
        expr: rate(experiment_events_total[1h]) == 0
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "No experiment events tracked in the last hour"
```

---

## 🚀 7. Deploy e Rollback

### **Deploy Seguro**

```bash
# 1. Deploy gradual
kubectl set image deployment/ab-testing ab-testing=new-version --record

# 2. Verificar health checks
kubectl rollout status deployment/ab-testing

# 3. Monitorar métricas por 30 minutos
# - Latency dos eventos
# - Taxa de erro
# - Atribuição de experimentos

# 4. Rollback se necessário
kubectl rollout undo deployment/ab-testing
```

### **Feature Flags**

```typescript
// Usar feature flags para controle de rollout
const EXPERIMENT_SYSTEM_ENABLED = process.env.EXPERIMENT_SYSTEM_ENABLED === 'true'

export function useRealTimeExperiment(experimentId: string, ...) {
  // Desabilitar completamente se necessário
  if (!EXPERIMENT_SYSTEM_ENABLED) {
    return {
      variant: 'control',
      themeId: 'liquid-glass',
      shouldTrack: false,
      // ...
    }
  }

  // Prosseguir normalmente...
}
```

---

## 📈 8. Otimização de Performance

### **Database Optimization**

```sql
-- Particionamento por tempo
CREATE TABLE experiment_events_y2024m01 PARTITION OF experiment_events
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Cache de agregações
CREATE MATERIALIZED VIEW experiment_daily_stats AS
SELECT
  experiment_id,
  variant,
  date_trunc('day', timestamp) as day,
  count(distinct user_id) as users,
  sum(case when event_name = 'conversion' then value else 0 end) as conversions
FROM experiment_events
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY experiment_id, variant, day;

-- Refresh automático
CREATE OR REPLACE FUNCTION refresh_experiment_stats() RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY experiment_daily_stats;
END;
$$ LANGUAGE plpgsql;

SELECT cron.schedule('refresh-experiment-stats', '0 * * * *', 'SELECT refresh_experiment_stats();');
```

### **Caching**

```typescript
// Cache de analytics com TTL
const analyticsCache = new Map<
  string,
  { data: ExperimentAnalytics; timestamp: number }
>();

export async function getExperimentAnalytics(
  experimentId: string,
): Promise<ExperimentAnalytics | null> {
  const cacheKey = `analytics_${experimentId}`;
  const cached = analyticsCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 30000) {
    // 30s cache
    return cached.data;
  }

  const data = await calculateAnalytics(experimentId);
  analyticsCache.set(cacheKey, { data, timestamp: Date.now() });

  return data;
}
```

---

## 🧪 9. Testing em Produção

### **Shadow Mode**

```typescript
// Executar experimentos sem afetar usuários reais
export function assignShadowExperiment(
  experimentId: string,
  userId: string,
  context: any,
) {
  // Mesmo algoritmo de atribuição
  const assignment = assignRealTimeExperiment(experimentId, userId, context);

  // Mas não rastrear eventos reais
  return {
    ...assignment,
    shouldTrack: false, // Nunca rastrear em shadow mode
    isShadow: true,
  };
}
```

### **Canary Releases**

```typescript
// Deploy para 5% dos usuários primeiro
const CANARY_PERCENTAGE = 5;

export function useRealTimeExperiment(experimentId: string, userId?: string) {
  const userHash = hashString(userId || "anonymous");
  const canaryEnabled = userHash % 100 < CANARY_PERCENTAGE;

  if (!canaryEnabled) {
    // Usuários não selecionados veem versão antiga
    return {
      variant: "legacy",
      themeId: "liquid-glass",
      shouldTrack: false,
    };
  }

  // Usuários selecionados usam novo sistema
  return assignRealTimeExperiment(experimentId, userId);
}
```

---

## 📋 10. Checklist de Produção

### **Pré-Deploy**

- [ ] `trackExperimentEvent()` integrado com analytics real
- [ ] Database schema criado e migrado
- [ ] `getExperimentAnalytics()` lendo de database
- [ ] Anonimização de user IDs implementada
- [ ] Consentimento GDPR implementado
- [ ] Data retention configurado
- [ ] Monitoramento e alertas configurados

### **Deploy**

- [ ] Deploy gradual (5% → 25% → 50% → 100%)
- [ ] Monitorar latency dos eventos
- [ ] Verificar atribuição consistente
- [ ] Validar auto-rollout funcionando

### **Pós-Deploy**

- [ ] Verificar dados chegando no analytics
- [ ] Testar dashboard com dados reais
- [ ] Validar winner detection
- [ ] Confirmar privacy compliance

---

**🚀 Seu sistema de A/B testing agora está pronto para produção com analytics real, privacidade garantida e performance otimizada!**

**Precisa de ajuda específica?** Consulte os exemplos de código e documentação detalhada acima.
