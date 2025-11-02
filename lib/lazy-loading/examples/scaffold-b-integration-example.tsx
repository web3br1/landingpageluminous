"use client";

import { ProgressiveLoader, createLoaderConfig } from "../core/progressive-loader";

/**
 * Scaffold B Integration Example - Phase 1
 * Complete example showing how progressive loading integrates with Scaffold B
 */

// Example section components
const HeroSection = () => (
  <section className="hero-section py-20 bg-gradient-to-br from-blue-600 to-purple-700 text-white">
    <div className="container mx-auto px-4 text-center">
      <h1 className="text-5xl font-bold mb-6">Build Amazing Products</h1>
      <p className="text-xl mb-8 opacity-90">The fastest way to ship software that matters</p>
      <button className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
        Get Started
      </button>
    </div>
  </section>
);

const PricingSection = () => (
  <section className="pricing-section py-20 bg-gray-50">
    <div className="container mx-auto px-4">
      <h2 className="text-3xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <div className="bg-white p-8 rounded-xl shadow-sm border">
          <h3 className="text-xl font-semibold mb-4">Starter</h3>
          <div className="text-3xl font-bold mb-4">$29<span className="text-lg font-normal">/month</span></div>
          <ul className="space-y-2 text-gray-600">
            <li>✓ Up to 1,000 users</li>
            <li>✓ Basic analytics</li>
            <li>✓ Email support</li>
          </ul>
        </div>
        <div className="bg-blue-600 text-white p-8 rounded-xl shadow-lg relative">
          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
            Most Popular
          </div>
          <h3 className="text-xl font-semibold mb-4">Professional</h3>
          <div className="text-3xl font-bold mb-4">$99<span className="text-lg font-normal">/month</span></div>
          <ul className="space-y-2">
            <li>✓ Up to 10,000 users</li>
            <li>✓ Advanced analytics</li>
            <li>✓ Priority support</li>
          </ul>
        </div>
        <div className="bg-white p-8 rounded-xl shadow-sm border">
          <h3 className="text-xl font-semibold mb-4">Enterprise</h3>
          <div className="text-3xl font-bold mb-4">Custom</div>
          <ul className="space-y-2 text-gray-600">
            <li>✓ Unlimited users</li>
            <li>✓ Custom integrations</li>
            <li>✓ Dedicated support</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
);

