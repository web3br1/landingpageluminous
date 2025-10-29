# 📋 Política de Qualidade - QA Framework

## 🎯 Visão Geral

Esta política estabelece os padrões de qualidade para testes automatizados, garantindo que releases sejam **confiáveis, performáticos e mantíveis**. Ela transforma métricas técnicas em **contratos obrigatórios**, eliminando discussões caso a caso.

**Última atualização:** 26 de outubro de 2025
**Baseline atual:** v1.0 (qa-baseline/2025-10-26.json)

---

## 📊 Definições e Métricas

### Métricas Principais

| Métrica                           | Definição                                   | Baseline v1.0                    | Alerta           | Bloqueio         |
| --------------------------------- | ------------------------------------------- | -------------------------------- | ---------------- | ---------------- |
| **p95 E2E**                       | 95º percentil do tempo total de execução    | Chromium: ≤12s<br>Firefox: ≤+20% | ↑15% vs baseline | ↑25% vs baseline |
| **Coeficiente de Variação (CoV)** | Desvio padrão / média × 100                 | ≤15%                             | >18%             | >22%             |
| **Taxa de Flakes**                | % de testes que falham intermitentemente    | <1%                              | >2%              | >5%              |
| **SSR Warnings**                  | Avisos de hidratação em builds consecutivos | 0                                | >0               | >0               |
| **Lighthouse Score**              | Pontuação geral do Lighthouse               | ≥90                              | <85              | <80              |
| **Bundle Size**                   | Tamanho total do JavaScript                 | ≤500KB                           | >600KB           | >700KB           |
| **Visual Diffs**                  | Diferença máxima em screenshots             | ≤5%                              | >8%              | >12%             |

### Categorias de Falhas

- **🔴 Crítico**: Bloqueia merge, requer correção imediata
- **🟡 Alerta**: Não bloqueia, mas requer atenção/monitoramento
- **ℹ️ Info**: Observação, não impacta merge

---

## ✅ Requisitos Obrigatórios para Merge

### Pré-Merge (Developer)

**Todos os PRs devem passar estes checks:**

1. **✅ Testes Locais Verdes**
   - `npm run test` passa completamente
   - Nenhum teste skipped ou pending
   - Cobertura mantida (se aplicável)

2. **✅ Build Limpo**
   - `npm run build` sem erros
   - Zero warnings de SSR/hidratação
   - Bundle size dentro do orçamento

3. **✅ Linting e Type Safety**
   - ESLint sem erros
   - TypeScript strict mode OK
   - Arquitetural rules (dependency-cruiser) OK

### CI/CD Gates (Automáticos)

**Estes checks bloqueiam merge automaticamente:**

1. **🚫 Flake Rate > 1%**
   - Detectado por `flake-hunting.mjs`
   - Classificação por causa obrigatória

2. **🚫 p95 E2E Fora do Orçamento**
   - Chromium > 12s OU Firefox > +20% do Chromium
   - Baseline comparada automaticamente

3. **🚫 SSR/Hidratação Warnings**
   - 3 builds consecutivos sem warnings
   - Checklist de hidratação validado

4. **🚫 Lighthouse < 80**
   - Performance, acessibilidade, SEO, PWA
   - Orçamento definido por categoria

---

## 🚨 Sistema de Alertas e Responsabilidades

### Níveis de Alerta

| Nível          | Gatilho                                                                 | Ação Imediata                                                                  | Responsável            |
| -------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------- |
| **🔴 Crítico** | - Flake > 5%<br>- p95 > +25%<br>- SSR warnings > 0<br>- Lighthouse < 80 | - Bloquear merge<br>- Notificar time completo<br>- Criar issue crítica         | Engenheiro + QA Lead   |
| **🟡 Alerta**  | - Flake 2-5%<br>- p95 +15-25%<br>- Lighthouse 80-85<br>- Bundle > 600KB | - PR marcado para revisão<br>- Slack notification<br>- Monitorar próximos runs | Engenheiro responsável |
| **ℹ️ Info**    | - Pequenas variações<br>- Melhoria detectada<br>- Métricas estáveis     | - Log para histórico<br>- Baseline atualizada se melhoria                      | Automático             |

### Matriz de Responsabilidades por Tipo de Falha

| Tipo de Falha       | Sintomas                                    | Responsável Primário | Ação Esperada                         | Prazo   |
| ------------------- | ------------------------------------------- | -------------------- | ------------------------------------- | ------- |
| **Performance**     | p95 alto, LCP lento                         | Frontend Engineer    | Otimizar componentes, lazy loading    | 2 dias  |
| **Flake de Estado** | Elementos não encontrados, stale references | QA Engineer          | Melhorar seletores, adicionar waits   | 1 dia   |
| **Flake de Rede**   | Timeouts, connection refused                | DevOps               | Verificar mocks, infraestrutura       | 4 horas |
| **SSR/Hidratação**  | Warnings no build, client/server mismatch   | Fullstack Engineer   | Usar hooks apropriados, evitar window | 1 dia   |
| **Visual**          | Screenshots com diff alta                   | Design Engineer      | Congelar animações, padronizar fonts  | 2 dias  |
| **Bundle**          | Tamanho excedido                            | Frontend Engineer    | Code splitting, tree shaking          | 3 dias  |

