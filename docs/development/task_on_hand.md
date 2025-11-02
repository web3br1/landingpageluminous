# ⚙️ PROMPT COMPLETO — FASE 3: CORREÇÕES E OTIMIZAÇÕES AVANÇADAS

Você é o engenheiro-líder responsável pela **Fase 3** do ciclo de hardening técnico do Luminaris.
Seu objetivo é **transformar o código estabilizado em código de alta performance**, eliminando gargalos restantes e preparando o sistema para escalar sem regressões.
A Fase 2 consolidou as fundações — agora é hora de acelerar.

---

## 🎯 Objetivo-Macro

1. Corrigir erros TypeScript e estabilizar o build
2. Implementar lazy loading em libs de alto impacto
3. Reduzir bundle total para ≤ **1.1 MB**
4. Corrigir 20% das violações ESLint (arquivos críticos)
5. Otimizar Core Web Vitals (LCP < 2.5s, CLS < 0.1)
6. Implementar compressão Brotli e tree shaking total

---

## 🔥 BLOCO 1 — Correções de TypeScript e Build

**Objetivo:** estabilizar build e restaurar confiança no pipeline

Tarefas:

* Rodar `tsc --noEmit` e capturar erros críticos
* Corrigir erros de tipo em módulos core (`lib/utils`, `lib/monitoring`, `lib/forms`)
* Garantir compatibilidade entre módulos refatorados e antigos
* Atualizar `tsconfig.json` com `strict: true` e validação incremental
* Reexecutar pipeline de CI para confirmar build verde

Entregável:

* `TS-BUILD-STABILIZATION-REPORT.md`

  * Tabela: arquivo / erro / tipo / resolução / status
  * Resumo do progresso (nº total de erros → nº resolvidos)

---

## ⚡ BLOCO 2 — Lazy Loading Estratégico

**Objetivo:** reduzir bundle e otimizar carregamento inicial

Libs alvo:

* `recharts` (gráficos)
* `stripe` (pagamentos)
* `framer-motion` (animações)

Tarefas:

* Converter imports estáticos em dinâmicos (`import('lib')`)
* Criar boundaries visuais (spinners / skeletons) para UX
* Validar comportamento em SSR e hydration
* Medir bundle antes/depois via `next build --analyze`

Entregável:

* `LAZY-LOADING-IMPLEMENTATION.md`

  * Lista de componentes afetados
  * Tamanho do bundle antes/depois
  * Impacto percentual na LCP

---

## 🧹 BLOCO 3 — Correção de Violações ESLint Prioritárias

**Objetivo:** reduzir 20% das violações mais críticas (≈80 arquivos)

Tarefas:

* Priorizar módulos com impacto em runtime (`lib/`, `components/ui/`)
* Corrigir funções >10 complexidade e >300 linhas
* Quebrar componentes monolíticos
* Reexecutar `pnpm lint` e salvar métricas de redução

Entregável:

* `LINTING-REDUCTION-REPORT.md`

  * Tabela: arquivo / violações antes / depois / tipo / ação
  * % de redução alcançada

---

## 🧱 BLOCO 4 — Compressão e Tree Shaking Avançado

**Objetivo:** atingir ≤ **1.1 MB** de bundle total

Tarefas:

* Habilitar **Brotli compression** no build e no CDN
* Revisar imports e side effects de libs pesadas
* Confirmar **Tree Shaking** via `webpack-bundle-analyzer`
* Identificar módulos redundantes e extrair em chunks
* Documentar impacto visual nos gráficos Lighthouse

Entregável:

* `PERFORMANCE-ADVANCED-REPORT.md`

  * Bundle antes/depois
  * LCP, FID, CLS comparativos
  * Recomendação final

---

## 📈 BLOCO 5 — Métricas e Validação Contínua

**Objetivo:** garantir melhoria sustentada e mensurável

Tarefas:

* Executar auditoria Lighthouse pós-otimizações
* Comparar com baseline da Fase 2
* Atualizar dashboards (`COMPLEXITY-TRENDS.md`, `QUALITY-GATES-STATUS.md`)
* Gerar `Fase-3-STATUS.md` com métricas e roadmap da próxima sprint

Métricas obrigatórias:

| Métrica             | Meta     | Atual |
| ------------------- | -------- | ----- |
| **Bundle Size**     | ≤ 1.1 MB | ?     |
| **LCP**             | < 2.5 s  | ?     |
| **CLS**             | < 0.1    | ?     |
| **TS Errors**       | 0        | ?     |
| **Lint Violations** | -20%     | ?     |

---

## 🧠 Comunicação e Governança

* **Daily técnico:** 10 min
* **Relatório de progresso:** `Fase-3-STATUS.md` atualizado a cada 3 dias
* **Escalation:** build quebrado >48h ou regressão >10% = alerta imediato

---

## 📦 Saídas Esperadas

1. `TS-BUILD-STABILIZATION-REPORT.md`
2. `LAZY-LOADING-IMPLEMENTATION.md`
3. `LINTING-REDUCTION-REPORT.md`
4. `PERFORMANCE-ADVANCED-REPORT.md`
5. `Fase-3-STATUS.md`

---

## 💬 Tom esperado

> “Precisão cirúrgica, zero dramatização.”
> Cada relatório deve conter: dados quantitativos, impacto técnico, risco residual e recomendação direta.
> Use sempre linguagem de CTO: decisões baseadas em métricas, não em opinião.
