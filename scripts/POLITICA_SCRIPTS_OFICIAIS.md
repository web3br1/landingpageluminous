# Política de Scripts Oficiais - Luminaris Quality System

**Data de Vigência:** Hoje
**Status:** Ativa
**Próxima Revisão:** Trimestral

## Declaração Executiva

A partir desta data, o sistema de scripts do Luminaris adota um regime de governança centralizada. Esta mudança estabelece fronteira clara entre práticas históricas caóticas e governança viva do sistema.

## Catálogo Oficial de Scripts

Existe agora um **catálogo oficial de scripts** com autoridade técnica. Somente os scripts oficiais são suportados pelo sistema de qualidade.

### Scripts Oficiais (Status: Active)

Localizados em `/scripts/official/`:

- `quality-gate.mjs` - Gate de qualidade pré-PR
- `ci-gate.mjs` - Gate de qualidade para CI
- `quality-fixer.mjs` - Correções automáticas de qualidade
- `dashboard-quality.mjs` - Dashboard de saúde geral
- `dashboard-tdd.mjs` - Dashboard de disciplina interna
- `dashboard-audit.mjs` - Dashboard de risco
- `dashboard-trends.mjs` - Dashboard de narrativa temporal
- `perf-monitor.mjs` - Monitoramento de performance
- `bundle-analyze.mjs` - Análise de bundles
- `analytics-monitor.mjs` - Monitoramento de analytics
- `deploy.mjs` - Automação de deployment
- `post-deploy.mjs` - Validação pós-deployment

### Scripts Legados (Status: Legacy)

Localizados em `/scripts/legacy/`:

Scripts substituídos por versões oficiais. Permanecem acessíveis para referência histórica, mas não são suportados. Cada script legado contém cabeçalho com:

- Status: LEGACY
- Substituído por: [nome do oficial]
- Owner: [responsável]
- Data de quarentena: [data]

### Scripts Quarentenados (Status: Quarantined)

Scripts não catalogados, sem dono identificado ou com risco de segurança. Bloqueados automaticamente pelo Compliance Engine.

## Regras Operacionais

### CI e Pre-commit

A partir desta data, CI e pre-commit bloqueiam automaticamente qualquer uso de scripts não oficiais:

- Scripts em `legacy/` ou `quarantined/` falham no pre-commit
- Scripts em `legacy/` ou `quarantined/` falham no CI Gate
- Apenas scripts em `official/` com status "active" são permitidos

### Criação de Novos Scripts

Não é mais permitido criar "scriptzinhos rápidos" sem registro oficial:

1. Todo novo script deve ser proposto no catálogo oficial
2. Deve passar por aprovação técnica (Compliance Engine)
3. Deve seguir convenções de nomenclatura e estrutura

### Remoção de Scripts

Scripts legados seguem processo de depreciação controlada:

1. Recebem strike inicial no Compliance Engine
2. Se não tocados por ciclo completo: marcados para remoção
3. Contestação legítima pode reverter status
4. Remoção física acontece apenas após período de quarentena

## Responsabilidades

### Dono de Script
- Responsável pela manutenção e correção do script
- Deve responder a alertas do Compliance Engine
- Deve atualizar documentação quando houver mudanças

### Compliance Engine
- Fiscaliza uso de scripts não oficiais
- Conta strikes em scripts legados
- Bloqueia automaticamente violações

### Depreciation Engine
- Gerencia ciclo de vida de scripts legados
- Agenda remoções baseadas em strikes acumulados
- Mantém trilha auditável de decisões

## Comunicação

Esta política entra em vigor imediatamente após publicação. Qualquer dúvida deve ser direcionada ao responsável técnico do sistema de qualidade.

## Histórico de Revisões

- v1.0: Política inicial de governança de scripts
- Próxima: [trimestral, baseada em métricas de conformidade]

---

**Luminaris Quality System**  
*Governança viva, não limpeza aleatória.*
