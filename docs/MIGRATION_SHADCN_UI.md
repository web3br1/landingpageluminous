# 🚀 **Migração Completa para shadcn/ui**

## 📋 **Visão Geral da Migração**

### 🎯 **Objetivo**

Migrar completamente o sistema de design atual para **shadcn/ui**, substituindo componentes customizados por componentes padronizados, mantendo o design system personalizado e melhorando a consistência visual.

### 📊 **Estado Atual vs. Objetivo**

| Aspecto              | Estado Atual                 | Após Migração                         |
| -------------------- | ---------------------------- | ------------------------------------- |
| **Componentes**      | ~25 componentes customizados | Componentes shadcn/ui + customizações |
| **Design System**    | Design system customizado    | shadcn/ui + tokens customizados       |
| **Consistência**     | Múltiplos padrões            | Sistema unificado                     |
| **Manutenibilidade** | Alta complexidade            | Baixa complexidade                    |
| **Performance**      | Overhead customizado         | Otimizado por padrão                  |
| **Acessibilidade**   | Implementação manual         | Garantida por Radix UI                |

---

## 🏗️ **Arquitetura da Migração**

### 1. **Camadas do Sistema**

```
┌─────────────────────────────────────┐
│         🎨 DESIGN SYSTEM             │
│   (Tokens customizados + shadcn/ui) │
├─────────────────────────────────────┤
│         🧩 COMPONENTES UI            │
│   (shadcn/ui + customizações)       │
├─────────────────────────────────────┤
│         📱 SEÇÕES DA LANDING         │
│   (Composition-First Architecture)  │
├─────────────────────────────────────┤
│         🔧 UTILITÁRIOS               │
│   (Hooks, utils, helpers)           │
└─────────────────────────────────────┘
```

### 2. **Princípios de Migração**

- **🔄 Manter compatibilidade** com Composition-First Architecture
- **🎨 Preservar identidade visual** através de tokens customizados
- **⚡ Melhorar performance** com componentes otimizados
- **♿ Garantir acessibilidade** com Radix UI primitives
- **🧪 Manter testes** e validação existentes

---

## 📦 **Instalação e Setup**

### ✅ **Status Atual**

- ✅ shadcn/ui já configurado (`components.json`)
- ✅ Dependências básicas instaladas
- ✅ Tailwind CSS configurado

### 🔧 **Componentes shadcn/ui Necessários**

```bash
# Core Components
npx shadcn@latest add button card badge alert progress tabs avatar

# Form Components
npx shadcn@latest add input label textarea checkbox radio-group select switch

# Layout Components
npx shadcn@latest add separator sheet dialog drawer

# Data Display
npx shadcn@latest add table badge tooltip popover

# Feedback
npx shadcn@latest add toast alert-dialog

# Navigation
npx shadcn@latest add breadcrumb pagination navigation-menu
```

### 🎨 **Configuração Customizada**

```typescript
// tailwind.config.ts - Extensões necessárias
module.exports = {
  theme: {
    extend: {
      colors: {
        // Manter tokens customizados
        primary: {
          50: "var(--color-primary-50)",
          // ... todos os shades
        },
        // Adicionar variáveis shadcn/ui
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        // ...
      },
      borderRadius: {
        // Manter compatibilidade
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
};
```

---

## 🔄 **Plano de Migração por Fases**

### **FASE 1: Foundation (1-2 dias)**

#### 🎯 **Objetivos**

- Instalar componentes shadcn/ui essenciais
- Configurar design tokens customizados
- Migrar componentes base (Button, Card, Badge)

#### 📋 **Tarefas**

1. **Instalar Componentes Core**

   ```bash
   npx shadcn@latest add button card badge alert progress
   ```

2. **Atualizar Design System**

   ```typescript
   // design-system/theme.ts - Novo arquivo
   export const theme = {
     colors: {
       // Importar tokens existentes
       ...colorTokens,
       // Adicionar variáveis shadcn/ui
       background: "hsl(var(--background))",
       foreground: "hsl(var(--foreground))",
       // ...
     },
   };
   ```

3. **Migrar Componentes Base**

   **Button Component:**

   ```tsx
   // ANTES (components/ui/button.tsx)
   export function Button({ variant = "default", size = "default", ...props }) {
     const baseClasses =
       "inline-flex items-center justify-center rounded-md font-medium transition-colors";
     const variants = {
       default: "bg-primary text-primary-foreground hover:bg-primary/90",
       // ...
     };
     return (
       <button className={cn(baseClasses, variants[variant])} {...props} />
     );
   }

   // DEPOIS (components/ui/button.tsx)
   import { cva, type VariantProps } from "class-variance-authority";
   import { cn } from "@/lib/utils";

   const buttonVariants = cva(
     "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
     {
       variants: {
         variant: {
           default: "bg-primary text-primary-foreground hover:bg-primary/90",
           destructive:
             "bg-destructive text-destructive-foreground hover:bg-destructive/90",
           outline:
             "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
           secondary:
             "bg-secondary text-secondary-foreground hover:bg-secondary/80",
           ghost: "hover:bg-accent hover:text-accent-foreground",
           link: "text-primary underline-offset-4 hover:underline",
         },
         size: {
           default: "h-10 px-4 py-2",
           sm: "h-9 rounded-md px-3",
           lg: "h-11 rounded-md px-8",
           icon: "h-10 w-10",
         },
       },
       defaultVariants: {
         variant: "default",
         size: "default",
       },
     },
   );

   export interface ButtonProps
     extends React.ButtonHTMLAttributes<HTMLButtonElement>,
       VariantProps<typeof buttonVariants> {
     asChild?: boolean;
   }

   const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
     ({ className, variant, size, asChild = false, ...props }, ref) => {
       const Comp = asChild ? Slot : "button";
       return (
         <Comp
           className={cn(buttonVariants({ variant, size, className }))}
           ref={ref}
           {...props}
         />
       );
     },
   );
   Button.displayName = "Button";

   export { Button, buttonVariants };
   ```

