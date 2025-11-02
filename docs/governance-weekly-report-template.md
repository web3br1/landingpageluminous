# 📊 RELATÓRIO SEMANAL DE GOVERNANÇA TÉCNICA
**Semana:** {{WEEK_START}} - {{WEEK_END}} | **Data de Geração:** {{REPORT_DATE}}

## 🎯 VISÃO EXECUTIVA

### Status da Governança
- **🏆 Pontuação de Saúde:** {{HEALTH_SCORE}}/100
- **📈 Tendência:** {{TREND}} (vs semana anterior)
- **⚡ Ações Pendentes:** {{PENDING_ACTIONS}}
- **🎯 Taxa de Resolução:** {{RESOLUTION_RATE}}%

---

## 📈 MÉTRICAS-CHAVE (KPIs de Governança)

### 🧹 Eficiência de Limpeza
| Métrica | Atual | Meta | Status |
|---------|-------|------|--------|
| **Taxa de Limpeza** | {{CLEANUP_RATE}}% | >80% | {{CLEANUP_STATUS}} |
| **Tempo Médio de Morte** | {{DECAY_TIME}} dias | <21 dias | {{DECAY_STATUS}} |
| **Churn Saudável** | {{HEALTHY_CHURN}}% | >60% | {{CHURN_STATUS}} |

### 🔄 Fluxo de Itens
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   EM_ANDAMENTO  │ -> │    CONGELADO    │ -> │    OBSOLETO     │
│   ({{IN_PROGRESS_COUNT}})   │    ({{FROZEN_COUNT}})   │    ({{OBSOLETE_COUNT}})   │
│                 │    │   SLA: 48h      │    │   Remover        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
     ↑                        ↑                        ↑
   {{NEW_IN_PROGRESS}}       {{FROZEN_THIS_WEEK}}    {{REMOVED_THIS_WEEK}}
```

---

## 🎯 CLASSIFICAÇÃO DETALHADA

### 🚧 EM ANDAMENTO ({{IN_PROGRESS_COUNT}} itens)
**Critério:** Sinais claros de construção ativa

#### Novos Esta Semana
{{NEW_IN_PROGRESS_ITEMS}}

#### Em Risco de Congelamento ({{AT_RISK_COUNT}})
*Itens próximos do limite de 14 dias*
{{AT_RISK_ITEMS}}

### ❓ CONGELADO ({{FROZEN_COUNT}} itens)
**SLA:** 48h para decisão

#### Novos Esta Semana
{{NEW_FROZEN_ITEMS}}

#### SLA Violado ({{SLA_VIOLATED_COUNT}})
*Itens há mais de 48h sem decisão*
{{SLA_VIOLATED_ITEMS}}

### 🗑️ OBSOLETO ({{OBSOLETE_COUNT}} itens)
**Status:** Aguardando remoção

#### Novos Esta Semana
{{NEW_OBSOLETE_ITEMS}}

#### Removidos Esta Semana ✅
{{REMOVED_THIS_WEEK_ITEMS}}

---

## 📋 AÇÕES RECOMENDADAS

### 🔥 PRIORIDADE CRÍTICA (Esta Semana)
{{CRITICAL_ACTIONS}}

### ⚡ PRIORIDADE ALTA (Próximos 3 dias)
{{HIGH_PRIORITY_ACTIONS}}

### 📅 PLANEJAMENTO (Próxima Semana)
{{PLANNING_ACTIONS}}

---

## 📊 ANÁLISE DE TENDÊNCIAS

### Distribuição por Tipo
```
📁 Código Não Utilizado: {{CODE_UNUSED_PERCENT}}%
🌐 Endpoints Fantasmas: {{ENDPOINT_UNUSED_PERCENT}}%
🔗 Integrações Órfãs: {{INTEGRATION_UNUSED_PERCENT}}%
🏷️ Variáveis Órfãs: {{ENV_UNUSED_PERCENT}}%
```

### Tempo Médio por Categoria
- **EM_ANDAMENTO → CONGELADO:** {{AVG_TIME_TO_FREEZE}} dias
- **CONGELADO → OBSOLETO:** {{AVG_TIME_TO_OBSOLETE}} dias
- **OBSOLETO → REMOVIDO:** {{AVG_TIME_TO_REMOVE}} dias

### Top Owners com Pendências
{{OWNER_PENDENCY_REPORT}}

---

## 🏆 CONQUISTAS DA SEMANA

### ✅ Sucessos
{{WEEK_SUCCESS}}

### 🎯 Metas Atingidas
{{ACHIEVED_GOALS}}

### 📈 Melhorias Observadas
{{IMPROVEMENTS}}

---

## ⚠️ ALERTAS E RISCOS

### 🔴 Riscos Críticos
{{CRITICAL_RISKS}}

### 🟠 Riscos Moderados
{{MODERATE_RISKS}}

### 📊 Previsões
{{FORECASTS}}

---

## 📝 PRÓXIMOS PASSOS

### 🎯 Metas para Próxima Semana
{{NEXT_WEEK_GOALS}}

### 🔧 Melhorias Planejadas
{{PLANNED_IMPROVEMENTS}}

### 📚 Aprendizados
{{LESSONS_LEARNED}}

---

## 📎 ANEXOS

- **Relatório Técnico Completo:** `quality-history/{{DATE}}-integrations-audit.json`
- **Histórico de Governança:** `quality-history/governance-history.json`
- **Dashboard Visual:** Abrir `quality-audit/dashboard.html`

---

*Relatório gerado automaticamente pelo Sistema de Governança Técnica*
*Para questões, contatar: @tech-governance-team*
