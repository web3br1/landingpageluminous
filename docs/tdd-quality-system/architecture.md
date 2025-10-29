# 🏗️ Arquitetura Técnica - TDD Quality System

> Detalhes técnicos da arquitetura que garante resiliência e performance.

---

## 📋 Visão Geral da Arquitetura

O TDD Quality System utiliza uma arquitetura **dual-engine resiliente** que combina múltiplas estratégias para garantir que o sistema **sempre fornece diagnóstico acionável**, independente do estado da suíte de testes.

### Princípios Fundamentais

- **🎯 Sempre Funcional**: Nunca falha completamente, mesmo em caos total
- **🧠 Contextualmente Inteligente**: Scores se adaptam à maturidade do projeto
- **⚡ Performático**: Cache inteligente minimiza reexecuções
- **🔧 Modular**: Componentes independentes com responsabilidades claras
- **📊 Observável**: Logs, métricas e traces completos
- **🧪 Validável**: A/B testing das próprias métricas

---

## 🏛️ Arquitetura em Camadas

```
┌─────────────────────────────────────────────────────────┐
│                    🎯 ORCHESTRATOR                     │
│                (Coordenação Inteligente)               │
├─────────────────────────────────────────────────────────┤
│   🧪 CLASSIFIER   🛡️ SAFE TESTS   ⚙️ ENGINE   🧮 HYBRID   │
│  (Base Always)   (M1+)         (M2+)       (Context)    │
├─────────────────────────────────────────────────────────┤
│               💾 CACHE   📈 PROXY   🚨 ALERTS            │
│              (Perf)     (Fallback) (Notify)             │
├─────────────────────────────────────────────────────────┤
│         🤖 CI/CD   📊 DASHBOARD   🧪 A/B TESTING         │
│        (Auto)      (Visual)       (Validation)          │
├─────────────────────────────────────────────────────────┤
│                    🔧 INFRASTRUCTURE                    │
│               (Scripts, Utils, Storage)                │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Componente: Orchestrator (Núcleo)

### Responsabilidades

1. **Coordenação Inteligente**: Decide quais componentes executar baseado na maturidade
2. **Fluxo de Controle**: Gerencia sequência de execução e degradação
3. **Integração de Sinais**: Combina dados de múltiplas fontes
4. **Relatório Final**: Gera outputs consolidados

### Algoritmo de Execução

```javascript
async runDualAnalysis() {
  // 1. Sempre executar Classifier (fonte da verdade)
  const classifier = await this.classifier.classifyTestHealth()

  // 2. Determinar maturidade baseada no Classifier
  const maturity = this.determineMaturityLevel(classifier)

  // 3. Executar componentes condicionalmente
  const results = {
    classifier,
    maturity,
    safeTests: await this.runSafeTestsIfNeeded(maturity),
    engine: await this.runEngineIfNeeded(maturity),
    coverageProxy: await this.calculateCoverageProxy(),
    hybridScores: this.calculateHybridScores(results)
  }

  // 4. Gerar relatório consolidado
  return this.generateConsolidatedReport(results)
}
```

---

## 🧪 Componente: Test Health Classifier (Base Sempre-Ativa)

### Propósito

O **Classifier** é o componente que **nunca falha**. Ele fornece diagnóstico básico baseado em estrutura de código e testes, independente se os testes executam ou não.

### Métricas Analisadas

| Métrica | Descrição | Como Mede | Peso Base |
|---------|-----------|-----------|-----------|
| **Isolation** | Isolamento de testes | Análise estática de dependências | 25% |
| **Structure** | Estrutura do código | Cobertura de patterns TDD | 20% |
| **Dependencies** | Gestão de dependências | Análise de imports/mock | 15% |
| **Naming** | Qualidade de nomes | Convenções e clareza | 10% |
| **Coverage Proxy** | Estimativa de cobertura | Linhas instrumentáveis | 15% |

### Como Funciona

```javascript
class TestHealthClassifier {
  async classifyTestHealth() {
    // Análise sempre-disponível (não depende de execução)
    const isolation = this.analyzeIsolation()
    const structure = this.analyzeStructure()
    const dependencies = this.analyzeDependencies()

    return {
      isolation: { score: isolation.score, details: isolation.details },
      structure: { score: structure.score, details: structure.details },
      dependencies: { score: dependencies.score, details: dependencies.details },
      overall: this.calculateOverallScore()
    }
  }
}
```

---

## 🛡️ Componente: Safe Tests Manager (Subset Confiável)

### Propósito

Gerencia um **subset pequeno e confiável** de testes que rodam mesmo em ambientes instáveis (M1+), garantindo métricas parciais quando a suíte completa falha.

### Critérios para Safe Tests

```javascript
const safeTestCriteria = {
  maxDuration: 5000,        // Máximo 5s por teste
  minSafetyScore: 80,       // Score mínimo de confiança
  maxDependencies: 3,        // Máximo 3 dependências externas
  prioritizeCriticalPath: true, // Priorizar caminhos críticos
  maxTestCount: 50          // Máximo 50 testes no subset
}
```

### Processo de Seleção

1. **Descoberta**: Escaneia todos os arquivos de teste
2. **Avaliação**: Calcula safety score por teste
3. **Seleção**: Escolhe subset ótimo baseado em critérios
4. **Validação**: Verifica consistência histórica
5. **Execução**: Roda apenas o subset confiável

---

## ⚙️ Componente: TDD Analysis Engine (Métricas Reais)

### Propósito

Executa **análise completa de qualidade** quando o projeto está maduro o suficiente (M2+), fornecendo métricas reais de cobertura, performance e qualidade técnica.

### Métricas Reais Analisadas

| Métrica | Ferramenta | Descrição |
|---------|------------|-----------|
| **Coverage** | vitest --coverage | Cobertura de código real |
| **Performance** | vitest --reporter=json | Tempo de execução |
| **Lint Quality** | eslint | Qualidade do código |
| **TypeScript** | tsc --noEmit | Saúde dos tipos |
| **Complexity** | eslint complexity | Complexidade ciclomática |

### Modos de Execução

- **Incremental**: Só analisa arquivos modificados
- **Full**: Análise completa da codebase
- **Safe Subset**: Executa apenas sobre safe tests

---

## 🧮 Componente: Hybrid Metrics Calculator

### Propósito

Combina métricas do **Classifier** (sempre disponíveis) com métricas do **Engine** (quando disponíveis) usando pesos contextuais baseados na maturidade.

### Fórmula Híbrida

```javascript
calculateHybridScores(results) {
  const maturity = results.maturity
  const weights = this.getWeightsForMaturity(maturity)

  // Classifier sempre contribui
  const classifierScore = results.classifier.overall.score * weights.classifier

  // Engine contribui condicionalmente
  const engineScore = results.engine
    ? this.calculateEngineContribution(results.engine) * weights.engine
    : 0

  // Proxy de cobertura como fallback
  const coverageScore = results.coverageProxy.aggregate.proxyCoverage * weights.coverage

  return {
    finalScore: classifierScore + engineScore + coverageScore,
    breakdown: {
      classifier: classifierScore,
      engine: engineScore,
      coverage: coverageScore
    },
    weights,
    maturity: maturity.level
  }
}
```

### Pesos por Maturidade

```javascript
const maturityWeights = {
  M0: { classifier: 0.80, engine: 0.05, coverage: 0.15 }, // Foco em correção básica
  M1: { classifier: 0.70, engine: 0.15, coverage: 0.15 }, // Começa métricas reais
  M2: { classifier: 0.60, engine: 0.25, coverage: 0.15 }, // Engine mais relevante
  M3: { classifier: 0.50, engine: 0.35, coverage: 0.15 }  // Excelência completa
}
```

---

## 💾 Componente: Cache Manager (Performance)

### Estratégia de Cache

Utiliza **content hash** de arquivos críticos + **LRU com TTL** para otimizar performance.

### Chaves de Cache

```javascript
const cacheKeys = {
  src: hashFiles('src/**/*.{ts,tsx,js,jsx}'),
  tests: hashFiles('tests/**/*.{ts,tsx,js,jsx}'),
  config: hashFiles('package.json', 'vite.config.*', 'tsconfig.json'),
  lockfile: hashFiles('package-lock.json', 'yarn.lock', 'pnpm-lock.yaml')
}
```

### Políticas de Evicção

- **LRU**: Remove entradas menos recentemente usadas quando limite atingido
- **TTL**: Expiração baseada em tempo (1h local, 24h CI)
- **Tamanho**: Máximo 10 entradas por domínio

---

## 📈 Componente: Static Coverage Proxy

### Propósito

Fornece **estimativa de cobertura** sem executar testes, baseada em análise estática de código instrumentável.

### Como Funciona

1. **Instrumentable Lines**: Conta linhas elegíveis para cobertura
2. **Test File Presence**: Verifica se existem testes correspondentes
3. **Test Quality**: Estima qualidade baseada em estrutura

```javascript
calculateProxyCoverage() {
  const instrumentableLines = countInstrumentableLines('src/**')
  const testFiles = countTestFiles('tests/**')
  const testQuality = estimateTestQuality(testFiles)

  // Fórmula proxy: presença + qualidade + instrumentabilidade
  const proxy = (instrumentableLines * 0.4) + (testFiles * 0.4) + (testQuality * 0.2)

  return Math.min(proxy, 100) // Máximo 100%
}
```

---

## 🚨 Componente: Alerts Manager

### Tipos de Alertas

| Tipo | Gatilho | Severidade | Ação |
|------|---------|------------|------|
| **Regression** | Score cai >10pts | Alta | Bloquear merge |
| **Recurring Issues** | Mesmo problema 3+ vezes | Média | Criar task |
| **Performance** | Análise >2min | Baixa | Otimizar |
| **Coverage Drop** | Cobertura cai >5% | Média | Investigar |

### Canais de Notificação

- **GitHub PR Comments**: Alertas no PR
- **Slack**: Notificações em tempo real
- **Email**: Resumos diários/semanal
- **Dashboard**: Visualização histórica

---

## 🤖 Componente: CI/CD Integration

### Gates Automáticos

```javascript
// scripts/tdd-pr-gate.mjs
async function runGate() {
  const analysis = await runAnalysis()

  const policies = getPoliciesForMaturity(analysis.maturity)

  if (analysis.score < policies.minScore) {
    console.error(`❌ Score muito baixo: ${analysis.score}/${policies.minScore}`)
    process.exit(1)
  }

  if (analysis.criticalIssues > policies.maxCriticalIssues) {
    console.error(`❌ Muitos issues críticos: ${analysis.criticalIssues}`)
    process.exit(1)
  }

  console.log('✅ Gate aprovado')
}
```

### Integrações Suportadas

- **GitHub Actions**: PR comments, status checks
- **GitLab CI**: Merge request approvals
- **Jenkins**: Pipeline stages
- **Custom**: Webhooks para sistemas próprios

---

## 📊 Componente: Dashboard Generator

### Visualizações Disponíveis

1. **Score Evolution**: Tendência histórica do score
2. **Maturity Timeline**: Progressão de maturidade
3. **Issues Heatmap**: Distribuição de problemas por arquivo
4. **Coverage Trends**: Evolução de cobertura proxy/real
5. **Alerts Timeline**: Cronologia de alertas
6. **Team Performance**: Métricas por desenvolvedor

### Tecnologias

- **Frontend**: HTML5 + CSS3 + Vanilla JS
- **Charts**: Chart.js para visualizações
- **Data**: JSON embedded no HTML
- **Interactivity**: Drill-down e filtros

---

## 🧪 Componente: A/B Testing

### Framework Experimental

Permite testar variações das próprias métricas do sistema:

```javascript
const experiments = {
  'maturity-weights': {
    variants: [
      { name: 'conservative', weights: { classifier: 0.8, engine: 0.2 } },
      { name: 'aggressive', weights: { classifier: 0.6, engine: 0.4 } }
    ],
    metric: 'score_stability',
    duration: '2 weeks'
  }
}
```

### Atribuição Determinística

- **Branch-based**: PRs em branches específicas
- **User-based**: Desenvolvedores específicos
- **Time-based**: Janelas temporais arredondadas

---

## 🔧 Infraestrutura

### Scripts Core

| Script | Comando | Descrição |
|--------|---------|-----------|
| `tdd:analyze` | `node scripts/tdd-orchestrator.mjs` | Análise completa inteligente |
| `tdd:classify` | `node scripts/test-health-classifier.mjs` | Diagnóstico base sempre-disponível |
| `tdd:safe-tests` | `node scripts/tdd-safe-tests.mjs` | Gerenciamento do subset confiável |
| `tdd:engine` | `node scripts/tdd-analysis-engine.mjs` | Métricas reais avançadas |
| `tdd:gate` | `node scripts/tdd-pr-gate.mjs` | Gate de qualidade para CI/CD |

### Storage

```
tmp/
├── tdd-safe-tests.json      # Cache do subset confiável
├── tdd-history.json         # Histórico de execuções
├── tdd-cache/               # Cache LRU/TTL por domínio
│   ├── src-*.json
│   ├── tests-*.json
│   └── config-*.json
├── tdd-reports/             # Relatórios gerados
│   ├── tdd-report.md
│   ├── tdd-report-*.json
│   └── tdd-dashboard.html
└── tdd-experiments/         # Estado dos experimentos
    └── *.json
