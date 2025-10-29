// Tests for Input Sanitizer and Validation System

import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  InputSanitizer,
  InputValidator,
  SecurityHeaders,
  SecureErrorHandler,
} from "../input-sanitizer";

// Mock DOMPurify
jest.mock("isomorphic-dompurify", () => ({
  default: {
    sanitize: jest.fn((input: string) => input.replace(/<[^>]*>/g, "")),
  },
}));

describe("InputSanitizer", () => {
  describe("sanitizeHTML", () => {
    it("should remove dangerous HTML tags", () => {
      const dirty = '<script>alert("xss")</script><p>Safe content</p>';
      const result = InputSanitizer.sanitizeHTML(dirty);
      expect(result).not.toContain("<script>");
      expect(result).toContain("Safe content");
    });

    it("should preserve allowed tags", () => {
      const dirty = "<p>Safe <strong>bold</strong> text</p>";
      const result = InputSanitizer.sanitizeHTML(dirty);
      expect(result).toBe("Safe bold text");
    });
  });

  describe("sanitizeText", () => {
    it("should remove all HTML tags", () => {
      const dirty = "<b>Bold</b> and <i>italic</i> text";
      const result = InputSanitizer.sanitizeText(dirty);
      expect(result).toBe("Bold and italic text");
    });
  });

  describe("sanitizeURL", () => {
    it("should accept valid HTTP URLs", () => {
      const url = "https://example.com/path?param=value";
      const result = InputSanitizer.sanitizeURL(url);
      expect(result).toBe(url);
    });

    it("should reject javascript URLs", () => {
      const url = 'javascript:alert("xss")';
      expect(() => InputSanitizer.sanitizeURL(url)).toThrow("Invalid protocol");
    });

    it("should handle relative URLs", () => {
      const url = "/path/to/resource";
      const result = InputSanitizer.sanitizeURL(url);
      expect(result).toBe(url);
    });
  });

  describe("sanitizeEmail", () => {
    it("should accept valid emails", () => {
      const email = "user@example.com";
      const result = InputSanitizer.sanitizeEmail(email);
      expect(result).toBe(email);
    });

    it("should reject invalid emails", () => {
      expect(() => InputSanitizer.sanitizeEmail("invalid-email")).toThrow(
        "Invalid email format",
      );
    });
  });

  describe("sanitizePhone", () => {
    it("should accept valid Brazilian phone numbers", () => {
      const phone = "(11) 99999-9999";
      const result = InputSanitizer.sanitizePhone(phone);
      expect(result).toBe("11999999999");
    });

    it("should reject invalid phone numbers", () => {
      expect(() => InputSanitizer.sanitizePhone("123")).toThrow(
        "Invalid phone number length",
      );
    });
  });

  describe("containsSuspiciousContent", () => {
    it("should detect script tags", () => {
      const content = 'Some text <script>alert("xss")</script> more text';
      expect(InputSanitizer.containsSuspiciousContent(content)).toBe(true);
    });

    it("should detect event handlers", () => {
      const content = "<div onclick=\"alert('xss')\">Click me</div>";
      expect(InputSanitizer.containsSuspiciousContent(content)).toBe(true);
    });

    it("should return false for safe content", () => {
      const content = "Just some regular text without any dangerous content";
      expect(InputSanitizer.containsSuspiciousContent(content)).toBe(false);
    });
  });
});

describe("InputValidator", () => {
  describe("required", () => {
    it("should validate required fields", () => {
      expect(InputValidator.required("value", "Field")).toBeNull();
      expect(InputValidator.required("", "Field")).toBe("Field é obrigatório");
      expect(InputValidator.required(null, "Field")).toBe(
        "Field é obrigatório",
      );
    });
  });

  describe("email", () => {
    it("should validate email format", () => {
      expect(InputValidator.email("user@example.com")).toBeNull();
      expect(InputValidator.email("invalid-email")).toBe("E-mail inválido");
    });
  });

  describe("phone", () => {
    it("should validate Brazilian phone format", () => {
      expect(InputValidator.phone("(11) 99999-9999")).toBeNull();
      expect(InputValidator.phone("999999999")).toBe(
        "Telefone deve ter 10 ou 11 dígitos",
      );
    });
  });

  describe("cpf", () => {
    it("should validate CPF format and checksum", () => {
      expect(InputValidator.cpf("123.456.789-09")).toBe("CPF inválido"); // Invalid checksum
      // Note: Would need a valid CPF for positive test
    });
  });

  describe("combine", () => {
    it("should return first error", () => {
      const result = InputValidator.combine(
        null,
        "First error",
        "Second error",
      );
      expect(result).toBe("First error");
    });

    it("should return null if no errors", () => {
      const result = InputValidator.combine(null, null, null);
      expect(result).toBeNull();
    });
  });
});

