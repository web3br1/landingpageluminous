# 🔧 Composition-First Landing Page API Reference

## Overview

This documentation provides a comprehensive guide to the Composition-First Landing Page system, a modern, scalable architecture for building high-performance, accessible, and maintainable landing pages.

## 🏗️ Architecture

The system follows SOLID principles and Domain-Driven Design with clear separation of concerns:

- **Domain Layer**: Business logic and entities
- **Application Layer**: Use cases and services
- **Infrastructure Layer**: External dependencies and adapters
- **Presentation Layer**: React components and UI

## 📚 Core APIs

### Composition Container

The central dependency injection container that manages all services.

```typescript
import { compositionContainer } from "@/lib/composition/container";

// Access services
const pageService = compositionContainer.pageCompositionService;
const logger = compositionContainer.logger;
const metrics = compositionContainer.metrics;
```

### Page Composition Service

Handles the orchestration of page composition with content mapping and validation.

```typescript
import { compositionContainer } from "@/lib/composition/container";

const pageService = compositionContainer.pageCompositionService;

// Compose a page
const result = await pageService.composePage("landing", {
  userId: "user123",
  experimentId: "hero_test",
});

if (result.success) {
  // Use the composed page
  console.log("Sections:", result.data.sections.length);
} else {
  // Handle error
  console.error("Composition failed:", result.error);
}
```

### Content Mapper

Maps section IDs to their content composers.

```typescript
import { compositionContainer } from "@/lib/composition/container";

const contentMapper = compositionContainer.contentMapper;

const heroContent = await contentMapper.mapContent("hero", "landing", {
  experimentVariant: "variant_a",
});
```

### Error Tracker

Handles error tracking and reporting.

```typescript
import { compositionContainer } from "@/lib/composition/container";

const errorTracker = compositionContainer.errorTracker;

try {
  // Some operation
  await riskyOperation();
} catch (error) {
  await errorTracker.captureException(error, {
    component: "HeroSection",
    operation: "loadContent",
  });
}
```

## 🎨 UI Components

### Page Renderer

The main component for rendering composed pages.

```tsx
import { PageRenderer } from "@/lib/composition/page-renderer";

export default function LandingPage() {
  const composition = await composePage("landing");

  return <PageRenderer composition={composition} pageType="landing" />;
}
```

### Accessible Components

Comprehensive accessibility support.

```tsx
import {
  AccessibleHero,
  AccessibleButton,
} from "@/lib/accessibility/accessible-section";

export function MyHero() {
  return (
    <AccessibleHero
      title="Welcome to Our Platform"
      subtitle="Build amazing things"
      onCtaClick={() => console.log("CTA clicked")}
    >
      <AccessibleButton onClick={handleClick} loading={isLoading}>
        Get Started
      </AccessibleButton>
    </AccessibleHero>
  );
}
```

## 🔒 Security

### Input Validation

```typescript
import { LeadFormSchema } from "@/lib/security/validation-schemas";
import { validateApiInput } from "@/lib/security/security-middleware";

export async function handleLeadSubmission(data: unknown) {
  const validation = validateApiInput(LeadFormSchema, data);

  if (!validation.success) {
    return { success: false, errors: validation.errors };
  }

  // Process validated data
  await processLead(validation.data);
  return { success: true };
}
```

### Security Headers

```typescript
import { SecurityHeaders } from "@/lib/security/input-sanitizer";

// Get security headers for responses
const headers = SecurityHeaders.getSecurityHeaders();
// Returns comprehensive security headers
```

## 📊 Observability

### Logging

```typescript
import { logger } from "@/lib/observability/logger";

// Structured logging with context
logger.info("User action completed", {
  userId: "user123",
  action: "button_click",
  component: "hero_cta",
  experimentVariant: "control",
});

// Error logging
try {
  await riskyOperation();
} catch (error) {
  logger.logError(error, {
    operation: "risky_operation",
    userId: "user123",
  });
}
```

### Metrics

