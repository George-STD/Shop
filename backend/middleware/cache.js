const crypto = require('crypto');

/**
 * High-Performance In-Memory LRU + TTL Cache
 * Prevents redundant MongoDB reads on hot public catalog routes (featured, categories, occasions).
 */
class TtlCache {
  constructor(maxEntries = 2000, defaultTtlMs = 30_000) {
    this.maxEntries = maxEntries;
    this.defaultTtlMs = defaultTtlMs;
    this.store = new Map();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    // Refresh LRU order (delete & re-insert)
    this.store.delete(key);
    this.store.set(key, entry);
    return entry;
  }

  set(key, value, ttlMs = this.defaultTtlMs) {
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxEntries) {
      // Evict oldest entry (first item in Map)
      const oldestKey = this.store.keys().next().value;
      if (oldestKey) this.store.delete(oldestKey);
    }

    this.store.set(key, {
      ...value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  delete(key) {
    this.store.delete(key);
  }

  deleteByPrefix(prefix) {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  clear() {
    this.store.clear();
  }

  cleanExpired() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

const catalogCache = new TtlCache(2000, 30_000);

// Sweep expired entries every 60 seconds
setInterval(() => catalogCache.cleanExpired(), 60_000).unref();

/**
 * Computes deterministic ETag hash for response payloads
 * @param {any} body
 * @returns {string}
 */
const generateETag = (body) => {
  const str = typeof body === 'string' ? body : JSON.stringify(body);
  return `"${crypto.createHash('md5').update(str).digest('hex')}"`;
};

/**
 * Express Middleware: Caches public GET endpoints with ETag & 304 Not Modified
 * @param {string} namespace - e.g. 'products', 'categories', 'occasions', 'settings'
 * @param {number} [ttlMs=30000] - Time to live in milliseconds
 */
const rememberGet = (namespace, ttlMs = 30_000) => {
  return (req, res, next) => {
    // Only cache GET requests without Authorization headers, bypassed in test env
    if (req.method !== 'GET' || req.headers.authorization || process.env.NODE_ENV === 'test') {
      return next();
    }

    const key = `${namespace}:${req.originalUrl}`;
    const cached = catalogCache.get(key);

    if (cached) {
      res.set('X-Cache', 'HIT');
      res.set('Cache-Control', `public, max-age=${Math.round(ttlMs / 1000)}, stale-while-revalidate=120`);
      res.set('ETag', cached.etag);

      const clientETag = req.headers['if-none-match'];
      if (clientETag && (clientETag === cached.etag || clientETag === cached.etag.replace(/"/g, ''))) {
        return res.status(304).end();
      }

      return res.status(cached.status || 200).json(cached.body);
    }

    // Cache MISS: Intercept res.json to cache response
    res.set('X-Cache', 'MISS');
    res.set('Cache-Control', `public, max-age=${Math.round(ttlMs / 1000)}, stale-while-revalidate=120`);

    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const etag = generateETag(body);
        res.set('ETag', etag);

        catalogCache.set(key, {
          status: res.statusCode,
          body,
          etag,
        }, ttlMs);
      }
      return originalJson(body);
    };

    next();
  };
};

/**
 * Cache Invalidation helper called upon admin mutations (create, update, delete)
 * @param {string} namespace - e.g. 'products', 'categories', 'occasions', 'settings'
 */
const bustCatalog = (namespace) => {
  const prefix = namespace.endsWith(':') ? namespace : `${namespace}:`;
  catalogCache.deleteByPrefix(prefix);
};

/**
 * Middleware enforcing private non-cacheable responses (for auth & orders)
 */
const noStoreCache = (req, res, next) => {
  res.set('Cache-Control', 'private, no-store, max-age=0, must-revalidate');
  res.set('Pragma', 'no-cache');
  next();
};

module.exports = {
  TtlCache,
  catalogCache,
  rememberGet,
  bustCatalog,
  noStoreCache,
  generateETag,
};