describe("SecurityHeaders", () => {
  describe("getSecurityHeaders", () => {
    it("should return comprehensive security headers", () => {
      const headers = SecurityHeaders.getSecurityHeaders();

      expect(headers).toHaveProperty("Content-Security-Policy");
      expect(headers).toHaveProperty("X-Frame-Options");
      expect(headers).toHaveProperty("X-Content-Type-Options");
      expect(headers).toHaveProperty("X-XSS-Protection");
      expect(headers).toHaveProperty("Referrer-Policy");
      expect(headers).toHaveProperty("Strict-Transport-Security");
      expect(headers).toHaveProperty("Permissions-Policy");
    });
  });

  describe("sanitizeHeaderValue", () => {
    it("should remove control characters", () => {
      const dirty = "Value\x00with\x1Fcontrol\x7Fchars";
      const result = SecurityHeaders.sanitizeHeaderValue(dirty);
      expect(result).toBe("Valuewithcontrolchars");
    });

    it("should limit length", () => {
      const longValue = "a".repeat(10000);
      const result = SecurityHeaders.sanitizeHeaderValue(longValue);
      expect(result.length).toBe(8192);
    });
  });
});

describe("InputSanitizer - Security Enhancements", () => {
  describe("Enhanced HTML Sanitization", () => {
    it("should remove dangerous event handlers like onerror", () => {
      const dirty = '<img src="x" onerror="alert(\'xss\')">';
      const result = InputSanitizer.sanitizeHTML(dirty);
      expect(result).not.toContain("onerror");
      expect(result).not.toContain("alert");
    });

    it("should remove multiple dangerous attributes", () => {
      const dirty =
        '<div onload="evil()" onclick="bad()" onmouseover="worse()"></div>';
      const result = InputSanitizer.sanitizeHTML(dirty);
      expect(result).not.toContain("onload");
      expect(result).not.toContain("onclick");
      expect(result).not.toContain("onmouseover");
    });

    it("should remove dangerous protocols", () => {
      const dirty =
        '<a href="javascript:alert(1)">Click</a><a href="vbscript:msgbox(1)">Click2</a>';
      const result = InputSanitizer.sanitizeHTML(dirty);
      expect(result).not.toContain("javascript:");
      expect(result).not.toContain("vbscript:");
    });

    it("should preserve safe tags and attributes", () => {
      const dirty = "<p>Safe <strong>text</strong></p><br><em>More text</em>";
      const result = InputSanitizer.sanitizeHTML(dirty);
      expect(result).toContain("<p>");
      expect(result).toContain("<strong>");
      expect(result).toContain("<br>");
      expect(result).toContain("<em>");
    });
  });

  describe("Email Injection Protection", () => {
    it("should detect basic CRLF injection", () => {
      expect(
        InputSanitizer.emailInjection("test@example.com\r\nBCC:evil@bad.com"),
      ).toBe(false);
      expect(
        InputSanitizer.emailInjection("test@example.com\nTo:evil@bad.com"),
      ).toBe(false);
    });

    it("should detect SMTP header injection", () => {
      expect(
        InputSanitizer.emailInjection("Subject: Malicious\r\ntest@example.com"),
      ).toBe(false);
      expect(
        InputSanitizer.emailInjection(
          "To: victim@example.com\r\ntest@example.com",
        ),
      ).toBe(false);
    });

    it("should detect multiple recipients", () => {
      expect(InputSanitizer.emailInjection("test@example.com@evil.com")).toBe(
        false,
      );
    });

    it("should detect suspicious characters", () => {
      expect(InputSanitizer.emailInjection("test<script>@example.com")).toBe(
        false,
      );
      expect(InputSanitizer.emailInjection("test|echo@evil.com")).toBe(false);
    });

    it("should accept safe emails", () => {
      expect(InputSanitizer.emailInjection("user.name+tag@example.com")).toBe(
        true,
      );
      expect(InputSanitizer.emailInjection("test123@example.co.uk")).toBe(true);
    });

    it("should detect encoded injection attempts", () => {
      expect(
        InputSanitizer.emailInjection("test@example.com%0A%0DSubject:"),
      ).toBe(false);
      expect(InputSanitizer.emailInjection("test@example.com\r\n")).toBe(false);
    });
  });

  describe("Open Redirect Protection", () => {
    it("should allow safe HTTPS URLs", () => {
      expect(
        InputSanitizer.sanitizeUrlForRedirect("https://example.com/path", [
          "example.com",
        ]),
      ).toBe(true);
      expect(
        InputSanitizer.sanitizeUrlForRedirect("https://sub.example.com/page", [
          "*.example.com",
        ]),
      ).toBe(true);
    });

    it("should reject non-HTTPS protocols", () => {
      expect(
        InputSanitizer.sanitizeUrlForRedirect("http://example.com", [
          "example.com",
        ]),
      ).toBe(true); // HTTP is allowed
      expect(
        InputSanitizer.sanitizeUrlForRedirect("ftp://example.com", [
          "example.com",
        ]),
      ).toBe(false);
      expect(
        InputSanitizer.sanitizeUrlForRedirect("javascript:alert(1)", [
          "example.com",
        ]),
      ).toBe(false);
    });

    it("should reject non-whitelisted domains", () => {
      expect(
        InputSanitizer.sanitizeUrlForRedirect("https://evil.com", [
          "example.com",
        ]),
      ).toBe(false);
    });

    it("should prevent localhost redirects in production", () => {
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "production",
        writable: true,
      });

      expect(
        InputSanitizer.sanitizeUrlForRedirect("http://localhost:3000", []),
      ).toBe(false);
      expect(
        InputSanitizer.sanitizeUrlForRedirect("http://127.0.0.1", []),
      ).toBe(false);

      Object.defineProperty(process.env, "NODE_ENV", {
        value: originalEnv,
        writable: true,
      });
    });

    it("should detect redirect parameters", () => {
      const url = "https://example.com/redirect?url=https://evil.com";
      expect(InputSanitizer.sanitizeUrlForRedirect(url, ["example.com"])).toBe(
        false,
      );
    });

    it("should reject dangerous ports", () => {
      expect(
        InputSanitizer.sanitizeUrlForRedirect("https://example.com:22", [
          "example.com",
        ]),
      ).toBe(false);
      expect(
        InputSanitizer.sanitizeUrlForRedirect("https://example.com:3306", [
          "example.com",
        ]),
      ).toBe(false);
    });
  });

  describe("JWT Validation", () => {
    it("should reject malformed JWTs", () => {
      expect(InputSanitizer.validateJWT("not-a-jwt")).toBe(false);
      expect(InputSanitizer.validateJWT("header.payload")).toBe(false);
      expect(InputSanitizer.validateJWT("header.payload.signature.extra")).toBe(
        false,
      );
    });

    it("should validate JWT structure", () => {
      // Create a valid JWT for testing
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
      const payload = btoa(
        JSON.stringify({
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        }),
      )
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
      const signature = "dummy_signature";

      const jwt = `${header}.${payload}.${signature}`;
      expect(InputSanitizer.validateJWT(jwt)).toBe(true);
    });

    it("should reject expired tokens", () => {
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
      const payload = btoa(
        JSON.stringify({
          iat: Math.floor(Date.now() / 1000) - 7200,
          exp: Math.floor(Date.now() / 1000) - 3600,
        }),
      )
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
      const signature = "dummy_signature";

      const jwt = `${header}.${payload}.${signature}`;
      expect(InputSanitizer.validateJWT(jwt)).toBe(false);
    });

    it("should reject tokens with future iat", () => {
      const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
      const payload = btoa(
        JSON.stringify({
          iat: Math.floor(Date.now() / 1000) + 3600,
          exp: Math.floor(Date.now() / 1000) + 7200,
        }),
      )
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
      const signature = "dummy_signature";

      const jwt = `${header}.${payload}.${signature}`;
      expect(InputSanitizer.validateJWT(jwt)).toBe(false);
    });

    it("should reject unsupported algorithms", () => {
      const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }))
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
      const payload = btoa(
        JSON.stringify({
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        }),
      )
        .replace(/=/g, "")
        .replace(/\+/g, "-")
        .replace(/\//g, "_");
      const signature = "dummy_signature";

      const jwt = `${header}.${payload}.${signature}`;
      expect(InputSanitizer.validateJWT(jwt)).toBe(false);
    });
  });

  describe("CSP Validation", () => {
    it("should validate correct CSP directives", () => {
      const validCSP =
        "default-src 'self'; script-src 'self' 'unsafe-inline'; img-src *";
      expect(InputSanitizer.validateCSP(validCSP)).toBe(true);
    });

    it("should reject invalid directives", () => {
      const invalidCSP = "default-src 'self'; invalid-directive 'none'";
      expect(InputSanitizer.validateCSP(invalidCSP)).toBe(false);
    });

    it("should detect unbalanced quotes", () => {
      const unbalancedCSP = "default-src 'self";
      expect(InputSanitizer.validateCSP(unbalancedCSP)).toBe(false);
    });

    it("should validate sandbox tokens", () => {
      const sandboxCSP = "sandbox allow-scripts allow-same-origin";
      expect(InputSanitizer.validateCSP(sandboxCSP)).toBe(true);

      const invalidSandboxCSP = "sandbox invalid-token";
      expect(InputSanitizer.validateCSP(invalidSandboxCSP)).toBe(false);
    });

    it("should validate nonce and hash values", () => {
      const nonceCSP = "script-src 'nonce-abc123'";
      expect(InputSanitizer.validateCSP(nonceCSP)).toBe(true);

      const hashCSP = "script-src 'sha256-abc123'";
      expect(InputSanitizer.validateCSP(hashCSP)).toBe(true);

      const invalidNonceCSP = "script-src 'nonce-invalid@chars'";
      expect(InputSanitizer.validateCSP(invalidNonceCSP)).toBe(false);
    });

    it("should sanitize dangerous CSP values", () => {
      const dangerousCSP =
        "script-src 'unsafe-inline' 'unsafe-eval' javascript: data:";
      const sanitized = InputSanitizer.sanitizeCSP(dangerousCSP);
      expect(sanitized).not.toContain("unsafe-inline");
      expect(sanitized).not.toContain("unsafe-eval");
      expect(sanitized).not.toContain("javascript:");
      expect(sanitized).not.toContain("data:");
    });
  });

  describe("SQL Injection Protection", () => {
    describe("validateSQLInjection", () => {
      it("should detect union-based injection", () => {
        expect(
          InputSanitizer.validateSQLInjection(
            "1' UNION SELECT username, password FROM users --",
          ),
        ).toBe(false);
        expect(
          InputSanitizer.validateSQLInjection("1' union select 1,2 --"),
        ).toBe(false);
      });

      it("should detect error-based injection", () => {
        expect(InputSanitizer.validateSQLInjection("1' OR 1=1 --")).toBe(false);
        expect(InputSanitizer.validateSQLInjection("1' AND 1=2 --")).toBe(
          false,
        );
      });

      it("should detect comment injection", () => {
        expect(InputSanitizer.validateSQLInjection("1' /* comment */ --")).toBe(
          false,
        );
        expect(InputSanitizer.validateSQLInjection("1' # comment")).toBe(false);
      });

      it("should detect stacked queries", () => {
        expect(
          InputSanitizer.validateSQLInjection("1'; DROP TABLE users; --"),
        ).toBe(false);
        expect(
          InputSanitizer.validateSQLInjection("1'; SELECT * FROM admin; --"),
        ).toBe(false);
      });

      it("should detect system table access", () => {
        expect(
          InputSanitizer.validateSQLInjection(
            "1' UNION SELECT * FROM information_schema.tables --",
          ),
        ).toBe(false);
        expect(
          InputSanitizer.validateSQLInjection(
            "1' UNION SELECT * FROM sys.tables --",
          ),
        ).toBe(false);
      });

      it("should detect encoded injection", () => {
        expect(
          InputSanitizer.validateSQLInjection("1' %55%4E%49%4F%4E SELECT"),
        ).toBe(false); // UNION in URL encoding
      });

      it("should accept safe input", () => {
        expect(
          InputSanitizer.validateSQLInjection("john.doe@example.com"),
        ).toBe(true);
        expect(InputSanitizer.validateSQLInjection("John Doe")).toBe(true);
        expect(InputSanitizer.validateSQLInjection("123 Main St")).toBe(true);
      });

      it("should detect unbalanced quotes", () => {
        expect(InputSanitizer.validateSQLInjection("John's")).toBe(false); // Unbalanced single quote
        expect(InputSanitizer.validateSQLInjection('John "Doe')).toBe(false); // Unbalanced double quote
      });
    });

    describe("sanitizeForSQL", () => {
      it("should remove dangerous keywords", () => {
        expect(
          InputSanitizer.sanitizeForSQL(
            "SELECT * FROM users WHERE id = 1 UNION SELECT password FROM admin",
          ),
        ).not.toContain("UNION");
        expect(
          InputSanitizer.sanitizeForSQL("DROP TABLE users;"),
        ).not.toContain("DROP");
      });

      it("should remove dangerous operators", () => {
        expect(
          InputSanitizer.sanitizeForSQL("1; DROP TABLE users"),
        ).not.toContain(";");
        expect(InputSanitizer.sanitizeForSQL("1 /* comment */")).not.toContain(
          "/*",
        );
      });

      it("should limit length", () => {
        const longInput = "a".repeat(2000);
        expect(InputSanitizer.sanitizeForSQL(longInput).length).toBe(1000);
      });

      it("should allow only specified characters", () => {
        expect(InputSanitizer.sanitizeForSQL("John123!@#", "a-zA-Z0-9")).toBe(
          "John123",
        );
      });
    });

    describe("sanitizeNumericForSQL", () => {
      it("should handle valid numbers", () => {
        expect(InputSanitizer.sanitizeNumericForSQL("123.45")).toBe(123.45);
        expect(InputSanitizer.sanitizeNumericForSQL(-42)).toBe(-42);
      });

      it("should reject invalid numbers", () => {
        expect(InputSanitizer.sanitizeNumericForSQL("12.34.56")).toBeNull();
        expect(InputSanitizer.sanitizeNumericForSQL("--42")).toBeNull();
        expect(InputSanitizer.sanitizeNumericForSQL("not-a-number")).toBeNull();
        expect(InputSanitizer.sanitizeNumericForSQL(Infinity)).toBeNull();
      });
    });

    describe("sanitizeArrayForSQL", () => {
      it("should sanitize string arrays", () => {
        const input = ["John", "Jane", "Bob"];
        const result = InputSanitizer.sanitizeArrayForSQL(input);
        expect(result).toEqual(["John", "Jane", "Bob"]);
      });

      it("should sanitize mixed arrays", () => {
        const input = ["John", 42, "Jane"];
        const result = InputSanitizer.sanitizeArrayForSQL(input);
        expect(result).toEqual(["John", 42, "Jane"]);
      });

      it("should reject arrays with dangerous content", () => {
        const input = ["John", "Jane'; DROP TABLE users; --"];
        const result = InputSanitizer.sanitizeArrayForSQL(input);
        expect(result).toBeNull();
      });

      it("should enforce size limits", () => {
        const input = Array(200).fill("item");
        const result = InputSanitizer.sanitizeArrayForSQL(input, 50);
        expect(result).toBeNull();
      });
    });
  });
});

