// VoxNava Service Worker
// Version incremented to force cache refresh
const CACHE_VERSION = 4;
const CACHE_NAME = 'voxnava-v' + CACHE_VERSION;
const OFFLINE_URL = '/offline';

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Pages to cache for offline access
const PAGES_TO_CACHE = [
  '/check-in',
  '/mindfulness',
  '/games',
  '/progress',
  '/profile',
  '/settings',
];

// API routes that should always go to network
const NETWORK_ONLY = [
  '/api/',
  '/genkit/',
  '/_next/',
];

// Install event - cache static assets
self.addEventListener('install', function(event) {
  console.log('[SW] Installing new version:', CACHE_NAME);
  event.waitUntil(
    (async function() {
      // Clear ALL old caches first
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(function(name) { 
          console.log('[SW] Deleting old cache:', name);
          return caches.delete(name); 
        })
      );
      
      const cache = await caches.open(CACHE_NAME);
      
      // Cache static assets
      await cache.addAll(STATIC_ASSETS);
      
      // Try to cache pages (non-blocking)
      for (const page of PAGES_TO_CACHE) {
        try {
          await cache.add(page);
        } catch (e) {
          console.log('Failed to cache ' + page + ':', e);
        }
      }
      
      // Activate immediately
      await self.skipWaiting();
    })()
  );
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', function(event) {
  console.log('[SW] Activating new version:', CACHE_NAME);
  event.waitUntil(
    (async function() {
      // Clean up old caches (safety net)
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter(function(name) { return name !== CACHE_NAME; })
          .map(function(name) { 
            console.log('[SW] Cleaning up old cache:', name);
            return caches.delete(name); 
          })
      );
      
      // Take control of all pages immediately
      await self.clients.claim();
      
      // Notify all clients to refresh
      const clients = await self.clients.matchAll({ type: 'window' });
      clients.forEach(function(client) {
        client.postMessage({ type: 'SW_UPDATED' });
      });
    })()
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', function(event) {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }
  
  // Network only for API routes
  const isNetworkOnly = NETWORK_ONLY.some(function(path) {
    return url.pathname.startsWith(path);
  });
  
  if (isNetworkOnly) {
    event.respondWith(
      fetch(request).catch(function() {
        return new Response(
          JSON.stringify({ error: 'You are offline' }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      })
    );
    return;
  }
  
  // Network-first for HTML pages (to ensure fresh content)
  const acceptHeader = request.headers.get('accept');
  if (acceptHeader && acceptHeader.includes('text/html')) {
    event.respondWith(
      (async function() {
        const cache = await caches.open(CACHE_NAME);
        
        // Try network first
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (e) {
          // Fallback to cache if network fails
          const cachedResponse = await cache.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Fallback to offline page
          const offlineResponse = await cache.match(OFFLINE_URL);
          return offlineResponse || new Response('Offline', { status: 503 });
        }
      })()
    );
    return;
  }
  
  // Network-first for JS/CSS bundles (Next.js chunks)
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(
      (async function() {
        const cache = await caches.open(CACHE_NAME);
        
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (e) {
          const cachedResponse = await cache.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          throw e;
        }
      })()
    );
    return;
  }
  
  // Cache-first for static assets
  event.respondWith(
    (async function() {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(request);
      
      if (cachedResponse) {
        return cachedResponse;
      }
      
      try {
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
          cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
      } catch (e) {
        // Return a fallback for images
        if (request.destination === 'image') {
          return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#f0f0f0" width="100" height="100"/></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
        
        throw e;
      }
    })()
  );
});

// Handle messages from the app
self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    var urls = event.data.urls;
    event.waitUntil(
      (async function() {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(urls);
      })()
    );
  }
});

// Background sync for offline data
self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-checkins') {
    event.waitUntil(syncCheckIns());
  }
});

function syncCheckIns() {
  // This would sync any offline check-ins when back online
  console.log('Syncing check-ins...');
  return Promise.resolve();
}

// Push notifications (for future use)
self.addEventListener('push', function(event) {
  if (!event.data) return;
  
  var data = event.data.json();
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: data.tag || 'voxnava-notification',
      data: data.data,
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  var url = (event.notification.data && event.notification.data.url) || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(function(clients) {
      // Focus existing window if available
      for (var i = 0; i < clients.length; i++) {
        var client = clients[i];
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      return self.clients.openWindow(url);
    })
  );
});
