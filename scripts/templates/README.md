# 📋 Test Templates - TDD Quality Framework

Este diretório contém templates padronizados para criação de testes seguindo as melhores práticas TDD.

## 🎯 Templates Disponíveis

### 1. **Component Test** (`component-test.template.tsx`)
Template para testes de componentes React com:
- ✅ Estrutura AAA (Arrange, Act, Assert)
- ✅ Testes de renderização, interações e acessibilidade
- ✅ Mocks apropriados para Next.js e bibliotecas externas
- ✅ Cobertura de casos edge e performance

**Uso**: Componentes React, hooks customizados, UI components

### 2. **Unit Test** (`unit-test.template.ts`)
Template para testes unitários de funções/utilitários:
- ✅ Testes de funcionalidades principais e casos edge
- ✅ Validação de entrada e tratamento de erros
- ✅ Performance e condições de corrida
- ✅ Integração com dependências mockadas

**Uso**: Funções utilitárias, services, helpers, algoritmos

### 3. **Integration Test** (`integration-test.template.ts`)
Template para testes de integração:
- ✅ Setup/teardown de infraestrutura de teste
- ✅ Testes de fluxos completos com dependências reais
- ✅ Concorrência e transações
- ✅ Monitoramento e observabilidade

**Uso**: Services com banco de dados, APIs externas, sistemas complexos

### 4. **E2E Test** (`e2e-test.template.spec.ts`)
Template para testes end-to-end com Playwright:
- ✅ Fluxos completos de usuário
- ✅ Responsividade e acessibilidade
- ✅ Performance e carregamento
- ✅ Funcionalidades avançadas (A/B testing, i18n)

**Uso**: Fluxos críticos de negócio, jornadas completas

## 🚀 Como Usar os Templates

### Método 1: Script Automático
```bash
# Gerar teste de componente
node scripts/generate-test.mjs component Hero /components/sections/hero

# Gerar teste unitário
node scripts/generate-test.mjs unit formatDate /lib/utils/date

# Gerar teste de integração
node scripts/generate-test.mjs integration UserService /lib/services

# Gerar teste E2E
node scripts/generate-test.mjs e2e landing-page features/
```

### Método 2: Copiar Manualmente
1. Copie o template apropriado
2. Renomeie o arquivo: `componente.test.ts`
3. Substitua os placeholders:
   - `{{COMPONENT_NAME}}` → Nome do componente
   - `{{FUNCTION_NAME}}` → Nome da função
   - `{{SERVICE_NAME}}` → Nome do serviço
   - Caminhos de importação
   - Nomes de propriedades e métodos

## 📝 Placeholders a Substituir

### Component Test
```typescript
{{COMPONENT_NAME}}        → Ex: Hero, Button, Form
{{COMPONENT_PATH}}        → Ex: sections/hero/hero
{{COMPONENT_PROPS_TYPE}}  → Ex: HeroComponentProps
{{DOMAIN_PATH}}          → Ex: marketing
{{component-id}}         → Ex: hero, button-primary
{{component-section}}    → Ex: hero, navigation
```

### Unit Test
```typescript
{{FUNCTION_NAME}}        → Ex: formatDate, validateEmail
{{FUNCTION_PATH}}        → Ex: utils/date, validators
```

### Integration Test
```typescript
{{SERVICE_NAME}}         → Ex: UserService, PaymentService
{{SERVICE_PATH}}         → Ex: services/user, payments
```

## 🏗️ Estrutura de Testes Gerados

### Component Test Structure
```
describe('ComponentName Component', () => {
  describe('Rendering', () => {
    it('deve renderizar componente com conteúdo correto', () => { ... })
    it('deve aplicar classes CSS corretas', () => { ... })
  })

  describe('Interações', () => {
    it('deve chamar handler quando ação é executada', () => { ... })
    it('deve suportar navegação por teclado', () => { ... })
  })

  describe('Acessibilidade', () => {
    it('deve ter hierarquia de cabeçalhos correta', () => { ... })
    it('deve ter botões acessíveis', () => { ... })
  })

  describe('Estados Edge', () => {
    it('deve lidar com conteúdo vazio', () => { ... })
  })

  describe('Performance', () => {
    it('não deve causar re-renders desnecessários', () => { ... })
  })
})
```

### Unit Test Structure
```
describe('FunctionName', () => {
  describe('Funcionalidades Principais', () => { ... })
  describe('Casos Edge', () => { ... })
  describe('Performance', () => { ... })
  describe('Condições de Corrida', () => { ... })
  describe('Validação de Entrada', () => { ... })
  describe('Integração com Dependências', () => { ... })
})
```

## 🎯 Princípios TDD Aplicados

### 1. **RED → GREEN → REFACTOR**
- Templates incluem comentários indicando onde começar (RED)
- Estrutura guia implementação até GREEN
- Espaço para refatoração mantendo testes verdes

### 2. **Testes como Documentação**
- Nomes descritivos explicam comportamento esperado
- Exemplos claros de uso correto e incorreto
- Cobertura de cenários importantes para negócio

### 3. **Isolamento e Independência**
- Mocks apropriados para cada tipo de teste
- Setup/teardown consistentes
- Não dependência entre testes

### 4. **Manutenibilidade**
- Estrutura consistente facilita manutenção
- Comentários explicam intenções
- Fácil adaptação para novos requisitos

## 📊 Métricas de Qualidade Esperadas

Após usar templates, testes devem alcançar:

- **Nomenclatura**: > 85% (vs 80.3% atual)
- **Estrutura**: 100% (AAA pattern)
- **Isolamento**: 100% (mocks apropriados)
- **Manutenibilidade**: > 90% (estrutura organizada)

## 🔧 Personalização

### Adaptar para Projeto Específico
1. Modificar imports baseados na estrutura do projeto
2. Ajustar mocks para bibliotecas utilizadas
3. Adicionar helpers específicos do domínio
4. Personalizar convenções de nomenclatura

### Criar Novos Templates
1. Baseie-se nos templates existentes
2. Mantenha estrutura consistente
3. Inclua placeholders claros
4. Documente uso e customizações

## 🚨 Boas Práticas

### ✅ FAZER
- Usar templates como ponto de partida
- Adaptar para necessidades específicas
- Manter consistência entre testes similares
- Revisar testes gerados antes de commitar

### ❌ EVITAR
- Modificar templates indiscriminadamente
- Ignorar estrutura AAA
- Esquecer de mocks apropriados
- Criar testes sem usar templates

## 📚 Recursos Adicionais

- [Testing Library Docs](https://testing-library.com/)
- [Vitest Guide](https://vitest.dev/guide/)
- [Playwright E2E](https://playwright.dev/docs/intro)
- [TDD Best Practices](https://martinfowler.com/bliki/TestDrivenDevelopment.html)