```

---

## 📊 Observabilidade

### Métricas Coletadas

| Métrica | Tipo | Descrição |
|---------|------|-----------|
| `tdd_analysis_duration_ms` | Histogram | Tempo total de análise |
| `tdd_score_final` | Gauge | Score final calculado |
| `tdd_maturity_level` | Gauge | Nível de maturidade atual |
| `tdd_cache_hit_rate` | Gauge | Taxa de acertos do cache |
| `tdd_alerts_active` | Counter | Número de alertas ativos |

### Logs Estruturados

```json
{
  "timestamp": "2025-10-29T12:34:56Z",
  "level": "info",
  "component": "orchestrator",
  "operation": "dual_analysis",
  "maturity": "M2",
  "score": 78.5,
  "duration_ms": 2340,
  "cache_hits": 3,
  "cache_misses": 1,
  "trace_id": "abc-123-def"
}
```

---

## 🔄 Ciclo de Vida

### Desenvolvimento

1. **Local**: `npm run tdd:analyze` antes de commit
2. **CI**: Análise automática em PR
3. **Merge**: Gate verifica conformidade
4. **Post-merge**: Cache atualizado, alertas processados
5. **Monitoramento**: Dashboard atualizado com novas métricas

### Manutenção

- **Daily**: Verificação de alertas ativos
- **Weekly**: Revisão de trends e reincidentes
- **Monthly**: Ajuste de thresholds baseado em dados
- **Quarterly**: Revisão arquitetural e experimentos

---

**🏗️ Arquitetura que combina resiliência, performance e inteligência contextual.**