### **FASE 2: Components Avançados (2-3 dias)**

#### 🎯 **Objetivos**

- Migrar componentes complexos
- Implementar formulários com react-hook-form
- Configurar tema e variants

#### 📋 **Tarefas**

1. **Migrar Form Components**

   ```bash
   npx shadcn@latest add input label textarea checkbox radio-group select
   ```

2. **Atualizar Formulários**

   ```tsx
   // components/ui/form.tsx
   import * as React from "react";
   import * as LabelPrimitive from "@radix-ui/react-label";
   import { Slot } from "@radix-ui/react-slot";
   import {
     Controller,
     ControllerProps,
     FieldPath,
     FieldValues,
     FormProvider,
     useFormContext,
   } from "react-hook-form";

   const Form = FormProvider;

   type FormFieldContextValue<
     TFieldValues extends FieldValues = FieldValues,
     TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
   > = {
     name: TName;
   };

   const FormFieldContext = React.createContext<FormFieldContextValue>(
     {} as FormFieldContextValue,
   );

   const FormField = <
     TFieldValues extends FieldValues = FieldValues,
     TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
   >({
     ...props
   }: ControllerProps<TFieldValues, TName>) => {
     return (
       <FormFieldContext.Provider value={{ name: props.name }}>
         <Controller {...props} />
       </FormFieldContext.Provider>
     );
   };

   // ... resto da implementação
   ```

3. **Migrar Componentes de Layout**
   ```bash
   npx shadcn@latest add separator sheet dialog drawer
   ```

### **FASE 3: Seções e Integração (2-3 dias)**

#### 🎯 **Objetivos**

- Migrar seções da landing page
- Atualizar imports e dependências
- Testar integração completa

#### 📋 **Tarefas**

1. **Atualizar Seções**

   ```tsx
   // components/sections/hero/hero.tsx
   import { Button } from "@/components/ui/button";
   import { Badge } from "@/components/ui/badge";
   import { Card, CardContent } from "@/components/ui/card";

   // Usar componentes shadcn/ui ao invés de customizados
   ```

2. **Atualizar Composition System**
   - Verificar compatibilidade com Composition-First Architecture
   - Manter isolamento entre UI e lógica de negócio

3. **Testes de Integração**
   - Validar que todos os componentes funcionam
   - Verificar performance e acessibilidade
   - Executar testes existentes

### **FASE 4: Otimização e Polish (1-2 dias)**

#### 🎯 **Objetivos**

- Otimizar performance
- Melhorar acessibilidade
- Documentar mudanças

#### 📋 **Tarefas**

1. **Performance Optimization**
   - Remover código não utilizado
   - Otimizar bundle size
   - Verificar Core Web Vitals

2. **Acessibilidade**
   - Validar com ferramentas de acessibilidade
   - Garantir navegação por teclado
   - Verificar contrast ratios

3. **Documentação**
   - Atualizar guias de desenvolvimento
   - Documentar novos padrões
   - Criar exemplos de uso

---

## 🧪 **Impacto nos Testes**

### ⚠️ **Testes Quebrados (Esperado)**

Após a migração para shadcn/ui, **77 testes falharam** devido a mudanças esperadas:

#### **Visual Regression Tests (35 falhas)**

- Classes CSS mudaram: `rounded-2xl` → diferentes estruturas
- Componentes visuais alterados: Card, Button, Badge
- Layouts responsivos afetados pela nova estrutura

#### **Accessibility Tests (18 falhas)**

- Atributos ARIA mudaram com Radix UI
- Estrutura DOM alterada
- Navegação por teclado afetada

#### **SEO Tests (12 falhas)**

- Meta tags e Open Graph não renderizando
- Headings hierarchy alterada
- Language attributes afetados

#### **Security Tests (12 falhas)**

- Sanitização e validação mudaram
- CSP headers diferentes
- XSS prevention alterada

### ✅ **Testes Que Continuaram Funcionando**

- **Testes unitários** de lógica de negócio
- **Testes de API** e integrações
- **Testes de performance** não-visuais
- **Testes de configuração** do sistema

### 🔧 **Estratégia de Correção**

#### **Fase 1: Atualização Imediata (1-2 dias)**

