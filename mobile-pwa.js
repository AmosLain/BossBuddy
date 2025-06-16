// ===================================
// PROGRESSIVE WEB APP (PWA) SETUP
// ===================================

// public/manifest.json
const manifest = {
  "name": "BossBuddy - Professional Email Assistant",
  "short_name": "BossBuddy",
  "description": "Transform casual messages into professional communications",
  "start_url": "/?source=pwa",
  "display": "standalone",
  "theme_color": "#8B5CF6",
  "background_color": "#FFFFFF",
  "orientation": "portrait",
  "categories": ["productivity", "business"],
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/mobile-1.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "label": "Home screen showing message input"
    },
    {
      "src": "/screenshots/mobile-2.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "label": "Tone selection interface"
    },
    {
      "src": "/screenshots/mobile-3.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "label": "Rewritten message result"
    }
  ],
  "shortcuts": [
    {
      "name": "New Message",
      "short_name": "New",
      "description": "Write a new message",
      "url": "/app?action=new",
      "icons": [{ "src": "/icons/new-96x96.png", "sizes": "96x96" }]
    },
    {
      "name": "History",
      "short_name": "History",
      "description": "View message history",
      "url": "/app?action=history",
      "icons": [{ "src": "/icons/history-96x96.png", "sizes": "96x96" }]
    }
  ],
  "share_target": {
    "action": "/app/share",
    "method": "GET",
    "enctype": "application/x-www-form-urlencoded",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url"
    }
  }
};

// ===================================
// SERVICE WORKER
// ===================================

// public/sw.js
const SERVICE_WORKER = `
const CACHE_NAME = 'bossbuddy-v1';
const urlsToCache = [
  '/',
  '/app',
  '/styles.css',
  '/fonts/inter-var.woff2',
  '/icons/icon-192x192.png',
  '/offline.html'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Handle API calls differently
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response
          const responseToCache = response.clone();
          
          // Cache successful API responses
          if (response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          
          return response;
        })
        .catch(() => {
          // Return cached API response if available
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Handle other requests
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(event.request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        });
      })
      .catch(() => {
        // Return offline page for navigation requests
        if (event.request.destination === 'document') {
          return caches.match('/offline.html');
        }
      })
  );
});

// Background sync for offline messages
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  const cache = await caches.open(CACHE_NAME);
  const requests = await cache.keys();
  
  for (const request of requests) {
    if (request.url.includes('/api/rewrite')) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.delete(request);
        }
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'New message from BossBuddy',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open App',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('BossBuddy', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('https://bossbuddy.ai/app')
    );
  }
});
`;

// ===================================
// MOBILE-OPTIMIZED APP COMPONENT
// ===================================

// components/MobileApp.tsx
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Share, Download, Menu, X, 
  MessageSquare, Clock, Sparkles, Settings,
  Home, History, User, Plus
} from 'lucide-react';

export const MobileApp = () => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [currentView, setCurrentView] = useState('home');
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  
  useEffect(() => {
    // Check if app is installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
    
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    });
    
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);
  
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowInstallBanner(false);
    }
    
    setDeferredPrompt(null);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold">BossBuddy</h1>
          </div>
          
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <Settings className="w-5 h-5" />
          </button>
        </div>
        
        {/* Install Banner */}
        {showInstallBanner && !isInstalled && (
          <div className="bg-purple-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium">Install BossBuddy</p>
              <p className="text-xs opacity-90">Add to home screen for quick access</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleInstall}
                className="px-4 py-2 bg-white text-purple-600 rounded-lg text-sm font-medium"
              >
                Install
              </button>
              <button
                onClick={() => setShowInstallBanner(false)}
                className="p-2 hover:bg-purple-700 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </header>
      
      {/* Main Content */}
      <main className="pb-20">
        {currentView === 'home' && <MobileHomeView />}
        {currentView === 'history' && <MobileHistoryView />}
        {currentView === 'profile' && <MobileProfileView />}
      </main>
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-4 py-2">
          <button
            onClick={() => setCurrentView('home')}
            className={`flex flex-col items-center gap-1 py-2 ${
              currentView === 'home' ? 'text-purple-600' : 'text-gray-500'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">Home</span>
          </button>
          
          <button
            onClick={() => setCurrentView('history')}
            className={`flex flex-col items-center gap-1 py-2 ${
              currentView === 'history' ? 'text-purple-600' : 'text-gray-500'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="text-xs">History</span>
          </button>
          
          <button
            onClick={() => setCurrentView('new')}
            className="flex flex-col items-center gap-1 py-2"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center -mt-4">
              <Plus className="w-6 h-6 text-white" />
            </div>
          </button>
          
          <button
            onClick={() => setCurrentView('profile')}
            className={`flex flex-col items-center gap-1 py-2 ${
              currentView === 'profile' ? 'text-purple-600' : 'text-gray-500'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

// Mobile Home View
const MobileHomeView = () => {
  const [message, setMessage] = useState('');
  const [selectedTone, setSelectedTone] = useState('formal');
  const [rewrittenMessage, setRewrittenMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const tones = [
    { id: 'formal', name: 'Formal', emoji: '👔' },
    { id: 'friendly', name: 'Friendly', emoji: '😊' },
    { id: 'assertive', name: 'Assertive', emoji: '💪' },
    { id: 'apologetic', name: 'Apologetic', emoji: '🙏' }
  ];
  
  const handleRewrite = async () => {
    if (!message.trim()) return;
    
    setLoading(true);
    
    // Check if online
    if (!navigator.onLine) {
      // Queue for background sync
      await queueOfflineRequest({ message, tone: selectedTone });
      setRewrittenMessage('Your message will be rewritten when you\'re back online.');
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, tone: selectedTone })
      });
      
      const data = await response.json();
      setRewrittenMessage(data.rewritten);
    } catch (error) {
      console.error('Rewrite failed:', error);
    }
    
    setLoading(false);
  };
  
  const shareMessage = async () => {
    if (!rewrittenMessage) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Professional Message',
          text: rewrittenMessage,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    } else {
      // Fallback to copy
      navigator.clipboard.writeText(rewrittenMessage);
      alert('Message copied to clipboard!');
    }
  };
  
  return (
    <div className="px-4 py-6 space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">3</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Today</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">47</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">This Week</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">2.3h</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Saved</p>
        </div>
      </div>
      
      {/* Message Input */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
        <label className="block text-sm font-medium mb-2">Your Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type or paste your message here..."
          className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 h-32 resize-none"
        />
      </div>
      
      {/* Tone Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
        <label className="block text-sm font-medium mb-3">Select Tone</label>
        <div className="grid grid-cols-2 gap-2">
          {tones.map((tone) => (
            <button
              key={tone.id}
              onClick={() => setSelectedTone(tone.id)}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedTone === tone.id
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-900'
                  : 'border-gray-200 dark:border-gray-600'
              }`}
            >
              <span className="text-2xl">{tone.emoji}</span>
              <p className="text-sm mt-1">{tone.name}</p>
            </button>
          ))}
        </div>
      </div>
      
      {/* Rewrite Button */}
      <button
        onClick={handleRewrite}
        disabled={loading || !message.trim()}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Rewriting...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Rewrite Message
          </>
        )}
      </button>
      
      {/* Result */}
      {rewrittenMessage && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Your Professional Message</h3>
            <button
              onClick={shareMessage}
              className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-lg"
            >
              <Share className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {rewrittenMessage}
          </p>
        </div>
      )}
    </div>
  );
};

