# Troubleshooting - Landing Page SaaS

## 🐛 Problemas Conhecidos e Soluções

### [2025-10-22] SSR Error: "window is not defined"

**Data:** 2025-10-22
**Sintomas:**

- Erro `ReferenceError: window is not defined` no terminal/console
- Aplicação retorna HTTP 500 em produção/desenvolvimento
- Stack trace aponta para arquivos que acessam `window`, `document`, ou `navigator`

**Causas Possíveis:**

1. **Bibliotecas problemáticas:** `isomorphic-dompurify` tentando acessar DOM no server-side
2. **Inicialização imediata de singletons:** Código executado no topo do módulo que acessa browser APIs
3. **Falta de verificações de ambiente:** Código que não verifica `typeof window !== 'undefined'`

**Soluções:**

#### ✅ Para bibliotecas problemáticas:

```typescript
// ❌ Errado
import DOMPurify from "isomorphic-dompurify";

// ✅ Correto - Implementação custom SSR-safe
function sanitizeHTML(dirty: string): string {
  return dirty.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    "",
  );
  // ... outras regras de sanitização
}
```

#### ✅ Para singletons:

```typescript
// ❌ Errado - Inicialização imediata
const predictiveLoader = PredictiveLoader.getInstance();

// ✅ Correto - Inicialização lazy
let predictiveLoader: PredictiveLoader | null = null;
function getPredictiveLoader(): PredictiveLoader {
  if (!predictiveLoader) {
    predictiveLoader = PredictiveLoader.getInstance();
  }
  return predictiveLoader;
}
```

#### ✅ Para acesso a browser APIs:

```typescript
// ❌ Errado
const userAgent = navigator.userAgent;

// ✅ Correto
const userAgent =
  typeof navigator !== "undefined" ? navigator.userAgent : "unknown";
```

**Verificação:**

1. Rode `npm run dev` e verifique se não há erros de SSR
2. Teste `curl http://localhost:3000` - deve retornar HTTP 200
3. Verifique se funcionalidades client-side ainda funcionam

**Prevenção:** Sempre verificar `typeof window !== 'undefined'` antes de acessar APIs do browser.

**Status:** Resolvido - Implementado sistema SSR-safe em toda a aplicação

### [2025-10-02] Erro: "No matching version found for cucumber@^9.3.1"

**Data:** 2025-10-02
**Mensagem:** `npm error notarget No matching version found for cucumber@^9.3.1`
**Causa:** Versão do cucumber inexistente no npm registry
**Solução:**

1. Remover dependências BDD do package.json temporariamente
2. Focar no core do projeto primeiro
3. Reimplementar testes BDD depois com versões corretas
   **Prevenção:** Verificar versões no npm antes de adicionar dependências
   **Status:** Resolvido

### [2025-10-02] Warning: "deprecated packages"

**Data:** 2025-10-02
**Mensagem:** Vários warnings sobre pacotes deprecated (inflight, abab, domexception, etc.)
**Causa:** Dependências indiretas usando versões antigas
**Solução:** Warnings normais, não críticos. Atualizar quando dependências principais forem atualizadas
**Prevenção:** Manter dependências atualizadas regularmente
**Status:** Aceitável (não bloqueante)

### [2025-10-02] Vulnerability: "1 critical severity vulnerability"

**Data:** 2025-10-02
**Mensagem:** `npm audit` mostra vulnerabilidade crítica
**Causa:** Dependência indireta com vulnerabilidade conhecida
**Solução:** `npm audit fix --force` (se seguro) ou aguardar updates das dependências
**Prevenção:** Rodar `npm audit` regularmente e manter dependências atualizadas
**Status:** Monitorar

## 🔍 Padrão de Registro de Problemas

### Formato para Novos Problemas

