/**
 * Service Worker for VR Ecopetrol Client
 * Optimized for large multimedia assets with Cache-First strategy
 */

const CACHE_NAME = "vr-ecopetrol-v1";
const ASSETS_CACHE_NAME = "vr-assets-v1";
const CACHE_VERSION = "1.0.0";

// Critical assets to preload immediately
const CRITICAL_ASSETS = ["/", "/images/base.jpg", "/audio/toma_01.mp3"];

// Asset categories for different caching strategies
const ASSET_PATTERNS = {
  images: /\.(jpg|jpeg|png|webp)$/i,
  videos: /\.(mp4|webm|mov)$/i,
  audio: /\.(mp3|wav|ogg)$/i,
  scripts: /\.(js|mjs)$/i,
  styles: /\.css$/i,
};

// Cache size limits (in MB)
const CACHE_LIMITS = {
  assets: 800, // 800MB for multimedia assets
  app: 50, // 50MB for app files
};

self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker installing...");

  event.waitUntil(
    Promise.all([
      // Cache critical assets immediately
      caches.open(CACHE_NAME).then((cache) => {
        console.log("📦 Precaching critical assets...");
        return cache.addAll(
          CRITICAL_ASSETS.map(
            (url) =>
              new Request(url, {
                cache: "reload", // Ensure fresh content on install
              })
          )
        );
      }),

      // Initialize asset cache
      caches.open(ASSETS_CACHE_NAME).then((cache) => {
        console.log("🎨 Initializing assets cache...");
        return Promise.resolve();
      }),
    ]).then(() => {
      console.log("✅ Service Worker installed successfully");
      // Skip waiting to activate immediately
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", (event) => {
  console.log("🚀 Service Worker activating...");

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== ASSETS_CACHE_NAME) {
              console.log("🗑️ Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),

      // Take control immediately
      self.clients.claim(),
    ]).then(() => {
      console.log("✅ Service Worker activated");

      // Notify all clients of successful activation
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "SW_ACTIVATED",
            version: CACHE_VERSION,
          });
        });
      });
    })
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle requests from the same origin
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  try {
    // Different strategies based on asset type
    if (
      ASSET_PATTERNS.images.test(pathname) ||
      ASSET_PATTERNS.videos.test(pathname) ||
      ASSET_PATTERNS.audio.test(pathname)
    ) {
      return await cacheFirstStrategy(request, ASSETS_CACHE_NAME);
    }

    if (
      ASSET_PATTERNS.scripts.test(pathname) ||
      ASSET_PATTERNS.styles.test(pathname)
    ) {
      return await staleWhileRevalidateStrategy(request, CACHE_NAME);
    }

    // HTML and other requests - network first with cache fallback
    return await networkFirstStrategy(request, CACHE_NAME);
  } catch (error) {
    console.error("❌ Service Worker fetch error:", error);
    return new Response("Service Worker Error", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

/**
 * Cache-First Strategy - Best for large, static assets
 * Perfect for multimedia assets that rarely change
 */
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    console.log("📦 Cache hit:", request.url);
    // Update access time for LRU management
    updateAssetAccessTime(request.url);
    return cachedResponse;
  }

  console.log("🌐 Cache miss, fetching:", request.url);
  const response = await fetch(request);

  if (response.ok && response.status === 200) {
    // Check cache size before adding
    const shouldCache = await checkCacheSize(cacheName, response.clone());
    if (shouldCache) {
      await cache.put(request, response.clone());
      console.log("💾 Asset cached:", request.url);
    }
  }

  return response;
}

/**
 * Stale-While-Revalidate Strategy - Best for app files
 * Serves from cache while updating in background
 */
async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Always try to update in background
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok && response.status === 200) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  // Return cached version immediately if available
  if (cachedResponse) {
    console.log("📦 Serving from cache (updating):", request.url);
    return cachedResponse;
  }

  // Wait for network if no cache
  console.log("🌐 No cache, waiting for network:", request.url);
  return await fetchPromise;
}

/**
 * Network-First Strategy - Best for HTML and dynamic content
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);

    if (response.ok && response.status === 200) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
      console.log("💾 Cached from network:", request.url);
    }

    return response;
  } catch (error) {
    console.log("🌐 Network failed, trying cache:", request.url);
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log("📦 Serving stale from cache:", request.url);
      return cachedResponse;
    }

    throw error;
  }
}

/**
 * Check if we should cache based on size limits
 */
async function checkCacheSize(cacheName, response) {
  try {
    const size = await estimateResponseSize(response);
    const limit =
      cacheName === ASSETS_CACHE_NAME ? CACHE_LIMITS.assets : CACHE_LIMITS.app;

    if (size > limit * 1024 * 1024) {
      console.warn("⚠️ Asset too large to cache:", size, "bytes");
      return false;
    }

    // Check total cache size and clean if needed
    await cleanCacheIfNeeded(cacheName);

    return true;
  } catch (error) {
    console.error("❌ Error checking cache size:", error);
    return true; // Cache anyway on error
  }
}

/**
 * Estimate response size
 */
async function estimateResponseSize(response) {
  const contentLength = response.headers.get("content-length");
  if (contentLength) {
    return parseInt(contentLength, 10);
  }

  // Fallback: clone and read blob size
  try {
    const blob = await response.clone().blob();
    return blob.size;
  } catch {
    return 0;
  }
}

/**
 * Clean cache using LRU strategy if size limit exceeded
 */
