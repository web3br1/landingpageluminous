"use client";

import { logger } from "../../observability/logger";
import { storageManager } from "./storage-manager";

/**
 * Smart Threshold Manager - Versão Simplificada e Econômica
 * Regras heurísticas inteligentes em vez de ML complexo
 */

export interface ThresholdContext {
  networkType: "slow-2g" | "2g" | "3g" | "4g" | "fast";
  connectionSpeed: "slow" | "medium" | "fast";
  deviceType: "mobile" | "tablet" | "desktop";
  deviceMemory: "low" | "medium" | "high";
  cpuCores: number;
  userEngagement: "low" | "medium" | "high";
  timeOfDay: "peak" | "off-peak";
  batteryLevel?: "low" | "normal";
}

export interface AdaptiveThresholds {
  intersectionRatio: number; // 0.1 - 1.0
  preloadDistance: number; // pixels
  skeletonDuration: number; // ms
  fullContentDelay: number; // ms
  batchSize: number; // items to load together
  retryAttempts: number;
  timeout: number; // ms
}

export interface ThresholdMetrics {
  currentThresholds: AdaptiveThresholds;
  context: ThresholdContext;
  performance: {
    avgLoadTime: number;
    failureRate: number;
    userSatisfaction: number;
  };
  lastUpdated: number;
  adaptations: number;
}

/**
 * Regras heurísticas para adaptação inteligente
 */
class ThresholdRules {
  /**
   * Calcula threshold baseado na velocidade da rede
   */
  static getNetworkThreshold(networkType: string): number {
    const thresholds = {
      "slow-2g": 0.8, // Carrega mais cedo em rede lenta
      "2g": 0.6,
      "3g": 0.4,
      "4g": 0.2,
      "fast": 0.1, // Carrega mais tarde em rede rápida
    };
    return thresholds[networkType as keyof typeof thresholds] || 0.3;
  }

  /**
   * Calcula preload distance baseado no device type
   */
  static getPreloadDistance(deviceType: string, connectionSpeed: string): number {
    const baseDistances = {
      mobile: { slow: 500, medium: 800, fast: 1200 },
      tablet: { slow: 800, medium: 1200, fast: 1800 },
      desktop: { slow: 1200, medium: 1800, fast: 2500 },
    };

    const device = deviceType as keyof typeof baseDistances;
    const speed = connectionSpeed as keyof typeof baseDistances.mobile;

    return baseDistances[device]?.[speed] || 1000;
  }

  /**
   * Calcula skeleton duration baseado na performance do dispositivo
   */
  static getSkeletonDuration(deviceMemory: string, cpuCores: number): number {
    const baseDuration = 2000; // 2 segundos base

    // Ajusta baseado na capacidade do dispositivo
    let multiplier = 1.0;

    if (deviceMemory === "low" || cpuCores <= 2) {
      multiplier = 1.5; // Mais tempo para dispositivos fracos
    } else if (deviceMemory === "high" && cpuCores >= 4) {
      multiplier = 0.7; // Menos tempo para dispositivos potentes
    }

    return Math.round(baseDuration * multiplier);
  }

  /**
   * Calcula batch size baseado no contexto
   */
  static getBatchSize(userEngagement: string, networkType: string): number {
    // Usuários engajados podem carregar mais itens
    const engagementMultiplier = {
      low: 1,
      medium: 2,
      high: 3,
    };

    // Redes mais rápidas suportam batches maiores
    const networkMultiplier = {
      "slow-2g": 0.5,
      "2g": 0.7,
      "3g": 1.0,
      "4g": 1.5,
      "fast": 2.0,
    };

    const baseBatch = 3;
    const engagement = engagementMultiplier[userEngagement as keyof typeof engagementMultiplier] || 1;
    const network = networkMultiplier[networkType as keyof typeof networkMultiplier] || 1;

    return Math.max(1, Math.round(baseBatch * engagement * network));
  }

