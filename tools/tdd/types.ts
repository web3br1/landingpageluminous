/**
 * TDD Quality System - Shared Types
 */

export interface CacheKey {
  branch: string;
  maturityTarget: MaturityLevel;
  domains: Record<CacheDomain, string>; // hash por domínio
  environment: 'local' | 'ci';
  timestamp: number;
}

export type CacheDomain = 'SRC' | 'TESTS' | 'CONFIG' | 'LOCKFILE';

export interface CacheEntry {
  key: CacheKey;
  results: TDDResults;
  metadata: CacheMetadata;
}

export interface CacheMetadata {
  createdAt: string;
  expiresAt: string;
  size: number;
  domainsUsed: CacheDomain[];
}

export interface CacheDecision {
  domain: CacheDomain;
  hit: boolean;
  hash: string;
  reason?: string;
  changedFiles?: string[];
}

export type MaturityLevel = 'M0' | 'M1' | 'M2' | 'M3';

export interface MaturityConfig {
  level: MaturityLevel;
  name: string;
  description: string;
  weights: Record<string, number>;
  maxCriticalIssues: number;
}

export interface TDDResults {
  maturity: MaturityConfig;
  classifier: TestHealthReport;
  engine?: EngineResults;
  scores: ContextualScores;
  cache?: {
    decisions: CacheDecision[];
    performance: CachePerformance;
  };
}

export interface TestHealthReport {
  redTests: TestIssue[];
  yellowTests: TestIssue[];
  greenTests: string[];
  healthScore: number;
  criticalFailures: number;
  testQuality: string;
  failurePatterns: {
    byType: Record<string, number>;
    byFile: Record<string, number>;
    byCategory: Record<string, number>;
  };
  recommendations: Recommendation[];
}

export interface TestIssue {
  category: string;
  issue: string;
  impact: string;
  evidence: string;
  solution: string;
}

export interface Recommendation {
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  action: string;
  details: string;
  timeline: string;
}

export interface EngineResults {
  available: boolean;
  scores?: Record<string, number>;
  risks?: any[];
  reason?: string;
}

export interface ContextualScores {
  finalScore: number;
  maturity: MaturityLevel;
  weights: Record<string, number>;
  breakdown: Array<{
    metric: string;
    weight: string;
    score: string;
    contribution: string;
    source: 'classifier' | 'engine' | 'proxy';
  }>;
}

export interface CachePerformance {
  totalTime: number;
  domainsHit: number;
  domainsTotal: number;
  hitRate: number;
}

export interface StaticCoverageProxy {
  byFile: Record<string, FileCoverage>;
  aggregate: {
    totalLines: number;
    instrumentableLines: number;
    estimatedCovered: number;
    proxyCoverage: number;
  };
  source: 'proxy';
}

export interface FileCoverage {
  file: string;
  totalLines: number;
  instrumentableLines: number;
  estimatedCovered: number;
  proxyCoverage: number;
  hasTestFile: boolean;
  testFilePath?: string;
}

export interface TDDHistoryEntry {
  timestamp: string;
  branch: string;
  commit?: string;
  maturity: MaturityLevel;
  scores: ContextualScores;
  topFindings: Array<{
    file: string;
    severity: 'RED' | 'YELLOW' | 'GREEN';
    code: string;
  }>;
  riskyFiles: Array<{
    file: string;
    incidentsLast10: number;
  }>;
  cache: {
    used: boolean;
    domains: Record<CacheDomain, {
      hit: boolean;
      hash: string;
      reason?: string;
    }>;
    key: string;
  };
}

export interface SafeTestInfo {
  file: string;
  category: 'unit' | 'integration' | 'component' | 'e2e';
  estimatedDuration: number; // ms
  dependencies: string[]; // external dependencies
  safetyScore: number; // 0-100
  reasons: string[]; // why it's considered safe/unsafe
  testCount: number; // number of test cases in file
  hasMocks: boolean;
  coversCriticalPath: boolean;
}

export interface SafeTestSubset {
  tests: SafeTestInfo[];
  totalEstimatedDuration: number; // ms
  coverage: {
    unit: number;
    component: number;
    integration: number;
    total: number;
  };
  lastUpdated: string;
  criteria: {
    maxDuration: number;
    minSafetyScore: number;
    maxDependencies: number;
    prioritizeCriticalPath: boolean;
  };
}

export interface SafeTestResult {
  subset: SafeTestSubset;
  executedAt: string;
  totalDuration: number;
  results: Array<{
    file: string;
    duration: number;
    passed: boolean;
    flaky: boolean;
    error?: string;
  }>;
  summary: {
    passed: number;
    failed: number;
    skipped: number;
    total: number;
  };
  reliability: {
    successRate: number; // percentage
    averageDuration: number; // ms
    flakyTests: string[]; // files that are flaky
  };
}
