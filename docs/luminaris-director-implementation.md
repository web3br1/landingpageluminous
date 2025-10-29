# 🎬 LUMINARIS - Advanced Animation Control (Director's Rig)

_Sistema completo de controle de animações para storytelling narrativo determinístico_

---

## 📋 **Sistema Implementado - Visão Geral**

### ✅ **Componentes Core**

1. **Layers Model** - Sistema de camadas com prioridades (BG/MID/FG/FX)
2. **Timeline Semantic** - Cues, markers e regions narrativos
3. **Director API** - Interface unificada de coreografia
4. **Preemption System** - Interrupções inteligentes por prioridade
5. **Scroll Sync** - Sincronização determinística com histerese
6. **Debug Rig** - HUD interativo para desenvolvimento

### ✅ **Tokens Expandidos**

- **Motion Tokens**: 25+ easings, springs e timings
- **Context Tokens**: Layer-specific e component-aware
- **Reduced Motion**: Mapeamento automático para acessibilidade

---

## 🎭 **Modelo de Camadas (Layers Model)**

### **Hierarquia de Prioridade**

```
FX (4) > FG (3) > MID (2) > BG (1)
```

### **Limites por Camada**

- **BG**: 2 animações simultâneas (background/orbs/particles)
- **MID**: 3 animações simultâneas (content/cards/headings)
- **FG**: 2 animações simultâneas (overlays/CTAs/feedback)
- **FX**: 1 animação simultânea (wipes/crossfades)

### **API de Controle**

```typescript
import { LayerManager, AnimationLayer } from "./layers-model";

// Verificar se pode iniciar
const canStart = layerManager.canStartAnimation(AnimationLayer.FG, "ctaGlow");

// Interromper por preempção
layerManager.interruptAnimation("oldAnimation", InterruptionType.PREEMPTION);

// Bloquear camada temporariamente
layerManager.lockLayer(AnimationLayer.BG); // Starvation protection
```

---

## ⏱️ **Timeline Semântica**

### **Estrutura Narrativa**

```typescript
interface TimelineDefinition {
  id: string;
  chapterId: "hero" | "howItWorks" | "pricing"; // etc
  duration: number; // ms
  markers: TimelineMarker[]; // Pontos nomeados
  cues: TimelineCue[]; // Triggers nomeados
  regions: TimelineRegion[]; // Áreas com propriedades
}
```

### **Markers Predefinidos**

```typescript
// Hero Chapter
const heroMarkers = [
  { id: "enter", time: 0 },
  { id: "ctaGlow", time: 900 },
  { id: "exit", time: 2400 },
];

// How It Works Chapter
const howMarkers = [
  { id: "A", time: 0 },
  { id: "B", time: 800 },
  { id: "C", time: 1600 },
];
```

### **Cues e Triggers**

```typescript
const heroCues = [
  { id: "hero.enter", markerId: "enter", action: "start" },
  {
    id: "hero.ctaGlow",
    markerId: "ctaGlow",
    action: "start",
    targetAnimation: "ctaGlow",
  },
];

// Trigger cue
director.cue("hero.ctaGlow");
```

---

## 🎬 **Director API - Coreografia Centralizada**

### **Interface Principal**

```typescript
import { director } from "./director-api";

// Criar timeline
const timeline = director.createTimeline("hero", {
  layer: AnimationLayer.FG,
  priority: 3,
});

// Controlar execução
director.play("hero");
director.pause("hero");
director.cancel("hero", { graceMs: 300 }); // Soft cancel

// Seek para scrubbing
director.seek("hero", 1500); // 1.5s

// Velocidade (reduced motion)
director.setSpeed("hero", 0.7);

// Bind com scroll
director.bindScroll("hero", {
  rangePx: { start: 0, end: 1000 },
  progress$: { min: 0, max: 1 },
  damping: 0.1,
});
```

### **Controle de Camadas**