  /**
   * Calcula timeout baseado na rede e engajamento
   */
  static getTimeout(networkType: string, userEngagement: string): number {
    const baseTimeout = 5000; // 5 segundos base

    // Redes mais lentas precisam de mais tempo
    const networkMultiplier = {
      "slow-2g": 3.0,
      "2g": 2.0,
      "3g": 1.5,
      "4g": 1.0,
      "fast": 0.8,
    };

    // Usuários engajados toleram mais espera
    const engagementMultiplier = {
      low: 0.8,
      medium: 1.0,
      high: 1.2,
    };

    const network = networkMultiplier[networkType as keyof typeof networkMultiplier] || 1;
    const engagement = engagementMultiplier[userEngagement as keyof typeof engagementMultiplier] || 1;

    return Math.round(baseTimeout * network * engagement);
  }
}

/**
 * Detector de contexto inteligente
 */
class ContextDetector {
  static detectNetworkType(): ThresholdContext["networkType"] {
    if (typeof navigator === "undefined") return "4g";

    // Usa Network Information API se disponível
    const connection = (navigator as any).connection;
    if (connection?.effectiveType) {
      const type = connection.effectiveType;
      if (type.includes("slow")) return "slow-2g";
      if (type.includes("2g")) return "2g";
      if (type.includes("3g")) return "3g";
      if (type.includes("4g")) return "4g";
    }

    // Fallback baseado em download speed estimado
    const downloadSpeed = connection?.downlink || 10;
    if (downloadSpeed < 1) return "slow-2g";
    if (downloadSpeed < 2) return "2g";
    if (downloadSpeed < 5) return "3g";
    if (downloadSpeed < 10) return "4g";
    return "fast";
  }

  static detectConnectionSpeed(): ThresholdContext["connectionSpeed"] {
    if (typeof navigator === "undefined") return "medium";

    const connection = (navigator as any).connection;
    const downlink = connection?.downlink || 10;

    if (downlink < 2) return "slow";
    if (downlink < 10) return "medium";
    return "fast";
  }

  static detectDeviceType(): ThresholdContext["deviceType"] {
    if (typeof window === "undefined") return "desktop";

    const width = window.innerWidth;
    if (width <= 768) return "mobile";
    if (width <= 1024) return "tablet";
    return "desktop";
  }

  static detectDeviceMemory(): ThresholdContext["deviceMemory"] {
    if (typeof navigator === "undefined") return "medium";

    // Usa Device Memory API se disponível
    const deviceMemory = (navigator as any).deviceMemory;
    if (deviceMemory) {
      if (deviceMemory <= 2) return "low";
      if (deviceMemory <= 4) return "medium";
      return "high";
    }

    // Fallback baseado em user agent
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes("mobile") || ua.includes("android")) return "low";
    return "medium";
  }

  static detectCpuCores(): number {
    if (typeof navigator === "undefined") return 4;

    return navigator.hardwareConcurrency || 4;
  }

  static detectUserEngagement(): ThresholdContext["userEngagement"] {
    // Simples heurística baseada em tempo na página e interações
    const timeSpent = storageManager.getItem("timeSpent") || 0;
    const interactions = storageManager.getItem("interactionCount") || 0;

    if (timeSpent > 120 && interactions > 10) return "high";
    if (timeSpent > 30 && interactions > 3) return "medium";
    return "low";
  }

  static detectTimeOfDay(): ThresholdContext["timeOfDay"] {
    const hour = new Date().getHours();
    // Assume horário comercial como peak
    return (hour >= 8 && hour <= 18) ? "peak" : "off-peak";
  }

  static detectBatteryLevel(): ThresholdContext["batteryLevel"] {
    if (typeof navigator === "undefined") return "normal";

    const battery = (navigator as any).getBattery;
    if (battery && typeof battery === "function") {
      // Battery API disponível
      return new Promise((resolve) => {
        battery().then((batteryManager: any) => {
          resolve(batteryManager.level < 0.2 ? "low" : "normal");
        }).catch(() => resolve("normal"));
      });
    }

    return "normal";
  }

  static async getFullContext(): Promise<ThresholdContext> {
    const batteryLevel = await this.detectBatteryLevel();

    return {
      networkType: this.detectNetworkType(),
      connectionSpeed: this.detectConnectionSpeed(),
      deviceType: this.detectDeviceType(),
      deviceMemory: this.detectDeviceMemory(),
      cpuCores: this.detectCpuCores(),
      userEngagement: this.detectUserEngagement(),
      timeOfDay: this.detectTimeOfDay(),
      batteryLevel: typeof batteryLevel === "string" ? batteryLevel : "normal",
    };
  }
}

