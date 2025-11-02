# 🧰 Troubleshooting - Landing Page SaaS

> Guia rápido de diagnóstico e resolução de problemas comuns.
> Problemas frequentes e soluções testadas no desenvolvimento.

## 🚀 Problemas de Setup/Inicialização

### "pnpm install" falha com erro de resolução

**Sintomas**:
```
ERR_PNPM_FETCH_404 GET https://registry.npmjs.org/@scope/package/-/package-1.0.0.tgz
```

**Causas possíveis**:
- Cache do pnpm corrompido
- Versão do Node.js incompatível
- Problemas de rede/registry

**Soluções**:

```bash
# 1. Limpar cache e reinstalar
pnpm store prune
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 2. Verificar versão do Node.js
node --version  # Deve ser 18+ ou 20+

# 3. Usar registry alternativo (se necessário)
pnpm install --registry https://registry.npmmirror.com

# 4. Para conflitos de dependências
pnpm install --ignore-scripts
```

### Erro de build do Next.js

**Sintomas**:
```
Module not found: Can't resolve 'package-name'
```

**Causas possíveis**:
- Dependência faltando
- Versão incompatível
- Problemas de resolução de módulos

**Soluções**:

```bash
# 1. Verificar dependências
pnpm ls package-name

# 2. Reinstalar dependências
rm -rf node_modules .next
pnpm install

# 3. Verificar versões conflitantes
pnpm why package-name

# 4. Build limpo
pnpm build --no-cache
```

### Porta 3000 já está em uso

**Sintomas**:
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Soluções**:

```bash
# 1. Matar processo na porta 3000
# Windows PowerShell:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/macOS:
lsof -ti:3000 | xargs kill -9

# 2. Usar porta diferente
pnpm dev -p 3001

# 3. Verificar processos Node rodando
# Windows:
tasklist | findstr node

# Linux/macOS:
ps aux | grep node
```

## 🧪 Problemas de Testes

### Testes não executam

**Sintomas**:
```
No test files found
```

**Causas possíveis**:
- Arquivos de teste não encontrados
- Padrões de nome incorretos
- Configuração do Vitest errada

**Soluções**:

```bash
# 1. Verificar estrutura de arquivos
find . -name "*.test.ts" -o -name "*.spec.ts"

# 2. Executar testes específicos
pnpm test src/components/Button.test.tsx

# 3. Verificar configuração do Vitest
cat vitest.config.ts

# 4. Executar com debug
pnpm test --reporter verbose
```

### Testes de E2E falham no CI

**Sintomas**:
```
browserType.launch: Executable doesn't exist
```

**Causas possíveis**:
- Browsers do Playwright não instalados no CI
- Configuração de CI incompleta

**Soluções**:

```yaml
# Adicionar ao workflow do GitHub Actions
- name: Install Playwright browsers
  run: pnpm exec playwright install --with-deps

# Ou instalar manualmente
- name: Setup Playwright
  run: |
    pnpm exec playwright install chromium
    pnpm exec playwright install-deps
```

### Coverage baixa ou inconsistente

**Sintomas**:
```
Coverage report shows unexpected results
```

**Causas possíveis**:
- Arquivos não incluídos corretamente
- Configuração de coverage errada
- Imports dinâmicos não cobertos

**Soluções**:

```typescript
// vitest.config.ts - Verificar configuração
export default defineConfig({
  test: {
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/__tests__/**',
        '**/*.config.*'
      ]
    }
  }
})
```

## 🎨 Problemas de UI/Styling

### Tailwind CSS não aplica estilos

**Sintomas**:
- Classes do Tailwind não funcionam
- Estilos não são gerados

**Causas possíveis**:
- Configuração do Tailwind incorreta
- Arquivo CSS não importado
- Build do CSS falhando

**Soluções**:

```bash
# 1. Verificar configuração
cat tailwind.config.js

# 2. Verificar import do CSS
# Em app/layout.tsx ou _app.tsx
import './globals.css'

# 3. Regenerar CSS
rm -rf .next
pnpm build

# 4. Verificar se PostCSS está configurado
cat postcss.config.mjs
```

### Componentes não renderizam corretamente

**Sintomas**:
- Componente aparece mas sem estilos
- Layout quebrado
- Elementos sobrepostos

**Causas possíveis**:
- Problemas de hidratação (SSR/CSR)
- CSS modules conflitantes
- Ordem de imports incorreta

**Soluções**:

```typescript
// 1. Verificar hidratação
'use client'

import { useEffect, useState } from 'react'

export function MyComponent() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div>Loading...</div> // Fallback para SSR
  }

  return <div>Conteúdo hidratado</div>
}
```

### Imagens não carregam (Next.js Image)

**Sintomas**:
```
Error: Image is not optimized
```

**Causas possíveis**:
- Configuração do domínio externo faltando
- Pasta public não configurada
- Problemas de build

**Soluções**:

```javascript
// next.config.mjs
export default {
  images: {
    domains: ['cdn.example.com'],
    unoptimized: process.env.NODE_ENV === 'development'
  }
}
```

## ⚡ Problemas de Performance

### LCP muito alto

**Sintomas**:
- Largest Contentful Paint > 2.5s
- Core Web Vitals falhando

**Causas possíveis**:
- Imagens não otimizadas
- JavaScript bloqueando renderização
- Fonts não otimizadas

**Soluções**:

