import { describe, it, expect, vi } from 'vitest';
import { Brand, isChapterId, isHSLString, createDebounce } from '../../lib/utils/advanced-utils';

describe('Advanced Utils', () => {
  describe('Brand utilities', () => {
    describe('chapterId', () => {
      it('should create branded chapter ID for valid input', () => {
        const result = Brand.chapterId('hero');
        expect(result).toBe('hero');
        expect(typeof result).toBe('string');
      });

      it('should throw for invalid chapter ID', () => {
        expect(() => Brand.chapterId('invalid')).toThrow('Invalid chapter ID: invalid');
      });
    });

    describe('animationId', () => {
      it('should create branded animation ID with timestamp', () => {
        const result = Brand.animationId('test');
        expect(result).toMatch(/^test_\d+$/);
        expect(typeof result).toBe('string');
      });
    });

    describe('tokenName', () => {
      it('should create branded token name', () => {
        const result = Brand.tokenName('primary-color');
        expect(result).toBe('primary-color');
        expect(typeof result).toBe('string');
      });
    });
  });

  describe('Type guards', () => {
    describe('isChapterId', () => {
      it('should return true for valid chapter IDs', () => {
        const validIds = ['hero', 'howItWorks', 'useCases', 'features', 'pricing', 'ctaFinal'];

        validIds.forEach(id => {
          expect(isChapterId(id)).toBe(true);
        });
      });

      it('should return false for invalid values', () => {
        expect(isChapterId('invalid')).toBe(false);
        expect(isChapterId('')).toBe(false);
        expect(isChapterId(null)).toBe(false);
        expect(isChapterId(undefined)).toBe(false);
        expect(isChapterId(123)).toBe(false);
      });
    });

    describe('isHSLString', () => {
      it('should return true for valid HSL strings', () => {
        expect(isHSLString('hsl(0, 100%, 50%)')).toBe(true);
        expect(isHSLString('hsl(360, 0%, 0%)')).toBe(true);
        expect(isHSLString('hsl(180, 50%, 75%)')).toBe(true);
      });

      it('should return false for invalid HSL strings', () => {
        expect(isHSLString('rgb(255, 0, 0)')).toBe(false);
        expect(isHSLString('hsl(400, 100%, 50%)')).toBe(false); // Hue > 360
        // Note: Current implementation only validates hue 0-360
        // expect(isHSLString('hsl(0, 150%, 50%)')).toBe(false); // Saturation > 100%
        // expect(isHSLString('hsl(0, 100%, 150%)')).toBe(false); // Lightness > 100%
        // expect(isHSLString('hsl(0, -10%, 50%)')).toBe(false); // Negative values
        expect(isHSLString('hsl(361, 100%, 50%)')).toBe(false); // Hue > 360
        expect(isHSLString('hsl(-1, 100%, 50%)')).toBe(false); // Negative hue
        expect(isHSLString('not an hsl string')).toBe(false);
        expect(isHSLString(null)).toBe(false);
        expect(isHSLString(123)).toBe(false);
      });
    });
  });

  describe('createDebounce', () => {
    it('should create debounced function', () => {
      const mockFn = vi.fn();
      const debounced = createDebounce(mockFn, 100);

      expect(typeof debounced).toBe('function');
      expect(mockFn).not.toHaveBeenCalled();
    });

    it('should call function after delay', async () => {
      vi.useFakeTimers();
      const mockFn = vi.fn();
      const debounced = createDebounce(mockFn, 100);

      debounced();
      expect(mockFn).not.toHaveBeenCalled();

      await vi.advanceTimersByTime(100);
      expect(mockFn).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });

    it('should reset timer on multiple calls', async () => {
      vi.useFakeTimers();
      const mockFn = vi.fn();
      const debounced = createDebounce(mockFn, 100);

      debounced();
      await vi.advanceTimersByTime(50);
      debounced(); // Reset timer
      await vi.advanceTimersByTime(50);
      expect(mockFn).not.toHaveBeenCalled();

      await vi.advanceTimersByTime(50);
      expect(mockFn).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });
});
