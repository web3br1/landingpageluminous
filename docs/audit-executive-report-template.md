# 🚨 RELATÓRIO EXECUTIVO - AUDITORIA DE RISCO
**Data:** {{DATE}}

## 📊 STATUS GERAL
- **Total de achados:** {{TOTAL_FINDINGS}}
- **Problemas críticos:** {{CRITICAL_ISSUES}} 🔴
- **Problemas altos:** {{HIGH_ISSUES}} 🟠
- **Problemas médios:** {{MEDIUM_ISSUES}} 🟡
- **Problemas baixos:** {{LOW_ISSUES}} 🟢

## 🔥 PONTOS CRÍTICOS (ATENÇÃO IMEDIATA)

### Vazamentos de Segurança
{{LEAKED_ENV_VARS}}

### Endpoints Fantasmas
{{INACTIVE_ENDPOINTS}}

### Uso Proibido de Integrações
{{FORBIDDEN_INTEGRATIONS}}

## ⚠️ PONTOS ALTOS (ATENÇÃO RÁPIDA - <7 DIAS)

### Integrações Não Utilizadas
{{UNUSED_INTEGRATIONS}}

### Tratamento de Erro Ausente
{{MISSING_ERROR_HANDLING}}

### Variáveis de Ambiente Órfãs
{{ORPHAN_ENV_VARS}}

## 🎯 CLASSIFICAÇÃO POR INTENÇÃO - GOVERNANÇA ATIVA

### 🚧 EM ANDAMENTO (manter e terminar)
**Critério:** Sinais claros de construção ativa (recentes, TODOs, testes, registrados, expostos)

{{IN_PROGRESS_ITEMS}}

### ❓ CONGELADO (decisão humana necessária)
**SLA:** 48h para resposta - {{SLA_DATE}}
**Critério:** Parece abandonado (14-45 dias) mas pode ser estratégico

{{FROZEN_ITEMS}}

### 🗑️ OBSOLETO (remover imediatamente)
**Ação:** Deletar sem cerimônia
**Critério:** Claramente lixo (>45 dias sem sinais, gera custo sem benefício)

{{OBSOLETE_ITEMS}}

## 🧹 HIGIENE CONTÍNUA (BACKLOG TÉCNICO)

### Código Não Utilizado
- **Exports não utilizados:** {{UNUSED_EXPORTS_COUNT}}
- **Imports não utilizados:** {{UNUSED_IMPORTS_COUNT}}

## 📋 PRÓXIMOS PASSOS

{{NEXT_STEPS}}

### 🎯 SLA de Resolução por Categoria
- **CRÍTICO:** Imediato (antes do deploy)
- **ALTO:** < 7 dias (esta sprint)
- **CONGELADO:** 48h para decisão (owners notificados acima)
- **OBSOLETO:** Imediato (remover sem cerimônia)
- **EM ANDAMENTO:** Manter até conclusão

---

*Relatório gerado automaticamente pelo sistema de auditoria contínua*
*Sistema inclui classificação inteligente baseada em intenção*
*Para detalhes técnicos completos, consulte o arquivo JSON correspondente*
