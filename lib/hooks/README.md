# Sistema de Scroll Storytelling

## Visão Geral

O sistema de scroll storytelling implementa navegação progressiva por capítulos da landing page, com pinagem automática, transições visuais e navegação acessível.

## Arquitetura

### Core Components

#### `useScrollStorytelling`

Hook principal que gerencia o estado e lógica da navegação por scroll.

**Responsabilidades:**

- Rastreamento de posição de scroll
- Cálculo de progresso de capítulos
- Gestão de transições entre capítulos
- Navegação programática
- Histórico de navegação
- Análise de alturas (calculadas vs DOM)

**Interfaces:**

```typescript
interface Chapter {
  id: string;
  title: string;
  anchor: string;
  type: "hero" | "pinned" | "scroll" | "cta";
  height: { min: number; max: number };
  subScenes?: number;
  zIndex?: number;
}

interface ChapterProgress {
  chapterId: string;
  progress: number; // 0-1 within chapter
  globalProgress: number; // 0-1 across entire page
  isActive: boolean;
  subScene?: number;
  subSceneProgress?: number;
}
```

#### `ScrollStorytellingDebug`

Componente de desenvolvimento para visualizar métricas de scroll.

**Informações exibidas:**

- Altura total da página
- Posições calculadas de capítulos
- Alturas efetivas (calculadas vs DOM)
- Número de capítulos

### Componentes de UI

#### `ChapterNavigation`

Sistema de navegação acessível com múltiplas variantes.

**Variantes:**

- `sidebar`: Lista completa com progresso
- `floating`: Botões móveis minimalistas
- `fixed-bottom`: Navegação inferior completa

**Funcionalidades:**

- Navegação anterior/próximo
- Pulo para capítulo específico
- Navegação por teclado (↑↓, PageUp/Down, Home/End, Ctrl+1-9)
- Indicadores visuais de progresso

#### `ChapterTransitionOverlay`

Sistema de transições visuais entre capítulos.

**Tipos de transição:**

- `crossfade`: Fade com blur de fundo
- `wipe`: Varredura líquida com gradientes
- `none`: Sem transição

**Respeita `prefers-reduced-motion`**

#### `ChapterStepper`

Indicador de progresso para capítulos com sub-cenas.

**Variações:**

- `horizontal`: Barra de progresso com steps
- `vertical`: Bolinhas alinhadas à direita

#### `PinnedChapter`

Container para capítulos que ficam fixados durante scroll.

**Características:**

- Pinagem automática baseada na posição
- Cálculo de progresso de sub-cenas
- Otimização para mobile (desabilita pinagem)
- Spacer para manter fluxo do documento

### Hooks Utilitários

#### `useReducedMotion`

Detecta preferência do usuário por movimento reduzido.

#### `useKeyboardNavigation`

Gerencia navegação por teclado com debounce e filtros de contexto.

#### `useChapterStepper`

Calcula estado de progresso para múltiplas sub-cenas.

### Performance

**Otimizações implementadas:**

- Debounce/throttling de eventos de scroll
- Memoização de cálculos pesados
- `requestAnimationFrame` para animações
- `layoutEffect: false` para prevenir hydration issues
- Virtualização de cálculos de posição

**Métricas de performance:**

- Scroll handler: ~16ms throttle (60fps)
- Cálculos de progresso: memoizados
- Transições: 150-320ms duration

### Acessibilidade

**Funcionalidades implementadas:**

- Navegação por teclado completa
- Labels ARIA apropriados
- Ordem de foco lógica
- Respeito a `prefers-reduced-motion`
- Contraste adequado
- Tamanho mínimo de toque (44px)

### Debug e Desenvolvimento

#### Debug Components

- `ScrollStorytellingDebug`: Métricas de scroll
- `ExperimentDebug`: Estado de A/B tests

#### Ferramentas de desenvolvimento

- Debug info exposta no hook principal
- Console logging de transições
- Visualização de posições calculadas

### Configuração

```typescript
const storytelling = useScrollStorytelling({
  chapters: DEFAULT_CHAPTERS,
  transitionDuration: 320,
  enableAnalytics: true,
  enablePinning: true,
});
```

### Fluxo de Dados

1. **Scroll Detection** → `useScroll` (Framer Motion)
2. **Position Calculation** → Hook interno com memoização
3. **Chapter Progress** → Cálculo baseado em posições
4. **UI Updates** → Components renderizam baseado no progresso
5. **Analytics** → Eventos trackeados via `lib/analytics`

### Extensibilidade

**Pontos de extensão:**

- Novos tipos de capítulo
- Transições customizadas
- Estratégias de pinagem
- Variants de navegação

**Separação de responsabilidades:**

- Hook: Lógica pura
- Components: Apresentação
- Utils: Cálculos compartilhados

### Troubleshooting

**Problemas comuns:**

1. **Hydration mismatches**: Verificar `layoutEffect: false`
2. **Performance issues**: Verificar throttling de scroll
3. **Alturas incorretas**: Verificar cálculos vs DOM real
4. **Transições não funcionam**: Verificar `prefers-reduced-motion`

**Debug steps:**

1. Habilitar `ScrollStorytellingDebug`
2. Verificar console para logs de transição
3. Testar navegação por teclado
4. Verificar responsividade
