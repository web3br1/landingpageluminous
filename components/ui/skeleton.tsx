"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

export { Skeleton };

// Specialized skeleton components for different content types
export function HeroSkeleton() {
  return (
    <div className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background skeleton */}
      <Skeleton className="absolute inset-0 bg-muted/20" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center relative z-10 max-w-7xl mx-auto px-4 md:px-6">
        {/* Content skeleton */}
        <div className="space-y-8">
          <Skeleton className="h-6 w-48 rounded-md" /> {/* Badge */}
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" /> {/* Headline */}
            <Skeleton className="h-6 w-3/4" /> {/* Subheadline */}
          </div>
          <div className="flex flex-wrap gap-6">
            {/* Metrics */}
            <div className="text-center space-y-1">
              <Skeleton className="h-8 w-16 mx-auto" />
              <Skeleton className="h-4 w-20 mx-auto" />
            </div>
            <div className="text-center space-y-1">
              <Skeleton className="h-8 w-12 mx-auto" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </div>
            <div className="text-center space-y-1">
              <Skeleton className="h-8 w-14 mx-auto" />
              <Skeleton className="h-4 w-16 mx-auto" />
            </div>
          </div>
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Skeleton className="h-12 w-48" />
            <Skeleton className="h-12 w-40" />
          </div>
        </div>

        {/* Visual skeleton */}
        <div className="relative">
          <Skeleton className="aspect-[4/3] w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function FeaturesSkeleton() {
  return (
    <div className="py-20 md:py-28">
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <Skeleton className="h-12 w-96 mx-auto" />
          <Skeleton className="h-6 w-2/3 mx-auto" />
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="group relative p-6 rounded-2xl border border-border/50 space-y-4"
            >
              <Skeleton className="h-12 w-12 rounded-lg" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PricingSkeleton() {
  return (
    <div className="py-20 md:py-28">
      <div className="container mx-auto max-w-6xl px-4 md:px-6">
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <Skeleton className="h-12 w-80 mx-auto" />
          <Skeleton className="h-6 w-2/3 mx-auto" />
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className={`relative p-8 rounded-2xl border ${i === 1 ? "border-primary" : "border-border/50"} space-y-6`}
            >
              {i === 1 && (
                <Skeleton className="absolute -top-3 left-1/2 transform -translate-x-1/2 h-6 w-24 rounded-full" />
              )}
              <div className="text-center space-y-2">
                <Skeleton className="h-8 w-24 mx-auto" />
                <Skeleton className="h-16 w-20 mx-auto" />
                <Skeleton className="h-4 w-32 mx-auto" />
              </div>

              {/* Features */}
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="flex items-center space-x-3">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 flex-1" />
                  </div>
                ))}
              </div>

              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
