/**
 * Advanced Service Worker for BLOCO 4
 * Strategic caching and performance optimization
 */

/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

interface CacheStrategy {
  name: string;
  match: (request: Request) => boolean;
  handler: (request: Request) => Promise<Response>;
}

interface PerformanceMetrics {
  lcp: number;
  cls: number;
  inp: number;
  fid: number;
  ttfb: number;
  fcp: number;
}

// Cache strategies for different resource types
const CACHE_STRATEGIES: CacheStrategy[] = [
  {
    name: 'critical-assets',
    match: (request) =>
      request.url.includes('/_next/static/') ||
      request.url.includes('/fonts/') ||
      request.url.includes('/images/logo'),
    handler: async (request) => {
      const cache = await caches.open('critical-v1');
      const cachedResponse = await cache.match(request);

      if (cachedResponse) {
        // Update cache in background
        fetch(request).then(response => {
          if (response.ok) cache.put(request, response);
        }).catch(() => {});
        return cachedResponse;
      }

      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    }
  },
  {
    name: 'static-assets',
    match: (request) =>
      request.url.includes('.css') ||
      request.url.includes('.js') ||
      request.url.includes('.woff2'),
    handler: async (request) => {
      const cache = await caches.open('static-v1');
      const cachedResponse = await cache.match(request);

      if (cachedResponse) return cachedResponse;

      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    }
  },
  {
    name: 'api-cache',
    match: (request) =>
      request.url.includes('/api/') &&
      request.method === 'GET',
    handler: async (request) => {
      const cache = await caches.open('api-v1');
      const cachedResponse = await cache.match(request);

      if (cachedResponse) {
        // Stale-while-revalidate for API calls
        fetch(request).then(response => {
          if (response.ok) cache.put(request, response);
        }).catch(() => {});
        return cachedResponse;
      }

      const response = await fetch(request);
      if (response.ok && response.status < 400) {
        cache.put(request, response.clone());
      }
      return response;
    }
  },
  {
    name: 'network-first',
    match: () => true, // Fallback strategy
    handler: async (request) => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open('network-fallback-v1');
          cache.put(request, response.clone());
        }
        return response;
      } catch (error) {
        const cache = await caches.open('network-fallback-v1');
        const cachedResponse = await cache.match(request);
        if (cachedResponse) return cachedResponse;

        // Return offline fallback for HTML requests
        if (request.headers.get('accept')?.includes('text/html')) {
          return new Response(
            '<html><body><h1>Offline</h1><p>Conteúdo indisponível offline.</p></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        }

        throw error;
      }
    }
  }
];

// Performance monitoring
let performanceMetrics: PerformanceMetrics = {
  lcp: 0,
  cls: 0,
  inp: 0,
  fid: 0,
  ttfb: 0,
  fcp: 0
};

function updatePerformanceMetrics(metric: keyof PerformanceMetrics, value: number) {
  performanceMetrics[metric] = Math.max(performanceMetrics[metric], value);

  // Send metrics to main thread periodically
  if (Math.random() < 0.1) { // 10% sampling
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'performance-metrics',
          metrics: performanceMetrics
        });
      });
    });
  }
}

// Install event - preload critical resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing advanced service worker');

  event.waitUntil(
    Promise.all([
      caches.open('critical-v1').then(cache => {
        return cache.addAll([
          '/',
          '/manifest.json',
          '/favicon.ico',
          // Add critical resources here
        ]);
      }),
      self.skipWaiting() // Force activation
    ])
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating advanced service worker');

  const currentCaches = ['critical-v1', 'static-v1', 'api-v1', 'network-fallback-v1'];

  event.waitUntil(
    Promise.all([
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (!currentCaches.includes(cacheName)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim() // Take control of all clients
    ])
  );
});

// Fetch event - strategic caching
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Chrome extension requests
  if (request.url.startsWith('chrome-extension://')) return;

  // Find matching strategy
  const strategy = CACHE_STRATEGIES.find(s => s.match(request));

  if (strategy) {
    event.respondWith(
      strategy.handler(request).catch(error => {
        console.error(`[SW] ${strategy.name} strategy failed:`, error);
        return fetch(request);
      })
    );
  }
});

// Message event - handle performance metrics and commands
self.addEventListener('message', (event) => {
  const { type, data } = event.data;

  switch (type) {
    case 'update-performance':
      if (data.metric && typeof data.value === 'number') {
        updatePerformanceMetrics(data.metric, data.value);
      }
      break;

    case 'clear-cache':
      caches.keys().then(names => {
        return Promise.all(names.map(name => caches.delete(name)));
      }).then(() => {
        event.ports[0]?.postMessage({ type: 'cache-cleared' });
      });
      break;

    case 'get-performance':
      event.ports[0]?.postMessage({
        type: 'performance-data',
        metrics: performanceMetrics
      });
      break;

    default:
      console.log('[SW] Unknown message type:', type);
  }
});

// Background sync for offline analytics
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-analytics') {
    event.waitUntil(
      // Process queued analytics when back online
      processQueuedAnalytics()
    );
  }
});

async function processQueuedAnalytics() {
  // Implementation for processing queued analytics data
  console.log('[SW] Processing queued analytics');
}

// Push notifications for engagement
self.addEventListener('push', (event) => {
  const data = event.data?.json();

  const options = {
    body: data?.body || 'Nova atualização disponível!',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: data?.url || '/',
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'Ver'
      },
      {
        action: 'dismiss',
        title: 'Ignorar'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(
      data?.title || 'DataFlow Brasil',
      options
    )
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      self.clients.openWindow(event.notification.data)
    );
  }
});

export {};
