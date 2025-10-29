// Unit Tests for Email Value Object - Fase 2 Implementation
// Tests email validation and invariants

import { describe, it, expect } from "vitest";
import { Email } from "../../../../../modules/lead-generation/domain/value-objects/Email";

describe("Email Value Object", () => {
  describe("Email Creation", () => {
    it("should create valid corporate email addresses", () => {
      const validEmails = [
        "user@empresa.com.br",
        "test.email@domain.co.uk",
        "user+tag@empresa.com",
        "123@domain.org",
      ];

      validEmails.forEach((email) => {
        const result = Email.create(email);
        expect(result).toBeInstanceOf(Email);
        expect(result.getValue()).toBe(email.toLowerCase());
      });
    });

    it("should reject invalid email addresses", () => {
      const invalidEmails = [
        "",
        "invalid",
        "user@",
        "@domain.com",
        "user@domain",
        "user@@domain.com",
      ];

      invalidEmails.forEach((email) => {
        expect(() => Email.create(email)).toThrow();
      });
    });

    it("should reject personal email addresses", () => {
      const personalEmails = [
        "user@gmail.com",
        "user@yahoo.com",
        "user@hotmail.com",
      ];

      personalEmails.forEach((email) => {
        expect(() => Email.create(email)).toThrow(
          "Please use a business email",
        );
      });
    });

    it("should normalize email addresses to lowercase", () => {
      const email = Email.create("USER@EMPRESA.COM.BR");
      expect(email.getValue()).toBe("user@empresa.com.br");
    });
  });

  describe("Email Business Rules", () => {
    it("should provide domain extraction", () => {
      const email = Email.create("user@empresa.com.br");
      expect(email.getDomain()).toBe("empresa.com.br");
    });

    it("should identify corporate emails", () => {
      const corporateEmail = Email.create("user@empresa.com.br");
      expect(corporateEmail.isCorporate()).toBe(true);

      expect(() => Email.create("user@gmail.com")).toThrow();
    });
  });
});