// Offline Support
async function queueOfflineRequest(data) {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    const sw = await navigator.serviceWorker.ready;
    await sw.sync.register('sync-messages');
    
    // Store in IndexedDB
    const db = await openDB();
    await db.add('pending_messages', data);
  }
}

// ===================================
// IOS & ANDROID SPECIFIC FEATURES
// ===================================

// hooks/useMobileFeatures.ts
export const useMobileFeatures = () => {
  const [platform, setPlatform] = useState('web');
  const [isStandalone, setIsStandalone] = useState(false);
  
  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    }
    
    // Check if running as PWA
    const standalone = window.matchMedia('(display-mode: standalone)').matches ||
                      window.navigator.standalone ||
                      document.referrer.includes('android-app://');
    setIsStandalone(standalone);
    
    // iOS specific
    if (platform === 'ios') {
      // Disable bounce scroll
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      
      // Handle safe areas
      document.documentElement.style.setProperty(
        '--safe-area-inset-top',
        'env(safe-area-inset-top)'
      );
    }
    
    // Android specific
    if (platform === 'android') {
      // Set theme color
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.content = '#8B5CF6';
      }
    }
  }, [platform]);
  
  const vibrate = (pattern = [200]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };
  
  const share = async (data) => {
    if (navigator.share) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        console.error('Share failed:', error);
        return false;
      }
    }
    return false;
  };
  
  const requestPersistentStorage = async () => {
    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist();
      console.log(`Persisted storage granted: ${isPersisted}`);
    }
  };
  
  return {
    platform,
    isStandalone,
    vibrate,
    share,
    requestPersistentStorage
  };
};

// ===================================
// APP STORE METADATA
// ===================================

const appStoreData = {
  ios: {
    appId: '1234567890',
    appName: 'BossBuddy - Email Assistant',
    appStoreUrl: 'https://apps.apple.com/app/bossbuddy/id1234567890',
    smartAppBanner: '<meta name="apple-itunes-app" content="app-id=1234567890">',
    screenshots: [
      'ios-screenshot-1.png',
      'ios-screenshot-2.png',
      'ios-screenshot-3.png'
    ]
  },
  android: {
    packageName: 'ai.bossbuddy.app',
    playStoreUrl: 'https://play.google.com/store/apps/details?id=ai.bossbuddy.app',
    assetLinks: {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'ai.bossbuddy.app',
        sha256_cert_fingerprints: ['...']
      }
    }
  }
};

// ===================================
// MOBILE PERFORMANCE OPTIMIZATION
// ===================================

// lib/mobileOptimization.ts
export const optimizeForMobile = () => {
  // Lazy load images
  if ('loading' in HTMLImageElement.prototype) {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
      img.src = img.dataset.src;
      img.loading = 'lazy';
    });
  } else {
    // Fallback to Intersection Observer
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          observer.unobserve(img);
        }
      });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
  
  // Optimize touch events
  let touchStartY = 0;
  document.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });
  
  // Prevent overscroll on iOS
  document.addEventListener('touchmove', (e) => {
    const touchY = e.touches[0].clientY;
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    
    if (scrollTop === 0 && touchY > touchStartY) {
      e.preventDefault();
    }
  }, { passive: false });
  
  // Optimize animations for mobile
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    document.documentElement.style.setProperty('--animation-duration', '0.01ms');
  }
};

// Export everything
export default {
  manifest,
  SERVICE_WORKER,
  MobileApp,
  useMobileFeatures,
  appStoreData,
  optimizeForMobile
};