/**
 * Analytics hooks tests - SSR safe event tracking
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useAnalyticsEvent,
  usePageView,
  useScrollTracking,
  useTimeTracking,
  useFormAnalytics,
} from '../../lib/hooks/use-analytics';

// Mock console for analytics logging
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('Analytics Hooks - SSR Safety', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock window and document for SSR tests
    Object.defineProperty(window, 'dataLayer', {
      writable: true,
      value: [],
    });

    Object.defineProperty(window, 'pageYOffset', {
      writable: true,
      value: 0,
    });

    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      value: 800,
    });

    Object.defineProperty(document, 'body', {
      writable: true,
      value: {
        scrollHeight: 1600,
        offsetHeight: 1600,
      },
    });

    Object.defineProperty(document, 'documentElement', {
      writable: true,
      value: {
        clientHeight: 1600,
        scrollHeight: 1600,
        offsetHeight: 1600,
      },
    });

    Object.defineProperty(document, 'hidden', {
      writable: true,
      value: false,
    });
  });

  describe('useAnalyticsEvent', () => {
    it('should provide tracking functions', () => {
      const { result } = renderHook(() => useAnalyticsEvent());

      expect(typeof result.current.track).toBe('function');
      expect(typeof result.current.trackClick).toBe('function');
      expect(typeof result.current.trackConversion).toBe('function');
      expect(typeof result.current.trackError).toBe('function');
    });

    it('should track custom events', () => {
      const { result } = renderHook(() => useAnalyticsEvent());

      act(() => {
        result.current.track({
          event: 'test_event',
          category: 'test',
          action: 'click',
          label: 'test_label',
        });
      });

      expect(window.dataLayer).toContainEqual({
        event: 'test_event',
        eventCategory: 'test',
        eventAction: 'click',
        eventLabel: 'test_label',
      });
    });

    it('should track click events', () => {
      const { result } = renderHook(() => useAnalyticsEvent());

      act(() => {
        result.current.trackClick('button', { page: 'home' });
      });

      expect(window.dataLayer).toContainEqual({
        event: 'click',
        eventCategory: 'interaction',
        eventAction: 'click',
        eventLabel: 'button',
        page: 'home',
      });
    });

    it('should track conversion events', () => {
      const { result } = renderHook(() => useAnalyticsEvent());

      act(() => {
        result.current.trackConversion('signup', 100);
      });

      expect(window.dataLayer).toContainEqual({
        event: 'conversion',
        eventCategory: 'goal',
        eventAction: 'signup',
        eventValue: 100,
      });
    });

    it('should track error events', () => {
      const { result } = renderHook(() => useAnalyticsEvent());

      act(() => {
        result.current.trackError('validation', 'Invalid email');
      });

      expect(window.dataLayer).toContainEqual({
        event: 'error',
        eventCategory: 'error',
        eventAction: 'validation',
        eventLabel: 'Invalid email',
      });
    });
  });

  describe('usePageView', () => {
    it('should track page view on mount', () => {
      renderHook(() => usePageView('home'));

      expect(window.dataLayer).toContainEqual({
        event: 'page_view',
        eventCategory: 'navigation',
        eventAction: 'view',
        eventLabel: 'home',
      });
    });

    it('should not track when pageName is not provided', () => {
      renderHook(() => usePageView());

      expect(window.dataLayer).toHaveLength(0);
    });
  });

  describe('useScrollTracking', () => {
    it('should track scroll thresholds', () => {
      const { result } = renderHook(() => useScrollTracking([25, 50]));

      // Simulate scroll to 25%
      act(() => {
        Object.defineProperty(window, 'pageYOffset', { value: 200 });
        window.dispatchEvent(new Event('scroll'));
      });

      expect(window.dataLayer).toContainEqual({
        event: 'scroll_depth',
        eventCategory: 'engagement',
        eventAction: 'scroll',
        eventLabel: '25%',
        eventValue: 25,
      });
    });

    it('should not track duplicate thresholds', () => {
      renderHook(() => useScrollTracking([25]));

      // Scroll to 25% twice
      act(() => {
        Object.defineProperty(window, 'pageYOffset', { value: 200 });
        window.dispatchEvent(new Event('scroll'));
        window.dispatchEvent(new Event('scroll'));
      });

      const scrollEvents = window.dataLayer.filter(
        (event: any) => event.event === 'scroll_depth' && event.eventLabel === '25%'
      );

      expect(scrollEvents).toHaveLength(1);
    });
  });

  describe('useTimeTracking', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should track time on unmount', () => {
      const { unmount } = renderHook(() => useTimeTracking('test_page'));

      // Advance time by 5 seconds
      vi.advanceTimersByTime(5000);

      act(() => {
        unmount();
      });

      expect(window.dataLayer).toContainEqual({
        event: 'time_spent',
        eventCategory: 'engagement',
        eventAction: 'time',
        eventLabel: 'test_page',
        eventValue: 5,
      });
    });

    it('should track time on visibility change', () => {
      renderHook(() => useTimeTracking());

      // Advance time and trigger visibility change
      vi.advanceTimersByTime(3000);

      act(() => {
        Object.defineProperty(document, 'hidden', { value: true });
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(window.dataLayer).toContainEqual({
        event: 'time_spent',
        eventCategory: 'engagement',
        eventAction: 'time',
        eventLabel: 'current_page',
        eventValue: 3,
      });
    });
  });

  describe('useFormAnalytics', () => {
    it('should provide form tracking functions', () => {
      const { result } = renderHook(() => useFormAnalytics('contact_form'));

      expect(typeof result.current.trackFormStart).toBe('function');
      expect(typeof result.current.trackFormSubmit).toBe('function');
      expect(typeof result.current.trackFormField).toBe('function');
    });

    it('should track form start', () => {
      const { result } = renderHook(() => useFormAnalytics('contact_form'));

      act(() => {
        result.current.trackFormStart();
      });

      expect(window.dataLayer).toContainEqual({
        event: 'form_start',
        eventCategory: 'form',
        eventAction: 'start',
        eventLabel: 'contact_form',
      });
    });

    it('should track form submit success', () => {
      const { result } = renderHook(() => useFormAnalytics('contact_form'));

      act(() => {
        result.current.trackFormSubmit(true);
      });

      expect(window.dataLayer).toContainEqual({
        event: 'form_submit',
        eventCategory: 'form',
        eventAction: 'success',
        eventLabel: 'contact_form',
        eventValue: 1,
      });
    });

    it('should track form field interactions', () => {
      const { result } = renderHook(() => useFormAnalytics('contact_form'));

      act(() => {
        result.current.trackFormField('email', 'focus');
      });

      expect(window.dataLayer).toContainEqual({
        event: 'form_field',
        eventCategory: 'form',
        eventAction: 'focus',
        eventLabel: 'contact_form_email',
      });
    });
  });

  describe('SSR Safety', () => {
    it('should not crash when window is undefined', () => {
      // Temporarily remove window
      const originalWindow = global.window;
      delete (global as any).window;

      expect(() => {
        renderHook(() => useAnalyticsEvent());
      }).not.toThrow();

      // Restore window
      global.window = originalWindow;
    });

    it('should skip tracking when not in browser', () => {
      const originalWindow = global.window;
      delete (global as any).window;

      const { result } = renderHook(() => useAnalyticsEvent());

      act(() => {
        result.current.track({ event: 'test' });
      });

      // Should have logged skipped message
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('[Analytics]'),
        expect.stringContaining('skipped')
      );

      global.window = originalWindow;
    });
  });
});