```typescript
// Atualizar testes visuais para novas classes
expect(card).toHaveClass("rounded-lg"); // shadcn/ui padrão
expect(button).toHaveAttribute("type", "button"); // Radix UI
```

#### **Fase 2: Refatoração Completa (2-3 dias)**

```typescript
// Usar queries mais robustas
const button = screen.getByRole("button", { name: /primary/i });
expect(button).toHaveClass("bg-primary"); // Focus no comportamento
```

#### **Fase 3: Testes de Regressão (1 dia)**

- Criar snapshots atualizados
- Validar acessibilidade WCAG 2.1 AA
- Confirmar performance mantida

---

## 🎨 **Design System Customization**

### **Mantendo Identidade Visual**

```css
/* styles/globals.css */
@layer base {
  :root {
    /* Design System Customizado */
    --color-primary-500: 258 90% 60%;
    --font-inter: "Inter", system-ui, sans-serif;

    /* shadcn/ui Variables */
    --background: hsl(var(--color-neutral-50));
    --foreground: hsl(var(--color-neutral-900));
    --card: hsl(0 0% 100%);
    --card-foreground: hsl(var(--color-neutral-900));
    --primary: hsl(var(--color-primary-500));
    --primary-foreground: hsl(var(--color-primary-foreground));
    /* ... */
  }
}
```

### **Theme Customization**

```typescript
// lib/theme/theme-config.ts
export const themeConfig = {
  light: {
    background: "hsl(var(--color-neutral-50))",
    foreground: "hsl(var(--color-neutral-900))",
    // ...
  },
  dark: {
    background: "hsl(var(--color-neutral-900))",
    foreground: "hsl(var(--color-neutral-50))",
    // ...
  },
};
```

---

## 🧪 **Testing Strategy**

### **Testes a Manter**

- ✅ Testes de integração (Composition-First)
- ✅ Testes de acessibilidade
- ✅ Testes de performance
- ✅ Testes visuais (Chromatic/VRT)

### **Testes a Atualizar**

- 🔄 Testes de componentes (usar testing-library com shadcn/ui)
- 🔄 Testes de design system (validar tokens customizados)

### **Novos Testes**

- ➕ Testes de componentes shadcn/ui customizados
- ➕ Testes de variants e themes
- ➕ Testes de acessibilidade aprimorados

---

## 📊 **Métricas de Sucesso**

### **Performance**

- **Bundle Size**: Redução de 20-30%
- **Lighthouse Score**: Manter ≥ 90
- **Core Web Vitals**: Sem regressão

### **Qualidade**

- **Component Coverage**: 100% dos componentes migrados
- **Accessibility**: WCAG 2.1 AA compliance
- **Type Safety**: 100% TypeScript coverage

### **Developer Experience**

- **Build Time**: Sem impacto negativo
- **Hot Reload**: Funcionamento preservado
- **Documentation**: Guias atualizados

---

## 🚨 **Riscos e Mitigações**

### **Riscos Identificados**

1. **Quebra de Compatibilidade**
   - **Mitigação**: Migração gradual, testes abrangentes

2. **Regressão Visual**
   - **Mitigação**: Testes visuais, design review

3. **Performance Impact**
   - **Mitigação**: Otimização de bundle, lazy loading

4. **Curva de Aprendizado**
   - **Mitigação**: Documentação detalhada, training

### **Plano de Rollback**

- Commits separados por componente
- Branches de backup
- Documentação de mudanças

---

## 📋 **Checklist de Migração**

### **Pré-Migração**

- [ ] Backup do código atual
- [ ] Testes passando (100%)
- [ ] Design system documentado
- [ ] Equipe treinada em shadcn/ui

### **Durante Migração**

- [ ] Componentes instalados via CLI
- [ ] Design tokens customizados preservados
- [ ] Componentes migrados um por vez
- [ ] Testes atualizados e passando

### **Pós-Migração**

- [ ] Performance validada
- [ ] Acessibilidade verificada
- [ ] Documentação atualizada
- [ ] Equipe treinada nos novos padrões

---

## 📚 **Recursos e Referências**

### **Documentação Oficial**

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [Radix UI Primitives](https://www.radix-ui.com/)
- [Tailwind CSS](https://tailwindcss.com/)

### **Guias de Migração**

- [Converting to shadcn/ui](https://ui.shadcn.com/docs/migrating)
- [Customizing Components](https://ui.shadcn.com/docs/theming)

### **Exemplos**

- [shadcn/ui Examples](https://ui.shadcn.com/examples)
- [Component Showcase](https://ui.shadcn.com/components)

---

## 🎯 **Próximos Passos**

1. **Revisar e aprovar** este plano de migração
2. **Criar branch** `feat/migrate-shadcn-ui`
3. **Instalar componentes** essenciais
4. **Migrar componentes base** (Button, Card, Badge)
5. **Testar integração** completa
6. **Deploy gradual** com feature flags

**Tempo Estimado**: 5-7 dias
**Risco**: Baixo (migração gradual)
**Benefícios**: Melhor manutenibilidade, performance e consistência

---

**🚀 Pronto para revolucionar o design system?**

_Documento criado em: $(date)_
_Versão: 1.0_
_Responsável: AI Assistant_
