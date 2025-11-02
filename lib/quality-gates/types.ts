/**
 * Quality Gates Framework Types
 * Advanced quality gate system for CI/CD pipeline
 */

export interface PRData {
  id: string;
  title: string;
  author: string;
  branch: string;
  baseBranch: string;
  files: string[];
  changedLines: number;
  commitSha: string;
  repository: string;
}

export interface GateResult {
  gate: string;
  name: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: Record<string, unknown>;
  required: boolean;
  score?: number;
  threshold?: number;
}

export interface QualityScore {
  overall: number;
  staticAnalysis: number;
  bundleSize: number;
  testCoverage: number;
  performance: number;
  accessibility: number;
  security: number;
}

export interface QualityGate {
  id: string;
  name: string;
  description: string;
  required: boolean;
  timeout: number;
  category: "static" | "performance" | "testing" | "security" | "accessibility";
  run: (prData: PRData) => Promise<GateResult>;
}

export interface GateConfig {
  enabled: boolean;
  threshold: number;
  strict: boolean;
  failOnWarnings: boolean;
}

export interface QualityReport {
  pr: PRData;
  timestamp: Date;
  overall: {
    passed: boolean;
    score: number;
    duration: number;
  };
  gates: GateResult[];
  recommendations: string[];
  criticalIssues: string[];
}
