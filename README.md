# 🌟 Landing Page Luminous SaaS

Uma landing page SaaS completa e profissional construída com Next.js, TypeScript e Tailwind CSS. Apresenta arquitetura composition-first, sistema TDD Quality integrado e foco em performance e conversão.

## ✨ Características Principais

### 🎯 **Landing Page Completa**
- **Hero Section** - Headline impactante com CTA primário
- **Social Proof** - Logos de clientes + depoimentos
- **Benefícios** - Cards orientados a resultado
- **Demonstração** - Preview do produto
- **Features** - Recursos com ícones e descrições
- **Planos** - Pricing com tiers e destaque "Mais Popular"
- **FAQ** - Perguntas frequentes
- **CTA Final** - Repetição do convite de ação

### 🏗️ **Arquitetura Composition-First**
- Separação clara entre conteúdo e apresentação
- Compositores para orquestração de seções
- Componentes isolados e reutilizáveis
- Sistema de configuração declarativo

### 🧪 **TDD Quality System**
- Gates automáticos em PRs
- Análise de maturidade (M0-M3)
- Métricas: cobertura, isolamento, performance, qualidade
- Thresholds adaptativos por contexto
- Relatórios detalhados e dashboards

### ⚡ **Performance Otimizada**
- Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms
- Lazy loading inteligente por rota
- Image optimization com next/image
- Bundle splitting otimizado
- PWA com service worker

### 🎨 **Design System Completo**
- Design tokens centralizados
- Modo escuro/light
- Responsivo (320px - 1440px+)
- Acessibilidade WCAG AA
- Animações micro-interativas

### 🔒 **Segurança & Qualidade**
- CSP configurado
- Input sanitization
- Rate limiting
- Error boundaries
- TypeScript strict
- 400+ testes automatizados

## 🚀 **Tecnologias**

- **Framework**: Next.js 15 (App Router)
- **Linguagem**: TypeScript strict
- **Styling**: Tailwind CSS + Design System
- **Animações**: Framer Motion
- **Testes**: Vitest + Playwright + Testing Library
- **CI/CD**: GitHub Actions
- **Deploy**: Vercel
- **Analytics**: GA4 + Plausible

## 📊 **Qualidade do Código**

```bash
# Análise TDD completa
npm run tdd:analyze

# Gates de qualidade
npm run ci:tdd-gate

# Validação de configuração
npm run tdd:validate-config
```

## 🏃‍♂️ **Como Executar**

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build de produção
npm run build

# Executar testes
npm run test

# Análise de qualidade
npm run tdd:analyze
```

## 📁 **Estrutura do Projeto**

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
├── docs/                # Documentation
└── tests/               # Test suites
```

## 🎯 **Próximos Passos**

1. **Deploy**: Configurar Vercel para deploy automático
2. **Analytics**: Integrar Google Analytics 4
3. **A/B Testing**: Configurar experimentos de conversão
4. **CMS**: Integrar headless CMS para conteúdo dinâmico
5. **Monitoring**: Configurar Sentry para error tracking

## 📈 **Métricas de Qualidade**

- **Performance**: Lighthouse 95+ em todos os scores
- **Acessibilidade**: WCAG AA compliance
- **SEO**: Rich snippets e meta tags otimizados
- **Testes**: 400+ testes automatizados
- **Bundle**: < 200KB JavaScript inicial

## 🤝 **Contribuição**

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📝 **Licença**

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

**Feito com ❤️ para converter visitantes em clientes**