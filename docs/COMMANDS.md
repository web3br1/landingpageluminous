# 🧮 Comandos CLI - Landing Page SaaS

> Central de comandos para desenvolvimento, testes e operações.
> Comandos organizados por categoria com exemplos práticos.

## 📋 Visão Geral

Esta documentação centraliza todos os comandos disponíveis no projeto Luminaris, organizados por categoria e com exemplos de uso. Inclui variações para diferentes sistemas operacionais quando necessário.

## 🚀 Desenvolvimento

### Servidor de Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento (Next.js)
pnpm dev

# Com porta específica
pnpm dev -p 3001

# Com host específico (para acesso externo)
pnpm dev -H 0.0.0.0
```

**Scripts PowerShell (Windows)**:
```powershell
.\dev.ps1 -Command dev
```

### Build e Produção

```bash
# Build de produção
pnpm build

# Build com análise de bundle
pnpm build --analyze

# Preview do build de produção
pnpm start

# Build sem cache (debug)
rm -rf .next && pnpm build
```

**Scripts PowerShell**:
```powershell
.\dev.ps1 -Command build
```

### Setup e Dependências

```bash
# Instalar dependências
pnpm install

# Instalar dependências (modo frozen lockfile)
pnpm install --frozen-lockfile

# Atualizar dependências
pnpm update

# Limpar cache e node_modules
rm -rf node_modules .next pnpm-lock.yaml
pnpm install
```

**Scripts PowerShell**:
```powershell
.\dev.ps1 -Command setup    # Instala e verifica
.\dev.ps1 -Command clean    # Limpa caches
.\dev.ps1 -Command deps     # Atualiza dependências
```

## 🧪 Testes e Qualidade

### Testes Unitários

```bash
# Executar todos os testes unitários
pnpm test:unit

# Executar testes específicos
pnpm test src/components/Button.test.tsx

# Executar testes com watch mode
pnpm test:unit --watch

# Executar testes com coverage
pnpm test:unit --coverage
```

### Testes de Integração

```bash
# Executar testes de integração
pnpm test:integration

# Com coverage
pnpm test:integration --coverage
```

### Testes Contratuais

```bash
# Executar testes contratuais
pnpm test:contract

# Apenas schemas Zod
pnpm test:contract --grep "schema"
```

### Testes E2E (Playwright)

```bash
# Executar testes E2E
pnpm test:e2e

# Com UI mode (visual)
pnpm test:e2e --ui

# Apenas testes específicos
pnpm test:e2e --grep "landing page"

# Debug mode
pnpm test:e2e --debug
```

### Suite Completa de Testes

```bash
# Todos os testes
pnpm test

# Com coverage completo
pnpm test --coverage

# Apenas testes rápidos (sem E2E)
pnpm test:quick
```

## ✅ Verificações de Qualidade

### TypeScript

```bash
# Verificar tipos
pnpm typecheck

# Com saída detalhada
pnpm typecheck --noEmit

# Build type-check only
pnpm build --dry-run
```

### Linting

```bash
# Executar ESLint
pnpm lint

# Corrigir automaticamente
pnpm lint:fix

# Com saída detalhada
pnpm lint --format codeframe
```

### Qualidade Completa

```bash
# Quality gate completo
pnpm run ci:tdd-gate

# Verificações rápidas
pnpm run ci:quick-gate

# Com relatório detalhado
pnpm run ci:tdd-gate --report
```

**Scripts PowerShell**:
```powershell
.\dev.ps1 -Command check  # Verificações rápidas
```

## 📊 Análise e Relatórios

### Análise de Dependências

```bash
# Verificar dependências
pnpm ls

# Analisar dependências (dependency-cruiser)
pnpm run depcruise

# Verificar dependências órfãs (knip)
pnpm run knip
```

### Métricas de Qualidade

```bash
# Análise TDD completa
pnpm run tdd:analyze

# Relatório de maturidade
pnpm run tdd:maturity

# Dashboard de qualidade
pnpm run tdd:dashboard
```

### Performance

```bash
# Análise de bundle
pnpm build --analyze

# Lighthouse local
pnpm lighthouse http://localhost:3000

# Performance check
pnpm run perf:check
```

## 🔒 Segurança

### Security Scan

```bash
# Verificar vulnerabilidades
pnpm audit

# Corrigir automaticamente
pnpm audit fix

# Scan detalhado
pnpm audit --audit-level moderate
```

### CSP e Headers

```bash
# Verificar CSP
pnpm run csp:check

# Testar headers de segurança
pnpm run security:headers
```

## 🎨 Assets e Otimização

### Imagens

```bash
# Otimizar imagens
pnpm run optimize:images

