"use client";

import React, { useState, useRef, useEffect } from "react";
import Image, { ImageProps } from "next/image";
import { cn } from "@/lib/utils";

// Preload critical images for better LCP
function preloadCriticalImages() {
  if (typeof window === 'undefined') return;

  const criticalImages = [
    '/images/logo.svg',
    '/images/hero-bg.webp',
  ];

  criticalImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    link.fetchPriority = 'high';
    document.head.appendChild(link);
  });
}

// Call preload on mount for critical images
if (typeof window !== 'undefined') {
  preloadCriticalImages();
}

interface OptimizedImageProps extends Omit<ImageProps, 'src' | 'onError'> {
  src: string;
  alt: string;
  priority?: boolean;
  preloadDistance?: number; // Distance in pixels to start preloading
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  className?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

/**
 * OptimizedImage - Lazy loading de imagens otimizado para Core Web Vitals
 * - Lazy loading inteligente baseado em viewport
 * - Preload automático para imagens próximas
 * - Suporte a formatos modernos (WebP/AVIF)
 * - Placeholder inteligente
 * - Monitoramento de performance
 */
export function OptimizedImage({
  src,
  alt,
  priority = false,
  preloadDistance = 200,
  quality = 75,
  placeholder = 'blur',
  blurDataURL,
  className,
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [shouldPreload, setShouldPreload] = useState(priority);
  const imageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          // Start preloading nearby images
          setShouldPreload(true);
          observer.disconnect();

          // Preload next images in sequence for better UX
          setTimeout(() => {
            const nextImages = imageRef.current?.parentElement?.querySelectorAll('img[data-preload]');
            nextImages?.forEach((img, index) => {
              if (index < 3) { // Preload next 3 images
                const src = img.getAttribute('data-src');
                if (src) {
                  const preloadLink = document.createElement('link');
                  preloadLink.rel = 'preload';
                  preloadLink.as = 'image';
                  preloadLink.href = src;
                  document.head.appendChild(preloadLink);
                }
              }
            });
          }, 100);
        }
      },
      {
        rootMargin: `${preloadDistance}px`,
        threshold: 0.1,
        // Improve performance with passive listening
      }
    );

    const currentRef = imageRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [priority, isInView, preloadDistance]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = (error: ErrorEvent) => {
    setHasError(true);
    onError?.(error);
  };

  // Generate responsive image sources
  const generateSources = () => {
    const baseSrc = src.replace(/\.(jpg|jpeg|png|gif)$/i, '');
    return [
      { media: '(max-width: 640px)', srcSet: `${baseSrc}-640.webp 640w` },
      { media: '(max-width: 768px)', srcSet: `${baseSrc}-768.webp 768w` },
      { media: '(max-width: 1024px)', srcSet: `${baseSrc}-1024.webp 1024w` },
      { srcSet: `${baseSrc}-1280.webp 1280w` },
    ];
  };

  if (hasError) {
    return (
      <div
        ref={imageRef}
        className={cn(
          "bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center",
          className
        )}
        style={{ aspectRatio: props.width && props.height ? `${props.width}/${props.height}` : undefined }}
      >
        <div className="text-center text-neutral-500">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">Imagem não disponível</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={imageRef} className={cn("relative overflow-hidden", className)}>
      {/* Responsive picture element for modern formats */}
      {isInView && (
        <picture>
          {generateSources().map((source, index) => (
            <source key={index} media={source.media} srcSet={source.srcSet} />
          ))}
          <Image
            {...props}
            src={src}
            alt={alt}
            quality={quality}
            priority={priority}
            placeholder={placeholder}
            blurDataURL={blurDataURL}
            onLoad={handleLoad}
            onError={handleError}
            className={cn(
              "transition-opacity duration-300",
              isLoaded ? "opacity-100" : "opacity-0"
            )}
          />
        </picture>
      )}

      {/* Loading skeleton */}
      {!isLoaded && !hasError && (
        <div
          className="absolute inset-0 bg-neutral-200 dark:bg-neutral-700 animate-pulse"
          style={{ aspectRatio: props.width && props.height ? `${props.width}/${props.height}` : undefined }}
        >
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * HeroImage - Otimizada especificamente para imagens de hero (LCP crítico)
 */
export function HeroImage(props: OptimizedImageProps) {
  return (
    <OptimizedImage
      {...props}
      priority={true}
      quality={90}
      preloadDistance={0}
      sizes="100vw"
    />
  );
}

/**
 * ContentImage - Para imagens de conteúdo não críticas
 */
export function ContentImage(props: OptimizedImageProps) {
  return (
    <OptimizedImage
      {...props}
      priority={false}
      quality={80}
      preloadDistance={300}
      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
    />
  );
}
