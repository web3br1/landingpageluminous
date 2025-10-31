"use client";

import { logger } from "../../observability/logger";
import { storageManager, AtomicStorage, PrivacyBehaviorStorage } from "./storage-manager";

/**
 * Cross-Session Learning Persistence - Phase 3 Correction
 * Solves H3.16: Cross-session learning persistence
 */

export interface LearningSession {
  sessionId: string;
  startTime: number;
  endTime?: number;
  deviceFingerprint: string;
  userFingerprint?: string; // Optional, privacy-preserving
  metrics: SessionMetrics;
  learnings: LearningArtifact[];
  quality: SessionQuality;
}

export interface SessionMetrics {
  totalLoadTime: number;
  sectionsLoaded: number;
  sectionsFailed: number;
  userInteractions: number;
  scrollDepth: number;
  timeSpent: number;
  coreWebVitals: {
    lcp?: number;
    cls?: number;
    inp?: number;
  };
  adaptiveActions: number; // How many adaptive decisions were made
  ruleActivations: number; // How many rules were triggered
}

export interface LearningArtifact {
  type: "rule_performance" | "threshold_adjustment" | "pattern_recognition" | "user_preference";
  key: string;
  value: any;
  confidence: number;
  timestamp: number;
  context?: Record<string, any>;
}

export interface SessionQuality {
  score: number; // 0-1, overall session quality
  engagement: "low" | "medium" | "high";
  performance: "poor" | "acceptable" | "good" | "excellent";
  adaptability: "static" | "reactive" | "proactive";
  learningsCaptured: number;
}

/**
 * Cross-session learning patterns
 */
export interface LearningPattern {
  patternId: string;
  description: string;
  conditions: PatternCondition[];
  learnings: LearningTransfer[];
  confidence: number;
  applicability: number; // How often this pattern applies (0-1)
  lastUsed: number;
  successRate: number;
}

export interface PatternCondition {
  type: "device" | "network" | "behavior" | "performance";
  property: string;
  operator: "eq" | "gt" | "lt" | "in";
  value: any;
}

export interface LearningTransfer {
  fromContext: string;
  toContext: string;
  transferFactor: number; // How much learning transfers (0-1)
  validationCount: number;
}

/**
 * Session Analyzer - Extracts learnings from completed sessions
 */
class SessionAnalyzer {
  /**
   * Analyze session and extract learning artifacts
   */
  analyzeSession(session: LearningSession): LearningArtifact[] {
    const artifacts: LearningArtifact[] = [];

    // Rule performance artifacts
    if (session.metrics.ruleActivations > 0) {
      artifacts.push({
        type: "rule_performance",
        key: "rule_activation_patterns",
        value: {
          activations: session.metrics.ruleActivations,
          successRate: session.quality.score,
          adaptability: session.quality.adaptability,
        },
        confidence: session.quality.score,
        timestamp: session.endTime || Date.now(),
        context: {
          deviceFingerprint: session.deviceFingerprint,
          engagement: session.quality.engagement,
        },
      });
    }

    // Threshold performance artifacts
    if (session.metrics.adaptiveActions > 0) {
      artifacts.push({
        type: "threshold_adjustment",
        key: "threshold_effectiveness",
        value: {
          actions: session.metrics.adaptiveActions,
          loadTime: session.metrics.totalLoadTime / session.metrics.sectionsLoaded,
          userSatisfaction: session.quality.score,
        },
        confidence: Math.min(1, session.metrics.adaptiveActions / 10), // Confidence based on sample size
        timestamp: session.endTime || Date.now(),
        context: {
          sectionsLoaded: session.metrics.sectionsLoaded,
          coreWebVitals: session.metrics.coreWebVitals,
        },
      });
    }

    // User behavior patterns
    if (session.metrics.userInteractions > 0) {
      artifacts.push({
        type: "pattern_recognition",
        key: "user_behavior_patterns",
        value: {
          interactions: session.metrics.userInteractions,
          scrollDepth: session.metrics.scrollDepth,
          timeSpent: session.metrics.timeSpent,
          engagement: session.quality.engagement,
        },
        confidence: session.quality.score,
        timestamp: session.endTime || Date.now(),
        context: {
          deviceFingerprint: session.deviceFingerprint,
        },
      });
    }

    // User preferences (inferred)
    if (session.quality.engagement === "high" && session.metrics.timeSpent > 120) {
      artifacts.push({
        type: "user_preference",
        key: "engagement_preferences",
        value: {
          prefersAggressiveLoading: session.quality.adaptability === "proactive",
          toleratesHigherLoadTimes: session.metrics.totalLoadTime < 3000,
          responsiveToAdaptiveChanges: session.metrics.adaptiveActions > 0,
        },
        confidence: session.quality.score,
        timestamp: session.endTime || Date.now(),
        context: {
          sessionDuration: session.metrics.timeSpent,
        },
      });
    }

    logger.debug("Analyzed session for learning artifacts", {
      event: "ll_session_analyzed",
      ll_session_id: session.sessionId,
      ll_artifacts_extracted: artifacts.length,
      ll_session_quality: session.quality.score,
    });

    return artifacts;
  }

