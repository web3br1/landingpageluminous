# Parallel TDD System - Multi-Agent Orchestration

## 🎯 Visão Geral

O **Sistema Paralelo de TDD** implementa uma arquitetura multi-agente para desenvolvimento orientado a testes com execução inteligente e concorrente. O sistema permite executar três tipos de agentes especializados simultaneamente com controle de prioridade e geração automática de relatórios consolidados.

## 🏗️ Arquitetura

### Agentes Disponíveis

| Agente                  | Propósito                                       | Gatilho    | Prioridade | Frequência   |
| ----------------------- | ----------------------------------------------- | ---------- | ---------- | ------------ |
| **War-Room TDD**        | Correções críticas e estabilização              | Manual     | Alta       | Sob demanda  |
| **Stability Scanner**   | Monitoramento contínuo e detecção de regressões | Agendado   | Normal     | Diária/merge |
| **Optimization Sprint** | Melhorias incrementais e otimização             | Background | Baixa      | Contínua     |

### Controle de Concorrência

- **Máximo 2 agentes simultâneos** para evitar sobrecarga
- **Sistema de prioridades** usando `nice` levels
- **Timeouts configuráveis** por agente
- **Retry automático** em caso de falhas

## 🚀 Como Usar

### Execução Completa

```bash
# Executa todos os agentes em paralelo
npm run tdd:parallel

# Verifica status da última execução
npm run tdd:status

# Lista agentes disponíveis
npm run tdd:agents
```

### Execução Individual

```bash
# Apenas War-Room (correções críticas)
npm run tdd:war-room

# Apenas Stability Scanner (monitoramento)
npm run tdd:stability

# Apenas Optimization Sprint (melhorias)
npm run tdd:optimize
```

### Execução Customizada

```bash
# Executar apenas scanner e optimization
node scripts/parallel-tdd-scheduler.mjs run stability-scanner optimization-sprint

# Executar war-room apenas
node scripts/parallel-tdd-scheduler.mjs run war-room
```

## 📊 Relatórios e Métricas

### Estrutura de Relatórios

Os relatórios são salvos em `tmp/parallel-tdd/` com a seguinte estrutura:

```
tmp/parallel-tdd/
├── consolidated-report-[timestamp].json  # Relatório consolidado
├── latest-report.json                    # Último relatório
├── [agent-id]/
│   ├── [timestamp]/
│   │   ├── execution.log                 # Log detalhado
│   │   ├── report.json                   # Resultado do agente
│   │   └── status.json                   # Status da execução
│   └── ...
└── scheduler.log                         # Log do orquestrador
```

### Schema do Relatório Consolidado

```json
{
  "timestamp": "2025-10-29T16:25:56.642Z",
  "duration": 22587,
  "agents": {
    "war-room": {
      "name": "War-Room TDD",
      "success": true,
      "duration": 12500,
      "error": null,
      "outputDir": "tmp/parallel-tdd/war-room/2025-10-29T16-25-56-642Z"
    }
  },
  "summary": {
    "totalAgents": 3,
    "successfulAgents": 2,
    "failedAgents": 1,
    "successRate": "66.7",
    "totalDuration": 22587,
    "efficiencyScore": 75,
    "maturityTrend": "up"
  },
  "efficiency": {
    "score": 75,
    "trend": "up",
    "metrics": {
      "coverageGain": 5,
      "perfImprovements": 2,
      "avgDuration": 7529
    }
  },
  "recommendations": [
    "Fix failed agents: optimization-sprint",
    "Consider increasing concurrency if agents are waiting"
  ]
}
```

## ⚙️ Configuração

### Variáveis de Ambiente

| Variável         | Descrição          | Padrão           |
| ---------------- | ------------------ | ---------------- |
| `TDD_AGENT_ID`   | ID do agente atual | Nome do script   |
| `TDD_OUTPUT_DIR` | Diretório de saída | `tmp/[agent-id]` |

### Configuração do Scheduler

```javascript
// Em parallel-tdd-scheduler.mjs
const CONFIG = {
  maxConcurrency: 2, // Máximo de agentes simultâneos
  niceLevels: {
    // Prioridades (menor = mais prioridade)
    "war-room": -10,
    "stability-scanner": 0,
    "optimization-sprint": 5,
  },
  timeouts: {
    // Timeouts por agente (ms)
    "war-room": 30 * 60 * 1000,
    "stability-scanner": 15 * 60 * 1000,
    "optimization-sprint": 20 * 60 * 1000,
  },
  retryAttempts: 2, // Tentativas de retry
};
```

