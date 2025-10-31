/**
 * useLazyPerformance - Hook unificado para otimização de performance com lazy loading
 * Combina lazy loading, preload, bundle splitting e monitoramento de CWV
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { bundleSplitter } from "../performance/bundle-splitter";
import { preloadManager } from "../performance/preload-manager";
import { cwvMonitor } from "../performance/cwv-monitor";
import { performanceMonitor } from "../performance/performance-monitor";
import { logger } from "../observability/logger";

export interface LazyPerformanceOptions {
  // Lazy loading
  enableLazyLoading?: boolean;
  rootMargin?: string;
  threshold?: number;
  priority?: 'critical' | 'high' | 'medium' | 'low';

  // Bundle splitting
  enableBundleSplitting?: boolean;
  bundleId?: string;

  // Preload
  enablePreload?: boolean;
  preloadResources?: Array<{
    url: string;
    type: 'image' | 'font' | 'script' | 'style';
    priority?: 'high' | 'medium' | 'low';
  }>;

  // CWV monitoring
  enableCWVMonitoring?: boolean;

  // Performance tracking
  enablePerformanceTracking?: boolean;
  componentName?: string;
}

export interface LazyPerformanceState {
  isVisible: boolean;
  isLoaded: boolean;
  isLoading: boolean;
  hasError: boolean;
  loadTime: number;
  bundleLoaded: boolean;
  resourcesPreloaded: boolean;
}

export interface LazyPerformanceActions {
  loadNow: () => Promise<void>;
  preloadResources: () => Promise<void>;
  getMetrics: () => LazyPerformanceState & { cwv: any };
  reset: () => void;
}

/**
 * Hook unificado para otimização de performance com lazy loading
 */
