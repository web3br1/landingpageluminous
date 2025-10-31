/**
 * Bundle Splitter - Otimização inteligente de code splitting
 * Reduz bundle inicial e melhora LCP através de lazy loading de módulos
 */

import { logger } from "../observability/logger";

export interface BundleConfig {
  // Configurações gerais
  enabled: boolean;
  maxInitialBundleSize: number; // em KB
  maxChunkSize: number; // em KB

  // Estratégias de splitting
  splitByRoute: boolean;
  splitByComponent: boolean;
  splitByFeature: boolean;

  // Preload inteligente
  enablePreloadHints: boolean;
  preloadCriticalChunks: boolean;
}

export interface SplitChunk {
  id: string;
  name: string;
  size: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  dependencies: string[];
  preload: boolean;
}

class BundleSplitter {
  private config: BundleConfig;
  private loadedChunks = new Set<string>();
  private loadingPromises = new Map<string, Promise<any>>();
  private chunkRegistry = new Map<string, SplitChunk>();

  constructor(config: BundleConfig = {
    enabled: true,
    maxInitialBundleSize: 200, // 200KB
    maxChunkSize: 100, // 100KB
    splitByRoute: true,
    splitByComponent: true,
    splitByFeature: true,
    enablePreloadHints: true,
    preloadCriticalChunks: true
  }) {
    this.config = config;
    this.initializeChunkRegistry();
  }

  /**
   * Inicializa registro de chunks baseado na estrutura da aplicação
   */
  private initializeChunkRegistry() {
    // Registrar chunks críticos (sempre carregados)
    this.registerChunk({
      id: 'core',
      name: 'Core Framework',
      size: 50,
      priority: 'critical',
      dependencies: [],
      preload: true
    });

    // Registrar chunks por rota
    this.registerChunk({
      id: 'landing',
      name: 'Landing Page',
      size: 120,
      priority: 'critical',
      dependencies: ['core'],
      preload: true
    });

    // Registrar chunks por feature
    this.registerChunk({
      id: 'analytics',
      name: 'Analytics System',
      size: 80,
      priority: 'high',
      dependencies: ['core'],
      preload: false
    });

    this.registerChunk({
      id: 'charts',
      name: 'Charts Library',
      size: 150,
      priority: 'medium',
      dependencies: ['core'],
      preload: false
    });

    this.registerChunk({
      id: 'forms',
      name: 'Advanced Forms',
      size: 90,
      priority: 'medium',
      dependencies: ['core'],
      preload: false
    });

    this.registerChunk({
      id: 'social',
      name: 'Social Features',
      size: 60,
      priority: 'low',
      dependencies: ['core'],
      preload: false
    });
  }

  /**
   * Registra um chunk no sistema
   */
  registerChunk(chunk: SplitChunk) {
    this.chunkRegistry.set(chunk.id, chunk);

    // Adicionar hints de preload para chunks críticos
    if (this.config.enablePreloadHints && chunk.preload && typeof document !== 'undefined') {
      this.addPreloadHint(chunk);
    }
  }

  /**
   * Adiciona hint de preload para chunk crítico
   */
  private addPreloadHint(chunk: SplitChunk) {
    if (typeof document === 'undefined') return;

    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = `/chunks/${chunk.id}.js`;
    link.crossOrigin = 'anonymous';

    document.head.appendChild(link);
  }

  /**
   * Carrega um chunk sob demanda
   */
  async loadChunk(chunkId: string): Promise<any> {
    if (this.loadedChunks.has(chunkId)) {
      return Promise.resolve();
    }

    if (this.loadingPromises.has(chunkId)) {
      return this.loadingPromises.get(chunkId);
    }

    const chunk = this.chunkRegistry.get(chunkId);
    if (!chunk) {
      throw new Error(`Chunk ${chunkId} not registered`);
    }

    const loadPromise = this.loadChunkInternal(chunk);
    this.loadingPromises.set(chunkId, loadPromise);

    try {
      const result = await loadPromise;
      this.loadedChunks.add(chunkId);
      this.loadingPromises.delete(chunkId);

      logger.info(`Chunk loaded: ${chunkId}`, {
        size: chunk.size,
        priority: chunk.priority,
        loadTime: performance.now()
      });

      return result;
    } catch (error) {
      this.loadingPromises.delete(chunkId);
      throw error;
    }
  }

  /**
   * Implementação interna do carregamento de chunk
   */
  private async loadChunkInternal(chunk: SplitChunk): Promise<any> {
    // Carregar dependências primeiro
    for (const dep of chunk.dependencies) {
      if (!this.loadedChunks.has(dep)) {
        await this.loadChunk(dep);
      }
    }

    // Simulação de carregamento dinâmico
    // Em produção, isso seria feito com import() ou webpack magic comments
    const startTime = performance.now();

    try {
      // Dynamic import simulation
      const module = await this.simulateDynamicImport(chunk.id);
      const loadTime = performance.now() - startTime;

      // Reportar métricas
      if (typeof window !== 'undefined' && 'performance' in window) {
        performance.mark(`chunk-${chunk.id}-loaded`);
        performance.measure(`chunk-${chunk.id}-load-time`, `chunk-${chunk.id}-loaded`);
      }

      logger.info(`Chunk ${chunk.id} loaded in ${loadTime.toFixed(2)}ms`);

      return module;
    } catch (error) {
      logger.error(`Failed to load chunk ${chunk.id}`, { error });
      throw error;
    }
  }

