import { describe, it, expect } from "vitest";
import {
  sanitizeInput,
  validateUserInput,
} from "@/lib/security/input-sanitizer";

describe("XSS Injection Protection", () => {
  describe("Input Sanitization", () => {
    it("removes script tags from user input", () => {
      const maliciousInput = '<script>alert("xss")</script>Hello World';
      const sanitized = sanitizeInput(maliciousInput);

      expect(sanitized).not.toContain("<script>");
      expect(sanitized).not.toContain('alert("xss")');
      expect(sanitized).toContain("Hello World");
    });

    it("escapes HTML entities in dynamic content", () => {
      const maliciousInput = "<img src=x onerror=alert(1)>";
      const sanitized = sanitizeInput(maliciousInput);

      expect(sanitized).not.toContain("onerror=");
      expect(sanitized).toContain("&lt;img");
    });
  });

  describe("Input Validation", () => {
    it("validates email format to prevent injection", () => {
      const validEmails = ["user@example.com"];
      const invalidEmails = ["user@<script>alert(1)</script>.com"];

      validEmails.forEach((email) => {
        expect(validateUserInput(email, "email")).toBe(true);
      });

      invalidEmails.forEach((email) => {
        expect(validateUserInput(email, "email")).toBe(false);
      });
    });
  });
});
