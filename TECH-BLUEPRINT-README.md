# 🎨 Tech Blueprint Theme - Standalone

Um tema CSS completo para interfaces técnicas com estética de blueprint/planta baixa.

## ✨ Características

- **Fundo escuro técnico** com grid blueprint sutil
- **Tipografia monospace** para aparência técnica
- **Efeitos de glow** e animações precisas
- **Componentes reutilizáveis** (cards, botões, grids)
- **Acessibilidade** com foco visível
- **Responsivo** para mobile e desktop

## 🚀 Como Usar

### 1. Importar o CSS

```html
<!-- Importar o tema -->
<link rel="stylesheet" href="tech-blueprint-standalone.css" />

<!-- Aplicar no HTML root -->
<html data-theme="tech-blueprint">
  <body class="blueprint-bg">
    <!-- Seu conteúdo aqui -->
  </body>
</html>
```

### 2. Usar Componentes

```html
<!-- Card básico -->
<div class="blueprint-card">
  <h3 class="blueprint-heading">Sistema de Controle</h3>
  <p class="blueprint-label">Status: Online</p>
  <button class="btn-blueprint">Executar</button>
</div>

<!-- Grid responsivo -->
<div class="blueprint-grid">
  <div class="blueprint-card">Item 1</div>
  <div class="blueprint-card">Item 2</div>
  <div class="blueprint-card">Item 3</div>
</div>

<!-- Terminal simulado -->
<div class="blueprint-terminal">Sistema inicializado com sucesso</div>
```

## 🎨 Personalização

### Variáveis CSS Principais

```css
:root[data-theme="tech-blueprint"] {
  --bg: oklch(20% 0.03 220); /* Fundo */
  --fg: oklch(95% 0.03 220); /* Texto */
  --primary: oklch(60% 0.23 200); /* Azul blueprint */
  --secondary: oklch(55% 0.17 160); /* Azul secundário */
  --accent: oklch(60% 0.23 40); /* Destaques */
  --border: oklch(25% 0.08 220); /* Bordas */
}
```

### Modificar Cores

```css
/* Para um blueprint mais vibrante */
:root[data-theme="tech-blueprint"] {
  --primary: oklch(70% 0.3 210);
  --bg: oklch(15% 0.05 230);
}
```

## 📦 Componentes Disponíveis

### Layout

- `.blueprint-bg` - Fundo com grid blueprint
- `.blueprint-grid` - Grid responsivo
- `.blueprint-stack` - Stack vertical

### Componentes

- `.blueprint-card` - Card com efeito grid
- `.blueprint-terminal` - Terminal simulado
- `.blueprint-circuit` - Efeito de circuito animado

### Tipografia

- `.blueprint-heading` - Título técnico
- `.blueprint-subheading` - Subtítulo com borda
- `.blueprint-label` - Label monospace

### Interação

- `.btn-blueprint` - Botão técnico básico
- `.btn-blueprint-outline` - Botão com outline
- `.blueprint-interactive` - Elemento hoverável

### Animações

- `.blueprint-enter` - Entrada com scan
- `.blueprint-fade` - Fade suave
- `.blueprint-glow` - Glow pulsante

## 🎯 Casos de Uso

- **Dashboards técnicos**
- **Aplicações de controle industrial**
- **Interfaces de monitoramento**
- **Ferramentas de desenvolvimento**
- **Documentação técnica interativa**

## 📄 Licença

Este tema é parte do design system do projeto Landing Page SaaS.
Sinta-se à vontade para usar e adaptar conforme necessário.

## 🔧 Suporte

Para questões ou contribuições, consulte o repositório principal do projeto.
