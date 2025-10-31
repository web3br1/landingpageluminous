/**
 * Preload Strategy Manager - BLOCO 2: Lazy Loading
 *
 * Sistema de preload estratégico baseado em análise de user journey
 * Faz preload inteligente de componentes baseado em comportamento preditivo
 */

import { componentCache } from './component-cache-manager';
import { logger } from '../observability/logger';

interface UserJourneyPattern {
  currentPath: string;
  previousPaths: string[];
  timeOnPage: number;
  scrollDepth: number;
  interactions: number;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  connectionSpeed: 'slow' | 'medium' | 'fast';
}

interface PreloadCandidate {
  component: string;
  priority: number; // 0-1, higher = more likely to preload
  estimatedBenefit: number; // expected performance gain
  cacheKey: string;
  loader: () => Promise<any>;
}

interface JourneyPrediction {
  nextLikelyPaths: string[];
  recommendedPreloads: PreloadCandidate[];
  confidence: number; // 0-1
}

export class PreloadStrategyManager {
  private journeyHistory: UserJourneyPattern[] = [];
  private preloadQueue: PreloadCandidate[] = [];
  private isPreloading = false;
  private maxConcurrentPreloads = 2;

  constructor() {
    this.startJourneyTracking();
  }

  /**
   * Track user journey for predictive preloading
   */
  trackJourney(pattern: Partial<UserJourneyPattern>): void {
    const journey: UserJourneyPattern = {
      currentPath: window.location.pathname,
      previousPaths: [],
      timeOnPage: 0,
      scrollDepth: 0,
      interactions: 0,
      deviceType: this.detectDeviceType(),
      connectionSpeed: this.detectConnectionSpeed(),
      ...pattern,
    };

    this.journeyHistory.push(journey);

    // Keep only last 10 journeys for analysis
    if (this.journeyHistory.length > 10) {
      this.journeyHistory.shift();
    }

    // Update preload strategy based on new journey data
    this.updatePreloadStrategy();
  }

  /**
   * Add component to preload queue
   */
  queuePreload(candidate: PreloadCandidate): void {
    // Remove existing entry if present
    this.preloadQueue = this.preloadQueue.filter(c => c.cacheKey !== candidate.cacheKey);

    // Add with priority sorting
    this.preloadQueue.push(candidate);
    this.preloadQueue.sort((a, b) => b.priority - a.priority);

    // Limit queue size
    if (this.preloadQueue.length > 20) {
      this.preloadQueue = this.preloadQueue.slice(0, 20);
    }

    logger.debug("Component queued for preload", {
      component: candidate.component,
      priority: candidate.priority,
      queueSize: this.preloadQueue.length,
    });
  }

