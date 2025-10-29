# ✅ SSR Validation Checklist - Landing Page SaaS

## 🎯 Purpose

This checklist ensures SSR (Server-Side Rendering) safety and prevents regressions in production. Run before every deploy and after SSR-related changes.

## 📊 Quick Status

- **Last Validated**: October 2025
- **Success Rate**: 71.4% (10/14 checks passed)
- **Status**: ⚠️ MOSTLY VALID (minor issues detected)

---

## 🔍 Pre-Deploy Validation

### Build & Compilation

- [x] `npm run build` completes successfully (0 errors)
- [x] No TypeScript compilation errors
- [x] ESLint passes with 0 SSR-related warnings
- [ ] Bundle size within acceptable limits (< 200KB)
- [ ] No console warnings in production build

### SSR Safety Checks

- [x] No `window is not defined` errors in build logs
- [x] No `document is not defined` errors in build logs
- [x] No `navigator is not defined` errors in build logs
- [x] All browser API access has guards
- [x] Singleton services use lazy initialization
- [x] React hooks use safe state initialization

### Server Startup

- [x] `npm run start` starts without errors
- [x] Server responds on correct port (3000)
- [x] HTTP 200 OK on landing page
- [x] No runtime SSR errors in server logs

---

## 🌐 Runtime Validation

### Core Functionality

- [x] Landing page renders correctly
- [x] Navigation between pages works
- [x] Progressive enhancement loads
- [x] Client-side JavaScript executes
- [x] No hydration mismatches

### Browser API Safety

- [x] localStorage operations work (with fallbacks)
- [x] sessionStorage operations work (with fallbacks)
- [x] navigator API access safe
- [x] window event listeners attach properly
- [x] document manipulation works

### Third-Party Integrations

- [x] Analytics tracking initializes
- [x] RUM monitoring starts
- [ ] Error tracking captures errors
- [ ] Performance monitoring active

---

## 📊 Performance Validation

### Core Web Vitals

- [ ] LCP < 2.5s (⚠️ Currently: 4.0s - needs optimization)
- [ ] CLS < 0.1 (⚠️ Currently: 0.15 - needs improvement)
- [x] INP < 200ms (✅ Currently: 120ms - good)
- [ ] FCP < 1.8s
- [ ] TTFB < 800ms

### Bundle & Loading

- [ ] First load JS < 100KB
- [ ] Subsequent loads < 50KB
- [ ] Images lazy-loaded properly
- [ ] Fonts load without FOUC

---

## 🔧 Code Quality Gates

### SSR Pattern Compliance

- [x] All browser APIs use `safeBrowserAPI` helper
- [x] All singletons use lazy initialization
- [x] All hooks use `useEffect` for browser APIs
- [x] All components handle SSR gracefully
- [ ] ESLint SSR rules pass (when implemented)

### Error Handling

- [x] SSR errors logged appropriately
- [x] Fallbacks provided for all browser APIs
- [x] Graceful degradation implemented
- [ ] Error boundaries catch SSR issues

---

## 🧪 Testing Validation

### Unit Tests

- [ ] Browser storage utilities tested
- [ ] SSR-safe hooks tested
- [ ] Component SSR rendering tested
- [ ] Error boundaries tested

### Integration Tests

- [ ] Page rendering in SSR mode tested
- [ ] Client hydration tested
- [ ] Progressive enhancement tested
- [ ] Browser API fallbacks tested

### E2E Tests

- [ ] Full page loads tested
- [ ] Navigation tested
- [ ] Client-side features tested
- [ ] Error scenarios tested

---

## 📋 Manual Validation Steps

### 1. Local Development Server

```bash
# Start development server
npm run dev

# Check for SSR errors in console
# Visit http://localhost:3000
# Check Network tab for proper loading
# Check Console for SSR-related errors
```

### 2. Production Build Test

```bash
# Build for production
npm run build

# Start production server
npm run start

# Test all routes manually
# Check for hydration errors
# Verify progressive enhancement
```

### 3. Automated Validation

```bash
# Run SSR validation script
node scripts/ssr-validation.js

# Check results
# Address any failures
# Re-run until all checks pass
```

---

## 🚨 Critical Issues (Block Deploy)

### 🚫 Hard Stops

- [ ] Build fails with SSR errors
- [ ] Server won't start
- [ ] Pages return 500 errors
- [ ] Hydration mismatches detected
- [ ] Critical browser APIs broken

### ⚠️ Warnings (Review Required)

- [ ] Core Web Vitals degraded
- [ ] Bundle size increased significantly
- [ ] New browser API usage without guards
- [ ] ESLint SSR rule violations

---

## 🔄 Continuous Monitoring

### Post-Deploy Checks (24h)

- [ ] Server logs show no SSR errors
- [ ] Client-side errors minimal
- [ ] Core Web Vitals stable
- [ ] User reports no broken functionality
- [ ] Analytics data flows correctly

### Weekly Reviews

- [ ] Bundle size trends monitored
- [ ] Core Web Vitals tracked
- [ ] SSR error rates reviewed
- [ ] New browser API usage audited

---

## 🛠️ Troubleshooting

### Common Issues & Solutions

#### `window is not defined`

**Symptoms**: Build fails, SSR errors in logs
**Solution**:

```typescript
// ❌ Wrong
const width = window.innerWidth;

// ✅ Correct
const width = safeBrowserAPI(() => window.innerWidth, 1024);
```

#### Singleton Initialization Errors

**Symptoms**: Module loading fails on server
**Solution**:

```typescript
// ❌ Wrong
export const service = new BrowserService();

// ✅ Correct
export const service =
  typeof window === "undefined" ? null : new BrowserService();
```

#### Hook State Issues

**Symptoms**: Hydration mismatches
**Solution**:

```typescript
// ❌ Wrong
const [width, setWidth] = useState(window.innerWidth);

// ✅ Correct
const [width, setWidth] = useState(1024);
useEffect(() => {
  setWidth(window.innerWidth);
}, []);
```

---

## 📈 Metrics Dashboard

### SSR Health Score

- **Current**: 71.4%
- **Target**: > 90%
- **Trend**: Improving

### Error Rates

- **SSR Errors**: 0 (last 24h)
- **Client Errors**: Low
- **Build Failures**: 0

### Performance Trends

- **LCP**: Improving (4.0s → target 2.5s)
- **CLS**: Needs attention (0.15 → target < 0.1)
- **INP**: Good (120ms → target < 200ms)

---

## 🎯 Action Items

### Immediate (This Sprint)

- [ ] Optimize LCP (implement image optimization)
- [ ] Fix CLS issues (improve loading states)
- [ ] Implement ESLint SSR rules
- [ ] Add comprehensive E2E tests

### Short Term (Next Sprint)

- [ ] Implement runtime SSR monitoring
- [ ] Add automated performance regression tests
- [ ] Create SSR error alerting
- [ ] Document all edge cases

### Long Term (Quarterly)

- [ ] Implement SSR performance budgeting
- [ ] Add A/B testing for SSR optimizations
- [ ] Create SSR training materials
- [ ] Establish SSR center of excellence

---

**Checklist Version**: 1.0
**Last Updated**: October 2025
**Next Review**: Monthly
**Owner**: Web Development Team
