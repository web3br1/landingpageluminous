"use client";

import React, { useState, useRef, useEffect, useCallback, ReactNode } from "react";
import { SectionRenderer } from "@/lib/composition/section-renderer";
import type { SectionConfig } from "@/lib/composition/page-composer";
import { bundleSplitter } from "@/lib/performance/bundle-splitter";
import { preloadManager } from "@/lib/performance/preload-manager";
import { getLazyLoadConfig } from "@/lib/performance/lazy-loading-config";
import { cn } from "@/lib/utils";

interface SmartLazySectionProps {
  section: SectionConfig;
  index: number;
  onSectionError?: (sectionId: string, error: Error) => void;
  onSectionLoad?: (sectionId: string, loadTime: number) => void;

  // Configurações de lazy loading
  priority?: 'critical' | 'high' | 'medium' | 'low';
  rootMargin?: string;
  threshold?: number;
  fallback?: ReactNode;

  // Otimizações de performance
  enableBundleSplitting?: boolean;
  enablePreload?: boolean;
  enableCaching?: boolean;

  // Configurações visuais
  className?: string;
  style?: React.CSSProperties;
}

/**
 * SmartLazySection - Lazy loading inteligente otimizado para Core Web Vitals
 *
 * Recursos:
 * - Lazy loading baseado em viewport com Intersection Observer
 * - Bundle splitting automático por componente
 * - Preload inteligente de recursos críticos
 * - Cache inteligente para re-renders
 * - Monitoramento de performance integrado
 * - Fallbacks adaptativos
 */
export function SmartLazySection({
  section,
  index,
  onSectionError,
  onSectionLoad,
  priority = 'medium',
  rootMargin = "50px",
  threshold = 0.1,
  fallback,
  enableBundleSplitting = true,
  enablePreload = true,
  enableCaching = true,
  className,
  style,
}: SmartLazySectionProps) {
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [isVisible, setIsVisible] = useState(priority === 'critical');
  const [hasLoaded, setHasLoaded] = useState(priority === 'critical');
  const [bundleLoaded, setBundleLoaded] = useState(!enableBundleSplitting);

  const sectionRef = useRef<HTMLDivElement>(null);
  const loadStartTime = useRef<number>(0);
  const intersectionDelay = useRef<number>(0);

  // Obter configuração específica do componente
  const componentConfig = getLazyLoadConfig(section.component);

  // Calcular prioridade efetiva
  const effectivePriority = componentConfig?.priority === 'critical' ? 'critical' :
                           priority === 'critical' ? 'critical' :
                           componentConfig?.priority || priority;

  /**
   * Carrega o bundle necessário para este componente
   */
  const loadBundle = useCallback(async () => {
    if (!enableBundleSplitting || bundleLoaded) return;

    try {
      setLoadState('loading');

      // Determinar qual bundle carregar baseado no tipo de componente
      const bundleId = getBundleForComponent(section.component);

      if (bundleId) {
        await bundleSplitter.loadChunk(bundleId);
      }

      setBundleLoaded(true);
    } catch (error) {
      console.error(`Failed to load bundle for ${section.component}:`, error);
      setLoadState('error');
      onSectionError?.(section.id, error as Error);
    }
  }, [enableBundleSplitting, bundleLoaded, section.component, section.id, onSectionError]);

  /**
   * Inicia preload de recursos relacionados
   */
  const startPreload = useCallback(() => {
    if (!enablePreload) return;

    // Preload recursos baseado no tipo de seção
    const resourcesToPreload = getResourcesForSection(section);

    resourcesToPreload.forEach(resource => {
      preloadManager.preload(resource);
    });
  }, [enablePreload, section]);

  /**
   * Configura Intersection Observer para lazy loading
   */
  useEffect(() => {
    if (effectivePriority === 'critical' || hasLoaded) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          const now = performance.now();
          intersectionDelay.current = now - (loadStartTime.current || now);

          setIsVisible(true);
          setLoadState('loading');
          loadStartTime.current = now;

          // Iniciar carregamento em paralelo
          Promise.all([
            loadBundle(),
            startPreload()
          ]).then(() => {
            setHasLoaded(true);
            setLoadState('loaded');
          }).catch((error) => {
            setLoadState('error');
            onSectionError?.(section.id, error as Error);
          });

          observer.disconnect();
        }
      },
      {
        rootMargin,
        threshold
      }
    );

    const currentRef = sectionRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    // Fallback timeout - carregar após 5 segundos se IntersectionObserver falhar
    const fallbackTimeout = setTimeout(() => {
      if (!isVisible && loadState === 'idle') {
        console.warn(`IntersectionObserver fallback triggered for ${section.id}`);
        setIsVisible(true);
        setLoadState('loading');

        loadBundle().then(() => {
          setHasLoaded(true);
          setLoadState('loaded');
        }).catch((error) => {
          setLoadState('error');
          onSectionError?.(section.id, error as Error);
        });
      }
    }, 5000);

    return () => {
      clearTimeout(fallbackTimeout);
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [
    effectivePriority,
    hasLoaded,
    loadState,
    rootMargin,
    threshold,
    section.id,
    isVisible,
    loadBundle,
    startPreload,
    onSectionError
  ]);

  /**
   * Handler para quando a seção termina de carregar
   */
  const handleLoad = useCallback((sectionId: string, loadTime: number) => {
    const totalLoadTime = performance.now() - (loadStartTime.current || 0);

    // Reportar métricas de performance
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`section-${sectionId}-loaded`);
      performance.measure(`section-${sectionId}-load-time`, `section-${sectionId}-loaded`);
    }

    // Log detalhado em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 SmartLazySection ${sectionId} loaded:`, {
        totalTime: totalLoadTime.toFixed(2) + 'ms',
        intersectionDelay: intersectionDelay.current.toFixed(2) + 'ms',
        bundleTime: (totalLoadTime - intersectionDelay.current).toFixed(2) + 'ms',
        priority: effectivePriority,
        bundleSplitting: enableBundleSplitting,
        bundleLoaded,
      });
    }

    onSectionLoad?.(sectionId, totalLoadTime);
  }, [effectivePriority, enableBundleSplitting, bundleLoaded, onSectionLoad]);

  /**
   * Handler para erros na seção
   */
  const handleError = useCallback((sectionId: string, error: Error) => {
    console.error(`❌ SmartLazySection error for ${sectionId}:`, error);
    setLoadState('error');

    onSectionError?.(sectionId, error);
  }, [onSectionError]);

  // Renderizar loading state
  if (loadState === 'loading' && !hasLoaded) {
    return (
      <div
        ref={sectionRef}
        className={cn(
          "min-h-[300px] flex items-center justify-center",
          "bg-gradient-to-br from-neutral-50 to-neutral-100",
          "dark:from-neutral-900 dark:to-neutral-800",
          className
        )}
        style={style}
        data-section-id={section.id}
        data-loading="true"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-medium text-neutral-700 dark:text-neutral-300">
            Carregando {section.component}...
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
            Otimizando performance para você
          </p>
        </div>
      </div>
    );
  }

  // Renderizar error state
  if (loadState === 'error') {
    return (
      <div
        ref={sectionRef}
        className={cn(
          "min-h-[300px] flex items-center justify-center",
          "bg-red-50 dark:bg-red-900/20",
          "border border-red-200 dark:border-red-800",
          className
        )}
        style={style}
        data-section-id={section.id}
        data-error="true"
      >
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-lg font-medium text-red-700 dark:text-red-300">
            Erro ao carregar seção
          </p>
          <p className="text-sm text-red-600 dark:text-red-400 mt-2">
            Tente recarregar a página
          </p>
        </div>
      </div>
    );
  }

  // Renderizar conteúdo principal
  return (
    <div
      ref={sectionRef}
      className={cn(
        "transition-opacity duration-300",
        hasLoaded ? "opacity-100" : "opacity-0",
        className
      )}
      style={style}
      data-section-id={section.id}
      data-loaded={hasLoaded}
      data-priority={effectivePriority}
    >
      {isVisible && bundleLoaded && (
        <SectionRenderer
          sectionId={section.id}
          data={(section.content as unknown as Record<string, unknown>) || {}}
          className=""
        />
      )}

      {/* Fallback personalizado ou padrão */}
      {fallback && !hasLoaded && !isVisible && (
        <div className="min-h-[300px]">
          {fallback}
        </div>
      )}
    </div>
  );
}

