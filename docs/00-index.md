# 🌟 Luminaris — Landing Page SaaS

> Sistema de landing page SaaS completo e profissional construído com Next.js, TypeScript e Tailwind CSS.
> Arquitetura composition-first, sistema TDD Quality integrado e foco em performance e conversão.

## 📋 Visão Geral

**Produto**: Landing page para produto SaaS de business intelligence (DataFlow).
**Objetivo**: Converter visitantes em leads qualificados através de demonstração gratuita.
**Persona**: Gestor de PME no varejo (35-55 anos, busca automação de relatórios).

### 🎯 Métricas de Sucesso
- **LCP**: ≤ 2.5s
- **CLS**: ≤ 0.1
- **INP**: ≤ 200ms
- **Taxa de conversão**: ≥ 3%
- **Lighthouse**: ≥ 95

## 🧩 Estrutura do Projeto

```
├── app/                    # Next.js App Router
│   ├── (marketing)/       # Landing page routes
│   ├── (product)/         # Product pages
│   └── api/               # API routes
├── components/            # React components
│   ├── sections/         # Landing sections
│   └── ui/               # UI primitives
├── domains/              # Business domains
│   └── marketing/        # Marketing content & composers
├── lib/                  # Business logic & utilities
├── tools/tdd/           # TDD Quality System
├── docs/                # Documentação técnica
├── .cursorrules         # Regras do agente Cursor
├── dev.ps1              # Scripts PowerShell
├── dev.cmd              # Scripts CMD
└── tests/               # Test suites
```

## 🚀 Comandos Principais

### Desenvolvimento
```bash
# Setup completo
.\dev.ps1 -Command setup

# Servidor de desenvolvimento
.\dev.ps1 -Command dev

# Verificações de qualidade
.\dev.ps1 -Command check
```

### Taskmaster (Gerenciamento de Tarefas)
```bash
# Listar tarefas
taskmaster list

# Executar tarefa específica
taskmaster show 1

# Parse PRD para tarefas
taskmaster parse-prd path/to/prd.txt
```

### Qualidade e Build
```bash
# Build de produção
pnpm build

# Análise TDD completa
pnpm run tdd:analyze

# Gates de qualidade
pnpm run ci:tdd-gate
```

## 🎨 Arquitetura Técnica

### Stack Principal
- **Framework**: Next.js 15 (App Router)
- **Linguagem**: TypeScript strict
- **Styling**: Tailwind CSS + Design System
- **Animações**: Framer Motion
- **Formulários**: React Hook Form + Zod
- **Testes**: Vitest + Playwright + Testing Library

### Padrões de Arquitetura
- **Composition-First**: Conteúdo separado de apresentação
- **Design System Unificado**: Single source of truth para tokens
- **TDD Quality System**: Gates automáticos em PRs
- **Performance Budget**: LCP ≤ 2.5s, JS ≤ 70KB

## 📚 Documentação Técnica

### Guias Essenciais
- **[Arquitetura](./architecture.md)** - Estrutura técnica e padrões
- **[Qualidade](./quality.md)** - Checklist de qualidade e CI
- **[BDD e Testes](./bdd.md)** - Guia de escrita de cenários
- **[Vocabulário](./vocabulario.md)** - Termos do domínio (DDD)

### Desenvolvimento
- **[Workflow Rails + IA](./development/rails-ai-workflow.md)** - Desenvolvimento com Cursor
- **[Playbook Operacional](./development/rails-workflow-playbook.md)** - Setup e execução
- **[Regras do Cursor](../.cursorrules)** - Padrões obrigatórios

### Referência
- **[Comandos CLI](./COMMANDS.md)** - Central de comandos
- **[Troubleshooting](./troubleshooting.md)** - Problemas comuns
- **[Mapa de Contexto](./.cursor_context_map.md)** - Navegação rápida

### Histórico
- **[ADR](./ADR/)** - Decisões arquiteturais
- **[Development Log](./ADR/logs/development_log.md)** - Log de desenvolvimento
- **[Changelog](./ADR/logs/changelog.md)** - Mudanças do projeto

## 🎯 Contextos Ativos

### Marketing (Principal)
- **Domínio**: `domains/marketing/`
- **Propósito**: Gerenciar conteúdo e composição da landing page
- **Composers**: Hero, Benefits, Pricing, FAQ
- **Documentação**: `domains/marketing/README.md`

## 🔒 Segurança e Qualidade

- **CSP**: Configurado e validado
- **Input sanitization**: Implementado em formulários
- **Rate limiting**: Configurado em APIs
- **TypeScript strict**: Aplicado em todo projeto
- **400+ testes**: Suite automatizada completa

## 🤝 Contribuição

1. Leia os **[guias de desenvolvimento](./development/)**
2. Siga as **[regras do Cursor](../.cursorrules)**
3. Use o **[Taskmaster](./development/rails-workflow-playbook.md)** para tarefas
4. Execute **`.\dev.ps1 -Command check`** antes de commit
5. Mantenha **[documentação atualizada](./ADR/logs/development_log.md)**

---

**Feito com ❤️ para converter visitantes em clientes**