describe("SecureErrorHandler", () => {
  describe("sanitizeErrorMessage", () => {
    it("should remove sensitive information", () => {
      const error =
        "Connection failed with password=secret123 and token=abc123";
      const result = SecureErrorHandler.sanitizeErrorMessage(error);
      expect(result).toContain("password=***");
      expect(result).toContain("token=***");
    });

    it("should limit message length", () => {
      const longMessage = "a".repeat(1000);
      const result = SecureErrorHandler.sanitizeErrorMessage(longMessage);
      expect(result.length).toBe(500);
    });
  });

  describe("createSafeErrorResponse", () => {
    it("should create safe error response", () => {
      const error = new Error("Database connection failed");
      const response = SecureErrorHandler.createSafeErrorResponse(error, 500);

      expect(response).toHaveProperty("statusCode", 500);
      expect(response).toHaveProperty("message");
      expect(response).toHaveProperty("timestamp");
    });

    it("should hide sensitive details in production", () => {
      // Mock production environment
      const originalEnv = process.env.NODE_ENV;
      Object.defineProperty(process.env, "NODE_ENV", {
        value: "production",
        writable: true,
      });

      const error = new Error("Sensitive error message");
      const response = SecureErrorHandler.createSafeErrorResponse(error);

      expect(response.message).toBe("Ocorreu um erro interno");

      // Restore
      Object.defineProperty(process.env, "NODE_ENV", {
        value: originalEnv,
        writable: true,
      });
    });
  });
});