```typescript
// Bloquear preempções
director.lock(AnimationLayer.BG); // Starvation protection

// Verificar se pode aceitar nova animação
const canAccept = director.canAcceptAnimation(AnimationLayer.FG, "newCTA");

// Status completo
const status = director.getStatus(); // Layers, timelines, budget
```

---

## ⚡ **Sistema de Preempção**

### **Lógica de Prioridade**

```typescript
// FX sempre preempta tudo
// FG preempta MID e BG
// MID preempta BG
// BG nunca preempta nada

if (requestingPriority > existingPriority) {
  // Preempt lower priority animations
  preemptLowerPriorityAnimations();
}
```

### **Proteção contra Starvation**

```typescript
// Se uma camada for preemptada >2x em 2s, bloquear por 3s
if (preemptionCount > 2) {
  activateStarvationProtection(layer, 3000);
}
```

### **Tipos de Interrupção**

```typescript
enum InterruptionType {
  SOFT = "soft", // Complete easing then clean up
  HARD = "hard", // Immediate cleanup
  PREEMPTION = "preemption", // Higher priority takes over
}
```

---

## 📜 **Scroll Sync Determinístico**

### **Histerese para Estabilidade**

```typescript
// Dead zone de 2% para evitar flickering
const DEAD_ZONE = 0.02;
const HYSTERESIS_THRESHOLD = 5; // px

// Só atualiza se movimento significativo
if (progressDelta > DEAD_ZONE && scrollDelta > HYSTERESIS_THRESHOLD) {
  updateProgress(newProgress);
}
```

### **Damping Suave**

```typescript
// Suavização progressiva
const DAMPING_FACTOR = 0.1;
currentProgress += (targetProgress - currentProgress) * DAMPING_FACTOR;
```

### **Pin Chapters Específicos**

```typescript
// Apenas How It Works e Use Cases são pinned
const PINNED_CHAPTERS = ["howItWorks", "useCases"];

// Offset para pinning
const PIN_OFFSET = window.innerHeight * 0.5;
```

---

## 🎨 **Motion Tokens Expandidos**

### **25+ Easings Contextuais**

```typescript
EASE_TOKENS = {
  standard: [0.2, 0.8, 0.2, 1], // Default UI
  entrance: [0.2, 0, 0.2, 1], // Entry animations
  emphasis: [0.12, 0.8, 0.24, 1], // Attention-grabbing
  bg: [0.25, 1, 0.5, 1], // Slower backgrounds
  fg: [0.15, 0.85, 0.25, 1], // Snappier foreground
  fx: [0.1, 0.9, 0.2, 1], // Fastest effects
};
```

### **Springs Físicos**

```typescript
SPRING_TOKENS = {
  soft: { stiffness: 160, damping: 22 },
  snappy: { stiffness: 260, damping: 20 },
  bouncy: { stiffness: 180, damping: 12 },
  cardHover: { stiffness: 200, damping: 18 },
  buttonTap: { stiffness: 400, damping: 25 },
};
```

### **Reduced Motion Mappings**

```typescript
// Transform → Opacity
translate: 'opacity',
scale: 'opacity',
blur: 'none',
rotate: 'none'
```

---

## 🖥️ **Debug Rig - HUD Interativo**

### **Painel Flutuante**

```typescript
<LuminarisDebugRig /> // Ctrl+Shift+D para toggle
```

### **Métricas em Tempo Real**

- **Performance**: FPS, Memory, Concurrent Animations
- **Layers**: Ativas por camada (BG/MID/FG/FX)
- **Scroll**: Velocity, Direction, Hysteresis status
- **Timelines**: Active instances, Preemption events

### **Controles Interativos**

```typescript
// Botões de controle
🛑 STOP    // Emergency stop all
🎭 Layers  // Lock/unlock layers
📜 Scroll  // Scroll sync status
⏱️ Timelines // Cue triggers

// Keyboard shortcuts
Ctrl+Shift+D // Toggle debug
Ctrl+Shift+E // Emergency stop
```

---