---

## 🔄 Processos Operacionais

### Daily Standup (QA)

- Revisar alertas da noite anterior
- Atualizar status de correções em andamento
- Priorizar issues críticas

### Weekly Review (Toda segunda)

```bash
# Executar playbook completo
node scripts/7-day-playbook.mjs --weekly

# Comparar com baseline
node scripts/ci-guardrails.mjs

# Gerar relatório semanal
```

**Entregáveis:**

- Relatório de estabilidade semanal
- Atualização de baseline (se justificado)
- Plano de ação para issues pendentes

### Monthly Audit (Primeira segunda do mês)

- Revisar budgets (bundle size, thresholds visuais)
- Atualizar tooling (Playwright, Lighthouse)
- Auditar smells críticos
- Calibrar alertas baseado em dados históricos

---

## 🛠️ Ferramentas e Automação

### Scripts Disponíveis

| Script                            | Propósito           | Frequência  | Output                        |
| --------------------------------- | ------------------- | ----------- | ----------------------------- |
| `7-day-playbook.mjs`              | Validação completa  | Semanal     | KPIs finais + checklist PR    |
| `statistical-validation.mjs`      | Métricas p50/p95    | Por demanda | validation-results.json       |
| `flake-hunting.mjs`               | Análise de flakes   | Por demanda | flake-hunting-results.json    |
| `ssr-hydration-validation.mjs`    | SSR/hidratação      | Build time  | ssr-hydration-results.json    |
| `performance-real-validation.mjs` | Lighthouse + bundle | Deploy time | performance-real-results.json |
| `ci-guardrails.mjs`               | Alertas vs baseline | Todo push   | ci-guardrails.json            |
| `continuous-hygiene.mjs`          | Test smells         | PR time     | hygiene-results.json          |

### CI/CD Integration

```yaml
# .github/workflows/qa-gates.yml
name: QA Gates
on: [pull_request]

jobs:
  qa-gates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - name: Install dependencies
        run: npm ci

      - name: Run QA Policy Checks
        run: |
          node scripts/ci-guardrails.mjs
          node scripts/ssr-hydration-validation.mjs

      - name: Fail on Critical Issues
        run: |
          if [ $(jq '.summary.criticalAlerts' ci-guardrails.json) -gt 0 ]; then
            echo "🚫 CRITICAL ISSUES DETECTED - MERGE BLOCKED"
            exit 1
          fi
```

---

## 📈 Baseline Management

### Atualização de Baseline

**Quando atualizar:**

- Melhoria intencional justificada (ex.: otimização de performance)
- Mudança no ambiente de teste (browsers, infraestrutura)
- Novos requisitos de negócio

**Como atualizar:**

1. Executar playbook completo 3x
2. Validar melhoria é consistente
3. Criar PR com novos valores
4. Aprovação do QA Lead necessária

### Histórico de Baselines

| Versão | Data       | Principais Mudanças              | Responsável  |
| ------ | ---------- | -------------------------------- | ------------ |
| v1.0   | 2025-10-26 | Baseline inicial pós-otimizações | QA Framework |
| v0.9   | 2025-10-25 | Pré-otimizações                  | -            |

---

## 🚫 Violações e Escalonamento

### Processo de Violação

1. **Detecção**: CI falha ou alerta dispara
2. **Notificação**: Slack/Discord automático
3. **Análise**: 1 hora para classificar severidade
4. **Correção**: Prazo baseado na matriz acima
5. **Follow-up**: Verificação em próximo run

### Penalidades Acumuladas

- **1ª violação**: Aviso formal + retrabalho
- **2ª violação**: Revisão obrigatória do PR
- **3ª violação**: Suspensão temporária de merge rights

---

## 📚 Referências e Documentação

### Documentos Relacionados

- `CHANGELOG.md` - Histórico de mudanças nas métricas
- `qa-baseline/` - Baselines versionadas
- `scripts/` - Automação completa

### Contatos

- **QA Lead**: [Nome/Slack]
- **DevOps**: [Nome/Slack]
- **Tech Lead**: [Nome/Slack]

### Atualizações desta Política

- Requer aprovação unânime do squad
- Entrada em vigor após 1 semana de socialização
- Versionada semanticamente (MAJOR.MINOR.PATCH)

---

## ✅ Checklist de Adesão

**Para PRs:**

- [ ] Testes locais verdes
- [ ] Build sem warnings
- [ ] CI gates passaram
- [ ] Métricas dentro do orçamento

**Para Deploys:**

- [ ] Playbook semanal executado
- [ ] Baseline atualizada se necessário
- [ ] Alertas resolvidos

**Para Releases:**

- [ ] Audit trimestral realizado
- [ ] Tooling atualizado
- [ ] Documentação revisada

---

_Esta política garante que qualidade não seja "opcional" — ela é **obrigatória, mensurável e automatizada**. Qualidade vira **vantagem competitiva**, não gargalo._

📅 **Próxima revisão:** Dezembro 2025
