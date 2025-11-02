# 🧩 Vocabulário DDD - Landing Page SaaS

> Linguagem ubíqua do domínio de landing pages SaaS.
> Termos compartilhados entre negócio, desenvolvimento e agentes de IA.

## 📋 Visão Geral

Este documento define o **vocabulário ubíquo** (ubiquitous language) usado no projeto Luminaris, seguindo princípios de Domain-Driven Design (DDD). Estes termos garantem comunicação consistente entre:

- **Negócio**: Product owners e stakeholders
- **Desenvolvimento**: Devs e arquitetos
- **IA**: Agentes Cursor e ferramentas automatizadas
- **Documentação**: Guias e especificações

## 🎯 Domínio Principal: Marketing SaaS

### Landing Page

> Página de destino otimizada para conversão de visitantes em leads qualificados.

**Contexto**: Página inicial do produto DataFlow, focada em demonstrar valor e capturar interesse.

**Características**:
- **Hero Section**: Área principal com proposta de valor
- **Social Proof**: Credenciais e depoimentos
- **Benefícios**: Vantagens orientadas a resultado
- **Demonstração**: Preview do produto em ação
- **Planos**: Opções de preço e funcionalidades
- **FAQ**: Perguntas frequentes

### Persona

> Perfil do usuário ideal para o produto.

**Persona Principal**: Gestor de PME no Varejo
- **Idade**: 35-55 anos
- **Cargo**: CEO, COO, Gerente de Operações
- **Dor**: Gasta horas criando relatórios manuais no Excel
- **Objetivo**: Tomar decisões baseadas em dados em tempo real
- **Comportamento**: Busca soluções que economizem tempo

### Proposta de Valor (UVP)

> Unique Value Proposition - Benefício único e claro oferecido.

**UVP Principal**: "Automatize seus relatórios em minutos, não dias"

**Componentes**:
- **Problema**: Relatórios manuais consomem tempo valioso
- **Solução**: Automação inteligente de dados
- **Benefício**: Decisões mais rápidas e precisas
- **Prova**: Resultados mensuráveis (60% economia de tempo)

### Call-to-Action (CTA)

> Chamada para ação - Elemento que direciona o usuário a próxima etapa.

**Tipos de CTA**:
- **Primário**: "Agendar demonstração gratuita" (conversão principal)
- **Secundário**: "Comece grátis" (trial/signup)
- **Terciário**: "Saiba mais" (navegação adicional)

**Características**:
- **Verbo de ação**: Comece, Agende, Descubra
- **Risco reduzido**: Grátis, Sem compromisso, 14 dias
- **Urgência**: Limitada, Oferta especial

## 🎨 Domínio: Design System

### Token de Design

> Valor atômico que define aparência consistente.

