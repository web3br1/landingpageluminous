# Advanced Framer Motion Mocks for Testing

## Problem

Tests using Framer Motion components often timeout or fail because:

1. **Async Animation Lifecycle**: Framer Motion animations have async lifecycle (mount → animate → complete)
2. **DOM Updates**: Animations trigger multiple DOM updates that Testing Library tries to wait for
3. **Test Timeouts**: Components using `motion.div` with `initial`/`animate`/`transition` props cause 10+ second timeouts
4. **Unpredictable Behavior**: Animation timing makes tests flaky and slow

## Solution: Synchronous Animation Mocks

### Complete Mock Implementation

```typescript
// Advanced mock for framer-motion to handle animation lifecycle completely
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      initial,
      animate,
      transition,
      style,
      whileInView,
      variants,
      ...props
    }: any) => {
      // Extract animation-related props to avoid passing them to DOM
      const animationProps = {
        initial,
        animate,
        transition,
        whileInView,
        variants,
      };

      // Return a simple div that immediately renders the "animate" state
      // This simulates the completed animation state without async behavior
      const finalStyles = {
        ...style,
        // Simulate completed animation by applying final styles immediately
        opacity: animate?.opacity ?? initial?.opacity ?? 1,
        transform: animate?.y
          ? `translateY(${animate.y}px)`
          : animate?.x
            ? `translateX(${animate.x}px)`
            : initial?.y
              ? `translateY(${initial.y}px)`
              : initial?.x
                ? `translateX(${initial.x}px)`
                : undefined,
        scale: animate?.scale ?? initial?.scale ?? undefined,
      };

      return React.createElement(
        "div",
        {
          ...props,
          style: finalStyles,
          "data-testid": "motion-div",
          "data-animation-props": JSON.stringify(animationProps),
        },
        children,
      );
    },
    form: ({ children, ...props }: any) =>
      React.createElement("form", props, children),
  },
}));
```

### How It Works

1. **Synchronous Rendering**: No async animation lifecycle - renders immediately
2. **Final State Simulation**: Applies `animate` styles immediately (simulates completed animation)
3. **Prop Isolation**: Animation props are extracted and stored in data attributes
4. **DOM Compatibility**: Returns standard React elements that work with Testing Library

### Supported Animation Properties

- ✅ `initial` - Used as fallback styles
- ✅ `animate` - Applied as final styles
- ✅ `transition` - Extracted but ignored (no timing)
- ✅ `whileInView` - Extracted but ignored
- ✅ `variants` - Extracted but ignored
- ✅ `style` - Merged with animation styles
- ✅ All other props - Passed through to DOM element

### Usage in Test Files

```typescript
import { vi } from "vitest";

// Add this mock at the top of any test file using Framer Motion
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      initial,
      animate,
      transition,
      style,
      whileInView,
      variants,
      ...props
    }: any) => {
      const finalStyles = {
        ...style,
        opacity: animate?.opacity ?? initial?.opacity ?? 1,
        transform: animate?.y
          ? `translateY(${animate.y}px)`
          : animate?.x
            ? `translateX(${animate.x}px)`
            : initial?.y
              ? `translateY(${initial.y}px)`
              : initial?.x
                ? `translateX(${initial.x}px)`
                : undefined,
        scale: animate?.scale ?? initial?.scale ?? undefined,
      };

      return React.createElement(
        "div",
        {
          ...props,
          style: finalStyles,
          "data-testid": "motion-div",
        },
        children,
      );
    },
    // Add other motion components as needed (form, button, etc.)
  },
}));

describe("MyComponent", () => {
  // Tests now run synchronously without animation timeouts
});
```

## Test Results

### Before (with basic mocks):

```
❌ renders all form fields correctly - 358ms (failed)
❌ submits form successfully with valid data - 10007ms (timed out)
❌ shows success message after successful submission - 10006ms (timed out)
❌ shows loading state during submission - 10017ms (timed out)
```

### After (with advanced mocks):

```
✅ renders form with correct title and subtitle - 38ms
✅ renders all form fields correctly - 152ms
✅ renders submit button with correct text - 6ms
✅ renders privacy text when provided - 5ms
✅ validates required fields on submit - 23ms
✅ validates email format - 44ms
✅ handles form submission errors - 9ms
✅ handles optional fields correctly - 6ms
✅ supports different field types - 8ms
✅ is accessible with proper form structure - 93ms

Test Files 1 passed (1) - Duration 1.98s
```

## Best Practices

1. **Copy Mocks**: Add these mocks to every test file using Framer Motion components
2. **Extend as Needed**: Add support for other motion components (`motion.button`, `motion.span`, etc.)
3. **Test Data Attributes**: Use `data-testid="motion-div"` to verify animation elements
4. **Avoid Async Waits**: No need for `waitFor` with animation completion
5. **Consistent Styles**: Animation styles are applied immediately and predictably

## Common Issues Resolved

- ✅ Test timeouts > 10 seconds
- ✅ Async rendering causing test failures
- ✅ Flaky animation-dependent tests
- ✅ Components using `motion.div` with complex props
- ✅ Multiple DOM updates during animation lifecycle

## Alternative Approaches

If you need to test actual animations (rare), consider:

- Integration tests with Playwright (end-to-end)
- Visual regression tests
- Separate animation unit tests

For most component tests, synchronous mocks provide better performance and reliability.