/**
 * Helper: Determina qual bundle carregar para um componente
 */
function getBundleForComponent(componentName: string): string | null {
  const bundleMap: Record<string, string> = {
    'hero': 'landing',
    'features': 'landing',
    'pricing': 'landing',
    'testimonials': 'landing',
    'cta': 'landing',
    'chart': 'charts',
    'form': 'forms',
    'lead-form': 'forms',
    'social-share': 'social',
    'analytics-dashboard': 'analytics',
  };

  return bundleMap[componentName] || null;
}

/**
 * Helper: Obtém recursos para preload baseado na seção
 */
function getResourcesForSection(section: SectionConfig) {
  const resources: any[] = [];

  // Preload de imagens baseado no tipo de seção
  switch (section.component) {
    case 'hero':
      resources.push({
        url: '/images/hero-bg.webp',
        type: 'image' as const,
        priority: 'high' as const
      });
      break;

    case 'features':
      resources.push({
        url: '/images/features-preview.webp',
        type: 'image' as const,
        priority: 'medium' as const
      });
      break;

    case 'pricing':
      resources.push({
        url: '/images/pricing-bg.webp',
        type: 'image' as const,
        priority: 'medium' as const
      });
      break;
  }

  return resources;
}

/**
 * Hook para usar SmartLazySection com configurações inteligentes
 */
export function useSmartLazyConfig(componentName: string) {
  const config = getLazyLoadConfig(componentName);

  return {
    priority: config?.priority || 'medium',
    rootMargin: '50px',
    threshold: 0.1,
    enableBundleSplitting: false,
    enablePreload: false,
    enableCaching: false,
  };
}
