// Design System Variants - Button Component
// Centralized button variants using design system tokens

import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  [
    // Base styles
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap font-medium",
    "transition-colors duration-150 ease-out", // Using animation tokens

    // Focus & accessibility
    "focus-visible:outline-none focus-visible:ring-2",
    "focus-visible:ring-offset-2 focus-visible:ring-ring",
    "disabled:pointer-events-none disabled:opacity-50",

    // Interactive elements
    "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        // Primary - Main CTA buttons
        primary: [
          "bg-primary text-primary-foreground",
          "shadow-soft-sm", // Using shadow tokens
          "hover:bg-primary/90 hover:shadow-soft-md",
          "active:bg-primary/80",
        ],

        // Secondary - Alternative actions
        secondary: [
          "bg-secondary text-secondary-foreground",
          "shadow-soft-sm",
          "hover:bg-secondary/80 hover:shadow-soft-md",
          "active:bg-secondary/70",
        ],

        // Accent - Special/promotional actions
        accent: [
          "bg-accent text-accent-foreground",
          "shadow-soft-sm",
          "hover:bg-accent/90 hover:shadow-soft-md",
          "active:bg-accent/80",
        ],

        // Outline - Less prominent actions
        outline: [
          "border border-input bg-background",
          "shadow-soft-sm",
          "hover:bg-accent hover:text-accent-foreground hover:shadow-soft-md",
          "active:bg-accent/80",
        ],

        // Ghost - Minimal actions
        ghost: [
          "hover:bg-accent hover:text-accent-foreground",
          "active:bg-accent/80",
        ],

        // Destructive - Dangerous actions
        destructive: [
          "bg-destructive text-destructive-foreground",
          "shadow-soft-sm",
          "hover:bg-destructive/90 hover:shadow-soft-md",
          "active:bg-destructive/80",
        ],

        // Success - Positive actions
        success: [
          "bg-success-default text-success-foreground",
          "shadow-soft-sm",
          "hover:bg-success-default/90 hover:shadow-soft-md",
          "active:bg-success-default/80",
        ],

        // Link - Text-only actions
        link: [
          "text-primary underline-offset-4",
          "hover:underline hover:text-primary/80",
          "active:text-primary/70",
        ],
      },

      size: {
        // Extra small - Icon buttons, compact UIs
        xs: [
          "h-6 px-2 text-xs rounded-md", // 24px height
          "[&_svg]:size-3", // Smaller icons
        ],

        // Small - Secondary actions
        sm: [
          "h-8 px-3 text-sm rounded-md", // 32px height
        ],

        // Default - Standard buttons
        default: [
          "h-10 px-4 py-2", // 40px height
        ],

        // Large - Primary actions, CTAs
        lg: [
          "h-12 px-6 text-base rounded-lg", // 48px height
          "[&_svg]:size-5", // Larger icons
        ],

        // Extra large - Hero CTAs
        xl: [
          "h-14 px-8 text-lg rounded-xl", // 56px height
          "[&_svg]:size-6", // Extra large icons
        ],

        // Icon only - Square buttons
        icon: [
          "h-10 w-10", // 40px square
        ],

        "icon-sm": [
          "h-8 w-8", // 32px square
        ],

        "icon-lg": [
          "h-12 w-12", // 48px square
        ],
      },

      // Special states
      loading: {
        true: "cursor-not-allowed opacity-70",
      },

      fullWidth: {
        true: "w-full",
      },
    },

    defaultVariants: {
      variant: "primary",
      size: "default",
      loading: false,
      fullWidth: false,
    },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
