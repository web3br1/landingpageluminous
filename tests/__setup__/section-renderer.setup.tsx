/**
 * Jest setup for SectionRenderer tests
 * Mocks dynamic imports for lazy-loaded components
 */

// Mock all section components to avoid dynamic import issues in tests
vi.mock("../../components/sections/hero", () => ({
  Hero: vi.fn(() => <div data-testid="mock-hero">Hero Component</div>),
  __esModule: true,
  default: vi.fn(() => <div data-testid="mock-hero">Hero Component</div>),
}));

vi.mock("../../components/sections/benefits", () => ({
  Benefits: vi.fn(() => (
    <div data-testid="mock-benefits">Benefits Component</div>
  )),
  __esModule: true,
  default: vi.fn(() => (
    <div data-testid="mock-benefits">Benefits Component</div>
  )),
}));

vi.mock("../../components/sections/features", () => ({
  Features: vi.fn(() => (
    <div data-testid="mock-features">Features Component</div>
  )),
  __esModule: true,
  default: vi.fn(() => (
    <div data-testid="mock-features">Features Component</div>
  )),
}));

vi.mock("../../components/sections/pricing", () => ({
  Pricing: vi.fn(() => <div data-testid="mock-pricing">Pricing Component</div>),
  __esModule: true,
  default: vi.fn(() => <div data-testid="mock-pricing">Pricing Component</div>),
}));

vi.mock("../../components/sections/social-proof", () => ({
  SocialProof: vi.fn(() => (
    <div data-testid="mock-social-proof">SocialProof Component</div>
  )),
  __esModule: true,
  default: vi.fn(() => (
    <div data-testid="mock-social-proof">SocialProof Component</div>
  )),
}));

vi.mock("../../components/sections/demo", () => ({
  Demo: vi.fn(() => <div data-testid="mock-demo">Demo Component</div>),
  __esModule: true,
  default: vi.fn(() => <div data-testid="mock-demo">Demo Component</div>),
}));

vi.mock("../../components/sections/faq", () => ({
  Faq: vi.fn(() => <div data-testid="mock-faq">Faq Component</div>),
  __esModule: true,
  default: vi.fn(() => <div data-testid="mock-faq">Faq Component</div>),
}));

vi.mock("../../components/sections/final-cta", () => ({
  FinalCta: vi.fn(() => (
    <div data-testid="mock-final-cta">FinalCta Component</div>
  )),
  __esModule: true,
  default: vi.fn(() => (
    <div data-testid="mock-final-cta">FinalCta Component</div>
  )),
}));

vi.mock("../../components/sections/footer", () => ({
  Footer: vi.fn(() => <div data-testid="mock-footer">Footer Component</div>),
  __esModule: true,
  default: vi.fn(() => <div data-testid="mock-footer">Footer Component</div>),
}));

// Mock React lazy and Suspense for testing
vi.mock("react", () => ({
  ...jest.requireActual("react"),
  lazy: vi.fn((importFn) => {
    const MockLazyComponent = () => (
      <div data-testid="lazy-mock">Lazy Component</div>
    );
    MockLazyComponent.displayName = "MockLazyComponent";
    return MockLazyComponent;
  }),
  Suspense: ({ children, fallback }: any) => children || fallback,
}));

// Mock next/dynamic
vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: vi.fn((importFn, options) => {
    const MockDynamicComponent = () => (
      <div data-testid="dynamic-mock">Dynamic Component</div>
    );
    MockDynamicComponent.displayName = "MockDynamicComponent";
    return MockDynamicComponent;
  }),
}));
