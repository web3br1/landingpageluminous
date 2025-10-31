# Scripts Oficiais - Luminaris Quality System

## Visão Geral

Esta pasta contém os **scripts oficiais** do sistema de qualidade do Luminaris. Todos os scripts aqui são:

- **Aprovados** e **suportados** pelo sistema
- **Registrados** no Compliance Engine com status "active"
- **Bloqueados automaticamente** se tentarem executar scripts não-oficiais

## Scripts Disponíveis

### Gates de Qualidade
- `quality-gate.mjs` - Validações pré-PR
- `ci-gate.mjs` - Validações em CI/CD

### Correções Automáticas
- `quality-fixer.mjs` - Correções automáticas de qualidade

### Dashboards
- `dashboard-quality.mjs` - Saúde geral do código
- `dashboard-tdd.mjs` - Disciplina de testes
- `dashboard-audit.mjs` - Riscos e compliance
- `dashboard-trends.mjs` - Tendências temporais

### Performance & Bundle
- `perf-monitor.mjs` - Monitoramento de performance
- `bundle-analyze.mjs` - Análise de bundles
- `analytics-monitor.mjs` - Monitoramento de analytics

### Deployment
- `deploy.mjs` - Automação de deployment
- `post-deploy.mjs` - Validação pós-deployment

## Como Usar

```bash
# Executar quality gate pré-PR
node scripts/official/quality-gate.mjs

# Executar correções automáticas
node scripts/official/quality-fixer.mjs

# Ver dashboard de qualidade
node scripts/official/dashboard-quality.mjs
```

## Status e Aprovação

Todos os scripts nesta pasta têm:
- **Status**: ACTIVE
- **Owner**: Quality Team
- **Approved**: 2025-10-31

## Desenvolvimento

Para modificar scripts oficiais:
1. Proponha mudança documentada
2. Teste thoroughly
3. Atualize Compliance Engine
4. Mantenha compatibilidade com CI/pre-commit

## Relacionamento com Outros Diretórios

- `/scripts/legacy/` - Scripts substituídos (não usar em produção)
- `/scripts/` (raiz) - Scripts em transição ou quarentena

---

**Luminaris Quality System** - Governança viva, não limpeza aleatória.
