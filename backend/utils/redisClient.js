const net = require('net');
const tls = require('tls');

/**
 * Enterprise Distributed Redis Client (Zero-Dependency Native RESP2 + Automatic L1 Memory Fallback)
 * Connects to REDIS_URL (redis:// or rediss://) when configured in production/staging,
 * and falls back transparently to in-memory structures if Redis is unconfigured or unreachable.
 */

const encodeRespCommand = (args) => {
  let out = `*${args.length}\r\n`;
  for (const arg of args) {
    const str = String(arg ?? '');
    const byteLen = Buffer.byteLength(str, 'utf8');
    out += `$${byteLen}\r\n${str}\r\n`;
  }
  return out;
};

/**
 * Streaming RESP2 response parser
 * Parses Simple Strings (+), Errors (-), Integers (:), Bulk Strings ($), and Arrays (*)
 */
const parseRespValue = (buffer, offset = 0) => {
  if (offset >= buffer.length) return null;
  const prefix = String.fromCharCode(buffer[offset]);
  const lineEnd = buffer.indexOf('\r\n', offset);
  if (lineEnd === -1) return null;

  const header = buffer.slice(offset + 1, lineEnd).toString('utf8');
  const nextOffset = lineEnd + 2;

  if (prefix === '+') {
    return { value: header, offset: nextOffset };
  }
  if (prefix === '-') {
    return { error: new Error(header), offset: nextOffset };
  }
  if (prefix === ':') {
    return { value: parseInt(header, 10), offset: nextOffset };
  }
  if (prefix === '$') {
    const len = parseInt(header, 10);
    if (len === -1) {
      return { value: null, offset: nextOffset };
    }
    const endBulk = nextOffset + len;
    if (buffer.length < endBulk + 2) return null;
    const val = buffer.slice(nextOffset, endBulk).toString('utf8');
    return { value: val, offset: endBulk + 2 };
  }
  if (prefix === '*') {
    const count = parseInt(header, 10);
    if (count === -1) {
      return { value: null, offset: nextOffset };
    }
    const items = [];
    let cursor = nextOffset;
    for (let i = 0; i < count; i++) {
      const parsed = parseRespValue(buffer, cursor);
      if (!parsed) return null;
      if (parsed.error) return parsed;
      items.push(parsed.value);
      cursor = parsed.offset;
    }
    return { value: items, offset: cursor };
  }
  return { error: new Error(`Unexpected RESP prefix: ${prefix}`), offset: buffer.length };
};

class NativeRedisClient {
  constructor(redisUrl) {
    this.redisUrl = redisUrl;
    this.socket = null;
    this.connected = false;
    this.connecting = false;
    this.buffer = Buffer.alloc(0);
    this.queue = [];
    this.reconnectTimer = null;
    this.closed = false;
  }

  connect() {
    if (this.closed || this.connected || this.connecting || !this.redisUrl) return;
    if (process.env.NODE_ENV === 'test' && process.env.FORCE_REDIS_IN_TEST !== 'true') return;

    let parsed;
    try {
      parsed = new URL(this.redisUrl);
    } catch (_) {
      return;
    }

    this.connecting = true;
    const isTls = parsed.protocol === 'rediss:';
    const port = Number(parsed.port) || 6379;
    const host = parsed.hostname || '127.0.0.1';
    const password = parsed.password ? decodeURIComponent(parsed.password) : '';
    const username = parsed.username ? decodeURIComponent(parsed.username) : '';
    const dbIndex = parsed.pathname && parsed.pathname.length > 1 ? parseInt(parsed.pathname.slice(1), 10) : 0;

    const onConnect = () => {
      this.connecting = false;
      this.connected = true;

      if (password) {
        const authArgs = username ? ['AUTH', username, password] : ['AUTH', password];
        this.sendCommand(authArgs).catch(() => {});
      }
      if (Number.isInteger(dbIndex) && dbIndex > 0) {
        this.sendCommand(['SELECT', String(dbIndex)]).catch(() => {});
      }
    };

    this.socket = isTls
      ? tls.connect({ host, port, servername: host }, onConnect)
      : net.createConnection({ host, port }, onConnect);

    this.socket.setKeepAlive(true, 15_000);
    this.socket.unref?.();

    this.socket.on('data', (chunk) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      while (this.queue.length > 0 && this.buffer.length > 0) {
        const parsedResp = parseRespValue(this.buffer, 0);
        if (!parsedResp) break;
        this.buffer = this.buffer.slice(parsedResp.offset);
        const current = this.queue.shift();
        clearTimeout(current.timer);
        if (parsedResp.error) {
          current.reject(parsedResp.error);
        } else {
          current.resolve(parsedResp.value);
        }
      }
    });

