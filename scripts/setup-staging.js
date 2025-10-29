#!/usr/bin/env node

/**
 * Setup Staging Environment
 * Configures the application for staging deployment
 */

const fs = require("fs");
const path = require("path");

console.log("🎭 Setting up staging environment...\n");

// Staging-specific environment variables
const stagingEnv = {
  // Analytics - staging domain
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: "staging.dataflow.com.br",
  NEXT_PUBLIC_GA_MEASUREMENT_ID: "G-STAGING123456",

  // App Configuration
  NEXT_PUBLIC_APP_URL: "https://dataflow-staging.vercel.app",
  NEXT_PUBLIC_NODE_ENV: "staging",

  // Feature Flags - enable experimental features in staging
  NEXT_PUBLIC_EXPERIMENT_HERO_HEADLINES: "variant_b",
  NEXT_PUBLIC_EXPERIMENT_CTA_COLOR: "blue",
  EXPERIMENT_PRICING_LAYOUT: "cards",

  // Debug and Development
  NEXT_PUBLIC_LAYOUT_DEBUG_STAGE: "12", // Enable UX Advanced Orchestrator (chat + onboarding + recommendations)
  NEXT_PUBLIC_ENABLE_DEBUG_OVERLAY: "true",

  // Monitoring - staging endpoints
  SENTRY_DSN: "https://staging-sentry-dsn@sentry.io/project",
  LOG_LEVEL: "debug",

  // Cache - staging configuration
  CACHE_BACKEND: "memory", // Use memory cache for staging
  REDIS_URL: "", // No Redis for staging

  // Security - relaxed for staging
  CSP_REPORT_ONLY: "true",
};

// Create .env.staging file
const envContent = Object.entries(stagingEnv)
  .map(([key, value]) => `${key}=${value}`)
  .join("\n");

const envPath = path.join(process.cwd(), ".env.staging");
fs.writeFileSync(envPath, envContent);

console.log("✅ Created .env.staging with staging configuration");
console.log("📁 File:", envPath);

// Create staging-specific vercel.json override
const stagingVercelConfig = {
  ...JSON.parse(fs.readFileSync("vercel.json", "utf8")),
  env: {
    ...stagingEnv,
    NODE_ENV: "production", // Vercel always sets this to production
  },
  builds: [
    {
      src: "package.json",
      use: "@vercel/next",
      config: {
        maxLambdaSize: "50mb",
      },
    },
  ],
  redirects: [
    {
      source: "/staging-health",
      destination: "/api/health",
      statusCode: 200,
    },
  ],
};

const vercelStagingPath = path.join(process.cwd(), "vercel.staging.json");
fs.writeFileSync(
  vercelStagingPath,
  JSON.stringify(stagingVercelConfig, null, 2),
);

console.log(
  "✅ Created vercel.staging.json with staging-specific configuration",
);
console.log("📁 File:", vercelStagingPath);

// Create staging deployment checklist
const checklistContent = `# 🚀 Staging Deployment Checklist

## Pre-Deployment
- [ ] Run \`pnpm test\` - All tests passing
- [ ] Run \`pnpm build\` - Build successful
- [ ] Run \`pnpm preview:staging\` - Preview deployment works
- [ ] Check analytics consent banner appears
- [ ] Test @shared/observ timing logs in console

## Deployment
- [ ] Run \`pnpm deploy:staging\` or use Vercel dashboard
- [ ] Wait for deployment to complete
- [ ] Check deployment URL is accessible

## Post-Deployment Verification
- [ ] Landing page loads without errors
- [ ] Analytics events are tracked (check network tab)
- [ ] PlausibleProvider initializes (check console for "Plausible initialized")
- [ ] @shared/observ timing appears in logs
- [ ] Admin dashboards accessible (/admin/* routes)
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
`;

const checklistPath = path.join(process.cwd(), "STAGING_CHECKLIST.md");
fs.writeFileSync(checklistPath, checklistContent);

console.log(
  "✅ Created STAGING_CHECKLIST.md with deployment verification steps",
);
console.log("📁 File:", checklistPath);

console.log("\n🎉 Staging environment setup complete!");
console.log("\n📋 Next steps:");
console.log("1. Review and update .env.staging with your actual values");
console.log("2. Run: pnpm preview:staging");
console.log("3. Follow STAGING_CHECKLIST.md for verification");
console.log("4. When ready: pnpm deploy:staging");