**Tipos de Tokens**:
- **Cor**: Azul primário (#3b82f6), Verde accent (#22c55e)
- **Tipografia**: Inter, 16px base, 1.5 line-height
- **Espaçamento**: 8px grid base, múltiplos de 4px
- **Sombra**: Elevação 1-5 com blur progressivo
- **Raio**: Rounded corners (4px a 16px)

### Componente Atômico

> Elemento de UI mais básico e reutilizável.

**Exemplos**:
- **Button**: CTA com variants (primary, secondary, outline)
- **Input**: Campo de formulário com validação
- **Typography**: Textos com escalas responsivas
- **Icon**: Ícones consistentes (Lucide React)

### Componente Molecular

> Combinação de átomos para funcionalidades específicas.

**Exemplos**:
- **Form Field**: Input + Label + Error message
- **Card**: Container com sombra e padding
- **Navigation**: Menu com links e estados

### Seção Organism

> Componente complexo que forma uma área da landing page.

**Seções Padrão**:
- **Hero**: Headline + Subheadline + CTA + Visual
- **Benefits**: Lista de vantagens com ícones
- **Pricing**: Tabela de planos e preços
- **Testimonials**: Depoimentos de clientes
- **FAQ**: Perguntas frequentes expansíveis

## ⚡ Domínio: Performance

### Core Web Vitals

> Métricas essenciais de performance do Google.

**Métricas Principais**:
- **LCP** (Largest Contentful Paint): ≤ 2.5s
- **FID** (First Input Delay): ≤ 100ms
- **CLS** (Cumulative Layout Shift): ≤ 0.1

### Bundle Budget

> Limite de tamanho para JavaScript e assets.

**Limites**:
- **Bundle total**: ≤ 200KB
- **JavaScript inicial**: ≤ 70KB
- **CSS crítico**: ≤ 20KB
- **Imagens**: ≤ 500KB por página

### Lazy Loading

> Técnica de carregamento sob demanda.

**Tipos**:
- **Component**: Seções carregam apenas quando visíveis
- **Image**: Imagens com blur placeholder
- **Route**: Páginas carregam apenas quando navegadas

## 🔒 Domínio: Segurança

### Content Security Policy (CSP)

> Política de segurança que previne ataques XSS e injeção.

**Diretivas Principais**:
- **default-src**: Origens permitidas para recursos
- **script-src**: Fontes de JavaScript permitidas
- **style-src**: Fontes de CSS permitidas
- **img-src**: Fontes de imagens permitidas

### Input Sanitization

> Limpeza e validação de dados de entrada do usuário.

**Técnicas**:
- **Client-side**: Validação com Zod schemas
- **Server-side**: Sanitização antes de processamento
- **Database**: Prepared statements e validação

### Rate Limiting

> Controle de frequência de requisições para prevenir abuso.

**Implementação**:
- **Por IP**: Limite de requests por minuto
- **Por endpoint**: Limites específicos por rota
- **Por usuário**: Controle baseado em sessão

## 🧪 Domínio: Qualidade

### Quality Gate

> Barreiras automáticas que impedem código de baixa qualidade.

**Gates Principais**:
- **Type Check**: TypeScript sem erros
- **Lint**: Código seguindo padrões ESLint
- **Test**: Cobertura mínima de testes
- **Security**: Scan de vulnerabilidades

### Maturidade (M0-M3)

> Níveis de evolução da qualidade do código.

**Níveis**:
- **M0**: Setup básico (typecheck + lint)
- **M1**: Testes unitários + cobertura
- **M2**: Integração + contratos
- **M3**: E2E + performance + acessibilidade

### Test Double

> Substituto para dependências em testes.

**Tipos**:
- **Stub**: Retorna valores pré-definidos
- **Mock**: Verifica interações e comportamentos
- **Spy**: Observa chamadas sem interferir
- **Fake**: Implementação simplificada real

## 📊 Domínio: Analytics

### Evento de Conversão

> Ação do usuário que representa objetivo de negócio alcançado.

**Eventos Principais**:
- **Lead**: Formulário de contato preenchido
- **Trial**: Cadastro para período de teste
- **Demo**: Agendamento de demonstração
- **Signup**: Cadastro completo pago

### Funnel de Conversão

> Jornada do usuário desde visita até conversão.

**Etapas**:
- **Awareness**: Descoberta da landing page
- **Interest**: Leitura de benefícios e features
- **Consideration**: Comparação de planos
- **Intent**: Interação com CTAs
- **Evaluation**: Preenchimento de formulários
- **Purchase**: Conversão final

### A/B Test

> Experimento para comparar duas versões de conteúdo.

**Elementos**:
- **Variant A/B**: Versões sendo testadas
- **Métrica**: Taxa de conversão, tempo na página
- **Significance**: Diferença estatisticamente significativa
- **Winner**: Versão com melhor performance

## 🚀 Domínio: Deployment

### Environment

> Ambiente de execução da aplicação.

**Ambientes Padrão**:
- **Development**: Ambiente local de desenvolvimento
- **Staging**: Ambiente de testes pré-produção
- **Production**: Ambiente de produção final

### Feature Flag

> Mecanismo para ativar/desativar funcionalidades dinamicamente.

**Uso**:
- **Rollout gradual**: Liberar features para % de usuários
- **Kill switch**: Desativar features com problemas
- **A/B testing**: Controlar exposure de variants

### Rollback

> Reversão de deployment para versão anterior.

**Cenários**:
- **Automated**: Falha detectada automaticamente
- **Manual**: Problema identificado por usuário
- **Gradual**: Rollback progressivo por porcentagem

## 📱 Domínio: Acessibilidade

### WCAG Compliance

> Conformidade com diretrizes de acessibilidade web.

**Níveis**:
- **A**: Requisitos básicos
- **AA**: Requisitos intermediários (recomendado)
- **AAA**: Requisitos avançados

### Screen Reader

> Tecnologia assistiva que lê conteúdo da tela.

**Suporte**:
- **ARIA labels**: Descrições semânticas
- **Heading hierarchy**: Estrutura lógica de títulos
- **Focus management**: Navegação por teclado
- **Alt text**: Descrições de imagens

### Color Contrast

> Diferença de luminosidade entre cores.

**Requisitos**:
- **Texto normal**: Razão de 4.5:1 mínimo
- **Texto grande**: Razão de 3:1 mínimo
- **UI components**: Razão apropriada por contexto

## 🔧 Domínio: Desenvolvimento

### Use Case

> Descrição de uma funcionalidade do ponto de vista do usuário.

**Estrutura**:
- **Nome**: Ação principal (ex: "Criar conta de usuário")
- **Ator**: Quem executa (ex: "Visitante")
- **Pré-condições**: Estado necessário
- **Pós-condições**: Estado resultante
- **Fluxo principal**: Caminho feliz
- **Fluxos alternativos**: Cenários especiais

### Result Type

> Padrão para tratamento de operações que podem falhar.

```typescript
// Exemplo de uso
type Result<T, E> = { success: true; data: T } | { success: false; error: E }

const result = await createUser(input)
if (result.success) {
  // Usar result.data
} else {
  // Tratar result.error
}
```

### Schema Validation

> Validação estruturada de dados usando Zod.

```typescript
// Exemplo de schema
const userSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  age: z.number().min(18).optional()
})

const validated = userSchema.parse(inputData)
```

---

## 📚 Referências Cruzadas

| Termo | Documento | Contexto |
|-------|-----------|----------|
| Quality Gate | [quality.md](./quality.md) | Gates automáticos |
| Use Case | [architecture.md](./architecture.md) | Padrões de aplicação |
| Core Web Vitals | [quality.md](./quality.md) | Métricas de performance |
| A/B Test | [architecture.md](./architecture.md) | Experimentos |
| Feature Flag | [architecture.md](./architecture.md) | Deployment |

---

## 🔄 Manutenção do Vocabulário

### Quando Atualizar

- **Novo termo de negócio**: Quando o product owner introduz conceito novo
- **Termo técnico**: Quando a arquitetura define padrão novo
- **Clarificação**: Quando comunicação mostra ambiguidade

### Processo de Atualização

1. **Identificar**: Discussão em reunião ou issue mostra necessidade
2. **Definir**: Escrever definição clara e contexto
3. **Validar**: Revisar com equipe e negócio
4. **Documentar**: Adicionar ao vocabulário
5. **Comunicar**: Atualizar documentação relacionada

### Ferramentas de Apoio

- **ADR**: Para decisões sobre termos novos
- **Feature**: Para validar termos em cenários
- **Code**: Para implementar termos como tipos/códigos