```typescript
import { metrics } from "@/lib/observability/metrics";

// Record custom metrics
metrics.incrementCounter("user_registrations_total", 1, {
  source: "hero_cta",
  plan: "free",
});

metrics.recordHistogram("api_response_time", 250, {
  endpoint: "/api/leads",
  method: "POST",
});

// Time operations
const endTimer = metrics.startTimer("email_send_duration");
// ... operation ...
endTimer();
```

### Tracing

```typescript
import { tracer } from "@/lib/observability/tracer";

// Trace operations
const result = await tracer.traceAsync("send_email", async (span) => {
  span.tags.userId = "user123";
  span.tags.emailType = "welcome";

  return await emailService.sendWelcomeEmail("user@example.com");
});

// Manual span management
const span = tracer.startSpan("database_query");
try {
  await db.query("SELECT * FROM users");
  tracer.finishSpan(span);
} catch (error) {
  tracer.finishSpan(span, error);
}
```

## 🧪 Testing

### Test Helpers

```typescript
import { TestDataFactory, MockServices } from "@/lib/composition/test-helpers";

// Create test data
const composition = TestDataFactory.createValidPageComposition({
  metadata: { title: "Test Page" },
});

// Mock services
const mockService = new MockServices.MockPageCompositionService();
mockService.mockSuccess(composition);

// Use in tests
const result = await mockService.composePage("landing");
expect(result.success).toBe(true);
```

### Type Guards

```typescript
import { isString, isEmail, assertString } from "@/lib/type-safety/type-guards";

// Runtime type checking
if (isEmail(userInput)) {
  // userInput is typed as string (email)
  await sendEmail(userInput);
}

// Assertions
function processUser(user: unknown) {
  assertString(user, "user"); // Throws if not string
  // user is now typed as string
}
```

## 🔧 Development Tools

### Component Debugging

```tsx
import { useComponentDebugger } from "@/lib/dev-tools/development-hooks";

export function MyComponent({ data }: { data: any }) {
  const { debugInfo, trackEffect } = useComponentDebugger("MyComponent", {
    data,
  });

  useEffect(() => {
    trackEffect("dataProcessing", [data]);
    // ... effect logic
  }, [data, trackEffect]);

  return (
    <div>
      {/* Component content */}
      {process.env.NODE_ENV === "development" && (
        <div
          style={{
            position: "fixed",
            top: 10,
            right: 10,
            background: "yellow",
          }}
        >
          Renders: {debugInfo.renderCount}
        </div>
      )}
    </div>
  );
}
```

### Performance Monitoring

```tsx
import { usePerformanceMonitor } from "@/lib/dev-tools/development-hooks";

export function DataFetcher() {
  const { performanceData, measureAsync } = usePerformanceMonitor("data_fetch");

  const fetchData = useCallback(async () => {
    return await measureAsync(() => api.fetchUserData(), { userId: "current" });
  }, [measureAsync]);

  return (
    <div>
      <button onClick={fetchData}>Fetch Data</button>
      {process.env.NODE_ENV === "development" && (
        <div>
          Avg fetch time: {performanceData.averageDuration.toFixed(2)}ms
        </div>
      )}
    </div>
  );
}
```

### Error Boundary

```tsx
import { DebugErrorBoundary } from "@/lib/dev-tools/development-hooks";

export function App() {
  return (
    <DebugErrorBoundary componentName="App">
      <MyAppContent />
    </DebugErrorBoundary>
  );
}
```

## 📝 Configuration

### Environment Variables

```bash
# Core
NODE_ENV=production
SERVICE_NAME=my-landing-page

# Observability
LOG_LEVEL=info
LOGGING_ENDPOINT=https://api.logservice.com/v1/logs
METRICS_ENDPOINT=https://api.metricsservice.com/v1/metrics
TRACING_ENDPOINT=https://api.tracingservice.com/v1/traces

# Security
LOGGING_API_KEY=your-logging-key
METRICS_API_KEY=your-metrics-key
TRACING_API_KEY=your-tracing-key

# Performance
LOG_SAMPLING_DEBUG=0.1
METRICS_FLUSH_INTERVAL=30000
TRACING_SAMPLE_RATE=0.1
```

### Service Configuration