  /**
   * Execute preloading based on current strategy
   */
  async executePreload(): Promise<void> {
    if (this.isPreloading || this.preloadQueue.length === 0) return;

    this.isPreloading = true;

    try {
      // Get top priority candidates
      const candidates = this.preloadQueue.slice(0, this.maxConcurrentPreloads);
      this.preloadQueue = this.preloadQueue.slice(this.maxConcurrentPreloads);

      const preloadPromises = candidates.map(async (candidate) => {
        try {
          await componentCache.prefetch(candidate.cacheKey, candidate.loader);

          logger.info("Component preloaded successfully", {
            component: candidate.component,
            cacheKey: candidate.cacheKey,
            priority: candidate.priority,
          });
        } catch (error) {
          logger.warn("Preload failed", {
            component: candidate.component,
            error: String(error),
          });
        }
      });

      await Promise.allSettled(preloadPromises);

    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * Predict next user actions based on journey history
   */
  predictNextActions(): JourneyPrediction {
    if (this.journeyHistory.length < 2) {
      return {
        nextLikelyPaths: [],
        recommendedPreloads: [],
        confidence: 0,
      };
    }

    const recentJourneys = this.journeyHistory.slice(-3);
    const currentPath = recentJourneys[recentJourneys.length - 1].currentPath;

    // Analyze patterns
    const pathTransitions = this.analyzePathTransitions();
    const nextLikelyPaths = pathTransitions[currentPath] || [];

    // Generate preload recommendations
    const recommendedPreloads = this.generatePreloadRecommendations(nextLikelyPaths);

    const confidence = Math.min(nextLikelyPaths.length * 0.2, 0.8); // Max 80% confidence

    return {
      nextLikelyPaths,
      recommendedPreloads,
      confidence,
    };
  }

  /**
   * Get preload statistics
   */
  getStats() {
    return {
      journeyHistorySize: this.journeyHistory.length,
      preloadQueueSize: this.preloadQueue.length,
      isPreloading: this.isPreloading,
      cacheStats: componentCache.getStats(),
      predictions: this.predictNextActions(),
    };
  }

  /**
   * Clear all preload data
   */
  clear(): void {
    this.journeyHistory = [];
    this.preloadQueue = [];
    logger.info("Preload strategy data cleared");
  }

  /**
   * Start tracking user journey
   */
  private startJourneyTracking(): void {
    let startTime = Date.now();
    let scrollDepth = 0;
    let interactions = 0;

    // Track scroll depth
    const trackScroll = () => {
      const currentDepth = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );
      scrollDepth = Math.max(scrollDepth, currentDepth);
    };

    // Track interactions
    const trackInteraction = () => {
      interactions++;
    };

    // Add event listeners
    window.addEventListener('scroll', trackScroll, { passive: true });
    document.addEventListener('click', trackInteraction);
    document.addEventListener('keydown', trackInteraction);

    // Track page changes
    const trackPageChange = () => {
      const timeOnPage = Date.now() - startTime;

      this.trackJourney({
        currentPath: window.location.pathname,
        timeOnPage,
        scrollDepth,
        interactions,
      });

      // Reset for next page
      startTime = Date.now();
      scrollDepth = 0;
      interactions = 0;
    };

    // Listen for navigation events
    window.addEventListener('popstate', trackPageChange);

    // Track initial page
    setTimeout(() => {
      this.trackJourney({
        currentPath: window.location.pathname,
        timeOnPage: Date.now() - startTime,
        scrollDepth: 0,
        interactions: 0,
      });
    }, 100);
  }

  /**
   * Update preload strategy based on journey data
   */
  private updatePreloadStrategy(): void {
    const prediction = this.predictNextActions();

    if (prediction.confidence > 0.3) {
      // Queue high-confidence preloads
      prediction.recommendedPreloads.forEach(candidate => {
        this.queuePreload(candidate);
      });

      // Execute preloading
      this.executePreload();
    }
  }

  /**
   * Analyze path transition patterns
   */
  private analyzePathTransitions(): Record<string, string[]> {
    const transitions: Record<string, Record<string, number>> = {};

    for (let i = 1; i < this.journeyHistory.length; i++) {
      const prev = this.journeyHistory[i - 1];
      const current = this.journeyHistory[i];

      if (!transitions[prev.currentPath]) {
        transitions[prev.currentPath] = {};
      }

      transitions[prev.currentPath][current.currentPath] =
        (transitions[prev.currentPath][current.currentPath] || 0) + 1;
    }

    // Convert to sorted arrays
    const result: Record<string, string[]> = {};
    for (const [fromPath, toPaths] of Object.entries(transitions)) {
      result[fromPath] = Object.entries(toPaths)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3) // Top 3 destinations
        .map(([path]) => path);
    }

    return result;
  }

  /**
   * Generate preload recommendations based on predicted paths
   */
  private generatePreloadRecommendations(nextPaths: string[]): PreloadCandidate[] {
    const recommendations: PreloadCandidate[] = [];

    // Map paths to likely components (this would be configurable)
    const pathComponentMap: Record<string, string[]> = {
      '/': ['hero', 'features', 'pricing'],
      '/features': ['demo', 'pricing', 'faq'],
      '/pricing': ['checkout', 'faq', 'contact'],
      '/demo': ['pricing', 'contact', 'features'],
    };

    for (const path of nextPaths) {
      const components = pathComponentMap[path] || [];
      for (const component of components) {
        recommendations.push({
          component,
          priority: 0.7, // High priority for predicted components
          estimatedBenefit: 500, // Estimated 500ms improvement
          cacheKey: `predicted-${component}`,
          loader: () => import(`@/components/sections/${component}/${component}`),
        });
      }
    }

    return recommendations;
  }

  /**
   * Detect device type
   */
  private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width <= 768) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * Detect connection speed
   */
  private detectConnectionSpeed(): 'slow' | 'medium' | 'fast' {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        const effectiveType = connection.effectiveType;
        if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'slow';
        if (effectiveType === '3g') return 'medium';
        return 'fast';
      }
    }

    // Fallback: estimate based on device memory and hardware concurrency
    const memory = (navigator as any).deviceMemory || 4;
    const cores = navigator.hardwareConcurrency || 4;

    if (memory < 4 || cores < 2) return 'slow';
    if (memory < 8 || cores < 4) return 'medium';
    return 'fast';
  }
}

// Singleton instance
export const preloadStrategy = new PreloadStrategyManager();