/**
 * Smart Threshold Manager - Versão Simplificada
 */
export class SmartThresholdManager {
  private static instance: SmartThresholdManager;
  private currentMetrics: ThresholdMetrics | null = null;
  private adaptationHistory: Array<{
    timestamp: number;
    oldThresholds: AdaptiveThresholds;
    newThresholds: AdaptiveThresholds;
    context: ThresholdContext;
    reason: string;
  }> = [];

  static getInstance(): SmartThresholdManager {
    if (!SmartThresholdManager.instance) {
      SmartThresholdManager.instance = new SmartThresholdManager();
    }
    return SmartThresholdManager.instance;
  }

  /**
   * Obtém thresholds adaptativos baseado no contexto atual
   */
  async getAdaptiveThresholds(): Promise<AdaptiveThresholds> {
    const context = await ContextDetector.getFullContext();

    const thresholds: AdaptiveThresholds = {
      intersectionRatio: ThresholdRules.getNetworkThreshold(context.networkType),
      preloadDistance: ThresholdRules.getPreloadDistance(context.deviceType, context.connectionSpeed),
      skeletonDuration: ThresholdRules.getSkeletonDuration(context.deviceMemory, context.cpuCores),
      fullContentDelay: this.calculateFullContentDelay(context),
      batchSize: ThresholdRules.getBatchSize(context.userEngagement, context.networkType),
      retryAttempts: this.calculateRetryAttempts(context),
      timeout: ThresholdRules.getTimeout(context.networkType, context.userEngagement),
    };

    // Registra adaptação se for diferente da anterior
    await this.recordAdaptation(thresholds, context);

    // Atualiza métricas
    this.updateMetrics(thresholds, context);

    logger.debug("Adaptive thresholds calculated", {
      event: "ll_adaptive_thresholds_calculated",
      ll_thresholds: thresholds,
      ll_context: context,
    });

    return thresholds;
  }

  /**
   * Calcula delay para carregamento completo baseado no contexto
   */
  private calculateFullContentDelay(context: ThresholdContext): number {
    const baseDelay = 1000; // 1 segundo base

    // Ajusta baseado na rede
    const networkMultipliers = {
      "slow-2g": 3.0,
      "2g": 2.0,
      "3g": 1.5,
      "4g": 1.0,
      "fast": 0.7,
    };

    const networkMultiplier = networkMultipliers[context.networkType] || 1;

    // Ajusta baseado no engajamento do usuário
    const engagementMultipliers = {
      low: 1.2, // Usuários pouco engajados precisam ver conteúdo mais rápido
      medium: 1.0,
      high: 0.8, // Usuários engajados toleram um pouco mais de espera
    };

    const engagementMultiplier = engagementMultipliers[context.userEngagement] || 1;

    // Ajusta baseado no horário
    const timeMultiplier = context.timeOfDay === "peak" ? 0.9 : 1.1;

    return Math.round(baseDelay * networkMultiplier * engagementMultiplier * timeMultiplier);
  }

  /**
   * Calcula número de tentativas de retry baseado no contexto
   */
  private calculateRetryAttempts(context: ThresholdContext): number {
    let baseAttempts = 2;

    // Mais tentativas para redes ruins
    if (context.networkType === "slow-2g" || context.networkType === "2g") {
      baseAttempts += 1;
    }

    // Menos tentativas para usuários pouco engajados
    if (context.userEngagement === "low") {
      baseAttempts = Math.max(1, baseAttempts - 1);
    }

    // Mais tentativas durante horário comercial
    if (context.timeOfDay === "peak") {
      baseAttempts += 1;
    }

    return baseAttempts;
  }

