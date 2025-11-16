// Mock dependencies before imports
jest.mock('@/lib/redis', () => ({
  incrementCounter: jest.fn(),
}));

jest.mock('@/lib/audit', () => ({
  createAuditLog: jest.fn(),
  AuditAction: {},
  AuditEntity: {},
}));

jest.mock('@/lib/audit-helpers', () => ({
  getClientInfo: jest.fn(),
}));

jest.mock('next/headers', () => ({
  headers: jest.fn(),
}));

import {
  detectSQLInjection,
  detectXSS,
  sanitizeInput,
  validateFormData,
  generateSecureToken,
} from '@/lib/security';

describe('Security Library', () => {
  describe('detectSQLInjection', () => {
    it('should detect common SQL injection patterns', () => {
      expect(detectSQLInjection("SELECT * FROM users")).toBe(true);
      expect(detectSQLInjection("admin' OR '1'='1")).toBe(true);
      expect(detectSQLInjection("1; DROP TABLE users--")).toBe(true);
      expect(detectSQLInjection("UNION ALL SELECT NULL")).toBe(true);
      expect(detectSQLInjection("admin' AND 1=1--")).toBe(true);
    });

    it('should not flag safe input', () => {
      expect(detectSQLInjection("John Doe")).toBe(false);
      expect(detectSQLInjection("user@example.com")).toBe(false);
      expect(detectSQLInjection("Hello World 123")).toBe(false);
      expect(detectSQLInjection("Привет мир")).toBe(false);
    });

    it('should detect various SQL keywords', () => {
      expect(detectSQLInjection("INSERT INTO users")).toBe(true);
      expect(detectSQLInjection("UPDATE users SET")).toBe(true);
      expect(detectSQLInjection("DELETE FROM users")).toBe(true);
      expect(detectSQLInjection("DROP DATABASE")).toBe(true);
      expect(detectSQLInjection("CREATE TABLE")).toBe(true);
      expect(detectSQLInjection("ALTER TABLE")).toBe(true);
      expect(detectSQLInjection("EXEC sp_")).toBe(true);
    });

    it('should detect SQL comment patterns', () => {
      expect(detectSQLInjection("admin'--")).toBe(true);
      expect(detectSQLInjection("data/*comment*/")).toBe(true);
    });
  });

  describe('detectXSS', () => {
    it('should detect script tags', () => {
      expect(detectXSS("<script>alert('XSS')</script>")).toBe(true);
      expect(detectXSS("<SCRIPT>alert('XSS')</SCRIPT>")).toBe(true);
      expect(detectXSS("<script src='evil.js'></script>")).toBe(true);
    });

    it('should detect javascript: protocol', () => {
      expect(detectXSS("javascript:alert('XSS')")).toBe(true);
      expect(detectXSS("JAVASCRIPT:alert('XSS')")).toBe(true);
    });

    it('should detect event handlers', () => {
      expect(detectXSS("<img onclick='alert(1)'>")).toBe(true);
      expect(detectXSS("<div onload='evil()'>")).toBe(true);
      expect(detectXSS("<body onmouseover='xss()'>")).toBe(true);
    });

    it('should detect dangerous tags', () => {
      expect(detectXSS("<iframe src='evil.com'>")).toBe(true);
      expect(detectXSS("<object data='evil.swf'>")).toBe(true);
      expect(detectXSS("<embed src='evil.swf'>")).toBe(true);
    });

    it('should not flag safe HTML', () => {
      expect(detectXSS("Hello <b>World</b>")).toBe(false);
      expect(detectXSS("<div>Safe content</div>")).toBe(false);
      expect(detectXSS("<p>Just text</p>")).toBe(false);
    });

    it('should not flag plain text', () => {
      expect(detectXSS("John Doe")).toBe(false);
      expect(detectXSS("user@example.com")).toBe(false);
      expect(detectXSS("Normal text without HTML")).toBe(false);
    });
  });

  describe('sanitizeInput', () => {
    it('should escape HTML special characters', () => {
      expect(sanitizeInput("<script>")).toBe("&lt;script&gt;");
      expect(sanitizeInput("Hello <b>World</b>")).toBe("Hello &lt;b&gt;World&lt;&#x2F;b&gt;");
    });

    it('should escape quotes', () => {
      expect(sanitizeInput("It's a test")).toBe("It&#x27;s a test");
      expect(sanitizeInput('Say "Hello"')).toBe("Say &quot;Hello&quot;");
    });

    it('should handle mixed content', () => {
      const input = '<script>alert("XSS")</script>';
      const expected = '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;';
      expect(sanitizeInput(input)).toBe(expected);
    });

    it('should not modify safe text', () => {
      expect(sanitizeInput("Hello World")).toBe("Hello World");
      expect(sanitizeInput("123456")).toBe("123456");
      expect(sanitizeInput("user@example.com")).toBe("user@example.com");
    });

    it('should handle empty strings', () => {
      expect(sanitizeInput("")).toBe("");
    });
  });

  describe('validateFormData', () => {
    it('should validate and sanitize safe data', () => {
      const data = {
        name: "John Doe",
        email: "john@example.com",
        age: 30,
      };

      const result = validateFormData(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitized.name).toBe("John Doe");
      expect(result.sanitized.age).toBe(30);
    });

    it('should detect SQL injection in form data', () => {
      const data = {
        username: "admin",
        password: "password' OR '1'='1",
      };

      const result = validateFormData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('SQL injection');
    });

    it('should detect XSS in form data', () => {
      const data = {
        comment: "<script>alert('XSS')</script>",
      };

      const result = validateFormData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('XSS');
    });

    it('should sanitize all string fields', () => {
      const data = {
        field1: "<b>Bold</b>",
        field2: "It's a test",
        field3: 123,
      };

      const result = validateFormData(data);

      expect(result.sanitized.field1).toBe("&lt;b&gt;Bold&lt;&#x2F;b&gt;");
      expect(result.sanitized.field2).toBe("It&#x27;s a test");
      expect(result.sanitized.field3).toBe(123);
    });

    it('should preserve non-string values', () => {
      const data = {
        name: "John",
        age: 30,
        active: true,
        data: { nested: "value" },
      };

      const result = validateFormData(data);

      expect(result.sanitized.age).toBe(30);
      expect(result.sanitized.active).toBe(true);
      expect(result.sanitized.data).toEqual({ nested: "value" });
    });

    it('should handle multiple validation errors', () => {
      const data = {
        field1: "SELECT * FROM users",
        field2: "<script>alert('XSS')</script>",
      };

      const result = validateFormData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle empty objects', () => {
      const result = validateFormData({});

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.sanitized).toEqual({});
    });
  });

  describe('generateSecureToken', () => {
    it('should generate token of specified length', () => {
      const token = generateSecureToken(32);
      expect(token).toHaveLength(32);
    });

    it('should generate different tokens each time', () => {
      const token1 = generateSecureToken(32);
      const token2 = generateSecureToken(32);

      expect(token1).not.toBe(token2);
    });

    it('should only contain alphanumeric characters', () => {
      const token = generateSecureToken(100);
      expect(token).toMatch(/^[A-Za-z0-9]+$/);
    });

    it('should generate token with default length', () => {
      const token = generateSecureToken();
      expect(token).toHaveLength(32);
    });

    it('should handle different lengths', () => {
      expect(generateSecureToken(16)).toHaveLength(16);
      expect(generateSecureToken(64)).toHaveLength(64);
      expect(generateSecureToken(128)).toHaveLength(128);
    });

    it('should generate cryptographically random tokens', () => {
      const tokens = new Set();
      for (let i = 0; i < 1000; i++) {
        tokens.add(generateSecureToken(32));
      }
      // All tokens should be unique
      expect(tokens.size).toBe(1000);
    });
  });
});
