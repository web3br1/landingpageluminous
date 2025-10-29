#!/bin/bash

# 🚀 CI Integration Example - QA Guardrails
# Este script demonstra como integrar os guardrails de QA no pipeline CI/CD

set -e

echo "🛡️ Executando QA Guardrails - CI Integration"
echo "==========================================="

# 1. Setup
echo "📦 Setup do ambiente..."
npm ci

# 2. Executar guardrails vs baseline
echo "🔍 Executando guardrails..."
node scripts/ci-guardrails.mjs

# 3. Executar validação SSR
echo "⚛️  Validando SSR/Hidratação..."
node scripts/ssr-hydration-validation.mjs

# 4. Executar validação de performance (se aplicável)
echo "⚡ Validando performance real..."
node scripts/performance-real-validation.mjs

# 5. Verificar alertas críticos
echo "🚨 Verificando alertas críticos..."
CRITICAL_ALERTS=$(jq '.summary.criticalAlerts // 0' ci-guardrails.json)
SSR_WARNINGS=$(jq '.summary.hasBuildWarnings // false' ssr-hydration-results.json)

echo "📊 Status dos checks:"
echo "   • Alertas críticos: $CRITICAL_ALERTS"
echo "   • SSR Warnings: $SSR_WARNINGS"

# 6. Tomada de decisão
if [ "$CRITICAL_ALERTS" -gt 0 ]; then
    echo "🚫 CRITICAL ALERTS DETECTED - MERGE BLOCKED"
    echo "   Verifique ci-guardrails.json para detalhes"
    exit 1
fi

if [ "$SSR_WARNINGS" = "true" ]; then
    echo "🚫 SSR WARNINGS DETECTED - MERGE BLOCKED"
    echo "   Verifique ssr-hydration-results.json para detalhes"
    exit 1
fi

echo "✅ TODOS OS CHECKS APROVADOS"
echo "🎉 PR pode ser merged com segurança"

# 7. Gerar relatório para PR
echo "📝 Gerando relatório para PR..."
cat > qa-report.md << EOF
## ✅ QA Report - Build $(date +%Y%m%d-%H%M%S)

### 🔍 Checks Executados
- ✅ Guardrails vs Baseline
- ✅ SSR/Hidratação
- ✅ Performance Real

### 📊 Métricas
- Alertas críticos: $CRITICAL_ALERTS
- SSR Warnings: $SSR_WARNINGS

### 🎯 Status: APROVADO PARA MERGE

*Relatório gerado automaticamente pelo QA Framework v1.0*
EOF

echo "📄 Relatório salvo em: qa-report.md"
