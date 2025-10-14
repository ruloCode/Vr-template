/**
 * Service Worker for Video Sync Client
 * Optimized for offline operation with large video files
 */

const CACHE_NAME = "video-client-v1";
const ASSETS_CACHE_NAME = "video-assets-v1";
const CACHE_VERSION = "1.0.0";

// Critical assets to preload immediately
const CRITICAL_ASSETS = [
  "/",
  "/index.html",
  "/client.js",
  "/styles.css",
];

// Asset patterns for caching strategies
const ASSET_PATTERNS = {
  videos: /\.(mp4|webm|mov)$/i,
  scripts: /\.(js|mjs)$/i,
  styles: /\.css$/i,
  html: /\.(html|htm)$/i,
};

// Cache size limits (in MB)
const CACHE_LIMITS = {
  videos: 1000, // 1GB for video assets
  app: 50, // 50MB for app files
};

self.addEventListener("install", (event) => {
  console.log("🔧 [Video SW] Installing...");

  event.waitUntil(
    Promise.all([
      // Cache critical app assets immediately
      caches.open(CACHE_NAME).then((cache) => {
        console.log("📦 [Video SW] Precaching critical assets...");
        return cache.addAll(
          CRITICAL_ASSETS.map(
            (url) =>
              new Request(url, {
                cache: "reload", // Ensure fresh content on install
              })
          )
        );
      }),

      // Initialize video assets cache
      caches.open(ASSETS_CACHE_NAME).then(() => {
        console.log("🎬 [Video SW] Initializing video cache...");
        return Promise.resolve();
      }),
    ]).then(() => {
      console.log("✅ [Video SW] Installed successfully");
      // Skip waiting to activate immediately
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", (event) => {
  console.log("🚀 [Video SW] Activating...");

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== ASSETS_CACHE_NAME) {
              console.log("🗑️ [Video SW] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),

      // Take control immediately
      self.clients.claim(),
    ]).then(() => {
      console.log("✅ [Video SW] Activated");

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
    // Video files - Cache-First (most important for offline)
    if (ASSET_PATTERNS.videos.test(pathname)) {
      return await cacheFirstStrategy(request, ASSETS_CACHE_NAME);
    }

    // App files (JS, CSS) - Stale-While-Revalidate
    if (
      ASSET_PATTERNS.scripts.test(pathname) ||
      ASSET_PATTERNS.styles.test(pathname)
    ) {
      return await staleWhileRevalidateStrategy(request, CACHE_NAME);
    }

    // HTML - Network-First with cache fallback
    if (ASSET_PATTERNS.html.test(pathname) || pathname === "/") {
      return await networkFirstStrategy(request, CACHE_NAME);
    }

    // Default: try network first
    return await networkFirstStrategy(request, CACHE_NAME);
  } catch (error) {
    console.error("❌ [Video SW] Fetch error:", error);

    // Return offline page or error
    return new Response("Offline - Content not cached", {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "text/plain" },
    });
  }
}

/**
 * Cache-First Strategy - Best for large video files
 * Returns cached version immediately if available
 */
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    console.log("📦 [Video SW] Cache hit:", request.url);
    // Update access time for LRU management
    updateAssetAccessTime(request.url);
    return cachedResponse;
  }

  console.log("🌐 [Video SW] Cache miss, fetching:", request.url);

  try {
    const response = await fetch(request);

    if (response.ok && response.status === 200) {
      // Check cache size before adding large videos
      const shouldCache = await checkCacheSize(cacheName, response.clone());
      if (shouldCache) {
        await cache.put(request, response.clone());
        console.log("💾 [Video SW] Video cached:", request.url);
      }
    }

    return response;
  } catch (error) {
    console.error("❌ [Video SW] Network error:", error);
    throw error;
  }
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
        console.log("🔄 [Video SW] Updated in cache:", request.url);
      }
      return response;
    })
    .catch(() => null);

  // Return cached version immediately if available
  if (cachedResponse) {
    console.log("📦 [Video SW] Serving from cache (updating):", request.url);
    return cachedResponse;
  }

  // Wait for network if no cache
  console.log("🌐 [Video SW] No cache, waiting for network:", request.url);
  const response = await fetchPromise;

  if (!response) {
    throw new Error("Network request failed");
  }

  return response;
}

/**
 * Network-First Strategy - Best for HTML and dynamic content
 * Tries network first, falls back to cache if offline
 */
