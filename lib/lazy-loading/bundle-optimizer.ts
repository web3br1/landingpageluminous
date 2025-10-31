/**
 * Bundle Optimizer - BLOCO 2: Lazy Loading
 *
 * Sistema de otimização de bundle splitting para componentes lazy-loaded
 * Estratégias inteligentes de divisão de código baseada em prioridade e uso
 */

import { logger } from '../observability/logger';

interface BundleConfig {
  name: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  components: string[];
  estimatedSize: number; // in KB
  dependencies: string[];
  preload: boolean;
}

interface SplittingStrategy {
  name: string;
  chunks: BundleConfig[];
  maxChunkSize: number; // in KB
  minChunkSize: number; // in KB
  strategy: 'route-based' | 'component-based' | 'priority-based';
}

export class BundleOptimizer {
  private strategies: Map<string, SplittingStrategy> = new Map();
  private currentStrategy: string = 'default';

  constructor() {
    this.initializeStrategies();
  }

  /**
   * Initialize default bundle splitting strategies
   */
  private initializeStrategies(): void {
    // Strategy 1: Route-based splitting
    this.strategies.set('route-based', {
      name: 'Route-based Splitting',
      maxChunkSize: 500, // 500KB
      minChunkSize: 50,  // 50KB
      strategy: 'route-based',
      chunks: [
        {
          name: 'marketing-core',
          priority: 'critical',
          components: ['hero', 'features', 'pricing'],
          estimatedSize: 300,
          dependencies: ['framer-motion', 'lucide-react'],
          preload: true,
        },
        {
          name: 'marketing-extended',
          priority: 'high',
          components: ['demo', 'faq', 'testimonials'],
          estimatedSize: 400,
          dependencies: ['react-intersection-observer'],
          preload: false,
        },
        {
          name: 'admin-bundle',
          priority: 'low',
          components: ['admin-layout', 'experiment-dashboard', 'performance-dashboard'],
          estimatedSize: 600,
          dependencies: ['recharts', 'react-hook-form'],
          preload: false,
        },
        {
          name: 'checkout-bundle',
          priority: 'medium',
          components: ['checkout-form', 'payment-methods'],
          estimatedSize: 350,
          dependencies: ['@stripe/stripe-js', 'react-hook-form'],
          preload: false,
        },
      ],
    });

    // Strategy 2: Component-based splitting (smaller chunks)
    this.strategies.set('component-based', {
      name: 'Component-based Splitting',
      maxChunkSize: 200, // 200KB
      minChunkSize: 20,  // 20KB
      strategy: 'component-based',
      chunks: [
        {
          name: 'ui-core',
          priority: 'critical',
          components: ['button', 'input', 'modal'],
          estimatedSize: 150,
          dependencies: ['@radix-ui/react-dialog'],
          preload: true,
        },
        {
          name: 'ui-extended',
          priority: 'high',
          components: ['dropdown', 'tabs', 'accordion'],
          estimatedSize: 180,
          dependencies: ['@radix-ui/react-dropdown-menu'],
          preload: false,
        },
        {
          name: 'animations',
          priority: 'medium',
          components: ['fade-up', 'slide-in', 'morph-svg'],
          estimatedSize: 250,
          dependencies: ['framer-motion'],
          preload: false,
        },
        {
          name: 'charts',
          priority: 'low',
          components: ['bar-chart', 'line-chart', 'pie-chart'],
          estimatedSize: 300,
          dependencies: ['recharts'],
          preload: false,
        },
      ],
    });

    // Strategy 3: Priority-based splitting
    this.strategies.set('priority-based', {
      name: 'Priority-based Splitting',
      maxChunkSize: 300, // 300KB
      minChunkSize: 30,  // 30KB
      strategy: 'priority-based',
      chunks: [
        {
          name: 'critical-above-fold',
          priority: 'critical',
          components: ['hero', 'navigation', 'cta-button'],
          estimatedSize: 200,
          dependencies: ['framer-motion'],
          preload: true,
        },
        {
          name: 'high-priority',
          priority: 'high',
          components: ['features', 'pricing', 'footer'],
          estimatedSize: 350,
          dependencies: ['lucide-react'],
          preload: true,
        },
        {
          name: 'medium-priority',
          priority: 'medium',
          components: ['demo', 'faq', 'contact-form'],
          estimatedSize: 280,
          dependencies: ['react-hook-form'],
          preload: false,
        },
        {
          name: 'low-priority',
          priority: 'low',
          components: ['admin-tools', 'analytics-dashboard', 'debug-tools'],
          estimatedSize: 450,
          dependencies: ['recharts', 'react-query'],
          preload: false,
        },
      ],
    });
  }

