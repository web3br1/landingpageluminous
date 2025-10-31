// ===== TESTING INFRASTRUCTURE TYPES =====
// Comprehensive type definitions for testing infrastructure

// ===== TEST FIXTURES =====

export interface TestFixture<T = any> {
  name: string;
  description?: string;
  data: T;
  metadata?: TestFixtureMetadata;
}

export interface TestFixtureMetadata {
  createdAt: Date;
  updatedAt: Date;
  version: string;
  tags: string[];
  category: string;
  environment: "development" | "staging" | "production";
}

export interface UserTestFixture extends TestFixture {
  data: {
    id: string;
    email: string;
    name: string;
    role: "admin" | "user" | "guest";
    preferences: Record<string, any>;
    createdAt: Date;
    lastLogin?: Date;
  };
}

export interface ComponentTestFixture extends TestFixture {
  data: {
    props: Record<string, any>;
    state?: Record<string, any>;
    context?: Record<string, any>;
    children?: React.ReactNode;
  };
}

export interface ApiTestFixture extends TestFixture {
  data: {
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    url: string;
    headers?: Record<string, string>;
    body?: any;
    response: {
      status: number;
      headers?: Record<string, string>;
      body: any;
    };
  };
}

// ===== MOCK OBJECTS =====

export interface MockObject<T = any> {
  id: string;
  name: string;
  type: "function" | "object" | "class" | "module";
  implementation: T;
  calls: MockCall[];
  metadata: MockMetadata;
}

export interface MockCall {
  args: any[];
  returnValue?: any;
  thrownError?: Error;
  timestamp: Date;
  context?: any;
}

export interface MockMetadata {
  module: string;
  function: string;
  isAsync: boolean;
  callCount: number;
  lastCalled?: Date;
}

export interface HttpMock extends MockObject {
  type: "function";
  implementation: {
    get: jest.MockedFunction<any>;
    post: jest.MockedFunction<any>;
    put: jest.MockedFunction<any>;
    delete: jest.MockedFunction<any>;
  };
}

export interface DatabaseMock extends MockObject {
  type: "object";
  implementation: {
    find: jest.MockedFunction<any>;
    findOne: jest.MockedFunction<any>;
    create: jest.MockedFunction<any>;
    update: jest.MockedFunction<any>;
    delete: jest.MockedFunction<any>;
  };
}

// ===== TEST UTILITIES =====

export interface TestHelper<T = any> {
  name: string;
  description: string;
  category: "rendering" | "interaction" | "async" | "data" | "dom" | "api";
  implementation: (...args: any[]) => T;
  examples?: TestHelperExample[];
}

export interface TestHelperExample {
  description: string;
  code: string;
  expected: any;
}

export interface RenderTestHelper extends TestHelper<React.ReactElement> {
  category: "rendering";
  implementation: (component: React.ComponentType, props?: any) => React.ReactElement;
}

export interface InteractionTestHelper extends TestHelper<void> {
  category: "interaction";
  implementation: (element: HTMLElement, action: string, options?: any) => void;
}

export interface AsyncTestHelper extends TestHelper<Promise<any>> {
  category: "async";
  implementation: (...args: any[]) => Promise<any>;
}

export interface DataTestHelper extends TestHelper<any> {
  category: "data";
  implementation: (data: any, operation: string, options?: any) => any;
}

export interface DomTestHelper extends TestHelper<HTMLElement> {
  category: "dom";
  implementation: (selector: string, options?: any) => HTMLElement;
}

export interface ApiTestHelper extends TestHelper<any> {
  category: "api";
  implementation: (endpoint: string, method: string, data?: any) => any;
}

// ===== TEST CONFIGURATION =====

export interface TestConfig {
  timeout: number;
  retries: number;
  environment: "unit" | "integration" | "e2e";
  browser?: "chromium" | "firefox" | "webkit";
  viewport?: { width: number; height: number };
  device?: string;
  locale?: string;
  timezone?: string;
}

export interface TestSuiteConfig extends TestConfig {
  fixtures: TestFixture[];
  mocks: MockObject[];
  helpers: TestHelper[];
  setup: TestSetupFunction[];
  teardown: TestTeardownFunction[];
}

export type TestSetupFunction = () => void | Promise<void>;
export type TestTeardownFunction = () => void | Promise<void>;

// ===== TEST RESULTS =====

export interface TestResult {
  id: string;
  name: string;
  status: "passed" | "failed" | "skipped" | "pending";
  duration: number;
  error?: TestError;
  metadata: TestResultMetadata;
}

export interface TestError {
  message: string;
  stack?: string;
  actual?: any;
  expected?: any;
  operator?: string;
}

export interface TestResultMetadata {
  suite: string;
  file: string;
  line?: number;
  timestamp: Date;
  environment: TestConfig["environment"];
  tags: string[];
}

// ===== TEST ASSERTIONS =====

export interface TestAssertion<T = any> {
  type: "equal" | "deepEqual" | "truthy" | "falsy" | "throws" | "doesNotThrow";
  actual: T;
  expected?: T;
  message?: string;
  negate?: boolean;
}

export interface AccessibilityTestAssertion extends TestAssertion {
  type: "accessibility";
  rules: string[];
  level: "A" | "AA" | "AAA";
  violations: any[];
}

export interface PerformanceTestAssertion extends TestAssertion {
  type: "performance";
  metric: string;
  threshold: number;
  value: number;
}

// ===== TEST REPORTERS =====

export interface TestReporter {
  name: string;
  format: "json" | "html" | "xml" | "console";
  output: (results: TestResult[]) => void | Promise<void>;
}

export interface JsonTestReporter extends TestReporter {
  format: "json";
  output: (results: TestResult[]) => Promise<void>;
  filePath: string;
}

export interface HtmlTestReporter extends TestReporter {
  format: "html";
  output: (results: TestResult[]) => Promise<void>;
  template: string;
  outputDir: string;
}

// ===== TEST RUNNERS =====

export interface TestRunner {
  name: string;
  framework: "vitest" | "jest" | "playwright" | "cypress";
  config: TestConfig;
  run: (tests: string[]) => Promise<TestResult[]>;
}

export interface ParallelTestRunner extends TestRunner {
  maxWorkers: number;
  shard: boolean;
}

// ===== TEST COVERAGE =====

export interface TestCoverage {
  statements: CoverageMetric;
  branches: CoverageMetric;
  functions: CoverageMetric;
  lines: CoverageMetric;
  files: FileCoverage[];
}

export interface CoverageMetric {
  total: number;
  covered: number;
  skipped: number;
  pct: number;
}

export interface FileCoverage {
  filename: string;
  statements: CoverageMetric;
  branches: CoverageMetric;
  functions: CoverageMetric;
  lines: CoverageMetric;
}

// ===== TEST DEBUGGING =====

export interface TestDebugger {
  breakpoint: (condition: () => boolean) => void;
  spy: <T>(obj: T, method: keyof T) => void;
  mock: (module: string, implementation: any) => void;
  time: (label: string) => () => number;
}

// ===== INTEGRATION WITH EXISTING TYPES =====

// Extend existing types with test-specific properties
declare module "vitest" {
  interface TestContext {
    fixtures: Map<string, TestFixture>;
    mocks: Map<string, MockObject>;
    helpers: Map<string, TestHelper>;
  }
}
