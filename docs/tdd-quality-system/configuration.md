# 🔧 Configuração - TDD Quality System

> Guia completo para configurar thresholds, políticas e comportamentos do sistema.

---

## 📋 Índice

- [🎛️ Configurações Básicas](#️-configurações-básicas)
- [⚖️ Thresholds por Maturidade](#️-thresholds-por-maturidade)
- [🚦 Políticas de CI/CD](#-políticas-de-cicd)
- [💾 Configuração de Cache](#-configuração-de-cache)
- [🔔 Configuração de Alertas](#-configuração-de-alertas)
- [🧪 Experimentos A/B](#-experimentos-ab)
- [🔧 Variáveis de Ambiente](#-variáveis-de-ambiente)
- [📁 Estrutura de Arquivos](#-estrutura-de-arquivos)

---

## 🎛️ Configurações Básicas

### Arquivo de Configuração Principal

```javascript
// tools/tdd/config/defaults.js
export const tddConfig = {
  // Versão do sistema
  version: '1.0.0',

  // Ambiente de execução
  environment: {
    ci: process.env.CI === 'true',
    local: !process.env.CI,
    github: process.env.GITHUB_ACTIONS === 'true'
  },

  // Thresholds globais
  thresholds: {
    minScoreForMerge: 60,
    maxCriticalIssues: 3,
    maxAnalysisTime: 120000, // 2 minutos
    minCacheHitRate: 0.7     // 70%
  },

  // Configurações de maturidade
  maturity: {
    M0: { /* Caos Total */ },
    M1: { /* Instável */ },
    M2: { /* Estável */ },
    M3: { /* Sólido */ }
  }
}
```

### Configuração por Projeto

```javascript
// tools/tdd/config/project.js
export const projectConfig = {
  // Contexto específico do projeto
  domain: 'landing-page', // saas, fintech, healthcare, etc.

  // Características técnicas
  tech: {
    framework: 'nextjs',
    testing: 'vitest',
    language: 'typescript',
    styling: 'tailwind'
  },

  // Expectativas de qualidade
  expectations: {
    minCoverage: 80,
    maxComplexity: 10,
    requireTypes: true,
    requireTests: true
  },

  // Políticas específicas
  policies: {
    allowPartialCoverage: true,
    prioritizeCriticalPath: true,
    experimentalFeatures: false
  }
}
```

---

## ⚖️ Thresholds por Maturidade

### M0 - Caos Total

```javascript
M0_thresholds = {
  // Permissivo para permitir recuperação
  score: {
    minMerge: 20,      // Score mínimo muito baixo
    target: 40,        // Meta realista
    excellent: 60      // Excelente para M0
  },

  issues: {
    maxCritical: 5,    // Permite mais críticos
    maxWarnings: 20,   // Avisos liberais
    maxInfo: 50        // Infos liberais
  },

  metrics: {
    coverage: {
      min: 0,          // Sem mínimo
      target: 30,      // Meta baixa
      weight: 0.03     // Peso mínimo
    },
    isolation: {
      min: 0,
      target: 50,
      weight: 0.25     // Prioriza isolamento
    },
    performance: {
      maxTime: 300000, // 5 minutos
      weight: 0.05     // Peso mínimo
    }
  },

  execution: {
    allowEngineFailure: true,    // Engine pode falhar
    requireSafeTests: false,     // Não requer subset
    useProxyCoverage: true       // Sempre usa proxy
  }
}
```

### M1 - Instável

```javascript
M1_thresholds = {
  // Começa a exigir qualidade básica
  score: {
    minMerge: 40,      // Score mínimo razoável
    target: 60,        // Meta desafiadora
    excellent: 75
  },

  issues: {
    maxCritical: 3,    // Reduz críticos
    maxWarnings: 15,   // Avisos controlados
    maxInfo: 30
  },

  metrics: {
    coverage: {
      min: 10,         // Mínimo básico
      target: 50,      // Meta intermediária
      weight: 0.10     // Peso aumentado
    },
    isolation: {
      min: 30,
      target: 70,
      weight: 0.22
    },
    performance: {
      maxTime: 180000, // 3 minutos
      weight: 0.08
    }
  },

  execution: {
    allowEngineFailure: true,    // Ainda permite falha
    requireSafeTests: true,      // Agora requer subset
    useProxyCoverage: true
  }
}
```

### M2 - Estável

```javascript
M2_thresholds = {
  // Qualidade consolidada
  score: {
    minMerge: 60,      // Score profissional
    target: 80,        // Meta alta
    excellent: 90
  },

  issues: {
    maxCritical: 1,    // Só 1 crítico
    maxWarnings: 10,   // Avisos limitados
    maxInfo: 20
  },

  metrics: {
    coverage: {
      min: 40,         // Cobertura significativa
      target: 75,      // Meta alta
      weight: 0.18     // Peso relevante
    },
    isolation: {
      min: 60,
      target: 85,
      weight: 0.18
    },
    performance: {
      maxTime: 120000, // 2 minutos
      weight: 0.12     // Performance importa
    }
  },

  execution: {
    allowEngineFailure: false,   // Engine deve funcionar
    requireSafeTests: true,      // Subset obrigatório
    useProxyCoverage: false      // Prefere real
  }
}
```

### M3 - Sólido

```javascript
M3_thresholds = {
  // Excelência técnica
  score: {
    minMerge: 80,      // Score muito alto
    target: 95,        // Meta excelente
    excellent: 100
  },

  issues: {
    maxCritical: 0,    // Zero críticos
    maxWarnings: 5,    // Avisos mínimos
    maxInfo: 10
  },

  metrics: {
    coverage: {
      min: 70,         // Cobertura alta
      target: 90,      // Meta muito alta
      weight: 0.25     // Máximo peso
    },
    isolation: {
      min: 80,
      target: 95,
      weight: 0.15
    },
    performance: {
      maxTime: 60000,  // 1 minuto
      weight: 0.15     // Performance crítica
    }
  },

  execution: {
    allowEngineFailure: false,   // Engine sempre funciona
    requireSafeTests: true,      // Subset ainda necessário
    useProxyCoverage: false      // Sempre real
  }
}
```

---

## 🚦 Políticas de CI/CD

### Gates por Tipo de PR

```javascript
const prGates = {
  // PR normal
  standard: {
    requireAnalysis: true,
    blockOnCritical: true,
    blockOnScoreBelowMin: true,
    allowPartialCoverage: 'M1+', // Permite em M1+
    notifyOnWarnings: true
  },

  // Hotfix urgente
  hotfix: {
    requireAnalysis: true,
    blockOnCritical: false,     // Não bloqueia críticos
    blockOnScoreBelowMin: false, // Permite score baixo
    allowPartialCoverage: true,  // Sempre permite
    notifyOnWarnings: false      // Não notifica avisos
  },

  // Feature flag
  featureFlag: {
    requireAnalysis: false,     // Não requer análise
    blockOnCritical: false,
    blockOnScoreBelowMin: false,
    allowPartialCoverage: true,
    notifyOnWarnings: false
  },

  // Dependabot
  dependabot: {
    requireAnalysis: true,
    blockOnCritical: true,
    blockOnScoreBelowMin: false, // Não bloqueia score
    allowPartialCoverage: true,
    notifyOnWarnings: true
  }
}
```

### Estratégias de Notificação

```javascript
const notificationStrategies = {
  // PR comments
  prComment: {
    enabled: true,
    template: 'tdd-pr-comment.md',
    updateExisting: true,
    includeDashboard: false
  },

  // Slack notifications
  slack: {
    enabled: true,
    channels: ['#dev-quality', '#dev-team'],
    onFailure: true,
    onRecovery: true,
    includeScore: true
  },

  // Email reports
  email: {
    enabled: false, // Desabilitado por padrão
    recipients: ['tech-leads@company.com'],
    frequency: 'weekly',
    includeTrends: true
  }
}
```

---

## 💾 Configuração de Cache

### Políticas de Cache

```javascript
const cachePolicies = {
  // Por ambiente
  local: {
    ttl: 3600000,     // 1 hora
    maxEntries: 20,   // Máximo 20 entradas
    strategy: 'lru'   // LRU por uso
  },

  ci: {
    ttl: 86400000,    // 24 horas
    maxEntries: 10,   // Máximo 10 entradas
    strategy: 'ttl'   // TTL simples
  },

  // Por domínio
  domains: {
    src: {
      priority: 'high',
      invalidation: 'content-hash'
    },
    tests: {
      priority: 'high',
      invalidation: 'content-hash'
    },
    config: {
      priority: 'medium',
      invalidation: 'modified-time'
    },
    lockfile: {
      priority: 'low',
      invalidation: 'version-check'
    }
  }
}
```

### Estratégias de Invalidação

```javascript
const invalidationStrategies = {
  // Hash do conteúdo
  'content-hash': {
    algorithm: 'sha256',
    include: ['**/*.{ts,tsx,js,jsx,json}'],
    exclude: ['node_modules/**', '.git/**']
  },

  // Tempo de modificação
  'modified-time': {
    granularity: 'minute',
    compare: 'newer-than-cache'
  },

  // Verificação de versão
  'version-check': {
    source: 'package.json',
    field: 'version'
  }
}
```

---

## 🔔 Configuração de Alertas

### Regras de Alerta

```javascript
const alertRules = {
  // Regressão de score
  scoreRegression: {
    enabled: true,
    threshold: -10,   // Caiu 10 pontos
    severity: 'high',
    action: 'block-merge',
    cooldown: 3600000 // 1 hora
  },

  // Issues recorrentes
  recurringIssues: {
    enabled: true,
    threshold: 3,     // Mesmo issue 3+ vezes
    severity: 'medium',
    action: 'create-task',
    lookback: 604800000 // 7 dias
  },

  // Performance degradada
  performanceDegradation: {
    enabled: true,
    threshold: 2,     // > 2 minutos
    severity: 'low',
    action: 'notify-team',
    baseline: 'average-last-7-days'
  },

  // Cobertura reduzida
  coverageDrop: {
    enabled: true,
    threshold: -0.05, // Caiu 5%
    severity: 'medium',
    action: 'investigate',
    ignoreSafeTests: true
  },

  // Maturidade reduzida
  maturityRegression: {
    enabled: true,
    threshold: -1,    // Caiu 1 nível
    severity: 'high',
    action: 'escalate-lead',
    cooldown: 86400000 // 24 horas
  }
}
```

### Canais de Notificação

```javascript
const alertChannels = {
  github: {
    enabled: true,
    template: 'alert-github.md',
    updateComments: true
  },

  slack: {
    enabled: true,
    webhook: process.env.SLACK_WEBHOOK_URL,
    channel: '#alerts-quality',
    templates: {
      high: 'alert-slack-high.md',
      medium: 'alert-slack-medium.md',
      low: 'alert-slack-low.md'
    }
  },

  email: {
    enabled: false,
    smtp: {
      host: process.env.SMTP_HOST,
      port: 587,
      secure: false
    },
    templates: {
      weekly: 'alert-email-weekly.html'
    }
  }
}
```

---

## 🧪 Experimentos A/B

### Experimentos Ativos

```javascript
const activeExperiments = {
  // Otimização de pesos de maturidade
  'maturity-weights-optimization': {
    id: 'mw-opt-2025',
    variants: [
      {
        name: 'conservative',
        config: { weights: { classifier: 0.8, engine: 0.2 } },
        traffic: 0.5
      },
      {
        name: 'aggressive',
        config: { weights: { classifier: 0.6, engine: 0.4 } },
        traffic: 0.5
      }
    ],
    metric: 'score_stability',
    duration: 1209600000, // 2 semanas
    status: 'running'
  },

  // Otimização de cache TTL
  'cache-ttl-optimization': {
    id: 'cache-ttl-2025',
    variants: [
      { name: '30min', config: { ttl: 1800000 }, traffic: 0.33 },
      { name: '60min', config: { ttl: 3600000 }, traffic: 0.33 },
      { name: '120min', config: { ttl: 7200000 }, traffic: 0.34 }
    ],
    metric: 'cache_hit_rate',
    duration: 604800000, // 1 semana
    status: 'running'
  }
}
```

### Atribuição de Variantes

```javascript
const variantAssignment = {
  // Baseada na branch
  branchBased: {
    'feature/*': 'experimental',
    'bugfix/*': 'conservative',
    'main': 'control'
  },

  // Baseada no usuário (hash consistente)
  userBased: {
    algorithm: 'consistent-hash',
    salt: 'tdd-experiment-salt-2025'
  },

  // Baseada no tempo (janelas arredondadas)
  timeBased: {
    window: 3600000, // 1 hora
    distribution: 'round-robin'
  }
}
```

---

## 🔧 Variáveis de Ambiente

### Variáveis Obrigatórias

```bash
# Ambiente
CI=true                              # Indica ambiente CI
GITHUB_ACTIONS=true                  # Específico para GitHub
NODE_ENV=production                  # Ambiente Node.js

# Configurações do sistema
TDD_CONFIG_VERSION=1.0.0             # Versão da configuração
TDD_PROJECT_DOMAIN=landing-page      # Domínio do projeto
TDD_TECH_STACK=nextjs-typescript     # Stack técnica

# Thresholds globais
TDD_MIN_SCORE_MERGE=60               # Score mínimo para merge
TDD_MAX_CRITICAL_ISSUES=3            # Máximo de issues críticos
TDD_MAX_ANALYSIS_TIME=120000         # Tempo máximo (ms)

# Cache
TDD_CACHE_TTL_LOCAL=3600000          # TTL local (1h)
TDD_CACHE_TTL_CI=86400000            # TTL CI (24h)
TDD_CACHE_MAX_ENTRIES=20             # Máximo entradas

# Alertas
TDD_SLACK_WEBHOOK_URL=https://...    # Webhook Slack
TDD_EMAIL_SMTP_HOST=smtp.company.com # SMTP host
TDD_EMAIL_RECIPIENTS=leads@company.com # Destinatários
```

### Variáveis Opcionais

```bash
# Debug e desenvolvimento
TDD_DEBUG=true                       # Habilita logs detalhados
TDD_VERBOSE=true                     # Logs verbosos
TDD_DRY_RUN=true                     # Executa sem efeitos colaterais

# Experimentos
TDD_EXPERIMENT_ENABLED=true          # Habilita A/B testing
TDD_EXPERIMENT_VARIANT=conservative  # Força variante específica

# Customizações
TDD_CUSTOM_CONFIG_PATH=./custom.js   # Arquivo config customizado
TDD_REPORT_TEMPLATE=custom.md        # Template customizado
TDD_DASHBOARD_THEME=dark             # Tema do dashboard

# Performance
TDD_MAX_WORKERS=4                    # Workers paralelos
TDD_TIMEOUT_GLOBAL=300000            # Timeout global (5min)
TDD_MEMORY_LIMIT=1024MB              # Limite de memória
```

---

## 📁 Estrutura de Arquivos

### Diretórios Principais

```
docs/
├── tdd-quality-system/
│   ├── README.md                    # Documentação principal
│   ├── architecture.md              # Arquitetura técnica
│   ├── configuration.md             # Este arquivo
│   ├── troubleshooting.md           # Resolução de problemas
│   ├── api-reference.md             # Referência de APIs
│   └── examples/                    # Exemplos práticos
│       ├── basic-setup.md
│       ├── advanced-config.md
│       └── custom-thresholds.md

tools/
├── tdd/
│   ├── config/
│   │   ├── defaults.js              # Configurações padrão
│   │   ├── project.js               # Config projeto específico
│   │   └── environments/            # Config por ambiente
│   │       ├── local.js
│   │       ├── ci.js
│   │       └── production.js
│   ├── types/
│   │   ├── config.types.ts          # Tipos TypeScript
│   │   └── thresholds.types.ts
│   └── validation/
│       ├── config-validator.js      # Valida configurações
│       └── schema-validator.js      # Valida schemas

tmp/
├── tdd-config.json                  # Configuração runtime
├── tdd-thresholds.json              # Thresholds calculados
└── tdd-reports/
    └── .gitkeep
```

### Arquivos de Configuração

#### `.tddrc.json` (Raiz do Projeto)

```json
{
  "version": "1.0.0",
  "project": {
    "domain": "landing-page",
    "tech": ["nextjs", "typescript", "vitest"],
    "expectations": {
      "minCoverage": 80,
      "maxComplexity": 10
    }
  },
  "overrides": {
    "M1": {
      "score": { "minMerge": 45 }
    }
  }
}
```

#### `tools/tdd/config/project.js`

```javascript
export const projectConfig = {
  // Configurações específicas do projeto Landing Page
  domain: 'landing-page',

  tech: {
    framework: 'nextjs',
    testing: 'vitest',
    language: 'typescript',
    styling: 'tailwind'
  },

  // Thresholds ajustados para o contexto
  maturity: {
    M0: {
      score: { minMerge: 25 }, // Mais permissivo devido ao contexto
      metrics: {
        coverage: { weight: 0.05 } // Cobertura menos crítica
      }
    },
    M1: {
      score: { minMerge: 50 },
      metrics: {
        coverage: { weight: 0.15 }
      }
    },
    M2: {
      score: { minMerge: 70 }, // Mais exigente
      metrics: {
        coverage: { weight: 0.25 }
      }
    }
  }
}
```

---

## 🔄 Atualização de Configurações

### Processo de Atualização

1. **Proposta**: Criar PR com mudanças propostas
2. **Validação**: Executar `npm run tdd:validate-config`
3. **Teste**: Executar análise completa com nova config
4. **Aprovação**: Code review e testes em staging
5. **Deploy**: Merge gradual com feature flags

### Validação de Configurações

```bash
# Valida sintaxe e consistência
npm run tdd:validate-config

# Testa com dados reais
npm run tdd:test-config

# Simula impacto das mudanças
npm run tdd:simulate-config
```

### Rollback Automático

```javascript
const rollbackConfig = {
  enabled: true,
  trigger: {
    scoreDrop: 15,      // Caiu 15 pontos
    errorRate: 0.5      // 50% de erros
  },
  action: {
    revert: true,
    notify: ['tech-leads', 'dev-team'],
    quarantine: 3600000 // 1 hora em quarentena
  }
}
```

---

**🔧 Configuração flexível e adaptável ao contexto do projeto.**
