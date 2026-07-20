const { escapeRegex, parsePagination, buildPaginationMeta } = require('../../utils/helpers');

describe('Helpers Utility Tests', () => {
  describe('escapeRegex', () => {
    it('should escape regex special characters', () => {
      const input = '.*+?^${}()|[]\\';
      const expected = '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\';
      expect(escapeRegex(input)).toBe(expected);
    });

    it('should return the same string if no special characters', () => {
      expect(escapeRegex('hello')).toBe('hello');
    });
  });

  describe('parsePagination', () => {
    it('should parse valid pagination query', () => {
      const result = parsePagination({ page: '2', limit: '10' });
      expect(result).toEqual({ page: 2, limit: 10, skip: 10 });
    });

    it('should use default values for missing or invalid query', () => {
      const result = parsePagination({});
      expect(result).toEqual({ page: 1, limit: 20, skip: 0 }); // Assuming defaultLimit = 20

      const invalidResult = parsePagination({ page: 'abc', limit: '-5' });
      expect(invalidResult).toEqual({ page: 1, limit: 1, skip: 0 }); // Math.max(1, limit) limits to 1
    });

    it('should cap limit to 100', () => {
      const result = parsePagination({ limit: '150' });
      expect(result.limit).toBe(100);
    });
  });

  describe('buildPaginationMeta', () => {
    it('should build correct pagination metadata', () => {
      const result = buildPaginationMeta({ page: 2, limit: 10, total: 25 });
      expect(result).toEqual({
        current: 2,
        pages: 3,
        total: 25,
        limit: 10
      });
    });
  });
});
