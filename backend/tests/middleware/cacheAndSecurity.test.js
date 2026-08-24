const { TtlCache, generateETag, bustCatalog, catalogCache } = require('../../middleware/cache');
const { hashPassword, comparePassword } = require('../../utils/password');
const { clientIp } = require('../../middleware/auth');

describe('Phase 2: Network, Middleware & Security Layer Tests', () => {
  describe('TtlCache & ETag Utility', () => {
    let testCache;

    beforeEach(() => {
      testCache = new TtlCache(10, 1000);
    });

    it('should store, retrieve, and expire items based on TTL', async () => {
      testCache.set('key1', { status: 200, body: { message: 'hello' } }, 50);
      expect(testCache.get('key1')).not.toBeNull();
      expect(testCache.get('key1').body.message).toBe('hello');

      // Wait for expiration
      await new Promise((r) => setTimeout(r, 60));
      expect(testCache.get('key1')).toBeNull();
    });

    it('should perform LRU eviction when capacity is exceeded', () => {
      const smallCache = new TtlCache(2, 5000);
      smallCache.set('k1', { val: 1 });
      smallCache.set('k2', { val: 2 });
      smallCache.set('k3', { val: 3 }); // Evicts k1

      expect(smallCache.get('k1')).toBeNull();
      expect(smallCache.get('k2')).not.toBeNull();
      expect(smallCache.get('k3')).not.toBeNull();
    });

    it('should delete keys by namespace prefix', () => {
      testCache.set('products:/api/products', { val: 1 });
      testCache.set('products:/api/products/featured', { val: 2 });
      testCache.set('categories:/api/categories', { val: 3 });

      testCache.deleteByPrefix('products:');
      expect(testCache.get('products:/api/products')).toBeNull();
      expect(testCache.get('products:/api/products/featured')).toBeNull();
      expect(testCache.get('categories:/api/categories')).not.toBeNull();
    });

    it('should generate deterministic MD5 ETags', () => {
      const tag1 = generateETag({ a: 1, b: 2 });
      const tag2 = generateETag({ a: 1, b: 2 });
      const tag3 = generateETag({ a: 1, b: 3 });

      expect(tag1).toBe(tag2);
      expect(tag1).not.toBe(tag3);
      expect(tag1.startsWith('"')).toBe(true);
      expect(tag1.endsWith('"')).toBe(true);
    });
  });

  describe('Password Utility (password.js)', () => {
    it('should hash password and accurately compare valid and invalid passwords', async () => {
      const plaintext = 'SuperSecret123!';
      const hash = await hashPassword(plaintext, 10);

      expect(hash).not.toBe(plaintext);
      expect(hash.startsWith('$2')).toBe(true);

      const isValid = await comparePassword(plaintext, hash);
      expect(isValid).toBe(true);

      const isInvalid = await comparePassword('WrongPassword', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('Client IP Extraction & IPv6 /64 Aggregation', () => {
    it('should extract and normalize IPv4 addresses', () => {
      expect(clientIp({ ip: '192.168.1.1' })).toBe('192.168.1.1');
      expect(clientIp({ ip: '::ffff:10.0.0.1' })).toBe('10.0.0.1');
    });

    it('should aggregate IPv6 addresses into /64 subnets to mitigate botnet attacks', () => {
      const ipv6 = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
      const aggregated = clientIp({ ip: ipv6 });
      expect(aggregated).toBe('2001:0db8:85a3:0000::/64');

      // Same /64 subnet
      const ipv6Host2 = '2001:0db8:85a3:0000:1111:2222:3333:4444';
      expect(clientIp({ ip: ipv6Host2 })).toBe('2001:0db8:85a3:0000::/64');
    });
  });
});
