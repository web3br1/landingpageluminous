# Troubleshooting - Sistema de Scroll Storytelling

## Problemas Comuns

### 1. Transições não funcionam

**Sintomas:**

- Capítulos mudam sem animações
- Elementos piscam durante transição

**Possíveis causas:**

- `prefers-reduced-motion: reduce` ativo
- Hook não inicializado corretamente
- Framer Motion não carregado

**Soluções:**

```typescript
// Verificar se reduced motion está ativo
console.log(useReducedMotion());

// Forçar transição manual
setTransition({
  from: currentChapter,
  to: nextChapter,
  progress: 0,
  type: "crossfade",
  direction: "down",
});
```

### 2. Navegação por teclado não funciona

**Sintomas:**

- Setas ↑↓ não navegam
- Ctrl+1-9 não pula capítulos

**Possíveis causas:**

- Elemento input/textarea focado
- Hook não habilitado
- Debounce muito alto

**Verificações:**

```typescript
// Verificar se hook está ativo
console.log("Keyboard nav enabled:", SCROLL_FEATURES.ENABLE_KEYBOARD_NAV);

// Verificar elementos focados
console.log("Active element:", document.activeElement);

// Testar debounce
console.log("Debounce config:", SCROLL_CONFIG.KEYBOARD_NAVIGATION_DEBOUNCE_MS);
```

### 3. Pinning não funciona em mobile

**Sintomas:**

- Capítulos não ficam fixados
- Scroll normal em dispositivos móveis

**Causa:**

- Pinning desabilitado para mobile por padrão

**Solução:**

```typescript
// Habilitar pinning para mobile (com cuidado)
const isMobile = window.innerWidth < SCROLL_CONFIG.MOBILE_BREAKPOINT;
if (!isMobile || forcePinning) {
  // Aplicar pinning
}
```

### 4. Alturas calculadas incorretas

**Sintomas:**

- Progress mostra valores errados
- Capítulos pulam posições

**Possíveis causas:**

- DOM não renderizado completamente
- Resize não detectado
- Heights calculadas vs reais divergindo

**Debug:**

```typescript
// Verificar debug info
console.log("Debug info:", {
  effectiveHeights: storytelling.debug.effectiveHeights,
  chapterPositions: storytelling.debug.chapterPositions,
  actualSectionHeights: storytelling.debug.actualSectionHeights,
  totalHeight: storytelling.debug.totalHeight,
});

// Forçar recálculo
window.dispatchEvent(new Event("resize"));
```

### 5. Performance degradada

**Sintomas:**

- Scroll lag/jank
- CPU alta durante scroll
- Navegação lenta

**Possíveis causas:**

- Muitos cálculos por frame
- Throttling inadequado
- Animations pesadas

**Otimização:**

```typescript
// Ajustar throttling
SCROLL_CONFIG.SCROLL_THROTTLE_MS = 8 // Mais responsivo, mas pode causar lag

// Desabilitar cálculos pesados
enableAnalytics: false,
enablePinning: false

// Verificar requestAnimationFrame usage
console.log("RAF calls per second:", rafCounter)
```

### 6. Hydration mismatches

**Sintomas:**

- Erros de hidratação no console
- Layout shifts após load

**Causa:**

- Cálculos diferentes server vs client

**Solução:**

```typescript
// Usar layoutEffect: false no useScroll
const { scrollY } = useScroll({
  layoutEffect: false, // Previne hydration issues
});
```

### 7. Analytics não funcionam

**Sintomas:**

- Eventos não aparecem no analytics
- chapter_enter não dispara

**Verificações:**

```typescript
// Verificar se analytics está ativo
console.log("Analytics enabled:", SCROLL_FEATURES.ENABLE_ANALYTICS);

// Verificar configuração
console.log("Analytics config:", {
  enableAnalytics: storytelling.enableAnalytics,
});

// Testar evento manual
analytics.track("test_event", { timestamp: Date.now() });
```

### 8. Capítulo stepper não avança

**Sintomas:**

- Bolinhas não mudam de cor
- Progress bar fica parada

**Causa:**

- Sub-scene progress não calculado corretamente

**Debug:**

```typescript
// Verificar stepper state
console.log("Stepper state:", {
  currentStep: howItWorksStepper.currentStep,
  progress: howItWorksStepper.overallProgress,
  chapterProgress: storytelling.currentChapter?.subSceneProgress,
});
```

## Ferramentas de Debug

### Debug Panel Unificado

```typescript
// Mostrar todas as métricas
<UnifiedDebug scrollDebug={storytelling.debug} />

// Tabs disponíveis:
// - Scroll: posições, alturas, progresso
// - A/B Tests: variantes ativas
// - Features: feature flags
```

### Console Logging

```typescript
// Habilitar logs de debug
DEBUG_CONFIG.LOG_TRANSITIONS = true;
DEBUG_CONFIG.LOG_NAVIGATION = true;
DEBUG_CONFIG.LOG_PERFORMANCE = true;
```

### Performance Monitoring

```typescript
// Medir performance de scroll
const startTime = performance.now();
// ... operação
const endTime = performance.now();
console.log(`Operation took ${endTime - startTime}ms`);
```

## Configurações de Troubleshooting

### Modo Seguro

```typescript
// Desabilitar todas as features problemáticas
const safeConfig = {
  transitionDuration: 0, // Sem transições
  enableAnalytics: false,
  enablePinning: false,
  chapters: DEFAULT_CHAPTERS.slice(0, 3), // Apenas primeiros capítulos
};
```

### Modo Verbose

```typescript
// Máximo de logging
const verboseConfig = {
  ...DEFAULT_CONFIG,
  enableAnalytics: true,
  enablePinning: true,
  debug: true,
};
```

## Checklist de Diagnóstico

- [ ] Debug panel mostra dados corretos?
- [ ] Navegação por teclado funciona?
- [ ] Transições visuais ocorrem?
- [ ] Pinning funciona em desktop?
- [ ] Performance aceitável (60fps)?
- [ ] Analytics eventos disparam?
- [ ] Sem erros de console?
- [ ] Responsivo em diferentes viewports?

## Contato

Para issues complexas, incluir:

- Browser + versão
- Device + resolução
- Console logs completos
- Screenshots do debug panel
- Configuração atual
