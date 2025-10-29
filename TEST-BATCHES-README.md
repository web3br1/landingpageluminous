# 🎭 Sistema de Lotes de Testes - Landing Page SaaS

Sistema inteligente de execução de testes em lotes para otimização de tempo e recursos de CI/CD.

## 📋 Visão Geral

Este sistema organiza todos os testes em **lotes estratégicos** com execução paralela/sequencial inteligente, cache baseado em mudanças de arquivos e relatórios consolidados.

### 🏗️ Arquitetura

```
🎯 Estratégias de Execução
├── 🚀 FAST DEV (desenvolvimento rápido)
├── 🏗️ CI BASIC (CI básico)
├── 🎯 FULL RELEASE (release completo)
├── 🚨 CRITICAL ONLY (apenas críticos)
├── 🎨 UI CHANGES (mudanças de UI)
└── ⚡ PERFORMANCE (performance)

📦 Lotes Organizados
├── 🔬 Vitest (Unitários/Componentes)
│   ├── Unit Tests
│   ├── Components
│   ├── Lib Utils
│   ├── DOM Tests
│   ├── Utils Advanced
│   ├── Integration
│   ├── Browser Compat
│   ├── SSR Tests
│   ├── Accessibility
│   └── Hydration
└── 🎭 Playwright (E2E)
    ├── Core/Critical
    ├── Landing Page
    ├── A11y E2E
    ├── Performance
    ├── Visual Regression
    └── Critical Flows
```

## 🚀 Uso Rápido

### Estratégias Recomendadas

```bash
# Desenvolvimento rápido (testes essenciais)
npm run test:batches:fast

# CI básico (suite completa)
npm run test:batches:ci

# Release completo (todos os testes)
npm run test:batches:full

# Apenas testes críticos
npm run test:batches:critical

# Mudanças de UI
npm run test:batches:ui

# Performance
npm run test:batches:perf
```

### Com Relatórios

```bash
# Estratégia + relatório no terminal
npm run test:batches:fast:report

# Estratégia + relatório salvo em arquivo
npm run test:batches:ci:report
```

## 📊 Funcionalidades

### ⚡ Cache Inteligente

- **Baseado em mudanças**: Pula lotes quando arquivos relevantes não mudaram
- **Hash de arquivos**: Detecta mudanças reais no conteúdo
- **Desabilitado em CI**: Garante execução completa em ambiente de CI

```bash
# Ver estatísticas do cache
npm run test:cache:stats

# Limpar cache
npm run test:cache:clear

# Verificar se lote deve executar
npm run test:cache:check vitest:unit
```

### 📈 Relatórios Consolidados

- **Métricas unificadas**: Vitest + Playwright em um relatório
- **Taxas de sucesso**: Por lote e geral
- **Tempos de execução**: Análise detalhada de performance

```bash
# Ver relatório no terminal
npm run test:report

# Salvar relatório em arquivo
npm run test:report:save

# Verificar se há falhas (código de saída)
npm run test:report:check
```

### 🎯 Lotes Individuais

#### Vitest (Unitários/Componentes)

```bash
npm run test:vitest:unit         # Testes unitários básicos
npm run test:vitest:components   # Testes de componentes React
npm run test:vitest:lib          # Utilitários da lib
npm run test:vitest:dom          # Manipulação DOM
npm run test:vitest:utils        # Utilitários avançados
npm run test:vitest:integration  # Integração
npm run test:vitest:browser      # Compatibilidade browser
npm run test:vitest:ssr          # Server-side rendering
npm run test:vitest:a11y         # Acessibilidade
npm run test:vitest:hydration    # Hidratação
```

#### Playwright (E2E)

```bash
npm run test:playwright:core         # Core/críticos
npm run test:playwright:landing      # Landing page
npm run test:playwright:accessibility # A11y E2E
npm run test:playwright:performance  # Performance
npm run test:playwright:visual       # Regressão visual
npm run test:playwright:critical-flows # Fluxos críticos
```

## 🔧 Configuração Avançada

### Estratégias Customizadas

```javascript
// Em scripts/run-test-batches.js
const STRATEGIES = {
  "minha-estrategia": {
    name: "🎯 Minha Estratégia",
    batches: ["vitest:unit", "vitest:components", "playwright:core-critical"],
    parallel: true,
    maxWorkers: 3,
    description: "Meus testes favoritos",
  },
};
```

### Cache Customizado