const FeaturesSection = () => (
  <section className="features-section py-20 bg-white">
    <div className="container mx-auto px-4">
      <h2 className="text-3xl font-bold text-center mb-12">Everything You Need</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          { icon: "🚀", title: "Fast Setup", desc: "Get started in minutes, not hours" },
          { icon: "📊", title: "Real-time Analytics", desc: "Track performance as it happens" },
          { icon: "🔒", title: "Enterprise Security", desc: "Bank-level security you can trust" },
          { icon: "🎯", title: "Smart Automation", desc: "Automate repetitive tasks" },
          { icon: "📱", title: "Mobile First", desc: "Optimized for all devices" },
          { icon: "💬", title: "24/7 Support", desc: "Help when you need it most" }
        ].map((feature, index) => (
          <div key={index} className="text-center p-6">
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-600">{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// Skeleton components
const HeroSkeleton = () => (
  <section className="hero-section py-20 bg-gradient-to-br from-gray-300 to-gray-400 animate-pulse">
    <div className="container mx-auto px-4 text-center">
      <div className="h-12 bg-gray-400 rounded w-3/4 mx-auto mb-6"></div>
      <div className="h-6 bg-gray-400 rounded w-1/2 mx-auto mb-8"></div>
      <div className="h-12 bg-gray-400 rounded w-48 mx-auto"></div>
    </div>
  </section>
);

const PricingSkeleton = () => (
  <section className="pricing-section py-20 bg-gray-50">
    <div className="container mx-auto px-4">
      <div className="h-10 bg-gray-300 rounded w-96 mx-auto mb-12"></div>
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-8 rounded-xl shadow-sm border animate-pulse">
            <div className="h-6 bg-gray-300 rounded mb-4"></div>
            <div className="h-8 bg-gray-300 rounded mb-6"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded"></div>
              <div className="h-4 bg-gray-300 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const FeaturesSkeleton = () => (
  <section className="features-section py-20 bg-white">
    <div className="container mx-auto px-4">
      <div className="h-10 bg-gray-300 rounded w-80 mx-auto mb-12 animate-pulse"></div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="text-center p-6 animate-pulse">
            <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-4"></div>
            <div className="h-6 bg-gray-300 rounded w-32 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-48 mx-auto"></div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// Placeholder components (quick preview)
const HeroPlaceholder = () => (
  <section className="hero-section py-20 bg-gradient-to-br from-blue-100 to-purple-100 text-gray-600">
    <div className="container mx-auto px-4 text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome</h1>
      <p className="text-lg mb-6">Loading your experience...</p>
      <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
    </div>
  </section>
);

const PricingPlaceholder = () => (
  <section className="pricing-section py-20 bg-gray-50">
    <div className="container mx-auto px-4">
      <h2 className="text-2xl font-bold text-center mb-8 text-gray-500">Pricing Options</h2>
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-400 mb-2">Loading plans...</h3>
          <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="bg-blue-50 p-6 rounded-xl shadow-sm border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-600 mb-2">Most Popular</h3>
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-400 mb-2">Enterprise</h3>
          <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    </div>
  </section>
);

/**
 * Scaffold B Integration Example
 * Shows how to use progressive loading with Scaffold B metadata
 */
export function ScaffoldBIntegrationExample() {
  // Simulate Scaffold B metadata from composers
  const heroMetadata = {
    sectionId: "hero",
    loadPriority: "hero" as const,
    strategy: "eager" as const,
    requiresAnalyticsConsent: false,
  };

  const pricingMetadata = {
    sectionId: "pricing",
    loadPriority: "early" as const,
    strategy: "progressive" as const,
    requiresAnalyticsConsent: true,
  };

  const featuresMetadata = {
    sectionId: "features",
    loadPriority: "early" as const,
    strategy: "deferred" as const,
    requiresAnalyticsConsent: false,
  };

  // Simulate context (in real Scaffold B, this comes from ContextCollector)
  const context = {
    effectiveType: "4g" as const,
    hardwareConcurrency: 4,
    cookieConsent: {
      analytics: true,
      necessary: true,
    },
  };

  // Create loader configs using the utility function
  const heroConfig = createLoaderConfig("hero", () => import("./mock-hero"), {
    skeleton: HeroSkeleton,
    placeholder: HeroPlaceholder,
  }, heroMetadata, context);

  const pricingConfig = createLoaderConfig("pricing", () => import("./mock-pricing"), {
    skeleton: PricingSkeleton,
    placeholder: PricingPlaceholder,
  }, pricingMetadata, context);

  const featuresConfig = createLoaderConfig("features", () => import("./mock-features"), {
    skeleton: FeaturesSkeleton,
  }, featuresMetadata, context);

  return (
    <div className="scaffold-b-integration-example">
      {/* Hero Section - Critical, loads immediately */}
      <ProgressiveLoader {...heroConfig} />

      {/* Pricing Section - Important, loads progressively */}
      <ProgressiveLoader {...pricingConfig} />

      {/* Features Section - Nice to have, loads on viewport */}
      <ProgressiveLoader {...featuresConfig} />
    </div>
  );
}

/**
 * Alternative: Direct integration with Scaffold B PageRenderer
 * This shows how the PageRenderer would use the progressive loader
 */
export function ScaffoldBPageRendererExample() {
  // This simulates what the Scaffold B PageRenderer would do
  const sections = [
    {
      id: "hero",
      component: HeroSection,
      metadata: {
        loadPriority: "hero" as const,
        strategy: "eager" as const,
        requiresAnalyticsConsent: false,
        stages: {
          skeleton: HeroSkeleton,
          placeholder: HeroPlaceholder,
        },
      },
    },
    {
      id: "pricing",
      component: PricingSection,
      metadata: {
        loadPriority: "early" as const,
        strategy: "progressive" as const,
        requiresAnalyticsConsent: true,
        stages: {
          skeleton: PricingSkeleton,
          placeholder: PricingPlaceholder,
        },
      },
    },
    {
      id: "features",
      component: FeaturesSection,
      metadata: {
        loadPriority: "early" as const,
        strategy: "deferred" as const,
        requiresAnalyticsConsent: false,
        stages: {
          skeleton: FeaturesSkeleton,
        },
      },
    },
  ];

  const context = {
    effectiveType: "4g" as const,
    hardwareConcurrency: 4,
    cookieConsent: {
      analytics: true,
      necessary: true,
    },
  };

  return (
    <div className="scaffold-b-page-renderer">
      {sections.map((section) => {
        const config = createLoaderConfig(
          section.id,
          () => Promise.resolve({ default: section.component }),
          section.metadata.stages,
          section.metadata,
          context
        );

        return (
          <ProgressiveLoader
            key={section.id}
            {...config}
            onStageComplete={(stage) => {
              console.log(`Section ${section.id} reached stage: ${stage}`);
            }}
            onError={(error) => {
              console.error(`Section ${section.id} failed:`, error);
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * Debug version showing loading states
 */
export function DebugProgressiveLoadingExample() {
  const [showDetails, setShowDetails] = useState(false);

  const context = {
    effectiveType: "4g" as const,
    hardwareConcurrency: 4,
    cookieConsent: {
      analytics: true,
      necessary: true,
    },
  };

  const heroConfig = createLoaderConfig("hero-debug", () => Promise.resolve({ default: HeroSection }), {
    skeleton: HeroSkeleton,
    placeholder: HeroPlaceholder,
  }, {
    sectionId: "hero-debug",
    loadPriority: "hero",
    strategy: "progressive",
    requiresAnalyticsConsent: false,
  }, context);

  return (
    <div className="debug-example">
      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold text-blue-900 mb-2">Progressive Loading Debug</h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-blue-600 hover:text-blue-800 underline"
        >
          {showDetails ? "Hide" : "Show"} Loading Details
        </button>

        {showDetails && (
          <div className="mt-4 space-y-2 text-sm">
            <div><strong>Context:</strong> {JSON.stringify(context, null, 2)}</div>
            <div><strong>Strategy:</strong> {heroConfig.strategy} (adapted from progressive)</div>
            <div><strong>Priority:</strong> {heroConfig.loadPriority}</div>
            <div><strong>Consent Required:</strong> No</div>
          </div>
        )}
      </div>

      <ProgressiveLoader
        {...heroConfig}
        onStageComplete={(stage) => {
          console.log(`Debug: Hero section reached stage ${stage}`);
          if (showDetails) {
            // Could update debug UI here
          }
        }}
      />
    </div>
  );
}

// Import React for useState
import { useState } from "react";