  /**
   * Simulação de dynamic import (em produção seria import() real)
   */
  private async simulateDynamicImport(chunkId: string): Promise<any> {
    // Simular delay baseado no tamanho do chunk
    const chunk = this.chunkRegistry.get(chunkId);
    const delay = chunk ? chunk.size / 50 : 100; // Simulação: 50KB/s

    await new Promise(resolve => setTimeout(resolve, delay));

    // Retornar módulo simulado
    return {
      default: () => null,
      [chunkId]: true
    };
  }

  /**
   * Carrega chunks baseado na rota atual
   */
  async loadRouteChunks(route: string) {
    const routeChunks = this.getChunksForRoute(route);

    const loadPromises = routeChunks
      .filter(chunk => chunk.priority === 'critical')
      .map(chunk => this.loadChunk(chunk.id));

    await Promise.all(loadPromises);

    logger.info(`Route chunks loaded for: ${route}`, {
      chunksLoaded: routeChunks.length
    });
  }

  /**
   * Obtém chunks necessários para uma rota específica
   */
  private getChunksForRoute(route: string): SplitChunk[] {
    const chunks: SplitChunk[] = [];

    // Sempre carregar core
    const coreChunk = this.chunkRegistry.get('core');
    if (coreChunk) chunks.push(coreChunk);

    // Carregar chunks específicos da rota
    switch (route) {
      case '/':
      case '/landing':
        const landingChunk = this.chunkRegistry.get('landing');
        if (landingChunk) chunks.push(landingChunk);
        break;

      case '/product':
        const chartsChunk = this.chunkRegistry.get('charts');
        if (chartsChunk) chunks.push(chartsChunk);
        break;

      case '/contact':
        const formsChunk = this.chunkRegistry.get('forms');
        if (formsChunk) chunks.push(formsChunk);
        break;

      case '/blog':
        const socialChunk = this.chunkRegistry.get('social');
        if (socialChunk) chunks.push(socialChunk);
        break;
    }

    return chunks;
  }

  /**
   * Carrega chunks baseado em interações do usuário
   */
  async loadOnInteraction(interactionType: string) {
    const chunksToLoad = this.getChunksForInteraction(interactionType);

    if (chunksToLoad.length > 0) {
      logger.info(`Loading chunks for interaction: ${interactionType}`, {
        chunks: chunksToLoad.map(c => c.id)
      });

      await Promise.all(chunksToLoad.map(chunk => this.loadChunk(chunk.id)));
    }
  }

  /**
   * Obtém chunks para um tipo de interação específico
   */
  private getChunksForInteraction(interactionType: string): SplitChunk[] {
    const chunks: SplitChunk[] = [];

    switch (interactionType) {
      case 'form-focus':
        const formsChunk = this.chunkRegistry.get('forms');
        if (formsChunk) chunks.push(formsChunk);
        break;

      case 'chart-hover':
        const chartsChunk = this.chunkRegistry.get('charts');
        if (chartsChunk) chunks.push(chartsChunk);
        break;

      case 'social-share':
        const socialChunk = this.chunkRegistry.get('social');
        if (socialChunk) chunks.push(socialChunk);
        break;

      case 'analytics-event':
        const analyticsChunk = this.chunkRegistry.get('analytics');
        if (analyticsChunk) chunks.push(analyticsChunk);
        break;
    }

    return chunks;
  }

  /**
   * Preload inteligente de chunks baseado em padrões de uso
   */
  async preloadPredictedChunks() {
    if (typeof window === 'undefined') return;

    // Analisar padrões de navegação
    const navigationHistory = this.getNavigationPatterns();

    // Preload chunks baseado em probabilidade
    const predictedChunks = this.predictChunksToLoad(navigationHistory);

    if (predictedChunks.length > 0) {
      logger.info('Preloading predicted chunks', {
        chunks: predictedChunks.map(c => c.id)
      });

      // Carregar em background sem bloquear
      predictedChunks.forEach(chunk => {
        this.loadChunk(chunk.id).catch(error => {
          logger.warn(`Failed to preload predicted chunk: ${chunk.id}`, { error });
        });
      });
    }
  }

  /**
   * Analisa padrões de navegação do usuário
   */
  private getNavigationPatterns(): string[] {
    // Implementar análise de sessionStorage/localStorage
    // ou integração com analytics para padrões de navegação
    return ['/', '/product', '/pricing'];
  }

  /**
   * Prediz chunks a carregar baseado em padrões
   */
  private predictChunksToLoad(navigationHistory: string[]): SplitChunk[] {
    const predictedChunks: SplitChunk[] = [];

    // Lógica simples: se usuário visitou product, provavelmente vai ver charts
    if (navigationHistory.includes('/product')) {
      const chartsChunk = this.chunkRegistry.get('charts');
      if (chartsChunk) predictedChunks.push(chartsChunk);
    }

    // Se visitou várias páginas, provavelmente vai usar analytics
    if (navigationHistory.length > 2) {
      const analyticsChunk = this.chunkRegistry.get('analytics');
      if (analyticsChunk) predictedChunks.push(analyticsChunk);
    }

    return predictedChunks;
  }

  /**
   * Obtém estatísticas do bundle splitting
   */
  getStats() {
    return {
      loadedChunks: Array.from(this.loadedChunks),
      loadingPromises: Array.from(this.loadingPromises.keys()),
      registeredChunks: Array.from(this.chunkRegistry.keys()),
      config: this.config
    };
  }
}

// Singleton instance
export const bundleSplitter = new BundleSplitter();

// Export default para compatibilidade
export default bundleSplitter;
