# Section Priority Classification

## Overview

This document defines the priority classification system for landing page sections based on their impact on Core Web Vitals, funnel conversion, and user experience.

## Priority Levels

### Critical Sections (No Lazy Loading)

These sections are essential for funnel conversion and LCP. They are always SSR-ready and never use lazy loading.

| Section     | Purpose                      | SLA     |
| ----------- | ---------------------------- | ------- |
| `hero`      | Primary funnel entry point   | < 100ms |
| `pricing`   | Primary conversion point     | < 100ms |
| `final-cta` | Secondary CTA for conversion | < 100ms |

**Implementation:**

- Always available immediately
- No Suspense boundaries
- Direct imports in bundle
- Rendered on server for all page types

### Important Sections (Dynamic with SSR)

These sections are important but not critical for initial render. They use Next.js dynamic imports with SSR enabled.

| Section        | Purpose                       | SLA     |
| -------------- | ----------------------------- | ------- |
| `benefits`     | LCP-critical for hero context | < 200ms |
| `features`     | Important for trust-building  | < 200ms |
| `social-proof` | Trust signals                 | < 200ms |
| `faq`          | Common user questions         | < 200ms |

**Implementation:**

- Next.js `dynamic()` with `ssr: true`
- Skeleton loading states
- Progressive enhancement
- Can be rendered on server

### Secondary Sections (Lazy with Timeout)

These sections are nice-to-have but not essential for conversion. They use React.lazy with 2-second timeout.

| Section     | Purpose              | SLA  |
| ----------- | -------------------- | ---- |
| `demo`      | Interactive demo     | < 2s |
| `footer`    | Legal and navigation | < 2s |
| `lead-form` | Conversion form      | < 2s |

**Implementation:**

- React.lazy with 2s timeout
- Stable fallback after timeout
- Telemetry tracking (start/ok/timeout/error)
- Intersection observer for on-demand loading

## Telemetry Events

All sections emit the following telemetry events:

- `section_render_start` - When section rendering begins
- `section_render_ok` - When section renders successfully
- `section_render_timeout` - When lazy section times out (2s)
- `section_render_error` - When section fails to render

## PR Checklist

When modifying sections or adding new ones:

- [ ] **Critical Check**: Is this section critical for funnel conversion?
- [ ] **Lazy Decision**: If not critical, does it need lazy loading?
- [ ] **Fallback Check**: Does it have a visible loading fallback?
- [ ] **Timeout Check**: If lazy, does it have a 2s timeout?
- [ ] **Telemetry Check**: Does it emit the 4 required telemetry events?
- [ ] **Test Check**: Does it have data-testid for test visibility?

## Monitoring

Section performance is monitored in `/admin/monitoring` with metrics for:

- Render success rate
- Average load times by priority
- Timeout and error counts
- Loading distribution charts

## Migration Guide

When changing a section's priority:

1. Update classification in `route-based-lazy-loading.tsx`
2. Modify import strategy in the file
3. Update telemetry if changing lazy behavior
4. Test hydration in production environment
5. Update this documentation