export function useLazyPerformance(
  options: LazyPerformanceOptions = {}
): [LazyPerformanceState, LazyPerformanceActions] {
  const {
    enableLazyLoading = true,
    rootMargin = "50px",
    threshold = 0.1,
    priority = 'medium',
    enableBundleSplitting = true,
    bundleId,
    enablePreload = true,
    preloadResources = [],
    enableCWVMonitoring = true,
    enablePerformanceTracking = true,
    componentName = 'UnknownComponent'
  } = options;

  // State
  const [state, setState] = useState<LazyPerformanceState>({
    isVisible: priority === 'critical',
    isLoaded: priority === 'critical',
    isLoading: false,
    hasError: false,
    loadTime: 0,
    bundleLoaded: !enableBundleSplitting || priority === 'critical',
    resourcesPreloaded: !enablePreload || priority === 'critical'
  });

  // Refs
  const elementRef = useRef<Element | null>(null);
  const loadStartTime = useRef<number>(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const hasInitialized = useRef(false);

  /**
   * Inicializa o hook
   */
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Iniciar monitoramento de CWV se habilitado
    if (enableCWVMonitoring) {
      cwvMonitor.startMonitoring();
    }

    // Carregar recursos críticos imediatamente se prioridade for critical
    if (priority === 'critical') {
      loadNow();
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enableCWVMonitoring, priority]);

  /**
   * Configura Intersection Observer para lazy loading
   */
  const setupIntersectionObserver = useCallback((element: Element) => {
    if (!enableLazyLoading || priority === 'critical') return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setState(prev => ({ ...prev, isVisible: true }));
          loadNow();
          observerRef.current?.disconnect();
        }
      },
      { rootMargin, threshold }
    );

    observerRef.current.observe(element);
  }, [enableLazyLoading, priority, rootMargin, threshold]);

  /**
   * Carrega recursos imediatamente
   */
  const loadNow = useCallback(async () => {
    if (state.isLoading || state.isLoaded) return;

    setState(prev => ({ ...prev, isLoading: true }));
    loadStartTime.current = performance.now();

    try {
      // Carregar bundle se necessário
      if (enableBundleSplitting && bundleId && !state.bundleLoaded) {
        await bundleSplitter.loadChunk(bundleId);
        setState(prev => ({ ...prev, bundleLoaded: true }));
      }

      // Preload recursos se necessário
      if (enablePreload && !state.resourcesPreloaded) {
        await preloadResourcesInternal();
        setState(prev => ({ ...prev, resourcesPreloaded: true }));
      }

      // Calcular tempo de carregamento
      const loadTime = performance.now() - loadStartTime.current;

      setState(prev => ({
        ...prev,
        isLoaded: true,
        isLoading: false,
        loadTime
      }));

      // Registrar métricas
      if (enablePerformanceTracking) {
        performanceMonitor.recordMetric('lazy_load_success', 1, {
          component: componentName,
          priority,
          loadTime,
          bundleSplitting: enableBundleSplitting,
          preloadEnabled: enablePreload
        });
      }

      logger.info(`${componentName} lazy loaded successfully`, {
        loadTime: loadTime.toFixed(2) + 'ms',
        priority,
        bundleLoaded: state.bundleLoaded,
        resourcesPreloaded: state.resourcesPreloaded
      });

    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        hasError: true
      }));

      if (enablePerformanceTracking) {
        performanceMonitor.recordMetric('lazy_load_error', 1, {
          component: componentName,
          error: error instanceof Error ? error.message : String(error)
        });
      }

      logger.error(`${componentName} lazy load failed`, {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }, [
    state.isLoading,
    state.isLoaded,
    state.bundleLoaded,
    state.resourcesPreloaded,
    enableBundleSplitting,
    bundleId,
    enablePreload,
    enablePerformanceTracking,
    componentName,
    priority
  ]);

  /**
   * Preload recursos específicos
   */
  const preloadResourcesInternal = useCallback(async () => {
    const preloadPromises = preloadResources.map(resource =>
      preloadManager.preload({
        url: resource.url,
        type: resource.type,
        priority: resource.priority || 'medium'
      }).catch(error => {
        logger.warn(`Failed to preload resource: ${resource.url}`, { error });
      })
    );

    await Promise.allSettled(preloadPromises);
  }, [preloadResources]);

  /**
   * Preload recursos manualmente
   */
  const preloadResourcesAction = useCallback(async () => {
    if (!enablePreload || state.resourcesPreloaded) return;

    await preloadResourcesInternal();
    setState(prev => ({ ...prev, resourcesPreloaded: true }));
  }, [enablePreload, state.resourcesPreloaded, preloadResourcesInternal]);

  /**
   * Obtém métricas atuais
   */
  const getMetrics = useCallback(() => {
    const cwvMetrics = enableCWVMonitoring ? cwvMonitor.getMetrics() : null;

    return {
      ...state,
      cwv: cwvMetrics
    };
  }, [state, enableCWVMonitoring]);

  /**
   * Reseta o estado do hook
   */
  const reset = useCallback(() => {
    setState({
      isVisible: priority === 'critical',
      isLoaded: priority === 'critical',
      isLoading: false,
      hasError: false,
      loadTime: 0,
      bundleLoaded: !enableBundleSplitting || priority === 'critical',
      resourcesPreloaded: !enablePreload || priority === 'critical'
    });

    loadStartTime.current = 0;
  }, [priority, enableBundleSplitting, enablePreload]);

  // API do hook
  const actions: LazyPerformanceActions = {
    loadNow,
    preloadResources: preloadResourcesAction,
    getMetrics,
    reset
  };

  return [state, actions];
}

/**
 * Hook simplificado para lazy loading básico de componentes
 */
export function useLazyComponent(
  componentName: string,
  options: Pick<LazyPerformanceOptions, 'priority' | 'rootMargin' | 'threshold'> = {}
) {
  return useLazyPerformance({
    componentName,
    enableLazyLoading: true,
    enableBundleSplitting: false,
    enablePreload: false,
    enableCWVMonitoring: false,
    enablePerformanceTracking: true,
    ...options
  });
}

/**
 * Hook para preload inteligente baseado em contexto
 */
export function useSmartPreload(pageType: string) {
  useEffect(() => {
    // Preload recursos críticos baseado no tipo de página
    preloadManager.preloadCriticalResources(pageType);

    // Habilitar preload preditivo
    preloadManager.enablePredictivePreload();

    logger.info(`Smart preload initialized for page type: ${pageType}`);
  }, [pageType]);
}

/**
 * Hook para monitoramento de Core Web Vitals
 */
export function useCWVMonitoring() {
  const [cwvReport, setCwvReport] = useState(cwvMonitor.generateReport());

  useEffect(() => {
    cwvMonitor.startMonitoring();

    // Atualizar relatório periodicamente
    const interval = setInterval(() => {
      setCwvReport(cwvMonitor.generateReport());
    }, 5000);

    return () => {
      clearInterval(interval);
      cwvMonitor.stopMonitoring();
    };
  }, []);

  return cwvReport;
}
