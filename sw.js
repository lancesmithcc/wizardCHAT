const CACHE_NAME = 'wizardchat-v1.0.0';
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/icons/wizchatlogo.svg',
  '/icons/android-chrome-192x192.png',
  '/icons/android-chrome-512x512.png',
  '/favicon.png'
];

const DYNAMIC_CACHE_NAME = 'wizardchat-dynamic-v1.0.0';
const MAX_DYNAMIC_CACHE_SIZE = 50;

// Helper function to limit cache size
async function limitCacheSize(cacheName, size) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > size) {
    await cache.delete(keys[0]);
    limitCacheSize(cacheName, size);
  }
}

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('🎭 WizardCHAT Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('✨ Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('🎉 Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('❌ Error caching static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('🌟 WizardCHAT Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('🧹 Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✨ Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Handle API requests with network-first strategy
  if (url.pathname.includes('/.netlify/functions/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful API responses
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE_NAME)
              .then(cache => {
                cache.put(request, responseClone);
                limitCacheSize(DYNAMIC_CACHE_NAME, MAX_DYNAMIC_CACHE_SIZE);
              });
          }
          return response;
        })
        .catch(() => {
          // Return cached response if network fails
          return caches.match(request)
            .then(response => {
              if (response) {
                console.log('📦 Serving cached API response for:', request.url);
                return response;
              }
              // Return offline message for failed API calls
              return new Response(JSON.stringify({
                error: 'You are offline. The wizard\'s magic requires an internet connection.',
                offline: true
              }), {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              });
            });
        })
    );
    return;
  }

  // Handle static assets with cache-first strategy
  event.respondWith(
    caches.match(request)
      .then(response => {
        if (response) {
          console.log('📦 Serving from cache:', request.url);
          return response;
        }

        // Not in cache, fetch from network
        return fetch(request)
          .then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response for caching
            const responseClone = response.clone();
            
            // Cache dynamic content
            caches.open(DYNAMIC_CACHE_NAME)
              .then(cache => {
                cache.put(request, responseClone);
                limitCacheSize(DYNAMIC_CACHE_NAME, MAX_DYNAMIC_CACHE_SIZE);
              });

            return response;
          })
          .catch(() => {
            // Network failed, check for fallback
            if (request.destination === 'document') {
              return caches.match('/index.html');
            }
            
            // For other resources, return a generic offline response
            return new Response('Offline - The wizard\'s magic is temporarily unavailable', {
              status: 503,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Background sync for offline actions (if supported)
self.addEventListener('sync', event => {
  if (event.tag === 'wizard-chat-sync') {
    console.log('🔄 Background sync triggered');
    event.waitUntil(
      // Here you could implement offline message queuing
      // and send them when back online
      Promise.resolve()
    );
  }
});

// Push notifications (if implemented later)
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    console.log('🔔 Push notification received:', data);
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'WizardCHAT', {
        body: data.body || 'The wizard has a message for you',
        icon: '/icons/android-chrome-192x192.png',
        badge: '/icons/android-chrome-96x96.png',
        tag: 'wizard-notification',
        requireInteraction: false,
        actions: [
          {
            action: 'open',
            title: 'Open Chat'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ]
      })
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

console.log('🎭 WizardCHAT Service Worker loaded successfully'); 