```
### [Data] Problema: [Título descritivo]
**Data:** YYYY-MM-DD
**Mensagem:** [Erro exato ou descrição]
**Causa:** [Análise root cause]
**Solução:** [Passos para resolver]
**Prevenção:** [Como evitar recorrência]
**Status:** [Aberto/Resolvido/Monitorando]
```

## 🚨 Problemas Potenciais (Preventivos)

### Performance Issues

- **LCP > 2.5s**: Verificar imagens não otimizadas, fonts blocking
- **CLS > 0.1**: Layout shifts por conteúdo dinâmico
- **Bundle Size**: Verificar imports desnecessários

### Acessibilidade

- **Contraste insuficiente**: Usar ferramenta de contraste para validar
- **Navegação por teclado**: Testar Tab order em todos os componentes
- **Screen readers**: Verificar aria-labels e roles

### SEO

- **Missing meta tags**: Verificar next-seo configuration
- **Schema.org inválido**: Validar com Google's Rich Results Test
- **Core Web Vitals**: Monitorar no Search Console

### Funcionalidades

- **Form validation**: Testar edge cases e mensagens de erro
- **Analytics events**: Verificar se events disparam corretamente
- **A/B testing**: Validar flags e experiment tracking

## 🛠️ Ferramentas de Debug

### Desenvolvimento

- **React DevTools**: Component tree e props
- **Next.js DevTools**: Performance e bundle analysis
- **Lighthouse**: Performance, accessibility, SEO audit

### Produção

- **Sentry**: Error tracking
- **Google Analytics**: User behavior
- **Vercel Analytics**: Performance metrics

## 📞 Contatos para Suporte

- **Next.js Issues**: [Next.js GitHub Issues](https://github.com/vercel/next.js/issues)
- **Tailwind Issues**: [Tailwind CSS GitHub](https://github.com/tailwindlabs/tailwindcss/issues)
- **shadcn/ui Issues**: [shadcn/ui GitHub](https://github.com/shadcn-ui/ui/issues)
- **Framer Motion**: [Framer Motion GitHub](https://github.com/framerjs/framer-motion/issues)

### [2025-10-02] Erro: "Can't resolve '../globals.css'"

**Data:** 2025-10-02
**Mensagem:** Module not found: Can't resolve '../globals.css'
**Causa:** Caminho incorreto no import do layout.tsx
**Solução:** Corrigir caminho para "../../styles/globals.css"
**Prevenção:** Verificar caminhos de import após mover arquivos
**Status:** Resolvido

### [2025-10-02] Erro: "Cannot find module 'tailwindcss-animate'"

**Data:** 2025-10-02
**Mensagem:** Module build failed: Cannot find module 'tailwindcss-animate'
**Causa:** Dependência não instalada mas referenciada no tailwind.config.ts
**Solução:** `npm install tailwindcss-animate`
**Prevenção:** Garantir que todas as dependências do tailwind.config.ts estejam instaladas
**Status:** Resolvido

### [2025-10-02] Testes BDD: Timeouts e falhas de carregamento

**Data:** 2025-10-02
**Mensagem:** Cenários falhando com timeout 5000ms em operações básicas
**Causa:** Servidor Next.js não carregando corretamente durante testes
**Solução:** Investigar problemas de build do Next.js, ajustar timeouts do Cucumber
**Prevenção:** Garantir que servidor esteja funcionando antes de executar testes
**Status:** Em investigação - servidor apresenta erro 500

## 📊 Status Geral

- **Erros Críticos:** 1 (servidor Next.js)
- **Warnings:** Alguns (deprecated packages)
- **Vulnerabilidades:** 1 crítica (monitorar)
- **Performance:** Não testado ainda
- **Acessibilidade:** Não auditado ainda

## 🔄 Plano de Monitoramento

- [ ] Executar Lighthouse audit completo
- [ ] Testar acessibilidade com axe-core
- [ ] Validar SEO com Rich Results Test
- [ ] Monitorar Core Web Vitals
- [ ] Testar em diferentes browsers/dispositivos
- [ ] Validar formulários com dados edge case
