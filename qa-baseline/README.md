# 📊 QA Baselines

Este diretório contém baselines versionadas das métricas de qualidade.

## Baseline Atual: v1.0 (2025-10-26)

**Pós-otimizações completas do QA Framework**

### Métricas Principais

- **Chromium p95**: ≤12s
- **Firefox p95**: ≤13.8s
- **Flake Rate**: <0.8%
- **Lighthouse**: ≥92
- **Bundle Size**: ≤474KB

### Como Usar

```javascript
import baseline from "./qa-baseline/2025-10-26.json";
// Usar em ci-guardrails.mjs para comparação
```

### Atualização

- Próxima revisão: 2026-01-26
- Requer aprovação do QA Lead
- Documentar mudanças no CHANGELOG.md

---

_Gerado automaticamente pelo QA Framework_