```typescript
// lib/config/app-config.ts
export const appConfig = {
  services: {
    logging: {
      level: process.env.LOG_LEVEL || "info",
      endpoint: process.env.LOGGING_ENDPOINT,
    },
    metrics: {
      endpoint: process.env.METRICS_ENDPOINT,
      flushInterval: 30000,
    },
    tracing: {
      endpoint: process.env.TRACING_ENDPOINT,
      sampleRate: 0.1,
    },
  },
};
```

## 🚀 Best Practices

### 1. Error Handling

```typescript
// Always use Result types for operations that can fail
async function processUserData(data: unknown): Promise<Result<User, AppError>> {
  try {
    // Validate input
    const validation = validateUserData(data);
    if (!validation.success) {
      return Result.Err(AppError.ValidationError(validation.errors));
    }

    // Process data
    const user = await createUser(validation.data);

    // Log success
    logger.info("User created successfully", { userId: user.id });

    return Result.Ok(user);
  } catch (error) {
    logger.logError(error, { operation: "processUserData" });
    return Result.Err(AppError.UnexpectedError(error));
  }
}
```

### 2. Performance Monitoring

```typescript
// Time critical operations
const endTimer = metrics.startTimer("critical_operation_duration");

try {
  const result = await performCriticalOperation();
  endTimer();
  return result;
} catch (error) {
  endTimer();
  throw error;
}
```

### 3. Component Composition

```tsx
// Prefer composition over inheritance
export function HeroSection({ content, onCtaClick }: HeroSectionProps) {
  return (
    <AccessibleSection id="hero" heading={content.title}>
      <div className="hero-content">
        <h1>{content.title}</h1>
        <p>{content.subtitle}</p>
        <AccessibleButton onClick={onCtaClick}>
          {content.ctaText}
        </AccessibleButton>
      </div>
    </AccessibleSection>
  );
}
```

### 4. Type Safety

```typescript
// Use type guards for runtime validation
function processUserInput(input: unknown): User | null {
  if (
    !isObject(input) ||
    !hasStringProperty(input, "name") ||
    !hasStringProperty(input, "email")
  ) {
    return null;
  }

  if (!isEmail(input.email)) {
    return null;
  }

  return {
    name: input.name,
    email: input.email,
  };
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Composition fails**: Check if all required content composers are registered
2. **Hydration mismatches**: Ensure server and client render the same content
3. **Performance issues**: Check lazy loading configuration and bundle splitting
4. **Accessibility errors**: Run axe-core or lighthouse accessibility audits

### Debug Mode

Enable development tools in development:

```bash
NODE_ENV=development
NEXT_PUBLIC_LAYOUT_DEBUG_STAGE=10
```

This enables:

- Component debugging overlays
- Performance monitoring
- Error boundaries with detailed information
- Development overlay with metrics

## 📊 Monitoring & Alerting

### Key Metrics to Monitor

- Page load times (FCP, LCP, CLS, INP)
- Error rates by component
- Cache hit/miss ratios
- API response times
- User interaction latency

### Alerting Rules

```typescript
// Example alerting configuration
const alertingRules = {
  highErrorRate: {
    metric: "errors_total",
    threshold: 5,
    window: "5m",
    severity: "high",
  },
  slowPageLoad: {
    metric: "page_load_seconds",
    threshold: 3.0,
    window: "1m",
    severity: "medium",
  },
};
```

## 🔄 Migration Guide

### From Legacy System

1. Replace direct component imports with composition-based rendering
2. Update data fetching to use content composers
3. Add error boundaries and performance monitoring
4. Implement accessibility components
5. Set up observability and alerting

### Incremental Migration

```tsx
// Before
export default function LandingPage() {
  return (
    <div>
      <Hero title="Welcome" />
      <Features data={featuresData} />
    </div>
  );
}

// After
export default function LandingPage() {
  const composition = await composePage("landing");

  return <PageRenderer composition={composition} pageType="landing" />;
}
```

## 📞 Support

For questions or issues:

1. Check this documentation first
2. Review the examples in `/examples`
3. Open an issue on the project repository
4. Contact the development team

---

_This documentation is automatically generated and kept in sync with the codebase. Last updated: [Current Date]_