  /**
   * Calculate session quality score
   */
  calculateSessionQuality(session: LearningSession): SessionQuality {
    const metrics = session.metrics;
    const hasCoreWebVitals = !!(metrics.coreWebVitals.lcp && metrics.coreWebVitals.cls);

    // Performance score (0-1)
    let performanceScore = 0;
    if (hasCoreWebVitals) {
      const lcpScore = Math.max(0, 1 - (metrics.coreWebVitals.lcp! - 2500) / 2500); // Better if < 2.5s
      const clsScore = Math.max(0, 1 - metrics.coreWebVitals.cls! / 0.1); // Better if < 0.1
      const inpScore = metrics.coreWebVitals.inp ?
        Math.max(0, 1 - (metrics.coreWebVitals.inp - 200) / 800) : 0.5; // Better if < 200ms
      performanceScore = (lcpScore + clsScore + inpScore) / 3;
    }

    // Engagement score (0-1)
    const engagementScore = Math.min(1,
      (metrics.timeSpent / 300) * 0.4 + // 5 minutes = good engagement
      (metrics.scrollDepth / 100) * 0.3 + // 100% scroll = good engagement
      (metrics.userInteractions / 20) * 0.3 // 20 interactions = good engagement
    );

    // Reliability score (0-1)
    const reliabilityScore = metrics.sectionsFailed === 0 ? 1 :
      Math.max(0, 1 - (metrics.sectionsFailed / metrics.sectionsLoaded));

    // Overall quality score
    const overallScore = (performanceScore * 0.4 + engagementScore * 0.4 + reliabilityScore * 0.2);

    // Determine engagement level
    let engagement: "low" | "medium" | "high";
    if (engagementScore < 0.3) engagement = "low";
    else if (engagementScore < 0.7) engagement = "medium";
    else engagement = "high";

    // Determine performance level
    let performance: "poor" | "acceptable" | "good" | "excellent";
    if (performanceScore < 0.3) performance = "poor";
    else if (performanceScore < 0.6) performance = "acceptable";
    else if (performanceScore < 0.8) performance = "good";
    else performance = "excellent";

    // Determine adaptability
    let adaptability: "static" | "reactive" | "proactive";
    if (metrics.adaptiveActions === 0) adaptability = "static";
    else if (metrics.adaptiveActions < 5) adaptability = "reactive";
    else adaptability = "proactive";

    return {
      score: overallScore,
      engagement,
      performance,
      adaptability,
      learningsCaptured: 0, // Will be set after analysis
    };
  }
}

/**
 * Learning Pattern Manager - Manages cross-session pattern recognition
 */
