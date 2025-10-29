# ADR: Theme System Architecture

## Status

✅ **ACCEPTED** - Implementation completed and validated

## Context

The landing page requires a sophisticated theming system to support:

- Multiple visual themes (liquid-glass, tech-blueprint, etc.)
- A/B testing and personalization
- Progressive rollout with feature flags
- Performance-optimized CSS delivery
- Accessibility compliance (WCAG 2.1 AA/AAA)
- Internationalization (RTL support)
- Anti-FOUC mechanisms

## Decision

Implement a **Composition-First Theme System** with the following architecture:

### 1. Theme Registry & Governance

```typescript
interface ThemePack {
  id: string;
  version: string; // SemVer
  breakingFields?: string[];
  tokens: ThemeTokens;
  metadata: TokenMetadata[];
}
```

### 2. Personalization Engine

```typescript
interface ResolvedTheme {
  themeId: string;
  variant: "A" | "B";
  locale: string;
  direction: "ltr" | "rtl";
  overrideChain: OverrideStep[]; // Audit trail
}
```

### 3. CSS Layer Architecture

```css
@layer themes, base, components, utilities;
```

### 4. Performance Optimizations

- Critical CSS inlining
- `contain` and `content-visibility`
- `color-mix()` for derived colors
- Progressive theme loading

### 5. Accessibility First

- Contrast validation (AA/AAA)
- Reduced motion support
- RTL component validation
- High contrast mode support

## Implementation

### Theme Registry Structure

```
lib/theme/
├── theme-registry.ts     # ThemePack definitions
├── token-linter.ts       # Contrast validation
├── personalization-engine.ts  # Resolution logic
├── critical-css.ts       # Anti-FOUC CSS generation
└── experimentation-engine.ts # A/B testing
```

### CSS Architecture

```
styles/
├── theme-layers.css      # @layer definitions + RTL support
├── theme-liquid-glass.css
├── theme-tech-blueprint.css
└── globals.css           # Design tokens import
```

### Component Integration

```tsx
// Automatic theme application
<html dir={direction} data-theme={themeId}>

// RTL-aware components
<ArrowRight className="rtl-flip" />

// Critical CSS injection
<style dangerouslySetInnerHTML={{ __html: criticalCSS }} />
```

## Consequences

### Positive

- **Performance**: Sub-2.5s LCP with anti-FOUC
- **Accessibility**: WCAG AA/AAA compliance with RTL support
- **Maintainability**: Centralized theme governance
- **Scalability**: Progressive rollout without breaking changes
- **Personalization**: A/B testing with audit trails

### Negative

- **Complexity**: Multiple layers of theme resolution
- **Bundle Size**: Multiple theme CSS files (code-split)
- **Testing**: Extensive RTL and accessibility testing required

### Risks

- **Hydration Mismatch**: Critical CSS must be deterministic
- **Theme Drift**: Version management prevents breaking changes
- **Performance Regression**: Continuous monitoring of Core Web Vitals

## Alternatives Considered

### 1. CSS Variables Only

- **Pro**: Simple, flexible
- **Con**: No governance, performance issues, FOUC problems
- **Decision**: Rejected - insufficient for production scale

### 2. CSS-in-JS (styled-components)

- **Pro**: Dynamic theming, TypeScript integration
- **Con**: Performance overhead, hydration issues, bundle size
- **Decision**: Rejected - conflicts with SSR requirements

### 3. Tailwind CSS Classes

- **Pro**: Utility-first, consistent
- **Con**: Limited personalization, hard to test A/B variants
- **Decision**: Hybrid approach - Tailwind for utilities, custom for themes

## Validation Criteria

### Performance

- [x] LCP < 2.5s with theme switching
- [x] CLS < 0.1 (anti-FOUC working)
- [x] INP < 200ms (no theme-related jank)

### Accessibility

- [x] WCAG AA/AAA contrast ratios
- [x] Keyboard navigation preserved
- [x] Screen reader compatibility
- [x] RTL layout validation

### Functionality

- [x] Theme persistence across sessions
- [x] A/B testing with proper bucketing
- [x] Progressive rollout working
- [x] Critical CSS prevents FOUC

### Code Quality

- [x] TypeScript strict compliance
- [x] Comprehensive test coverage
- [x] Architecture rules enforced
- [x] Documentation complete

## Migration Strategy

### Phase 1: Foundation (Week 1)

- [x] Theme registry with version control
- [x] Basic personalization engine
- [x] CSS layer architecture

### Phase 2: Features (Week 2)

- [x] A/B testing framework
- [x] Anti-FOUC implementation
- [x] Performance optimizations

### Phase 3: Polish (Week 3)

- [x] Accessibility compliance
- [x] RTL support
- [x] Comprehensive testing

### Phase 4: Production (Week 4)

- [x] Progressive rollout
- [x] Monitoring and alerts
- [x] Documentation completion

## Monitoring & Metrics

### Health Signals

- **Design Debt**: % of hardcoded theme values
- **A11y Debt**: Themes failing contrast validation
- **Performance**: LCP/CLS/INP by theme variant
- **Stability**: Theme resolution success rate

### Alerting

- Contrast ratio drops below AA
- Theme resolution failures > 1%
- Performance regression > 10%

## Future Considerations

### Theme Marketplace

- Third-party theme contributions
- Theme validation pipeline
- Monetization opportunities

### Advanced Personalization

- ML-driven theme recommendations
- User preference learning
- Contextual theme adaptation

### Performance Enhancements

- Theme preloading strategies
- Critical resource prioritization
- Advanced caching mechanisms

## References

- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
- [CSS Containment](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Containment)
- [Core Web Vitals](https://web.dev/vitals/)
- [A/B Testing Best Practices](https://www.optimizely.com/optimization-glossary/ab-testing/)
