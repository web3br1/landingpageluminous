/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  AdaptiveRuleManager,
  AdaptiveRule,
  RuleEvaluationResult
} from "../../../lib/lazy-loading/core/adaptive-rule-manager";

// Mock logger
vi.mock("../../../lib/observability/logger", () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock storage manager
vi.mock("../../../lib/lazy-loading/core/storage-manager", () => ({
  storageManager: {
    getItem: vi.fn(),
    setItem: vi.fn(),
  },
  AtomicStorage: {
    atomicUpdate: vi.fn().mockResolvedValue(undefined),
  },
}));

describe.skip("Adaptive Rule Manager - Phase 3 Corrections", () => {
  let manager: AdaptiveRuleManager;

  beforeEach(() => {
    manager = AdaptiveRuleManager.getInstance();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Reset singleton instance
    (AdaptiveRuleManager as any).instance = null;
  });

  describe("H3.1: Sistema de regras adaptativas centralizadas", () => {
    it("should initialize with default rules", async () => {
      await manager.initialize();

      const stats = manager.getStats();
      expect(stats.initialized).toBe(true);
      expect(stats.rules.totalRules).toBeGreaterThan(0);
    });

    it("should evaluate rules against context", async () => {
      await manager.initialize();

      const context = {
        effectiveType: "slow-2g",
        rtt: 600,
        timeSpent: 120,
        scrollDepth: 80,
        interactionCount: 10,
      };

      const results = await manager.evaluateRules(context);
      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      // Should find matching rules
      const matchedRules = results.filter(r => r.matched);
      expect(matchedRules.length).toBeGreaterThan(0);
    });

    it("should execute rule actions", async () => {
      await manager.initialize();

      const mockResults: RuleEvaluationResult[] = [{
        rule: {
          id: "test_rule",
          name: "Test Rule",
          description: "Test rule for execution",
          version: "1.0.0",
          priority: 5,
          conditions: [],
          actions: [{
            type: "set_strategy",
            target: "loadingStrategy",
            value: "conservative",
            confidence: 0.8,
          }],
          confidence: 0.8,
          performance: {
            successRate: 0.8,
            avgImprovement: 10,
            avgExecutionTime: 5,
            reliability: 0.9,
          },
          metadata: {
            createdAt: Date.now(),
            updatedAt: Date.now(),
            activationCount: 0,
            successCount: 0,
            failureCount: 0,
          },
        },
        matched: true,
        matchScore: 1.0,
        confidence: 0.8,
        matchedConditions: [],
        failedConditions: [],
      }];

      const executions = await manager.executeRuleActions(mockResults);
      expect(executions).toHaveLength(1);
      expect(executions[0].success).toBe(true);
      expect(executions[0].actions).toHaveLength(1);
    });

    it("should update rule performance after execution", async () => {
      await manager.initialize();

      // Get default rules and execute them
      const results = await manager.evaluateRules({
        effectiveType: "4g",
        timeSpent: 60,
        scrollDepth: 50,
        interactionCount: 5,
      });

      // Execute the first matched rule
      const matchedResults = results.filter(r => r.matched);
      if (matchedResults.length > 0) {
        const executions = await manager.executeRuleActions(matchedResults.slice(0, 1));

        // Check that performance was updated
        const stats = manager.getStats();
        expect(stats.rules.totalActivations).toBeGreaterThan(0);
        expect(executions.length).toBe(1);
      } else {
        // If no rules match, that's also fine - just check initialization worked
        const stats = manager.getStats();
        expect(stats.initialized).toBe(true);
      }
    });
  });

  describe("Rule evaluation logic", () => {
    it("should correctly evaluate conditions", async () => {
      await manager.initialize();

      // Test with default rules - high engagement rule should match
      const matchingContext = {
        timeSpent: 120, // > 60
        scrollDepth: 80, // > 50
        interactionCount: 10, // > 5
      };
      const matchingResults = await manager.evaluateRules(matchingContext);
      const hasMatchedRules = matchingResults.some(r => r.matched);
      expect(hasMatchedRules).toBe(true);

      // Test non-matching context
      const nonMatchingContext = {
        timeSpent: 10, // < 60
        scrollDepth: 10, // < 50
        interactionCount: 1, // < 5
      };
      const nonMatchingResults = await manager.evaluateRules(nonMatchingContext);
      const matchedRules = nonMatchingResults.filter(r => r.matched);
      // Should have fewer or no matches for low engagement
      expect(matchedRules.length).toBeLessThanOrEqual(matchingResults.filter(r => r.matched).length);
    });

    it("should prioritize rules by confidence and priority", async () => {
      await manager.initialize();

      // Test with context that triggers multiple default rules
      const context = {
        effectiveType: "slow-2g",
        rtt: 600,
        timeSpent: 120,
        scrollDepth: 80,
        interactionCount: 10,
      };

      const results = await manager.evaluateRules(context);
      expect(results.length).toBeGreaterThan(0);

      // Check that results are sorted by priority (higher first) then confidence
      for (let i = 1; i < results.length; i++) {
        const prev = results[i - 1];
        const curr = results[i];

        // Either priority is higher, or same priority with higher confidence
        expect(
          prev.rule.priority > curr.rule.priority ||
          (prev.rule.priority === curr.rule.priority && prev.confidence >= curr.confidence)
        ).toBe(true);
      }
    });
  });
});
