# Environment Configuration Examples - Fase 3

Este documento mostra exemplos de configuração para diferentes ambientes usando o novo sistema de Environment Management.

## Visão Geral

O sistema de Environment Management permite configurar:

- **Feature Flags**: Controle granular de funcionalidades
- **Environment Settings**: Configurações específicas por ambiente
- **Security Settings**: Níveis de segurança apropriados
- **Performance Settings**: Otimizações específicas por ambiente

## Configurações por Ambiente

### 1. Development Environment

```bash
# .env.local
NODE_ENV=development

# Feature Flags (todos habilitados para desenvolvimento)
FEATURE_DEBUG_OVERLAYS=true
FEATURE_DEV_DASHBOARD=true
FEATURE_HOT_RELOAD=true
FEATURE_COMPONENT_INSPECTOR=true
FEATURE_ADVANCED_METRICS=true
FEATURE_DISTRIBUTED_TRACING=true
FEATURE_LOG_AGGREGATION=true
FEATURE_SMART_ALERTS=false
FEATURE_ADVANCED_WEBHOOKS=true
FEATURE_WEBHOOK_DASHBOARD=true
FEATURE_WEBHOOK_RATE_LIMITING=true
FEATURE_BUNDLE_SPLITTING=false
FEATURE_LAZY_LOADING=true
FEATURE_CDN_OPTIMIZATION=false
FEATURE_WEBHOOK_AUTHENTICATION=false
FEATURE_INPUT_SANITIZATION=true
FEATURE_AUDIT_LOGGING=false
FEATURE_AB_TESTING=true
FEATURE_PERSONALIZATION=true
FEATURE_RECOMMENDATIONS=false

# Logging
LOG_LEVEL=debug
ENABLE_CONSOLE_LOGGING=true

# Monitoring (limitado em dev)
ENABLE_METRICS=true
ENABLE_TRACING=true
METRICS_RETENTION_HOURS=24

# URLs
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_CDN_URL=http://localhost:3000

# Limits (generosos em dev)
MAX_FILE_UPLOAD_SIZE=52428800  # 50MB
MAX_REQUEST_SIZE=10485760     # 10MB
RATE_LIMIT_REQUESTS=1000
SESSION_TIMEOUT_MS=86400000   # 24 horas
```

### 2. Staging Environment

```bash
# .env.staging
NODE_ENV=staging

# Feature Flags (ambiente de testes)
FEATURE_DEBUG_OVERLAYS=false
FEATURE_DEV_DASHBOARD=false
FEATURE_HOT_RELOAD=false
FEATURE_COMPONENT_INSPECTOR=false
FEATURE_ADVANCED_METRICS=true
FEATURE_DISTRIBUTED_TRACING=true
FEATURE_LOG_AGGREGATION=true
FEATURE_SMART_ALERTS=true
FEATURE_ADVANCED_WEBHOOKS=true
FEATURE_WEBHOOK_DASHBOARD=false
FEATURE_WEBHOOK_RATE_LIMITING=true
FEATURE_BUNDLE_SPLITTING=false
FEATURE_LAZY_LOADING=true
FEATURE_CDN_OPTIMIZATION=false
FEATURE_WEBHOOK_AUTHENTICATION=true
FEATURE_INPUT_SANITIZATION=true
FEATURE_AUDIT_LOGGING=true
FEATURE_AB_TESTING=true
FEATURE_PERSONALIZATION=false  # 0% rollout
FEATURE_RECOMMENDATIONS=false

# Logging
LOG_LEVEL=info
ENABLE_CONSOLE_LOGGING=false
ENABLE_FILE_LOGGING=true

# Monitoring
ENABLE_METRICS=true
ENABLE_TRACING=true
ENABLE_ALERTS=true
METRICS_RETENTION_HOURS=168  # 1 semana

# URLs
NEXT_PUBLIC_API_URL=https://api-staging.meudominio.com
NEXT_PUBLIC_CDN_URL=https://cdn-staging.meudominio.com

# Limits (balanceados)
MAX_FILE_UPLOAD_SIZE=26214400  # 25MB
MAX_REQUEST_SIZE=5242880      # 5MB
RATE_LIMIT_REQUESTS=500
SESSION_TIMEOUT_MS=28800000   # 8 horas

# API Keys (staging)
STRIPE_SECRET_KEY=sk_test_...
ANALYTICS_KEY=staging_analytics_key
SENTRY_DSN=https://staging-sentry-dsn@sentry.io/project
```

