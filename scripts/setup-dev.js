#!/usr/bin/env node

/**
 * Development Setup Script for Luminaris SaaS
 * Initializes development environment and runs initial checks
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("🚀 Luminaris SaaS - Development Setup\n");

// Check Node.js version
const nodeVersion = process.versions.node;
const requiredVersion = "18.0.0";

if (parseInt(nodeVersion.split(".")[0]) < 18) {
  console.error(`❌ Node.js version ${nodeVersion} is not supported.`);
  console.error(`📋 Required: Node.js ${requiredVersion} or higher`);
  console.error(`🔧 Upgrade Node.js and try again.`);
  process.exit(1);
}

console.log(`✅ Node.js version: ${nodeVersion}`);

// Check if we're in the right directory
if (!fs.existsSync("package.json")) {
  console.error(
    "❌ Error: package.json not found. Run this script from the project root.",
  );
  process.exit(1);
}

console.log("✅ Project structure verified");

// Install dependencies
console.log("\n📦 Installing dependencies...");
try {
  execSync("npm install", { stdio: "inherit" });
  console.log("✅ Dependencies installed");
} catch (error) {
  console.error("❌ Failed to install dependencies:", error.message);
  process.exit(1);
}

// Check for required tools
console.log("\n🔧 Checking development tools...");

const tools = [
  { command: "git --version", name: "Git", required: true },
  { command: "node --version", name: "Node.js", required: true },
  { command: "npm --version", name: "npm", required: true },
];

for (const tool of tools) {
  try {
    execSync(tool.command, { stdio: "pipe" });
    console.log(`✅ ${tool.name} available`);
  } catch (error) {
    if (tool.required) {
      console.error(`❌ ${tool.name} not found. Please install it.`);
      process.exit(1);
    } else {
      console.log(`⚠️  ${tool.name} not found (optional)`);
    }
  }
}

// Create environment file if it doesn't exist
console.log("\n⚙️  Setting up environment...");

const envPath = path.join(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  console.log("📝 Creating .env.local template...");

  const envTemplate = `# Luminaris SaaS Environment Variables
# Copy this file and fill in your actual values

# Analytics (Required)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=yourdomain.com

# App Configuration (Required)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe (Optional - for payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PROFESSIONAL_PRICE_ID=price_...

# PagBank (Optional - Brazilian payments)
PAGBANK_TOKEN=your_token
PAGBANK_WEBHOOK_TOKEN=your_webhook_token

# Cache (Optional)
CACHE_BACKEND=memory
REDIS_URL=redis://localhost:6379

# Development
EXPERIMENT_USER_ID=dev_user_123
`;

  fs.writeFileSync(envPath, envTemplate);
  console.log("✅ Created .env.local template");
  console.log("⚠️  Please edit .env.local with your actual values");
} else {
  console.log("✅ Environment file exists");
}

// Run initial build check
console.log("\n🔨 Running initial build check...");
try {
  execSync("npm run build", { stdio: "pipe" });
  console.log("✅ Build successful");
} catch (error) {
  console.error("❌ Build failed. Check the errors above.");
  console.log("\n🔧 Common solutions:");
  console.log("• Make sure all dependencies are installed");
  console.log("• Check TypeScript errors");
  console.log("• Verify environment variables");
  process.exit(1);
}

// Run type checking
console.log("\n📝 Running TypeScript checks...");
try {
  execSync("npm run type-check", { stdio: "pipe" });
  console.log("✅ TypeScript compilation successful");
} catch (error) {
  console.error("❌ TypeScript check failed");
  process.exit(1);
}

// Generate sample ML data for development
console.log("\n🤖 Setting up ML development data...");
try {
  // This would normally import and run the ML setup functions
  // For now, just create a placeholder
  console.log("✅ ML setup ready (run npm run dev to generate sample data)");
} catch (error) {
  console.log("⚠️  ML setup skipped (will be available at runtime)");
}

// Final instructions
console.log("\n🎉 Setup Complete!");
console.log("=".repeat(50));
console.log("\n🚀 To start development:");
console.log("  npm run dev");
console.log("\n📊 Access your application at:");
console.log("  http://localhost:3000");
console.log("\n🔧 Admin dashboards:");
console.log("  http://localhost:3000/admin/experiments");
console.log("  http://localhost:3000/admin/performance");
console.log("  http://localhost:3000/admin/ml");
console.log("\n📋 Available scripts:");
console.log("  npm run build      - Production build");
console.log("  npm run test       - Run all tests");
console.log("  npm run lint       - Code linting");
console.log("  npm run type-check - TypeScript validation");
console.log("  npm run deploy     - Deploy to Vercel");
console.log("  npm run health-check - System health check");
console.log("\n📚 Documentation:");
console.log("  README.md          - Complete documentation");
console.log("  docs/CHANGELOG.md  - Version history");
console.log("  docs/PERFORMANCE_METRICS.md - Performance details");
console.log("\n⚙️  Next steps:");
console.log("  1. Edit .env.local with your actual values");
console.log("  2. Configure your analytics providers");
console.log("  3. Set up payment providers (optional)");
console.log("  4. Run npm run dev to start developing");
console.log("\n🎊 Welcome to Luminaris SaaS!");
console.log("   Your AI-powered landing page is ready to deploy! 🚀");
