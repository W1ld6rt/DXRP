// Service Worker for DXPR Application
// Implements caching strategies for better performance

const CACHE_NAME = 'dxpr-v1.2.0';
const STATIC_CACHE = 'dxpr-static-v1.2.0';
const DYNAMIC_CACHE = 'dxpr-dynamic-v1.2.0';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/static/css/critical.css',
  '/static/css/main.css',
  '/static/css/main-content.css',
  '/static/js/performance-optimizer.js',
  '/static/js/theme-manager.js',
  '/static/fonts/MaterialIcons-Round.woff2',
  '/static/fonts/MaterialSymbolsRounded-VariableFont_FILL,GRAD,opsz,wght.ttf',
  '/static/favicon.png',
  '/static/icon-192.png',
  '/static/icon-512.png'
];

// Component resources to cache
const COMPONENT_ASSETS = [
  '/static/components/header/header.html',
  '/static/components/header/header.js',
  '/static/components/header/header.css',
  '/static/components/navigation/navigation.html',
  '/static/components/navigation/navigation.js',
  '/static/components/navigation/navigation.css',
  '/static/components/bible/bible.html',
  '/static/components/bible/bible.js',
  '/static/components/bible/bible.css',
  '/static/components/songs/songs.html',
  '/static/components/songs/songs.js',
  '/static/components/songs/songs.css',
  '/static/components/lower-third/lower-third.html',
  '/static/components/lower-third/lower-third.js',
  '/static/components/lower-third/lower-third.css',
  '/static/components/settings/settings.html',
  '/static/components/settings/settings.js',
  '/static/components/settings/settings.css'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        console.log('Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Cache component assets
      caches.open(DYNAMIC_CACHE).then(cache => {
        console.log('Caching component assets...');
        return cache.addAll(COMPONENT_ASSETS.filter(asset => {
          // Only cache if the asset exists
          return fetch(asset, { method: 'HEAD' })
            .then(response => response.ok)
            .catch(() => false);
        }));
      })
    ]).then(() => {
      console.log('Service Worker installed successfully');
      self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Skip API requests and WebSocket connections
  if (url.pathname.startsWith('/api/') || 
      url.pathname.startsWith('/socket.io/') ||
      request.headers.get('upgrade') === 'websocket') {
    return;
  }
  
  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  
  // Strategy 1: Cache First for static assets
  if (isStaticAsset(url.pathname)) {
    return cacheFirst(request);
  }
  
  // Strategy 2: Stale While Revalidate for components
  if (isComponentAsset(url.pathname)) {
    return staleWhileRevalidate(request);
  }
  
  // Strategy 3: Network First for HTML pages
  if (isHTMLRequest(request)) {
    return networkFirst(request);
  }
  
  // Default: Network only
  return fetch(request);
}

function isStaticAsset(pathname) {
  return pathname.includes('/static/css/') ||
         pathname.includes('/static/js/') ||
         pathname.includes('/static/fonts/') ||
         pathname.includes('/static/icon') ||
         pathname.includes('/static/favicon');
}

function isComponentAsset(pathname) {
  return pathname.includes('/static/components/');
}

function isHTMLRequest(request) {
  return request.headers.get('accept')?.includes('text/html');
}

// Cache First Strategy
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Cache first strategy failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request) {
  try {
    const cachedResponse = await caches.match(request);
    
    const networkPromise = fetch(request).then(response => {
      if (response.ok) {
        const cache = caches.open(DYNAMIC_CACHE);
        cache.then(c => c.put(request, response.clone()));
      }
      return response;
    }).catch(() => null);
    
    return cachedResponse || await networkPromise;
  } catch (error) {
    console.error('Stale while revalidate strategy failed:', error);
    return fetch(request);
  }
}

// Network First Strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { 
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implement background sync logic here
  console.log('Background sync triggered');
}

// Push notifications support
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/static/icon-192.png',
      badge: '/static/icon-192.png',
      vibrate: [100, 50, 100],
      data: data.data
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});

// Message handler for cache updates
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_UPDATE') {
    event.waitUntil(updateCache(event.data.urls));
  }
});

async function updateCache(urls) {
  const cache = await caches.open(DYNAMIC_CACHE);
  return Promise.all(
    urls.map(url => 
      fetch(url)
        .then(response => response.ok ? cache.put(url, response) : null)
        .catch(error => console.log('Failed to update cache for:', url, error))
    )
  );
}