### 3. Production Environment

```bash
# .env.production
NODE_ENV=production

# Feature Flags (otimizado para produção)
FEATURE_DEBUG_OVERLAYS=false
FEATURE_DEV_DASHBOARD=false
FEATURE_HOT_RELOAD=false
FEATURE_COMPONENT_INSPECTOR=false
FEATURE_ADVANCED_METRICS=true
FEATURE_DISTRIBUTED_TRACING=true
FEATURE_LOG_AGGREGATION=true
FEATURE_SMART_ALERTS=true
FEATURE_ADVANCED_WEBHOOKS=true
FEATURE_WEBHOOK_DASHBOARD=false
FEATURE_WEBHOOK_RATE_LIMITING=true
FEATURE_BUNDLE_SPLITTING=true
FEATURE_LAZY_LOADING=true
FEATURE_CDN_OPTIMIZATION=true
FEATURE_WEBHOOK_AUTHENTICATION=true
FEATURE_INPUT_SANITIZATION=true
FEATURE_AUDIT_LOGGING=true
FEATURE_AB_TESTING=true
FEATURE_PERSONALIZATION=true  # 50% rollout
FEATURE_RECOMMENDATIONS=false

# Logging
LOG_LEVEL=warn
ENABLE_CONSOLE_LOGGING=false
ENABLE_FILE_LOGGING=true

# Monitoring
ENABLE_METRICS=true
ENABLE_TRACING=true
ENABLE_ALERTS=true
METRICS_RETENTION_HOURS=168  # 1 semana

# URLs
NEXT_PUBLIC_API_URL=https://api.meudominio.com
NEXT_PUBLIC_CDN_URL=https://cdn.meudominio.com

# Limits (restritivos em produção)
MAX_FILE_UPLOAD_SIZE=10485760  # 10MB
MAX_REQUEST_SIZE=1048576      # 1MB
RATE_LIMIT_REQUESTS=100
SESSION_TIMEOUT_MS=7200000    # 2 horas

# API Keys (produção)
STRIPE_SECRET_KEY=sk_live_...
ANALYTICS_KEY=production_analytics_key
SENTRY_DSN=https://production-sentry-dsn@sentry.io/project
```

## Configuração Programática

### Feature Flag Rules

```typescript
// lib/environment/feature-flags.ts
const defaultRules: FeatureFlagRule[] = [
  // Gradual rollout para personalização
  {
    flag: FeatureFlag.PERSONALIZATION,
    enabled: true,
    conditions: {
      percentage: 50, // 50% dos usuários
    },
    metadata: {
      description: "Personalized user experiences",
      jiraTicket: "PROJ-123",
      rolloutPlan: "Gradual rollout after A/B testing",
    },
  },

  // Ambiente específico
  {
    flag: FeatureFlag.DEBUG_OVERLAYS,
    enabled: false,
    conditions: {
      environment: [Environment.DEVELOPMENT, Environment.STAGING],
    },
    metadata: {
      risks: ["Performance impact", "Security exposure"],
    },
  },

  // Controle de usuário específico
  {
    flag: FeatureFlag.AB_TESTING,
    enabled: true,
    conditions: {
      userId: ["user_123", "user_456"], // Beta testers
    },
  },
];
```

### Environment Overrides