```javascript
// Adicionar dependências customizadas em test-cache-manager.js
getBatchDependencies() {
  return {
    'meu-lote': [
      'src/minha-feature/**/*.ts',
      'tests/minha-feature/**/*.test.ts'
    ]
  }
}
```

## 📊 Estratégias de Otimização

### 🚀 Desenvolvimento Rápido

- **Objetivo**: Feedback rápido durante desenvolvimento
- **Lotes**: Unit, Components, Hydration, Core Critical, Landing Page
- **Tempo estimado**: ~3-5 minutos
- **Workers**: 3 (paralelo)

### 🏗️ CI Básico

- **Objetivo**: Cobertura essencial para merge/confiança
- **Lotes**: Todos os críticos + essenciais
- **Tempo estimado**: ~10-15 minutos
- **Workers**: 4 (paralelo)

### 🎯 Release Completo

- **Objetivo**: Cobertura total antes de produção
- **Lotes**: Todos os lotes disponíveis
- **Tempo estimado**: ~45-60 minutos
- **Workers**: 6 (paralelo)

### 🚨 Apenas Críticos

- **Objetivo**: Verificação rápida de funcionalidades críticas
- **Lotes**: SSR, A11y, Hydration, Core Critical, Landing Page
- **Tempo estimado**: ~5-8 minutos
- **Workers**: 4 (paralelo)

## 🎨 Características dos Lotes

### 🔬 Vitest (Unitários/Componentes)

| Lote        | Tempo   | Paralelo | Crítico | Descrição                |
| ----------- | ------- | -------- | ------- | ------------------------ |
| Unit        | ~10-15s | ✅       | ✅      | Testes unitários básicos |
| Components  | ~20-30s | ✅       | ✅      | Componentes React        |
| Lib         | ~10-15s | ✅       | ❌      | Utilitários da lib       |
| DOM         | ~5-10s  | ✅       | ❌      | Manipulação DOM          |
| Utils       | ~15-20s | ✅       | ❌      | Utilitários avançados    |
| Integration | ~20-30s | ✅       | ❌      | Testes de integração     |
| Browser     | ~10-15s | ✅       | ❌      | Compatibilidade browser  |
| SSR         | ~30-45s | ❌       | ✅      | Server-side rendering    |
| A11y        | ~2-3min | ❌       | ✅      | Acessibilidade           |
| Hydration   | ~1-2min | ❌       | ✅      | Hidratação               |

### 🎭 Playwright (E2E)

| Lote              | Tempo    | Paralelo | Crítico | Descrição            |
| ----------------- | -------- | -------- | ------- | -------------------- |
| Core/Critical     | ~30s     | ✅       | ✅      | Funcionamento básico |
| Landing Page      | ~2-3min  | ✅       | ✅      | Página principal     |
| A11y E2E          | ~4-5min  | ✅       | ✅      | Acessibilidade E2E   |
| Performance       | ~6-8min  | ❌       | ❌      | Core Web Vitals      |
| Visual Regression | ~5-7min  | ❌       | ❌      | Regressão visual     |
| Critical Flows    | ~8-10min | ✅       | ✅      | Fluxos críticos      |

## 🔍 Troubleshooting

### Cache não está funcionando

```bash
# Limpar cache
npm run test:cache:clear

# Executar sem cache
npm run test:batches:fast -- --no-cache
```

### Relatório vazio

```bash
# Verificar se testes geraram reports
ls test-results/

# Executar com geração de reports
npm run test:batches:fast:report
```

### Lotes lentos demais

```bash
# Verificar paralelização
node scripts/run-test-batches.js strategies

# Executar lote específico
npm run test:vitest:unit
```

## 📈 Métricas e Monitoramento

### Performance por Lote

O sistema rastreia automaticamente:

- Tempo de execução por lote
- Taxa de sucesso
- Testes pulados por cache
- Economia de tempo

### Relatórios de CI

```bash
# Relatório detalhado para CI
npm run test:batches:ci:report

# Verificação de falhas
npm run test:report:check
```

## 🚀 Próximos Passos

- [ ] Integração com ferramentas de CI/CD
- [ ] Métricas históricas de performance
- [ ] Otimização automática de workers
- [ ] Alertas para regressões de performance
- [ ] Integração com dashboards de qualidade

---

**Mantra**: _Testes organizados = Desenvolvimento confiante = Lançamentos seguros_ 🎯
