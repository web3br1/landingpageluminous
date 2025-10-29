// ===== PREEMPTION SYSTEM =====
// Sistema de preempção baseado em prioridade de camadas
// Permite que animações de alta prioridade interrompam animações de baixa prioridade

import type { AnimationID } from "@/lib/types/design-system";
import {
  LayerManager,
  AnimationLayer,
  AnimationState,
  InterruptionType,
} from "./layers-model";
import { AnimationController } from "@/lib/theme/animation-controller";

// ===== PREEMPTION CONFIG =====

/** Preemption configuration */
export interface PreemptionConfig {
  /** Enable automatic preemption */
  enabled: boolean;

  /** Preemption grace periods by interruption type */
  gracePeriods: {
    [InterruptionType.SOFT]: number; // ms
    [InterruptionType.HARD]: number; // ms
    [InterruptionType.PREEMPTION]: number; // ms
  };

  /** Starvation protection settings */
  starvationProtection: {
    enabled: boolean;
    maxPreemptions: number;
    protectionDuration: number; // ms
    resetInterval: number; // ms
  };

  /** Priority override rules */
  priorityOverrides: {
    /** Layers that can never be preempted */
    protectedLayers: AnimationLayer[];

    /** Emergency animations that always preempt */
    emergencyAnimations: string[];

    /** Context-based priority boosts */
    contextBoosts: Record<string, number>;
  };
}

/** Default preemption configuration */
const DEFAULT_PREEMPTION_CONFIG: PreemptionConfig = {
  enabled: true,
  gracePeriods: {
    [InterruptionType.SOFT]: 300, // Complete current easing
    [InterruptionType.HARD]: 0, // Immediate
    [InterruptionType.PREEMPTION]: 150, // Quick transition
  },
  starvationProtection: {
    enabled: true,
    maxPreemptions: 2,
    protectionDuration: 3000, // 3 seconds
    resetInterval: 2000, // 2 seconds
  },
  priorityOverrides: {
    protectedLayers: [],
    emergencyAnimations: ["emergency-stop", "accessibility-focus"],
    contextBoosts: {
      "user-interaction": 2,
      "error-state": 1,
      "loading-critical": 1,
    },
  },
};

// ===== PREEMPTION DECISIONS =====

/** Preemption decision result */
export interface PreemptionDecision {
  shouldPreempt: boolean;
  targetAnimations: AnimationID[];
  reason: string;
  estimatedCost: number; // ms
  alternatives?: PreemptionAlternative[];
}

/** Preemption alternative */
export interface PreemptionAlternative {
  type: "delay" | "queue" | "merge" | "cancel";
  description: string;
  cost: number;
  feasibility: number; // 0-1
}

// ===== PREEMPTION ENGINE =====

/** Main preemption engine */
export class PreemptionEngine {
  private static instance: PreemptionEngine;
  private config: PreemptionConfig;
  private layerManager: LayerManager;
  private animationController: ReturnType<
    typeof AnimationController.getInstance
  >;
  private preemptionHistory: Map<AnimationID, number[]> = new Map();
  private protectionTimers: Map<AnimationLayer, NodeJS.Timeout> = new Map();

  private constructor() {
    this.config = DEFAULT_PREEMPTION_CONFIG;
    this.layerManager = LayerManager.getInstance();
    this.animationController = AnimationController.getInstance();
  }

  static getInstance(): PreemptionEngine {
    if (!PreemptionEngine.instance) {
      PreemptionEngine.instance = new PreemptionEngine();
    }
    return PreemptionEngine.instance;
  }

  // ===== CONFIGURATION =====

