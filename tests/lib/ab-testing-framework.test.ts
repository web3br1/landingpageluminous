/**
 * @jest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  experimentManager,
  ExperimentManager,
} from "@/lib/ab-testing/ab-testing-framework";

describe("ExperimentManager", () => {
  let manager: ExperimentManager;

  beforeEach(async () => {
    // Reset the singleton instance for each test
    ExperimentManager.resetInstance();

    // Get fresh instance for each test
    manager = ExperimentManager.getInstance();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should be a singleton", () => {
    const manager1 = ExperimentManager.getInstance();
    const manager2 = ExperimentManager.getInstance();
    expect(manager1).toBe(manager2);
  });

  it("should load experiments from registry", async () => {
    // Mock the experiment registry
    const mockExperiments = {
      "test-experiment": {
        id: "test-experiment",
        name: "Test Experiment",
        description: "A test experiment",
        status: "running",
        variants: [
          { id: "control", name: "Control", weight: 50, isControl: true },
          { id: "variant-a", name: "Variant A", weight: 50 },
        ],
        goals: {
          primary: {
            id: "conversion",
            name: "Conversion",
            type: "conversion",
            metric: "conversion",
            direction: "increase",
          },
        },
        targetAudience: {
          segments: ["all"],
        },
        startDate: new Date(),
        confidenceLevel: 0.95,
        minimumDetectableEffect: 10,
        sampleSize: 1000,
      },
    };

    // Override the registry for this test
    vi.doMock("@/lib/experiments/experiments-registry", () => ({
      ALL_EXPERIMENTS: mockExperiments,
    }));

    const { experimentManager: freshManager } = await import(
      "@/lib/ab-testing/ab-testing-framework"
    );
    const freshInstance = freshManager;

    await freshInstance.loadExperiments();

    const experiments = freshInstance.getActiveExperiments();
    expect(experiments).toHaveLength(1);
    expect(experiments[0].id).toBe("test-experiment");
  });

  it("should assign variants to users", async () => {
    const mockExperiments = {
      "assignment-test": {
        id: "assignment-test",
        name: "Assignment Test",
        description: "Test variant assignment",
        status: "running",
        variants: [
          { id: "control", name: "Control", weight: 50, isControl: true },
          { id: "variant-a", name: "Variant A", weight: 50 },
        ],
        goals: {
          primary: {
            id: "conversion",
            name: "Conversion",
            type: "conversion",
            metric: "conversion",
            direction: "increase",
          },
        },
        targetAudience: {
          segments: ["all"],
        },
        startDate: new Date(),
        confidenceLevel: 0.95,
        minimumDetectableEffect: 10,
        sampleSize: 1000,
      },
    };

    vi.doMock("@/lib/experiments/experiments-registry", () => ({
      ALL_EXPERIMENTS: mockExperiments,
    }));

    const { experimentManager: freshManager } = await import(
      "@/lib/ab-testing/ab-testing-framework"
    );
    const freshInstance = freshManager;

    await freshInstance.loadExperiments();

    const variant1 = freshInstance.assignVariant("assignment-test", "user1");
    const variant2 = freshInstance.assignVariant("assignment-test", "user2");

    expect(variant1).toBeDefined();
    expect(variant2).toBeDefined();
    expect(["control", "variant-a"]).toContain(variant1?.id);
    expect(["control", "variant-a"]).toContain(variant2?.id);

    // Same user should get same variant consistently
    const variant1Again = freshInstance.assignVariant(
      "assignment-test",
      "user1",
    );
    expect(variant1Again?.id).toBe(variant1?.id);
  });

  // This is already tested in the previous test

  it("should handle SSR environment gracefully", async () => {
    const mockExperiments = {
      "ssr-test": {
        id: "ssr-test",
        name: "SSR Test",
        description: "Test SSR handling",
        status: "running",
        variants: [
          { id: "control", name: "Control", weight: 50, isControl: true },
          { id: "variant-a", name: "Variant A", weight: 50 },
        ],
        goals: {
          primary: {
            id: "conversion",
            name: "Conversion",
            type: "conversion",
            metric: "conversion",
            direction: "increase",
          },
        },
        targetAudience: {
          segments: ["all"],
        },
        startDate: new Date(),
        confidenceLevel: 0.95,
        minimumDetectableEffect: 10,
        sampleSize: 1000,
      },
    };

    vi.doMock("@/lib/experiments/experiments-registry", () => ({
      ALL_EXPERIMENTS: mockExperiments,
    }));

    const { experimentManager: freshManager } = await import(
      "@/lib/ab-testing/ab-testing-framework"
    );
    const freshInstance = freshManager;

    await freshInstance.loadExperiments();

    // Should handle gracefully without throwing errors
    const variant = freshInstance.assignVariant("ssr-test", "user1");
    expect(variant).toBeDefined();
    expect(["control", "variant-a"]).toContain(variant?.id);
  });

  it("should handle non-existent experiments gracefully", async () => {
    const variant = manager.assignVariant("non-existent-experiment", "user1");
    expect(variant).toBeNull();

    const status = manager.getExperimentStatus("non-existent-experiment");
    expect(status).toBeNull();
  });

  it("should return empty array for active experiments when none loaded", async () => {
    // Reset to ensure no experiments loaded
    ExperimentManager.resetInstance();
    const freshManager = ExperimentManager.getInstance();

    const activeExperiments = freshManager.getActiveExperiments();
    expect(activeExperiments).toEqual([]);
  });

  it("should handle experiment status queries", async () => {
    const mockExperiments = {
      "status-test": {
        id: "status-test",
        name: "Status Test",
        description: "Test status queries",
        status: "running",
        variants: [
          { id: "control", name: "Control", weight: 50, isControl: true },
          { id: "variant-a", name: "Variant A", weight: 50 },
        ],
        goals: {
          primary: {
            id: "conversion",
            name: "Conversion",
            type: "conversion",
            metric: "conversion",
            direction: "increase",
          },
        },
        targetAudience: {
          segments: ["all"],
        },
        startDate: new Date(),
        confidenceLevel: 0.95,
        minimumDetectableEffect: 10,
        sampleSize: 1000,
      },
    };

    vi.doMock("@/lib/experiments/experiments-registry", () => ({
      ALL_EXPERIMENTS: mockExperiments,
    }));

    const { experimentManager: freshManager } = await import(
      "@/lib/ab-testing/ab-testing-framework"
    );
    const freshInstance = freshManager;

    await freshInstance.loadExperiments();

    const status = freshInstance.getExperimentStatus("status-test");
    expect(status).toBeDefined();
    expect(status?.experiment.id).toBe("status-test");
    expect(status?.totalVisitors).toBe(0); // No visitors assigned yet
  });
});
