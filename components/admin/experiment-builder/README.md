# 🎨 Visual Experiment Builder

Sistema visual completo para criação e edição de experimentos A/B de forma intuitiva e sem código.

## 🚀 Visão Geral

O Visual Experiment Builder transforma a criação de experimentos A/B em uma experiência visual drag-and-drop, permitindo que qualquer usuário (não apenas desenvolvedores) crie, edite e publique testes de otimização de conversão.

## ✨ Características Principais

### 🎯 Interface Visual Intuitiva

- **Drag-and-Drop**: Arraste elementos da barra lateral para o canvas
- **WYSIWYG Editor**: Edite texto e estilos diretamente na tela
- **Multi-device Preview**: Visualize em desktop, tablet e mobile
- **Real-time Feedback**: Veja mudanças instantaneamente

### 🧪 Gerenciamento de Experimentos

- **Múltiplas Variantes**: Crie quantas variantes precisar
- **Distribuição de Tráfego**: Controle granular (1%-100% por variante)
- **Traffic Allocation Visual**: Sliders intuitivos para distribuição
- **Variant Cloning**: Duplique variantes existentes rapidamente

### 📊 Analytics Integrado

- **Real-time Metrics**: Visualize dados em tempo real
- **Statistical Significance**: Indicadores visuais de significância
- **Winner Detection**: Auto-detecção de variantes vencedoras
- **Conversion Tracking**: Métricas de conversão por variante

### 🔧 Recursos Avançados

- **Undo/Redo**: Sistema completo de desfazer/refazer
- **Auto-save**: Salvamento automático de rascunhos
- **Keyboard Shortcuts**: Atalhos para produtividade
- **Property Panel**: Edição detalhada de propriedades

## 🏗️ Arquitetura

### Componentes Principais

```
VisualExperimentBuilder (Orquestrador principal)
├── Toolbar (Controles principais)
├── ExperimentCanvas (Área de trabalho)
│   ├── Element Toolbox (Barra de elementos)
│   └── Canvas Area (Área de edição)
├── VariantPanel (Gerenciamento de variantes)
└── PropertyPanel (Edição de propriedades)
```

### Fluxo de Dados

```
User Actions → Builder Actions → Reducer → State Update → UI Re-render
                      ↓
              Auto-save Draft → Local Storage
                      ↓
            Publish → Experiment Engine → Database
```

## 🎨 Elementos Suportados

### 📝 Texto e Títulos

- Edição inline de texto
- Controle de tamanho e cor
- Múltiplos níveis de título (H1-H3)

### 🔘 Botões

- Texto e links customizáveis
- Estilos visuais (cores, bordas, etc.)
- Estados hover e focus

### 🖼️ Imagens

- Upload e substituição visual
- Controle de dimensões
- Placeholder inteligente

### 🔗 Links

- Texto e URLs customizáveis
- Estilos de link
- Validação automática

## 🛠️ Como Usar

### 1. Criar Novo Experimento

```typescript
// Acesse /admin/experiment-builder
// Interface visual guia o processo completo
```

### 2. Adicionar Variantes

```typescript
// Clique em "Adicionar Variante"
// Configure distribuição de tráfego
// Clone variantes existentes
```

### 3. Editar Visualmente

```typescript
// Arraste elementos para o canvas
// Clique para selecionar e editar
// Use property panel para ajustes finos
```

### 4. Publicar Experimento

```typescript
// Validação automática de requisitos
// Publicação com um clique
// Monitoramento em tempo real
```

## 🔧 API e Integração

### Hook Principal

```typescript
const { state, actions, computed } = useExperimentBuilder(experimentId);
```

### Actions Disponíveis

```typescript
actions.addVariant(); // Adicionar variante
actions.updateVariant(); // Atualizar variante
actions.selectVariant(); // Selecionar variante
actions.saveExperiment(); // Salvar experimento
actions.publishExperiment(); // Publicar experimento
```

### State Structure

```typescript
interface BuilderState {
  experiment: Experiment;
  variants: VisualVariant[];
  mode: "design" | "preview";
  selectedVariantId: string;
  selectedElementId: string;
  // ... outros campos
}
```

## 📱 Responsividade

### Breakpoints Suportados

- **Mobile**: 375px width
- **Tablet**: 768px width
- **Desktop**: 1200px width

### Device Preview

- Switching instantâneo entre dispositivos
- Preview em tempo real
- Ajustes específicos por breakpoint

## 🎯 Próximos Passos

### Fase 2: Enhanced Analytics

- Gráficos detalhados de performance
- Funnel analysis integrado
- Revenue impact projection
- Automated reporting

### Fase 3: Collaboration Features

- Multi-user editing
- Change history e audit
- Comments e approval workflow
- Template sharing

### Fase 4: Advanced Personalization

- Segment-based targeting
- Dynamic content injection
- AI-powered variant generation
- Predictive optimization

## 🔒 Segurança e Performance

### Segurança

- Validação de todos os inputs
- Sanitização de HTML/conteúdo
- Rate limiting em saves
- Audit logging completo

### Performance

- Virtual scrolling para muitos elementos
- Lazy loading de componentes pesados
- Optimized re-renders
- Bundle splitting inteligente

## 📊 Métricas de Sucesso

### Usabilidade

- Time to first experiment: < 5 minutos
- Learning curve: < 1 hora
- User satisfaction: > 90%

### Performance Técnica

- Load time: < 2 segundos
- Memory usage: < 50MB
- Bundle size: < 200KB
- Lighthouse score: > 95

### Business Impact

- +300% experimentos criados/mês
- +25% melhoria em conversão
- ROI positivo em 2-3 meses
- Democratização de otimização

---

**Construído com ❤️ para revolucionar A/B testing** 🚀
