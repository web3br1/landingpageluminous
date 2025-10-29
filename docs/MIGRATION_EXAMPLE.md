# 📋 **Exemplo Prático: Migração Button Component**

## 🎯 **Antes vs Depois da Migração**

### ❌ **ANTES - Componente Customizado**

```tsx
// components/ui/button.tsx (versão antiga)
export function Button({
  variant = "default",
  size = "default",
  children,
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors";
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-red-500 text-white hover:bg-red-600",
    outline: "border border-gray-300 bg-white hover:bg-gray-50",
    // ...
  };

  return (
    <button className={`${baseClasses} ${variants[variant]}`} {...props}>
      {children}
    </button>
  );
}
```

### ✅ **DEPOIS - shadcn/ui + CVA**

```tsx
// components/ui/button.tsx (shadcn/ui)
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
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

## 🔄 **Como Usar na Migração**

### **1. Atualizar Imports**

```tsx
// ❌ Antes
import { Button } from "@/components/ui/button";

// ✅ Depois (mesmo import!)
import { Button } from "@/components/ui/button";
```

### **2. API Compatível**

```tsx
// ✅ Funciona igual - API backward compatible
<Button variant="destructive" size="lg">
  Delete Item
</Button>

// ✅ Novos variants disponíveis
<Button variant="outline">Outline Button</Button>
<Button variant="ghost">Ghost Button</Button>
<Button variant="link">Link Button</Button>
```

### **3. Type Safety Aprimorado**

```tsx
// ✅ TypeScript detecta erros em compile time
<Button variant="invalid"> // ❌ TypeScript error
<Button variant="destructive" size="invalid"> // ❌ TypeScript error
```

## 🎨 **Benefícios da Migração**

### **Performance**

- **Bundle Size**: Redução de ~30% com tree-shaking
- **Runtime**: Componentes otimizados por padrão
- **CSS**: Apenas classes necessárias são incluídas

### **Acessibilidade**

- **Radix UI**: Primitives acessíveis por padrão
- **Focus Management**: Navegação por teclado garantida
- **ARIA**: Atributos apropriados automaticamente

### **Developer Experience**

- **Type Safety**: Props type-safe com VariantProps
- **IntelliSense**: Autocomplete completo no IDE
- **Documentação**: Componentes auto-documentados

### **Manutenibilidade**

- **Consistência**: Padrões unificados
- **Updates**: Fácil atualização via CLI
- **Comunidade**: Mantido pela comunidade

## 🚀 **Próximos Passos**

1. **Migrar Componentes**: Card, Badge, Alert já migrados
2. **Atualizar Seções**: Usar novos componentes nas seções
3. **Testar**: Validar que tudo funciona corretamente
4. **Documentar**: Atualizar guias de uso

---

**🎉 shadcn/ui traz modernidade e qualidade profissional ao seu projeto!**
