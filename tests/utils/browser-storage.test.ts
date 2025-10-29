import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  readLocalStorage,
  writeLocalStorage,
  removeLocalStorage,
  readLocalStorageJSON,
  writeLocalStorageJSON,
  safeBrowserAPI,
  isClient,
  isServer,
  safeWindowAccess
} from '../../lib/utils/browser-storage';

// Mock console.warn to avoid noise in tests
const originalWarn = console.warn;
beforeEach(() => {
  console.warn = vi.fn();
});

afterEach(() => {
  console.warn = originalWarn;
});

describe('Browser Storage Utils', () => {
  describe('SSR Safety', () => {
    it('should return null/false for all operations when window is undefined', () => {
      // Mock window as undefined (SSR)
      const restoreWindow = vi.stubGlobal('window', undefined);

      expect(readLocalStorage('test')).toBeNull();
      expect(writeLocalStorage('test', 'value')).toBe(false);
      expect(removeLocalStorage('test')).toBe(false);
      expect(isClient()).toBe(false);
      expect(isServer()).toBe(true);

      restoreWindow();
    });
  });

  describe('LocalStorage Operations', () => {
    let mockLocalStorage: Storage;

    beforeEach(() => {
      mockLocalStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        key: vi.fn(),
        length: 0
      };

      vi.stubGlobal('localStorage', mockLocalStorage);
    });

    describe('readLocalStorage', () => {
      it('should read from localStorage successfully', () => {
        mockLocalStorage.getItem.mockReturnValue('test-value');
        const result = readLocalStorage('test-key');
        expect(result).toBe('test-value');
        expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test-key');
      });

      it('should return null when localStorage throws', () => {
        mockLocalStorage.getItem.mockImplementation(() => {
          throw new Error('Storage quota exceeded');
        });
        const result = readLocalStorage('test-key');
        expect(result).toBeNull();
        expect(console.warn).toHaveBeenCalled();
      });
    });

    describe('writeLocalStorage', () => {
      it('should write to localStorage successfully', () => {
        const result = writeLocalStorage('test-key', 'test-value');
        expect(result).toBe(true);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-key', 'test-value');
      });

      it('should return false when localStorage throws', () => {
        mockLocalStorage.setItem.mockImplementation(() => {
          throw new Error('Storage quota exceeded');
        });
        const result = writeLocalStorage('test-key', 'test-value');
        expect(result).toBe(false);
        expect(console.warn).toHaveBeenCalled();
      });
    });

    describe('removeLocalStorage', () => {
      it('should remove from localStorage successfully', () => {
        const result = removeLocalStorage('test-key');
        expect(result).toBe(true);
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test-key');
      });

      it('should return false when localStorage throws', () => {
        mockLocalStorage.removeItem.mockImplementation(() => {
          throw new Error('Storage access denied');
        });
        const result = removeLocalStorage('test-key');
        expect(result).toBe(false);
        expect(console.warn).toHaveBeenCalled();
      });
    });
  });

  describe('Browser API Safety', () => {
    it('should return fallback when browser API throws', () => {
      const result = safeBrowserAPI(() => {
        throw new Error('Browser API failed');
      }, 'fallback-value');
      expect(result).toBe('fallback-value');
    });

    it('should return result when browser API succeeds', () => {
      const result = safeBrowserAPI(() => 'success', 'fallback');
      expect(result).toBe('success');
    });
  });

  describe('Environment Detection', () => {
    it('should detect client environment when window exists', () => {
      expect(isClient()).toBe(true);
      expect(isServer()).toBe(false);
    });

    it('should detect server environment when window is undefined', () => {
      const restoreWindow = vi.stubGlobal('window', undefined);
      expect(isClient()).toBe(false);
      expect(isServer()).toBe(true);
      restoreWindow();
    });
  });

  describe('Safe Access Functions', () => {
    it('should access window property safely', () => {
      const result = safeWindowAccess('location', { href: 'fallback' });
      expect(result).toHaveProperty('href');
    });

    it('should return fallback when window property access fails', () => {
      const restoreWindow = vi.stubGlobal('window', undefined);
      const result = safeWindowAccess('location', { href: 'fallback' });
      expect(result.href).toBe('fallback');
      restoreWindow();
    });
  });

  describe('JSON Operations', () => {
    let mockLocalStorage: Storage;

    beforeEach(() => {
      mockLocalStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        key: vi.fn(),
        length: 0
      };

      vi.stubGlobal('localStorage', mockLocalStorage);
    });

    describe('readLocalStorageJSON', () => {
      it('should parse valid JSON and return the value', () => {
        const testData = { name: 'test', value: 42 };
        mockLocalStorage.getItem.mockReturnValue(JSON.stringify(testData));

        const result = readLocalStorageJSON('test-key', { default: true });
        expect(result).toEqual(testData);
      });

      it('should return default value for invalid JSON', () => {
        mockLocalStorage.getItem.mockReturnValue('invalid json');

        const result = readLocalStorageJSON('test-key', { default: true });
        expect(result).toEqual({ default: true });
      });

      it('should return default value when localStorage returns null', () => {
        mockLocalStorage.getItem.mockReturnValue(null);

        const result = readLocalStorageJSON('test-key', 'default-value');
        expect(result).toBe('default-value');
      });
    });

    describe('writeLocalStorageJSON', () => {
      it('should serialize and write JSON successfully', () => {
        const testData = { name: 'test', value: 42 };

        const result = writeLocalStorageJSON('test-key', testData);
        expect(result).toBe(true);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify(testData));
      });

      it('should return false when JSON serialization fails', () => {
        const circularRef: any = {};
        circularRef.self = circularRef;

        const result = writeLocalStorageJSON('test-key', circularRef);
        expect(result).toBe(false);
      });
    });
  });
});
