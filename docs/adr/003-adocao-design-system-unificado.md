# ADR 003: Adoção de Design System Unificado com Single Source of Truth

## Status

✅ **Aceito**

## Contexto

A landing page Luminaris precisa de consistência visual que:

- **Mantenha identidade visual**: Mesmo look em todas as seções
- **Permita evolução**: Mudanças globais sem refactoring massivo
- **Seja acessível**: Contraste e navegação adequados
- **Suporte temas**: Light/dark mode quando necessário
- **Seja performático**: CSS otimizado e tree-shakeable
- **Permita personalização**: Variações por componente sem duplicação

Atualmente usamos Tailwind CSS + shadcn/ui, mas precisamos formalizar como **Design System** com tokens centralizados.

## Decisão

Adotamos **Design System Unificado** baseado em:

1. **Tokens centralizados**: Cores, tipografia, espaçamento em um local
2. **Componentes atômicos**: Base consistente com variações
3. **CSS auto-gerado**: De tokens para estilos finais
4. **Design tokens**: API consistente para temas
5. **Acessibilidade built-in**: Componentes acessíveis por padrão

## Alternativas Consideradas

### 1. Tailwind Utility-Only

```tsx
<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
  Button
</button>
```

**Problemas**:
- Classes hardcoded em componentes
- Mudanças visuais requerem find/replace
- Inconsistência entre devs
- Sem garantias de acessibilidade

### 2. CSS Modules puros

```css
/* Button.module.css */
.btn {
  background: var(--color-primary);
  padding: var(--space-md);
}
```

**Problemas**:
- Duplicação de estilos similares
- Sem sistema de variantes
- CSS não tipado
- Difícil manter consistência

### 3. Styled Components

```tsx
const Button = styled.button`
  background: ${props => props.theme.colors.primary};
  padding: ${props => props.theme.spacing.md};
`
```

**Problemas**:
- Runtime overhead
- CSS-in-JS complexo
- Sem tree-shaking nativo
- Debugging mais difícil

## Implementação

### 1. Design Tokens

```typescript
// design-system/tokens/colors.ts
export const colorTokens = {
  primary: {
    50: "258 90% 98%",
    100: "258 90% 96%",
    500: "258 90% 60%",  // Main color
    900: "258 90% 20%"
  },
  neutral: {
    50: "210 20% 98%",
    100: "210 20% 96%",
    900: "210 20% 10%"
  }
} as const

// design-system/tokens/typography.ts
export const typographyTokens = {
  fontFamily: {
    display: "'Inter Tight', sans-serif",
    body: "'Inter', sans-serif"
  },
  fontSize: {
    xs: "0.75rem",    // 12px
    sm: "0.875rem",   // 14px
    base: "1rem",     // 16px
    lg: "1.125rem",   // 18px
    xl: "1.25rem",    // 20px
    '2xl': "1.5rem",  // 24px
    '3xl': "1.875rem", // 30px
    '4xl': "2.25rem",  // 36px
    '5xl': "3rem",     // 48px
    '6xl': "3.75rem"   // 60px
  }
} as const
```

### 2. CSS Auto-gerado

```css
/* design-system/foundations/theme.css (gerado automaticamente) */
:root {
  /* Colors */
  --color-primary-50: 258 90% 98%;
  --color-primary-500: 258 90% 60%;
  --color-neutral-900: 210 20% 10%;

  /* Typography */
  --font-display: 'Inter Tight', sans-serif;
  --font-body: 'Inter', sans-serif;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;

  /* Spacing */
  --space-xs: 0.25rem;   /* 4px */
  --space-sm: 0.5rem;    /* 8px */
  --space-md: 1rem;      /* 16px */
  --space-lg: 1.5rem;    /* 24px */
  --space-xl: 2rem;      /* 32px */
}
```

### 3. Componentes com Design System

```typescript
// components/ui/button.tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground"
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-10 px-4 py-2",
        lg: "h-11 px-8",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md"
    }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}
```

### 4. Sistema de Temas

```typescript
// design-system/themes/index.ts
export const themes = {
  light: {
    colors: {
      background: "hsl(0 0% 100%)",
      foreground: "hsl(222.2 84% 4.9%)",
      primary: "hsl(258 90% 60%)",
      secondary: "hsl(210 40% 96%)"
    }
  },
  dark: {
    colors: {
      background: "hsl(222.2 84% 4.9%)",
      foreground: "hsl(210 40% 98%)",
      primary: "hsl(258 90% 65%)",
      secondary: "hsl(217.2 32.6% 17.5%)"
    }
  }
} as const

// app/layout.tsx
import { ThemeProvider } from '@/components/theme-provider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### 5. Acessibilidade Built-in

```typescript
// components/ui/button.tsx (continuação)
export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      // Acessibilidade automática
      aria-disabled={props.disabled}
      // Foco visível por padrão
      // Contraste garantido pelos tokens
      {...props}
    />
  )
}

// Teste de acessibilidade
describe('Button', () => {
  it('should have sufficient color contrast', () => {
    // Testa contraste automático baseado nos tokens
  })

  it('should be keyboard navigable', () => {
    // Testa foco e navegação
  })
})
```

## Consequências

### Positivas

- **Consistência**: Mesmo visual em toda a aplicação
- **Manutenibilidade**: Mudanças globais em um lugar
- **Acessibilidade**: Componentes acessíveis por padrão
- **Performance**: CSS otimizado e tree-shakeable
- **Developer Experience**: API tipada e autocomplete

### Negativas

- **Setup inicial**: Mais configuração para tokens
- **Build time**: Geração automática de CSS
- **Abstração**: Camada extra entre design e código

### Riscos

- **Tokens mal definidos**: Inconsistência se tokens forem pobres
- **Over-customization**: Muitos variants tornam sistema complexo
- **Maintenance overhead**: Evolução dos tokens pode quebrar componentes

## Métricas de Sucesso

- **Uso consistente**: 100% dos componentes usam Design System
- **Acessibilidade**: WCAG AA compliance automática
- **Performance**: Bundle CSS ≤ 20KB
- **Manutenibilidade**: Mudanças visuais levam < 30min
- **Developer satisfaction**: API intuitiva (feedback qualitativo)

## Próximos Passos

1. **Audit atual**: Mapear componentes existentes vs Design System
2. **Migração gradual**: Converter componentes para usar tokens
3. **Storybook**: Documentação visual interativa
4. **Figma integration**: Sync automático com design tokens
5. **Theme builder**: Ferramenta para criar novos temas

## Referências

- [Design Tokens - Salesforce](https://www.lightningdesignsystem.com/design-tokens/)
- [Building Design Systems - Figma](https://www.figma.com/blog/building-design-systems/)
- [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [Class Variance Authority](https://cva.style/)

## Data da Decisão

2025-01-15

## Responsável

@team-design