class LearningPatternManager {
  private patterns: Map<string, LearningPattern> = new Map();

  /**
   * Identify patterns across sessions
   */
  identifyPatterns(sessions: LearningSession[]): LearningPattern[] {
    const patterns: LearningPattern[] = [];

    // Pattern 1: Device-specific performance patterns
    const devicePatterns = this.findDevicePatterns(sessions);
    patterns.push(...devicePatterns);

    // Pattern 2: Network condition adaptations
    const networkPatterns = this.findNetworkPatterns(sessions);
    patterns.push(...networkPatterns);

    // Pattern 3: User engagement response patterns
    const engagementPatterns = this.findEngagementPatterns(sessions);
    patterns.push(...engagementPatterns);

    // Pattern 4: Time-of-day usage patterns
    const temporalPatterns = this.findTemporalPatterns(sessions);
    patterns.push(...temporalPatterns);

    return patterns;
  }

  private findDevicePatterns(sessions: LearningSession[]): LearningPattern[] {
    const patterns: LearningPattern[] = [];
    const deviceGroups = new Map<string, LearningSession[]>();

    // Group sessions by device fingerprint
    for (const session of sessions) {
      const key = session.deviceFingerprint;
      if (!deviceGroups.has(key)) deviceGroups.set(key, []);
      deviceGroups.get(key)!.push(session);
    }

    for (const [deviceFingerprint, deviceSessions] of deviceGroups) {
      if (deviceSessions.length >= 3) { // Need at least 3 sessions for pattern
        const avgPerformance = this.calculateAveragePerformance(deviceSessions);
        const consistency = this.calculateConsistency(deviceSessions);

        if (consistency > 0.7) { // High consistency = valid pattern
          patterns.push({
            patternId: `device_${deviceFingerprint}`,
            description: `Performance pattern for device ${deviceFingerprint}`,
            conditions: [
              { type: "device", property: "fingerprint", operator: "eq", value: deviceFingerprint }
            ],
            learnings: [
              {
                fromContext: `device_${deviceFingerprint}`,
                toContext: `device_${deviceFingerprint}`,
                transferFactor: consistency,
                validationCount: deviceSessions.length,
              }
            ],
            confidence: consistency,
            applicability: deviceSessions.length / sessions.length,
            lastUsed: Date.now(),
            successRate: avgPerformance,
          });
        }
      }
    }

    return patterns;
  }

  private findNetworkPatterns(sessions: LearningSession[]): LearningPattern[] {
    // Implementation would analyze network conditions and their impact on performance
    return [];
  }

  private findEngagementPatterns(sessions: LearningSession[]): LearningPattern[] {
    // Implementation would analyze how different engagement levels respond to loading strategies
    return [];
  }

  private findTemporalPatterns(sessions: LearningSession[]): LearningPattern[] {
    // Implementation would analyze time-of-day patterns
    return [];
  }

  private calculateAveragePerformance(sessions: LearningSession[]): number {
    return sessions.reduce((sum, s) => sum + s.quality.score, 0) / sessions.length;
  }

  private calculateConsistency(sessions: LearningSession[]): number {
    if (sessions.length < 2) return 1;

    const scores = sessions.map(s => s.quality.score);
    const mean = scores.reduce((a, b) => a + b) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);

    // Convert to consistency score (lower std dev = higher consistency)
    return Math.max(0, 1 - (stdDev / 0.5)); // Assume 0.5 is high variance
  }
}

/**
 * Cross-Session Learner - Main class
 */
export class CrossSessionLearner {
  private analyzer: SessionAnalyzer;
  private patternManager: LearningPatternManager;
  private static instance: CrossSessionLearner;
  private currentSession: LearningSession | null = null;
  private initialized = false;

  constructor() {
    this.analyzer = new SessionAnalyzer();
    this.patternManager = new LearningPatternManager();
  }