    const handleDisconnect = () => {
      this.connected = false;
      this.connecting = false;
      this.buffer = Buffer.alloc(0);
      while (this.queue.length > 0) {
        const item = this.queue.shift();
        clearTimeout(item.timer);
        item.reject(new Error('Redis connection closed'));
      }
      if (!this.closed && process.env.NODE_ENV !== 'test') {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => this.connect(), 5_000);
        this.reconnectTimer.unref?.();
      }
    };

    this.socket.on('error', () => {
      // Handled gracefully by close/fallback
    });
    this.socket.on('close', handleDisconnect);
    this.socket.on('end', handleDisconnect);
  }

  sendCommand(args, timeoutMs = 1500) {
    if (!this.connected || !this.socket) {
      return Promise.reject(new Error('Redis not connected'));
    }
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this.queue.findIndex((q) => q.timer === timer);
        if (idx !== -1) this.queue.splice(idx, 1);
        reject(new Error('Redis command timeout'));
      }, timeoutMs);
      timer.unref?.();

      this.queue.push({ resolve, reject, timer });
      try {
        this.socket.write(encodeRespCommand(args));
      } catch (err) {
        clearTimeout(timer);
        this.queue.pop();
        reject(err);
      }
    });
  }

  async get(key) {
    if (!this.connected) return null;
    try {
      const raw = await this.sendCommand(['GET', key]);
      if (raw === null || raw === undefined) return null;
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  async set(key, value, ttlMs = 30_000) {
    if (!this.connected) return false;
    try {
      const serialized = JSON.stringify(value);
      const px = Math.max(1000, Math.floor(Number(ttlMs) || 30_000));
      await this.sendCommand(['SET', key, serialized, 'PX', String(px)]);
      return true;
    } catch (_) {
      return false;
    }
  }

  async del(...keys) {
    if (!this.connected || keys.length === 0) return 0;
    try {
      return await this.sendCommand(['DEL', ...keys]);
    } catch (_) {
      return 0;
    }
  }

  async delByPrefix(prefix) {
    if (!this.connected) return 0;
    try {
      let cursor = '0';
      let deleted = 0;
      let loops = 0;
      do {
        const res = await this.sendCommand(['SCAN', cursor, 'MATCH', `${prefix}*`, 'COUNT', '200']);
        if (!Array.isArray(res) || res.length < 2) break;
        cursor = String(res[0]);
        const keys = Array.isArray(res[1]) ? res[1] : [];
        if (keys.length > 0) {
          deleted += await this.del(...keys);
        }
        loops += 1;
      } while (cursor !== '0' && loops < 25);
      return deleted;
    } catch (_) {
      return 0;
    }
  }

  async incrWithWindow(key, windowMs) {
    if (!this.connected) return null;
    try {
      const totalHits = await this.sendCommand(['INCR', key]);
      if (totalHits === 1) {
        await this.sendCommand(['PEXPIRE', key, String(windowMs)]);
      }
      const pttl = await this.sendCommand(['PTTL', key]);
      const ttlMs = typeof pttl === 'number' && pttl > 0 ? pttl : windowMs;
      return {
        totalHits: Number(totalHits) || 1,
        resetTime: new Date(Date.now() + ttlMs),
      };
    } catch (_) {
      return null;
    }
  }

  async decr(key) {
    if (!this.connected) return;
    try {
      await this.sendCommand(['DECR', key]);
    } catch (_) {}
  }

  async close() {
    this.closed = true;
    clearTimeout(this.reconnectTimer);
    if (this.socket) {
      try {
        this.socket.destroy();
      } catch (_) {}
      this.socket = null;
    }
    this.connected = false;
    this.connecting = false;
  }
}

const redisUrl = process.env.REDIS_URL || '';
const redisClient = new NativeRedisClient(redisUrl);
if (redisUrl && process.env.NODE_ENV !== 'test') {
  redisClient.connect();
}

const getRedisStateLabel = () => {
  if (redisClient.connected) return 'connected';
  if (redisClient.connecting) return 'connecting';
  return 'memory-fallback';
};

/**
 * Distributed Rate-Limit Store compatible with express-rate-limit v7/v8
 * Automatically uses Redis INCR+PEXPIRE when connected, with zero-latency fallback to local memory Map.
 */
class HybridRateLimitStore {
  constructor(prefix = 'rl:') {
    this.prefix = prefix;
    this.windowMs = 60_000;
    this.localHits = new Map();
    this.localUseOnly = false;
  }

  init(options) {
    if (options && typeof options.windowMs === 'number') {
      this.windowMs = options.windowMs;
    }
  }

  async increment(key) {
    const fullKey = `${this.prefix}${key}`;
    if (redisClient.connected) {
      const remote = await redisClient.incrWithWindow(fullKey, this.windowMs);
      if (remote) return remote;
    }

    const now = Date.now();
    const existing = this.localHits.get(fullKey);
    if (!existing || now >= existing.resetAt) {
      const entry = { count: 1, resetAt: now + this.windowMs };
      this.localHits.set(fullKey, entry);
      if (this.localHits.size > 50_000) {
        const firstKey = this.localHits.keys().next().value;
        if (firstKey) this.localHits.delete(firstKey);
      }
      return { totalHits: 1, resetTime: new Date(entry.resetAt) };
    }

    existing.count += 1;
    return { totalHits: existing.count, resetTime: new Date(existing.resetAt) };
  }

  async decrement(key) {
    const fullKey = `${this.prefix}${key}`;
    if (redisClient.connected) {
      await redisClient.decr(fullKey);
      return;
    }
    const existing = this.localHits.get(fullKey);
    if (existing && existing.count > 0) {
      existing.count -= 1;
    }
  }

  async resetKey(key) {
    const fullKey = `${this.prefix}${key}`;
    this.localHits.delete(fullKey);
    if (redisClient.connected) {
      await redisClient.del(fullKey);
    }
  }

  async resetAll() {
    this.localHits.clear();
  }
}

module.exports = {
  redisClient,
  NativeRedisClient,
  HybridRateLimitStore,
  encodeRespCommand,
  parseRespValue,
  getRedisStateLabel,
};
