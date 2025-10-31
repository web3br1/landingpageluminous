# 🎯 TDD Quality System - Documentação Oficial

> _Sistema inteligente e resiliente para análise de qualidade TDD que evolui com a maturidade do projeto._

---

## 📋 Índice

- [🎯 Visão Geral](#-visão-geral)
- [🏗️ Arquitetura](#️-arquitetura)
- [🧭 Níveis de Maturidade](#-níveis-de-maturidade)
- [🚀 Guia de Uso](#-guia-de-uso)
- [🔧 Configuração](#-configuração)
- [🤖 Integração CI/CD](#-integração-cicd)
- [📊 Métricas e Relatórios](#-métricas-e-relatórios)
- [🧪 Experimentação](#-experimentação)
- [🧭 Governança](#-governança)
- [📚 Referências Técnicas](#-referências-técnicas)

---

## 🎯 Visão Geral

O **TDD Quality System** foi criado para eliminar pontos cegos de qualidade, fornecendo métricas contextuais e confiáveis que evoluem com a maturidade do projeto.

### ✨ Características Principais

- ✅ **Sempre gera diagnóstico** - independente do estado dos testes
- 🧠 **Métricas contextuais** - scores se adaptam à maturidade (M0→M3)
- ⚡ **Performance otimizada** - cache inteligente acelera execuções
- 🔔 **Alertas proativos** - detecta anomalias automaticamente
- 🧪 **Validação experimental** - A/B testing das próprias métricas
- 📊 **Visualizações ricas** - dashboards interativos para decisão

### 🎯 Objetivos Estratégicos

1. **Eliminar pontos cegos** - nunca ficar sem diagnóstico acionável
2. **Fornecer métricas inteligentes** - scores contextuais, não números brutos
3. **Impulsionar melhoria contínua** - dados históricos e alertas preditivos
4. **Integrar qualidade ao fluxo** - sem aumentar fricção no desenvolvimento

---

## 🏗️ Arquitetura

```
🎯 TDD Quality Orchestrator (Núcleo)
├── 🧪 Test Health Classifier (Diagnóstico Base)
├── 🛡️ Safe Tests Manager (Subset Confiável M1+)
├── ⚙️ TDD Analysis Engine (Métricas Reais M2+)
├── 📊 Hybrid Metrics Calculator (Scores Contextuais)
├── 💾 Cache Manager (Performance LRU/TTL)
├── 📈 Static Coverage Proxy (Fallback Inteligente)
├── 🚨 Alerts Manager (Notificações Proativas)
├── 🎛️ CI Integration (Automação Completa)
├── 📊 Dashboard Generator (Visualizações HTML)
└── 🧪 A/B Testing (Validação Experimental)
```

### 🧩 Componentes Principais

| Componente         | Responsabilidade              | Status                  |
| ------------------ | ----------------------------- | ----------------------- |
| **Classifier**     | Diagnóstico sempre-disponível | ✅ Core                 |
| **Safe Tests**     | Subset confiável de testes    | ✅ M1+                  |
| **Engine**         | Métricas reais completas      | ✅ M2+                  |
| **Hybrid Metrics** | Scores contextuais            | ✅ Inteligente          |
| **Cache**          | Performance otimizada         | ✅ LRU/TTL              |
| **Alerts**         | Notificações proativas        | ✅ Automáticas          |
| **CI/CD**          | Integração nativa             | ✅ Gates + Notificações |
| **Dashboard**      | Visualizações executivas      | ✅ HTML Interativo      |
| **A/B Testing**    | Validação experimental        | ✅ Automática           |

---

## 🧭 Níveis de Maturidade (M0 → M3)

| Nível  | Cenário    | Características              | Ações Prioritárias       |
| ------ | ---------- | ---------------------------- | ------------------------ |
| **M0** | Caos Total | Classifier ativo, Engine off | Corrigir falhas críticas |
| **M1** | Instável   | Safe Tests + proxy           | Melhorar estabilidade    |
| **M2** | Estável    | Engine + híbrido             | Expandir cobertura       |
| **M3** | Sólido     | Métricas reais completas     | Otimizar continuamente   |

### 📊 Como a Maturidade Afeta os Scores

```javascript
// M0: Foco em correção básica
weights = {
  isolation: 0.25, // Prioriza isolamento
  coverage: 0.03, // Cobertura mínima
  structure: 0.2, // Estrutura básica
};

// M3: Foco em excelência
weights = {
  coverage: 0.25, // Cobertura máxima
  isolation: 0.15, // Isolamento mantido
  performance: 0.15, // Performance crítica
};
```

---

## 🚀 Guia de Uso

### ⚡ Execução Básica

```bash
# Análise completa inteligente
npm run tdd:analyze

# Diagnóstico sempre-disponível
npm run tdd:classify

# Visualizar relatório
npm run tdd:report
```

### 🔧 Recursos Avançados

```bash
# Safe Tests management
npm run tdd:safe-tests

# Relatório estruturado (JSON)
npm run tdd:structured

# Dashboard HTML interativo
npm run tdd:dashboard

# Alertas ativos
npm run tdd:alerts

# A/B Testing experiments
npm run tdd:experiments
```

### 🎛️ CI/CD Integration

```bash
# Gate obrigatório em PRs
npm run tdd:gate

# Engine standalone (diagnóstico avançado)
npm run tdd:engine
```

---

## 🔧 Configuração

### Environment Variables

```bash
# CI/CD Detection
CI=true
GITHUB_ACTIONS=true

# Cache Configuration
TDD_CACHE_TTL_LOCAL=3600000    # 1h local
TDD_CACHE_TTL_CI=86400000      # 24h CI

# Quality Thresholds
TDD_MIN_SCORE_MERGE=60
TDD_MAX_CRITICAL_ISSUES=3
TDD_MAX_ANALYSIS_TIME=120000   # 2min
```

### Arquivos de Configuração

```
tmp/
├── tdd-safe-tests.json      # Subset de testes confiáveis
├── tdd-history.json         # Histórico de execuções
├── tdd-experiments/         # Experimentos A/B ativos
│   └── *.json
└── tdd-reports/             # Relatórios gerados
    ├── tdd-report.md
    ├── tdd-report-*.json
    └── tdd-dashboard.html
```

---

## 🤖 Integração CI/CD

### Pipeline Recomendado

```yaml
# .github/workflows/tdd-quality.yml
name: TDD Quality Analysis

on:
  pull_request:
    branches: [main, develop]

jobs:
  tdd-analysis:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run TDD Quality Analysis
        run: npm run tdd:analyze

      - name: Run PR Gate
        run: npm run tdd:gate

      - name: Upload Reports
        uses: actions/upload-artifact@v4
        with:
          name: tdd-reports
          path: tmp/tdd-reports/

      - name: Comment PR
        if: always()
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs')
            const report = fs.readFileSync('tmp/tdd-reports/tdd-report.md', 'utf8')

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: \`## 🎯 TDD Quality Analysis\n\n\${report}\`
            })
```

### Políticas de Merge

```javascript
// Regras de aprovação automática
const mergePolicies = {
  M0: {
    maxCriticalIssues: 5, // Permissivo em caos
    minScore: 20, // Score mínimo baixo
    requireSafeTests: false, // Não requer subset
  },
  M1: {
    maxCriticalIssues: 3,
    minScore: 40,
    requireSafeTests: true, // Começa a exigir
  },
  M2: {
    maxCriticalIssues: 1,
    minScore: 60,
    requireSafeTests: true,
  },
  M3: {
    maxCriticalIssues: 0,
    minScore: 80,
    requireSafeTests: true,
  },
};
```

---

## 📊 Métricas e Relatórios

### Relatórios Automáticos

#### 1. Executive Summary

```
🎯 Score Final: 72.4/100
📊 Maturidade: M2 (Estável)
🔴 Críticos: 1
🟡 Avisos: 3
⏱️ Tempo: 2.3s
```

#### 2. Detailed Breakdown

| Métrica     | Peso | Score | Contribuição | Fonte      |
| ----------- | ---- | ----- | ------------ | ---------- |
| Coverage    | 18%  | 85.2  | 15.3         | Hybrid     |
| Isolation   | 18%  | 78.1  | 14.1         | Classifier |
| Performance | 12%  | 92.0  | 11.0         | Engine     |

#### 3. Cache Performance

```
✅ SRC: HIT
✅ TESTS: HIT
❌ CONFIG: MISS (changed: package.json)
✅ LOCKFILE: HIT

📊 Hit Rate: 75%
⚡ Tempo Total: 0.8s
```

### Dashboard HTML

O dashboard fornece visualizações interativas com:

- Gráficos de tendência histórica
- Distribuição de maturidade
- Alertas ativos por categoria
- Comparação de métricas por domínio
- Heatmap de arquivos problemáticos

---

## 🧪 Experimentação

### Experimentos Padrão

#### Maturity Weights Optimization

```javascript
// Testa diferentes pesos para maturidade
variants: [
  { name: "Current", weights: { coverage: 0.15, isolation: 0.2 } },
  { name: "Coverage Focus", weights: { coverage: 0.25, isolation: 0.15 } },
  { name: "Stability Focus", weights: { coverage: 0.1, isolation: 0.25 } },
];
```

#### Cache TTL Optimization

```javascript
// Testa diferentes TTLs de cache
variants: [
  { name: "TTL 30min", config: { ttl: 1800000 } },
  { name: "TTL 60min", config: { ttl: 3600000 } },
  { name: "TTL 120min", config: { ttl: 7200000 } },
];
```

### Como Participar

O sistema atribui automaticamente variantes baseadas em:

- Branch do PR
- Autor do commit
- Timestamp arredondado

Resultados são analisados estatisticamente para determinar vencedores.

---

## 🧭 Governança

### RACI (Responsabilidades)

| Papel                   | Responsabilidades                     |
| ----------------------- | ------------------------------------- |
| **Dev**                 | Corrigir findings, executar local     |
| **Tech Lead**           | Monitorar trends, coordenar correções |
| **Platform Eng**        | Manter CI/CD, cache, infraestrutura   |
| **Engineering Manager** | Definir políticas, acompanhar KPIs    |
| **Product Manager**     | Usar insights para priorização        |

### Boas Práticas Culturais

#### Para Desenvolvimento

- Execute `npm run tdd:analyze` antes de push
- Corrija alertas críticos imediatamente
- Use o dashboard para acompanhar progresso pessoal

#### Para Liderança Técnica

- Revise alertas semanais em equipe
- Transforme reincidentes em épicos técnicos
- Use maturidade como indicador de saúde da codebase

#### Para Gestão

- Acompanhe evolução da maturidade mensal
- Use score como proxy de qualidade técnica
- Considere maturidade em decisões de arquitetura

### KPIs de Sucesso

- **Diagnóstico sempre disponível** (uptime 100%)
- **Tempo médio de análise** < 30s
- **Taxa de merge bloqueado** < 5%
- **Tempo de resposta a alertas** < 24h
- **Evolução de maturidade** consistente M0→M3

---

## 📚 Referências Técnicas

### Arquitetura Detalhada

- [🏗️ Arquitetura do Sistema](./architecture.md)
- [🧩 Componentes Técnicos](./components.md)
- [🔌 APIs e Interfaces](./api-reference.md)

### Desenvolvimento

- [🚀 Guia de Contribuição](../CONTRIBUTING.md)
- [🧪 Testes do Sistema](./testing.md)
- [🔧 Troubleshooting](./troubleshooting.md)

### Operação

- [⚙️ Configuração Avançada](./configuration.md)
- [📊 Monitoramento](./monitoring.md)
- [🔄 Manutenção](./maintenance.md)

---

## 📞 Suporte

### Canais de Comunicação

- **🐛 Issues**: [GitHub Issues](https://github.com/your-org/repo/issues)
- **💬 Discussões**: Slack `#tdd-quality`
- **📧 Email**: tdd-quality@company.com
- **📖 Docs**: [Documentação Completa](./)

### Níveis de Suporte

1. **Documentação**: Verifique este guia primeiro
2. **Comunidade**: Issues no GitHub para dúvidas gerais
3. **Suporte Técnico**: Issues críticas ou bugs
4. **Consultoria**: Para implementações customizadas

---

**🎯 TDD Quality System - Transformando qualidade em vantagem competitiva.**

_Sistema que não apenas mede qualidade, mas a impulsiona continuamente._