  static getInstance(): CrossSessionLearner {
    if (!CrossSessionLearner.instance) {
      CrossSessionLearner.instance = new CrossSessionLearner();
    }
    return CrossSessionLearner.instance;
  }

  /**
   * Initialize the learner
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    await this.loadPersistedLearnings();

    this.initialized = true;

    logger.info("Cross-session learner initialized", {
      event: "ll_cross_session_initialized",
    });
  }

  /**
   * Start a new learning session
   */
  async startSession(deviceFingerprint: string, userFingerprint?: string): Promise<string> {
    await this.initialize();

    // End current session if exists
    if (this.currentSession) {
      await this.endSession();
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.currentSession = {
      sessionId,
      startTime: Date.now(),
      deviceFingerprint,
      userFingerprint,
      metrics: {
        totalLoadTime: 0,
        sectionsLoaded: 0,
        sectionsFailed: 0,
        userInteractions: 0,
        scrollDepth: 0,
        timeSpent: 0,
        coreWebVitals: {},
        adaptiveActions: 0,
        ruleActivations: 0,
      },
      learnings: [],
      quality: {
        score: 0.5,
        engagement: "medium",
        performance: "acceptable",
        adaptability: "static",
        learningsCaptured: 0,
      },
    };

    logger.info("Started learning session", {
      event: "ll_session_started",
      ll_session_id: sessionId,
      ll_device_fingerprint: deviceFingerprint,
    });

    return sessionId;
  }

  /**
   * Update session metrics
   */
  async updateMetrics(updates: Partial<SessionMetrics>): Promise<void> {
    if (!this.currentSession) return;

    Object.assign(this.currentSession.metrics, updates);

    logger.debug("Updated session metrics", {
      event: "ll_session_metrics_updated",
      ll_session_id: this.currentSession.sessionId,
      ll_updates: Object.keys(updates),
    });
  }

  /**
   * Record a learning event during session
   */
  async recordLearning(artifact: LearningArtifact): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession.learnings.push(artifact);
    this.currentSession.metrics.adaptiveActions++;

    logger.debug("Recorded learning artifact", {
      event: "ll_learning_artifact_recorded",
      ll_session_id: this.currentSession.sessionId,
      ll_artifact_type: artifact.type,
      ll_artifact_key: artifact.key,
    });
  }

  /**
   * End current session and extract learnings
   */
  async endSession(): Promise<void> {
    if (!this.currentSession) return;

    this.currentSession.endTime = Date.now();
    this.currentSession.metrics.timeSpent =
      (this.currentSession.endTime - this.currentSession.startTime) / 1000;

    // Analyze session and extract learnings
    const additionalLearnings = this.analyzer.analyzeSession(this.currentSession);
    this.currentSession.learnings.push(...additionalLearnings);

    // Calculate final quality
    this.currentSession.quality = this.analyzer.calculateSessionQuality(this.currentSession);
    this.currentSession.quality.learningsCaptured = this.currentSession.learnings.length;

    // Persist session data
    await this.persistSession(this.currentSession);

    // Update cross-session patterns
    await this.updatePatterns(this.currentSession);

    logger.info("Ended learning session", {
      event: "ll_session_ended",
      ll_session_id: this.currentSession.sessionId,
      ll_quality_score: this.currentSession.quality.score,
      ll_learnings_captured: this.currentSession.learnings.length,
      ll_session_duration: this.currentSession.metrics.timeSpent,
    });

    this.currentSession = null;
  }

  /**
   * Apply learnings from past sessions to current context
   */
  async applyLearnings(context: Record<string, any>): Promise<LearningTransfer[]> {
    await this.initialize();

    const transfers: LearningTransfer[] = [];
    const pastSessions = await this.loadPastSessions(10); // Last 10 sessions

    for (const session of pastSessions) {
      for (const learning of session.learnings) {
        if (this.isLearningApplicable(learning, context)) {
          transfers.push({
            sessionId: session.sessionId,
            learning,
            transferConfidence: learning.confidence,
            contextMatch: this.calculateContextMatch(learning, context),
          });
        }
      }
    }

    logger.debug("Applied cross-session learnings", {
      event: "ll_learnings_applied",
      ll_transfers_count: transfers.length,
      ll_context_keys: Object.keys(context),
    });

    return transfers;
  }

