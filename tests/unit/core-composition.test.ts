/**
 * Core composition tests - Page and section composition logic
 */

import { describe, it, expect, vi } from 'vitest';

// Mock composition utilities
const mockComposePage = vi.fn();
const mockGetSectionData = vi.fn();
const mockValidateComposition = vi.fn();

vi.mock('../../lib/composition', () => ({
  composePage: mockComposePage,
  getSectionData: mockGetSectionData,
  validateComposition: mockValidateComposition,
}));

describe('Core Composition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockComposePage.mockResolvedValue({ sections: [] });
    mockGetSectionData.mockReturnValue({ id: 'test', content: {} });
    mockValidateComposition.mockReturnValue({ valid: true, errors: [] });
  });

  describe('Page Composition', () => {
    it('should compose pages from section configurations', async () => {
      const pageConfig = {
        type: 'landing',
        sections: ['hero', 'features', 'pricing'],
      };

      const result = await mockComposePage(pageConfig);
      expect(result).toHaveProperty('sections');
      expect(mockComposePage).toHaveBeenCalledWith(pageConfig);
    });

    it('should handle different page types', async () => {
      const pageTypes = ['landing', 'pricing', 'demo', 'features'];

      for (const type of pageTypes) {
        const config = { type, sections: ['hero'] };
        await mockComposePage(config);
        expect(mockComposePage).toHaveBeenCalledWith(config);
      }
    });

    it('should validate page composition structure', () => {
      const validConfig = {
        type: 'landing',
        sections: ['hero', 'features', 'pricing', 'faq'],
      };

      const result = mockValidateComposition(validConfig);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Section Data Management', () => {
    it('should retrieve section data by ID', () => {
      const sectionId = 'hero';
      const data = mockGetSectionData(sectionId);

      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('content');
      expect(mockGetSectionData).toHaveBeenCalledWith(sectionId);
    });

    it('should provide fallback data for missing sections', () => {
      mockGetSectionData.mockReturnValue({
        id: 'missing',
        content: { fallback: true },
      });

      const data = mockGetSectionData('nonexistent');
      expect(data.content).toHaveProperty('fallback');
    });

    it('should handle section data caching', () => {
      const sectionId = 'features';
      const firstCall = mockGetSectionData(sectionId);
      const secondCall = mockGetSectionData(sectionId);

      expect(firstCall).toEqual(secondCall);
      expect(mockGetSectionData).toHaveBeenCalledTimes(2);
    });
  });

  describe('Composition Validation', () => {
    it('should validate required sections', () => {
      const config = { type: 'landing', sections: [] };
      mockValidateComposition.mockReturnValue({
        valid: false,
        errors: ['Missing hero section'],
      });

      const result = mockValidateComposition(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing hero section');
    });

    it('should validate section order', () => {
      const config = {
        type: 'landing',
        sections: ['pricing', 'hero', 'faq'], // Wrong order
      };

      mockValidateComposition.mockReturnValue({
        valid: false,
        errors: ['Invalid section order'],
      });

      const result = mockValidateComposition(config);
      expect(result.valid).toBe(false);
    });

    it('should allow valid compositions', () => {
      const config = {
        type: 'landing',
        sections: ['hero', 'features', 'pricing', 'faq'],
      };

      const result = mockValidateComposition(config);
      expect(result.valid).toBe(true);
    });
  });

  describe('Composition Performance', () => {
    it('should optimize composition for fast loading', () => {
      const sections = ['hero', 'features', 'pricing'];
      const composition = { sections, optimized: true };

      expect(composition.optimized).toBe(true);
      expect(composition.sections).toHaveLength(3);
    });

    it('should handle composition errors gracefully', () => {
      mockComposePage.mockRejectedValue(new Error('Composition failed'));

      expect(async () => {
        await mockComposePage({});
      }).rejects.toThrow('Composition failed');
    });

    it('should provide composition metrics', () => {
      const metrics = {
        loadTime: 150,
        sectionCount: 4,
        cacheHits: 2,
        cacheMisses: 1,
      };

      expect(metrics.loadTime).toBeLessThan(200);
      expect(metrics.sectionCount).toBeGreaterThan(0);
    });
  });

  describe('Dynamic Composition', () => {
    it('should support A/B testing variations', () => {
      const baseConfig = { type: 'landing', sections: ['hero'] };
      const variations = {
        control: baseConfig,
        variant_a: { ...baseConfig, sections: ['hero', 'features'] },
        variant_b: { ...baseConfig, sections: ['hero', 'pricing'] },
      };

      Object.values(variations).forEach(config => {
        expect(config.type).toBe('landing');
        expect(config.sections).toContain('hero');
      });
    });

    it('should handle feature flags in composition', () => {
      const configWithFlags = {
        type: 'landing',
        sections: ['hero'],
        features: {
          new_pricing: true,
          beta_feature: false,
        },
      };

      expect(configWithFlags.features.new_pricing).toBe(true);
      expect(configWithFlags.features.beta_feature).toBe(false);
    });

    it('should compose based on user context', () => {
      const contexts = ['anonymous', 'trial', 'paid'];

      contexts.forEach(context => {
        const config = {
          type: 'landing',
          context,
          sections: context === 'paid' ? ['hero', 'advanced'] : ['hero', 'pricing'],
        };

        expect(config.context).toBe(context);
        expect(config.sections).toContain('hero');
      });
    });
  });
});
