# 🚀 Staging Deployment Checklist

## Pre-Deployment

- [ ] Run `pnpm test` - All tests passing
- [ ] Run `pnpm build` - Build successful
- [ ] Run `pnpm preview:staging` - Preview deployment works
- [ ] Check analytics consent banner appears
- [ ] Test @shared/observ timing logs in console

## Deployment

- [ ] Run `pnpm deploy:staging` or use Vercel dashboard
- [ ] Wait for deployment to complete
- [ ] Check deployment URL is accessible

## Post-Deployment Verification

- [ ] Landing page loads without errors
- [ ] Analytics events are tracked (check network tab)
- [ ] PlausibleProvider initializes (check console for "Plausible initialized")
- [ ] @shared/observ timing appears in logs
- [ ] Admin dashboards accessible (/admin/\* routes)
- [ ] Feature flags working (check experiments)

## Performance Validation

- [ ] Lighthouse score > 90
- [ ] Core Web Vitals within limits
- [ ] Bundle size < 180KB critical
- [ ] No console errors in production

## Staging-Specific Tests

- [ ] Debug overlays visible when NEXT_PUBLIC_ENABLE_DEBUG_OVERLAY=true
- [ ] Experimental features enabled
- [ ] Error boundaries functional
- [ ] Form submissions working (if configured)

## Go/No-Go Decision

- [ ] All critical functionality working
- [ ] No blocking bugs found
- [ ] Performance acceptable
- [ ] Ready for production deployment