  /**
   * Set active splitting strategy
   */
  setStrategy(strategyName: string): void {
    if (this.strategies.has(strategyName)) {
      this.currentStrategy = strategyName;
      logger.info("Bundle splitting strategy changed", { strategy: strategyName });
    } else {
      logger.warn("Unknown bundle strategy", { strategy: strategyName });
    }
  }

  /**
   * Get current strategy configuration
   */
  getCurrentStrategy(): SplittingStrategy | null {
    return this.strategies.get(this.currentStrategy) || null;
  }

  /**
   * Generate dynamic imports for a component
   */
  generateLazyImport(componentName: string, options: {
    priority?: 'critical' | 'high' | 'medium' | 'low';
    chunkName?: string;
    preload?: boolean;
  } = {}): string {
    const { priority = 'medium', chunkName, preload = false } = options;

    const strategy = this.getCurrentStrategy();
    if (!strategy) return this.generateBasicImport(componentName);

    // Find component in strategy chunks
    const chunk = strategy.chunks.find(c =>
      c.components.includes(componentName) ||
      c.name === chunkName
    );

    if (chunk) {
      return this.generateOptimizedImport(componentName, chunk);
    }

    // Fallback to basic import
    return this.generateBasicImport(componentName);
  }

  /**
   * Analyze bundle efficiency
   */
  analyzeBundleEfficiency(): {
    totalEstimatedSize: number;
    chunkCount: number;
    averageChunkSize: number;
    largestChunk: { name: string; size: number };
    smallestChunk: { name: string; size: number };
    efficiency: number; // 0-1, higher is better
  } {
    const strategy = this.getCurrentStrategy();
    if (!strategy) {
      return {
        totalEstimatedSize: 0,
        chunkCount: 0,
        averageChunkSize: 0,
        largestChunk: { name: '', size: 0 },
        smallestChunk: { name: '', size: 0 },
        efficiency: 0,
      };
    }

    const chunks = strategy.chunks;
    const totalSize = chunks.reduce((sum, chunk) => sum + chunk.estimatedSize, 0);
    const avgSize = totalSize / chunks.length;

    const largest = chunks.reduce((max, chunk) =>
      chunk.estimatedSize > max.size ? { name: chunk.name, size: chunk.estimatedSize } : max,
      { name: '', size: 0 }
    );

    const smallest = chunks.reduce((min, chunk) =>
      chunk.estimatedSize < min.size ? { name: chunk.name, size: chunk.estimatedSize } : min,
      { name: '', size: Infinity }
    );

    // Calculate efficiency (inverse of variance from optimal size)
    const optimalSize = (strategy.maxChunkSize + strategy.minChunkSize) / 2;
    const variance = chunks.reduce((sum, chunk) =>
      sum + Math.pow(chunk.estimatedSize - optimalSize, 2), 0
    ) / chunks.length;

    const efficiency = Math.max(0, 1 - (variance / Math.pow(strategy.maxChunkSize, 2)));

    return {
      totalEstimatedSize: totalSize,
      chunkCount: chunks.length,
      averageChunkSize: Math.round(avgSize),
      largestChunk: largest,
      smallestChunk: smallest,
      efficiency: Math.round(efficiency * 100) / 100,
    };
  }

