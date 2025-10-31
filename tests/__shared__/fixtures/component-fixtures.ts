// ===== COMPONENT TEST FIXTURES =====
// Pre-built fixtures for common component testing scenarios

import { ComponentTestFixture } from "./test-types";

// ===== HERO SECTION FIXTURES =====

export const heroSectionFixtures: ComponentTestFixture[] = [
  {
    name: "hero-basic",
    description: "Basic hero section with minimal props",
    data: {
      props: {
        headline: "Transform Your Business",
        subheadline: "With our innovative solutions",
        ctaText: "Get Started",
        ctaUrl: "/signup",
      },
    },
    metadata: {
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      version: "1.0.0",
      tags: ["hero", "basic", "cta"],
      category: "marketing",
      environment: "development",
    },
  },
  {
    name: "hero-with-image",
    description: "Hero section with background image",
    data: {
      props: {
        headline: "Welcome to the Future",
        subheadline: "Experience innovation like never before",
        ctaText: "Learn More",
        ctaUrl: "/about",
        backgroundImage: "/images/hero-bg.jpg",
        variant: "image",
      },
    },
    metadata: {
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      version: "1.0.0",
      tags: ["hero", "image", "background"],
      category: "marketing",
      environment: "development",
    },
  },
  {
    name: "hero-with-video",
    description: "Hero section with background video",
    data: {
      props: {
        headline: "See It In Action",
        subheadline: "Watch our product transform workflows",
        ctaText: "Watch Demo",
        ctaUrl: "/demo",
        backgroundVideo: "/videos/hero-demo.mp4",
        variant: "video",
      },
    },
    metadata: {
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      version: "1.0.0",
      tags: ["hero", "video", "demo"],
      category: "marketing",
      environment: "development",
    },
  },
];

// ===== BENEFITS SECTION FIXTURES =====

export const benefitsSectionFixtures: ComponentTestFixture[] = [
  {
    name: "benefits-three-cards",
    description: "Benefits section with three benefit cards",
    data: {
      props: {
        title: "Why Choose Us",
        benefits: [
          {
            icon: "Zap",
            title: "Fast & Reliable",
            description: "Lightning-fast performance you can count on",
          },
          {
            icon: "Shield",
            title: "Secure & Safe",
            description: "Enterprise-grade security for peace of mind",
          },
          {
            icon: "Users",
            title: "Team Collaboration",
            description: "Work together seamlessly with your team",
          },
        ],
      },
    },
    metadata: {
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      version: "1.0.0",
      tags: ["benefits", "cards", "icons"],
      category: "marketing",
      environment: "development",
    },
  },
  {
    name: "benefits-with-metrics",
    description: "Benefits section including performance metrics",
    data: {
      props: {
        title: "Proven Results",
        benefits: [
          {
            icon: "TrendingUp",
            title: "50% Faster",
            description: "Reduce processing time by half",
            metric: "50%",
            metricLabel: "Time Saved",
          },
          {
            icon: "DollarSign",
            title: "$10K Saved",
            description: "Average cost savings per month",
            metric: "$10K",
            metricLabel: "Monthly Savings",
          },
          {
            icon: "Clock",
            title: "24/7 Support",
            description: "Round-the-clock customer assistance",
            metric: "24/7",
            metricLabel: "Availability",
          },
        ],
      },
    },
    metadata: {
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      version: "1.0.0",
      tags: ["benefits", "metrics", "performance"],
      category: "marketing",
      environment: "development",
    },
  },
];

// ===== FORM FIXTURES =====