```typescript
// lib/environment/environment-manager.ts
private applyEnvironmentOverrides(baseConfig: EnvironmentConfig): EnvironmentConfig {
  // Override por variáveis de ambiente
  if (process.env.RATE_LIMIT_REQUESTS) {
    config.rateLimitRequestsPerMinute = parseInt(process.env.RATE_LIMIT_REQUESTS)
  }

  // Configurações específicas para deployment
  if (process.env.DEPLOYMENT_ENV === 'canary') {
    config.featureFlags[FeatureFlag.PERSONALIZATION] = false
    config.limits.rateLimitRequestsPerMinute = 50
  }

  return config
}
```

## Monitoramento de Configurações

### Health Checks

```typescript
// API endpoint para verificar configurações
export async function GET() {
  const envManager = getEnvironmentManager();
  const config = envManager.getConfig();

  return Response.json({
    environment: config.environment,
    featureFlags: Object.entries(config.featureFlags).filter(
      ([, enabled]) => enabled,
    ).length,
    security: {
      webhookAuth: config.enableWebhookAuthentication,
      inputSanitization: config.enableInputSanitization,
    },
    performance: {
      bundleSplitting: config.enableBundleSplitting,
      cdnOptimization: config.enableCDNOptimization,
    },
  });
}
```

### Alertas de Configuração

```typescript
// Verificações automáticas
function validateProductionConfig(config: EnvironmentConfig) {
  const issues: string[] = [];

  if (config.isProduction) {
    if (!config.apiKeys.stripe) {
      issues.push("Missing Stripe API key in production");
    }

    if (config.enableConsoleLogging) {
      issues.push("Console logging enabled in production");
    }

    if (config.featureFlags[FeatureFlag.DEBUG_OVERLAYS]) {
      issues.push("Debug overlays enabled in production");
    }
  }

  return issues;
}
```

## Estratégias de Rollout

### 1. Feature Flags por Ambiente

```typescript
// Desenvolvimento: Tudo ligado para testes
// Staging: Funcionalidades críticas + algumas experimentais
// Produção: Apenas funcionalidades estáveis e testadas
```

### 2. Gradual Rollout

```typescript
// Comece com usuários beta
conditions: {
  userId: ["beta_user_1", "beta_user_2"];
}

// Expanda para porcentagem
conditions: {
  percentage: 10; // 10% dos usuários
}

// Rollout completo
enabled: true;
```

### 3. Conditional Rollout

```typescript
// Baseado em performance
conditions: {
  customCondition: () => {
    const metrics = getAdvancedMonitoringSystem();
    return metrics.getMonitoringReport().businessKPIs.conversion_rate > 0.03;
  };
}
```

## Troubleshooting

### Problemas Comuns

1. **Feature flag não funciona**
   - Verifique se está habilitado no environment manager
   - Confirme que as condições são atendidas
   - Use o dashboard de admin para debug

2. **Configuração não aplicada**
   - Verifique variáveis de ambiente
   - Confirme reload da configuração
   - Use `getEnvironmentManager().reloadConfig()`

3. **Performance impact**
   - Monitore métricas de Core Web Vitals
   - Desabilite features desnecessárias
   - Use lazy loading para componentes pesados

### Debugging

```typescript
// Debug feature flags
import { getAdvancedFeatureFlags } from "./feature-flags";
const flags = getAdvancedFeatureFlags();
console.log("All rules:", flags.getAllRules());
console.log("Rollout status:", flags.getRolloutStatus());

// Debug environment config
import { getEnvironmentManager } from "./environment-manager";
const env = getEnvironmentManager();
console.log("Config:", env.getConfig());
```

## Próximos Passos

1. **Implementar A/B testing framework** baseado nos feature flags
2. **Criar dashboard administrativo** para controle em tempo real
3. **Adicionar canary deployments** com feature flags
4. **Implementar circuit breakers** para proteção automática
5. **Configurar monitoring de feature usage** para analytics
