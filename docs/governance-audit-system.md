# Sistema de Auditoria de Governança Técnica

## Visão Geral

Este sistema implementa auditoria contínua de integrações e código não utilizado, identificando automaticamente riscos de segurança, operacionais e financeiros no monorepo.

## O que é auditado

### 1. Integrações
- **Configuradas mas não utilizadas**: Pacotes instalados/SDK inicializados mas nunca chamados
- **Uso inseguro**: Chamadas externas sem tratamento de erro ou validação de resposta
- **Camada proibida**: Uso de integrações em layers incorretos da arquitetura

### 2. Código Não Utilizado
- **Variáveis de ambiente**: Declaradas mas nunca lidas
- **Imports não utilizados**: Módulos trazidos mas não consumidos
- **Exports não utilizados**: Funções/constant exportadas mas nunca importadas
- **Endpoints inativos**: Rotas que existem mas não chamam lógica de negócio

## Arquitetura do Sistema

```
📁 lib/integrations/inventory.json          # Inventário oficial de integrações
📁 scripts/audit-integrations-and-unused.mjs # Scanner principal
📁 scripts/generate-executive-report.mjs     # Relatório executivo
📁 scripts/audit-dashboard.mjs               # Dashboard histórico
📁 quality-history/                          # Histórico de auditorias
📁 .github/workflows/governance-audit.yml   # CI/CD integration
```

## Como usar

### Auditoria completa
```bash
# Executa todos os scanners
npm run audit:full

# Apenas auditoria técnica
npm run audit:integrations

# Apenas relatório executivo
npm run audit:executive
```

### Dashboard e histórico
```bash
# Ver dashboard atual
npm run audit:dashboard

# Gerar relatório markdown
npm run audit:dashboard:markdown

# Ver histórico
npm run audit:history
```

### CI/CD
```bash
# Gate de qualidade (falha em problemas críticos)
npm run ci:audit-gate

# Governança completa
npm run ci:governance
```

## Classificação de Severidade

### 🔴 CRITICAL (Bloqueia merge)
- Credenciais vazadas para client-side (`process.env` em componentes)
- Endpoints fantasma (rotas públicas sem lógica de negócio)

### 🟡 HIGH (Sprint atual)
- Integrações críticas sem tratamento de erro
- Integrações com impacto financeiro não utilizadas
- Uso de integrações em camadas proibidas

### 🟢 MEDIUM (Próxima sprint)
- Variáveis de ambiente não utilizadas
- Código exportado mas não importado
- Imports não utilizados

### 🔵 LOW (Backlog técnico)
- Código experimental não utilizado

## Relatórios Gerados

### 1. JSON Técnico (`quality-history/YYYY-MM-DD-integrations-audit.json`)
Dados brutos para processamento automatizado e dashboards.

### 2. Relatório Executivo (`quality-history/YYYY-MM-DD-executive-report.json`)
Insights acionáveis para stakeholders:
- Resumo executivo
- Avaliação de riscos (segurança, operacional, financeiro)
- Itens de ação priorizados
- Recomendações

### 3. Dashboard (`quality-history/audit-dashboard.md`)
Análise de tendências e evolução histórica.

## CI/CD Integration

### GitHub Actions
O workflow `.github/workflows/governance-audit.yml` executa:
- Toda PR (bloqueia merge se houver problemas críticos)
- Toda segunda-feira (auditoria semanal)
- Manual (workflow_dispatch)

### Gates
- **CRITICAL**: CI falha, PR não pode ser merged
- **HIGH**: CI passa mas adiciona comentário de aviso
- **MEDIUM/LOW**: Apenas registro em métricas

## Configuração

### Inventário de Integrações

Edite `lib/integrations/inventory.json` para adicionar novas integrações:

```json
{
  "integrations": {
    "minha_integracao": {
      "name": "Minha Integração",
      "package": "@minha/integracao",
      "env_vars": ["MINHA_API_KEY", "MINHA_SECRET"],
      "layers_allowed": ["application", "infrastructure"],
      "usage_patterns": ["await minhaAPI.call"],
      "critical": true,
      "revenue_impact": true
    }
  }
}
```

### Padrões de Segurança

Configure padrões de segurança no mesmo arquivo:

```json
{
  "security_patterns": {
    "client_side_env_leak": {
      "pattern": "process\\.env\\.",
      "forbidden_in": ["components/**/*", "lib/hooks/**/*"],
      "severity": "CRITICAL"
    }
  }
}
```

## Interpretação dos Resultados

### Exemplo de Relatório Executivo

```json
{
  "executive_summary": {
    "overview": "Auditoria identificou 15 pontos de atenção",
    "critical_findings": [
      "2 problemas críticos identificados",
      "3 problemas de alta severidade"
    ],
    "business_impact": "ALTO: Problemas críticos podem impactar segurança"
  },
  "action_items": [
    {
      "priority": "CRITICAL",
      "title": "Corrigir vazamento de credenciais",
      "owner": "Security Team",
      "deadline": "Imediato"
    }
  ]
}
```

## Manutenção

### Atualização do Inventário
- Adicione novas integrações conforme são implementadas
- Marque `critical: true` para integrações que podem derrubar o negócio
- Defina `revenue_impact: true` para integrações pagas

### Thresholds de Alerta
- **CRITICAL > 0**: Pânico, bloquear deploy
- **HIGH > 5**: Atenção da liderança técnica
- **TOTAL > 20**: Revisar processo de desenvolvimento

### Tendências
Monitore no dashboard:
- Número de variáveis órfãs crescendo?
- Integrações fantasmas acumulando?
- Problemas críticos recorrendo?

## Troubleshooting

### Scanner não encontra integração
1. Verifique se `package` está correto no `inventory.json`
2. Confirme se `usage_patterns` match o código real
3. Teste grep manual: `grep -r "await stripe\." .`

### Falsos positivos
1. Integrações usadas via dynamic imports
2. Uso condicional (feature flags)
3. Adicione ao `inventory.json` com `critical: false`

### Performance
- Auditoria completa: ~30 segundos
- Cache inteligente evita rescans desnecessários
- Paralelização possível para grandes codebases

## Benefícios Esperados

### Segurança
- Zero vazamentos de credenciais
- Tratamento adequado de falhas externas
- Superfície de ataque minimizada

### Financeiro
- Identificação de custos desnecessários
- Otimização de licenças de integração

### Operacional
- Código mais limpo e manutenível
- Menos complexidade cognitiva
- Deploy mais confiável

### Cultural
- Visibilidade objetiva da qualidade
- Accountability técnica
- Melhoria contínua automatizada