export const formFixtures: ComponentTestFixture[] = [
  {
    name: "contact-form-valid",
    description: "Valid contact form submission",
    data: {
      props: {
        fields: [
          { name: "name", type: "text", required: true, value: "John Doe" },
          { name: "email", type: "email", required: true, value: "john@example.com" },
          { name: "message", type: "textarea", required: true, value: "Hello world!" },
        ],
        submitText: "Send Message",
      },
      state: {
        isSubmitting: false,
        errors: {},
      },
    },
    metadata: {
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      version: "1.0.0",
      tags: ["form", "contact", "valid"],
      category: "forms",
      environment: "development",
    },
  },
  {
    name: "contact-form-invalid",
    description: "Invalid contact form with validation errors",
    data: {
      props: {
        fields: [
          { name: "name", type: "text", required: true, value: "" },
          { name: "email", type: "email", required: true, value: "invalid-email" },
          { name: "message", type: "textarea", required: true, value: "" },
        ],
        submitText: "Send Message",
      },
      state: {
        isSubmitting: false,
        errors: {
          name: "Name is required",
          email: "Please enter a valid email address",
          message: "Message is required",
        },
      },
    },
    metadata: {
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      version: "1.0.0",
      tags: ["form", "contact", "invalid", "validation"],
      category: "forms",
      environment: "development",
    },
  },
];

// ===== BUTTON FIXTURES =====

export const buttonFixtures: ComponentTestFixture[] = [
  {
    name: "primary-button",
    description: "Primary CTA button",
    data: {
      props: {
        children: "Get Started",
        variant: "primary",
        size: "lg",
        disabled: false,
      },
      state: {
        isHovered: false,
        isFocused: false,
        isPressed: false,
      },
    },
    metadata: {
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      version: "1.0.0",
      tags: ["button", "primary", "cta"],
      category: "ui",
      environment: "development",
    },
  },
  {
    name: "secondary-button-disabled",
    description: "Disabled secondary button",
    data: {
      props: {
        children: "Coming Soon",
        variant: "secondary",
        size: "md",
        disabled: true,
      },
      state: {
        isHovered: false,
        isFocused: false,
        isPressed: false,
      },
    },
    metadata: {
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      version: "1.0.0",
      tags: ["button", "secondary", "disabled"],
      category: "ui",
      environment: "development",
    },
  },
];

// ===== CARD FIXTURES =====

export const cardFixtures: ComponentTestFixture[] = [
  {
    name: "feature-card",
    description: "Feature card with icon and description",
    data: {
      props: {
        title: "Lightning Fast",
        description: "Experience blazing fast performance with our optimized platform",
        icon: "Zap",
        variant: "feature",
      },
    },
    metadata: {
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      version: "1.0.0",
      tags: ["card", "feature", "icon"],
      category: "ui",
      environment: "development",
    },
  },
  {
    name: "testimonial-card",
    description: "Customer testimonial card",
    data: {
      props: {
        quote: "This product transformed our workflow completely!",
        author: "Jane Smith",
        role: "CTO",
        company: "TechCorp",
        avatar: "/images/avatar-jane.jpg",
        variant: "testimonial",
      },
    },
    metadata: {
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
      version: "1.0.0",
      tags: ["card", "testimonial", "customer"],
      category: "marketing",
      environment: "development",
    },
  },
];

// ===== UTILITY FUNCTIONS =====

export function getFixtureByName<T extends ComponentTestFixture>(
  fixtures: T[],
  name: string
): T | undefined {
  return fixtures.find(fixture => fixture.name === name);
}

export function getFixturesByTag<T extends ComponentTestFixture>(
  fixtures: T[],
  tag: string
): T[] {
  return fixtures.filter(fixture => fixture.metadata?.tags.includes(tag));
}

export function getFixturesByCategory<T extends ComponentTestFixture>(
  fixtures: T[],
  category: string
): T[] {
  return fixtures.filter(fixture => fixture.metadata?.category === category);
}

// ===== COMBINED EXPORTS =====

export const componentFixtures = {
  hero: heroSectionFixtures,
  benefits: benefitsSectionFixtures,
  forms: formFixtures,
  buttons: buttonFixtures,
  cards: cardFixtures,
} as const;

export type ComponentFixtureType = keyof typeof componentFixtures;