## 📊 **Checklist de Coreografia**

### **Por Capítulo**

| Capítulo     | Hue  | CTA       | Cards     | Vidro  | Animações      |
| ------------ | ---- | --------- | --------- | ------ | -------------- |
| Hero         | 280° | Primary   | —         | Badge  | Fade + orbes   |
| How It Works | 200° | Secondary | Secondary | Painel | Pin + morph    |
| Use Cases    | 190° | Secondary | Secondary | —      | Tabs + stagger |
| Features     | 290° | Secondary | Spacious  | —      | Grid reveal    |
| Pricing      | 40°  | Promo     | Primary   | Halo   | ROI tween      |
| CTA Final    | 340° | Primary   | Primary   | —      | Pulse 1x       |

### **Regras de Ouro**

- ✅ **Máx 3 animações simultâneas**
- ✅ **FX > FG > MID > BG** (prioridade fixa)
- ✅ **Histerese** evita flickering
- ✅ **Reduced motion** respeitado
- ✅ **Starvation protection** ativo

---

## 🔧 **Arquitetura Final**

```
Luminaris Director
├── 🎭 Layers Model (priorities & limits)
│   ├── LayerManager (preemption logic)
│   └── Starvation protection
├── ⏱️ Timeline Semantic (cues & markers)
│   ├── Chapter timelines
│   └── Event system
├── 🎬 Director API (unified interface)
│   ├── create/play/pause/cancel/seek
│   ├── bindScroll & cue system
│   └── Layer lock/unlock
├── ⚡ Preemption System (smart interruptions)
│   ├── Priority evaluation
│   ├── Grace periods
│   └── Cost calculation
├── 📜 Scroll Sync (deterministic)
│   ├── Hysteresis
│   ├── Damping
│   └── Pin chapters
└── 🎨 Motion Tokens (expanded)
    ├── 25+ easings
    ├── Spring physics
    └── Reduced motion maps
```

---

## 🚀 **Como Usar**

### **1. Import Director**

```typescript
import { director } from "@/lib/animation/director-api";
```

### **2. Criar Timeline**

```typescript
const heroTimeline = director.createTimeline("hero", {
  layer: AnimationLayer.FG,
  priority: 3,
});
```

### **3. Controlar Animações**

```typescript
// Play chapter
director.play("hero");

// Cue específico
director.cue("hero.ctaGlow");

// Bind com scroll
director.bindScroll("hero", {
  rangePx: { start: 0, end: 1000 },
  damping: 0.1,
});
```

### **4. Debug em Desenvolvimento**

```typescript
// Adicionar ao layout
<LuminarisDebugRig />

// Ctrl+Shift+D para HUD
// Monitor performance em tempo real
```

---

## 📈 **Métricas de Sucesso**

### **Performance**

- **LCP**: < 2.5s (sem degradação)
- **Concurrent**: Máx 3 animações simultâneas
- **FPS**: Mantido > 30fps
- **Memory**: < 50MB

### **Narrativa**

- **Chapter Flow**: < 20% drop entre capítulos
- **CTA Conversion**: +15% uplift esperado
- **Scroll Sync**: Sem flickering perceptível

### **Qualidade**

- **Preemptions**: < 2 por camada/minuto
- **Starvation**: 0 eventos de proteção
- **Interrupções**: 100% graceful (soft cancel)

---

## 🎯 **Resultado**

**Luminaris Director** eleva o controle de animações para nível **direção de cena** com:

- **🎭 Camadas inteligentes** com preempção automática
- **⏱️ Timelines narrativos** com cues semânticos
- **📜 Scroll determinístico** com histerese
- **🎨 Motion tokens ricos** contextuais
- **🖥️ Debug profissional** com HUD interativo
- **⚡ Performance garantida** com budgets rigorosos

**Transformando animações de "efeitos visuais" em "storytelling coreografado"!** 🎬✨

---

_Mantra: **camadas orquestradas, timelines narrativos, controle determinístico**._