  /** Configure preemption engine */
  configure(config: Partial<PreemptionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /** Get current configuration */
  getConfig(): PreemptionConfig {
    return { ...this.config };
  }

  // ===== PREEMPTION DECISIONS =====

  /** Evaluate if preemption should occur */
  evaluatePreemption(
    requestingLayer: AnimationLayer,
    requestingId: AnimationID,
    context?: Record<string, unknown>,
  ): PreemptionDecision {
    if (!this.config.enabled) {
      return {
        shouldPreempt: false,
        targetAnimations: [],
        reason: "Preemption disabled",
        estimatedCost: 0,
      };
    }

    // Check if requesting layer is protected
    if (
      this.config.priorityOverrides.protectedLayers.includes(requestingLayer)
    ) {
      return {
        shouldPreempt: false,
        targetAnimations: [],
        reason: "Requesting layer is protected",
        estimatedCost: 0,
      };
    }

    // Check if this is an emergency animation
    const isEmergency = this.config.priorityOverrides.emergencyAnimations.some(
      (pattern) => requestingId.includes(pattern),
    );

    if (isEmergency) {
      return this.findEmergencyPreemptionTargets(requestingLayer, requestingId);
    }

    // Apply context boosts
    const contextBoost = this.calculateContextBoost(context);
    const effectivePriority =
      this.getLayerPriority(requestingLayer) + contextBoost;

    // Find viable preemption targets
    const targets = this.findPreemptionTargets(
      effectivePriority,
      requestingLayer,
    );

    if (targets.length === 0) {
      return {
        shouldPreempt: false,
        targetAnimations: [],
        reason: "No viable preemption targets found",
        estimatedCost: 0,
        alternatives: this.generateAlternatives(requestingLayer, requestingId),
      };
    }

    // Check starvation protection
    const starvationProtected = targets.filter((id) =>
      this.isStarvationProtected(id),
    );

    const viableTargets = targets.filter(
      (id) => !starvationProtected.includes(id),
    );

    if (viableTargets.length === 0) {
      return {
        shouldPreempt: false,
        targetAnimations: [],
        reason: "All targets are starvation protected",
        estimatedCost: 0,
        alternatives: this.generateAlternatives(requestingLayer, requestingId),
      };
    }

    return {
      shouldPreempt: true,
      targetAnimations: viableTargets,
      reason: `Higher priority animation (${effectivePriority}) requesting access`,
      estimatedCost: this.calculatePreemptionCost(viableTargets),
    };
  }

  /** Execute preemption */
  async executePreemption(decision: PreemptionDecision): Promise<void> {
    if (!decision.shouldPreempt || decision.targetAnimations.length === 0) {
      return;
    }

    // Record preemption history
    decision.targetAnimations.forEach((targetId) => {
      this.recordPreemption(targetId);
    });

    // Execute preemption with grace period
    const gracePeriod = this.config.gracePeriods[InterruptionType.PREEMPTION];

    if (gracePeriod > 0) {
      // Soft preemption - allow grace period
      await new Promise((resolve) => setTimeout(resolve, gracePeriod));
    }

    // Interrupt target animations
    decision.targetAnimations.forEach((targetId) => {
      this.layerManager.interruptAnimation(
        targetId,
        InterruptionType.PREEMPTION,
      );
    });

    // Log preemption event
    console.log(
      `[Preemption] Executed: ${decision.targetAnimations.length} animations preempted`,
      {
        reason: decision.reason,
        cost: decision.estimatedCost,
        targets: decision.targetAnimations,
      },
    );
  }

  // ===== TARGET IDENTIFICATION =====

  /** Find emergency preemption targets */
  private findEmergencyPreemptionTargets(
    requestingLayer: AnimationLayer,
    requestingId: AnimationID,
  ): PreemptionDecision {
    // Emergency animations can preempt anything except other emergencies
    const allActiveAnimations = this.layerManager.getAllActiveAnimations();
    const emergencyTargets = allActiveAnimations.filter(
      (id) =>
        !this.config.priorityOverrides.emergencyAnimations.some((pattern) =>
          id.includes(pattern),
        ),
    );

    return {
      shouldPreempt: emergencyTargets.length > 0,
      targetAnimations: emergencyTargets,
      reason: "Emergency animation preemption",
      estimatedCost: this.calculatePreemptionCost(emergencyTargets),
    };
  }

  /** Find viable preemption targets */
  private findPreemptionTargets(
    effectivePriority: number,
    requestingLayer: AnimationLayer,
  ): AnimationID[] {
    const targets: AnimationID[] = [];

    // Check all layers with lower priority
    Object.values(AnimationLayer).forEach((layer) => {
      if (this.getLayerPriority(layer) < effectivePriority) {
        const layerAnimations =
          this.layerManager.getActiveAnimationsByLayer(layer);

        // Filter interruptible animations
        const interruptible = layerAnimations.filter((id) => {
          const metadata = this.layerManager.getAnimationMetadata(id);
          return metadata?.canBeInterrupted !== false;
        });

        targets.push(...interruptible);
      }
    });

    return targets;
  }

  // ===== STARVATION PROTECTION =====

  /** Check if animation is starvation protected */
  private isStarvationProtected(animationId: AnimationID): boolean {
    if (!this.config.starvationProtection.enabled) return false;

    const layer = this.getAnimationLayer(animationId);
    if (!layer) return false;

    return this.layerManager.getLayerState(layer).locked;
  }

  /** Record preemption event for starvation tracking */
  private recordPreemption(animationId: AnimationID): void {
    const layer = this.getAnimationLayer(animationId);
    if (!layer) return;

    const layerState = this.layerManager.getLayerState(layer);

    // Check if protection should be activated
    if (
      layerState.starvationCount >=
      this.config.starvationProtection.maxPreemptions
    ) {
      this.activateStarvationProtection(layer);
    }
  }

  /** Activate starvation protection for a layer */
  private activateStarvationProtection(layer: AnimationLayer): void {
    // Clear existing timer
    const existingTimer = this.protectionTimers.get(layer);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Lock the layer
    this.layerManager.lockLayer(layer);

    // Set protection timer
    const timer = setTimeout(() => {
      this.layerManager.unlockLayer(layer);
      this.protectionTimers.delete(layer);
    }, this.config.starvationProtection.protectionDuration);

    this.protectionTimers.set(layer, timer);
  }

  // ===== COST CALCULATION =====

  /** Calculate estimated preemption cost */
  private calculatePreemptionCost(targetAnimations: AnimationID[]): number {
    let totalCost = 0;

    targetAnimations.forEach((id) => {
      const metadata = this.layerManager.getAnimationMetadata(id);
      if (metadata) {
        // Base cost on animation duration and complexity
        const baseCost = metadata.duration * 0.1; // 10% of duration as cleanup cost
        const complexityMultiplier = this.getLayerComplexity(metadata.layer);
        totalCost += baseCost * complexityMultiplier;
      }
    });

    return Math.round(totalCost);
  }

  /** Get layer complexity multiplier */
  private getLayerComplexity(layer: AnimationLayer): number {
    const complexities = {
      [AnimationLayer.BG]: 1.0, // Simple background changes
      [AnimationLayer.MID]: 1.5, // Content animations
      [AnimationLayer.FG]: 2.0, // UI interactions
      [AnimationLayer.FX]: 2.5, // Complex effects
    };

    return complexities[layer] || 1.0;
  }

  // ===== ALTERNATIVES GENERATION =====

  /** Generate alternative solutions when preemption isn't viable */
  private generateAlternatives(
    requestingLayer: AnimationLayer,
    requestingId: AnimationID,
  ): PreemptionAlternative[] {
    const alternatives: PreemptionAlternative[] = [];

    // Queue alternative
    if (this.canQueueAnimation(requestingLayer)) {
      alternatives.push({
        type: "queue",
        description: "Queue animation until resources are available",
        cost: this.estimateQueueDelay(requestingLayer),
        feasibility: 0.8,
      });
    }

    // Delay alternative
    alternatives.push({
      type: "delay",
      description: "Delay animation start by short period",
      cost: 200, // 200ms delay
      feasibility: 0.6,
    });

    // Merge alternative (if applicable)
    if (this.canMergeAnimation(requestingId)) {
      alternatives.push({
        type: "merge",
        description: "Merge with existing compatible animation",
        cost: 50, // Low cost merge
        feasibility: 0.4,
      });
    }

    // Cancel alternative (last resort)
    alternatives.push({
      type: "cancel",
      description: "Cancel animation request",
      cost: 0,
      feasibility: 1.0,
    });

    return alternatives;
  }

  // ===== UTILITY METHODS =====

  /** Get layer priority */
  private getLayerPriority(layer: AnimationLayer): number {
    const priorities = {
      [AnimationLayer.BG]: 1,
      [AnimationLayer.MID]: 2,
      [AnimationLayer.FG]: 3,
      [AnimationLayer.FX]: 4,
    };
    return priorities[layer] || 0;
  }

  /** Calculate context boost */
  private calculateContextBoost(context?: Record<string, unknown>): number {
    if (!context) return 0;

    let boost = 0;
    Object.entries(this.config.priorityOverrides.contextBoosts).forEach(
      ([key, value]) => {
        if (context[key]) {
          boost += value;
        }
      },
    );

    return boost;
  }

  /** Get animation layer */
  private getAnimationLayer(animationId: AnimationID): AnimationLayer | null {
    const metadata = this.layerManager.getAnimationMetadata(animationId);
    return metadata?.layer || null;
  }

  /** Check if animation can be queued */
  private canQueueAnimation(layer: AnimationLayer): boolean {
    const layerState = this.layerManager.getLayerState(layer);
    return layerState.queuedAnimations.length < 5; // Max queue size
  }

  /** Estimate queue delay */
  private estimateQueueDelay(layer: AnimationLayer): number {
    const activeCount =
      this.layerManager.getActiveAnimationsByLayer(layer).length;
    const avgDuration = 300; // Assume 300ms average animation duration
    return activeCount * avgDuration;
  }

  /** Check if animation can be merged */
  private canMergeAnimation(animationId: AnimationID): boolean {
    // This would check if the animation is compatible with existing ones
    // For now, return false - can be implemented based on specific needs
    return false;
  }

  // ===== MONITORING =====

  /** Get preemption statistics */
  getStatistics() {
    const layerStats = Object.values(AnimationLayer).map((layer) => {
      const state = this.layerManager.getLayerState(layer);
      return {
        layer,
        activeAnimations: state.activeAnimations.size,
        queuedAnimations: state.queuedAnimations.length,
        starvationCount: state.starvationCount,
        isLocked: state.locked,
        lastPreemption: state.lastPreemptionTime,
      };
    });

    return {
      config: this.config,
      layers: layerStats,
      totalActiveAnimations: this.layerManager.getTotalActiveAnimations(),
      protectionActive: Array.from(this.protectionTimers.keys()),
    };
  }

  // ===== CLEANUP =====

  /** Reset preemption engine */
  reset(): void {
    this.preemptionHistory.clear();

    // Clear protection timers
    this.protectionTimers.forEach((timer) => clearTimeout(timer));
    this.protectionTimers.clear();

    // Reset layer manager
    this.layerManager.reset();
  }
}

// ===== HOOKS =====

/** Hook for preemption system */
export function usePreemptionSystem() {
  const engine = PreemptionEngine.getInstance();

  return {
    // Configuration
    configure: (config: Partial<PreemptionConfig>) => engine.configure(config),
    getConfig: () => engine.getConfig(),

    // Preemption control
    evaluatePreemption: (
      layer: AnimationLayer,
      id: AnimationID,
      context?: Record<string, unknown>,
    ) => engine.evaluatePreemption(layer, id, context),

    executePreemption: (decision: PreemptionDecision) =>
      engine.executePreemption(decision),

    // Monitoring
    getStatistics: () => engine.getStatistics(),

    // Utilities
    reset: () => engine.reset(),
  };
}

/** Hook for animation with preemption awareness */
export function usePreemptiveAnimation(
  animationId: AnimationID,
  layer: AnimationLayer,
  context?: Record<string, unknown>,
) {
  const { evaluatePreemption, executePreemption } = usePreemptionSystem();

  const requestStart = async (): Promise<boolean> => {
    const decision = evaluatePreemption(layer, animationId, context);

    if (decision.shouldPreempt) {
      await executePreemption(decision);
      return true;
    }

    if (decision.alternatives) {
      // Try alternatives
      const queueAlternative = decision.alternatives.find(
        (alt) => alt.type === "queue",
      );
      if (queueAlternative && queueAlternative.feasibility > 0.5) {
        // Implement queueing logic here
        await new Promise((resolve) =>
          setTimeout(resolve, queueAlternative.cost),
        );
        return true;
      }
    }

    return false;
  };

  return {
    requestStart,
    canStart: () => {
      const decision = evaluatePreemption(layer, animationId, context);
      return decision.shouldPreempt;
    },
  };
}

// ===== UTILITY EXPORTS =====
export { DEFAULT_PREEMPTION_CONFIG };
