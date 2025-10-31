# Alvos de Simplificação - Fase 1

## Visão Geral
Auditoria identificou 20 arquivos com mais de 700 linhas cada. Muitos contêm sistemas de ML/heurística complexos que misturam domínios críticos (performance, lazy loading, regras adaptativas).

## Arquivos Prioritários (ALTA - Impactam Produção)

| Arquivo | Linhas | Risco | Impacto | Prioridade | Ação Recomendada |
|---------|--------|-------|---------|------------|-------------------|
| `lib/lazy-loading/core/adaptive-rule-manager.ts` | 730 | **CRÍTICO** | Sistema de regras ML em produção pode quebrar carregamento dinâmico | ALTA | Quebrar em 3 módulos: RuleEngine (core), ContextEvaluator (performance), ActionExecutor (runtime) |
| `lib/lazy-loading/core/dynamic-threshold-manager.ts` | 570 | **CRÍTICO** | Reinforcement learning para thresholds pode causar layout shifts infinitos | ALTA | Simplificar para 2-3 thresholds fixos com A/B testing |
| `lib/lazy-loading/core/resource-pool-manager.ts` | 991 | **CRÍTICO** | Pool management com heurística complexa pode causar memory leaks | ALTA | Extrair para serviço separado com circuit breaker simples |

## Arquivos de Médio Risco (MÉDIO - Ferramentas CI)

| Arquivo | Linhas | Risco | Impacto | Prioridade | Ação Recomendada |
|---------|--------|-------|---------|------------|-------------------|
| `lib/monitoring/smart-alerts.ts` | 884 | **ALTO** | Alertas inteligentes podem gerar falsos positivos | MÉDIO | Simplificar para regras baseadas em thresholds fixos |
| `lib/analytics/advanced-analytics.ts` | 863 | **ALTO** | Analytics complexo pode impactar performance do cliente | MÉDIO | Extrair cálculos pesados para worker thread |
| `tests/performance/performance-monitoring.spec.ts` | 941 | **MÉDIO** | Testes de performance podem ser flaky | MÉDIO | Quebrar em testes unitários menores e isolados |

## Arquivos de Baixo Risco (BAIXO - Utilitários Internos)

| Arquivo | Linhas | Risco | Impacto | Prioridade | Ação Recomendada |
|---------|--------|-------|---------|------------|-------------------|
| `lib/utils/advanced-utils.ts` | 819 | **ALTO** | Utils genéricos podem ter código morto | BAIXO | Auditar uso real vs declarado |
| `lib/lazy-loading/core/concept-drift-detector.ts` | 856 | **ALTO** | Detector de drift pode ser overkill | BAIXO | Avaliar se é necessário ou pode ser removido |
| `lib/lazy-loading/core/graceful-degradation-manager.ts` | 829 | **ALTO** | Degradação graciosa complexa demais | BAIXO | Simplificar para fallbacks estáticos |
| `tests/css-integration.test.tsx` | 825 | **MÉDIO** | Testes de CSS integration podem ser lentos | BAIXO | Migrar para testes visuais mais rápidos |
| `lib/lazy-loading/core/predictive-alerting-system.ts` | 806 | **ALTO** | Sistema preditivo pode ser impreciso | BAIXO | Substituir por alertas baseados em regras simples |
| `lib/lazy-loading/core/adaptive-rate-limiter.ts` | 790 | **ALTO** | Rate limiter adaptativo complexo | BAIXO | Usar rate limiter fixo com circuit breaker |
| `lib/accessibility/accessibility-manager.tsx` | 789 | **ALTO** | Manager de acessibilidade pode conflitar com libs | BAIXO | Integrar diretamente nas seções ao invés de global |
| `lib/performance/performance-monitor.tsx` | 788 | **ALTO** | Monitor de performance pode impactar runtime | BAIXO | Lazy load apenas quando necessário |
| `components/analytics/advanced-analytics-dashboard.tsx` | 767 | **MÉDIO** | Dashboard complexo pode ser lento | BAIXO | Simplificar visualização |
| `tests/sections.test.tsx` | 759 | **MÉDIO** | Testes de seções podem ser flaky | BAIXO | Quebrar em testes unitários menores |
| `lib/monitoring/real-user-monitoring.ts` | 746 | **ALTO** | RUM pode impactar performance do usuário | BAIXO | Sampling mais conservador |
| `lib/composition/performance/lazy-loading-policy.ts` | 1050 | **ALTO** | Política de lazy loading complexa | BAIXO | Políticas mais simples baseadas em viewport |
| `lib/composition/performance/route-based-lazy-loading.tsx` | 1126 | **ALTO** | Lazy loading por rota muito complexo | BAIXO | Lazy loading padrão do Next.js |
| `lib/composition/section-renderer.complex.backup.tsx` | 1059 | **BAIXO** | Backup file - código morto | BAIXO | Remover arquivos .backup |
| `lib/composition/performance/lazy-loading-policy.complex.backup.ts` | 1050 | **BAIXO** | Backup file - código morto | BAIXO | Remover arquivos .backup |
| `lib/theme/theme-registry.complex.backup.ts` | - | **BAIXO** | Backup file - código morto | BAIXO | Remover arquivos .backup |
| `lib/composition/performance/route-based-lazy-loading.complex.backup.tsx` | 1126 | **BAIXO** | Backup file - código morto | BAIXO | Remover arquivos .backup |
| `html/assets/index-DOkKC3NI.js` | 41066 | **MÉDIO** | Bundle JavaScript muito grande | MÉDIO | Otimizar imports e tree-shaking |

## Resumo de Severidade

- **CRÍTICO (3 arquivos)**: Sistemas ML/heurística que rodam em produção
- **ALTO (12 arquivos)**: Lógica complexa que pode impactar performance/estabilidade
- **MÉDIO (4 arquivos)**: Testes e tooling que podem ser flaky
- **BAIXO (1 arquivo)**: Código morto a ser removido

## Plano de Ação Recomendado

1. **Semanas 1-2**: Resolver arquivos CRÍTICOS (adaptive-rule-manager, dynamic-threshold-manager, resource-pool-manager)
2. **Semanas 3-4**: Resolver arquivos ALTO relacionados a lazy loading
3. **Semanas 5-6**: Limpeza geral e remoção de código morto

## Critérios de Sucesso

- Redução de 50% nas linhas de código dos arquivos críticos
- Eliminação de sistemas ML/heurística complexos
- Bundle JavaScript reduzido para < 1.2MB
- Zero arquivos .backup no repositório
