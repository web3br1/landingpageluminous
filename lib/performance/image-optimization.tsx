import React, { useState, useRef, useEffect } from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";

// Image optimization component with advanced loading strategies
interface OptimizedImageProps
  extends Omit<ImageProps, "src" | "placeholder" | "priority"> {
  src: string;
  priority?: "critical" | "high" | "medium" | "low";
  loadingStrategy?: "eager" | "lazy" | "viewport" | "intersection";
  quality?: number;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: () => void;
  className?: string;
}

export function OptimizedImage({
  src,
  priority = "medium",
  loadingStrategy = "viewport",
  quality = 85,
  placeholder = "blur",
  blurDataURL,
  onLoad,
  onError,
  className,
  alt,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(loadingStrategy === "eager");
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for viewport-based loading
  useEffect(() => {
    if (loadingStrategy !== "viewport" && loadingStrategy !== "intersection")
      return;

    const element = imgRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin:
          priority === "critical"
            ? "50px"
            : priority === "high"
              ? "100px"
              : "200px",
        threshold: priority === "critical" ? 0.1 : 0.01,
      },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [loadingStrategy, priority]);

  // Generate blur placeholder if not provided
  const getBlurDataURL = () => {
    if (blurDataURL) return blurDataURL;
    if (placeholder === "blur") {
      // Generate a simple blur placeholder
      return `data:image/svg+xml;base64,${btoa(`
        <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#f3f4f6"/>
          <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-size="12">Loading...</text>
        </svg>
      `)}`;
    }
    return undefined;
  };

  // Determine loading strategy
  const getLoading = () => {
    if (priority === "critical") return "eager";
    if (loadingStrategy === "eager") return "eager";
    return "lazy";
  };

  // Handle successful load
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  // Handle error
  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  // Don't render if not in view (for viewport/intersection strategies)
  if (
    !isInView &&
    (loadingStrategy === "viewport" || loadingStrategy === "intersection")
  ) {
    return (
      <div
        ref={imgRef}
        className={cn("bg-muted animate-pulse", className)}
        style={{
          aspectRatio:
            props.width && props.height
              ? `${props.width}/${props.height}`
              : undefined,
        }}
        aria-label={`Loading ${alt}`}
      />
    );
  }

  // Error state
  if (hasError) {
    return (
      <div
        className={cn(
          "bg-muted flex items-center justify-center text-muted-foreground text-sm",
          className,
        )}
        style={{
          aspectRatio:
            props.width && props.height
              ? `${props.width}/${props.height}`
              : undefined,
        }}
      >
        Failed to load image
      </div>
    );
  }

  return (
    <div ref={imgRef} className={cn("relative overflow-hidden", className)}>
      <Image
        src={src}
        alt={alt}
        quality={quality}
        loading={getLoading()}
        placeholder={placeholder === "blur" ? "blur" : "empty"}
        blurDataURL={getBlurDataURL()}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          "transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0",
        )}
        {...props}
      />

      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

// Critical images preloader
export function CriticalImagesPreloader({ images }: { images: string[] }) {
  useEffect(() => {
    if (typeof window === "undefined" || !window.Image) return;

    // Preload critical images
    images.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, [images]);

  return null;
}

// Image optimization utilities
export const imageOptimization = {
  // Generate responsive image sizes
  getResponsiveSizes: (
    priority: OptimizedImageProps["priority"] = "medium",
  ) => {
    const sizes = {
      critical: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
      high: "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
      medium:
        "(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw",
      low: "(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw",
    };
    return sizes[priority];
  },

  // Get optimal quality based on priority
  getOptimalQuality: (priority: OptimizedImageProps["priority"] = "medium") => {
    const qualities = {
      critical: 95,
      high: 90,
      medium: 85,
      low: 80,
    };
    return qualities[priority];
  },

  // Generate WebP/AVIF fallbacks
  getOptimizedFormats: (src: string) => {
    const formats = ["webp", "avif"];
    return formats.map((format) => ({
      src: src.replace(/\.(jpg|jpeg|png)$/i, `.${format}`),
      type: `image/${format}`,
    }));
  },
};

// Hook for lazy loading images
export function useLazyImage(
  src: string,
  priority: OptimizedImageProps["priority"] = "medium",
) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.Image) return;

    const img = new window.Image();

    img.onload = () => setIsLoaded(true);
    img.onerror = () => setError("Failed to load image");
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { isLoaded, error, imgRef };
}

// Image cache management
export class ImageCache {
  private static cache = new Map<string, boolean>();

  static isCached(src: string): boolean {
    return this.cache.has(src);
  }

  static markCached(src: string): void {
    this.cache.set(src, true);
  }

  static preload(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined" || !window.Image) {
        resolve();
        return;
      }

      if (this.isCached(src)) {
        resolve();
        return;
      }

      const img = new window.Image();
      img.onload = () => {
        this.markCached(src);
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  static preloadBatch(sources: string[]): Promise<void[]> {
    return Promise.all(sources.map((src) => this.preload(src)));
  }
}

// Critical images for above-the-fold content
export const criticalImages = [
  "/images/hero-bg.webp",
  "/images/hero-mockup.png",
  "/images/logo.svg",
];

// Preload critical images on module load
if (typeof window !== "undefined") {
  ImageCache.preloadBatch(criticalImages).catch(console.warn);
}
