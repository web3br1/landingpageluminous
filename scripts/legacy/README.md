# Scripts Legados - Luminaris Quality System

## Status: LEGACY

Esta pasta contém scripts **substituídos** por versões oficiais em `/scripts/official/`.

## Importante

- **NÃO USE** scripts nesta pasta em produção
- **NÃO USE** scripts nesta pasta em CI/CD
- **NÃO USE** scripts nesta pasta em pre-commit hooks

Todos os scripts aqui têm cabeçalhos indicando:
- Status: LEGACY
- Substituto oficial
- Owner responsável
- Data de quarentena

## Processo de Depreciação

Scripts legados seguem ciclo de depreciação automática:

1. **Strike inicial** no Compliance Engine
2. **Monitoramento de uso** - se não tocados por ciclo completo
3. **Sem contestação legítima** - movidos para deprecated
4. **Remoção física** após período de quarentena (30 dias)

## Contestação

Para contestar remoção de script legado:

1. Justifique necessidade técnica/business
2. Proponha reabsorção em script oficial
3. Atualize owner se necessário
4. Compliance Engine decidirá manutenção ou depreciação

## Scripts Presentes

### Gates Substituídos
- `quality-gate.mjs` → `../official/quality-gate.mjs`
- `ci-quality-gate.mjs` → `../official/ci-gate.mjs`
- `ci-quality-gates-v2.mjs` → `../official/ci-gate.mjs`

### Correções Substituídas
- `bulk-quality-fixes.mjs` → `../official/quality-fixer.mjs`
- `fix-critical-ts-errors.mjs` → `../official/quality-fixer.mjs`
- `eslint-systematic-fixes.mjs` → `../official/quality-fixer.mjs`

### Performance Substituída
- `performance-optimization.mjs` → `../official/perf-monitor.mjs`
- `bundle-analysis-report.mjs` → `../official/bundle-analyze.mjs`

### Deployment Substituído
- `post-deploy-checklist.mjs` → `../official/post-deploy.mjs`
- `deploy-vercel.js` → `../official/deploy.mjs`

---

**Luminaris Quality System** - Depreciação controlada, não abandono caótico.
