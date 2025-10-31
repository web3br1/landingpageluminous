# Relatório de Auditoria de Dependências - Fase 1

## Visão Geral
Análise identificou dependências não utilizadas, duplicadas e potencialmente problemáticas. Foco em reduzir bundle size e superfície de ataque.

## Dependências Não Utilizadas (Candidatas a Remoção)

### Pacotes Completamente Órfãos
Estes pacotes estão instalados mas não são importados em lugar nenhum:

| Pacote | Peso Estimado | Risco da Remoção | Recomendação |
|--------|---------------|------------------|--------------|
| `@vitest/ui` | ~50KB | **BAIXO** | Remover agora - só usado em config |
| `@next/bundle-analyzer` | ~30KB | **BAIXO** | Remover agora - análise de bundle não roda em produção |
| `husky` | ~20KB | **BAIXO** | Remover agora - hooks de git não necessários |
| `vercel` | ~40KB | **BAIXO** | Remover agora - deploy manual |
| `wait-on` | ~15KB | **BAIXO** | Remover agora - só usado em scripts de desenvolvimento |
| `cross-env` | ~10KB | **BAIXO** | Remover agora - compatibilidade Windows desnecessária |

### Pacotes com Uso Limitado
Estes são usados em poucos arquivos e podem ser substituídos:

| Pacote | Uso Atual | Peso Estimado | Risco da Remoção | Recomendação |
|--------|-----------|---------------|------------------|--------------|
| `@axe-core/playwright` | 2 arquivos de teste | ~80KB | **BAIXO** | Manter - necessário para testes de acessibilidade |
| `axe-core` | 1 arquivo de teste | ~60KB | **BAIXO** | Manter - complementa @axe-core/playwright |
| `msw` | 2 arquivos de mock | ~120KB | **MÉDIO** | Manter - necessário para testes de API |
| `testcontainers` | 1 arquivo de teste | ~90KB | **BAIXO** | Manter - testes de integração |
| `jest-axe` | 1 arquivo de teste | ~40KB | **BAIXO** | Manter - testes WCAG específicos |

## Dependências Pesadas no Bundle (>100KB)

### Pacotes que Impactam Runtime
Estes aparecem no bundle de produção e podem ser otimizados:

| Pacote | Tamanho no Bundle | Uso | Recomendação |
|--------|-------------------|-----|--------------|
| `framer-motion` | ~150KB | Animações em 50+ componentes | **Não remover** - crítico para UX |
| `recharts` | ~120KB | 1 dashboard admin | Lazy load dashboard |
| `lucide-react` | ~90KB | Ícones em 40+ componentes | Manter - tree-shaking ativo |
| `react-hook-form` | ~70KB | Formulários | Manter - necessário para validação |
| `@hookform/resolvers` | ~30KB | Resolvers Zod | Manter - integração necessária |
| `zod` | ~60KB | Validação em 20+ arquivos | Manter - type safety crítico |
| `clsx` + `tailwind-merge` | ~15KB | Utilitários CSS | Manter - muito leves |
| `js-cookie` | ~8KB | Feature flags | Manter - necessário |
| `plausible-tracker` | ~25KB | Analytics | Lazy load se possível |
| `stripe` | ~45KB | Pagamentos | Lazy load módulo de checkout |
| `dompurify` | ~20KB | Sanitização | Manter - segurança crítica |

## Dependências Duplicadas/Redundantes

### Radix UI Components
Muitos componentes Radix são importados individualmente. Podem ser consolidados:

```
@radix-ui/react-slot: 1 uso
@radix-ui/react-checkbox: 1 uso
@radix-ui/react-dialog: 2 usos
@radix-ui/react-label: 1 uso
@radix-ui/react-popover: 1 uso
@radix-ui/react-progress: 1 uso
@radix-ui/react-radio-group: 1 uso
@radix-ui/react-select: 1 uso
@radix-ui/react-separator: 1 uso
@radix-ui/react-switch: 1 uso
@radix-ui/react-tabs: 1 uso
@radix-ui/react-avatar: 1 uso
```

**Recomendação**: Manter individuais - tree-shaking funciona bem.

## Problemas de Bundle Identificados

### Build Warnings
- **Entrypoint size limit**: 1.45 MiB (main) e 1.6 MiB (layout) - acima do recomendado
- **Chunks grandes**: Vários chunks >100KB indicam falta de code splitting

### Otimizações Imediatas
1. **Lazy load dashboards admin** - recharts só carrega quando necessário
2. **Lazy load stripe** - só no checkout
3. **Lazy load framer-motion** - só componentes que realmente animam
4. **Remover dependências dev** do bundle de produção

## Estimativa de Redução

### Cenário Conservador (só remoções seguras)
- Remoção de dependências dev: **~165KB**
- Lazy loading recharts: **~80KB**
- Lazy loading stripe: **~30KB**
- **Total**: ~275KB redução no bundle

### Cenário Otimista (refatorações)
- Otimizações acima + code splitting melhor: **~500KB**
- Remoção de código morto identificado: **~100KB**
- **Total**: ~600KB redução (30% do bundle atual)

## Plano de Ação Recomendado

### Semana 1 (Risco Baixo - Remoções Seguras)
1. Remover `@vitest/ui`, `@next/bundle-analyzer`, `husky`, `vercel`, `wait-on`, `cross-env`
2. **Redução esperada**: 165KB + limpeza de node_modules

### Semana 2 (Lazy Loading)
1. Lazy load recharts no dashboard admin
2. Lazy load stripe no checkout
3. Lazy load framer-motion components pesados
4. **Redução esperada**: 200KB adicionais

### Semana 3 (Monitoramento)
1. Validar que remoções não quebraram nada
2. Medir impacto real no bundle
3. Ajustar estratégias se necessário

## Riscos e Mitigações

### Riscos de Remoção
- **Testes quebrados**: Mitigação - rodar suite completa antes de merge
- **Build falhando**: Mitigação - CI catch automaticamente
- **Funcionalidades perdidas**: Mitigação - grep por uso antes de remover

### Riscos de Lazy Loading
- **Carregamento lento**: Mitigação - preload crítico, loading states
- **Layout shift**: Mitigação - skeleton loaders, size hints
- **SEO impact**: Mitigação - server-side rendering para conteúdo crítico

## Critérios de Sucesso

- Bundle reduzido para < 1.2MB
- Zero dependências não utilizadas
- Lazy loading funcionando em dashboards e checkout
- Build time reduzido em 20%
- Zero regressões funcionais
