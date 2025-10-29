# 👁️ Visual Regression Testing

Este documento explica como usar o sistema de testes de regressão visual implementado para detectar mudanças visuais não intencionais na landing page.

## 🎯 Visão Geral

Os testes de regressão visual comparam screenshots automaticamente com baselines estabelecidos, detectando mudanças visuais que podem indicar bugs ou mudanças não intencionais no layout, tipografia, cores ou outros elementos visuais.

## 📋 Funcionalidades Testadas

### Seções Principais

- **Hero Section**: Título, subtítulo, CTAs e layout geral
- **Benefits Section**: Cards de benefícios e métricas
- **Social Proof Section**: Logos e depoimentos

### Estados Interativos

- **Hover States**: Efeitos de hover em botões
- **Focus States**: Estados de foco para acessibilidade
- **Loading States**: Estados de carregamento

### Breakpoints Responsivos

- **Mobile** (375x667)
- **Tablet** (768x1024)
- **Desktop** (1920x1080)
- **Large Desktop** (2560x1440)

### Estados Especiais

- **Consent Banner**: Banner de cookies (quando aparece)
- **Error States**: Estados de erro da aplicação

## 🚀 Como Usar

### Configuração Inicial

```bash
# Configurar diretório de baselines
npm run visual:setup

# Ver baselines atuais
npm run visual:list
```

### Executar Testes

```bash
# Executar testes visuais
npm run test:visual

# Executar apenas um teste específico
npx playwright test --grep "hero section visual regression"

# Executar com interface visual
npm run test:e2e:ui
```

### Atualizar Baselines

Quando mudanças visuais são intencionais, atualize os baselines:

```bash
# Atualizar todos os baselines
npm run test:visual:update

# Limpar baselines antigas
npm run visual:clean
```

## 🔧 Configuração Técnica

### Thresholds de Comparação

```typescript
// Configurado por teste para diferentes tolerâncias
threshold: 0.1,     // 10% diferença permitida (seções dinâmicas)
threshold: 0.05,    // 5% diferença permitida (elementos estáticos)
maxDiffPixels: 100, // Máximo de pixels diferentes permitidos
```

### Diretórios

```
tests/
├── visual-regression.spec.ts           # Testes visuais
└── visual-regression.spec.ts-snapshots/ # Baselines (auto-gerado)
    ├── hero-section.png
    ├── benefits-section.png
    ├── full-page-desktop.png
    └── ...
```

## 🔄 Integração com CI/CD

### GitHub Actions

Os testes visuais são executados automaticamente em:

- **Push para main/develop**
- **Pull Requests** que afetam arquivos visuais
- **Commits** que modificam estilos, componentes ou testes visuais

### Cache de Baselines

- Baselines são armazenados em cache para performance
- Atualização automática na branch main
- Notificações automáticas em PRs com mudanças visuais

### Relatórios

- **Playwright Report**: Interface interativa com comparações lado a lado
- **GitHub Comments**: Notificações automáticas em PRs
- **Artifacts**: Screenshots de diferenças para download

## 🛠️ Troubleshooting

### Problemas Comuns

#### 1. Testes Falhando por Diferenças Pequenas

```bash
# Ajustar threshold no teste específico
await expect(element).toHaveScreenshot('name.png', {
  threshold: 0.15, // Aumentar tolerância
})
```

#### 2. Elementos Dinâmicos Causando Flakes

```typescript
// Aguardar estabilização antes do screenshot
await page.waitForTimeout(1000);
await expect(element).toHaveScreenshot("name.png");
```

#### 3. Diferenças de Renderização Cross-Browser

```typescript
// Threshold mais alto para browsers diferentes
await expect(element).toHaveScreenshot("name.png", {
  threshold: 0.2, // Maior tolerância
});
```

### Debug Visual

```bash
# Executar testes em modo headed para debug
npx playwright test tests/visual-regression.spec.ts --headed

# Executar apenas um teste específico
npx playwright test --grep "hero section"
```

## 📊 Métricas e Relatórios

### Cobertura Visual

- **Seções Principais**: Hero, Benefits, Social Proof (100%)
- **Estados Interativos**: Hover, Focus, Loading (100%)
- **Breakpoints**: Mobile, Tablet, Desktop, Large Desktop (100%)
- **Elementos Dinâmicos**: Consent Banner, Error States (Condicional)

### Performance

- **Tempo Médio**: ~10-15 segundos por teste
- **Tamanho dos Baselines**: ~50-200KB por screenshot
- **Comparação**: Pixel-perfect com tolerâncias configuráveis

## 🎨 Boas Práticas

### Quando Atualizar Baselines

- ✅ Mudanças intencionais no design
- ✅ Atualizações de componentes visuais
- ✅ Mudanças de breakpoints ou responsividade
- ✅ Novas funcionalidades visuais

### Quando Investigar Diferenças

- ⚠️ Mudanças não intencionais detectadas
- ⚠️ Diferenças maiores que o threshold
- ⚠️ Elementos fora de posição
- ⚠️ Mudanças de cores ou tipografia

### Estratégias de Teste

1. **Testes Específicos**: Um teste por seção/componente
2. **Estados Isolados**: Testar hover, focus separadamente
3. **Breakpoints Independentes**: Cada tamanho de tela separadamente
4. **Thresholds Adequados**: Tolerâncias baseadas na natureza do conteúdo

## 🔗 Integrações

### Com Outros Testes

- **E2E Funcionais**: Complementam testes visuais
- **A11y Tests**: Trabalham em conjunto para qualidade completa
- **Performance Tests**: Lighthouse CI roda em paralelo

### Ferramentas Utilizadas

- **Playwright**: Framework de testes E2E
- **toHaveScreenshot**: Comparação de imagens pixel-perfect
- **GitHub Actions**: CI/CD automatizado
- **Artifacts**: Armazenamento de resultados

## 📈 Roadmap

### Melhorias Planejadas

- [ ] **Component-Level Testing**: Testes visuais de componentes isolados
- [ ] **Storybook Integration**: Screenshots de stories do Storybook
- [ ] **Performance Metrics**: Métricas de performance visual
- [ ] **A/B Testing Visual**: Comparação visual de experimentos
- [ ] **Cross-Device Testing**: Mais dispositivos móveis

---

## 🚀 Quick Start

```bash
# 1. Configurar
npm run visual:setup

# 2. Executar baseline inicial
npm run test:visual:update

# 3. Verificar baselines criados
npm run visual:list

# 4. Executar testes regularmente
npm run test:visual
```

Para mais informações, consulte a documentação completa dos testes E2E em `tests/landing-page-e2e.spec.ts`.
