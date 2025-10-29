import { describe, it, expect } from "vitest";
import { InputSanitizer, InputValidator } from "@/lib/security/input-sanitizer";

describe("Security Input Validation SSR", () => {
  describe("InputSanitizer", () => {
    it("deve sanitizar HTML malicioso", () => {
      const malicious = '<script>alert("xss")</script><p>Hello</p>';
      const sanitized = InputSanitizer.sanitizeHTML(malicious);
      expect(sanitized).not.toContain("<script>");
      expect(sanitized).toContain("<p>Hello</p>");
    });

    it("deve sanitizar texto (remover HTML completamente)", () => {
      const htmlText = "<b>Texto</b> com <i>tags</i>";
      const sanitized = InputSanitizer.sanitizeText(htmlText);
      expect(sanitized).toBe("Texto com tags");
    });

    it("deve sanitizar email", () => {
      const email = "user@example.com";
      const sanitized = InputSanitizer.sanitizeEmail(email);
      expect(sanitized).toBe(email);
    });
  });

  describe("InputValidator", () => {
    it("deve validar email válido", () => {
      expect(InputValidator.email("user@example.com")).toBe(null);
      expect(InputValidator.email("test.email+tag@domain.co.uk")).toBe(null);
    });

    it("deve rejeitar email inválido", () => {
      expect(InputValidator.email("invalid-email")).not.toBe(null);
      expect(InputValidator.email("user@")).not.toBe(null);
      expect(InputValidator.email("@example.com")).not.toBe(null);
      expect(InputValidator.email("")).not.toBe(null);
    });

    it("deve validar campo obrigatório", () => {
      expect(InputValidator.required("", "Nome")).not.toBe(null);
      expect(InputValidator.required("João", "Nome")).toBe(null);
    });

    it("deve validar tamanho de string", () => {
      expect(InputValidator.length("abc", 5, 10, "Campo")).not.toBe(null);
      expect(InputValidator.length("abcdefghij", 5, 10, "Campo")).toBe(null);
    });
  });
});
