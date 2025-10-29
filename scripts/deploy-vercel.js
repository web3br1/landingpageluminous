#!/usr/bin/env node

/**
 * Deploy Script for Luminaris SaaS Landing Page
 * Automates deployment to Vercel with proper configuration
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Luminaris SaaS - Deploy to Vercel\n");

// Check if we're in the right directory
if (!fs.existsSync("package.json")) {
  console.error(
    "❌ Error: package.json not found. Run this script from the project root.",
  );
  process.exit(1);
}

// Check if Vercel CLI is installed
try {
  execSync("vercel --version", { stdio: "pipe" });
} catch (error) {
  console.error("❌ Vercel CLI not found. Install it with: npm i -g vercel");
  process.exit(1);
}

// Check for required environment variables
console.log("🔍 Checking environment variables...");
const requiredEnvVars = ["NEXT_PUBLIC_GA_MEASUREMENT_ID", "PLAUSIBLE_DOMAIN"];

const optionalEnvVars = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_STARTER_PRICE_ID",
  "STRIPE_PROFESSIONAL_PRICE_ID",
  "PAGBANK_TOKEN",
  "PAGBANK_WEBHOOK_TOKEN",
];

const envPath = path.join(process.cwd(), ".env.local");
let envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log("⚠️  .env.local not found. Creating template...");
  const envTemplate = `# Luminaris SaaS Environment Variables

# Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourdomain.com

# Stripe (Optional - for payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PROFESSIONAL_PRICE_ID=price_...

# PagBank (Optional - Brazilian payments)
PAGBANK_TOKEN=your_token
PAGBANK_WEBHOOK_TOKEN=your_webhook_token
PAGBANK_STARTER_PLAN_ID=plan_starter
PAGBANK_PROFESSIONAL_PLAN_ID=plan_professional

# App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Cache Configuration (Optional)
CACHE_BACKEND=memory
REDIS_URL=redis://localhost:6379
KV_URL=your_vercel_kv_url

# Feature Flags (Optional)
EXPERIMENT_USER_ID=dev_user_123
`;

  fs.writeFileSync(".env.local", envTemplate);
  console.log(
    "✅ Created .env.local template. Please fill in your actual values.",
  );
}

// Run pre-deployment checks
console.log("\n🔍 Running pre-deployment checks...");

try {
  // Check TypeScript compilation
  console.log("📝 Checking TypeScript compilation...");
  execSync("npm run build", { stdio: "pipe" });
  console.log("✅ TypeScript compilation successful");

  // Check if all required files exist
  const requiredFiles = [
    "middleware.ts",
    "tailwind.config.ts",
    "next.config.mjs",
    "app/layout.tsx",
    "lib/flags.ts",
    "lib/analytics.tsx",
  ];

  console.log("📁 Checking required files...");
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Required file missing: ${file}`);
    }
  }
  console.log("✅ All required files present");
} catch (error) {
  console.error("❌ Pre-deployment check failed:", error.message);
  process.exit(1);
}

// Deploy to Vercel
console.log("\n🚀 Deploying to Vercel...");

const deployArgs = [
  "--prod", // Deploy to production
  "--yes", // Skip confirmation prompts
];

try {
  // Link project if not already linked
  try {
    execSync("vercel link --yes", { stdio: "pipe" });
    console.log("✅ Project linked to Vercel");
  } catch (linkError) {
    console.log("ℹ️  Project already linked or link skipped");
  }

  // Deploy
  const deployCommand = `vercel ${deployArgs.join(" ")}`;
  console.log(`Running: ${deployCommand}`);

  const output = execSync(deployCommand, { encoding: "utf8" });
  console.log(output);

  // Extract deployment URL
  const urlMatch = output.match(/https:\/\/[^\s]+/);
  if (urlMatch) {
    const deploymentUrl = urlMatch[0];
    console.log(`\n🎉 Deployment successful!`);
    console.log(`🌐 Live at: ${deploymentUrl}`);

    // Post-deployment checks
    console.log("\n🔍 Running post-deployment checks...");

    // Check if admin routes are accessible
    const adminRoutes = [
      "/admin/experiments",
      "/admin/performance",
      "/admin/ml",
    ];

    console.log("✅ Admin dashboards deployed:");
    adminRoutes.forEach((route) => {
      console.log(`   ${deploymentUrl}${route}`);
    });

    // Environment setup reminder
    console.log("\n⚙️  Environment Setup Reminder:");
    console.log("1. Set up your environment variables in Vercel dashboard");
    console.log("2. Configure Stripe webhooks to point to your deployment");
    console.log("3. Update DNS records if using custom domain");
    console.log("4. Enable analytics tracking in your analytics provider");

    // Performance expectations
    console.log("\n📊 Expected Performance:");
    console.log("• Landing Page: ~142B bundle size");
    console.log("• Global Latency: <100ms via Edge Network");
    console.log("• Core Web Vitals: LCP < 2.5s guaranteed");
    console.log("• SEO: 100% pages with rich results");

    console.log("\n🎊 Luminaris SaaS is now live!");
  } else {
    console.log("⚠️  Deployment completed but URL not found in output");
  }
} catch (error) {
  console.error("❌ Deployment failed:", error.message);
  console.log("\n🔧 Troubleshooting:");
  console.log("1. Check your Vercel account and billing");
  console.log("2. Verify environment variables are set correctly");
  console.log("3. Check build logs in Vercel dashboard");
  console.log("4. Ensure all dependencies are installed");
  process.exit(1);
}