  /**
   * Optimize strategy based on usage patterns
   */
  optimizeStrategy(usageData: {
    componentUsage: Record<string, number>;
    loadTimes: Record<string, number>;
    failureRates: Record<string, number>;
  }): void {
    const { componentUsage, loadTimes, failureRates } = usageData;

    // Analyze usage patterns and adjust strategy
    const highUsageComponents = Object.entries(componentUsage)
      .filter(([, count]) => count > 10) // Used more than 10 times
      .map(([component]) => component);

    const slowComponents = Object.entries(loadTimes)
      .filter(([, time]) => time > 2000) // Slower than 2s
      .map(([component]) => component);

    const failingComponents = Object.entries(failureRates)
      .filter(([, rate]) => rate > 0.1) // >10% failure rate
      .map(([component]) => component);

    // Adjust strategy based on analysis
    const strategy = this.getCurrentStrategy();
    if (strategy) {
      // Move high-usage components to higher priority chunks
      highUsageComponents.forEach(component => {
        const chunk = strategy.chunks.find(c => c.components.includes(component));
        if (chunk && chunk.priority !== 'critical') {
          chunk.priority = 'high';
          logger.info("Optimized component priority", { component, newPriority: 'high' });
        }
      });

      // Log optimization recommendations
      logger.info("Bundle optimization analysis", {
        highUsageComponents: highUsageComponents.length,
        slowComponents: slowComponents.length,
        failingComponents: failingComponents.length,
        recommendations: [
          slowComponents.length > 0 ? "Consider code splitting for slow components" : null,
          failingComponents.length > 0 ? "Review error handling for failing components" : null,
          highUsageComponents.length > 0 ? "Consider preloading high-usage components" : null,
        ].filter(Boolean),
      });
    }
  }

  /**
   * Generate webpack chunk configuration
   */
  generateWebpackChunks(): Record<string, any[]> {
    const strategy = this.getCurrentStrategy();
    if (!strategy) return {};

    const chunks: Record<string, any[]> = {};

    strategy.chunks.forEach(chunk => {
      chunks[chunk.name] = chunk.components.map(component =>
        // Generate import paths for components
        `@/components/${component}`
      );
    });

    return chunks;
  }

  /**
   * Get all available strategies
   */
  getAvailableStrategies(): string[] {
    return Array.from(this.strategies.keys());
  }

  /**
   * Generate basic lazy import
   */
  private generateBasicImport(componentName: string): string {
    return `const ${componentName} = lazy(() => import('@/components/${componentName}'));`;
  }

  /**
   * Generate optimized lazy import with chunk hints
   */
  private generateOptimizedImport(componentName: string, chunk: BundleConfig): string {
    const chunkHint = `/* webpackChunkName: "${chunk.name}" */`;
    const preloadHint = chunk.preload ? `/* webpackPreload: true */` : '';

    return `const ${componentName} = lazy(() =>
  import(${chunkHint}${preloadHint}'@/components/${componentName}')
);`;
  }
}

// Singleton instance
export const bundleOptimizer = new BundleOptimizer();

// Utility functions for common use cases
export function createLazyComponent(
  componentName: string,
  options: {
    priority?: 'critical' | 'high' | 'medium' | 'low';
    chunkName?: string;
    preload?: boolean;
  } = {}
) {
  const importStatement = bundleOptimizer.generateLazyImport(componentName, options);

  return {
    importStatement,
    componentName,
    options,
  };
}

export function getOptimalChunkStrategy(
  componentCount: number,
  estimatedTotalSize: number
): string {
  const avgSize = estimatedTotalSize / componentCount;

  if (avgSize < 100) return 'component-based'; // Small components
  if (avgSize < 300) return 'priority-based'; // Medium components
  return 'route-based'; // Large components
}