async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);

    if (response.ok && response.status === 200) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
      console.log("💾 [Video SW] Cached from network:", request.url);
    }

    return response;
  } catch (error) {
    console.log("🌐 [Video SW] Network failed, trying cache:", request.url);
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log("📦 [Video SW] Serving stale from cache:", request.url);
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
      cacheName === ASSETS_CACHE_NAME ? CACHE_LIMITS.videos : CACHE_LIMITS.app;

    const sizeMB = size / (1024 * 1024);

    if (sizeMB > limit) {
      console.warn(
        `⚠️ [Video SW] Asset too large to cache: ${sizeMB.toFixed(2)}MB (limit: ${limit}MB)`
      );
      return false;
    }

    // Check total cache size and clean if needed
    await cleanCacheIfNeeded(cacheName);

    return true;
  } catch (error) {
    console.error("❌ [Video SW] Error checking cache size:", error);
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

    // Clean if using more than 85% of quota
    if (usage > quota * 0.85) {
      console.log(
        `🧹 [Video SW] Cache cleanup needed - Usage: ${(usage / 1024 / 1024).toFixed(2)}MB / Quota: ${(quota / 1024 / 1024).toFixed(2)}MB`
      );
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

  // Get access times
  const accessTimes = await getAccessTimes();

  // Sort by last access time (oldest first)
  const sortedRequests = requests.sort((a, b) => {
    const timeA = accessTimes[a.url] || 0;
    const timeB = accessTimes[b.url] || 0;
    return timeA - timeB;
  });

  // Remove oldest 30% of entries
  const toRemove = Math.max(1, Math.floor(sortedRequests.length * 0.3));
  const removePromises = sortedRequests.slice(0, toRemove).map((request) => {
    console.log("🗑️ [Video SW] Removing old cached asset:", request.url);
    return cache.delete(request);
  });

  await Promise.all(removePromises);
  console.log(`✅ [Video SW] Cache cleanup completed, removed ${toRemove} items`);
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
    // Silent fail - not critical
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
    // Silent fail
  }
  return {};
}

/**
 * Open IndexedDB for access time tracking
 */
function openAccessTimeDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("VideoClientAccessTimes", 1);

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
    case "PRELOAD_VIDEO":
      handlePreloadVideo(data.videoUrl);
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
 * Handle video preloading requests
 */
async function handlePreloadVideo(videoUrl) {
  console.log("🔄 [Video SW] Preloading video:", videoUrl);

  try {
    const cache = await caches.open(ASSETS_CACHE_NAME);
    const cachedResponse = await cache.match(videoUrl);

    if (cachedResponse) {
      console.log("📦 [Video SW] Video already cached:", videoUrl);

      // Notify completion
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: "PRELOAD_COMPLETE",
            videoUrl: videoUrl,
            cached: true,
          });
        });
      });
      return;
    }

    console.log("⬇️ [Video SW] Downloading video:", videoUrl);
    const response = await fetch(videoUrl);

    if (response.ok && response.status === 200) {
      const shouldCache = await checkCacheSize(ASSETS_CACHE_NAME, response.clone());
      if (shouldCache) {
        await cache.put(videoUrl, response);
        console.log("✅ [Video SW] Video preloaded and cached:", videoUrl);

        // Notify completion
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: "PRELOAD_COMPLETE",
              videoUrl: videoUrl,
              cached: true,
            });
          });
        });
      } else {
        console.warn("⚠️ [Video SW] Video too large to cache:", videoUrl);

        // Notify - not cached due to size
        self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: "PRELOAD_COMPLETE",
              videoUrl: videoUrl,
              cached: false,
              reason: "too_large",
            });
          });
        });
      }
    }
  } catch (error) {
    console.error("❌ [Video SW] Failed to preload video:", videoUrl, error);

    // Notify error
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: "PRELOAD_ERROR",
          videoUrl: videoUrl,
          error: error.message,
        });
      });
    });
  }
}

/**
 * Handle cache clearing requests
 */
async function handleClearCache(cacheNames) {
  const namesToClear = cacheNames || [CACHE_NAME, ASSETS_CACHE_NAME];

  for (const cacheName of namesToClear) {
    try {
      await caches.delete(cacheName);
      console.log("🗑️ [Video SW] Cleared cache:", cacheName);
    } catch (error) {
      console.error("❌ [Video SW] Error clearing cache:", cacheName, error);
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
        usageMB: (estimate.usage / 1024 / 1024).toFixed(2),
        quotaMB: (estimate.quota / 1024 / 1024).toFixed(2),
      };
    }

    event.ports[0].postMessage({
      type: "CACHE_STATUS_RESPONSE",
      status: status,
    });
  } catch (error) {
    console.error("❌ [Video SW] Error getting cache status:", error);
    event.ports[0].postMessage({
      type: "CACHE_STATUS_ERROR",
      error: error.message,
    });
  }
}

console.log("🚀 [Video SW] Service Worker loaded");
