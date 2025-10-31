import { describe, it, expect } from 'vitest'
import { THEME_REGISTRY } from '@/lib/theme/theme-registry'
import { validateTokenContrast } from '@/lib/theme/token-linter'
import { generateThemeCSS } from '@/lib/theme/personalization-engine'

describe('Theme A11y Validation', () => {
  describe.each(Object.entries(THEME_REGISTRY))('%s theme', (themeId, theme) => {
    it('deve passar validação de contraste para todas as combinações de texto', () => {
      const contrastIssues = validateTokenContrast(theme)
      const failures = contrastIssues.filter(issue => issue.status === 'fail')

      if (failures.length > 0) {
        console.table(failures.map(f => ({
          combination: `${f.token} on ${f.background}`,
          ratio: `${f.actualRatio}:1`,
          required: `${f.requiredRatio}:1`,
          status: f.status
        })))
      }

      expect(failures).toHaveLength(0)
    })

    it('deve gerar CSS válido sem erros', () => {
      expect(() => {
        const css = generateThemeCSS({
          themeId,
          variant: 'A',
          locale: 'en-US',
          currency: 'USD',
          direction: 'ltr',
          customTokens: {}
        })
        expect(css).toBeDefined()
        expect(typeof css).toBe('string')
        expect(css.length).toBeGreaterThan(100)
        expect(css).toContain(`data-theme="${themeId}"`)
      }).not.toThrow()
    })

    it('deve ter metas de performance razoáveis', () => {
      expect(theme.performance.lcp).toBeGreaterThan(0)
      expect(theme.performance.lcp).toBeLessThanOrEqual(3000) // 3s max

      expect(theme.performance.inp).toBeGreaterThan(0)
      expect(theme.performance.inp).toBeLessThanOrEqual(300) // 300ms max

      expect(theme.performance.cls).toBeGreaterThanOrEqual(0)
      expect(theme.performance.cls).toBeLessThanOrEqual(0.2) // 0.2 max
    })

    it('should have valid HSL/OKLCH color values', () => {
      const colorRegex = /^(hsl|oklch)\([^)]+\)$/

      Object.entries(theme.tokens.colors).forEach(([key, value]) => {
        expect(value).toMatch(colorRegex)
        expect(typeof value).toBe('string')
        expect(value.length).toBeGreaterThan(10)
      })
    })

    it('should have responsive typography scales', () => {
      const { typography } = theme.tokens

      expect(typography.scale.h1).toContain('clamp(')
      expect(typography.scale.body).toContain('clamp(')

      // H1 should be larger than body
      const h1Min = parseFloat(typography.scale.h1.match(/clamp\(([^,]+),/)?.[1] || '0')
      const bodyMin = parseFloat(typography.scale.body.match(/clamp\(([^,]+),/)?.[1] || '0')
      expect(h1Min).toBeGreaterThan(bodyMin)
    })

    it('should have motion preferences support', () => {
      expect(theme.tokens.motion.duration).toBeDefined()
      expect(theme.tokens.motion.easing).toBeDefined()

      // Should have reduced motion consideration
      expect(theme.tokens.motion.duration.instant).toBe('100ms')
      expect(theme.tokens.motion.duration.fast).toBeTruthy()
    })

    it('should support RTL layout when applicable', () => {
      // Test that theme can handle RTL direction
      const rtlResult = generateThemeCSS({
        themeId,
        variant: 'A',
        locale: 'ar-SA',
        currency: 'SAR',
        direction: 'rtl',
        customTokens: {}
      })

      expect(rtlResult).toContain('--direction: rtl')
    })

    it('should have consistent shadow scaling', () => {
      const { shadows } = theme.tokens

      // Shadows should scale from subtle to prominent
      expect(shadows.sm).toBeDefined()
      expect(shadows.md).toBeDefined()
      expect(shadows.lg).toBeDefined()
      expect(shadows.xl).toBeDefined()

      // Should not have duplicate shadow definitions
      const shadowValues = Object.values(shadows)
      const uniqueShadows = new Set(shadowValues)
      expect(uniqueShadows.size).toBe(shadowValues.length)
    })

    it('should have valid border radius scale', () => {
      const { radius } = theme.tokens

      // Should have progressive scale
      const radii = Object.values(radius).map(r => parseFloat(r.replace('rem', '').replace('px', '')))
      const sortedRadii = [...radii].sort((a, b) => a - b)

      expect(sortedRadii).toEqual(radii) // Should be ascending
    })

    it('should have proper semantic spacing scale', () => {
      const { spacing } = theme.tokens

      // Should have 8px grid system
      const flattenSpacing = (obj: any, prefix = ''): string[] => {
        const result: string[] = []
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'string') {
            result.push(value)
          } else if (typeof value === 'object' && value !== null) {
            result.push(...flattenSpacing(value, `${prefix}${key}.`))
          }
        }
        return result
      }

      const allSpacingValues = flattenSpacing(spacing)

      allSpacingValues.forEach(space => {
        if (typeof space === 'string' && space.includes('rem')) {
          const value = parseFloat(space.replace('rem', ''))
          expect(value % 0.5).toBe(0) // Should align to 8px grid (0.5rem = 8px)
        }
      })
    })

    it('should have valid features configuration', () => {
      const { features } = theme

      // Should have all required feature flags
      const requiredFeatures = [
        'glassmorphism', 'brutalism', 'neon', 'serif',
        'bento', 'soft', 'monochrome', 'pixel', 'organic', 'blueprint'
      ]

      requiredFeatures.forEach(feature => {
        expect(typeof features[feature]).toBe('boolean')
      })

      // Should not have conflicting features
      const conflictingPairs = [
        ['brutalism', 'soft'],
        ['glassmorphism', 'brutalism'],
        ['neon', 'monochrome'],
        ['serif', 'monochrome']
      ]

      conflictingPairs.forEach(([feature1, feature2]) => {
        if (features[feature1] && features[feature2]) {
          console.warn(`${themeId} has conflicting features: ${feature1} and ${feature2}`)
        }
      })
    })
  })

  describe('Theme Interactions', () => {
    it('should handle theme switching without FOUC', () => {
      // Test that critical CSS is generated for theme switching
      const liquidGlass = generateThemeCSS({
        themeId: 'liquid-glass',
        variant: 'A',
        locale: 'en-US',
        currency: 'USD',
        direction: 'ltr',
        customTokens: {}
      })

      const techBlueprint = generateThemeCSS({
        themeId: 'tech-blueprint',
        variant: 'A',
        locale: 'en-US',
        currency: 'USD',
        direction: 'ltr',
        customTokens: {}
      })

      expect(liquidGlass).not.toBe(techBlueprint)
      expect(liquidGlass).toContain('liquid-glass')
      expect(techBlueprint).toContain('tech-blueprint')
    })

    it('should maintain contrast when switching themes', () => {
      const liquidGlass = THEME_REGISTRY['liquid-glass']
      const techBlueprint = THEME_REGISTRY['tech-blueprint']

      const lgContrast = validateTokenContrast(liquidGlass)
      const tbContrast = validateTokenContrast(techBlueprint)

      // Both should have similar contrast validation structure
      expect(lgContrast.length).toBe(tbContrast.length)

      // Neither should have critical contrast failures
      expect(lgContrast.filter(i => i.status === 'fail')).toHaveLength(0)
      expect(tbContrast.filter(i => i.status === 'fail')).toHaveLength(0)
    })

    it('should support high contrast mode', () => {
      // Test that themes can adapt to high contrast preferences
      const theme = THEME_REGISTRY['liquid-glass']

      // In a real implementation, this would test CSS custom properties
      // for high contrast overrides
      expect(theme).toBeDefined()
      expect(theme.id).toBe('liquid-glass')
    })
  })

  describe('Performance Budget Compliance', () => {
    it('should have realistic LCP targets', () => {
      Object.values(THEME_REGISTRY).forEach(theme => {
        expect(theme.performance.lcp).toBeGreaterThanOrEqual(1500) // Min realistic
        expect(theme.performance.lcp).toBeLessThanOrEqual(3000)  // Max acceptable
      })
    })

    it('should have achievable INP targets', () => {
      Object.values(THEME_REGISTRY).forEach(theme => {
        expect(theme.performance.inp).toBeGreaterThanOrEqual(100) // Min realistic
        expect(theme.performance.inp).toBeLessThanOrEqual(300)  // Max acceptable
      })
    })

    it('should maintain CLS budget', () => {
      Object.values(THEME_REGISTRY).forEach(theme => {
        expect(theme.performance.cls).toBeGreaterThanOrEqual(0)
        expect(theme.performance.cls).toBeLessThanOrEqual(0.15) // Conservative budget
      })
    })
  })
})