  /**
   * Registra uma adaptação se os thresholds mudaram
   */
  private async recordAdaptation(
    newThresholds: AdaptiveThresholds,
    context: ThresholdContext
  ): Promise<void> {
    const lastAdaptation = this.adaptationHistory[this.adaptationHistory.length - 1];

    if (!lastAdaptation) {
      // Primeira adaptação
      this.adaptationHistory.push({
        timestamp: Date.now(),
        oldThresholds: newThresholds, // Mesmo valor para primeira vez
        newThresholds,
        context,
        reason: "initial_adaptation",
      });
      return;
    }

    // Verifica se houve mudança significativa
    const thresholdChanged = this.hasThresholdChanged(lastAdaptation.newThresholds, newThresholds);

    if (thresholdChanged) {
      this.adaptationHistory.push({
        timestamp: Date.now(),
        oldThresholds: lastAdaptation.newThresholds,
        newThresholds,
        context,
        reason: "context_changed",
      });

      // Mantém apenas as últimas 10 adaptações
      if (this.adaptationHistory.length > 10) {
        this.adaptationHistory = this.adaptationHistory.slice(-10);
      }
    }
  }

  /**
   * Verifica se houve mudança significativa nos thresholds
   */
  private hasThresholdChanged(old: AdaptiveThresholds, current: AdaptiveThresholds): boolean {
    const tolerance = 0.1; // 10% de tolerância

    return Math.abs(old.intersectionRatio - current.intersectionRatio) > tolerance ||
           Math.abs(old.preloadDistance - current.preloadDistance) / old.preloadDistance > tolerance ||
           Math.abs(old.skeletonDuration - current.skeletonDuration) / old.skeletonDuration > tolerance ||
           Math.abs(old.fullContentDelay - current.fullContentDelay) / old.fullContentDelay > tolerance ||
           old.batchSize !== current.batchSize ||
           old.retryAttempts !== current.retryAttempts ||
           Math.abs(old.timeout - current.timeout) / old.timeout > tolerance;
  }

  /**
   * Atualiza métricas do sistema
   */
  private updateMetrics(thresholds: AdaptiveThresholds, context: ThresholdContext): void {
    this.currentMetrics = {
      currentThresholds: { ...thresholds },
      context: { ...context },
      performance: {
        avgLoadTime: storageManager.getItem("avgLoadTime") || 1500,
        failureRate: storageManager.getItem("failureRate") || 0.05,
        userSatisfaction: storageManager.getItem("userSatisfaction") || 0.8,
      },
      lastUpdated: Date.now(),
      adaptations: this.adaptationHistory.length,
    };
  }

  /**
   * Obtém métricas atuais do sistema
   */
  getMetrics(): ThresholdMetrics | null {
    return this.currentMetrics;
  }

  /**
   * Obtém histórico de adaptações
   */
  getAdaptationHistory(limit = 5): Array<{
    timestamp: number;
    changes: Partial<AdaptiveThresholds>;
    context: Partial<ThresholdContext>;
    reason: string;
  }> {
    return this.adaptationHistory.slice(-limit).map(adaptation => ({
      timestamp: adaptation.timestamp,
      changes: this.calculateChanges(adaptation.oldThresholds, adaptation.newThresholds),
      context: adaptation.context,
      reason: adaptation.reason,
    }));
  }

  /**
   * Calcula diferenças entre thresholds antigo e novo
   */
  private calculateChanges(old: AdaptiveThresholds, current: AdaptiveThresholds): Partial<AdaptiveThresholds> {
    const changes: Partial<AdaptiveThresholds> = {};

    Object.keys(old).forEach(key => {
      const k = key as keyof AdaptiveThresholds;
      if (old[k] !== current[k]) {
        changes[k] = current[k];
      }
    });

    return changes;
  }

  /**
   * Força reavaliação dos thresholds
   */
  async forceReevaluation(): Promise<AdaptiveThresholds> {
    logger.info("Forced threshold reevaluation", {
      event: "ll_threshold_force_reevaluation",
    });

    return this.getAdaptiveThresholds();
  }

  /**
   * Obtém estatísticas do sistema
   */
  getStats() {
    return {
      currentMetrics: this.currentMetrics,
      adaptationHistory: this.getAdaptationHistory(),
      contextSummary: this.currentMetrics?.context,
      performanceSummary: this.currentMetrics?.performance,
      totalAdaptations: this.adaptationHistory.length,
    };
  }
}

// Export singleton
export const smartThresholdManager = SmartThresholdManager.getInstance();