# Converter formatos
pnpm run images:convert

# Gerar placeholders
pnpm run images:placeholders
```

### CSS e Styles

```bash
# Verificar CSS
pnpm run css:check

# Otimizar CSS
pnpm run css:optimize

# Analisar bundle CSS
pnpm run css:analyze
```

## 🚀 Deployment e CI/CD

### Local Deployment

```bash
# Deploy local
pnpm run deploy:local

# Preview de produção
pnpm run preview
```

### Vercel

```bash
# Deploy para Vercel
vercel --prod

# Deploy preview
vercel

# Logs do deployment
vercel logs
```

### Ambiente

```bash
# Verificar variáveis de ambiente
pnpm run env:check

# Validar configuração
pnpm run config:validate
```

## 🛠️ Ferramentas de Desenvolvimento

### Database (se aplicável)

```bash
# Migrar database
pnpm run db:migrate

# Seed de dados
pnpm run db:seed

# Reset database
pnpm run db:reset
```

### API e Backends

```bash
# Verificar APIs
pnpm run api:check

# Testar endpoints
pnpm run api:test

# Documentação da API
pnpm run api:docs
```

### Git e Versionamento

```bash
# Verificar status
git status

# Commit com conventional commits
pnpm run commit

# Release automático
pnpm run release

# Changelog
pnpm run changelog
```

## 📱 Acessibilidade e UX

### Acessibilidade

```bash
# Verificar acessibilidade
pnpm run a11y:check

# Teste de contraste
pnpm run a11y:contrast

# Navegação por teclado
pnpm run a11y:keyboard
```

### UX e Performance

```bash
# Teste de usabilidade
pnpm run ux:test

# Análise de jornada
pnpm run ux:journey

# Heatmaps (se integrado)
pnpm run ux:heatmap
```

## 🔧 Manutenção e Utilitários

### Limpeza

```bash
# Limpar caches
pnpm run clean

# Limpar completamente
pnpm run clean:all

# Reset do projeto
pnpm run reset
```

**Scripts PowerShell**:
```powershell
.\dev.ps1 -Command clean
```

### Logs e Debug

```bash
# Ver logs da aplicação
pnpm run logs

# Debug mode
DEBUG=* pnpm dev

# Verbose output
pnpm run verbose
```

### Backup e Restore

```bash
# Backup de configurações
pnpm run backup:config

# Restore de configurações
pnpm run restore:config
```

## 📊 Scripts Personalizados

### Scripts PowerShell (Windows)

```powershell
# Setup completo
.\dev.ps1 -Command setup

# Desenvolvimento
.\dev.ps1 -Command dev

# Verificações
.\dev.ps1 -Command check

# Limpeza
.\dev.ps1 -Command clean

# Build
.\dev.ps1 -Command build
```

### Scripts CMD (Windows alternativo)

```cmd
REM Setup
dev.cmd setup

REM Desenvolvimento
dev.cmd dev

REM Verificações
dev.cmd check

REM Limpeza
dev.cmd clean
```

## 🎯 Comandos por Contexto

### Desenvolvimento Diário

```bash
# Início do dia
pnpm install && pnpm dev

# Durante desenvolvimento
pnpm typecheck && pnpm lint

# Antes de commit
pnpm test:unit && pnpm lint:fix
```

### Pre-deployment

```bash
# Verificações completas
pnpm run ci:tdd-gate

# Build final
pnpm build

# Testes E2E
pnpm test:e2e
```

### Troubleshooting

```bash
# Problemas de build
rm -rf .next node_modules && pnpm install && pnpm build

# Problemas de cache
pnpm run clean && pnpm install

# Problemas de tipos
pnpm typecheck --noEmit
```

## 🔍 Busca Rápida de Comandos

| O que quero fazer | Comando |
|-------------------|---------|
| Iniciar desenvolvimento | `pnpm dev` |
| Executar todos os testes | `pnpm test` |
| Build de produção | `pnpm build` |
| Verificar qualidade | `pnpm run ci:tdd-gate` |
| Limpar projeto | `pnpm run clean` |
| Verificar tipos | `pnpm typecheck` |
| Lint + correção | `pnpm lint:fix` |
| Análise de bundle | `pnpm build --analyze` |
| Setup completo | `.\dev.ps1 -Command setup` |

---

## 📚 Referências

- **[00-index.md](./00-index.md)** - Visão geral do projeto
- **[quality.md](./quality.md)** - Gates de qualidade detalhados
- **[bdd.md](./bdd.md)** - Testes e cenários
- **[troubleshooting.md](./troubleshooting.md)** - Resolução de problemas
- **[architecture.md](./architecture.md)** - Estrutura técnica