async function cleanCacheIfNeeded(cacheName) {
  if ("storage" in navigator && "estimate" in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;

    // Clean if using more than 80% of quota
    if (usage > quota * 0.8) {
      console.log("🧹 Cache cleanup needed, usage:", usage, "quota:", quota);
      await performCacheCleanup(cacheName);
    }
  }
}

/**
 * Perform LRU cache cleanup
 */
async function performCacheCleanup(cacheName) {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();

  // Get access times from storage
  const accessTimes = await getAccessTimes();

  // Sort by last access time (oldest first)
  const sortedRequests = requests.sort((a, b) => {
    const timeA = accessTimes[a.url] || 0;
    const timeB = accessTimes[b.url] || 0;
    return timeA - timeB;
  });

  // Remove oldest 25% of entries
  const toRemove = Math.floor(sortedRequests.length * 0.25);
  const removePromises = sortedRequests.slice(0, toRemove).map((request) => {
    console.log("🗑️ Removing old cached asset:", request.url);
    return cache.delete(request);
  });

  await Promise.all(removePromises);
  console.log("✅ Cache cleanup completed, removed", toRemove, "items");
}

/**
 * Update asset access time for LRU management
 */
async function updateAssetAccessTime(url) {
  try {
    const accessTimes = await getAccessTimes();
    accessTimes[url] = Date.now();

    // Store in IndexedDB for persistence
    if ("indexedDB" in self) {
      const db = await openAccessTimeDB();
      const transaction = db.transaction(["accessTimes"], "readwrite");
      const store = transaction.objectStore("accessTimes");
      await store.put(accessTimes, "times");
    }
  } catch (error) {
    console.error("❌ Error updating access time:", error);
  }
}

/**
 * Get access times from IndexedDB
 */
async function getAccessTimes() {
  try {
    if ("indexedDB" in self) {
      const db = await openAccessTimeDB();
      const transaction = db.transaction(["accessTimes"], "readonly");
      const store = transaction.objectStore("accessTimes");
      const result = await store.get("times");
      return result || {};
    }
  } catch (error) {
    console.error("❌ Error getting access times:", error);
  }
  return {};
}

/**
 * Open IndexedDB for access time tracking
 */
function openAccessTimeDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("VRAccessTimes", 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains("accessTimes")) {
        db.createObjectStore("accessTimes");
      }
    };
  });
}

// Handle messages from the main thread
self.addEventListener("message", (event) => {
  const { data } = event;

  switch (data.type) {
    case "PRELOAD_ASSETS":
      handlePreloadAssets(data.assets);
      break;

    case "CLEAR_CACHE":
      handleClearCache(data.cacheNames);
      break;

    case "GET_CACHE_STATUS":
      handleGetCacheStatus(event);
      break;
  }
});

/**
 * Handle asset preloading requests
 */
async function handlePreloadAssets(assets) {
  console.log("🔄 Preloading assets:", assets.length);

  const cache = await caches.open(ASSETS_CACHE_NAME);
  const preloadPromises = assets.map(async (assetUrl) => {
    try {
      const cachedResponse = await cache.match(assetUrl);
      if (cachedResponse) {
        console.log("📦 Already cached:", assetUrl);
        return;
      }

      console.log("⬇️ Preloading:", assetUrl);
      const response = await fetch(assetUrl);

      if (response.ok && response.status === 200) {
        const shouldCache = await checkCacheSize(
          ASSETS_CACHE_NAME,
          response.clone()
        );
        if (shouldCache) {
          await cache.put(assetUrl, response);
          console.log("✅ Preloaded:", assetUrl);
        }
      }
    } catch (error) {
      console.error("❌ Failed to preload:", assetUrl, error);
    }
  });

  await Promise.all(preloadPromises);
  console.log("✅ Asset preloading completed");

  // Notify main thread
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: "PRELOAD_COMPLETE",
        assets: assets,
      });
    });
  });
}

/**
 * Handle cache clearing requests
 */
async function handleClearCache(cacheNames) {
  const namesToClear = cacheNames || [CACHE_NAME, ASSETS_CACHE_NAME];

  for (const cacheName of namesToClear) {
    try {
      await caches.delete(cacheName);
      console.log("🗑️ Cleared cache:", cacheName);
    } catch (error) {
      console.error("❌ Error clearing cache:", cacheName, error);
    }
  }

  // Notify main thread
  self.clients.matchAll().then((clients) => {
    clients.forEach((client) => {
      client.postMessage({
        type: "CACHE_CLEARED",
        cacheNames: namesToClear,
      });
    });
  });
}

/**
 * Handle cache status requests
 */
async function handleGetCacheStatus(event) {
  try {
    const cacheNames = await caches.keys();
    const status = {};

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      status[cacheName] = {
        count: keys.length,
        urls: keys.map((req) => req.url),
      };
    }

    // Add storage estimate if available
    if ("storage" in navigator && "estimate" in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      status.storage = {
        usage: estimate.usage,
        quota: estimate.quota,
        usagePercentage: Math.round((estimate.usage / estimate.quota) * 100),
      };
    }

    event.ports[0].postMessage({
      type: "CACHE_STATUS_RESPONSE",
      status: status,
    });
  } catch (error) {
    console.error("❌ Error getting cache status:", error);
    event.ports[0].postMessage({
      type: "CACHE_STATUS_ERROR",
      error: error.message,
    });
  }
}

console.log("🚀 VR Service Worker loaded");