## 🔧 Desenvolvimento de Novos Agentes

### Estrutura de um Agente

```javascript
class MyAgent {
  constructor() {
    this.agentId = process.env.TDD_AGENT_ID || "my-agent";
    this.outputDir = process.env.TDD_OUTPUT_DIR || "tmp/my-agent";
  }

  async execute() {
    try {
      // Lógica do agente
      const result = await this.performWork();

      return {
        success: true,
        data: result,
        metrics: this.collectMetrics(),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Métodos específicos do agente...
}

// Interface obrigatória
export default async function main() {
  const agent = new MyAgent();
  const result = await agent.execute();
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.success ? 0 : 1);
}
```

### Registro de Novos Agentes

1. Criar script em `scripts/[agent-id].mjs`
2. Adicionar ao objeto `AGENTS` no scheduler
3. Configurar timeouts e prioridades
4. Adicionar script npm em `package.json`

## 📈 Monitoramento e Observabilidade

### Métricas Coletadas

- **Taxa de Sucesso**: Proporção de agentes que completam com sucesso
- **Pontuação de Eficiência**: Score baseado em melhorias alcançadas
- **Tempo Médio de Execução**: Performance dos agentes
- **Tendência de Maturidade**: Evolução do projeto (M0 → M3)

### Dashboards

Os relatórios podem ser integrados com:

- **GitHub Actions**: Para CI/CD automatizado
- **Vercel Analytics**: Para métricas de deploy
- **Custom Dashboards**: Usando os JSON reports
- **Slack/Discord**: Notificações automáticas

## 🎯 Estratégias de Uso

### Cenários de Aplicação

#### **Desenvolvimento Ativo**

```bash
# Diariamente durante desenvolvimento
npm run tdd:parallel  # Scanner + Optimization
```

#### **Pré-Deploy**

```bash
# Antes de cada deploy
npm run tdd:war-room  # Verificação crítica
```

#### **Monitoramento Contínuo**

```bash
# No CI/CD pipeline
npm run tdd:stability  # Regressões
```

#### **Otimização Background**

```bash
# Em horários de baixa atividade
npm run tdd:optimize   # Melhorias incrementais
```

### Pipeline de Integração

```yaml
# .github/workflows/tdd-pipeline.yml
name: TDD Quality Pipeline
on: [push, pull_request]

jobs:
  tdd-parallel:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run Parallel TDD
        run: npm run tdd:parallel

      - name: Upload reports
        uses: actions/upload-artifact@v3
        with:
          name: tdd-reports
          path: tmp/parallel-tdd/
```

## 🛠️ Troubleshooting

### Problemas Comuns

#### **Agentes não executam**

```bash
# Verificar se scripts existem
npm run tdd:agents

# Verificar logs
tail -f tmp/parallel-tdd/scheduler.log
```

#### **Timeout de agentes**

```bash
# Aumentar timeout no CONFIG
# Ou otimizar o agente específico
```

#### **Conflitos de recursos**

```bash
# Reduzir maxConcurrency
# Executar agentes individualmente
```

#### **Relatórios não gerados**

```bash
# Verificar permissões de escrita
ls -la tmp/

# Verificar estrutura de diretórios
find tmp/parallel-tdd/ -type f
```

## 🎉 Benefícios

### Para Desenvolvedores

- **Feedback Rápido**: Problemas detectados antes de impactar produção
- **Melhorias Automáticas**: Código otimizado continuamente
- **Redução de Débito Técnico**: Pequenas correções frequentes

### Para Equipes

- **Padronização**: Abordagem consistente de qualidade
- **Escalabilidade**: Sistema cresce com o projeto
- **Visibilidade**: Métricas claras de maturidade

### Para Organizações

- **ROI Melhorado**: Menos bugs, mais velocidade
- **Qualidade Sustentável**: Práticas incorporadas ao workflow
- **Inovação Acelerada**: Foco em features, não em correções

---

**🚀 Próximos Passos**: Integre o sistema ao seu CI/CD e observe a evolução automática da qualidade do código!