```typescript
// 1. Otimizar imagens
import Image from 'next/image'

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority // Para above the fold
  placeholder="blur"
/>

// 2. Lazy load components
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>
})

// 3. Otimizar fonts
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap' // Previne flash de texto não estilizado
})
```

### Bundle muito grande

**Sintomas**:
- Bundle > 200KB
- First load lento

**Causas possíveis**:
- Imports desnecessários
- Dependências pesadas
- Code splitting inadequado

**Soluções**:

```javascript
// 1. Analisar bundle
pnpm build --analyze

// 2. Lazy load routes
const Dashboard = dynamic(() => import('./dashboard'), {
  loading: () => <div>Loading...</div>
})

// 3. Importar apenas o necessário
// ❌ Errado
import { Button } from 'antd'

// ✅ Correto
import Button from 'antd/lib/button'
```

## 🔒 Problemas de Segurança

### CSP bloqueando recursos

**Sintomas**:
```
Refused to load the script 'https://...' because it violates the following Content Security Policy
```

**Causas possíveis**:
- CSP muito restritivo
- Recursos externos não permitidos
- Configuração incorreta

**Soluções**:

```javascript
// next.config.mjs
export default {
  async headers() {
    return [{
      source: '/(.*)',
      headers: [{
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' https://cdn.example.com",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https:",
          "font-src 'self' https://fonts.gstatic.com",
          "connect-src 'self' https://api.example.com"
        ].join('; ')
      }]
    }]
  }
}
```

### Vulnerabilidades de dependências

**Sintomas**:
- Avisos de segurança no npm/pnpm
- Build falhando por vulnerabilidades

**Soluções**:

```bash
# 1. Verificar vulnerabilidades
pnpm audit

# 2. Corrigir automaticamente
pnpm audit fix

# 3. Atualizar dependências
pnpm update --latest

# 4. Verificar manualmente
pnpm audit --audit-level moderate
```

## 🚀 Problemas de Deployment

### Build falha no Vercel

**Sintomas**:
```
Build failed with exit code 1
```

**Causas possíveis**:
- Variáveis de ambiente faltando
- Node.js version incompatível
- Dependências de build faltando

**Soluções**:

```bash
# 1. Verificar variáveis no Vercel
# Project Settings > Environment Variables

# 2. Configurar Node.js version
# vercel.json
{
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "nodeVersion": "20.x"
}

# 3. Testar build local
rm -rf .next node_modules
pnpm install
pnpm build
```

### Environment variables não funcionam

**Sintomas**:
- API calls falhando
- Configurações não carregando

**Causas possíveis**:
- Variáveis não definidas
- Nomes incorretos
- Valores inválidos

**Soluções**:

```bash
# 1. Verificar variáveis locais
# .env.local
NEXT_PUBLIC_API_URL=https://api.example.com
DATABASE_URL=postgresql://...

# 2. Verificar no Vercel
# Project Settings > Environment Variables

# 3. Debug no código
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL)
```

## 🐛 Problemas Gerais de Desenvolvimento

### Hot reload não funciona

**Sintomas**:
- Mudanças no código não refletem no browser

**Causas possíveis**:
- Arquivo não salvo
- Cache do Next.js
- Porta errada

**Soluções**:

```bash
# 1. Limpar cache
rm -rf .next

# 2. Reiniciar servidor
pnpm dev

# 3. Verificar se arquivo foi salvo
# No VS Code: Ctrl+S ou Cmd+S
```

### Erro de TypeScript inesperado

**Sintomas**:
```
Type 'X' is not assignable to type 'Y'
```

**Causas possíveis**:
- Tipos desatualizados
- Imports incorretos
- Configuração do TypeScript errada

**Soluções**:

```bash
# 1. Verificar tipos
pnpm typecheck

# 2. Limpar cache do TypeScript
rm -rf node_modules/.cache

# 3. Reiniciar TypeScript service
# No VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### Git merge conflicts

**Sintomas**:
- Conflitos ao fazer merge
- Arquivos com marcadores de conflito

**Soluções**:

```bash
# 1. Ver arquivos em conflito
git status

# 2. Resolver conflitos manualmente
# Editar arquivos e remover marcadores <<<<<<< ===== >>>>>>>

# 3. Adicionar arquivos resolvidos
git add resolved-file.ts

# 4. Completar merge
git commit

# 5. Se abortar merge
git merge --abort
```

## 📞 Quando Pedir Ajuda

### Issues no GitHub

**Para problemas complexos**:
1. Criar issue detalhada com:
   - Descrição do problema
   - Passos para reproduzir
   - Logs de erro completos
   - Ambiente (OS, Node.js, etc.)

2. Incluir labels apropriadas:
   - `bug`: Problema funcional
   - `performance`: Problema de performance
   - `security`: Problema de segurança
   - `documentation`: Problema na documentação

### Logs Úteis para Debug

```bash
# Informações do ambiente
node --version
pnpm --version
git --version

# Logs do Next.js
DEBUG=* pnpm dev

# Logs de build
pnpm build 2>&1 | tee build.log

# Logs de testes
pnpm test --reporter verbose
```

---

## 📚 Referências

- **[Qualidade](./quality.md)** - Gates e métricas de qualidade
- **[Arquitetura](./architecture.md)** - Estrutura técnica
- **[COMMANDS.md](./COMMANDS.md)** - Comandos disponíveis
- **[ADR](./ADR/)** - Decisões arquiteturais tomadas