  /**
   * Load persisted learning data
   */
  private async loadPersistedLearnings(): Promise<void> {
    try {
      const learnings = storageManager.getItem("cross_session_learnings");
      if (learnings) {
        // Apply persisted learnings to current state
        logger.info("Loaded persisted cross-session learnings", {
          event: "ll_persisted_learnings_loaded",
        });
      }
    } catch (error) {
      logger.error("Failed to load persisted learnings", {
        event: "ll_persisted_learnings_load_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Persist session data
   */
  private async persistSession(session: LearningSession): Promise<void> {
    try {
      const sessions = storageManager.getItem("learning_sessions") || [];
      sessions.push(session);

      // Keep only last 50 sessions to prevent storage bloat
      if (sessions.length > 50) {
        sessions.splice(0, sessions.length - 50);
      }

      await AtomicStorage.atomicUpdate(
        "learning_sessions",
        () => sessions,
        []
      );
    } catch (error) {
      logger.error("Failed to persist session", {
        event: "ll_session_persist_error",
        ll_session_id: session.sessionId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Update cross-session patterns
   */
  private async updatePatterns(session: LearningSession): Promise<void> {
    try {
      const sessions = await this.loadPastSessions(20); // Last 20 sessions
      sessions.push(session);

      const newPatterns = this.patternManager.identifyPatterns(sessions);

      // Persist patterns
      await AtomicStorage.atomicUpdate(
        "learning_patterns",
        () => newPatterns,
        []
      );

      logger.debug("Updated learning patterns", {
        event: "ll_patterns_updated",
        ll_new_patterns: newPatterns.length,
      });
    } catch (error) {
      logger.error("Failed to update patterns", {
        event: "ll_patterns_update_error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Load past sessions from storage
   */
  private async loadPastSessions(count: number): Promise<LearningSession[]> {
    try {
      const sessions = storageManager.getItem("learning_sessions") || [];
      return sessions.slice(-count); // Last N sessions
    } catch (error) {
      logger.error("Failed to load past sessions", {
        event: "ll_past_sessions_load_error",
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  /**
   * Check if learning is applicable to current context
   */
  private isLearningApplicable(learning: LearningArtifact, context: Record<string, any>): boolean {
    // Simple applicability check - in production, this would be more sophisticated
    if (learning.type === "user_preference") {
      return context.userEngagement === "high" || context.timeSpent > 60;
    }

    if (learning.type === "threshold_adjustment") {
      return context.adaptiveEnabled === true;
    }

    return true; // Default to applicable
  }

  /**
   * Calculate how well learning context matches current context
   */
  private calculateContextMatch(learning: LearningArtifact, context: Record<string, any>): number {
    if (!learning.context) return 0.5;

    let matches = 0;
    let total = 0;

    for (const [key, value] of Object.entries(learning.context)) {
      total++;
      if (context[key] === value) {
        matches++;
      }
    }

    return total > 0 ? matches / total : 0.5;
  }

  /**
   * Get learner statistics
   */
  getStats() {
    return {
      initialized: this.initialized,
      currentSession: this.currentSession?.sessionId || null,
      totalSessions: storageManager.getItem("learning_sessions")?.length || 0,
      totalPatterns: storageManager.getItem("learning_patterns")?.length || 0,
    };
  }
}

export interface LearningTransfer {
  sessionId: string;
  learning: LearningArtifact;
  transferConfidence: number;
  contextMatch: number;
}

// Export singleton
export const crossSessionLearner = CrossSessionLearner.getInstance();
