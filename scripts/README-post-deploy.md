# Post-Deploy Validation Scripts

Scripts para validar funcionalidades core e UX avançado após deploy do Luminaris SaaS.

## 📋 Checklist de Validação

### 1. Funcionalidades Core

- [ ] **CSS carregando** - Página com estilos visuais
- [ ] **Design System ativo** - Cores, tipografia, espaçamento
- [ ] **Componentes funcionais** - Botões, forms, navegação
- [ ] **Responsividade** - Mobile, tablet, desktop

### 2. UX Avançado

- [ ] **UX Orchestrator presente** - Componente carregado
- [ ] **Chat ativo** - Aparece após 10s de navegação
- [ ] **Onboarding funcional** - Flow de boas-vindas
- [ ] **Recomendações** - Sistema de sugestões ativo

## 🚀 Como Usar

### Validação Completa

```bash
# Usar URL de produção
export POST_DEPLOY_URL=https://your-production-url.com

# Executar validação completa
node scripts/post-deploy-validation.mjs

# Ou usar o checklist runner
node scripts/post-deploy-checklist.mjs
```

### Validações Específicas

```bash
# Apenas funcionalidades core
node scripts/post-deploy-validation.mjs --check=core

# Apenas UX avançado
node scripts/post-deploy-validation.mjs --check=ux

# Apenas responsividade
node scripts/post-deploy-validation.mjs --check=responsive
```

### Modos do Checklist

```bash
# Executar apenas validações automatizadas
node scripts/post-deploy-checklist.mjs automated

# Mostrar apenas checks manuais
node scripts/post-deploy-checklist.mjs manual

# Executar tudo (padrão)
node scripts/post-deploy-checklist.mjs full
```

## 🛠️ Configuração

### Variáveis de Ambiente

```bash
# URL para validar (padrão: http://localhost:3000)
export POST_DEPLOY_URL=https://your-app.com

# Habilitar debug com screenshots
export DEBUG=true

# Timeout para operações (padrão: 30000ms)
export TIMEOUT=60000
```

### Dependências

```bash
# Instalar Playwright browsers
npx playwright install chromium
```

## 📊 Saídas

### Resultados

- **✅ Passed**: Validação bem-sucedida
- **❌ Failed**: Falha crítica (bloqueia deploy)
- **⚠️ Warnings**: Avisos (não bloqueiam)

### Arquivos Gerados

- `tmp/validation-*.png` - Screenshots (se DEBUG=true)
- `tmp/post-deploy-results.json` - Resultados estruturados

## 🔧 Integração CI/CD

### GitHub Actions

```yaml
- name: Post-Deploy Validation
  run: |
    export POST_DEPLOY_URL=https://$DEPLOY_URL
    node scripts/post-deploy-checklist.mjs automated
  env:
    DEPLOY_URL: ${{ secrets.DEPLOY_URL }}
```

### Vercel

```bash
# Adicionar aos Build Commands ou Deploy Hooks
npm run post-deploy:validate
```

## 📈 Métricas Coletadas

### Core Web Vitals

- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- First Input Delay (FID)

### Funcionalidades

- CSS loading time
- Design system token application
- Component rendering
- Responsive layout integrity
- UX component activation

## 🐛 Debugging

### Modo Debug

```bash
export DEBUG=true
node scripts/post-deploy-validation.mjs
```

Gera screenshots em `tmp/` para análise visual.

### Logs Detalhados

```bash
export DEBUG=true
export NODE_DEBUG=post-deploy
node scripts/post-deploy-validation.mjs
```

### Validação Manual

Se testes automatizados falharem:

1. Abra navegador e acesse a URL
2. Verifique console do navegador por erros
3. Teste interações manuais
4. Use ferramentas de desenvolvedor para inspecionar elementos

## 🎯 Critérios de Sucesso

### Deploy Aprovado

- ✅ Todas validações críticas passam (CSS, Design System, Componentes, Responsividade)
- ✅ Taxa de sucesso > 80% nos testes automatizados
- ⚠️ Máximo 3 warnings não críticos

### Deploy Reprovado

- ❌ Qualquer falha crítica
- ❌ Taxa de sucesso < 60%
- ❌ Erros de JavaScript no console

## 📞 Suporte

### Solução de Problemas Comuns

**CSS não carrega:**

- Verificar se arquivos CSS estão sendo servidos
- Checar caminhos relativos em produção
- Validar Content Security Policy

**Componentes não funcionais:**

- Verificar JavaScript errors no console
- Checar se APIs externas estão acessíveis
- Validar environment variables

**UX não aparece:**

- Verificar se debug stage está correto
- Checar condições de ativação (localStorage, tempo, etc.)
- Validar se componentes estão importados

### Contato

- **DevOps**: Para issues de infraestrutura
- **Frontend**: Para issues de componentes/UX
- **QA**: Para validações manuais adicionais
