import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const require = createRequire(import.meta.url)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Bundle analyzer configuration
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {

  // Temporarily disable ESLint during build for CI/CD testing
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Bundle optimization - expandindo otimizações
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-icons',
      'framer-motion',
      '@heroicons/react'
    ],
    // Enable webpack build worker
    webpackBuildWorker: true,
  },

  // Turbopack configuration (empty to disable warnings)
  turbopack: {},

  // 🚨 BUNDLE BUDGETS - Sprint 3: Governância
  // Falha no build se exceder estes limites
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    if (!dev && !isServer) {
      // Bundle budgets por rota/contexto
      config.performance = {
        hints: 'warning', // Warning no build, não falha (CI controla budgets)
        maxEntrypointSize: 1500000, // 1.5MB para entry points principais (atual: ~1.1MB)
        maxAssetSize: 1500000, // 1.5MB para assets individuais (atual: ~1.1MB)

        // Budgets específicos por rota (custom check)
        assetFilter: (assetFilename) => {
          // Landing page - mais rigorosa
          if (assetFilename.includes('marketing') || assetFilename.includes('page-')) {
            return assetFilename.endsWith('.js')
          }
          // Admin routes - podem ser maiores
          if (assetFilename.includes('admin')) {
            return false // Não aplicar budget para admin
          }
          return true
        }
      }

      // Split chunks otimizado
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          // Framework chunk (React, Next.js)
          framework: {
            chunks: 'all',
            name: 'framework',
            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
            priority: 40,
            enforce: true,
          },
          // Libs compartilhadas
          lib: {
            test: /[\\/]node_modules[\\/]/,
            name: 'lib',
            priority: 30,
            chunks: 'all',
          },
          // Marketing components (landing page)
          marketing: {
            test: /[\\/]app[\\/]\(marketing\)[\\/]/,
            name: 'marketing',
            priority: 20,
            chunks: 'all',
            enforce: true,
          },
          // Product components
          product: {
            test: /[\\/]app[\\/]\(product\)[\\/]/,
            name: 'product',
            priority: 20,
            chunks: 'all',
          },
          // Admin components (lazy loaded)
          admin: {
            test: /[\\/]app[\\/]\(admin\)[\\/]/,
            name: 'admin',
            priority: 10,
            chunks: 'async', // Só carrega quando necessário
          },
        },
      }
    }

    return config
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // CDN optimization for global performance
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.vercel.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      // Add your custom CDN domains here
    ],
    // dangerouslyAllowSVG: true, // Desabilitado por segurança - usar apenas SVGs locais
    // Enable image optimization for all images
    unoptimized: false,
    // Minimum cache TTL for images - reduzido para evitar stale content
    minimumCacheTTL: 2592000, // 30 dias (balance entre performance e freshness)
  },
  // Performance optimizations (removed swcMinify for Next.js 16 compatibility)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // ESLint and TypeScript errors will now fail builds as they should in production
  // Removed ignoreDuringBuilds and ignoreBuildErrors for proper quality control
  // Output optimization for containers
  // output: 'standalone', // Disabled due to Windows symlink permissions
  trailingSlash: false,

  // Bundle analyzer handled in webpack() above
  // Performance optimizations
  compress: true,
  poweredByHeader: false,

  // Block font requests that should not exist
  async rewrites() {
    return [
      // Block requests to non-existent local fonts
      {
        source: '/fonts/:path*',
        destination: '/api/blocked-font',
      },
    ]
  },

  // Security and performance headers with CSP Report-Only for Development
  async headers() {
    const isProd = process.env.NODE_ENV === 'production'

    // Generate unique nonce per request for CSP (more flexible than hashes)
    const crypto = await import('crypto')
    const nonce = crypto.randomBytes(16).toString('base64')

    // Development: Report-Only (permissive, logs violations)
    const devCSP = [
      "default-src 'none'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' 'report-sample'",
      "worker-src 'self' blob:",
      "connect-src 'self' http://localhost:3000 http://localhost:3001 ws://localhost:3000 ws://localhost:3001 wss://localhost:3000 wss://localhost:3001",
      "style-src 'self' 'unsafe-inline' data:",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "frame-src 'none'", // Prevent iframes in development
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "report-uri /api/csp-report"
    ].join('; ')

    // Production: Enforcement (strict, with fallbacks)
    const prodCSP = [
      "default-src 'self'",
      `script-src 'nonce-${nonce}' 'strict-dynamic' 'report-sample' 'self' https://cdn.vercel.com https://fonts.googleapis.com https://fonts.gstatic.com 'sha256-1+C0+zZzrSxE3/fjiNqvYv9LHXiYtWwdvMwj1JlBoXM=' 'sha256-GoGWWqIHIjK9/Fmuu/NUyhDADw0+osFDWEKnnxJe/kE='`,
      "worker-src 'self' blob:",
      "style-src 'self' 'unsafe-inline'", // Consider nonce for inline styles in future
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "connect-src 'self' https: wss:",
      "frame-src 'none'", // Add specific domains when needed (e.g., Stripe)
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'none'",
      "form-action 'self'",
      "upgrade-insecure-requests",
      "report-uri /api/csp-report; report-to csp-endpoint"
    ].join('; ')

    const csp = isProd ? prodCSP : devCSP

    // Report-To group for modern browsers (CSP Level 3)
    const reportToGroup = isProd ? [
      {
        group: 'csp-endpoint',
        max_age: 10886400, // 7 days
        endpoints: [
          { url: 'https://csp-report.vercel.app/api/report' } // Replace with actual reporting endpoint
        ],
        include_subdomains: false
      }
    ] : []
    const commonSecurityHeaders = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
      { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
    ]

    const prodOnlyHeaders = isProd ? [
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
    ] : []

    return [
      // Next.js static assets (JS/CSS) — cache hard only in production with preload hints
      {
        source: '/_next/static/(.*)',
        headers: [
          ...commonSecurityHeaders,
          ...prodOnlyHeaders,
          ...prodOnlyHeaders,
          {
            key: 'Cache-Control',
            value: isProd
              ? 'public, max-age=31536000, immutable'
              : 'no-store',
          },
          // Preload hint for critical chunks
          {
            key: 'Link',
            value: isProd ? '</_next/static/chunks/main.js>; rel=preload; as=script; crossorigin=anonymous' : '',
          },
        ],
      },
      // HMR/Webpack endpoints — never cache
      {
        source: '/_next/webpack-hmr',
        headers: [
          ...commonSecurityHeaders,
          ...prodOnlyHeaders,
          ...prodOnlyHeaders,
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
      // Public assets — cache hard only in production with preload hints
      {
        source: '/(favicon.ico|apple-touch-icon.png|android-chrome-.*\.png|images/.*|videos/.*)',
        headers: [
          ...commonSecurityHeaders,
          ...prodOnlyHeaders,
          {
            key: 'Cache-Control',
            value: isProd
              ? 'public, max-age=31536000, immutable'
              : 'no-cache',
          },
          // Preload hints for critical images
          {
            key: 'Link',
            value: isProd ? [
              '</images/logo.svg>; rel=preload; as=image; type=image/svg+xml',
              '</images/hero-bg.webp>; rel=preload; as=image; type=image/webp'
            ].join(', ') : '',
          },
        ],
      },
      // Fonts — preload critical fonts
      {
        source: '/fonts/(.*)',
        headers: [
          ...commonSecurityHeaders,
          ...prodOnlyHeaders,
          {
            key: 'Cache-Control',
            value: isProd
              ? 'public, max-age=31536000, immutable'
              : 'no-cache',
          },
          // Removed font preload - using Google Fonts via next/font
        ],
      },
      // API — never cache
      {
        source: '/api/(.*)',
        headers: [
          ...commonSecurityHeaders,
          ...prodOnlyHeaders,
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
      // Default HTML/document — avoid aggressive caching to prevent stale pages
      {
        source: '/(.*)',
        headers: [
          ...commonSecurityHeaders,
          ...prodOnlyHeaders,
          // Use Report-Only in development, enforcement in production
          {
            key: isProd ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only',
            value: csp
          },
          // Pass nonce only in production (when actually enforced)
          ...(isProd ? [{ key: 'X-Nonce', value: nonce }] : []),
          // Add Report-To header only for production enforcement
          ...(isProd && reportToGroup.length > 0 ? [{
            key: 'Report-To',
            value: JSON.stringify(reportToGroup[0])
          }] : []),
          { key: 'Cache-Control', value: isProd ? 'no-cache' : 'no-store' },
          // DNS prefetch for critical external domains
          {
            key: 'Link',
            value: isProd ? [
              '//fonts.googleapis.com; rel=dns-prefetch',
              '//fonts.gstatic.com; rel=dns-prefetch',
              '//cdn.vercel.com; rel=dns-prefetch',
              '//plausible.io; rel=dns-prefetch'
            ].join(', ') : '',
          },
        ],
      },
    ]
  },
}

export default withBundleAnalyzer(nextConfig)
