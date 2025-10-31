# Guia de Simplificação de Código

## Visão Geral
Este guia estabelece os princípios e práticas para manter a simplicidade no código. Simplicidade não é falta de sofisticação - é sofisticação bem direcionada.

## Princípios Fundamentais

### 1. Simplicidade é Segurança
Código simples tem menos bugs, é mais fácil de testar e mais seguro de modificar.

### 2. Complexidade Acidental vs Essencial
- **Essencial**: Problemas de negócio complexos (ex: algoritmos financeiros)
- **Acidental**: Complexidade que criamos por escolha ruim de arquitetura

### 3. Tamanho Importa
Arquivos grandes são difíceis de entender, testar e manter. Quebre quando necessário.

## Checklist de Revisão de Código

### Antes de Aprovar um Pull Request:
- [ ] **Simplicidade**: Esta solução é a forma mais simples possível?
- [ ] **Responsabilidades**: Este código mistura responsabilidades demais? (UI + negócio + infra)
- [ ] **Manutenibilidade**: Este código seria fácil de manter por outra pessoa daqui a 3 meses?
- [ ] **Tipagem**: Este código depende de `any` solto ou generics frouxos?
- [ ] **Parâmetros**: Esta função tem menos de 4 parâmetros?
- [ ] **Tamanho**: Este arquivo tem menos de 300 linhas?
- [ ] **Testabilidade**: Este código tem testes que cobrem os casos importantes?
- [ ] **Consistência**: Este código segue os padrões estabelecidos no projeto?

## Regras de Linting Ativas

### Sempre Aplicadas
```javascript
{
  "complexity": ["error", 10],           // Funções muito complexas
  "@typescript-eslint/no-explicit-any": "error",  // Sem any solto
  "max-lines": ["error", 300],           // Arquivos muito grandes
  "max-params": ["error", 4],           // Funções com muitos parâmetros
  "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
  "prefer-const": "error",               // Imutabilidade
  "no-var": "error"                      // Sem var
}
```

### Quebrar Estas Regras Só com Justificativa
Documente no PR por que a complexidade é necessária e quando será refatorada.

## Padrões de Refatoração

### 1. Quebrar Arquivos Grandes

#### ❌ Anti-Padrão
```typescript
// arquivo-monstro.ts (500+ linhas)
// Tudo junto: UI, lógica, validação, API calls
```

#### ✅ Solução
```
components/
  ui/                 # Só componentes visuais
  sections/           # Composição de UI + lógica simples
lib/
  services/           # Lógica de negócio
  validation/         # Regras de validação
  api/               # Chamadas externas
```

### 2. Reduzir Parâmetros de Função

#### ❌ Anti-Padrão
```typescript
function createUser(name: string, email: string, age: number, role: string, department: string, managerId?: string) {
  // 6 parâmetros = complexo
}
```

#### ✅ Solução
```typescript
interface CreateUserOptions {
  name: string;
  email: string;
  age: number;
  role: string;
  department: string;
  managerId?: string;
}

function createUser(options: CreateUserOptions) {
  // 1 parâmetro = simples
}
```

### 3. Evitar Lógica Complexa em Componentes

#### ❌ Anti-Padrão
```typescript
function UserProfile({ userId }: Props) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [analytics, setAnalytics] = useState({});

  // Lógica de negócio no componente
  useEffect(() => {
    if (user?.role === 'admin' && permissions.includes('write')) {
      // Complex business logic here
    }
  }, [user, permissions]);

  return <div>...</div>;
}
```

#### ✅ Solução
```typescript
function useUserProfile(userId: string) {
  // Lógica isolada em hook
  return { user, permissions, analytics, canEdit };
}

function UserProfile({ userId }: Props) {
  const { user, canEdit } = useUserProfile(userId);

  return <div>...</div>;
}
```

## Sinais de Alerta

### Código que Deve Ser Refatorado Imediatamente
- Arquivos > 300 linhas
- Funções com complexidade > 10
- Funções com > 4 parâmetros
- Uso de `any` ou `unknown` sem validação imediata
- Mistura de UI + API + validação no mesmo arquivo

### Quando a Complexidade é Aceitável
- Algoritmos matemáticos/computacionais complexos (ex: criptografia)
- Integrações com APIs externas complexas (ex: Stripe, analytics)
- Código de infraestrutura (build tools, bundlers)
- Testes complexos que validam cenários edge

## Processo de Refatoração

### 1. Identificar o Problema
- Code review aponta complexidade
- Linting falha
- Desenvolvedor sente dificuldade de entender

### 2. Planejar a Solução
- Quebrar em partes menores
- Identificar responsabilidades
- Criar interfaces claras

### 3. Implementar Gradualmente
- Extrair funções/módulos
- Adicionar testes
- Validar que não quebrou nada

### 4. Documentar
- Atualizar comentários
- Adicionar exemplos de uso
- Atualizar documentação

## Benefícios Esperados

### Para Desenvolvedores
- Código mais fácil de entender
- Mudanças mais seguras
- Debugging mais rápido
- Onboarding mais rápido

### Para o Produto
- Menos bugs em produção
- Features lançadas mais rápido
- Manutenção mais barata
- Escalabilidade melhor

### Para a Empresa
- Time mais produtivo
- Menos tempo em refatorações de emergência
- Código mais confiável
- Menos dívida técnica

## Exemplos do Projeto

### ✅ Bom Exemplo - Fase 2
```typescript
// lib/lazy-loading/core/types.ts (85 linhas)
// Tipos centralizados e bem definidos
export interface AdaptiveRule {
  id: string;
  name: string;
  confidence: number; // 0-1, type safe
  // ... outros campos com tipos específicos
}
```

### ❌ Má Exemplo - Antes da Fase 2
```typescript
// lib/lazy-loading/core/adaptive-rule-manager.ts (730 linhas)
// Monstro: ML + regras + tipos + engine + manager tudo junto
// Usava 'any' em vários lugares, complexidade 15+ em funções
```

### 📈 Resultado da Refatoração
```typescript
// Após Fase 2: 3 arquivos focados
// types.ts (85 linhas) - Só tipos
// rule-engine.ts (302 linhas) - Só lógica de avaliação
// rule-manager.ts (316 linhas) - Só orquestração
// Total: 703 linhas vs 730 originais, mas muito mais manutenível
```

## Padrões de Refatoração Aplicados na Fase 2

### 1. Quebrar Monstros em Módulos
```typescript
// ❌ Antes: Tudo em um arquivo
class Monstro {
  // 200 linhas de tipos
  // 300 linhas de lógica
  // 200 linhas de orquestração
}

// ✅ Depois: Módulos separados
// types.ts - tipos
// engine.ts - lógica core
// manager.ts - orquestração
```

### 2. Substituir ML por Lógica Determinística
```typescript
// ❌ Antes: Reinforcement learning complexo
private chooseThreshold(state: string, possible: number[]): number {
  // Q-learning, exploração, etc (50+ linhas)
}

// ✅ Depois: Context overrides simples
private buildContextKeys(context: Context): string[] {
  return Object.entries(context)
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => `${key}:${value}`);
}
```

### 3. Melhorar Type Safety
```typescript
// ❌ Antes: any everywhere
value: any;
condition.value: any;

// ✅ Depois: unknown com validação
value: unknown; // Type-safe
condition.value as number; // Com type assertion consciente
```

## Conclusão

Simplicidade é um investimento que sempre paga dividendos. Prefira sempre a solução mais simples que funciona, e só adicione complexidade quando ela for absolutamente necessária para resolver um problema real de negócio.
